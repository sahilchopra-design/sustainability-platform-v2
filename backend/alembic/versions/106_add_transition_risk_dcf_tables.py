"""add transition risk DCF and stranded asset tables

Revision ID: 106
Revises: 105
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '106'
down_revision = '105'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Carbon price trajectory runs — NGFS multi-scenario
    op.create_table('transition_carbon_price_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('run_name', sa.String(200)),
        sa.Column('scenario', sa.String(50)),            # current_policies, delayed_transition, net_zero_2050, divergent_net_zero, below_2c
        sa.Column('base_year', sa.Integer()),
        sa.Column('horizon_year', sa.Integer()),
        sa.Column('initial_price_usd', sa.Numeric(12, 2)),
        sa.Column('trajectory', JSONB),                  # [{year, price_usd, growth_rate, cumulative_change_pct}]
        sa.Column('carbon_cost_passthrough', JSONB),     # [{sector, passthrough_rate, revenue_impact_pct}]
        sa.Column('model_params', JSONB),                # {g0, beta, gamma, alpha, T_cycle}
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

    # DCF impairment runs — per-asset, per-scenario
    op.create_table('transition_dcf_impairment_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('asset_id', sa.String(50)),
        sa.Column('asset_name', sa.String(200)),
        sa.Column('asset_class', sa.String(50)),         # equity, bond, loan, real_estate, infrastructure
        sa.Column('sector', sa.String(100)),
        sa.Column('book_value_usd_mn', sa.Numeric(16, 2)),
        sa.Column('scenario', sa.String(50)),
        sa.Column('wacc_base', sa.Numeric(8, 4)),
        sa.Column('wacc_climate_adjusted', sa.Numeric(8, 4)),
        sa.Column('dcf_base_npv', sa.Numeric(16, 2)),
        sa.Column('dcf_adjusted_npv', sa.Numeric(16, 2)),
        sa.Column('impairment_usd_mn', sa.Numeric(16, 2)),
        sa.Column('impairment_pct', sa.Numeric(8, 4)),
        sa.Column('cash_flow_trajectory', JSONB),        # [{year, base_cf, adjusted_cf, carbon_cost, revenue_impact}]
        sa.Column('carbon_cost_year_by_year', JSONB),
        sa.Column('stranded_capex_usd_mn', sa.Numeric(16, 2)),
        sa.Column('stranded_year', sa.Integer()),        # year asset becomes economically unviable
        sa.Column('impairment_trigger', sa.String(100)), # carbon_price, regulation, demand_shift, tech_displacement
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

    # Stranded asset portfolio — aggregated view
    op.create_table('stranded_asset_portfolio',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('portfolio_name', sa.String(200)),
        sa.Column('scenario', sa.String(50)),
        sa.Column('valuation_date', sa.Date()),
        sa.Column('total_aum_usd_mn', sa.Numeric(16, 2)),
        sa.Column('stranded_exposure_usd_mn', sa.Numeric(16, 2)),
        sa.Column('stranded_exposure_pct', sa.Numeric(8, 4)),
        sa.Column('sector_breakdown', JSONB),            # [{sector, exposure_usd_mn, stranded_pct, write_down_year}]
        sa.Column('write_down_schedule', JSONB),         # [{year, cumulative_write_down_usd_mn, pct_of_aum}]
        sa.Column('residual_value_curve', JSONB),        # [{year, residual_value_pct}]
        sa.Column('top_stranded_assets', JSONB),
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

    # Technology displacement scenarios
    op.create_table('tech_displacement_scenarios',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('technology', sa.String(100)),         # solar_pv, wind, ev, heat_pump, green_hydrogen, ccs
        sa.Column('incumbent_technology', sa.String(100)),
        sa.Column('sector', sa.String(100)),
        sa.Column('scenario', sa.String(50)),
        sa.Column('s_curve_params', JSONB),              # {k, t_mid, L_max} logistic growth params
        sa.Column('adoption_trajectory', JSONB),         # [{year, market_share_pct, lcoe_usd_mwh, cost_reduction_pct}]
        sa.Column('disruption_year', sa.Integer()),      # 50% market share crossover
        sa.Column('stranded_capacity_gw', sa.Numeric(12, 2)),
        sa.Column('stranded_value_usd_bn', sa.Numeric(12, 2)),
        sa.Column('job_displacement_thousands', sa.Numeric(10, 1)),
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('tech_displacement_scenarios')
    op.drop_table('stranded_asset_portfolio')
    op.drop_table('transition_dcf_impairment_runs')
    op.drop_table('transition_carbon_price_runs')
