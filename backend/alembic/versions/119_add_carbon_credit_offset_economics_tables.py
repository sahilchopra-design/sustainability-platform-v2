"""Add carbon credit pricing, permanence risk, offset optimizer, quality screener, portfolio tracker, market intelligence tables (Sprint CN)

Revision ID: 119
Revises: 118
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '119'
down_revision = '118'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('carbon_credit_pricing_models', sa.Column('id', sa.Integer, primary_key=True), sa.Column('credit_type', sa.String(100)), sa.Column('methodology', sa.String(100)), sa.Column('vintage_year', sa.Integer), sa.Column('base_price_usd', sa.Numeric(8,2)), sa.Column('vintage_factor', sa.Numeric(5,3)), sa.Column('methodology_factor', sa.Numeric(5,3)), sa.Column('verification_factor', sa.Numeric(5,3)), sa.Column('permanence_factor', sa.Numeric(5,3)), sa.Column('liquidity_factor', sa.Numeric(5,3)), sa.Column('fair_price_usd', sa.Numeric(8,2)), sa.Column('market_price_usd', sa.Numeric(8,2)))
    op.create_table('offset_permanence_risk', sa.Column('id', sa.Integer, primary_key=True), sa.Column('project_type', sa.String(100)), sa.Column('reversal_probability_decade', sa.Numeric(5,3)), sa.Column('buffer_pool_pct', sa.Numeric(5,2)), sa.Column('climate_reversal_risk', sa.Numeric(5,3)), sa.Column('insurance_available', sa.Boolean), sa.Column('expected_permanence_years', sa.Integer), sa.Column('stress_test_results', JSONB), sa.Column('circular_risk_factor', sa.Numeric(5,3)))
    op.create_table('corporate_offset_strategies', sa.Column('id', sa.Integer, primary_key=True), sa.Column('company_id', sa.String(50), index=True), sa.Column('annual_offset_need_tco2', sa.Numeric(12,2)), sa.Column('budget_usd', sa.Numeric(10,2)), sa.Column('quality_target', sa.Integer), sa.Column('optimal_blend', JSONB), sa.Column('vintage_schedule', JSONB), sa.Column('regulatory_acceptance', JSONB), sa.Column('cost_frontier', JSONB))
    op.create_table('credit_quality_screening', sa.Column('id', sa.Integer, primary_key=True), sa.Column('credit_id', sa.String(50), index=True), sa.Column('icvcm_ccp_scores', JSONB), sa.Column('additionality_score', sa.Integer), sa.Column('leakage_risk_score', sa.Integer), sa.Column('co_benefit_score', sa.Integer), sa.Column('red_flags', JSONB), sa.Column('composite_quality', sa.Integer), sa.Column('screening_result', sa.String(10)))
    op.create_table('offset_portfolio_positions', sa.Column('id', sa.Integer, primary_key=True), sa.Column('portfolio_id', sa.String(50), index=True), sa.Column('credit_type', sa.String(100)), sa.Column('vintage', sa.Integer), sa.Column('quantity_tco2', sa.Numeric(12,2)), sa.Column('cost_basis_usd', sa.Numeric(10,2)), sa.Column('market_value_usd', sa.Numeric(10,2)), sa.Column('retirement_schedule', JSONB), sa.Column('performance_vs_plan', JSONB))
    op.create_table('carbon_market_intelligence', sa.Column('id', sa.Integer, primary_key=True), sa.Column('market_type', sa.String(20)), sa.Column('region', sa.String(50)), sa.Column('volume_mtco2', sa.Numeric(12,2)), sa.Column('value_usd_bn', sa.Numeric(10,2)), sa.Column('price_trend', JSONB), sa.Column('issuance_retirement_ratio', sa.Numeric(5,2)), sa.Column('policy_developments', JSONB), sa.Column('forecast_models', JSONB), sa.Column('year', sa.Integer))


def downgrade():
    op.drop_table('carbon_market_intelligence')
    op.drop_table('offset_portfolio_positions')
    op.drop_table('credit_quality_screening')
    op.drop_table('corporate_offset_strategies')
    op.drop_table('offset_permanence_risk')
    op.drop_table('carbon_credit_pricing_models')
