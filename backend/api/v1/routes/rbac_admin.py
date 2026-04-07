"""
RBAC Admin API — manage users, role presets, module access, and invite links.

All endpoints require super_admin role. Prefix: /api/v1/admin/rbac
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import uuid
import secrets
from datetime import datetime, timezone, timedelta

from db.base import get_db
from db.models.rbac import (
    RbacRolePresetPG,
    RbacUserProfilePG,
    RbacModuleAccessPG,
    RbacAccessInvitePG,
)
from db.models.portfolio_pg import UserPG, UserSessionPG
from api.auth_pg import _validate_session, _get_token, _hash_pw, _create_session

router = APIRouter(prefix="/api/v1/admin/rbac", tags=["rbac-admin"])


# ── Auth helper ───────────────────────────────────────────────────────────────

def _require_super_admin(request: Request, db: Session = Depends(get_db)) -> UserPG:
    """Validate session and assert rbac_role == 'super_admin'."""
    token = _get_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = _validate_session(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    profile = db.query(RbacUserProfilePG).filter(
        RbacUserProfilePG.user_id == user.user_id
    ).first()
    if not profile or profile.rbac_role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class CreateUserBody(BaseModel):
    email: str
    name: str
    password: str
    rbac_role: str = "viewer"
    preset_id: Optional[str] = None
    display_org: Optional[str] = None
    access_duration_days: Optional[int] = None


class UpdateUserBody(BaseModel):
    rbac_role: Optional[str] = None
    preset_id: Optional[str] = None
    display_org: Optional[str] = None
    access_duration_days: Optional[int] = None
    is_active: Optional[bool] = None


class CreatePresetBody(BaseModel):
    name: str
    description: Optional[str] = None
    role_type: str
    module_paths: List[str] = []
    domain_groups: List[str] = []


class UpdatePresetBody(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    role_type: Optional[str] = None
    module_paths: Optional[List[str]] = None
    domain_groups: Optional[List[str]] = None
    is_active: Optional[bool] = None


class CreateInviteBody(BaseModel):
    email: str
    rbac_role: str
    preset_id: Optional[str] = None
    display_org: Optional[str] = None
    access_duration_days: Optional[int] = None
    module_overrides: Optional[List[str]] = []


class ModuleAccessBody(BaseModel):
    module_path: str
    access_type: str = "grant"


# ── User management ───────────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    admin: UserPG = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    """Paginated list of all users with their RBAC profiles."""
    users = db.query(UserPG).offset(offset).limit(limit).all()
    result = []
    for u in users:
        profile = db.query(RbacUserProfilePG).filter(
            RbacUserProfilePG.user_id == u.user_id
        ).first()
        result.append({
            "user_id": u.user_id,
            "email": u.email,
            "name": u.name,
            "is_active": getattr(u, "is_active", True),
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "rbac_role": profile.rbac_role if profile else "viewer",
            "preset_id": profile.preset_id if profile else None,
            "display_org": profile.display_org if profile else None,
            "access_expires_at": (
                profile.access_expires_at.isoformat()
                if profile and profile.access_expires_at else None
            ),
        })
    return {"users": result, "total": db.query(UserPG).count(), "limit": limit, "offset": offset}


@router.post("/users", status_code=201)
def create_user(
    body: CreateUserBody,
    admin: UserPG = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    """Create a new user account with RBAC profile."""
    if db.query(UserPG).filter(UserPG.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user = UserPG(
        user_id=user_id,
        email=body.email,
        name=body.name,
        password_hash=_hash_pw(body.password),
    )
    db.add(user)

    access_expires_at = None
    if body.access_duration_days:
        access_expires_at = datetime.now(timezone.utc) + timedelta(days=body.access_duration_days)

    profile = RbacUserProfilePG(
        user_id=user_id,
        rbac_role=body.rbac_role,
        preset_id=body.preset_id,
        display_org=body.display_org,
        access_duration_days=body.access_duration_days,
        access_expires_at=access_expires_at,
        created_by=admin.user_id,
        updated_by=admin.user_id,
    )
    db.add(profile)
    db.commit()

    return {
        "user_id": user_id,
        "email": body.email,
        "name": body.name,
        "rbac_role": body.rbac_role,
        "preset_id": body.preset_id,
        "display_org": body.display_org,
        "access_expires_at": access_expires_at.isoformat() if access_expires_at else None,
    }


@router.patch("/users/{user_id}")
def update_user(
    user_id: str,
    body: UpdateUserBody,
    admin: UserPG = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    """Update a user's RBAC profile."""
    profile = db.query(RbacUserProfilePG).filter(
        RbacUserProfilePG.user_id == user_id
    ).first()

    user = db.get(UserPG, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if profile is None:
        # Create profile on demand
        profile = RbacUserProfilePG(user_id=user_id, created_by=admin.user_id)
        db.add(profile)

    if body.rbac_role is not None:
        profile.rbac_role = body.rbac_role
    if body.preset_id is not None:
        profile.preset_id = body.preset_id
    if body.display_org is not None:
        profile.display_org = body.display_org
    if body.access_duration_days is not None:
        profile.access_duration_days = body.access_duration_days
        profile.access_expires_at = (
            datetime.now(timezone.utc) + timedelta(days=body.access_duration_days)
        )
    if body.is_active is not None:
        profile.is_active = body.is_active
        user.is_active = body.is_active

    profile.updated_by = admin.user_id
    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "user_id": user_id}


