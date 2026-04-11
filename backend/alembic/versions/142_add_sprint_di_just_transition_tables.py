"""add sprint di just transition tables

Revision ID: 142
Revises: 141
Create Date: 2026-04-10
"""
from alembic import op
import sqlalchemy as sa

revision = '142'
down_revision = '141'
branch_labels = None
depends_on = None


def upgrade():
    # EP-DI1: Fossil Fuel Worker Transition — 50 coal/oil/gas regions globally
    op.create_table(
        'ep_di1_fossil_regions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('region', sa.String(100), nullable=True),
        sa.Column('fuel_type', sa.String(50), nullable=True),
        sa.Column('workers_employed_k', sa.Numeric(8, 1), nullable=True),
        sa.Column('projected_job_loss_2030_k', sa.Numeric(8, 1), nullable=True),
        sa.Column('projected_job_loss_2040_k', sa.Numeric(8, 1), nullable=True),
        sa.Column('retraining_eligible_k', sa.Numeric(8, 1), nullable=True),
        sa.Column('avg_wage_k', sa.Numeric(6, 1), nullable=True),
        sa.Column('alternative_jobs_available_k', sa.Numeric(8, 1), nullable=True),
        sa.Column('transition_fund_allocated_m', sa.Numeric(10, 0), nullable=True),
        sa.Column('community_impact_score', sa.Numeric(4, 1), nullable=True),
        sa.Column('timeline_risk', sa.Numeric(4, 1), nullable=True),
        sa.Column('unionisation_rate_pct', sa.Numeric(5, 1), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # EP-DI2: Green Jobs Growth — 60 green economy occupations
    op.create_table(
        'ep_di2_green_jobs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('sector', sa.String(100), nullable=True),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('current_jobs_k', sa.Numeric(8, 0), nullable=True),
        sa.Column('projected_jobs_2030_k', sa.Numeric(8, 0), nullable=True),
        sa.Column('projected_jobs_2035_k', sa.Numeric(8, 0), nullable=True),
        sa.Column('avg_salary_k', sa.Numeric(6, 0), nullable=True),
        sa.Column('skills_gap', sa.Numeric(4, 1), nullable=True),
        sa.Column('geographic_concentration', sa.Numeric(4, 1), nullable=True),
        sa.Column('diversity_score', sa.Numeric(4, 1), nullable=True),
        sa.Column('unionisation_rate_pct', sa.Numeric(5, 1), nullable=True),
        sa.Column('entry_barrier', sa.String(20), nullable=True),
        sa.Column('growth_rate_pct', sa.Numeric(5, 1), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # EP-DI3: Corporate Just Transition — 55 corporations undergoing energy transition
    op.create_table(
        'ep_di3_jt_corporates',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('sector', sa.String(100), nullable=True),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('revenue_bn', sa.Numeric(8, 1), nullable=True),
        sa.Column('transition_capex_bn', sa.Numeric(8, 2), nullable=True),
        sa.Column('worker_retraining_budget_m', sa.Numeric(8, 0), nullable=True),
        sa.Column('community_investment_m', sa.Numeric(8, 0), nullable=True),
        sa.Column('supplier_transition_support_m', sa.Numeric(8, 0), nullable=True),
        sa.Column('just_transition_score', sa.Integer(), nullable=True),
        sa.Column('workforce_reduction_k', sa.Numeric(6, 1), nullable=True),
        sa.Column('new_green_jobs_k', sa.Numeric(6, 1), nullable=True),
        sa.Column('human_rights_score', sa.Numeric(4, 1), nullable=True),
        sa.Column('indigenous_consultation', sa.Boolean(), nullable=True),
        sa.Column('gender_equity_score', sa.Numeric(4, 1), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # EP-DI4: Climate Displacement Risk — 65 countries
    op.create_table(
        'ep_di4_displacement_countries',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('region', sa.String(100), nullable=True),
        sa.Column('current_displaced_m', sa.Numeric(6, 2), nullable=True),
        sa.Column('projected_2040_m', sa.Numeric(6, 2), nullable=True),
        sa.Column('projected_2060_m', sa.Numeric(6, 2), nullable=True),
        sa.Column('displacement_driver', sa.String(50), nullable=True),
        sa.Column('adaptation_funding_bn', sa.Numeric(6, 2), nullable=True),
        sa.Column('migration_corridors', sa.Numeric(4, 1), nullable=True),
        sa.Column('social_cohesion_risk', sa.Numeric(4, 1), nullable=True),
        sa.Column('host_country_capacity', sa.Numeric(4, 1), nullable=True),
        sa.Column('remittance_gdp_pct', sa.Numeric(5, 1), nullable=True),
        sa.Column('climate_refugee_recognition', sa.Boolean(), nullable=True),
        sa.Column('financial_sector_exposure_bn', sa.Numeric(6, 1), nullable=True),
        sa.Column('displacement_risk_score', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # EP-DI5: Supply Chain Labor & Climate Risk — 70 global supply chains
    op.create_table(
        'ep_di5_supply_chains',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('commodity', sa.String(100), nullable=True),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('region', sa.String(100), nullable=True),
        sa.Column('heat_stress_risk', sa.Numeric(4, 1), nullable=True),
        sa.Column('flood_risk', sa.Numeric(4, 1), nullable=True),
        sa.Column('workers_affected_m', sa.Numeric(6, 2), nullable=True),
        sa.Column('wage_risk_pct', sa.Numeric(5, 1), nullable=True),
        sa.Column('labor_right_risk', sa.Numeric(4, 1), nullable=True),
        sa.Column('child_labor_index', sa.Numeric(4, 1), nullable=True),
        sa.Column('gender_pay_gap_pct', sa.Numeric(5, 1), nullable=True),
        sa.Column('modern_slavery_risk', sa.Numeric(4, 1), nullable=True),
        sa.Column('climate_adaptation_score', sa.Numeric(4, 1), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # EP-DI6: Community Climate Resilience — 60 vulnerable communities globally
    op.create_table(
        'ep_di6_communities',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('region', sa.String(100), nullable=True),
        sa.Column('population_k', sa.Integer(), nullable=True),
        sa.Column('income_level', sa.String(30), nullable=True),
        sa.Column('physical_risk', sa.Numeric(4, 1), nullable=True),
        sa.Column('social_vulnerability', sa.Numeric(4, 1), nullable=True),
        sa.Column('economic_resilience', sa.Numeric(4, 1), nullable=True),
        sa.Column('resilience_score', sa.Integer(), nullable=True),
        sa.Column('adaptation_funding_m', sa.Numeric(6, 1), nullable=True),
        sa.Column('indigenous_community', sa.Boolean(), nullable=True),
        sa.Column('coastal_exposure', sa.Boolean(), nullable=True),
        sa.Column('food_insecurity', sa.Numeric(4, 1), nullable=True),
        sa.Column('climate_finance_access', sa.Numeric(4, 1), nullable=True),
        sa.Column('community_org_strength', sa.Numeric(4, 1), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )


def downgrade():
    op.drop_table('ep_di6_communities')
    op.drop_table('ep_di5_supply_chains')
    op.drop_table('ep_di4_displacement_countries')
    op.drop_table('ep_di3_jt_corporates')
    op.drop_table('ep_di2_green_jobs')
    op.drop_table('ep_di1_fossil_regions')
