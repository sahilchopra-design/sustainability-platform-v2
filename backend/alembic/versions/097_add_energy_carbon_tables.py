"""add energy carbon credit tables (grid renewables, cooking, efficiency)

Revision ID: 097
Revises: 096
Create Date: 2026-04-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '097'
down_revision = '096'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table('cc_energy_projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True)),
        sa.Column('technology', sa.String(30)), sa.Column('fuel_type', sa.String(30)),
        sa.Column('capacity_kw', sa.Numeric(12,2)), sa.Column('annual_generation_mwh', sa.Numeric(14,2)),
        sa.Column('capacity_factor', sa.Numeric(5,3)), sa.Column('auxiliary_consumption_pct', sa.Numeric(5,2)),
        sa.Column('baseline_efficiency', sa.Numeric(5,3)), sa.Column('project_efficiency', sa.Numeric(5,3)),
        sa.Column('operating_hours', sa.Integer()), sa.Column('load_factor', sa.Numeric(5,3)),
        sa.Column('grid_emission_factor', sa.Numeric(8,4)), sa.Column('om_ef', sa.Numeric(8,4)), sa.Column('bm_ef', sa.Numeric(8,4)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_energy_proj', 'cc_energy_projects', ['project_id'])
    op.create_index('idx_cc_energy_tech', 'cc_energy_projects', ['technology'])

    op.create_table('cc_grid_emission_factors',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('country_iso', sa.String(3)), sa.Column('grid_region', sa.String(100)),
        sa.Column('year', sa.Integer()), sa.Column('om_ef_tco2_mwh', sa.Numeric(8,4)),
        sa.Column('bm_ef_tco2_mwh', sa.Numeric(8,4)), sa.Column('combined_ef', sa.Numeric(8,4)),
        sa.Column('data_source', sa.String(100)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_gef_country', 'cc_grid_emission_factors', ['country_iso'])
    op.create_index('idx_cc_gef_year', 'cc_grid_emission_factors', ['year'])

    op.create_table('cc_cooking_projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True)),
        sa.Column('technology_type', sa.String(50)), sa.Column('fuel_baseline', sa.String(50)),
        sa.Column('fuel_project', sa.String(50)), sa.Column('fnrb', sa.Numeric(5,3)),
        sa.Column('baseline_efficiency', sa.Numeric(5,3)), sa.Column('project_efficiency', sa.Numeric(5,3)),
        sa.Column('stoves_distributed', sa.Integer()), sa.Column('adoption_rate', sa.Numeric(5,3)),
        sa.Column('rebound_rate', sa.Numeric(5,3)), sa.Column('stacking_factor', sa.Numeric(5,3)),
        sa.Column('sdg_scores', JSONB),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_cook_proj', 'cc_cooking_projects', ['project_id'])
    op.create_index('idx_cc_cook_tech', 'cc_cooking_projects', ['technology_type'])

def downgrade() -> None:
    op.drop_index('idx_cc_cook_tech', table_name='cc_cooking_projects')
    op.drop_index('idx_cc_cook_proj', table_name='cc_cooking_projects')
    op.drop_table('cc_cooking_projects')
    op.drop_index('idx_cc_gef_year', table_name='cc_grid_emission_factors')
    op.drop_index('idx_cc_gef_country', table_name='cc_grid_emission_factors')
    op.drop_table('cc_grid_emission_factors')
    op.drop_index('idx_cc_energy_tech', table_name='cc_energy_projects')
    op.drop_index('idx_cc_energy_proj', table_name='cc_energy_projects')
    op.drop_table('cc_energy_projects')
