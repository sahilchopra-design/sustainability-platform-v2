"""add sprint dj ocean shipping blue economy tables

Revision ID: 143
Revises: 142
Create Date: 2026-04-10
"""
from alembic import op
import sqlalchemy as sa

revision = '143'
down_revision = '142'
branch_labels = None
depends_on = None


def upgrade():
    # EP-DJ1: Shipping Decarbonisation
    op.create_table(
        'ep_dj1_shipping_fleets',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('type', sa.String(50)),
        sa.Column('country', sa.String(100)),
        sa.Column('fleet_size', sa.Integer),
        sa.Column('avg_age_yrs', sa.Numeric(5, 1)),
        sa.Column('cii_rating', sa.String(5)),
        sa.Column('eexi', sa.Numeric(8, 2)),
        sa.Column('fuel_type', sa.String(50)),
        sa.Column('retrofit_capex_m', sa.Numeric(10, 2)),
        sa.Column('green_fuel_readiness', sa.Numeric(4, 1)),
        sa.Column('imo_aligned', sa.Boolean, default=False),
        sa.Column('carbon_intensity', sa.Numeric(8, 3)),
        sa.Column('stranded_2030_risk_pct', sa.Numeric(5, 1)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # EP-DJ2: Blue Carbon Finance
    op.create_table(
        'ep_dj2_blue_carbon_projects',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('type', sa.String(50)),
        sa.Column('country', sa.String(100)),
        sa.Column('region', sa.String(100)),
        sa.Column('area_ha', sa.Integer),
        sa.Column('carbon_sequestration_t_co2_ha_yr', sa.Numeric(8, 3)),
        sa.Column('credits_issued_kt_yr', sa.Numeric(10, 3)),
        sa.Column('credit_price_usd_t', sa.Numeric(8, 2)),
        sa.Column('project_value_m', sa.Numeric(10, 2)),
        sa.Column('cobenefits', sa.String(100)),
        sa.Column('verification_standard', sa.String(50)),
        sa.Column('additionality_score', sa.Numeric(4, 1)),
        sa.Column('permanence_risk_score', sa.Numeric(4, 1)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # EP-DJ3: Coastal Flood Risk Finance
    op.create_table(
        'ep_dj3_coastal_cities',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('country', sa.String(100)),
        sa.Column('region', sa.String(100)),
        sa.Column('exposed_assets_bn', sa.Numeric(12, 2)),
        sa.Column('sea_level_rise_2050_cm', sa.Integer),
        sa.Column('flood_frequency_events_decade', sa.Integer),
        sa.Column('storm_surge_risk', sa.Numeric(4, 1)),
        sa.Column('population_at_risk_m', sa.Numeric(8, 3)),
        sa.Column('adaptation_cost_bn', sa.Numeric(10, 2)),
        sa.Column('residual_risk_bn', sa.Numeric(10, 2)),
        sa.Column('insurance_penetration_pct', sa.Numeric(6, 2)),
        sa.Column('nature_solutions_potential', sa.Numeric(4, 1)),
        sa.Column('seawall_height_m', sa.Numeric(5, 1)),
        sa.Column('retreat_risk', sa.Numeric(4, 1)),
        sa.Column('risk_level', sa.String(20)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # EP-DJ4: Ocean Health Finance
    op.create_table(
        'ep_dj4_ocean_regions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('region', sa.String(100)),
        sa.Column('sea_temperature_anomaly_c', sa.Numeric(5, 3)),
        sa.Column('acidification_level_delta_ph', sa.Numeric(6, 4)),
        sa.Column('coral_bleaching_risk', sa.Numeric(4, 1)),
        sa.Column('fishery_collapse_probability_pct', sa.Numeric(6, 2)),
        sa.Column('marine_protected_area_pct', sa.Numeric(6, 2)),
        sa.Column('plastic_pollution_index', sa.Numeric(4, 1)),
        sa.Column('ocean_health_index', sa.Integer),
        sa.Column('conservation_investment_m', sa.Numeric(10, 0)),
        sa.Column('blue_economy_gdp_pct', sa.Numeric(5, 2)),
        sa.Column('oxygen_minimum_zone_expansion_pct', sa.Numeric(6, 2)),
        sa.Column('carbon_sink_capacity_gt_yr', sa.Numeric(8, 4)),
        sa.Column('risk_level', sa.String(20)),
        sa.Column('mpa_status', sa.String(30)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # EP-DJ5: Port Climate Risk
    op.create_table(
        'ep_dj5_ports',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('country', sa.String(100)),
        sa.Column('region', sa.String(100)),
        sa.Column('throughput_mt_yr', sa.Integer),
        sa.Column('cargo_value_bn', sa.Numeric(10, 2)),
        sa.Column('flood_risk', sa.Numeric(4, 1)),
        sa.Column('storm_surge_risk', sa.Numeric(4, 1)),
        sa.Column('sea_level_exposure_m', sa.Numeric(5, 2)),
        sa.Column('heat_risk', sa.Numeric(4, 1)),
        sa.Column('drought_risk', sa.Numeric(4, 1)),
        sa.Column('adaptation_capex_m', sa.Numeric(10, 0)),
        sa.Column('operational_disruption_risk_pct', sa.Numeric(5, 1)),
        sa.Column('green_shipping_infra', sa.Numeric(4, 1)),
        sa.Column('shorepower', sa.Boolean, default=False),
        sa.Column('lng_bunkering', sa.Boolean, default=False),
        sa.Column('renewable_energy_pct', sa.Numeric(5, 1)),
        sa.Column('risk_level', sa.String(20)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # EP-DJ6: Fisheries Climate Risk
    op.create_table(
        'ep_dj6_fisheries',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('country', sa.String(100)),
        sa.Column('region', sa.String(100)),
        sa.Column('catch_volume_mt_yr', sa.Numeric(8, 3)),
        sa.Column('catch_value_bn', sa.Numeric(8, 3)),
        sa.Column('fish_stock_health', sa.Numeric(4, 1)),
        sa.Column('climate_exposure', sa.Numeric(4, 1)),
        sa.Column('overexploitation_risk', sa.Numeric(4, 1)),
        sa.Column('aquaculture_share_pct', sa.Numeric(5, 1)),
        sa.Column('small_scale_fishers_dependence_m', sa.Numeric(6, 3)),
        sa.Column('adaptation_capacity', sa.Numeric(4, 1)),
        sa.Column('marine_spatial_planning_score', sa.Numeric(4, 1)),
        sa.Column('climate_projected_catch_change_pct', sa.Numeric(6, 1)),
        sa.Column('subsidies_m_yr', sa.Numeric(10, 0)),
        sa.Column('stock_status', sa.String(20)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade():
    op.drop_table('ep_dj6_fisheries')
    op.drop_table('ep_dj5_ports')
    op.drop_table('ep_dj4_ocean_regions')
    op.drop_table('ep_dj3_coastal_cities')
    op.drop_table('ep_dj2_blue_carbon_projects')
    op.drop_table('ep_dj1_shipping_fleets')
