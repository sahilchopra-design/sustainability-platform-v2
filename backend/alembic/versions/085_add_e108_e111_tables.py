"""Add E108–E111 tables: Basel IV Capital, Climate Policy Tracker, Export Credit ESG, ESG Controversy

Revision ID: 085
Revises: 084
Create Date: 2026-03-18
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '085'
down_revision = '084'
branch_labels = None
depends_on = None


def upgrade():
    # E108 — Regulatory Capital Optimization Engine (Basel IV / CRR3)
    op.create_table('regulatory_capital_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('institution_id', sa.String(100)),
        sa.Column('institution_name', sa.String(255)),
        sa.Column('institution_type', sa.String(50)),      # G-SII, O-SII, other
        sa.Column('reporting_date', sa.Date),
        sa.Column('total_assets_eur_bn', sa.Numeric(12, 2)),
        # Pillar 1 — Credit Risk
        sa.Column('sa_cr_rwa_eur_bn', sa.Numeric(12, 2)),  # SA-CR RWA
        sa.Column('irb_rwa_eur_bn', sa.Numeric(12, 2)),    # IRB RWA
        sa.Column('output_floor_rwa_eur_bn', sa.Numeric(12, 2)), # 72.5% output floor
        sa.Column('applicable_rwa_eur_bn', sa.Numeric(12, 2)),   # max(IRB, floor)
        # Market Risk (FRTB)
        sa.Column('frtb_sa_rwa_eur_bn', sa.Numeric(12, 2)),
        sa.Column('frtb_ima_rwa_eur_bn', sa.Numeric(12, 2)),
        # CVA / SA-CCR
        sa.Column('sa_ccr_ead_eur_bn', sa.Numeric(12, 2)),
        sa.Column('cva_rwa_eur_bn', sa.Numeric(12, 2)),
        # Operational Risk
        sa.Column('op_risk_rwa_eur_bn', sa.Numeric(12, 2)),
        sa.Column('total_rwa_eur_bn', sa.Numeric(12, 2)),
        # Capital ratios
        sa.Column('cet1_ratio_pct', sa.Numeric(5, 2)),
        sa.Column('tier1_ratio_pct', sa.Numeric(5, 2)),
        sa.Column('total_capital_ratio_pct', sa.Numeric(5, 2)),
        sa.Column('leverage_ratio_pct', sa.Numeric(5, 2)),
        sa.Column('nsfr_pct', sa.Numeric(5, 2)),
        sa.Column('lcr_pct', sa.Numeric(5, 2)),
        # Climate add-ons
        sa.Column('climate_rwa_addon_pct', sa.Numeric(5, 2)),
        sa.Column('climate_adjusted_cet1_pct', sa.Numeric(5, 2)),
        sa.Column('p2r_climate_addon_bps', sa.Numeric(6, 2)),
        sa.Column('optimization_opportunities', JSONB),
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('capital_optimization_actions',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('assessment_id', sa.Integer, sa.ForeignKey('regulatory_capital_assessments.id')),
        sa.Column('action_type', sa.String(50)),           # securitisation, hedge, portfolio_tilt, CRT, netting
        sa.Column('target_portfolio', sa.String(100)),
        sa.Column('rwa_reduction_eur_bn', sa.Numeric(10, 2)),
        sa.Column('cet1_impact_bps', sa.Numeric(6, 2)),
        sa.Column('implementation_cost_eur_mn', sa.Numeric(10, 2)),
        sa.Column('regulatory_approval_required', sa.Boolean),
        sa.Column('timeline_months', sa.Integer),
        sa.Column('priority_score', sa.Integer),           # 1-10
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    # E109 — Climate Policy Tracking Engine
    op.create_table('climate_policy_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('jurisdiction', sa.String(100)),
        sa.Column('assessment_date', sa.Date),
        sa.Column('ndc_ambition_score', sa.Numeric(5, 2)),     # 0-100
        sa.Column('ndc_target_year', sa.Integer),
        sa.Column('ndc_ghg_reduction_pct', sa.Numeric(5, 2)),  # vs base year
        sa.Column('ndc_base_year', sa.Integer),
        sa.Column('carbon_price_current', sa.Numeric(8, 2)),   # USD/tCO2
        sa.Column('carbon_price_2030_target', sa.Numeric(8, 2)),
        sa.Column('carbon_price_nze_corridor', sa.Numeric(8, 2)), # IEA NZE $130/t by 2030
        sa.Column('carbon_pricing_gap', sa.Numeric(8, 2)),
        sa.Column('policy_stringency_score', sa.Numeric(5, 2)),    # ClimPol index
        sa.Column('transition_risk_score', sa.Numeric(5, 2)),
        sa.Column('policy_credibility_score', sa.Numeric(5, 2)),
        sa.Column('regulatory_pipeline_count', sa.Integer),
        sa.Column('fit_for_55_alignment_pct', sa.Numeric(5, 2)), # EU only
        sa.Column('ira_coverage_pct', sa.Numeric(5, 2)),          # US only
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('policy_regulation_tracker',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('assessment_id', sa.Integer, sa.ForeignKey('climate_policy_assessments.id')),
        sa.Column('regulation_name', sa.String(255)),
        sa.Column('jurisdiction', sa.String(100)),
        sa.Column('policy_package', sa.String(100)),       # Fit_for_55, IRA, REPowerEU, etc.
        sa.Column('status', sa.String(30)),                # proposed, adopted, in_force, transposed
        sa.Column('effective_date', sa.Date),
        sa.Column('sectors_affected', sa.ARRAY(sa.Text)),
        sa.Column('carbon_price_impact', sa.Numeric(8, 2)),
        sa.Column('compliance_deadline', sa.Date),
        sa.Column('portfolio_impact_score', sa.Numeric(5, 2)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    # E110 — Export Credit & Blended Trade Finance ESG Engine
    op.create_table('export_credit_esg_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('transaction_id', sa.String(100)),
        sa.Column('exporter_country', sa.String(3)),
        sa.Column('importer_country', sa.String(3)),
        sa.Column('sector', sa.String(100)),
        sa.Column('transaction_value_usd', sa.Numeric(18, 2)),
        sa.Column('tenor_years', sa.Integer),
        sa.Column('eca_name', sa.String(100)),             # UK Export Finance, COFACE, Euler Hermes, SACE, etc.
        sa.Column('oecd_arrangement_compliance', sa.Boolean),
        sa.Column('sector_understanding_applicable', sa.Boolean), # climate sector understandings
        sa.Column('berne_union_esg_score', sa.Numeric(5, 2)),
        sa.Column('common_approaches_applicable', sa.Boolean), # OECD Common Approaches
        sa.Column('ifc_performance_standards_met', sa.Boolean),
        sa.Column('equator_principles_applicable', sa.Boolean),
        sa.Column('carbon_intensity_tco2_musd', sa.Numeric(10, 2)),
        sa.Column('fossil_fuel_classification', sa.String(30)), # excluded, restricted, permitted
        sa.Column('green_classification', sa.Boolean),
        sa.Column('miga_coverage_eligible', sa.Boolean),
        sa.Column('esg_risk_tier', sa.String(20)),
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    # E111 — ESG Controversy & Incident Tracking Engine
    op.create_table('esg_controversy_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_id', sa.String(100)),
        sa.Column('entity_name', sa.String(255)),
        sa.Column('assessment_date', sa.Date),
        sa.Column('sustainalytics_controversy_level', sa.Integer), # 1-5
        sa.Column('reprisk_risk_rating', sa.String(10)),   # AAA, AA, A, BBB, etc.
        sa.Column('reprisk_peak_rri', sa.Integer),         # 0-100
        sa.Column('active_incidents_count', sa.Integer),
        sa.Column('severe_incidents_count', sa.Integer),
        sa.Column('environmental_incidents', sa.Integer),
        sa.Column('social_incidents', sa.Integer),
        sa.Column('governance_incidents', sa.Integer),
        sa.Column('media_coverage_intensity', sa.String(20)), # low, medium, high, very_high
        sa.Column('ngo_campaign_active', sa.Boolean),
        sa.Column('regulatory_investigation_active', sa.Boolean),
        sa.Column('litigation_risk_score', sa.Numeric(5, 2)),
        sa.Column('revenue_at_risk_pct', sa.Numeric(5, 2)),
        sa.Column('reputational_risk_score', sa.Numeric(5, 2)),
        sa.Column('remediation_adequacy_score', sa.Numeric(5, 2)),
        sa.Column('controversy_trend', sa.String(20)),     # improving, stable, deteriorating
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('controversy_incident_registry',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('assessment_id', sa.Integer, sa.ForeignKey('esg_controversy_assessments.id')),
        sa.Column('incident_id', sa.String(50)),
        sa.Column('incident_date', sa.Date),
        sa.Column('incident_type', sa.String(100)),        # environmental_violation, labor_dispute, corruption, etc.
        sa.Column('esg_category', sa.String(10)),          # E, S, G
        sa.Column('severity', sa.String(20)),              # low, medium, high, critical
        sa.Column('source', sa.String(100)),               # RepRisk, Sustainalytics, NGO, media
        sa.Column('jurisdiction', sa.String(100)),
        sa.Column('financial_penalty_usd', sa.Numeric(18, 2)),
        sa.Column('remediation_status', sa.String(30)),    # open, in_progress, resolved, appealed
        sa.Column('ungc_violation', sa.Boolean),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('controversy_incident_registry')
    op.drop_table('esg_controversy_assessments')
    op.drop_table('export_credit_esg_assessments')
    op.drop_table('policy_regulation_tracker')
    op.drop_table('climate_policy_assessments')
    op.drop_table('capital_optimization_actions')
    op.drop_table('regulatory_capital_assessments')
