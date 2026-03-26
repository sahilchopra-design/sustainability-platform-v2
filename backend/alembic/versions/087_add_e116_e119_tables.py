"""Add E116–E119 tables: Nature Capital Accounting, RegTech Horizon, Climate Tech, Report Aggregator

Revision ID: 087
Revises: 086
Create Date: 2026-03-18
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '087'
down_revision = '086'
branch_labels = None
depends_on = None


def upgrade():
    # E116 — Nature Capital Accounting Engine (SEEA EA 2021)
    op.create_table('nature_capital_accounting_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_id', sa.String(100)),
        sa.Column('entity_name', sa.String(255)),
        sa.Column('reporting_year', sa.Integer),
        sa.Column('land_area_ha', sa.Numeric(12, 2)),
        # SEEA EA asset accounts
        sa.Column('ecosystem_extent_ha', sa.Numeric(12, 2)),
        sa.Column('ecosystem_condition_index', sa.Numeric(5, 3)),  # 0-1
        sa.Column('ecosystem_service_value_usd', sa.Numeric(18, 2)),
        # Natural Capital Protocol
        sa.Column('ncp_scope', sa.String(30)),             # direct_ops, supply_chain, full_value_chain
        sa.Column('ncp_business_value_usd', sa.Numeric(18, 2)),
        sa.Column('ncp_social_value_usd', sa.Numeric(18, 2)),
        # Total Economic Value
        sa.Column('tev_use_value_usd', sa.Numeric(18, 2)),
        sa.Column('tev_non_use_value_usd', sa.Numeric(18, 2)),
        sa.Column('tev_total_usd', sa.Numeric(18, 2)),
        # TNFD LEAP
        sa.Column('tnfd_locate_score', sa.Numeric(5, 2)),
        sa.Column('tnfd_evaluate_score', sa.Numeric(5, 2)),
        sa.Column('tnfd_assess_score', sa.Numeric(5, 2)),
        sa.Column('tnfd_prepare_score', sa.Numeric(5, 2)),
        sa.Column('tnfd_overall_score', sa.Numeric(5, 2)),
        # SBTN
        sa.Column('sbtn_readiness_step', sa.Integer),      # 1-5
        sa.Column('sbtn_freshwater_target_set', sa.Boolean),
        sa.Column('sbtn_land_target_set', sa.Boolean),
        sa.Column('sbtn_ocean_target_set', sa.Boolean),
        sa.Column('nature_positive_composite', sa.Numeric(5, 2)),
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('ecosystem_service_valuations',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('assessment_id', sa.Integer, sa.ForeignKey('nature_capital_accounting_assessments.id')),
        sa.Column('ecosystem_service', sa.String(100)),    # provisioning, regulating, cultural, supporting
        sa.Column('service_sub_type', sa.String(100)),
        sa.Column('valuation_method', sa.String(50)),      # market_price, benefit_transfer, hedonic, contingent_valuation, production_function
        sa.Column('physical_quantity', sa.Numeric(14, 2)),
        sa.Column('physical_unit', sa.String(50)),
        sa.Column('monetary_value_usd', sa.Numeric(18, 2)),
        sa.Column('uncertainty_range_pct', sa.Numeric(5, 2)),
        sa.Column('data_quality_tier', sa.String(20)),     # primary, secondary, modelled
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    # E117 — Regulatory Horizon Scanning Engine
    op.create_table('regulatory_horizon_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_id', sa.String(100)),
        sa.Column('entity_type', sa.String(50)),           # bank, insurer, asset_manager, corporate, pension
        sa.Column('jurisdiction', sa.String(100)),
        sa.Column('scan_date', sa.Date),
        sa.Column('horizon_years', sa.Integer),            # 1, 3, 5, 10
        sa.Column('total_regulations_tracked', sa.Integer),
        sa.Column('high_impact_regulations', sa.Integer),
        sa.Column('implementation_readiness_score', sa.Numeric(5, 2)),  # 0-100
        sa.Column('compliance_cost_estimate_usd_mn', sa.Numeric(10, 2)),
        sa.Column('regulatory_change_velocity', sa.String(20)),  # slow, moderate, fast, accelerating
        sa.Column('top_priority_regulation', sa.String(255)),
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('horizon_regulation_pipeline',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('assessment_id', sa.Integer, sa.ForeignKey('regulatory_horizon_assessments.id')),
        sa.Column('regulation_name', sa.String(255)),
        sa.Column('short_name', sa.String(50)),
        sa.Column('regulator', sa.String(100)),
        sa.Column('jurisdiction', sa.String(100)),
        sa.Column('topic', sa.String(50)),                 # climate, biodiversity, social, governance, AI
        sa.Column('current_status', sa.String(30)),        # consultation, proposed, level2, adopted, in_force
        sa.Column('expected_in_force_date', sa.Date),
        sa.Column('compliance_deadline', sa.Date),
        sa.Column('entity_applicability', sa.Boolean),
        sa.Column('impact_score', sa.Integer),             # 1-5
        sa.Column('readiness_gap_score', sa.Integer),      # 1-5 (5 = large gap)
        sa.Column('estimated_compliance_cost_usd_mn', sa.Numeric(10, 2)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    # E118 — Climate Tech Investment Engine
    op.create_table('climate_tech_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('technology_name', sa.String(255)),
        sa.Column('technology_category', sa.String(50)),   # solar, wind, battery, H2, CCS, DAC, nuclear, EV, etc.
        sa.Column('ctvc_sector', sa.String(50)),           # CTVC 11-sector taxonomy
        sa.Column('assessment_date', sa.Date),
        sa.Column('trl', sa.Integer),                      # Technology Readiness Level 1-9
        sa.Column('global_capacity_gw', sa.Numeric(10, 2)),
        sa.Column('annual_deployment_gw', sa.Numeric(10, 2)),
        sa.Column('iea_nze_target_2030_gw', sa.Numeric(10, 2)),
        sa.Column('deployment_gap_pct', sa.Numeric(5, 2)),
        # Learning curve
        sa.Column('learning_rate_pct', sa.Numeric(5, 2)),  # cost reduction per doubling of capacity
        sa.Column('current_lcoe_usd_mwh', sa.Numeric(8, 2)),
        sa.Column('target_lcoe_2030_usd_mwh', sa.Numeric(8, 2)),
        sa.Column('target_lcoe_2050_usd_mwh', sa.Numeric(8, 2)),
        # Investment
        sa.Column('annual_investment_usd_bn', sa.Numeric(10, 2)),
        sa.Column('iea_required_2030_usd_bn', sa.Numeric(10, 2)),
        sa.Column('vc_deal_count_ytd', sa.Integer),
        sa.Column('vc_investment_usd_bn', sa.Numeric(10, 2)),
        sa.Column('patent_intensity_score', sa.Numeric(5, 2)),
        sa.Column('abatement_potential_gtco2_yr', sa.Numeric(8, 2)),
        sa.Column('mac_usd_tco2', sa.Numeric(8, 2)),       # marginal abatement cost
        sa.Column('investment_attractiveness_score', sa.Numeric(5, 2)),
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    # E119 — Comprehensive Reporting Aggregator Engine
    op.create_table('comprehensive_report_runs',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_id', sa.String(100)),
        sa.Column('entity_name', sa.String(255)),
        sa.Column('reporting_year', sa.Integer),
        sa.Column('report_type', sa.String(30)),           # CSRD, SFDR, TCFD, TNFD, ISSB, COMBINED
        sa.Column('frameworks_included', sa.ARRAY(sa.Text)),
        sa.Column('completeness_score', sa.Numeric(5, 2)),
        sa.Column('mandatory_dp_count', sa.Integer),
        sa.Column('disclosed_dp_count', sa.Integer),
        sa.Column('estimated_dp_count', sa.Integer),
        sa.Column('missing_dp_count', sa.Integer),
        sa.Column('xbrl_tagged', sa.Boolean),
        sa.Column('pdf_generated', sa.Boolean),
        sa.Column('esap_submission_ready', sa.Boolean),
        sa.Column('assurance_level', sa.String(20)),
        sa.Column('data_lineage_score', sa.Numeric(5, 2)),
        sa.Column('cross_framework_consistency_score', sa.Numeric(5, 2)),
        sa.Column('report_url', sa.Text),
        sa.Column('xbrl_url', sa.Text),
        sa.Column('generation_status', sa.String(20)),     # pending, processing, complete, failed
        sa.Column('full_report_data', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('report_framework_sections',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('run_id', sa.Integer, sa.ForeignKey('comprehensive_report_runs.id')),
        sa.Column('framework', sa.String(30)),             # ESRS, SFDR_RTS, TCFD, TNFD, IFRS_S2
        sa.Column('section_name', sa.String(255)),
        sa.Column('disclosure_reference', sa.String(100)), # e.g. "ESRS E1-6", "TCFD S-1"
        sa.Column('completeness_pct', sa.Numeric(5, 2)),
        sa.Column('source_modules', sa.ARRAY(sa.Text)),    # which engines provided data
        sa.Column('cross_reference', JSONB),               # mapping to other frameworks
        sa.Column('content_summary', sa.Text),
        sa.Column('quality_flag', sa.String(20)),          # ok, estimated, missing, inconsistent
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('report_framework_sections')
    op.drop_table('comprehensive_report_runs')
    op.drop_table('climate_tech_assessments')
    op.drop_table('horizon_regulation_pipeline')
    op.drop_table('regulatory_horizon_assessments')
    op.drop_table('ecosystem_service_valuations')
    op.drop_table('nature_capital_accounting_assessments')
