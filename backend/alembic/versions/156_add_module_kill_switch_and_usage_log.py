"""Add module kill-switch and usage-log tables

Backs the Team Access Hub's live enable/disable toggle (a global,
whole-team kill-switch per module_path, bypassed only by super_admin — see
api/rbac_utils.py::get_disabled_module_paths_cached and
middleware/auth_middleware.py) and its real usage-analytics tab (replacing
the previous disconnected-Supabase-project usage pings with an actual
per-open log written by every authenticated user via
POST /api/admin/usage/log).

Revision ID: killsw01
Revises: 155
Create Date: 2026-07-12
"""

revision = 'killsw01'
down_revision = '155'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


def upgrade():
    op.create_table(
        'rbac_module_kill_switch',
        # Presence of a row = disabled. Deleting the row re-enables the module.
        sa.Column('module_path', sa.String(255), primary_key=True),
        sa.Column('disabled_by', sa.String(), sa.ForeignKey('users_pg.user_id'), nullable=True),
        sa.Column('reason', sa.Text),
        sa.Column('disabled_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'rbac_module_usage_log',
        sa.Column('id', UUID, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        # NOTE: users_pg.user_id is VARCHAR (not UUID) — FK columns must match its type.
        sa.Column('user_id', sa.String(), sa.ForeignKey('users_pg.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('module_path', sa.String(255), nullable=False),
        sa.Column('opened_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_usage_log_module_path', 'rbac_module_usage_log', ['module_path'])
    op.create_index('ix_usage_log_opened_at', 'rbac_module_usage_log', ['opened_at'])
    op.create_index('ix_usage_log_user_id', 'rbac_module_usage_log', ['user_id'])


def downgrade():
    op.drop_table('rbac_module_usage_log')
    op.drop_table('rbac_module_kill_switch')
