"""
FastAPI Auth Middleware — enforces (a) session-based authentication on all
mutating API requests, and (b) per-module RBAC access on requests that carry
a resolvable session, regardless of HTTP method.

Environment control:
  REQUIRE_AUTH=true   — require a valid session for mutating requests (prod)
  REQUIRE_AUTH=false  — bypass the *session-required* gate (default; dev/demo)

  NOTE: the module-level RBAC check below is independent of REQUIRE_AUTH. It
  only ever runs when a request carries a token that resolves to a real user,
  so it never blocks a genuinely anonymous request — but when a restricted
  user's own session cookie/token IS present, their module permissions are
  enforced even while REQUIRE_AUTH=false and even on GET requests. This closes
  the gap where module RBAC was previously a client-side-only nav filter.

Skip list (never gated, any method, with or without a session):
  - Non-API paths (no /api/ prefix)
  - Health check: /api/health
  - Auth routes: /api/auth/* (login/register/logout/me/invite)
  - The shared public reference-data layer: /api/v1/refdata/*
  - Per-module public reference sub-resources: /api/v1/<module>/ref/*
  - /docs, /redoc, /openapi.json

For every other /api/* request that resolves to an authenticated user:
  1. Extract + validate the session token (cookie or Bearer header).
  2. Compute the user's effective RBAC state via api.rbac_utils.get_effective_rbac
     (the SAME function GET /api/auth/me uses — one source of truth).
  3. If unrestricted (super_admin, or no rbac_user_profiles row at all —
     legacy/pre-RBAC users), no module gate is applied.
  4. Otherwise, resolve the request path to a frontend module_path via
     middleware.module_access_map.resolve_module_paths(). If the path maps to
     a known module and none of its module_path aliases are in the user's
     allowed set, return 403. If the path can't be confidently attributed to
     a specific module (most of the ~800 modules are pure client-side compute
     with no backend calls at all, or it's a shared/utility endpoint), the
     request is left ungated rather than guessed at.

Then, for mutating verbs (POST/PUT/PATCH/DELETE) when REQUIRE_AUTH=true, a
valid session is still required exactly as before.

Org isolation (multi-tenant):
  When a valid user is resolved and the user has an org_id set, the
  request.state.org_id value is populated so downstream query helpers
  can filter by organisation.  Endpoints that call _org_filter(request)
  automatically scope DB queries to the authenticated user's org.

Usage in server.py:
    from middleware.auth_middleware import AuthMiddleware
    app.add_middleware(AuthMiddleware)
"""

from __future__ import annotations

import logging
import os
import re
from datetime import datetime, timezone

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

# ── Env gate — set REQUIRE_AUTH=true in production ───────────────────────────
REQUIRE_AUTH: bool = os.environ.get("REQUIRE_AUTH", "false").lower() in (
    "true", "1", "yes"
)

# ── Paths that never require auth ────────────────────────────────────────────
_PUBLIC_PATH_PREFIXES: tuple[str, ...] = (
    "/api/health",
    "/api/auth/",
    "/api/auth",       # exact match (login / register live here)
    "/api/auth/invite/",  # invite token validation + acceptance (public)
    "/api/v1/refdata",    # shared public reference-data layer (Tier-1 free datasets)
    "/docs",
    "/redoc",
    "/openapi.json",
)

# Methods that are always allowed without auth (read-only)
_SAFE_METHODS: frozenset[str] = frozenset({"GET", "HEAD", "OPTIONS"})

