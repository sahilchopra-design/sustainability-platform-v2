"""add agriculture carbon credit tables (soil, livestock, rice)

Revision ID: 096
Revises: 095
Create Date: 2026-04-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '096'
down_revision = '095'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. cc_soil_samples ──
    op.create_table('cc_soil_samples',
        sa.Column('id',              postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id',      postgresql.UUID(as_uuid=True)),
        sa.Column('sample_id',       sa.String(30)),
        sa.Column('zone',            sa.String(50)),
        sa.Column('stratum',         sa.String(50)),
        sa.Column('depth_cm',        sa.Numeric(6, 1)),
        sa.Column('soc_pct',         sa.Numeric(6, 3)),
        sa.Column('bulk_density',    sa.Numeric(5, 3)),
        sa.Column('soc_t_per_ha',    sa.Numeric(10, 2)),
        sa.Column('sampling_date',   sa.Date()),
        sa.Column('lab_method',      sa.String(50)),
        sa.Column('latitude',        sa.Numeric(10, 6)),
        sa.Column('longitude',       sa.Numeric(10, 6)),
        sa.Column('created_at',      sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_cc_soil_proj',   'cc_soil_samples', ['project_id'])
    op.create_index('idx_cc_soil_zone',   'cc_soil_samples', ['zone'])
    op.create_index('idx_cc_soil_date',   'cc_soil_samples', ['sampling_date'])

    # ── 2. cc_livestock_herds ──
    op.create_table('cc_livestock_herds',
        sa.Column('id',              postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id',      postgresql.UUID(as_uuid=True)),
        sa.Column('herd_id',         sa.String(30)),
        sa.Column('species',         sa.String(30)),    # cattle, buffalo, sheep, goat, pig
        sa.Column('breed',           sa.String(50)),
        sa.Column('head_count',      sa.Integer()),
        sa.Column('avg_weight_kg',   sa.Numeric(8, 1)),
        sa.Column('feed_type',       sa.String(50)),
        sa.Column('gross_energy_mj', sa.Numeric(8, 2)),
        sa.Column('ym_baseline',     sa.Numeric(6, 4)),
        sa.Column('ym_project',      sa.Numeric(6, 4)),
        sa.Column('volatile_solids_kg', sa.Numeric(8, 2)),
        sa.Column('b0',              sa.Numeric(6, 4)),
        sa.Column('mcf',             sa.Numeric(6, 4)),
        sa.Column('region_climate',  sa.String(30)),
        sa.Column('feed_additive',   sa.String(50)),
        sa.Column('monitoring_period', sa.String(30)),
        sa.Column('created_at',      sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_cc_lstock_proj', 'cc_livestock_herds', ['project_id'])
    op.create_index('idx_cc_lstock_sp',   'cc_livestock_herds', ['species'])
    op.create_index('idx_cc_lstock_clim', 'cc_livestock_herds', ['region_climate'])

    # ── 3. cc_rice_fields ──
    op.create_table('cc_rice_fields',
        sa.Column('id',              postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id',      postgresql.UUID(as_uuid=True)),
        sa.Column('field_id',        sa.String(30)),
        sa.Column('area_ha',         sa.Numeric(12, 2)),
        sa.Column('water_regime',    sa.String(30)),    # continuous_flooding / awd / dry_seeding
        sa.Column('soil_type',       sa.String(50)),
        sa.Column('rice_variety',    sa.String(100)),
        sa.Column('season',          sa.String(20)),    # wet / dry / both
        sa.Column('seasons_per_year', sa.Integer()),
        sa.Column('emission_factor_kg_ha', sa.Numeric(8, 1)),
        sa.Column('awd_scaling_factor', sa.Numeric(5, 3)),
        sa.Column('yield_t_per_ha',  sa.Numeric(6, 2)),
        sa.Column('country_iso',     sa.String(3)),
        sa.Column('region',          sa.String(100)),
        sa.Column('created_at',      sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_cc_rice_proj',    'cc_rice_fields', ['project_id'])
    op.create_index('idx_cc_rice_regime',  'cc_rice_fields', ['water_regime'])
    op.create_index('idx_cc_rice_country', 'cc_rice_fields', ['country_iso'])


def downgrade() -> None:
    op.drop_index('idx_cc_rice_country', table_name='cc_rice_fields')
    op.drop_index('idx_cc_rice_regime',  table_name='cc_rice_fields')
    op.drop_index('idx_cc_rice_proj',    table_name='cc_rice_fields')
    op.drop_table('cc_rice_fields')

    op.drop_index('idx_cc_lstock_clim', table_name='cc_livestock_herds')
    op.drop_index('idx_cc_lstock_sp',   table_name='cc_livestock_herds')
    op.drop_index('idx_cc_lstock_proj', table_name='cc_livestock_herds')
    op.drop_table('cc_livestock_herds')

    op.drop_index('idx_cc_soil_date',   table_name='cc_soil_samples')
    op.drop_index('idx_cc_soil_zone',   table_name='cc_soil_samples')
    op.drop_index('idx_cc_soil_proj',   table_name='cc_soil_samples')
    op.drop_table('cc_soil_samples')
