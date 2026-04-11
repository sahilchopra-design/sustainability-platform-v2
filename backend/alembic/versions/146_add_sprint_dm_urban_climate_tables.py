"""add sprint dm urban climate tables

Revision ID: 146
Revises: 145
Create Date: 2026-04-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '146'
down_revision = '145'
branch_labels = None
depends_on = None


def upgrade():
    # EP-DM1: Municipal Green Bond Analytics
    op.create_table(
        'ep_dm1_municipal_bonds',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('city_name', sa.String(120), nullable=False),
        sa.Column('country', sa.String(100)),
        sa.Column('region', sa.String(100)),
        sa.Column('issuance_size_usd_m', sa.Numeric(12, 2)),
        sa.Column('year', sa.Integer()),
        sa.Column('use_of_proceeds', sa.String(50)),
        sa.Column('tenor_years', sa.Integer()),
        sa.Column('credit_rating', sa.String(10)),
        sa.Column('greenium_bps', sa.Numeric(6, 2)),
        sa.Column('certification_body', sa.String(80)),
        sa.Column('oversubscription_x', sa.Numeric(6, 2)),
        sa.Column('projects_financed', sa.Integer()),
        sa.Column('estimated_co2_saving_ktpa', sa.Numeric(10, 1)),
        sa.Column('jobs_created_k', sa.Numeric(8, 2)),
        sa.Column('population_served_m', sa.Numeric(8, 3)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
    )

    # EP-DM2: Smart City Climate Finance
    op.create_table(
        'ep_dm2_smart_cities',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('city_name', sa.String(120), nullable=False),
        sa.Column('country', sa.String(100)),
        sa.Column('region', sa.String(100)),
        sa.Column('population_m', sa.Numeric(8, 2)),
        sa.Column('smart_city_score', sa.Integer()),
        sa.Column('smart_city_tier', sa.String(20)),
        sa.Column('iot_sensors_k', sa.Integer()),
        sa.Column('energy_smart_grid', sa.Boolean()),
        sa.Column('smart_transport', sa.Boolean()),
        sa.Column('digital_twin_city', sa.Boolean()),
        sa.Column('climate_monitoring', sa.Boolean()),
        sa.Column('smart_waste_management', sa.Boolean()),
        sa.Column('tech_investment_usd_bn', sa.Numeric(8, 2)),
        sa.Column('carbon_reduction_pct', sa.Numeric(6, 2)),
        sa.Column('energy_savings_gwh_pa', sa.Integer()),
        sa.Column('private_partnership_value_usd_bn', sa.Numeric(8, 2)),
        sa.Column('climate_resilience_score', sa.Integer()),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
    )

    # EP-DM3: City Climate Risk Rating
    op.create_table(
        'ep_dm3_city_risk_ratings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('city_name', sa.String(120), nullable=False),
        sa.Column('country', sa.String(100)),
        sa.Column('region', sa.String(100)),
        sa.Column('population_m', sa.Numeric(8, 2)),
        sa.Column('physical_risk_score', sa.Integer()),
        sa.Column('risk_tier', sa.String(20)),
        sa.Column('flood_risk', sa.Numeric(4, 1)),
        sa.Column('heat_risk', sa.Numeric(4, 1)),
        sa.Column('sea_level_risk', sa.Numeric(4, 1)),
        sa.Column('drought_risk', sa.Numeric(4, 1)),
        sa.Column('air_quality_risk', sa.Numeric(4, 1)),
        sa.Column('economic_resilience_score', sa.Integer()),
        sa.Column('infra_vulnerability', sa.Numeric(4, 1)),
        sa.Column('credit_rating_impact_notches', sa.Numeric(4, 1)),
        sa.Column('adaptation_budget_usd_bn', sa.Numeric(8, 2)),
        sa.Column('climate_debt_risk', sa.Numeric(4, 1)),
        sa.Column('investment_grade_risk', sa.Boolean()),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
    )

    # EP-DM4: Urban Mobility Transition
    op.create_table(
        'ep_dm4_urban_mobility',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('city_name', sa.String(120), nullable=False),
        sa.Column('country', sa.String(100)),
        sa.Column('region', sa.String(100)),
        sa.Column('transition_level', sa.String(20)),
        sa.Column('ev_share_new_sales_pct', sa.Numeric(6, 2)),
        sa.Column('ev_fleet_pct', sa.Numeric(6, 2)),
        sa.Column('public_transit_share_pct', sa.Numeric(6, 2)),
        sa.Column('cycling_infra_km', sa.Integer()),
        sa.Column('car_free_zones_sqkm', sa.Numeric(8, 2)),
        sa.Column('congestion_charge', sa.Boolean()),
        sa.Column('low_emission_zone', sa.Boolean()),
        sa.Column('transport_emissions_mtco2_pa', sa.Numeric(8, 3)),
        sa.Column('transition_score', sa.Integer()),
        sa.Column('charging_points_per_100k', sa.Integer()),
        sa.Column('active_transport_score', sa.Numeric(4, 1)),
        sa.Column('mobility_investment_usd_bn', sa.Numeric(8, 2)),
        sa.Column('emissions_reduction_pct', sa.Numeric(6, 2)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
    )

    # EP-DM5: Green Building Code Finance
    op.create_table(
        'ep_dm5_building_codes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('jurisdiction_name', sa.String(120), nullable=False),
        sa.Column('country', sa.String(100)),
        sa.Column('region', sa.String(100)),
        sa.Column('building_code_version_year', sa.Integer()),
        sa.Column('net_zero_building_target_year', sa.Integer()),
        sa.Column('retrofit_mandate_year', sa.Integer()),
        sa.Column('energy_efficiency_standard_kwh_m2', sa.Integer()),
        sa.Column('embodied_carbon_limit_kgco2e_m2', sa.Integer()),
        sa.Column('green_building_cert_share_pct', sa.Numeric(6, 2)),
        sa.Column('compliance_rate_pct', sa.Numeric(6, 2)),
        sa.Column('enforcement_strength', sa.Numeric(4, 1)),
        sa.Column('retrofit_funding_usd_bn', sa.Numeric(8, 2)),
        sa.Column('new_build_compliance_pct', sa.Numeric(6, 2)),
        sa.Column('stranded_building_stock_pct', sa.Numeric(6, 2)),
        sa.Column('carbon_savings_from_code_mtco2_pa', sa.Numeric(8, 3)),
        sa.Column('target_year_bucket', sa.String(30)),
        sa.Column('compliance_bucket', sa.String(30)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
    )

    # EP-DM6: City Net Zero Tracker
    op.create_table(
        'ep_dm6_city_net_zero',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('city_name', sa.String(120), nullable=False),
        sa.Column('country', sa.String(100)),
        sa.Column('region', sa.String(100)),
        sa.Column('population_m', sa.Numeric(8, 2)),
        sa.Column('net_zero_target_year', sa.Integer()),
        sa.Column('target_bucket', sa.String(10)),
        sa.Column('baseline_emissions_mtco2_pa', sa.Numeric(8, 2)),
        sa.Column('current_emissions_mtco2_pa', sa.Numeric(8, 3)),
        sa.Column('reduction_to_date_pct', sa.Numeric(6, 2)),
        sa.Column('on_track', sa.Boolean()),
        sa.Column('sector_coverage', postgresql.ARRAY(sa.String())),
        sa.Column('carbon_offset_reliance_pct', sa.Numeric(6, 2)),
        sa.Column('finance_gap_usd_bn', sa.Numeric(8, 2)),
        sa.Column('implementation_score', sa.Integer()),
        sa.Column('c40_member', sa.Boolean()),
        sa.Column('race_to_zero', sa.Boolean()),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
    )


def downgrade():
    op.drop_table('ep_dm6_city_net_zero')
    op.drop_table('ep_dm5_building_codes')
    op.drop_table('ep_dm4_urban_mobility')
    op.drop_table('ep_dm3_city_risk_ratings')
    op.drop_table('ep_dm2_smart_cities')
    op.drop_table('ep_dm1_municipal_bonds')
