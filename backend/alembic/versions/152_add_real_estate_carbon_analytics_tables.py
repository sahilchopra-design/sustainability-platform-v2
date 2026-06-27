"""add real_estate_carbon_analytics tables

Revision ID: recarb1001
Revises: refine01
Create Date: (scaffolded)
"""
from alembic import op
import sqlalchemy as sa

revision = 'recarb1001'
down_revision = 'refine01'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'ep_recarb1_properties',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ref', sa.String(), nullable=True),        # external/business key for idempotent seed
        sa.Column('name', sa.String(), nullable=True),
        # TODO(owner): replace the placeholders below with the module's real columns
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('value', sa.Float(), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=True),       # flexible bag for less-queried fields
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ref', name='uq_ep_recarb1_properties_ref'),
    )


def downgrade():
    op.drop_table('ep_recarb1_properties')
