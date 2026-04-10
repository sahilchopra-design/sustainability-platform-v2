"""
Admin RBAC API — full CRUD for users, presets, invites, module access, and review status.

All endpoints require super_admin role. Prefix: /api/admin
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, List
import uuid
import secrets
from datetime import datetime, timezone, timedelta

from db.base import get_db
from api.auth_pg import _validate_session, _get_token, _hash_pw

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Auth dependency ──────────────────────────────────────────────────────────

def _get_current_user(request: Request, db: Session = Depends(get_db)):
    """Validate session and return user dict from raw SQL."""
    token = _get_token(request)
    if not token:
        raise HTTPException(401, "Not authenticated")
    user = _validate_session(db, token)
    if not user:
        raise HTTPException(401, "Invalid or expired session")
    # Fetch RBAC role
    row = db.execute(
        text("SELECT rbac_role FROM rbac_user_profiles WHERE user_id = :uid AND is_active = true"),
        {"uid": user.user_id},
    ).fetchone()
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "rbac_role": row[0] if row else None,
    }


def require_super_admin(current_user=Depends(_get_current_user)):
    """Dependency that ensures the current user is super_admin."""
    if not current_user or current_user.get("rbac_role") != "super_admin":
        raise HTTPException(403, "Super admin access required")
    return current_user


# ── Pydantic schemas ────────────────────────────────────────────────────────

class CreateUserReq(BaseModel):
    email: str
    name: str
    role: str = "viewer"
    preset_id: Optional[str] = None
    duration_days: Optional[int] = None
    password: Optional[str] = None

class UpdateRoleReq(BaseModel):
    role: Optional[str] = None
    preset_id: Optional[str] = None
    is_read_only: Optional[bool] = None
    duration_days: Optional[int] = None

class CreatePresetReq(BaseModel):
    name: str
    role_type: str
    module_paths: List[str] = []
    domain_groups: List[str] = []
    description: Optional[str] = None

class UpdatePresetReq(BaseModel):
    name: Optional[str] = None
    role_type: Optional[str] = None
    module_paths: Optional[List[str]] = None
    domain_groups: Optional[List[str]] = None
    description: Optional[str] = None

class CreateInviteReq(BaseModel):
    email: str
    role: str = "viewer"
    preset_id: Optional[str] = None
    duration_days: Optional[int] = None
    module_overrides: List[str] = []
    display_org: Optional[str] = None

class UpdateInviteReq(BaseModel):
    status: Optional[str] = None  # revoked | pending
    duration_days: Optional[int] = None

class GrantAccessReq(BaseModel):
    user_id: str
    module_path: str

class DenyAccessReq(BaseModel):
    user_id: str
    module_path: str

class ReviewActionReq(BaseModel):
    module_path: str
    action: str  # submit | approve | promote | reject
    notes: Optional[str] = None

class FeedbackReq(BaseModel):
    module_path: str
    note: str
    rating: Optional[int] = None


# ═══════════════════════════════════════════════════════════════════════════════
# USER MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/users")
def list_users(admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """List all users with their RBAC profiles."""
    rows = db.execute(text("""
        SELECT u.user_id, u.email, u.name, u.is_active, u.last_login,
               p.rbac_role, p.preset_id, p.is_read_only, p.display_org,
               p.access_expires_at, p.access_duration_days
        FROM users_pg u
        LEFT JOIN rbac_user_profiles p ON p.user_id = u.user_id
        ORDER BY u.created_at DESC
    """)).fetchall()
    return [
        {
            "user_id": r[0], "email": r[1], "name": r[2], "is_active": r[3],
            "last_login": r[4].isoformat() if r[4] else None,
            "rbac_role": r[5], "preset_id": r[6], "is_read_only": r[7],
            "display_org": r[8],
            "access_expires_at": r[9].isoformat() if r[9] else None,
            "access_duration_days": r[10],
        }
        for r in rows
    ]


@router.post("/users")
def create_user(body: CreateUserReq, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """Create a new user with RBAC profile."""
    # Check duplicate
    existing = db.execute(
        text("SELECT user_id FROM users_pg WHERE email = :e"), {"e": body.email}
    ).fetchone()
    if existing:
        raise HTTPException(400, "Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    pw_hash = _hash_pw(body.password) if body.password else _hash_pw(secrets.token_urlsafe(16))
    now = datetime.now(timezone.utc)

    db.execute(text("""
        INSERT INTO users_pg (user_id, email, name, password_hash, is_active, created_at)
        VALUES (:uid, :email, :name, :pw, true, :now)
    """), {"uid": user_id, "email": body.email, "name": body.name, "pw": pw_hash, "now": now})

    expires = now + timedelta(days=body.duration_days) if body.duration_days else None
    profile_id = str(uuid.uuid4())

    db.execute(text("""
        INSERT INTO rbac_user_profiles (id, user_id, rbac_role, preset_id, access_duration_days,
            access_expires_at, is_active, created_by, updated_by, created_at, updated_at)
        VALUES (:id, :uid, :role, :preset, :dur, :exp, true, :admin, :admin, :now, :now)
    """), {
        "id": profile_id, "uid": user_id, "role": body.role,
        "preset": body.preset_id, "dur": body.duration_days,
        "exp": expires, "admin": admin["user_id"], "now": now,
    })

    db.commit()
    return {"user_id": user_id, "email": body.email, "rbac_role": body.role}


@router.put("/users/{user_id}/role")
def update_user_role(user_id: str, body: UpdateRoleReq, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """Update a user's RBAC role, preset, read_only, or expiry."""
    profile = db.execute(
        text("SELECT id FROM rbac_user_profiles WHERE user_id = :uid"), {"uid": user_id}
    ).fetchone()
    if not profile:
        raise HTTPException(404, "RBAC profile not found for this user")

    now = datetime.now(timezone.utc)
    sets = ["updated_by = :admin", "updated_at = :now"]
    params = {"uid": user_id, "admin": admin["user_id"], "now": now}

    if body.role is not None:
        sets.append("rbac_role = :role")
        params["role"] = body.role
    if body.preset_id is not None:
        sets.append("preset_id = :preset")
        params["preset"] = body.preset_id
    if body.is_read_only is not None:
        sets.append("is_read_only = :ro")
        params["ro"] = body.is_read_only
    if body.duration_days is not None:
        sets.append("access_duration_days = :dur")
        sets.append("access_expires_at = :exp")
        params["dur"] = body.duration_days
        params["exp"] = now + timedelta(days=body.duration_days)

    db.execute(text(f"UPDATE rbac_user_profiles SET {', '.join(sets)} WHERE user_id = :uid"), params)
    db.commit()
    return {"status": "updated", "user_id": user_id}


