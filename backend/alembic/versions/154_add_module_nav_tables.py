"""add user_module_favorites + user_module_recents tables

Backend for the smarter-nav shell (command palette / sector-grouped sidebar /
pinned+recent modules / connected-modules panel). Two small per-user tables:
  * user_module_favorites — pinned modules (unique per user+path)
  * user_module_recents   — recently visited modules, upserted on each visit
    (unique per user+path; visited_at bumped on re-visit rather than a new row)

Revision ID: modnav01
Revises: refdata01
Create Date: 2026-07-04
"""

from alembic import op
import sqlalchemy as sa

revision = 'modnav01'
down_revision = 'refdata01'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'user_module_favorites',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users_pg.user_id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('module_path', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'module_path', name='uq_user_module_favorites_user_path'),
    )

    op.create_table(
        'user_module_recents',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users_pg.user_id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('module_path', sa.String(255), nullable=False),
        sa.Column('visited_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('user_id', 'module_path', name='uq_user_module_recents_user_path'),
    )
    op.create_index(
        'ix_user_module_recents_user_visited',
        'user_module_recents',
        ['user_id', sa.text('visited_at DESC')],
    )


def downgrade():
    op.drop_index('ix_user_module_recents_user_visited', table_name='user_module_recents')
    op.drop_table('user_module_recents')
    op.drop_table('user_module_favorites')
