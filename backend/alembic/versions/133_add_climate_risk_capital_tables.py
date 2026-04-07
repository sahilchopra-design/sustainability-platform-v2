"""Add enterprise climate risk capital and supervisory analytics tables

Revision ID: 133
Revises: 132
Create Date: 2026-04-07

Sprint DB — Enterprise Climate Risk Capital & Supervisory Analytics
Tables: climate_capital_assessments, climate_cvar_results,
        supervisory_stress_submissions, climate_risk_premia,
        enterprise_climate_exposures, systemic_risk_indicators
"""

from alembic import op
import sqlalchemy as sa

revision = '133'
down_revision = '132'
branch_labels = None
depends_on = None


def upgrade():
    # ------------------------------------------------------------------ #
    # climate_capital_assessments — Pillar 2 add-on results (EP-DB1)     #
    # ------------------------------------------------------------------ #
    op.create_table(
        'climate_capital_assessments',
        sa.Column('id',                  sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('institution_name',    sa.String(200), nullable=False),
        sa.Column('institution_type',    sa.String(100)),   # Bank, Insurance, Asset Manager
        sa.Column('jurisdiction',        sa.String(100)),
        sa.Column('total_rwa_bn',        sa.Numeric(12, 2)),
        sa.Column('tier1_capital_ratio', sa.Numeric(8, 4)),
        sa.Column('climate_exposure_pct',sa.Numeric(8, 4)),
        sa.Column('climate_rwa_bn',      sa.Numeric(12, 2)),
        sa.Column('scenario_name',       sa.String(100)),
        sa.Column('pillar2_addon_bn',    sa.Numeric(12, 2)),
        sa.Column('adjusted_tier1_ratio',sa.Numeric(8, 4)),
        sa.Column('capital_shortfall_bn',sa.Numeric(12, 2), default=0),
        sa.Column('assessment_date',     sa.Date),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_climate_capital_institution', 'climate_capital_assessments', ['institution_name'])
    op.create_index('ix_climate_capital_jurisdiction', 'climate_capital_assessments', ['jurisdiction'])

    # ------------------------------------------------------------------ #
    # climate_cvar_results — CVaR outputs by scenario/asset/horizon      #
    # (EP-DB2)                                                            #
    # ------------------------------------------------------------------ #
    op.create_table(
        'climate_cvar_results',
        sa.Column('id',              sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('portfolio_id',    sa.String(100)),
        sa.Column('scenario_name',   sa.String(100)),      # NGFS scenario
        sa.Column('asset_class',     sa.String(100)),
        sa.Column('horizon_year',    sa.Integer),           # 2030, 2040, 2050
        sa.Column('phys_cvar_95',    sa.Numeric(8, 4)),    # %
        sa.Column('trans_cvar_95',   sa.Numeric(8, 4)),    # %
        sa.Column('phys_cvar_99',    sa.Numeric(8, 4)),
        sa.Column('trans_cvar_99',   sa.Numeric(8, 4)),
        sa.Column('combined_cvar_95',sa.Numeric(8, 4)),
        sa.Column('combined_cvar_99',sa.Numeric(8, 4)),
        sa.Column('correlation',     sa.Numeric(6, 4)),
        sa.Column('diversif_benefit',sa.Numeric(8, 4)),
        sa.Column('run_date',        sa.Date),
        sa.Column('created_at',      sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_cvar_results_scenario', 'climate_cvar_results', ['scenario_name'])
    op.create_index('ix_cvar_results_portfolio', 'climate_cvar_results', ['portfolio_id'])

    # ------------------------------------------------------------------ #
    # supervisory_stress_submissions — regulatory stress test tracking    #
    # (EP-DB3)                                                            #
    # ------------------------------------------------------------------ #
    op.create_table(
        'supervisory_stress_submissions',
        sa.Column('id',                  sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('institution_name',    sa.String(200), nullable=False),
        sa.Column('regulator',           sa.String(50)),   # ECB, PRA, OSFI, FED
        sa.Column('scenario_name',       sa.String(100)),
        sa.Column('submission_status',   sa.String(50)),   # Completed, In Progress, Not Started
        sa.Column('submission_deadline', sa.Date),
        sa.Column('stressed_capital',    sa.Numeric(8, 4)),
        sa.Column('capital_shortfall_bn',sa.Numeric(12, 2), default=0),
        sa.Column('adverse_multiplier',  sa.Numeric(6, 3)),
        sa.Column('credit_loss_rate',    sa.Numeric(6, 4)),
        sa.Column('nii_impact_pct',      sa.Numeric(8, 4)),
        sa.Column('template_coverage_pct',sa.Numeric(6, 2)),
        sa.Column('submission_date',     sa.Date),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_stress_submissions_institution', 'supervisory_stress_submissions', ['institution_name'])
    op.create_index('ix_stress_submissions_regulator', 'supervisory_stress_submissions', ['regulator'])

    # ------------------------------------------------------------------ #
    # climate_risk_premia — credit spread decomposition (EP-DB4)         #
    # ------------------------------------------------------------------ #
    op.create_table(
        'climate_risk_premia',
        sa.Column('id',                   sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('issuer_name',          sa.String(200), nullable=False),
        sa.Column('sector',               sa.String(100)),
        sa.Column('credit_rating',        sa.String(10)),
        sa.Column('geography',            sa.String(50)),
        sa.Column('maturity_years',       sa.Integer),
        sa.Column('total_spread_bps',     sa.Numeric(10, 2)),
        sa.Column('physical_premium_bps', sa.Numeric(10, 2)),
        sa.Column('transition_premium_bps',sa.Numeric(10, 2)),
        sa.Column('residual_premium_bps', sa.Numeric(10, 2)),
        sa.Column('physical_risk_score',  sa.Numeric(6, 2)),
        sa.Column('transition_risk_score',sa.Numeric(6, 2)),
        sa.Column('climate_pd',           sa.Numeric(8, 6)),
        sa.Column('climate_adj_spread',   sa.Numeric(10, 2)),
        sa.Column('as_of_date',           sa.Date),
        sa.Column('created_at',           sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_risk_premia_issuer', 'climate_risk_premia', ['issuer_name'])
    op.create_index('ix_risk_premia_sector', 'climate_risk_premia', ['sector'])

    # ------------------------------------------------------------------ #
    # enterprise_climate_exposures — cross-entity aggregation (EP-DB5)   #
    # ------------------------------------------------------------------ #
    op.create_table(
        'enterprise_climate_exposures',
        sa.Column('id',               sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_name',      sa.String(200), nullable=False),
        sa.Column('business_line',    sa.String(100)),
        sa.Column('asset_class',      sa.String(100)),
        sa.Column('exposure_mn',      sa.Numeric(14, 2)),
        sa.Column('phys_risk_score',  sa.Numeric(6, 2)),
        sa.Column('trans_risk_score', sa.Numeric(6, 2)),
        sa.Column('climate_var_95_mn',sa.Numeric(14, 2)),
        sa.Column('concentration_score', sa.Numeric(6, 2)),
        sa.Column('ngfs_scenario',    sa.String(100)),
        sa.Column('as_of_date',       sa.Date),
        sa.Column('created_at',       sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_ent_climate_entity', 'enterprise_climate_exposures', ['entity_name'])
    op.create_index('ix_ent_climate_asset', 'enterprise_climate_exposures', ['asset_class'])

    # ------------------------------------------------------------------ #
    # systemic_risk_indicators — central bank / macro-prudential (EP-DB6)#
    # ------------------------------------------------------------------ #
    op.create_table(
        'systemic_risk_indicators',
        sa.Column('id',              sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('indicator_name',  sa.String(200), nullable=False),
        sa.Column('sector',          sa.String(100)),
        sa.Column('value',           sa.Numeric(8, 2)),
        sa.Column('threshold',       sa.Numeric(8, 2)),
        sa.Column('breaching',       sa.Boolean, default=False),
        sa.Column('direction',       sa.String(20)),   # higher_worse, lower_worse
        sa.Column('systemic_risk_index', sa.Numeric(8, 2)),
        sa.Column('contagion_score', sa.Numeric(8, 2)),
        sa.Column('ngfs_scenario',   sa.String(100)),
        sa.Column('horizon_year',    sa.Integer),
        sa.Column('as_of_date',      sa.Date),
        sa.Column('created_at',      sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_systemic_risk_indicator', 'systemic_risk_indicators', ['indicator_name'])
    op.create_index('ix_systemic_risk_sector',    'systemic_risk_indicators', ['sector'])


def downgrade():
    op.drop_index('ix_systemic_risk_sector',     table_name='systemic_risk_indicators')
    op.drop_index('ix_systemic_risk_indicator',  table_name='systemic_risk_indicators')
    op.drop_table('systemic_risk_indicators')

    op.drop_index('ix_ent_climate_asset',  table_name='enterprise_climate_exposures')
    op.drop_index('ix_ent_climate_entity', table_name='enterprise_climate_exposures')
    op.drop_table('enterprise_climate_exposures')

    op.drop_index('ix_risk_premia_sector',  table_name='climate_risk_premia')
    op.drop_index('ix_risk_premia_issuer',  table_name='climate_risk_premia')
    op.drop_table('climate_risk_premia')

    op.drop_index('ix_stress_submissions_regulator',   table_name='supervisory_stress_submissions')
    op.drop_index('ix_stress_submissions_institution', table_name='supervisory_stress_submissions')
    op.drop_table('supervisory_stress_submissions')

    op.drop_index('ix_cvar_results_portfolio', table_name='climate_cvar_results')
    op.drop_index('ix_cvar_results_scenario',  table_name='climate_cvar_results')
    op.drop_table('climate_cvar_results')

    op.drop_index('ix_climate_capital_jurisdiction', table_name='climate_capital_assessments')
    op.drop_index('ix_climate_capital_institution',  table_name='climate_capital_assessments')
    op.drop_table('climate_capital_assessments')
