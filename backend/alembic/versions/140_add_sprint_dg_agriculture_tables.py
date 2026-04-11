"""add sprint dg agriculture tables

Revision ID: 140
Revises: 139
Create Date: 2026-04-10
"""
from alembic import op
import sqlalchemy as sa

revision = '140'
down_revision = '139'
branch_labels = None
depends_on = None


def upgrade():
    # EP-DG1: Agricultural Climate Risk — 70 agricultural regions
    op.create_table(
        'ep_dg1_agricultural_regions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('region', sa.String(100), nullable=True),
        sa.Column('crop_type', sa.String(50), nullable=True),
        sa.Column('yield_risk', sa.Numeric(6, 2), nullable=True),
        sa.Column('extreme_heat_days', sa.Integer(), nullable=True),
        sa.Column('drought_frequency', sa.Numeric(6, 2), nullable=True),
        sa.Column('physical_risk_score', sa.Integer(), nullable=True),
        sa.Column('precipitation_change', sa.Numeric(6, 2), nullable=True),
        sa.Column('soil_degradation', sa.Numeric(4, 2), nullable=True),
        sa.Column('adaptation_capacity', sa.Numeric(4, 2), nullable=True),
        sa.Column('farmer_income_risk', sa.Numeric(6, 2), nullable=True),
        sa.Column('irrigation_dependency', sa.Numeric(6, 2), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # EP-DG2: Food System Transition — 55 food & beverage companies
    op.create_table(
        'ep_dg2_food_companies',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('sector', sa.String(100), nullable=True),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('revenue', sa.Numeric(10, 2), nullable=True),
        sa.Column('scope3_agri_pct', sa.Numeric(6, 2), nullable=True),
        sa.Column('deforestation_commitment', sa.Boolean(), nullable=True),
        sa.Column('science_based_target', sa.Boolean(), nullable=True),
        sa.Column('transition_score', sa.Integer(), nullable=True),
        sa.Column('supplier_engagement_pct', sa.Numeric(6, 2), nullable=True),
        sa.Column('alternative_protein_investment', sa.Numeric(12, 2), nullable=True),
        sa.Column('biodiversity_commitment', sa.Boolean(), nullable=True),
        sa.Column('scope1', sa.Numeric(10, 3), nullable=True),
        sa.Column('scope2', sa.Numeric(10, 3), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # EP-DG3: Land Use Change Finance — 45 countries/jurisdictions
    op.create_table(
        'ep_dg3_land_use_countries',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('region', sa.String(100), nullable=True),
        sa.Column('forest_cover', sa.Numeric(6, 2), nullable=True),
        sa.Column('annual_deforestation_rate', sa.Numeric(6, 3), nullable=True),
        sa.Column('redd_credits_issued', sa.Numeric(10, 2), nullable=True),
        sa.Column('restoration_target', sa.Numeric(10, 2), nullable=True),
        sa.Column('carbon_stock_forest', sa.Numeric(10, 2), nullable=True),
        sa.Column('ndc_land_use_commitment', sa.Numeric(12, 2), nullable=True),
        sa.Column('biodiversity_hotspot', sa.Boolean(), nullable=True),
        sa.Column('jurisdictional_redd_status', sa.String(50), nullable=True),
        sa.Column('land_tenure_security', sa.Numeric(4, 2), nullable=True),
        sa.Column('climate_finance_received', sa.Numeric(10, 3), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # EP-DG4: Sustainable Agriculture Investment — 60 companies/funds
    op.create_table(
        'ep_dg4_agri_investments',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('type', sa.String(100), nullable=True),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('aum', sa.Numeric(12, 2), nullable=True),
        sa.Column('irr', sa.Numeric(6, 2), nullable=True),
        sa.Column('carbon_sequestration', sa.Numeric(8, 3), nullable=True),
        sa.Column('yield_improvement', sa.Numeric(6, 2), nullable=True),
        sa.Column('impact_score', sa.Integer(), nullable=True),
        sa.Column('water_reduction', sa.Numeric(6, 2), nullable=True),
        sa.Column('stage', sa.String(50), nullable=True),
        sa.Column('blended_finance', sa.Boolean(), nullable=True),
        sa.Column('sdg_alignment', sa.ARRAY(sa.Integer()), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # EP-DG5: Water-Food-Energy Nexus — 50 river basins
    op.create_table(
        'ep_dg5_river_basins',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('region', sa.String(100), nullable=True),
        sa.Column('water_stress_index', sa.Numeric(5, 2), nullable=True),
        sa.Column('irrigation_efficiency', sa.Numeric(6, 2), nullable=True),
        sa.Column('crop_water_productivity', sa.Numeric(6, 3), nullable=True),
        sa.Column('nexus_risk_score', sa.Integer(), nullable=True),
        sa.Column('groundwater_depletion', sa.Numeric(8, 2), nullable=True),
        sa.Column('energy_for_irrigation', sa.Numeric(8, 2), nullable=True),
        sa.Column('food_production', sa.Numeric(10, 2), nullable=True),
        sa.Column('hydropower_dependency', sa.Numeric(6, 2), nullable=True),
        sa.Column('adaptation_investment', sa.Numeric(12, 2), nullable=True),
        sa.Column('climate_impact_on_water', sa.Numeric(6, 2), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # EP-DG6: Climate Commodity Analytics — 80 commodity trade flows
    op.create_table(
        'ep_dg6_commodity_flows',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('commodity', sa.String(100), nullable=False),
        sa.Column('export_country', sa.String(100), nullable=True),
        sa.Column('import_country', sa.String(100), nullable=True),
        sa.Column('volume', sa.Numeric(10, 2), nullable=True),
        sa.Column('price', sa.Numeric(10, 2), nullable=True),
        sa.Column('climate_risk', sa.Numeric(5, 2), nullable=True),
        sa.Column('supply_chain_emissions', sa.Numeric(8, 2), nullable=True),
        sa.Column('price_volatility', sa.Numeric(6, 2), nullable=True),
        sa.Column('deforestation_risk', sa.Numeric(5, 2), nullable=True),
        sa.Column('trade_route_risk', sa.Numeric(5, 2), nullable=True),
        sa.Column('price_climate_correlation', sa.Numeric(6, 2), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )


def downgrade():
    op.drop_table('ep_dg6_commodity_flows')
    op.drop_table('ep_dg5_river_basins')
    op.drop_table('ep_dg4_agri_investments')
    op.drop_table('ep_dg3_land_use_countries')
    op.drop_table('ep_dg2_food_companies')
    op.drop_table('ep_dg1_agricultural_regions')
