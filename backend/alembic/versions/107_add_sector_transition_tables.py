"""add sector transition scorecard, just transition, and policy impact tables

Revision ID: 107
Revises: 106
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '107'
down_revision = '106'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Sector transition scorecards — GICS-aligned
    op.create_table('sector_transition_scorecards',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('sector_gics', sa.String(100)),        # Energy, Materials, Industrials, etc.
        sa.Column('sub_sector', sa.String(100)),
        sa.Column('assessment_date', sa.Date()),
        sa.Column('scenario', sa.String(50)),
        # PACE framework scores (0–100)
        sa.Column('pace_physical_score', sa.Numeric(6, 2)),
        sa.Column('pace_abatement_score', sa.Numeric(6, 2)),
        sa.Column('pace_carbon_cost_score', sa.Numeric(6, 2)),
        sa.Column('pace_energy_price_score', sa.Numeric(6, 2)),
        sa.Column('pace_composite', sa.Numeric(6, 2)),
        # SBTi pathway alignment
        sa.Column('sbti_aligned_pct', sa.Numeric(6, 2)),  # % of sector companies with SBTi
        sa.Column('sbti_pathway', sa.String(50)),          # 1.5C, well_below_2C, 2C, not_aligned
        sa.Column('sector_emissions_2019', sa.Numeric(12, 2)),  # MtCO2e
        sa.Column('sector_emissions_2030_target', sa.Numeric(12, 2)),
        sa.Column('sector_emissions_2050_target', sa.Numeric(12, 2)),
        sa.Column('current_trajectory_temp', sa.Numeric(4, 2)),  # implied °C by 2100
        # Abatement potential
        sa.Column('abatement_cost_curve', JSONB),         # [{measure, abatement_mtco2e, cost_usd_per_t, cumulative}]
        sa.Column('mac_breakeven_price', sa.Numeric(10, 2)),  # USD/tCO2e
        # Revenue/capex mix
        sa.Column('green_revenue_pct', sa.Numeric(6, 2)),
        sa.Column('brown_revenue_pct', sa.Numeric(6, 2)),
        sa.Column('transition_capex_pct', sa.Numeric(6, 2)),  # of total capex
        sa.Column('stranded_asset_risk', sa.String(20)),   # low, medium, high, critical
        sa.Column('transition_risk_rating', sa.String(10)),# A–E
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

    # Just transition data — worker/community impact
    op.create_table('just_transition_assessments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('region', sa.String(100)),
        sa.Column('country_iso', sa.String(3)),
        sa.Column('sector', sa.String(100)),
        sa.Column('assessment_year', sa.Integer()),
        sa.Column('fossil_jobs_at_risk', sa.Integer()),
        sa.Column('green_jobs_created', sa.Integer()),
        sa.Column('net_jobs_impact', sa.Integer()),
        sa.Column('avg_wage_fossil', sa.Numeric(12, 2)),   # USD/year
        sa.Column('avg_wage_green', sa.Numeric(12, 2)),
        sa.Column('reskilling_cost_usd_mn', sa.Numeric(12, 2)),
        sa.Column('community_vulnerability_score', sa.Numeric(6, 2)),  # 0–100
        sa.Column('jtf_finance_needed_usd_mn', sa.Numeric(12, 2)),    # Just Transition Finance
        sa.Column('jtf_finance_available_usd_mn', sa.Numeric(12, 2)),
        sa.Column('jtf_gap_usd_mn', sa.Numeric(12, 2)),
        sa.Column('social_risk_rating', sa.String(10)),   # A–E
        sa.Column('ilo_jtf_alignment', JSONB),            # alignment with ILO Just Transition Framework
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

    # Policy and regulatory impact runs
    op.create_table('policy_regulatory_impacts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('policy_name', sa.String(200)),
        sa.Column('policy_type', sa.String(50)),          # carbon_tax, ets, mandate, subsidy, standard
        sa.Column('jurisdiction', sa.String(100)),
        sa.Column('effective_date', sa.Date()),
        sa.Column('target_sector', sa.String(100)),
        sa.Column('instrument', sa.String(50)),           # eu_ets, cbam, mees, ira, taxonomy
        # EU ETS specifics
        sa.Column('ets_price_floor', sa.Numeric(10, 2)),
        sa.Column('ets_price_ceiling', sa.Numeric(10, 2)),
        sa.Column('ets_allowance_trajectory', JSONB),     # [{year, allowances_mn_t, price_eur}]
        # CBAM specifics
        sa.Column('cbam_sectors', JSONB),                 # [steel, cement, aluminum, fertilizers, electricity]
        sa.Column('cbam_embedded_carbon_cost', sa.Numeric(12, 2)),
        # Revenue/cost impact
        sa.Column('revenue_impact_usd_mn', sa.Numeric(16, 2)),
        sa.Column('cost_impact_usd_mn', sa.Numeric(16, 2)),
        sa.Column('compliance_cost_usd_mn', sa.Numeric(16, 2)),
        sa.Column('stranded_asset_trigger', sa.Boolean()),
        sa.Column('implementation_risk', sa.String(20)),  # low, medium, high
        sa.Column('portfolio_exposure', JSONB),           # [{company, exposure_pct, impact_usd_mn}]
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('policy_regulatory_impacts')
    op.drop_table('just_transition_assessments')
    op.drop_table('sector_transition_scorecards')
