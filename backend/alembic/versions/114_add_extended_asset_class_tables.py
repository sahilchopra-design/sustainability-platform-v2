"""Add sovereign, private assets, structured credit, commodity derivatives, insurance portfolio, PCAF universal tables (Sprint CI)

Revision ID: 114
Revises: 113
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '114'
down_revision = '113'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('sovereign_climate_risk', sa.Column('id', sa.Integer, primary_key=True), sa.Column('country_code', sa.String(3), index=True), sa.Column('country_name', sa.String(100)), sa.Column('nd_gain_score', sa.Numeric(5,2)), sa.Column('fossil_export_pct_gdp', sa.Numeric(5,2)), sa.Column('sovereign_rating', sa.String(10)), sa.Column('climate_adjusted_spread_bps', sa.Numeric(8,2)), sa.Column('stranded_revenue_usd_bn', sa.Numeric(10,2)), sa.Column('itr_degrees', sa.Numeric(4,2)), sa.Column('ndc_ambition_score', sa.Integer), sa.Column('scenario_data', JSONB))
    op.create_table('private_assets_transition', sa.Column('id', sa.Integer, primary_key=True), sa.Column('fund_id', sa.String(50), index=True), sa.Column('fund_name', sa.String(200)), sa.Column('strategy', sa.String(50)), sa.Column('vintage_year', sa.Integer), sa.Column('nav_usd_m', sa.Numeric(12,2)), sa.Column('portfolio_companies', JSONB), sa.Column('climate_score', sa.Integer), sa.Column('exit_haircut_pct', sa.Numeric(5,2)), sa.Column('gp_engagement_score', sa.Integer), sa.Column('dd_checklist', JSONB))
    op.create_table('structured_credit_climate', sa.Column('id', sa.Integer, primary_key=True), sa.Column('deal_id', sa.String(50), index=True), sa.Column('deal_type', sa.String(20)), sa.Column('pool_size', sa.Integer), sa.Column('collateral_type', sa.String(50)), sa.Column('physical_risk_overlay', JSONB), sa.Column('tranche_losses', JSONB), sa.Column('pcaf_class', sa.Integer), sa.Column('climate_haircut_pct', sa.Numeric(5,2)), sa.Column('scenario', sa.String(50)))
    op.create_table('commodity_derivatives_climate', sa.Column('id', sa.Integer, primary_key=True), sa.Column('commodity', sa.String(50)), sa.Column('contract_type', sa.String(20)), sa.Column('scenario', sa.String(50)), sa.Column('forward_curve', JSONB), sa.Column('climate_premium_bps', sa.Numeric(8,2)), sa.Column('contango_shift', JSONB), sa.Column('spread_data', JSONB), sa.Column('hedging_strategy', JSONB))
    op.create_table('insurance_portfolio_climate', sa.Column('id', sa.Integer, primary_key=True), sa.Column('insurer_id', sa.String(50), index=True), sa.Column('portfolio_type', sa.String(20)), sa.Column('investment_climate_score', sa.Integer), sa.Column('underwriting_stress', JSONB), sa.Column('reserve_adequacy_pct', sa.Numeric(5,2)), sa.Column('orsa_climate_score', sa.Integer), sa.Column('scr_climate_addon_pct', sa.Numeric(5,2)), sa.Column('esg_rating', sa.String(5)))
    op.create_table('pcaf_universal_attribution', sa.Column('id', sa.Integer, primary_key=True), sa.Column('portfolio_id', sa.String(50), index=True), sa.Column('asset_class', sa.Integer), sa.Column('asset_class_name', sa.String(100)), sa.Column('attribution_formula', sa.Text), sa.Column('financed_emissions_tco2', sa.Numeric(14,2)), sa.Column('data_quality_score', sa.Integer), sa.Column('waci', sa.Numeric(10,2)), sa.Column('target_trajectory', JSONB), sa.Column('gap_analysis', JSONB))


def downgrade():
    op.drop_table('pcaf_universal_attribution')
    op.drop_table('insurance_portfolio_climate')
    op.drop_table('commodity_derivatives_climate')
    op.drop_table('structured_credit_climate')
    op.drop_table('private_assets_transition')
    op.drop_table('sovereign_climate_risk')