@router.delete("/users/{user_id}")
def deactivate_user(user_id: str, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """Deactivate a user (soft delete)."""
    db.execute(text("UPDATE users_pg SET is_active = false WHERE user_id = :uid"), {"uid": user_id})
    db.execute(text("UPDATE rbac_user_profiles SET is_active = false WHERE user_id = :uid"), {"uid": user_id})
    db.commit()
    return {"status": "deactivated", "user_id": user_id}


# ═══════════════════════════════════════════════════════════════════════════════
# PRESET MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/presets")
def list_presets(admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """List all role presets."""
    rows = db.execute(text("""
        SELECT id, name, role_type, module_paths, domain_groups, description, is_active, created_at
        FROM rbac_role_presets ORDER BY created_at DESC
    """)).fetchall()
    return [
        {
            "id": r[0], "name": r[1], "role_type": r[2],
            "module_paths": r[3] or [], "domain_groups": r[4] or [],
            "description": r[5], "is_active": r[6],
            "created_at": r[7].isoformat() if r[7] else None,
        }
        for r in rows
    ]


@router.post("/presets")
def create_preset(body: CreatePresetReq, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """Create a new role preset."""
    preset_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    db.execute(text("""
        INSERT INTO rbac_role_presets (id, name, role_type, module_paths, domain_groups,
            description, is_active, created_by, created_at, updated_at)
        VALUES (:id, :name, :rt, :mp::jsonb, :dg::jsonb, :desc, true, :admin, :now, :now)
    """), {
        "id": preset_id, "name": body.name, "rt": body.role_type,
        "mp": __import__("json").dumps(body.module_paths),
        "dg": __import__("json").dumps(body.domain_groups),
        "desc": body.description, "admin": admin["user_id"], "now": now,
    })
    db.commit()
    return {"id": preset_id, "name": body.name}


@router.put("/presets/{preset_id}")
def update_preset(preset_id: str, body: UpdatePresetReq, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """Update a role preset."""
    import json
    now = datetime.now(timezone.utc)
    sets = ["updated_at = :now"]
    params = {"pid": preset_id, "now": now}

    if body.name is not None:
        sets.append("name = :name")
        params["name"] = body.name
    if body.role_type is not None:
        sets.append("role_type = :rt")
        params["rt"] = body.role_type
    if body.module_paths is not None:
        sets.append("module_paths = :mp::jsonb")
        params["mp"] = json.dumps(body.module_paths)
    if body.domain_groups is not None:
        sets.append("domain_groups = :dg::jsonb")
        params["dg"] = json.dumps(body.domain_groups)
    if body.description is not None:
        sets.append("description = :desc")
        params["desc"] = body.description

    db.execute(text(f"UPDATE rbac_role_presets SET {', '.join(sets)} WHERE id = :pid"), params)
    db.commit()
    return {"status": "updated", "id": preset_id}


@router.delete("/presets/{preset_id}")
def deactivate_preset(preset_id: str, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """Deactivate a preset (soft delete)."""
    db.execute(text("UPDATE rbac_role_presets SET is_active = false WHERE id = :pid"), {"pid": preset_id})
    db.commit()
    return {"status": "deactivated", "id": preset_id}


# ═══════════════════════════════════════════════════════════════════════════════
# INVITE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/invites")
def list_invites(admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """List all invite links."""
    rows = db.execute(text("""
        SELECT id, invite_token, email, rbac_role, preset_id, module_overrides,
               display_org, access_duration_days, status, invite_expires_at,
               accepted_by_user_id, accepted_at, created_by, created_at
        FROM rbac_access_invites ORDER BY created_at DESC
    """)).fetchall()
    return [
        {
            "id": r[0], "invite_token": r[1], "email": r[2], "rbac_role": r[3],
            "preset_id": r[4], "module_overrides": r[5] or [],
            "display_org": r[6], "access_duration_days": r[7],
            "status": r[8],
            "invite_expires_at": r[9].isoformat() if r[9] else None,
            "accepted_by_user_id": r[10],
            "accepted_at": r[11].isoformat() if r[11] else None,
            "created_by": r[12],
            "created_at": r[13].isoformat() if r[13] else None,
        }
        for r in rows
    ]


@router.post("/invites")
def create_invite(body: CreateInviteReq, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """Create a new invite link."""
    import json
    invite_id = str(uuid.uuid4())
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=7)  # invite link valid for 7 days

    db.execute(text("""
        INSERT INTO rbac_access_invites (id, invite_token, email, rbac_role, preset_id,
            module_overrides, display_org, access_duration_days, status,
            invite_expires_at, created_by, created_at)
        VALUES (:id, :token, :email, :role, :preset, :mo::jsonb, :org, :dur,
            'pending', :exp, :admin, :now)
    """), {
        "id": invite_id, "token": token, "email": body.email,
        "role": body.role, "preset": body.preset_id,
        "mo": json.dumps(body.module_overrides),
        "org": body.display_org, "dur": body.duration_days,
        "exp": expires, "admin": admin["user_id"], "now": now,
    })
    db.commit()
    return {"id": invite_id, "invite_token": token, "email": body.email, "expires_at": expires.isoformat()}


@router.put("/invites/{invite_id}")
def update_invite(invite_id: str, body: UpdateInviteReq, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """Revoke or extend an invite."""
    now = datetime.now(timezone.utc)
    sets = []
    params = {"iid": invite_id}

    if body.status is not None:
        sets.append("status = :status")
        params["status"] = body.status
    if body.duration_days is not None:
        sets.append("access_duration_days = :dur")
        sets.append("invite_expires_at = :exp")
        params["dur"] = body.duration_days
        params["exp"] = now + timedelta(days=7)

    if not sets:
        raise HTTPException(400, "No fields to update")

    db.execute(text(f"UPDATE rbac_access_invites SET {', '.join(sets)} WHERE id = :iid"), params)
    db.commit()
    return {"status": "updated", "id": invite_id}


# ═══════════════════════════════════════════════════════════════════════════════
# MODULE ACCESS OVERRIDES
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/access/grant")
def grant_module(body: GrantAccessReq, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """Grant a specific module to a user (override)."""
    access_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    # Upsert — replace deny with grant if exists
    db.execute(text("""
        INSERT INTO rbac_module_access (id, user_id, module_path, access_type, granted_by, created_at)
        VALUES (:id, :uid, :mp, 'grant', :admin, :now)
        ON CONFLICT ON CONSTRAINT uq_module_access_user_path
        DO UPDATE SET access_type = 'grant', granted_by = :admin
    """), {"id": access_id, "uid": body.user_id, "mp": body.module_path, "admin": admin["user_id"], "now": now})
    db.commit()
    return {"status": "granted", "user_id": body.user_id, "module_path": body.module_path}


@router.post("/access/deny")
def deny_module(body: DenyAccessReq, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """Deny a specific module from a user (override)."""
    access_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    db.execute(text("""
        INSERT INTO rbac_module_access (id, user_id, module_path, access_type, granted_by, created_at)
        VALUES (:id, :uid, :mp, 'deny', :admin, :now)
        ON CONFLICT ON CONSTRAINT uq_module_access_user_path
        DO UPDATE SET access_type = 'deny', granted_by = :admin
    """), {"id": access_id, "uid": body.user_id, "mp": body.module_path, "admin": admin["user_id"], "now": now})
    db.commit()
    return {"status": "denied", "user_id": body.user_id, "module_path": body.module_path}


@router.delete("/access/{access_id}")
def remove_access_override(access_id: str, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """Remove a module access override."""
    result = db.execute(text("DELETE FROM rbac_module_access WHERE id = :aid"), {"aid": access_id})
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Access override not found")
    return {"status": "removed", "id": access_id}


# ═══════════════════════════════════════════════════════════════════════════════
# MODULE REVIEW STATUS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/modules/status")
def list_module_status(admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """List all modules with their review/maturity status."""
    rows = db.execute(text("""
        SELECT id, module_path, module_name, maturity_level, review_tier,
               reviewer_id, reviewer_notes, reviewed_at,
               promoted_by, promoted_at, feedback, created_at, updated_at
        FROM module_review_status
        ORDER BY module_path ASC
    """)).fetchall()
    return [
        {
            "id": str(r[0]), "module_path": r[1], "module_name": r[2],
            "maturity_level": r[3], "review_tier": r[4],
            "reviewer_id": r[5], "reviewer_notes": r[6],
            "reviewed_at": r[7].isoformat() if r[7] else None,
            "promoted_by": str(r[8]) if r[8] else None,
            "promoted_at": r[9].isoformat() if r[9] else None,
            "feedback": r[10] or [],
            "created_at": r[11].isoformat() if r[11] else None,
            "updated_at": r[12].isoformat() if r[12] else None,
        }
        for r in rows
    ]


@router.put("/modules/review")
def review_module(body: ReviewActionReq, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """Submit, approve, promote, or reject a module review."""
    now = datetime.now(timezone.utc)
    uid = admin["user_id"]

    # Upsert into module_review_status
    existing = db.execute(
        text("SELECT id, review_tier FROM module_review_status WHERE module_path = :mp"),
        {"mp": body.module_path},
    ).fetchone()

    action_map = {
        "submit": ("review", 1),
        "approve": ("beta", 2),
        "promote": ("production", 3),
        "reject": ("draft", 0),
    }
    if body.action not in action_map:
        raise HTTPException(400, f"Invalid action: {body.action}. Must be submit|approve|promote|reject")

    new_maturity, new_tier = action_map[body.action]

    if existing:
        db.execute(text("""
            UPDATE module_review_status
            SET maturity_level = :mat, review_tier = :tier,
                reviewer_id = :rid, reviewer_notes = :notes, reviewed_at = :now,
                promoted_by = CASE WHEN :action = 'promote' THEN :rid ELSE promoted_by END,
                promoted_at = CASE WHEN :action = 'promote' THEN :now ELSE promoted_at END,
                updated_at = :now
            WHERE module_path = :mp
        """), {
            "mat": new_maturity, "tier": new_tier, "rid": uid,
            "notes": body.notes, "now": now, "action": body.action, "mp": body.module_path,
        })
    else:
        db.execute(text("""
            INSERT INTO module_review_status (module_path, maturity_level, review_tier,
                reviewer_id, reviewer_notes, reviewed_at, created_at, updated_at)
            VALUES (:mp, :mat, :tier, :rid, :notes, :now, :now, :now)
        """), {
            "mp": body.module_path, "mat": new_maturity, "tier": new_tier,
            "rid": uid, "notes": body.notes, "now": now,
        })

    db.commit()
    return {"status": body.action, "module_path": body.module_path, "maturity_level": new_maturity, "review_tier": new_tier}


@router.post("/modules/feedback")
def add_module_feedback(body: FeedbackReq, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """Add review feedback to a module."""
    import json
    now = datetime.now(timezone.utc)
    uid = admin["user_id"]

    entry = json.dumps({
        "user_id": uid,
        "note": body.note,
        "rating": body.rating,
        "timestamp": now.isoformat(),
    })

    # Upsert: append to feedback array
    existing = db.execute(
        text("SELECT id FROM module_review_status WHERE module_path = :mp"),
        {"mp": body.module_path},
    ).fetchone()

    if existing:
        db.execute(text("""
            UPDATE module_review_status
            SET feedback = COALESCE(feedback, '[]'::jsonb) || :entry::jsonb,
                updated_at = :now
            WHERE module_path = :mp
        """), {"entry": f"[{entry}]", "now": now, "mp": body.module_path})
    else:
        db.execute(text("""
            INSERT INTO module_review_status (module_path, maturity_level, review_tier, feedback, created_at, updated_at)
            VALUES (:mp, 'draft', 0, :fb::jsonb, :now, :now)
        """), {"mp": body.module_path, "fb": f"[{entry}]", "now": now})

    db.commit()
    return {"status": "feedback_added", "module_path": body.module_path}
