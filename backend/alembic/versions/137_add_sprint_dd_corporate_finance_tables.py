"""add sprint DD corporate finance tables

Revision ID: 137_sprint_dd
Revises: 134
Create Date: 2026-04-10

Sprint DD — Corporate Finance & Capital Markets
Tables: ep_dd1_wacc_profiles, ep_dd2_green_instruments, ep_dd3_ma_targets,
        ep_dd4_valuation_models, ep_dd5_treasury_exposures, ep_dd6_climate_instruments
"""
from alembic import op
import sqlalchemy as sa

revision = '137_sprint_dd'
down_revision = '134'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'ep_dd1_wacc_profiles',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('company_name', sa.String(255)),
        sa.Column('ticker', sa.String(10)),
        sa.Column('sector', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('market_cap_bn', sa.Float),
        sa.Column('base_wacc', sa.Float),
        sa.Column('equity_cost', sa.Float),
        sa.Column('debt_cost', sa.Float),
        sa.Column('tax_rate', sa.Float),
        sa.Column('debt_weight', sa.Float),
        sa.Column('equity_weight', sa.Float),
        sa.Column('beta', sa.Float),
        sa.Column('climate_risk_premium', sa.Float),
        sa.Column('green_discount', sa.Float),
        sa.Column('physical_risk_adj', sa.Float),
        sa.Column('transition_risk_adj', sa.Float),
        sa.Column('adjusted_wacc', sa.Float),
        sa.Column('esg_score', sa.Float),
        sa.Column('carbon_intensity', sa.Float),
        sa.Column('sbti_aligned', sa.Boolean),
        sa.Column('nz_target', sa.Boolean),
        sa.Column('spread_bps', sa.Integer),
        sa.Column('rating', sa.String(10)),
        sa.Column('credit_outlook', sa.String(20)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'ep_dd2_green_instruments',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('instrument_name', sa.String(255)),
        sa.Column('issuer', sa.String(255)),
        sa.Column('sector', sa.String(100)),
        sa.Column('instrument_type', sa.String(100)),
        sa.Column('notional_bn', sa.Float),
        sa.Column('coupon_pct', sa.Float),
        sa.Column('maturity_year', sa.Integer),
        sa.Column('greenium_bps', sa.Float),
        sa.Column('kpi_target', sa.Float),
        sa.Column('kpi_actual', sa.Float),
        sa.Column('use_of_proceeds', sa.String(255)),
        sa.Column('verifier', sa.String(100)),
        sa.Column('framework', sa.String(255)),
        sa.Column('spo_bond', sa.Boolean),
        sa.Column('rating', sa.String(10)),
        sa.Column('currency', sa.String(5)),
        sa.Column('region', sa.String(100)),
        sa.Column('oversub_ratio', sa.Float),
        sa.Column('bid_cover', sa.Float),
        sa.Column('climate_impact_mn', sa.Float),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'ep_dd3_ma_targets',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('company_name', sa.String(255)),
        sa.Column('sector', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('enterprise_value_bn', sa.Float),
        sa.Column('revenue_bn', sa.Float),
        sa.Column('ebitda_bn', sa.Float),
        sa.Column('scope1_ktco2', sa.Float),
        sa.Column('scope2_ktco2', sa.Float),
        sa.Column('scope3_ktco2', sa.Float),
        sa.Column('carbon_intensity', sa.Float),
        sa.Column('physical_risk_score', sa.Float),
        sa.Column('transition_risk_score', sa.Float),
        sa.Column('regulatory_risk', sa.Float),
        sa.Column('stranded_asset_pct', sa.Float),
        sa.Column('sbti_status', sa.String(50)),
        sa.Column('nz_commitment', sa.Boolean),
        sa.Column('esg_score', sa.Float),
        sa.Column('litigation_risk', sa.Float),
        sa.Column('climate_val_adj_pct', sa.Float),
        sa.Column('green_revenue_pct', sa.Float),
        sa.Column('fossil_revenue_pct', sa.Float),
        sa.Column('capex_green_pct', sa.Float),
        sa.Column('deal_status', sa.String(50)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'ep_dd4_valuation_models',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('company_name', sa.String(255)),
        sa.Column('ticker', sa.String(10)),
        sa.Column('sector', sa.String(100)),
        sa.Column('base_ev_bn', sa.Float),
        sa.Column('revenue_bn', sa.Float),
        sa.Column('ebitda_bn', sa.Float),
        sa.Column('fcf_bn', sa.Float),
        sa.Column('growth_rate', sa.Float),
        sa.Column('wacc', sa.Float),
        sa.Column('scope1_ktco2', sa.Float),
        sa.Column('scope2_ktco2', sa.Float),
        sa.Column('scope3_intensity', sa.Float),
        sa.Column('carbon_cost_passthrough', sa.Float),
        sa.Column('sbti_aligned', sa.Boolean),
        sa.Column('sbti_target', sa.String(100)),
        sa.Column('net_zero_year', sa.Integer),
        sa.Column('stranded_pct', sa.Float),
        sa.Column('fossil_capex_bn', sa.Float),
        sa.Column('green_capex_bn', sa.Float),
        sa.Column('carbon_beta', sa.Float),
        sa.Column('esg_premium', sa.Float),
        sa.Column('analyst_target_bn', sa.Float),
        sa.Column('current_price_bn', sa.Float),
        sa.Column('terminal_growth', sa.Float),
        sa.Column('carbon_adjusted_ev_bn', sa.Float),
        sa.Column('sbti_premium_pct', sa.Float),
        sa.Column('stranded_discount_pct', sa.Float),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'ep_dd5_treasury_exposures',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('counterparty_name', sa.String(255)),
        sa.Column('sector', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('climate_rating', sa.String(10)),
        sa.Column('pd_1y', sa.Float),
        sa.Column('lgd', sa.Float),
        sa.Column('ead_mn', sa.Float),
        sa.Column('climate_var_mn', sa.Float),
        sa.Column('physical_risk', sa.Float),
        sa.Column('transition_risk', sa.Float),
        sa.Column('sbti_status', sa.String(50)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'ep_dd6_climate_instruments',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('instrument_name', sa.String(255)),
        sa.Column('issuer', sa.String(255)),
        sa.Column('instrument_type', sa.String(100)),
        sa.Column('sector', sa.String(100)),
        sa.Column('notional_bn', sa.Float),
        sa.Column('yield_pct', sa.Float),
        sa.Column('spread_bps', sa.Integer),
        sa.Column('greenium_bps', sa.Float),
        sa.Column('rating', sa.String(10)),
        sa.Column('region', sa.String(100)),
        sa.Column('maturity_year', sa.Integer),
        sa.Column('volume_30d_mn', sa.Float),
        sa.Column('bid_ask_bps', sa.Float),
        sa.Column('liquidity_score', sa.Float),
        sa.Column('impact_score', sa.Float),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade():
    op.drop_table('ep_dd6_climate_instruments')
    op.drop_table('ep_dd5_treasury_exposures')
    op.drop_table('ep_dd4_valuation_models')
    op.drop_table('ep_dd3_ma_targets')
    op.drop_table('ep_dd2_green_instruments')
    op.drop_table('ep_dd1_wacc_profiles')