# Compiled pattern: /api/v1/<module>/ref/<anything> — per-module public reference data
_REF_DATA_PATTERN = re.compile(r"^/api/v1/.+/ref(/.*)?$")


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Starlette middleware that enforces bearer-token / cookie session auth
    on all mutating /api/* requests, and per-module RBAC on any request that
    resolves to an authenticated, RBAC-restricted user.
    """

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method.upper()

        # ── 1. Skip non-API paths entirely ───────────────────────────────
        if not path.startswith("/api/"):
            return await call_next(request)

        # ── 2. Skip explicitly public paths ──────────────────────────────
        if any(path.startswith(p) for p in _PUBLIC_PATH_PREFIXES):
            return await call_next(request)

        # ── 3. Skip per-module public reference sub-resources ────────────
        if _REF_DATA_PATTERN.match(path):
            return await call_next(request)

        # ── 4. Resolve the session (if any) — regardless of method. This is
        #      what lets module RBAC apply to GET requests, which previously
        #      bypassed auth entirely. An absent/invalid token resolves to
        #      user=None and behaves exactly as before for anonymous callers.
        token = _extract_token(request)
        user = _validate_session(token) if token else None

        request.state.user = user
        request.state.org_id = getattr(user, "org_id", None) if user else None

        # ── 5. Per-module RBAC enforcement ────────────────────────────────
        if user is not None:
            denial = _check_module_access(user, path)
            if denial is not None:
                return denial

        # ── 6. Safe (read-only) methods are always allowed ────────────────
        if method in _SAFE_METHODS:
            return await call_next(request)

        # ── 7. Auth gate — bypass in dev/demo mode ────────────────────────
        if not REQUIRE_AUTH:
            return await call_next(request)

        # ── 8. Mutating request on /api/* → require valid session ────────
        if user is None:
            return _unauthorized("Missing or invalid authentication token")

        return await call_next(request)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _extract_token(request: Request) -> str | None:
    """Pull bearer token from Authorization header or session_token cookie."""
    # Try cookie first (browser sessions)
    token = request.cookies.get("session_token")
    if token:
        return token
    # Fall back to Authorization header (API clients)
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


def _validate_session(token: str):
    """
    Look up the token in user_sessions_pg and return the UserPG row,
    or None if invalid / expired.

    Uses a short-lived DB session (not the request-scoped one from Depends)
    because middleware runs before the DI container.
    """
    from db.postgres import SessionLocal
    from db.models.portfolio_pg import UserPG, UserSessionPG

    db = SessionLocal()
    try:
        sess = (
            db.query(UserSessionPG)
            .filter(UserSessionPG.session_token == token)
            .first()
        )
        if not sess:
            return None

        # Handle naive datetimes stored without tzinfo
        expires = sess.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            return None

        user = db.get(UserPG, sess.user_id)
        if user and not getattr(user, "is_active", True):
            return None  # deactivated account
        return user
    except Exception:
        logger.exception("Auth middleware: session validation error")
        return None
    finally:
        db.close()


def _check_module_access(user, path: str) -> JSONResponse | None:
    """
    Return a 403 JSONResponse if `user` is RBAC-restricted and `path` maps to
    a module they are not entitled to. Returns None (allow) when the user is
    unrestricted, or when `path` can't be confidently attributed to a
    specific module (see middleware/module_access_map.py for why that's the
    safe default rather than a guess).
    """
    from db.postgres import SessionLocal
    from api.rbac_utils import get_effective_rbac_cached, known_module_path_universe
    from middleware.module_access_map import resolve_module_paths

    db = SessionLocal()
    try:
        eff = get_effective_rbac_cached(db, user)
        if eff.allowed_module_paths is None:
            return None  # unrestricted (super_admin or no RBAC profile)

        candidates = resolve_module_paths(path, known_module_path_universe(db))
        if not candidates:
            return None  # not attributable to a specific gated module

        allowed = set(eff.allowed_module_paths)
        if any(c in allowed for c in candidates):
            return None

        return _forbidden(
            f"Access denied — your account is not entitled to module {candidates[0]!r}"
        )
    except Exception:
        logger.exception("Auth middleware: module-access check error")
        return None  # degrade gracefully — never hard-fail the request on our own bug
    finally:
        db.close()


def _unauthorized(detail: str) -> JSONResponse:
    """Return a 401 JSON error response."""
    return JSONResponse(
        status_code=401,
        content={"detail": detail},
    )


def _forbidden(detail: str) -> JSONResponse:
    """Return a 403 JSON error response (authenticated, but not entitled)."""
    return JSONResponse(
        status_code=403,
        content={"detail": detail},
    )


# ── P0-2: Multi-tenant org isolation helpers ─────────────────────────────────

def get_request_org_id(request: Request):
    """
    Return the org_id for the current request, or None if unauthenticated / no org.

    Usage in route handlers:
        from middleware.auth_middleware import get_request_org_id

        @router.post("/calculate")
        def calculate(req: Request, payload: MyModel, db: Session = Depends(get_db)):
            org_id = get_request_org_id(req)
            query = db.query(MyModel)
            if org_id:
                query = query.filter(MyModel.org_id == org_id)
            ...
    """
    return getattr(request.state, "org_id", None)


def apply_org_filter(query, model_cls, request: Request):
    """
    Convenience helper: apply org_id filter to a SQLAlchemy query if the
    model has an org_id column and the request carries an org context.

    Returns the query unchanged if org isolation is not applicable.

    Example:
        q = db.query(PortfolioPG)
        q = apply_org_filter(q, PortfolioPG, request)
        rows = q.all()
    """
    org_id = get_request_org_id(request)
    if org_id is None:
        return query
    if not hasattr(model_cls, "org_id"):
        return query
    return query.filter(model_cls.org_id == org_id)
