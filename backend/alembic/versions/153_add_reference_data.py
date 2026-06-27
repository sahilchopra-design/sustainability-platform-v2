"""add public reference-data layer

Generic, source-agnostic store for free authoritative datasets (Tier-1: OWID,
SBTi, Verra, World Bank, NGFS, CRREM, ...). Two data shapes cover almost any
source so new sources need NO new migration:
  * reference_data_points  — long format (entity x year x metric x value)
  * reference_data_records — entity catalogue (source, ref, name, payload JSON)
plus a reference_data_sources registry the admin/UI can list.

Revision ID: refdata01
Revises: recarb1001
Create Date: 2026-06-27
"""

revision = 'refdata01'
down_revision = 'recarb1001'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        'reference_data_sources',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('source_key', sa.String(64), unique=True, nullable=False),  # e.g. 'owid_co2'
        sa.Column('name', sa.String(200)),
        sa.Column('provider', sa.String(200)),
        sa.Column('license', sa.String(200)),
        sa.Column('url', sa.String(500)),
        sa.Column('shape', sa.String(20)),          # 'points' | 'records'
        sa.Column('cadence', sa.String(50)),        # annual | quarterly | static
        sa.Column('row_count', sa.Integer(), server_default='0'),
        sa.Column('last_ingested_at', sa.DateTime()),
        sa.Column('status', sa.String(20), server_default='registered'),
        sa.Column('meta', sa.JSON()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'reference_data_points',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('source_key', sa.String(64), nullable=False, index=True),
        sa.Column('entity_code', sa.String(32), index=True),  # ISO3 / sector code
        sa.Column('entity_name', sa.String(200)),
        sa.Column('year', sa.Integer(), index=True),
        sa.Column('metric', sa.String(80), index=True),
        sa.Column('value', sa.Float()),
        sa.Column('unit', sa.String(40)),
        sa.Column('meta', sa.JSON()),
    )
    op.create_index('ix_refpoints_lookup', 'reference_data_points', ['source_key', 'metric', 'entity_code'])

    op.create_table(
        'reference_data_records',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('source_key', sa.String(64), nullable=False, index=True),
        sa.Column('ref', sa.String(120), index=True),      # business key within source
        sa.Column('name', sa.String(400)),
        sa.Column('category', sa.String(120)),
        sa.Column('country', sa.String(120)),
        sa.Column('payload', sa.JSON()),
    )
    op.create_index('ix_refrecords_source', 'reference_data_records', ['source_key', 'category'])


def downgrade():
    op.drop_table('reference_data_records')
    op.drop_table('reference_data_points')
    op.drop_table('reference_data_sources')