@router.delete("/users/{user_id}/revoke")
def revoke_user(
    user_id: str,
    admin: UserPG = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    """Deactivate a user — sets is_active=False on both user and profile."""
    user = db.get(UserPG, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False

    profile = db.query(RbacUserProfilePG).filter(
        RbacUserProfilePG.user_id == user_id
    ).first()
    if profile:
        profile.is_active = False
        profile.updated_by = admin.user_id
        profile.updated_at = datetime.now(timezone.utc)

    db.commit()
    return {"ok": True, "user_id": user_id, "revoked": True}


# ── Preset management ─────────────────────────────────────────────────────────

@router.get("/presets")
def list_presets(
    admin: UserPG = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    """List all active role presets."""
    presets = db.query(RbacRolePresetPG).filter(RbacRolePresetPG.is_active == True).all()
    return {
        "presets": [
            {
                "id": str(p.id),
                "name": p.name,
                "description": p.description,
                "role_type": p.role_type,
                "module_paths": p.module_paths or [],
                "domain_groups": p.domain_groups or [],
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in presets
        ]
    }


@router.post("/presets", status_code=201)
def create_preset(
    body: CreatePresetBody,
    admin: UserPG = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    """Create a new role preset."""
    preset = RbacRolePresetPG(
        name=body.name,
        description=body.description,
        role_type=body.role_type,
        module_paths=body.module_paths,
        domain_groups=body.domain_groups,
        created_by=admin.user_id,
    )
    db.add(preset)
    db.commit()
    db.refresh(preset)
    return {
        "id": str(preset.id),
        "name": preset.name,
        "role_type": preset.role_type,
    }


@router.patch("/presets/{preset_id}")
def update_preset(
    preset_id: str,
    body: UpdatePresetBody,
    admin: UserPG = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    """Update an existing role preset."""
    preset = db.get(RbacRolePresetPG, preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")

    if body.name is not None:
        preset.name = body.name
    if body.description is not None:
        preset.description = body.description
    if body.role_type is not None:
        preset.role_type = body.role_type
    if body.module_paths is not None:
        preset.module_paths = body.module_paths
    if body.domain_groups is not None:
        preset.domain_groups = body.domain_groups
    if body.is_active is not None:
        preset.is_active = body.is_active

    preset.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "id": preset_id}


@router.delete("/presets/{preset_id}")
def delete_preset(
    preset_id: str,
    admin: UserPG = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    """Soft-delete a role preset (is_active=False)."""
    preset = db.get(RbacRolePresetPG, preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    preset.is_active = False
    preset.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "id": preset_id, "deleted": True}


# ── Invite management ─────────────────────────────────────────────────────────

@router.post("/invites", status_code=201)
def create_invite(
    body: CreateInviteBody,
    admin: UserPG = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    """Generate a token-based invite link for a new user."""
    token = secrets.token_urlsafe(32)
    invite_expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    invite = RbacAccessInvitePG(
        invite_token=token,
        email=body.email,
        rbac_role=body.rbac_role,
        preset_id=body.preset_id,
        display_org=body.display_org,
        access_duration_days=body.access_duration_days,
        module_overrides=body.module_overrides or [],
        invite_expires_at=invite_expires_at,
        created_by=admin.user_id,
    )
    db.add(invite)
    db.commit()

    return {
        "invite_token": token,
        "invite_url": f"/invite/{token}",
        "email": body.email,
        "rbac_role": body.rbac_role,
        "expires_at": invite_expires_at.isoformat(),
    }


@router.get("/invites")
def list_invites(
    status: Optional[str] = Query(None, description="Filter by status: pending|accepted|expired|revoked"),
    admin: UserPG = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    """List invite links, optionally filtered by status."""
    q = db.query(RbacAccessInvitePG)
    if status:
        q = q.filter(RbacAccessInvitePG.status == status)
    invites = q.order_by(RbacAccessInvitePG.created_at.desc()).all()
    return {
        "invites": [
            {
                "id": str(i.id),
                "invite_token": i.invite_token,
                "email": i.email,
                "rbac_role": i.rbac_role,
                "status": i.status,
                "display_org": i.display_org,
                "invite_expires_at": i.invite_expires_at.isoformat() if i.invite_expires_at else None,
                "created_at": i.created_at.isoformat() if i.created_at else None,
                "accepted_at": i.accepted_at.isoformat() if i.accepted_at else None,
            }
            for i in invites
        ]
    }


@router.delete("/invites/{invite_id}/revoke")
def revoke_invite(
    invite_id: str,
    admin: UserPG = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    """Revoke a pending invite."""
    invite = db.get(RbacAccessInvitePG, invite_id)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    invite.status = "revoked"
    db.commit()
    return {"ok": True, "id": invite_id, "status": "revoked"}


# ── Module access management ──────────────────────────────────────────────────

def _resolve_effective_paths(user_id: str, db: Session) -> Optional[List[str]]:
    """
    Return the effective allowed module paths for a user.
    super_admin returns None (meaning all).
    Others: preset paths + grants - denies.
    """
    profile = db.query(RbacUserProfilePG).filter(
        RbacUserProfilePG.user_id == user_id
    ).first()
    if not profile:
        return []

    if profile.rbac_role == "super_admin":
        return None  # unrestricted

    # Start with preset paths
    base_paths: List[str] = []
    if profile.preset_id:
        preset = db.get(RbacRolePresetPG, profile.preset_id)
        if preset and preset.module_paths:
            base_paths = list(preset.module_paths)

    # Apply per-user overrides
    overrides = db.query(RbacModuleAccessPG).filter(
        RbacModuleAccessPG.user_id == user_id
    ).all()
    now = datetime.now(timezone.utc)
    grants = set(
        o.module_path for o in overrides
        if o.access_type == "grant" and (o.expires_at is None or o.expires_at > now)
    )
    denies = set(
        o.module_path for o in overrides
        if o.access_type == "deny" and (o.expires_at is None or o.expires_at > now)
    )

    effective = (set(base_paths) | grants) - denies
    return sorted(effective)


@router.get("/module-access/{user_id}")
def get_module_access(
    user_id: str,
    admin: UserPG = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    """Return effective module access list for a user."""
    user = db.get(UserPG, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    effective = _resolve_effective_paths(user_id, db)

    # Also return the raw overrides
    overrides = db.query(RbacModuleAccessPG).filter(
        RbacModuleAccessPG.user_id == user_id
    ).all()

    return {
        "user_id": user_id,
        "allowed_module_paths": effective,  # None = unrestricted (super_admin)
        "overrides": [
            {
                "id": str(o.id),
                "module_path": o.module_path,
                "access_type": o.access_type,
                "expires_at": o.expires_at.isoformat() if o.expires_at else None,
            }
            for o in overrides
        ],
    }


@router.post("/module-access/{user_id}", status_code=201)
def add_module_override(
    user_id: str,
    body: ModuleAccessBody,
    admin: UserPG = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    """Add or update a module-level grant/deny override for a user."""
    user = db.get(UserPG, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(RbacModuleAccessPG).filter(
        RbacModuleAccessPG.user_id == user_id,
        RbacModuleAccessPG.module_path == body.module_path,
    ).first()

    if existing:
        existing.access_type = body.access_type
        existing.granted_by = admin.user_id
    else:
        override = RbacModuleAccessPG(
            user_id=user_id,
            module_path=body.module_path,
            access_type=body.access_type,
            granted_by=admin.user_id,
        )
        db.add(override)

    db.commit()
    return {"ok": True, "user_id": user_id, "module_path": body.module_path, "access_type": body.access_type}


@router.delete("/module-access/{user_id}/{module_path:path}")
def remove_module_override(
    user_id: str,
    module_path: str,
    admin: UserPG = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    """Remove a module-level override for a user."""
    deleted = db.query(RbacModuleAccessPG).filter(
        RbacModuleAccessPG.user_id == user_id,
        RbacModuleAccessPG.module_path == module_path,
    ).delete()
    db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Override not found")
    return {"ok": True, "user_id": user_id, "module_path": module_path, "removed": True}
