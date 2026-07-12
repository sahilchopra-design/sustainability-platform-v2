"""
Single source of truth for computing a user's effective RBAC state.

Historically this logic lived only inline inside GET /api/auth/me
(api/auth_pg.py). The auth middleware needs the exact same computation to
enforce module-level permissions server-side, so it is extracted here and
imported by BOTH call sites. Do not re-implement this elsewhere — any new
consumer should call `get_effective_rbac()`.

Semantics (must stay in sync with the rbac_* tables — see db/models/rbac.py):
  - No `rbac_user_profiles` row at all  -> unrestricted (allowed_module_paths=None).
    This is intentional: legacy / pre-RBAC-rollout users must not be locked out.
  - rbac_role == 'super_admin'          -> unrestricted (allowed_module_paths=None).
  - Otherwise                           -> allowed_module_paths = sorted(
        (preset.module_paths ∪ active grants) - active denies
    ), further filtered by the role's minimum module-maturity tier.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import text as sa_text
from sqlalchemy.orm import Session

from db.models.rbac import RbacModuleAccessPG, RbacRolePresetPG, RbacUserProfilePG

# Module Maturity -> Role Access Tier (kept identical to the previous inline
# copy in auth_pg.py so behaviour does not change).
ROLE_MIN_TIER = {
    "super_admin": 0,
    "team_member": 1,
    "partner": 2,
    "demo": 2,
    "viewer": 3,
}


class EffectiveRbac:
    """Plain data holder — mirrors the RBAC fields returned by GET /api/auth/me."""

    __slots__ = (
        "rbac_role",
        "is_read_only",
        "display_org",
        "access_expires_at",
        "days_remaining",
        "allowed_module_paths",  # None => unrestricted (all modules allowed)
    )

    def __init__(self):
        self.rbac_role = None
        self.is_read_only = False
        self.display_org = None
        self.access_expires_at = None
        self.days_remaining = None
        self.allowed_module_paths: Optional[list] = None


def get_effective_rbac(db: Session, user) -> EffectiveRbac:
    """Compute the effective RBAC state for `user` (a UserPG row)."""
    result = EffectiveRbac()
    try:
        profile = db.query(RbacUserProfilePG).filter(
            RbacUserProfilePG.user_id == user.user_id
        ).first()

        if not profile:
            return result  # no profile -> unrestricted

        result.rbac_role = profile.rbac_role
        result.is_read_only = profile.is_read_only or False
        result.display_org = profile.display_org
        result.access_expires_at = profile.access_expires_at

        if profile.access_expires_at:
            exp = profile.access_expires_at
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            delta = exp - datetime.now(timezone.utc)
            result.days_remaining = max(0, delta.days)

        if profile.rbac_role == "super_admin":
            result.allowed_module_paths = None
            return result

        # Build effective path list: preset + grants - denies
        base_paths: list = []
        if profile.preset_id:
            preset = db.get(RbacRolePresetPG, profile.preset_id)
            if preset and preset.module_paths:
                base_paths = list(preset.module_paths)

        overrides = db.query(RbacModuleAccessPG).filter(
            RbacModuleAccessPG.user_id == user.user_id
        ).all()
        now = datetime.now(timezone.utc)
        grants = {
            o.module_path for o in overrides
            if o.access_type == "grant" and (o.expires_at is None or o.expires_at > now)
        }
        denies = {
            o.module_path for o in overrides
            if o.access_type == "deny" and (o.expires_at is None or o.expires_at > now)
        }
        allowed_module_paths = sorted((set(base_paths) | grants) - denies)

        # Maturity-tier filter — modules below the role's minimum tier are
        # excluded even if nominally granted by the preset.
        min_tier = ROLE_MIN_TIER.get(profile.rbac_role, 3)
        if min_tier > 0 and allowed_module_paths:
            try:
                rows = db.execute(
                    sa_text("SELECT module_path, review_tier FROM module_review_status")
                ).fetchall()
                status_map = {r[0]: r[1] for r in rows}
                allowed_module_paths = sorted(
                    p for p in allowed_module_paths
                    if status_map.get(p, 0) >= min_tier
                )
            except Exception:
                pass  # table may not exist yet — degrade gracefully

        result.allowed_module_paths = allowed_module_paths
    except Exception:
        pass  # RBAC tables may not be migrated yet — degrade to unrestricted
    return result


_EFF_RBAC_CACHE: dict = {}
_EFF_RBAC_CACHE_TTL_SECONDS = 10


def get_effective_rbac_cached(db: Session, user) -> EffectiveRbac:
    """
    Same computation as get_effective_rbac(), but memoized per user_id for a
    short TTL. The auth middleware calls this on every single gated request
    (unlike GET /api/auth/me, which is called once on page load / manual
    refresh), so an uncached version would add several DB round trips to
    every API call. A 10s staleness window means a just-revoked module can
    remain accessible for a few seconds after an admin change — an accepted
    trade-off; call get_effective_rbac() directly wherever "always fresh" is
    required (e.g. the /me endpoint, and admin RBAC-management screens).
    """
    now = time.monotonic()
    entry = _EFF_RBAC_CACHE.get(user.user_id)
    if entry and (now - entry[1]) < _EFF_RBAC_CACHE_TTL_SECONDS:
        return entry[0]

    eff = get_effective_rbac(db, user)
    _EFF_RBAC_CACHE[user.user_id] = (eff, now)
    return eff


_UNIVERSE_CACHE: dict = {"paths": set(), "at": 0.0}
_UNIVERSE_CACHE_TTL_SECONDS = 30  # this call runs on every gated request — cache it


def known_module_path_universe(db: Session) -> set:
    """
    Every module_path the RBAC system has ever been configured to know about
    (declared in a preset, granted/denied individually, or tracked in the
    module review workflow). Used by the auth middleware as a conservative
    allow-list of which backend request paths are even eligible for per-module
    enforcement — a request whose derived module path never appears here is
    left ungated (treated as shared/infrastructure, not a distinct module).

    Cached in-process for a short TTL: this is queried on every gated
    request, and the set of *known* module paths changes only when an admin
    edits a preset/review-status row, so brief staleness is an acceptable
    trade for not tripling the query count on the hot path. Worst case a
    just-added module isn't gated for up to _UNIVERSE_CACHE_TTL_SECONDS —
    fail-open staleness, never fail-closed.
    """
    now = time.monotonic()
    if now - _UNIVERSE_CACHE["at"] < _UNIVERSE_CACHE_TTL_SECONDS:
        return _UNIVERSE_CACHE["paths"]

    paths: set = set()
    try:
        rows = db.execute(sa_text("SELECT module_path FROM module_review_status")).fetchall()
        paths.update(r[0] for r in rows if r[0])
    except Exception:
        pass
    try:
        rows = db.execute(sa_text("SELECT module_paths FROM rbac_role_presets")).fetchall()
        for r in rows:
            for p in (r[0] or []):
                paths.add(p)
    except Exception:
        pass
    try:
        rows = db.execute(sa_text("SELECT DISTINCT module_path FROM rbac_module_access")).fetchall()
        paths.update(r[0] for r in rows if r[0])
    except Exception:
        pass

    _UNIVERSE_CACHE["paths"] = paths
    _UNIVERSE_CACHE["at"] = now
    return paths
