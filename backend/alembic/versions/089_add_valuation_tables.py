"""add valuation engine tables for DCF, real options, stranded assets, infrastructure, real estate

Revision ID: 089
Revises: 088
Create Date: 2026-04-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers
revision = '089'
down_revision = '088'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. dcf_valuations ────────────────────────────────────────────────────
    # Climate-adjusted DCF valuation results
    op.create_table('dcf_valuations',
        sa.Column('id',                      postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('asset_id',                sa.String(100),  nullable=False),
        sa.Column('asset_name',              sa.String(200)),
        sa.Column('sector',                  sa.String(50)),
        sa.Column('scenario',                sa.String(50)),
        sa.Column('base_revenue',            sa.Numeric(20, 4)),
        sa.Column('wacc',                    sa.Numeric(6, 4)),
        sa.Column('terminal_growth',         sa.Numeric(6, 4)),
        sa.Column('operating_margin',        sa.Numeric(6, 4)),
        sa.Column('carbon_price_2030',       sa.Numeric(10, 2)),
        sa.Column('carbon_price_2050',       sa.Numeric(10, 2)),
        sa.Column('emissions_intensity',     sa.Numeric(10, 4)),
        sa.Column('climate_risk_premium',    sa.Numeric(6, 4)),
        sa.Column('projection_years',        sa.Integer),
        sa.Column('npv',                     sa.Numeric(20, 4)),
        sa.Column('pv_cash_flows',           sa.Numeric(20, 4)),
        sa.Column('terminal_value',          sa.Numeric(20, 4)),
        sa.Column('pv_terminal_value',       sa.Numeric(20, 4)),
        sa.Column('effective_discount_rate', sa.Numeric(6, 4)),
        sa.Column('cash_flow_schedule',      JSONB),
        sa.Column('sensitivity_matrix',      JSONB),
        sa.Column('org_id',                  postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',              sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('created_by',              sa.String(100)),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_dcf_asset_id', 'dcf_valuations', ['asset_id'], unique=False)
    op.create_index('idx_dcf_org_id',   'dcf_valuations', ['org_id'],   unique=False)

    # ── 2. dcf_monte_carlo_runs ───────────────────────────────────────────────
    # Monte Carlo simulation results
    op.create_table('dcf_monte_carlo_runs',
        sa.Column('id',                          postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('dcf_valuation_id',            postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('dcf_valuations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('n_simulations',               sa.Integer),
        sa.Column('revenue_volatility',          sa.Numeric(6, 4)),
        sa.Column('carbon_price_volatility',     sa.Numeric(6, 4)),
        sa.Column('revenue_carbon_correlation',  sa.Numeric(5, 3)),
        sa.Column('mean_npv',                    sa.Numeric(20, 4)),
        sa.Column('median_npv',                  sa.Numeric(20, 4)),
        sa.Column('std_npv',                     sa.Numeric(20, 4)),
        sa.Column('var_95',                      sa.Numeric(20, 4)),
        sa.Column('var_99',                      sa.Numeric(20, 4)),
        sa.Column('p_positive_npv',              sa.Numeric(5, 4)),
        sa.Column('percentile_5',                sa.Numeric(20, 4)),
        sa.Column('percentile_25',               sa.Numeric(20, 4)),
        sa.Column('percentile_75',               sa.Numeric(20, 4)),
        sa.Column('percentile_95',               sa.Numeric(20, 4)),
        sa.Column('npv_distribution',            JSONB),
        sa.Column('org_id',                      postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',                  sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_mc_valuation_id', 'dcf_monte_carlo_runs', ['dcf_valuation_id'], unique=False)

    # ── 3. real_option_valuations ─────────────────────────────────────────────
    # Black-Scholes / binomial real options
    op.create_table('real_option_valuations',
        sa.Column('id',               postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('asset_id',         sa.String(100),  nullable=False),
        sa.Column('option_type',      sa.String(20),   nullable=False),   # expand/abandon/defer/switch
        sa.Column('underlying_value', sa.Numeric(20, 4)),
        sa.Column('strike_price',     sa.Numeric(20, 4)),
        sa.Column('volatility',       sa.Numeric(6, 4)),
        sa.Column('time_to_maturity', sa.Numeric(6, 2)),
        sa.Column('risk_free_rate',   sa.Numeric(6, 4)),
        sa.Column('dividend_yield',   sa.Numeric(6, 4)),
        sa.Column('option_value',     sa.Numeric(20, 4)),
        sa.Column('option_delta',     sa.Numeric(10, 6)),
        sa.Column('option_gamma',     sa.Numeric(10, 6)),
        sa.Column('option_theta',     sa.Numeric(10, 6)),
        sa.Column('option_vega',      sa.Numeric(10, 6)),
        sa.Column('option_rho',       sa.Numeric(10, 6)),
        sa.Column('method',           sa.String(20),   server_default='black_scholes'),
        sa.Column('climate_context',  JSONB),
        sa.Column('org_id',           postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',       sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_real_option_asset', 'real_option_valuations', ['asset_id'], unique=False)

    # ── 4. stranded_asset_assessments ────────────────────────────────────────
    # Stranded asset risk assessments
    op.create_table('stranded_asset_assessments',
        sa.Column('id',                          postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('asset_id',                    sa.String(100),  nullable=False),
        sa.Column('asset_name',                  sa.String(200)),
        sa.Column('sector',                      sa.String(50)),
        sa.Column('asset_type',                  sa.String(50)),
        sa.Column('book_value',                  sa.Numeric(20, 4)),
        sa.Column('remaining_life_years',        sa.Integer),
        sa.Column('carbon_intensity',            sa.Numeric(10, 4)),
        sa.Column('carbon_intensity_unit',       sa.String(30)),
        sa.Column('carbon_price_scenario',       sa.String(50)),
        sa.Column('stranding_year',              sa.Integer),
        sa.Column('stranding_probability',       sa.Numeric(5, 4)),
        sa.Column('npv_haircut_pct',             sa.Numeric(8, 4)),
        sa.Column('stranded_value',              sa.Numeric(20, 4)),
        sa.Column('climate_adjusted_value',      sa.Numeric(20, 4)),
        sa.Column('cumulative_stranded_timeline', JSONB),
        sa.Column('org_id',                      postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',                  sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_stranded_asset',    'stranded_asset_assessments', ['asset_id'],             unique=False)
    op.create_index('idx_stranded_scenario', 'stranded_asset_assessments', ['carbon_price_scenario'], unique=False)

    # ── 5. infrastructure_projects ───────────────────────────────────────────
    # Infrastructure project finance models
    op.create_table('infrastructure_projects',
        sa.Column('id',                   postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_name',         sa.String(200), nullable=False),
        sa.Column('project_type',         sa.String(50)),
        sa.Column('sector',               sa.String(50)),
        sa.Column('country',              sa.String(50)),
        sa.Column('capex_gbm',            sa.Numeric(20, 4)),
        sa.Column('equity_pct',           sa.Numeric(6, 4)),
        sa.Column('debt_pct',             sa.Numeric(6, 4)),
        sa.Column('revenue_model',        sa.String(50)),
        sa.Column('target_irr',           sa.Numeric(6, 4)),
        sa.Column('base_irr',             sa.Numeric(6, 4)),
        sa.Column('equity_irr',           sa.Numeric(6, 4)),
        sa.Column('dscr_min',             sa.Numeric(8, 4)),
        sa.Column('dscr_avg',             sa.Numeric(8, 4)),
        sa.Column('construction_risk_score', sa.Numeric(5, 2)),
        sa.Column('operational_year',     sa.Integer),
        sa.Column('payback_years',        sa.Numeric(6, 1)),
        sa.Column('npv_at_8pct',          sa.Numeric(20, 4)),
        sa.Column('rab_value',            sa.Numeric(20, 4)),
        sa.Column('allowed_return',       sa.Numeric(6, 4)),
        sa.Column('actual_roce',          sa.Numeric(6, 4)),
        sa.Column('regulatory_period',    sa.String(50)),
        sa.Column('regulatory_body',      sa.String(50)),
        sa.Column('sensitivity_analysis', JSONB),
        sa.Column('esg_score',            sa.Numeric(5, 2)),
        sa.Column('greenium_bps',         sa.Numeric(8, 2)),
        sa.Column('org_id',               postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',           sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_infra_type', 'infrastructure_projects', ['project_type'], unique=False)
    op.create_index('idx_infra_org',  'infrastructure_projects', ['org_id'],       unique=False)

    # ── 6. real_estate_valuations ─────────────────────────────────────────────
    # Real estate valuation with climate risk
    op.create_table('real_estate_valuations',
        sa.Column('id',                         postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('property_id',                sa.String(100)),
        sa.Column('property_name',              sa.String(200)),
        sa.Column('property_type',              sa.String(50)),
        sa.Column('location',                   sa.String(100)),
        sa.Column('city',                       sa.String(50)),
        sa.Column('gia_sqft',                   sa.Numeric(12, 2)),
        sa.Column('noi_gbm',                    sa.Numeric(20, 4)),
        sa.Column('cap_rate',                   sa.Numeric(6, 4)),
        sa.Column('gross_value',                sa.Numeric(20, 4)),
        sa.Column('epc_rating',                 sa.String(2)),
        sa.Column('breeam_rating',              sa.String(20)),
        sa.Column('year_built',                 sa.Integer),
        sa.Column('green_premium_pct',          sa.Numeric(8, 4)),
        sa.Column('brown_discount_pct',         sa.Numeric(8, 4)),
        sa.Column('flood_risk_score',           sa.Numeric(5, 2)),
        sa.Column('heat_stress_score',          sa.Numeric(5, 2)),
        sa.Column('subsidence_risk_score',      sa.Numeric(5, 2)),
        sa.Column('coastal_risk_score',         sa.Numeric(5, 2)),
        sa.Column('wildfire_risk_score',        sa.Numeric(5, 2)),
        sa.Column('total_physical_risk_score',  sa.Numeric(5, 2)),
        sa.Column('climate_scenario',           sa.String(50)),
        sa.Column('climate_haircut_pct',        sa.Numeric(8, 4)),
        sa.Column('climate_adjusted_value',     sa.Numeric(20, 4)),
        sa.Column('gresb_score',                sa.Numeric(5, 2)),
        sa.Column('carbon_intensity_kgco2_m2',  sa.Numeric(10, 4)),
        sa.Column('energy_intensity_kwh_m2',    sa.Numeric(10, 4)),
        sa.Column('water_intensity_m3_m2',      sa.Numeric(10, 4)),
        sa.Column('org_id',                     postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',                 sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_re_property', 'real_estate_valuations', ['property_id'], unique=False)
    op.create_index('idx_re_city',     'real_estate_valuations', ['city'],        unique=False)
    op.create_index('idx_re_org',      'real_estate_valuations', ['org_id'],      unique=False)


def downgrade() -> None:
    op.drop_index('idx_re_org',      table_name='real_estate_valuations')
    op.drop_index('idx_re_city',     table_name='real_estate_valuations')
    op.drop_index('idx_re_property', table_name='real_estate_valuations')
    op.drop_table('real_estate_valuations')

    op.drop_index('idx_infra_org',  table_name='infrastructure_projects')
    op.drop_index('idx_infra_type', table_name='infrastructure_projects')
    op.drop_table('infrastructure_projects')

    op.drop_index('idx_stranded_scenario', table_name='stranded_asset_assessments')
    op.drop_index('idx_stranded_asset',    table_name='stranded_asset_assessments')
    op.drop_table('stranded_asset_assessments')

    op.drop_index('idx_real_option_asset', table_name='real_option_valuations')
    op.drop_table('real_option_valuations')

    op.drop_index('idx_mc_valuation_id', table_name='dcf_monte_carlo_runs')
    op.drop_table('dcf_monte_carlo_runs')

    op.drop_index('idx_dcf_org_id',   table_name='dcf_valuations')
    op.drop_index('idx_dcf_asset_id', table_name='dcf_valuations')
    op.drop_table('dcf_valuations')
