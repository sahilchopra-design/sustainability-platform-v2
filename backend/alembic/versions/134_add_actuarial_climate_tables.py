"""Add insurance climate actuarial tables

Revision ID: 134
Revises: 133
Create Date: 2026-04-07

Sprint DC — Climate-Integrated Actuarial Intelligence Suite
Tables: climate_mortality_adjustments, pc_climate_rate_filings,
        climate_ibnr_reserves, solvency_capital_climate_scr,
        climate_claims_projections, insurance_climate_kri_snapshots
"""

from alembic import op
import sqlalchemy as sa

revision = '134'
down_revision = '133'
branch_labels = None
depends_on = None


def upgrade():
    # ------------------------------------------------------------------ #
    # climate_mortality_adjustments — life table climate adjustments      #
    # (EP-DC1)                                                            #
    # ------------------------------------------------------------------ #
    op.create_table(
        'climate_mortality_adjustments',
        sa.Column('id',                    sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('country',               sa.String(100), nullable=False),
        sa.Column('age_band',              sa.String(20)),
        sa.Column('base_mortality_rate',   sa.Numeric(10, 6)),
        sa.Column('heat_excess_mort_pct',  sa.Numeric(8, 4)),
        sa.Column('cold_excess_mort_pct',  sa.Numeric(8, 4)),
        sa.Column('flood_excess_mort_pct', sa.Numeric(8, 4)),
        sa.Column('ngfs_scenario',         sa.String(100)),
        sa.Column('horizon_year',          sa.Integer),
        sa.Column('climate_adj_rate',      sa.Numeric(10, 6)),
        sa.Column('reserve_impact_pct',    sa.Numeric(8, 4)),
        sa.Column('adaptation_capacity',   sa.Numeric(6, 2)),
        sa.Column('as_of_date',            sa.Date),
        sa.Column('created_at',            sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_mortality_adj_country',  'climate_mortality_adjustments', ['country'])
    op.create_index('ix_mortality_adj_scenario', 'climate_mortality_adjustments', ['ngfs_scenario'])

    # ------------------------------------------------------------------ #
    # pc_climate_rate_filings — P&C climate rate adequacy (EP-DC2)       #
    # ------------------------------------------------------------------ #
    op.create_table(
        'pc_climate_rate_filings',
        sa.Column('id',                sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('zone_name',         sa.String(100), nullable=False),
        sa.Column('peril',             sa.String(50)),
        sa.Column('exposure_usd_mn',   sa.Numeric(14, 2)),
        sa.Column('base_rate',         sa.Numeric(10, 6)),
        sa.Column('climate_loading',   sa.Numeric(10, 6)),
        sa.Column('filed_rate',        sa.Numeric(10, 6)),
        sa.Column('technical_rate',    sa.Numeric(10, 6)),
        sa.Column('adequacy_ratio',    sa.Numeric(8, 4)),
        sa.Column('loss_ratio',        sa.Numeric(8, 4)),
        sa.Column('climate_scenario',  sa.String(20)),
        sa.Column('return_period',     sa.Integer),
        sa.Column('filing_date',       sa.Date),
        sa.Column('created_at',        sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_pc_rate_zone',  'pc_climate_rate_filings', ['zone_name'])
    op.create_index('ix_pc_rate_peril', 'pc_climate_rate_filings', ['peril'])

    # ------------------------------------------------------------------ #
    # climate_ibnr_reserves — actuarial IBNR reserve data (EP-DC3)       #
    # ------------------------------------------------------------------ #
    op.create_table(
        'climate_ibnr_reserves',
        sa.Column('id',                    sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('line_of_business',      sa.String(100), nullable=False),
        sa.Column('premium_income_mn',     sa.Numeric(14, 2)),
        sa.Column('base_ibnr_ratio',       sa.Numeric(8, 4)),
        sa.Column('climate_dev_factor',    sa.Numeric(8, 4)),
        sa.Column('tail_risk_factor',      sa.Numeric(8, 4)),
        sa.Column('ngfs_scenario',         sa.String(100)),
        sa.Column('scenario_multiplier',   sa.Numeric(6, 3)),
        sa.Column('required_reserve_mn',   sa.Numeric(14, 2)),
        sa.Column('current_reserve_mn',    sa.Numeric(14, 2)),
        sa.Column('reserve_gap_mn',        sa.Numeric(14, 2)),
        sa.Column('adequacy_score',        sa.Numeric(6, 2)),
        sa.Column('reserve_date',          sa.Date),
        sa.Column('created_at',            sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_ibnr_lob',      'climate_ibnr_reserves', ['line_of_business'])
    op.create_index('ix_ibnr_scenario', 'climate_ibnr_reserves', ['ngfs_scenario'])

    # ------------------------------------------------------------------ #
    # solvency_capital_climate_scr — Solvency II climate SCR (EP-DC4)    #
    # ------------------------------------------------------------------ #
    op.create_table(
        'solvency_capital_climate_scr',
        sa.Column('id',                     sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_name',            sa.String(200), nullable=False),
        sa.Column('entity_type',            sa.String(50)),   # Life, Non-Life, Composite, Reinsurer
        sa.Column('jurisdiction',           sa.String(100)),
        sa.Column('framework',              sa.String(50)),   # Solvency II, NAIC RBC
        sa.Column('eligible_own_funds_mn',  sa.Numeric(14, 2)),
        sa.Column('base_scr_ratio',         sa.Numeric(8, 4)),
        sa.Column('natcat_scr_ratio',       sa.Numeric(8, 4)),
        sa.Column('climate_loading',        sa.Numeric(8, 4)),
        sa.Column('climate_adj_scr',        sa.Numeric(8, 4)),
        sa.Column('solvency_ratio_pct',     sa.Numeric(8, 2)),
        sa.Column('orsa_scenario',          sa.String(100)),
        sa.Column('orsa_adj_ratio',         sa.Numeric(8, 2)),
        sa.Column('below_target',           sa.Boolean, default=False),
        sa.Column('assessment_date',        sa.Date),
        sa.Column('created_at',             sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_scr_entity',      'solvency_capital_climate_scr', ['entity_name'])
    op.create_index('ix_scr_jurisdiction','solvency_capital_climate_scr', ['jurisdiction'])

    # ------------------------------------------------------------------ #
    # climate_claims_projections — forward claims forecast (EP-DC5)      #
    # ------------------------------------------------------------------ #
    op.create_table(
        'climate_claims_projections',
        sa.Column('id',                  sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('region',              sa.String(100), nullable=False),
        sa.Column('peril',               sa.String(100)),
        sa.Column('ngfs_scenario',       sa.String(100)),
        sa.Column('horizon_year',        sa.Integer),
        sa.Column('base_freq',           sa.Numeric(10, 6)),
        sa.Column('base_severity_k',     sa.Numeric(14, 2)),
        sa.Column('projected_claims_mn', sa.Numeric(14, 2)),
        sa.Column('freq_driver_pct',     sa.Numeric(8, 4)),
        sa.Column('severity_driver_pct', sa.Numeric(8, 4)),
        sa.Column('exposure_driver_pct', sa.Numeric(8, 4)),
        sa.Column('insurance_gap',       sa.Numeric(8, 4)),
        sa.Column('run_date',            sa.Date),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_claims_proj_region',   'climate_claims_projections', ['region'])
    op.create_index('ix_claims_proj_scenario', 'climate_claims_projections', ['ngfs_scenario'])
    op.create_index('ix_claims_proj_year',     'climate_claims_projections', ['horizon_year'])

    # ------------------------------------------------------------------ #
    # insurance_climate_kri_snapshots — hub KRI snapshots (EP-DC6)       #
    # ------------------------------------------------------------------ #
    op.create_table(
        'insurance_climate_kri_snapshots',
        sa.Column('id',             sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('kri_name',       sa.String(200), nullable=False),
        sa.Column('domain',         sa.String(100)),
        sa.Column('value',          sa.Numeric(10, 2)),
        sa.Column('threshold',      sa.Numeric(10, 2)),
        sa.Column('breaching',      sa.Boolean, default=False),
        sa.Column('change_pct',     sa.Numeric(8, 4)),
        sa.Column('domain_score',   sa.Numeric(6, 2)),
        sa.Column('alert_count',    sa.Integer, default=0),
        sa.Column('snapshot_date',  sa.Date),
        sa.Column('created_at',     sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_kri_name',   'insurance_climate_kri_snapshots', ['kri_name'])
    op.create_index('ix_kri_domain', 'insurance_climate_kri_snapshots', ['domain'])


def downgrade():
    op.drop_index('ix_kri_domain', table_name='insurance_climate_kri_snapshots')
    op.drop_index('ix_kri_name',   table_name='insurance_climate_kri_snapshots')
    op.drop_table('insurance_climate_kri_snapshots')

    op.drop_index('ix_claims_proj_year',     table_name='climate_claims_projections')
    op.drop_index('ix_claims_proj_scenario', table_name='climate_claims_projections')
    op.drop_index('ix_claims_proj_region',   table_name='climate_claims_projections')
    op.drop_table('climate_claims_projections')

    op.drop_index('ix_scr_jurisdiction', table_name='solvency_capital_climate_scr')
    op.drop_index('ix_scr_entity',       table_name='solvency_capital_climate_scr')
    op.drop_table('solvency_capital_climate_scr')

    op.drop_index('ix_ibnr_scenario', table_name='climate_ibnr_reserves')
    op.drop_index('ix_ibnr_lob',      table_name='climate_ibnr_reserves')
    op.drop_table('climate_ibnr_reserves')

    op.drop_index('ix_pc_rate_peril', table_name='pc_climate_rate_filings')
    op.drop_index('ix_pc_rate_zone',  table_name='pc_climate_rate_filings')
    op.drop_table('pc_climate_rate_filings')

    op.drop_index('ix_mortality_adj_scenario', table_name='climate_mortality_adjustments')
    op.drop_index('ix_mortality_adj_country',  table_name='climate_mortality_adjustments')
    op.drop_table('climate_mortality_adjustments')
