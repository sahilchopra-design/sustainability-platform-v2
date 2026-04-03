"""add waste and industrial carbon credit tables

Revision ID: 098
Revises: 097
Create Date: 2026-04-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '098'
down_revision = '097'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table('cc_waste_streams',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True)),
        sa.Column('waste_type', sa.String(30)), sa.Column('annual_volume_tonnes', sa.Numeric(14,2)),
        sa.Column('doc_fraction', sa.Numeric(6,4)), sa.Column('docf', sa.Numeric(6,4)),
        sa.Column('moisture_pct', sa.Numeric(5,2)), sa.Column('methane_fraction', sa.Numeric(5,3)),
        sa.Column('decay_rate_k', sa.Numeric(6,4)), sa.Column('mcf', sa.Numeric(5,3)),
        sa.Column('treatment_method', sa.String(50)), sa.Column('collection_efficiency', sa.Numeric(5,3)),
        sa.Column('destruction_efficiency', sa.Numeric(5,4)), sa.Column('composition', JSONB),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_waste_proj', 'cc_waste_streams', ['project_id'])

    op.create_table('cc_industrial_gases',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True)),
        sa.Column('gas_type', sa.String(30)), sa.Column('gwp', sa.Integer()),
        sa.Column('quantity_tonnes', sa.Numeric(12,4)), sa.Column('destruction_efficiency', sa.Numeric(6,4)),
        sa.Column('destruction_technology', sa.String(50)), sa.Column('regulatory_baseline', JSONB),
        sa.Column('policy_mandatory_pct', sa.Numeric(5,2)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_indgas_proj', 'cc_industrial_gases', ['project_id'])
    op.create_index('idx_cc_indgas_type', 'cc_industrial_gases', ['gas_type'])

    op.create_table('cc_ccs_sites',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True)),
        sa.Column('site_name', sa.String(200)), sa.Column('formation_type', sa.String(50)),
        sa.Column('storage_capacity_mt', sa.Numeric(12,2)), sa.Column('injection_rate_tpa', sa.Numeric(12,2)),
        sa.Column('co2_captured_tpa', sa.Numeric(12,2)), sa.Column('transport_mode', sa.String(30)),
        sa.Column('transport_distance_km', sa.Numeric(8,1)),
        sa.Column('compression_energy_kwh', sa.Numeric(10,2)), sa.Column('net_stored_tpa', sa.Numeric(12,2)),
        sa.Column('monitoring_plan', JSONB),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_ccs_proj', 'cc_ccs_sites', ['project_id'])

    op.create_table('cc_biochar_batches',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True)),
        sa.Column('biomass_source', sa.String(100)), sa.Column('feedstock_tonnes', sa.Numeric(12,2)),
        sa.Column('pyrolysis_temp_c', sa.Integer()), sa.Column('h_c_ratio', sa.Numeric(5,3)),
        sa.Column('carbon_content_pct', sa.Numeric(5,2)), sa.Column('durable_carbon_pct', sa.Numeric(5,2)),
        sa.Column('stability_factor', sa.Numeric(4,2)), sa.Column('biochar_yield_pct', sa.Numeric(5,2)),
        sa.Column('application_type', sa.String(50)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_biochar_proj', 'cc_biochar_batches', ['project_id'])

def downgrade() -> None:
    op.drop_index('idx_cc_biochar_proj', table_name='cc_biochar_batches'); op.drop_table('cc_biochar_batches')
    op.drop_index('idx_cc_ccs_proj', table_name='cc_ccs_sites'); op.drop_table('cc_ccs_sites')
    op.drop_index('idx_cc_indgas_type', table_name='cc_industrial_gases'); op.drop_index('idx_cc_indgas_proj', table_name='cc_industrial_gases'); op.drop_table('cc_industrial_gases')
    op.drop_index('idx_cc_waste_proj', table_name='cc_waste_streams'); op.drop_table('cc_waste_streams')
