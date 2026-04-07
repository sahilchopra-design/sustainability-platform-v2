"""
SQLAlchemy ORM models for the RBAC system.

Tables:
  rbac_role_presets     — reusable named access templates
  rbac_user_profiles    — per-user RBAC metadata + expiry
  rbac_module_access    — per-user grant/deny module overrides
  rbac_access_invites   — token-based invite links
"""

from sqlalchemy import (
    Column, String, Boolean, Text, Integer, ForeignKey, JSON,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from datetime import datetime, timezone
import uuid

from db.base import Base


def _uuid4() -> str:
    return str(uuid.uuid4())


class RbacRolePresetPG(Base):
    """Reusable RBAC role preset — defines which modules/domains are included."""
    __tablename__ = "rbac_role_presets"

    id = Column(String(36), primary_key=True, default=_uuid4)
    name = Column(String(120), nullable=False)
    description = Column(Text)
    role_type = Column(String(30), nullable=False)          # super_admin | team_member | demo | partner | viewer
    module_paths = Column(JSONB, default=list)              # list of allowed route paths
    domain_groups = Column(JSONB, default=list)             # list of domain group names
    is_active = Column(Boolean, nullable=False, default=True)
    created_by = Column(String(100), ForeignKey("users_pg.user_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(
        "created_at",
        __import__("sqlalchemy").DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
    updated_at = Column(
        "updated_at",
        __import__("sqlalchemy").DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )


class RbacUserProfilePG(Base):
    """Per-user RBAC profile — role assignment, preset linkage, expiry."""
    __tablename__ = "rbac_user_profiles"

    id = Column(String(36), primary_key=True, default=_uuid4)
    user_id = Column(
        String(100),
        ForeignKey("users_pg.user_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    rbac_role = Column(String(30), nullable=False, default="viewer")    # super_admin | team_member | demo | partner | viewer
    preset_id = Column(
        String(36),
        ForeignKey("rbac_role_presets.id", ondelete="SET NULL"),
        nullable=True,
    )
    display_org = Column(String(255))
    access_starts_at = Column(__import__("sqlalchemy").DateTime(timezone=True))
    access_expires_at = Column(__import__("sqlalchemy").DateTime(timezone=True))
    access_duration_days = Column(Integer)
    is_read_only = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_by = Column(String(100))
    updated_by = Column(String(100))
    created_at = Column(
        __import__("sqlalchemy").DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
    updated_at = Column(
        __import__("sqlalchemy").DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )


class RbacModuleAccessPG(Base):
    """Per-user module-level grant/deny overrides (applied on top of preset)."""
    __tablename__ = "rbac_module_access"

    id = Column(String(36), primary_key=True, default=_uuid4)
    user_id = Column(
        String(100),
        ForeignKey("users_pg.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    module_path = Column(String(255), nullable=False)
    access_type = Column(String(10), nullable=False, default="grant")   # grant | deny
    granted_by = Column(String(100))
    expires_at = Column(__import__("sqlalchemy").DateTime(timezone=True))
    created_at = Column(
        __import__("sqlalchemy").DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("user_id", "module_path", name="uq_module_access_user_path"),
    )


class RbacAccessInvitePG(Base):
    """Token-based invite link — creates a user + profile on acceptance."""
    __tablename__ = "rbac_access_invites"

    id = Column(String(36), primary_key=True, default=_uuid4)
    invite_token = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(320), nullable=False, index=True)
    rbac_role = Column(String(30), nullable=False)                      # super_admin | team_member | demo | partner | viewer
    preset_id = Column(
        String(36),
        ForeignKey("rbac_role_presets.id", ondelete="SET NULL"),
        nullable=True,
    )
    module_overrides = Column(JSONB, default=list)
    display_org = Column(String(255))
    access_duration_days = Column(Integer)
    status = Column(String(20), nullable=False, default="pending")      # pending | accepted | expired | revoked
    invite_expires_at = Column(__import__("sqlalchemy").DateTime(timezone=True))
    accepted_by_user_id = Column(String(100))
    accepted_at = Column(__import__("sqlalchemy").DateTime(timezone=True))
    created_by = Column(String(100))
    created_at = Column(
        __import__("sqlalchemy").DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
