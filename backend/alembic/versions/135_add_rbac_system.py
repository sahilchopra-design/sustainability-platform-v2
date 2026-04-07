"""Add RBAC system — role presets, user profiles, module access, invites

Revision ID: 135_add_rbac_system
Revises: 134_add_actuarial_climate_tables
Create Date: 2026-04-07

Creates 4 tables:
  rbac_role_presets       — reusable named access templates
  rbac_user_profiles      — per-user RBAC metadata + expiry
  rbac_module_access      — per-user grant/deny overrides at module level
  rbac_access_invites     — token-based invite links with role + preset
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = '135_add_rbac_system'
down_revision = '134_add_actuarial_climate_tables'
branch_labels = None
depends_on = None

_ROLE_TYPES = sa.Enum(
    'super_admin', 'team_member', 'demo', 'partner', 'viewer',
    name='rbac_role_type',
)
_ACCESS_TYPES = sa.Enum('grant', 'deny', name='rbac_access_type')
_INVITE_STATUSES = sa.Enum(
    'pending', 'accepted', 'expired', 'revoked',
    name='rbac_invite_status',
)


def upgrade():
    # ── rbac_role_presets ──────────────────────────────────────────────────────
    op.create_table(
        'rbac_role_presets',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column(
            'role_type',
            sa.String(30),
            sa.CheckConstraint(
                "role_type IN ('super_admin','team_member','demo','partner','viewer')",
                name='ck_preset_role_type',
            ),
            nullable=False,
        ),
        sa.Column('module_paths', JSONB, server_default='[]'),
        sa.Column('domain_groups', JSONB, server_default='[]'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column(
            'created_by',
            sa.String(100),
            sa.ForeignKey('users_pg.user_id', ondelete='SET NULL'),
            nullable=True,
        ),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index('ix_rbac_role_presets_role_type', 'rbac_role_presets', ['role_type'])

    # ── rbac_user_profiles ─────────────────────────────────────────────────────
    op.create_table(
        'rbac_user_profiles',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column(
            'user_id',
            sa.String(100),
            sa.ForeignKey('users_pg.user_id', ondelete='CASCADE'),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            'rbac_role',
            sa.String(30),
            sa.CheckConstraint(
                "rbac_role IN ('super_admin','team_member','demo','partner','viewer')",
                name='ck_profile_rbac_role',
            ),
            nullable=False,
            server_default='viewer',
        ),
        sa.Column(
            'preset_id',
            UUID(as_uuid=True),
            sa.ForeignKey('rbac_role_presets.id', ondelete='SET NULL'),
            nullable=True,
        ),
        sa.Column('display_org', sa.String(255)),
        sa.Column('access_starts_at', sa.TIMESTAMP(timezone=True)),
        sa.Column('access_expires_at', sa.TIMESTAMP(timezone=True)),
        sa.Column('access_duration_days', sa.Integer),
        sa.Column('is_read_only', sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column('created_by', sa.String(100)),
        sa.Column('updated_by', sa.String(100)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index('ix_rbac_user_profiles_user_id', 'rbac_user_profiles', ['user_id'])

    # ── rbac_module_access ─────────────────────────────────────────────────────
    op.create_table(
        'rbac_module_access',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column(
            'user_id',
            sa.String(100),
            sa.ForeignKey('users_pg.user_id', ondelete='CASCADE'),
            nullable=False,
        ),
        sa.Column('module_path', sa.String(255), nullable=False),
        sa.Column(
            'access_type',
            sa.String(10),
            sa.CheckConstraint(
                "access_type IN ('grant','deny')",
                name='ck_module_access_type',
            ),
            nullable=False,
            server_default='grant',
        ),
        sa.Column('granted_by', sa.String(100)),
        sa.Column('expires_at', sa.TIMESTAMP(timezone=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('user_id', 'module_path', name='uq_module_access_user_path'),
    )
    op.create_index('ix_rbac_module_access_user_id', 'rbac_module_access', ['user_id'])

    # ── rbac_access_invites ────────────────────────────────────────────────────
    op.create_table(
        'rbac_access_invites',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('invite_token', sa.String(64), unique=True, nullable=False),
        sa.Column('email', sa.String(320), nullable=False),
        sa.Column(
            'rbac_role',
            sa.String(30),
            sa.CheckConstraint(
                "rbac_role IN ('super_admin','team_member','demo','partner','viewer')",
                name='ck_invite_rbac_role',
            ),
            nullable=False,
        ),
        sa.Column(
            'preset_id',
            UUID(as_uuid=True),
            sa.ForeignKey('rbac_role_presets.id', ondelete='SET NULL'),
            nullable=True,
        ),
        sa.Column('module_overrides', JSONB, server_default='[]'),
        sa.Column('display_org', sa.String(255)),
        sa.Column('access_duration_days', sa.Integer),
        sa.Column(
            'status',
            sa.String(20),
            sa.CheckConstraint(
                "status IN ('pending','accepted','expired','revoked')",
                name='ck_invite_status',
            ),
            nullable=False,
            server_default='pending',
        ),
        sa.Column(
            'invite_expires_at',
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW() + INTERVAL '7 days'"),
            nullable=False,
        ),
        sa.Column('accepted_by_user_id', sa.String(100)),
        sa.Column('accepted_at', sa.TIMESTAMP(timezone=True)),
        sa.Column('created_by', sa.String(100)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_rbac_invites_token', 'rbac_access_invites', ['invite_token'])
    op.create_index('ix_rbac_invites_email', 'rbac_access_invites', ['email'])
    op.create_index('ix_rbac_invites_status', 'rbac_access_invites', ['status'])

    # ── Seed: Super Admin preset ───────────────────────────────────────────────
    op.execute("""
        INSERT INTO rbac_role_presets (name, description, role_type, module_paths, domain_groups, is_active)
        VALUES (
            'Super Admin — Full Access',
            'Unrestricted access to all modules.',
            'super_admin',
            '[]'::jsonb,
            '[]'::jsonb,
            TRUE
        )
    """)


def downgrade():
    op.drop_table('rbac_access_invites')
    op.drop_table('rbac_module_access')
    op.drop_table('rbac_user_profiles')
    op.drop_table('rbac_role_presets')
