"""Add critical mineral, grid stability, hydrogen economy, nuclear SMR, NETs, tech disruption watchlist tables (Sprint CL)

Revision ID: 117
Revises: 116
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '117'
down_revision = '116'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('critical_mineral_constraints', sa.Column('id', sa.Integer, primary_key=True), sa.Column('mineral', sa.String(50)), sa.Column('supply_mt', sa.Numeric(10,2)), sa.Column('demand_mt', sa.Numeric(10,2)), sa.Column('gap_mt', sa.Numeric(10,2)), sa.Column('price_usd_t', sa.Numeric(10,2)), sa.Column('hhi_concentration', sa.Numeric(6,4)), sa.Column('recycling_pct', sa.Numeric(5,2)), sa.Column('substitution_elasticity', sa.Numeric(5,3)), sa.Column('geopolitical_risk', JSONB), sa.Column('year', sa.Integer))
    op.create_table('grid_stability_scenarios', sa.Column('id', sa.Integer, primary_key=True), sa.Column('region', sa.String(100)), sa.Column('re_penetration_pct', sa.Numeric(5,2)), sa.Column('inertia_index', sa.Numeric(5,2)), sa.Column('storage_gwh_needed', sa.Numeric(10,2)), sa.Column('curtailment_pct', sa.Numeric(5,2)), sa.Column('interconnector_value_usd_m', sa.Numeric(10,2)), sa.Column('capacity_market_price', sa.Numeric(8,2)), sa.Column('stability_risk_score', sa.Integer), sa.Column('year', sa.Integer))
    op.create_table('hydrogen_economy_models', sa.Column('id', sa.Integer, primary_key=True), sa.Column('h2_type', sa.String(20)), sa.Column('cost_usd_kg', sa.Numeric(6,2)), sa.Column('parity_year', sa.Integer), sa.Column('electrolyzer_type', sa.String(30)), sa.Column('electrolyzer_cost_kw', sa.Numeric(8,2)), sa.Column('demand_sector', sa.String(50)), sa.Column('demand_mt', sa.Numeric(8,2)), sa.Column('infrastructure_km', sa.Numeric(10,0)), sa.Column('export_hubs', JSONB), sa.Column('year', sa.Integer))
    op.create_table('nuclear_smr_pipeline', sa.Column('id', sa.Integer, primary_key=True), sa.Column('design_name', sa.String(100)), sa.Column('developer', sa.String(100)), sa.Column('capacity_mw', sa.Numeric(6,0)), sa.Column('cost_usd_kw', sa.Numeric(8,2)), sa.Column('deployment_year', sa.Integer), sa.Column('regulatory_status', sa.String(50)), sa.Column('grid_services', JSONB), sa.Column('investment_thesis', JSONB))
    op.create_table('negative_emissions_tech', sa.Column('id', sa.Integer, primary_key=True), sa.Column('technology', sa.String(100)), sa.Column('current_cost_usd_t', sa.Numeric(8,2)), sa.Column('projected_cost_2030', sa.Numeric(8,2)), sa.Column('projected_cost_2040', sa.Numeric(8,2)), sa.Column('scalability_gtco2_yr', sa.Numeric(6,2)), sa.Column('permanence_years', sa.Integer), sa.Column('co_benefits', JSONB), sa.Column('risks', JSONB), sa.Column('trl', sa.Integer))
    op.create_table('tech_disruption_watchlist', sa.Column('id', sa.Integer, primary_key=True), sa.Column('technology', sa.String(100)), sa.Column('trl_level', sa.Integer), sa.Column('patent_trend', JSONB), sa.Column('vc_funding_usd_m', sa.Numeric(10,2)), sa.Column('years_to_crossover', sa.Integer), sa.Column('adoption_tipping_pct', sa.Numeric(5,2)), sa.Column('portfolio_companies_exposed', JSONB), sa.Column('disruption_severity', sa.String(20)))


def downgrade():
    op.drop_table('tech_disruption_watchlist')
    op.drop_table('negative_emissions_tech')
    op.drop_table('nuclear_smr_pipeline')
    op.drop_table('hydrogen_economy_models')
    op.drop_table('grid_stability_scenarios')
    op.drop_table('critical_mineral_constraints')
