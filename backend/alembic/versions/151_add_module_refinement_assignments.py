"""Add module refinement assignments table

Tracks per-module ownership for the refinement pipeline (who owns a module,
its work status, branch/worktree, and the Alembic revision id claimed for that
module's DB-vertical migration). Orthogonal to module_review_status (which models
the maturity pipeline) — joined by module_path.

Revision ID: refine01
Revises: dq001
Create Date: 2026-06-27
"""

revision = 'refine01'
down_revision = 'dq001'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


def upgrade():
    op.create_table(
        'module_refinement_assignments',
        sa.Column('id', UUID, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('module_path', sa.String(200), unique=True, nullable=False),
        # NOTE: users_pg.user_id is VARCHAR (not UUID) — FK columns must match its type.
        sa.Column('assignee_id', sa.String(), sa.ForeignKey('users_pg.user_id'), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='unassigned'),  # unassigned|in_progress|in_review|done
        sa.Column('branch_name', sa.String(200)),
        sa.Column('worktree_path', sa.String(500)),
        sa.Column('target_maturity', sa.String(20), server_default='beta'),
        sa.Column('alembic_revision_claim', sa.String(64)),  # serialized down_revision claim — avoids parallel chain clashes
        sa.Column('notes', sa.Text),
        sa.Column('assigned_by', sa.String(), sa.ForeignKey('users_pg.user_id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_refine_assignee', 'module_refinement_assignments', ['assignee_id'])
    op.create_index('ix_refine_status', 'module_refinement_assignments', ['status'])


def downgrade():
    op.drop_table('module_refinement_assignments')
