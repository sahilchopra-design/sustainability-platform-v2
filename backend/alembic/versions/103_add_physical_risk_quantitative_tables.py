"""add quantitative physical risk tables (hazard mapping, damage functions, portfolio aggregation)

Revision ID: 103
Revises: 102
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '103'
down_revision = '102'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Hazard assessment runs — per-asset, per-peril, per-scenario
    op.create_table('physical_hazard_assessments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True)),
        sa.Column('asset_name', sa.String(200)),
        sa.Column('asset_class', sa.String(50)),           # residential_re, commercial_re, infrastructure, agri, energy
        sa.Column('latitude', sa.Numeric(9, 6)),
        sa.Column('longitude', sa.Numeric(9, 6)),
        sa.Column('country', sa.String(100)),
        sa.Column('region', sa.String(100)),
        sa.Column('asset_value_usd', sa.Numeric(20, 2)),
        sa.Column('scenario', sa.String(30)),              # current, ssp1_2.6, ssp2_4.5, ssp5_8.5
        sa.Column('horizon_year', sa.Integer()),           # 2030, 2050, 2100
        # Peril scores 0-100
        sa.Column('flood_riverine_score', sa.Numeric(5, 2)),
        sa.Column('flood_coastal_score', sa.Numeric(5, 2)),
        sa.Column('flood_pluvial_score', sa.Numeric(5, 2)),
        sa.Column('wildfire_score', sa.Numeric(5, 2)),
        sa.Column('extreme_heat_score', sa.Numeric(5, 2)),
        sa.Column('wind_cyclone_score', sa.Numeric(5, 2)),
        sa.Column('drought_score', sa.Numeric(5, 2)),
        sa.Column('sea_level_rise_score', sa.Numeric(5, 2)),
        sa.Column('composite_hazard_score', sa.Numeric(5, 2)),
        sa.Column('peril_detail', JSONB),                  # {peril: {rp100: score, rp250: score, aal: value}}
        sa.Column('data_sources', JSONB),                  # IPCC AR6 chapter refs, data provider
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_pha_asset', 'physical_hazard_assessments', ['asset_id'])
    op.create_index('idx_pha_scenario', 'physical_hazard_assessments', ['scenario', 'horizon_year'])
    op.create_index('idx_pha_country', 'physical_hazard_assessments', ['country'])
    op.create_index('idx_pha_org', 'physical_hazard_assessments', ['org_id'])

    # Damage function calculator runs
    op.create_table('damage_function_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True)),
        sa.Column('asset_class', sa.String(50)),
        sa.Column('peril', sa.String(50)),                 # flood, wildfire, wind, heat, drought
        sa.Column('damage_function_standard', sa.String(50)),  # jrc, hazus, fema_p58, wbgt_productivity
        sa.Column('hazard_intensity', sa.Numeric(10, 4)),  # depth_m for flood, wind_speed for wind, etc
        sa.Column('damage_ratio', sa.Numeric(8, 6)),       # 0.0 - 1.0
        sa.Column('damage_usd', sa.Numeric(20, 2)),
        sa.Column('aal_usd', sa.Numeric(20, 2)),           # Annual Average Loss
        sa.Column('eal_usd', sa.Numeric(20, 2)),           # Expected Annual Loss
        sa.Column('pml_100yr_usd', sa.Numeric(20, 2)),     # Probable Maximum Loss @ 100yr
        sa.Column('pml_250yr_usd', sa.Numeric(20, 2)),     # Probable Maximum Loss @ 250yr
        sa.Column('exceedance_curve', JSONB),              # [{return_period, loss_usd, exceedance_pct}]
        sa.Column('vulnerability_params', JSONB),          # {alpha, beta, threshold, max_damage}
        sa.Column('scenario', sa.String(30)),
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_dfr_asset_peril', 'damage_function_runs', ['asset_id', 'peril'])
    op.create_index('idx_dfr_scenario', 'damage_function_runs', ['scenario'])
    op.create_index('idx_dfr_org', 'damage_function_runs', ['org_id'])

    # Portfolio-level physical risk aggregation
    op.create_table('portfolio_physical_risk',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('portfolio_id', postgresql.UUID(as_uuid=True)),
        sa.Column('portfolio_name', sa.String(200)),
        sa.Column('run_date', sa.Date()),
        sa.Column('scenario', sa.String(30)),
        sa.Column('horizon_year', sa.Integer()),
        sa.Column('total_exposure_usd', sa.Numeric(20, 2)),
        sa.Column('total_aal_usd', sa.Numeric(20, 2)),
        sa.Column('total_pml_100yr_usd', sa.Numeric(20, 2)),
        sa.Column('total_pml_250yr_usd', sa.Numeric(20, 2)),
        sa.Column('high_risk_asset_count', sa.Integer()),
        sa.Column('high_risk_exposure_pct', sa.Numeric(6, 3)),
        sa.Column('by_peril', JSONB),                      # {peril: {aal, pml100, pml250, asset_count}}
        sa.Column('by_region', JSONB),                     # {region: {exposure, aal, risk_score}}
        sa.Column('by_asset_class', JSONB),                # {class: {exposure, aal, avg_score}}
        sa.Column('top_risk_assets', JSONB),               # [{asset_id, name, score, aal}] top 10
        sa.Column('regulatory_capital_impact', JSONB),     # {ecb_cst, boe_cbes, apra_cpg229: {add_on_pct}}
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_ppr_portfolio', 'portfolio_physical_risk', ['portfolio_id'])
    op.create_index('idx_ppr_scenario', 'portfolio_physical_risk', ['scenario', 'horizon_year'])
    op.create_index('idx_ppr_org', 'portfolio_physical_risk', ['org_id'])

    # Insurance gap analysis
    op.create_table('insurance_gap_analysis',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('portfolio_id', postgresql.UUID(as_uuid=True)),
        sa.Column('analysis_date', sa.Date()),
        sa.Column('scenario', sa.String(30)),
        sa.Column('total_exposure_usd', sa.Numeric(20, 2)),
        sa.Column('insured_exposure_usd', sa.Numeric(20, 2)),
        sa.Column('uninsured_exposure_usd', sa.Numeric(20, 2)),
        sa.Column('insurance_penetration_pct', sa.Numeric(6, 3)),
        sa.Column('expected_insured_loss_usd', sa.Numeric(20, 2)),
        sa.Column('expected_uninsured_loss_usd', sa.Numeric(20, 2)),
        sa.Column('protection_gap_usd', sa.Numeric(20, 2)),
        sa.Column('by_peril', JSONB),                      # {peril: {insured, uninsured, gap}}
        sa.Column('by_country', JSONB),                    # {country: {penetration, gap_usd}}
        sa.Column('double_hit_scenario', JSONB),           # {physical_loss, transition_cost, combined}
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_iga_portfolio', 'insurance_gap_analysis', ['portfolio_id'])
    op.create_index('idx_iga_scenario', 'insurance_gap_analysis', ['scenario'])
    op.create_index('idx_iga_org', 'insurance_gap_analysis', ['org_id'])

def downgrade() -> None:
    op.drop_index('idx_iga_org', table_name='insurance_gap_analysis')
    op.drop_index('idx_iga_scenario', table_name='insurance_gap_analysis')
    op.drop_index('idx_iga_portfolio', table_name='insurance_gap_analysis')
    op.drop_table('insurance_gap_analysis')

    op.drop_index('idx_ppr_org', table_name='portfolio_physical_risk')
    op.drop_index('idx_ppr_scenario', table_name='portfolio_physical_risk')
    op.drop_index('idx_ppr_portfolio', table_name='portfolio_physical_risk')
    op.drop_table('portfolio_physical_risk')

    op.drop_index('idx_dfr_org', table_name='damage_function_runs')
    op.drop_index('idx_dfr_scenario', table_name='damage_function_runs')
    op.drop_index('idx_dfr_asset_peril', table_name='damage_function_runs')
    op.drop_table('damage_function_runs')

    op.drop_index('idx_pha_org', table_name='physical_hazard_assessments')
    op.drop_index('idx_pha_country', table_name='physical_hazard_assessments')
    op.drop_index('idx_pha_scenario', table_name='physical_hazard_assessments')
    op.drop_index('idx_pha_asset', table_name='physical_hazard_assessments')
    op.drop_table('physical_hazard_assessments')
