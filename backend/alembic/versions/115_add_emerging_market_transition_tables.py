"""Add China/India, ASEAN/GCC, EM carbon credit, LatAm, Africa, frontier market tables (Sprint CJ)

Revision ID: 115
Revises: 114
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '115'
down_revision = '114'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('china_india_transition', sa.Column('id', sa.Integer, primary_key=True), sa.Column('country', sa.String(10)), sa.Column('market', sa.String(50)), sa.Column('ets_price', sa.Numeric(8,2)), sa.Column('coal_capacity_gw', sa.Numeric(8,2)), sa.Column('re_target_gw', sa.Numeric(8,2)), sa.Column('h2_target_mt', sa.Numeric(8,2)), sa.Column('carbon_price_trajectory', JSONB), sa.Column('coal_retirement_schedule', JSONB), sa.Column('re_deployment_curve', JSONB), sa.Column('policy_landscape', JSONB), sa.Column('year', sa.Integer))
    op.create_table('asean_gcc_transition', sa.Column('id', sa.Integer, primary_key=True), sa.Column('country', sa.String(50)), sa.Column('region', sa.String(10)), sa.Column('taxonomy_status', sa.String(20)), sa.Column('nz_target_year', sa.Integer), sa.Column('jetp_amount_usd_bn', sa.Numeric(8,2)), sa.Column('coal_retirement_year', sa.Integer), sa.Column('green_sukuk_usd_bn', sa.Numeric(8,2)), sa.Column('h2_export_potential_mt', sa.Numeric(8,2)), sa.Column('details', JSONB))
    op.create_table('em_carbon_credit_markets', sa.Column('id', sa.Integer, primary_key=True), sa.Column('agreement_type', sa.String(50)), sa.Column('buyer_country', sa.String(50)), sa.Column('seller_country', sa.String(50)), sa.Column('itmo_price_usd', sa.Numeric(8,2)), sa.Column('volume_mtco2', sa.Numeric(10,2)), sa.Column('corresponding_adjustment', sa.Boolean), sa.Column('methodology_challenges', JSONB), sa.Column('acmi_pipeline', JSONB))
    op.create_table('latam_transition_data', sa.Column('id', sa.Integer, primary_key=True), sa.Column('country', sa.String(50)), sa.Column('re_share_pct', sa.Numeric(5,2)), sa.Column('deforestation_risk_score', sa.Integer), sa.Column('lithium_reserves_kt', sa.Numeric(10,2)), sa.Column('green_h2_potential', sa.String(20)), sa.Column('coal_dependency_pct', sa.Numeric(5,2)), sa.Column('transition_opportunities', JSONB), sa.Column('risks', JSONB))
    op.create_table('africa_climate_finance', sa.Column('id', sa.Integer, primary_key=True), sa.Column('country', sa.String(50)), sa.Column('electrification_rate_pct', sa.Numeric(5,2)), sa.Column('climate_finance_need_usd_bn', sa.Numeric(8,2)), sa.Column('climate_finance_flow_usd_bn', sa.Numeric(8,2)), sa.Column('loss_damage_usd_bn', sa.Numeric(8,2)), sa.Column('green_minerals', JSONB), sa.Column('adaptation_priority_score', sa.Integer), sa.Column('details', JSONB))
    op.create_table('frontier_sids_climate', sa.Column('id', sa.Integer, primary_key=True), sa.Column('country', sa.String(100)), sa.Column('sids_flag', sa.Boolean), sa.Column('vulnerability_index', sa.Numeric(5,2)), sa.Column('slr_exposure_pct', sa.Numeric(5,2)), sa.Column('parametric_insurance_coverage', sa.Numeric(5,2)), sa.Column('debt_gdp_pct', sa.Numeric(5,2)), sa.Column('climate_debt_swap_potential', sa.Boolean), sa.Column('blue_economy_usd_m', sa.Numeric(10,2)), sa.Column('details', JSONB))


def downgrade():
    op.drop_table('frontier_sids_climate')
    op.drop_table('africa_climate_finance')
    op.drop_table('latam_transition_data')
    op.drop_table('em_carbon_credit_markets')
    op.drop_table('asean_gcc_transition')
    op.drop_table('china_india_transition')
