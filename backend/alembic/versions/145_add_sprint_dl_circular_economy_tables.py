"""add sprint dl circular economy tables

Revision ID: 145
Revises: 144
Create Date: 2026-04-11
"""
from alembic import op
import sqlalchemy as sa

revision = '145'
down_revision = '144'
branch_labels = None
depends_on = None


def upgrade():
    # EP-DL1: Circular Economy Finance
    op.create_table(
        'ep_dl1_circular_companies',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('sector', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('circularity_score', sa.Float),
        sa.Column('circularity_tier', sa.String(50)),
        sa.Column('material_efficiency_pct', sa.Float),
        sa.Column('waste_recovery_rate_pct', sa.Float),
        sa.Column('product_life_extension_yrs', sa.Float),
        sa.Column('revenue_from_circular_m', sa.Float),
        sa.Column('circular_capex_m', sa.Float),
        sa.Column('carbon_saving_tco2_yr', sa.Float),
        sa.Column('water_saving_m_m3_yr', sa.Float),
        sa.Column('raw_material_reduction_pct', sa.Float),
        sa.Column('circular_bond_issued', sa.Boolean, default=False),
        sa.Column('eco_design_score', sa.Float),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # EP-DL2: Waste-to-Energy Finance
    op.create_table(
        'ep_dl2_wte_projects',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('technology_type', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('region', sa.String(100)),
        sa.Column('capacity_mw', sa.Float),
        sa.Column('waste_processed_kt_yr', sa.Float),
        sa.Column('energy_output_gwh_yr', sa.Float),
        sa.Column('project_value_m', sa.Float),
        sa.Column('lcoe_usd_mwh', sa.Float),
        sa.Column('carbon_credits_ktco2_yr', sa.Float),
        sa.Column('co2_intensity_gco2_kwh', sa.Float),
        sa.Column('status', sa.String(50)),
        sa.Column('irr_pct', sa.Float),
        sa.Column('subsidy_eligible', sa.Boolean, default=False),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # EP-DL3: Plastics Pollution Finance
    op.create_table(
        'ep_dl3_plastics_companies',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('company_type', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('plastic_production_kt_yr', sa.Float),
        sa.Column('recycled_content_pct', sa.Float),
        sa.Column('single_use_plastic_pct', sa.Float),
        sa.Column('plastic_tax_usd_tonne', sa.Float),
        sa.Column('extended_producer_responsibility', sa.Boolean, default=False),
        sa.Column('ocean_plastic_exposure', sa.Float),
        sa.Column('regulatory_risk', sa.Float),
        sa.Column('regulatory_risk_tier', sa.String(20)),
        sa.Column('recycling_capex_m', sa.Float),
        sa.Column('circular_target_2030_pct', sa.Float),
        sa.Column('plastic_credits_kt_yr', sa.Float),
        sa.Column('transition_score', sa.Float),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # EP-DL4: Resource Efficiency Analytics
    op.create_table(
        'ep_dl4_resource_efficiency',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('sector', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('energy_intensity_gj_m', sa.Float),
        sa.Column('water_intensity_m3_m', sa.Float),
        sa.Column('material_intensity_t_m', sa.Float),
        sa.Column('waste_intensity_t_m', sa.Float),
        sa.Column('resource_efficiency_score', sa.Float),
        sa.Column('efficiency_tier', sa.String(50)),
        sa.Column('energy_productivity_pct_5yr', sa.Float),
        sa.Column('iso_50001_certified', sa.Boolean, default=False),
        sa.Column('circularity_integration', sa.Float),
        sa.Column('resource_risk', sa.Float),
        sa.Column('efficiency_capex_m_yr', sa.Float),
        sa.Column('resource_cost_savings_m_yr', sa.Float),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # EP-DL5: Critical Minerals Climate
    op.create_table(
        'ep_dl5_critical_minerals',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('mineral', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('region', sa.String(100)),
        sa.Column('reserves_mt', sa.Float),
        sa.Column('production_kt_yr', sa.Float),
        sa.Column('carbon_intensity_tco2_t', sa.Float),
        sa.Column('water_intensity_m3_t', sa.Float),
        sa.Column('tailings_risk', sa.Float),
        sa.Column('supply_concentration_hhi', sa.Float),
        sa.Column('supply_risk_tier', sa.String(20)),
        sa.Column('ev_demand_growth_pct_pa', sa.Float),
        sa.Column('recycling_rate_pct', sa.Float),
        sa.Column('justice_concerns', sa.Float),
        sa.Column('transition_critical_score', sa.Float),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # EP-DL6: Green Chemistry Finance
    op.create_table(
        'ep_dl6_green_chemistry',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('company_type', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('revenue_bn', sa.Float),
        sa.Column('hazardous_chemicals_pct', sa.Float),
        sa.Column('green_chemistry_pct', sa.Float),
        sa.Column('green_tier', sa.String(50)),
        sa.Column('renewable_feedstock_pct', sa.Float),
        sa.Column('scope1_mtco2e', sa.Float),
        sa.Column('process_innovation_score', sa.Float),
        sa.Column('reach_compliance', sa.Boolean, default=False),
        sa.Column('eu_green_deal_exposure', sa.Float),
        sa.Column('transition_capex_m', sa.Float),
        sa.Column('green_chemistry_revenue_m', sa.Float),
        sa.Column('safer_chemicals_score', sa.Float),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade():
    op.drop_table('ep_dl6_green_chemistry')
    op.drop_table('ep_dl5_critical_minerals')
    op.drop_table('ep_dl4_resource_efficiency')
    op.drop_table('ep_dl3_plastics_companies')
    op.drop_table('ep_dl2_wte_projects')
    op.drop_table('ep_dl1_circular_companies')
