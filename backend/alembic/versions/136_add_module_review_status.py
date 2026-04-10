"""Add module review status table

Revision ID: 136
Revises: 135
Create Date: 2026-04-10
"""

revision = '136'
down_revision = '135'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


def upgrade():
    op.create_table('module_review_status',
        sa.Column('id', UUID, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('module_path', sa.String(200), unique=True, nullable=False),
        sa.Column('module_name', sa.String(200)),
        sa.Column('maturity_level', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('review_tier', sa.Integer, server_default='0'),
        sa.Column('reviewer_id', UUID, sa.ForeignKey('users_pg.user_id'), nullable=True),
        sa.Column('reviewer_notes', sa.Text),
        sa.Column('reviewed_at', sa.DateTime(timezone=True)),
        sa.Column('promoted_by', UUID, sa.ForeignKey('users_pg.user_id'), nullable=True),
        sa.Column('promoted_at', sa.DateTime(timezone=True)),
        sa.Column('feedback', JSONB, server_default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_module_review_maturity', 'module_review_status', ['maturity_level'])


def downgrade():
    op.drop_table('module_review_status')
