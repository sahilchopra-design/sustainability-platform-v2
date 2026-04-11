"""add sprint DE real estate tables

Revision ID: 138
Revises: 137
Create Date: 2026-04-10
"""
from alembic import op
import sqlalchemy as sa

revision = '138'
down_revision = '137'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'ep_de1_building_profiles',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('epc_rating', sa.String(1), nullable=False),
        sa.Column('green_certification', sa.String(50), nullable=True),
        sa.Column('size_sqm', sa.Integer(), nullable=False),
        sa.Column('energy_intensity', sa.Numeric(10, 2), nullable=False),
        sa.Column('carbon_intensity', sa.Numeric(10, 2), nullable=False),
        sa.Column('value_psm', sa.Numeric(12, 2), nullable=False),
        sa.Column('green_premium', sa.Numeric(6, 2), nullable=True),
        sa.Column('stranded', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('capex', sa.Numeric(10, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'ep_de2_re_climate_risks',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('flood_risk', sa.Numeric(4, 2), nullable=False),
        sa.Column('heat_risk', sa.Numeric(4, 2), nullable=False),
        sa.Column('subsistence_risk', sa.Numeric(4, 2), nullable=True),
        sa.Column('transition_risk', sa.Numeric(4, 2), nullable=False),
        sa.Column('physical_risk_score', sa.Numeric(5, 3), nullable=False),
        sa.Column('epc_rating', sa.String(1), nullable=True),
        sa.Column('build_year', sa.Integer(), nullable=True),
        sa.Column('ltv_ratio', sa.Numeric(6, 2), nullable=True),
        sa.Column('insurance_premium', sa.Numeric(12, 2), nullable=True),
        sa.Column('stranded_year', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'ep_de3_mortgage_portfolios',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('lender_name', sa.String(255), nullable=False),
        sa.Column('type', sa.String(80), nullable=False),
        sa.Column('portfolio_value', sa.Numeric(10, 2), nullable=False),
        sa.Column('avg_ltv', sa.Numeric(6, 2), nullable=True),
        sa.Column('avg_epc', sa.String(1), nullable=True),
        sa.Column('flood_exposure_pct', sa.Numeric(6, 2), nullable=True),
        sa.Column('stranded_pct', sa.Numeric(6, 2), nullable=True),
        sa.Column('climate_var', sa.Numeric(6, 3), nullable=True),
        sa.Column('capital_charge', sa.Numeric(10, 3), nullable=True),
        sa.Column('regulatory_status', sa.String(30), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'ep_de4_infrastructure_assets',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('sector', sa.String(50), nullable=False),
        sa.Column('country', sa.String(100), nullable=False),
        sa.Column('asset_value', sa.Numeric(10, 3), nullable=False),
        sa.Column('physical_risk', sa.Numeric(4, 2), nullable=False),
        sa.Column('flood_risk', sa.Numeric(4, 2), nullable=True),
        sa.Column('heat_risk', sa.Numeric(4, 2), nullable=True),
        sa.Column('adaptation_cost', sa.Numeric(10, 2), nullable=True),
        sa.Column('residual_risk', sa.Numeric(4, 2), nullable=True),
        sa.Column('operational_impact', sa.Numeric(6, 2), nullable=True),
        sa.Column('insurance_coverage', sa.Numeric(6, 2), nullable=True),
        sa.Column('risk_level', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'ep_de5_city_adaptation',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('city_name', sa.String(150), nullable=False),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('region', sa.String(80), nullable=False),
        sa.Column('population', sa.Numeric(8, 2), nullable=True),
        sa.Column('heat_index', sa.Numeric(4, 2), nullable=False),
        sa.Column('flood_risk', sa.Numeric(4, 2), nullable=True),
        sa.Column('drought_risk', sa.Numeric(4, 2), nullable=True),
        sa.Column('adaptation_budget', sa.Numeric(8, 3), nullable=True),
        sa.Column('gdp_at_risk', sa.Numeric(6, 2), nullable=True),
        sa.Column('green_infra_investment', sa.Numeric(8, 3), nullable=True),
        sa.Column('adaptation_gap', sa.Numeric(8, 3), nullable=True),
        sa.Column('adaptation_score', sa.Integer(), nullable=True),
        sa.Column('urban_heat_island_intensity', sa.Numeric(4, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'ep_de6_building_carbon',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('embodied_carbon', sa.Numeric(8, 2), nullable=False),
        sa.Column('operational_carbon', sa.Numeric(8, 2), nullable=False),
        sa.Column('total_lifecycle_carbon', sa.Numeric(12, 2), nullable=True),
        sa.Column('net_zero_year', sa.Integer(), nullable=True),
        sa.Column('retrofit_cost', sa.Numeric(10, 3), nullable=True),
        sa.Column('carbon_saving', sa.Numeric(10, 2), nullable=True),
        sa.Column('certifications', sa.Text(), nullable=True),
        sa.Column('scope1', sa.Numeric(10, 2), nullable=True),
        sa.Column('scope2', sa.Numeric(10, 2), nullable=True),
        sa.Column('scope3', sa.Numeric(10, 2), nullable=True),
        sa.Column('net_zero_status', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )


def downgrade():
    op.drop_table('ep_de6_building_carbon')
    op.drop_table('ep_de5_city_adaptation')
    op.drop_table('ep_de4_infrastructure_assets')
    op.drop_table('ep_de3_mortgage_portfolios')
    op.drop_table('ep_de2_re_climate_risks')
    op.drop_table('ep_de1_building_profiles')
