"""add engineered CDR tables (mineralization, DAC, BiCRS)

Revision ID: 099
Revises: 098
Create Date: 2026-04-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '099'
down_revision = '098'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table('cc_mineralization_sites',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True)),
        sa.Column('rock_type', sa.String(50)), sa.Column('mineral_composition', JSONB),
        sa.Column('application_area_ha', sa.Numeric(12,2)), sa.Column('particle_size_um', sa.Integer()),
        sa.Column('application_rate_t_ha', sa.Numeric(8,2)), sa.Column('weathering_rate_pct_yr', sa.Numeric(6,3)),
        sa.Column('cumulative_co2_tonnes', sa.Numeric(14,2)), sa.Column('energy_grinding_kwh_t', sa.Numeric(8,2)),
        sa.Column('transport_emissions_tco2', sa.Numeric(10,2)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_mineral_proj', 'cc_mineralization_sites', ['project_id'])

    op.create_table('cc_dac_facilities',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True)),
        sa.Column('technology', sa.String(30)), sa.Column('capacity_tpa', sa.Numeric(12,2)),
        sa.Column('gross_capture_tpa', sa.Numeric(12,2)), sa.Column('energy_source', sa.String(30)),
        sa.Column('energy_intensity_kwh', sa.Numeric(8,2)), sa.Column('sorbent_emissions_pct', sa.Numeric(5,2)),
        sa.Column('construction_emissions_pct', sa.Numeric(5,2)), sa.Column('transport_emissions_pct', sa.Numeric(5,2)),
        sa.Column('net_removal_tpa', sa.Numeric(12,2)), sa.Column('storage_type', sa.String(50)),
        sa.Column('permanence_tier', sa.String(20)), sa.Column('lcod_usd', sa.Numeric(8,2)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_dac_proj', 'cc_dac_facilities', ['project_id'])
    op.create_index('idx_cc_dac_tier', 'cc_dac_facilities', ['permanence_tier'])

    op.create_table('cc_bicrs_operations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True)),
        sa.Column('feedstock_type', sa.String(100)), sa.Column('biomass_input_tonnes', sa.Numeric(12,2)),
        sa.Column('carbon_content_pct', sa.Numeric(5,2)), sa.Column('carbon_injected_tonnes', sa.Numeric(12,2)),
        sa.Column('leakage_rate', sa.Numeric(5,3)), sa.Column('storage_formation', sa.String(100)),
        sa.Column('permanence_tier', sa.String(20)), sa.Column('lifecycle_emissions_pct', sa.Numeric(5,2)),
        sa.Column('net_removal_tonnes', sa.Numeric(12,2)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_bicrs_proj', 'cc_bicrs_operations', ['project_id'])

def downgrade() -> None:
    op.drop_index('idx_cc_bicrs_proj', table_name='cc_bicrs_operations'); op.drop_table('cc_bicrs_operations')
    op.drop_index('idx_cc_dac_tier', table_name='cc_dac_facilities'); op.drop_index('idx_cc_dac_proj', table_name='cc_dac_facilities'); op.drop_table('cc_dac_facilities')
    op.drop_index('idx_cc_mineral_proj', table_name='cc_mineralization_sites'); op.drop_table('cc_mineralization_sites')
