"""Add E112–E115 tables: CRREM Green Buildings, Loss & Damage Finance, Forced Labour, SLL/SLB v2

Revision ID: 086
Revises: 085
Create Date: 2026-03-18
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '086'
down_revision = '085'
branch_labels = None
depends_on = None


def upgrade():
    # E112 — CRREM & Green Buildings Engine
    op.create_table('crrem_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('asset_id', sa.String(100)),
        sa.Column('asset_name', sa.String(255)),
        sa.Column('building_type', sa.String(50)),         # office, retail, residential, hotel, industrial, logistics, etc.
        sa.Column('country_iso', sa.String(3)),
        sa.Column('gross_floor_area_m2', sa.Numeric(10, 2)),
        sa.Column('construction_year', sa.Integer),
        sa.Column('current_epc_rating', sa.String(5)),     # A, B, C, D, E, F, G
        sa.Column('current_energy_intensity_kwh_m2', sa.Numeric(8, 2)),
        sa.Column('current_carbon_intensity_kgco2_m2', sa.Numeric(8, 2)),
        sa.Column('crrem_15c_pathway_kgco2_m2_2030', sa.Numeric(8, 2)),
        sa.Column('crrem_20c_pathway_kgco2_m2_2030', sa.Numeric(8, 2)),
        sa.Column('stranding_year_15c', sa.Integer),       # year asset exceeds 1.5°C pathway
        sa.Column('stranding_year_20c', sa.Integer),
        sa.Column('stranding_risk_tier', sa.String(20)),   # immediate, near_term, medium_term, low
        sa.Column('energy_performance_gap_pct', sa.Numeric(5, 2)),
        sa.Column('retrofit_capex_eur_m2', sa.Numeric(8, 2)),
        sa.Column('retrofit_npv_eur', sa.Numeric(18, 2)),
        sa.Column('green_premium_pct', sa.Numeric(5, 2)),  # green premium on rent/value
        sa.Column('brown_discount_pct', sa.Numeric(5, 2)),
        sa.Column('gresb_score', sa.Numeric(5, 2)),
        sa.Column('target_epc_rating', sa.String(5)),
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('retrofit_action_plans',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('assessment_id', sa.Integer, sa.ForeignKey('crrem_assessments.id')),
        sa.Column('measure_type', sa.String(100)),         # insulation, HVAC, solar, windows, LED, heat_pump, etc.
        sa.Column('energy_saving_kwh_yr', sa.Numeric(12, 2)),
        sa.Column('carbon_saving_tco2_yr', sa.Numeric(8, 2)),
        sa.Column('capex_eur', sa.Numeric(12, 2)),
        sa.Column('payback_years', sa.Numeric(4, 1)),
        sa.Column('irr_pct', sa.Numeric(5, 2)),
        sa.Column('epc_improvement', sa.String(10)),       # e.g. "D→B"
        sa.Column('implementation_phase', sa.Integer),     # 1, 2, 3
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    # E113 — Loss & Damage Finance Engine
    op.create_table('loss_damage_finance_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('country_iso', sa.String(3)),
        sa.Column('country_name', sa.String(255)),
        sa.Column('vulnerability_group', sa.String(30)),   # V20, SIDS, LDC, AOSIS, G77
        sa.Column('assessment_year', sa.Integer),
        sa.Column('economic_loss_usd_bn', sa.Numeric(12, 2)),
        sa.Column('non_economic_loss_score', sa.Numeric(5, 2)),  # cultural, biodiversity, etc.
        sa.Column('insured_loss_pct', sa.Numeric(5, 2)),
        sa.Column('protection_gap_usd_bn', sa.Numeric(12, 2)),
        sa.Column('warsaw_mechanism_eligibility', sa.Boolean),
        sa.Column('santiago_network_eligible', sa.Boolean),
        sa.Column('cop28_fund_eligible', sa.Boolean),
        sa.Column('gcf_raf_score', sa.Numeric(5, 2)),      # GCF Readiness Access Framework
        sa.Column('climate_attribution_pct', sa.Numeric(5, 2)),  # % attributable to climate change
        sa.Column('loss_trend_5yr', sa.String(20)),        # increasing, stable, decreasing
        sa.Column('rapid_response_finance_needed_usd_mn', sa.Numeric(10, 2)),
        sa.Column('parametric_trigger_design', JSONB),
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    # E114 — Forced Labour & Modern Slavery Engine
    op.create_table('forced_labour_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_id', sa.String(100)),
        sa.Column('entity_name', sa.String(255)),
        sa.Column('sector', sa.String(100)),
        sa.Column('supply_chain_origin_countries', sa.ARRAY(sa.Text)),
        sa.Column('uk_msa_compliant', sa.Boolean),         # UK Modern Slavery Act 2015
        sa.Column('uk_msa_statement_quality', sa.String(20)), # poor, basic, good, leading
        sa.Column('eu_fl_reg_compliant', sa.Boolean),      # EU Forced Labour Reg 2024/3015
        sa.Column('uflpa_exposure', sa.Boolean),           # US Uyghur Forced Labor Prevention Act
        sa.Column('uflpa_xinjiang_exposure_pct', sa.Numeric(5, 2)),
        sa.Column('ilo_indicator_score', sa.Numeric(5, 2)),  # 0-100, 11 ILO indicators
        sa.Column('child_labour_risk_score', sa.Numeric(5, 2)),
        sa.Column('forced_labour_risk_score', sa.Numeric(5, 2)),
        sa.Column('debt_bondage_risk_score', sa.Numeric(5, 2)),
        sa.Column('recruitment_fee_risk_score', sa.Numeric(5, 2)),
        sa.Column('high_risk_supplier_count', sa.Integer),
        sa.Column('audit_coverage_pct', sa.Numeric(5, 2)),
        sa.Column('grievance_mechanism_score', sa.Numeric(5, 2)),
        sa.Column('remediation_programme_score', sa.Numeric(5, 2)),
        sa.Column('overall_risk_tier', sa.String(20)),     # low, medium, high, critical
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('supply_chain_labour_map',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('assessment_id', sa.Integer, sa.ForeignKey('forced_labour_assessments.id')),
        sa.Column('tier', sa.Integer),                     # 1, 2, 3, 4
        sa.Column('supplier_name', sa.String(255)),
        sa.Column('country_iso', sa.String(3)),
        sa.Column('commodity', sa.String(100)),
        sa.Column('ilo_risk_flag', sa.Boolean),
        sa.Column('uflpa_flag', sa.Boolean),
        sa.Column('cahra_flag', sa.Boolean),
        sa.Column('audit_status', sa.String(30)),          # audited, scheduled, unaudited
        sa.Column('audit_scheme', sa.String(50)),          # SMETA, SA8000, BSCI, Sedex
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    # E115 — Sustainability-Linked Loan & Bond v2 Engine
    op.create_table('sll_slb_v2_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('instrument_id', sa.String(100)),
        sa.Column('instrument_type', sa.String(20)),       # SLL, SLB, SLB_callable, dual-recourse
        sa.Column('issuer_name', sa.String(255)),
        sa.Column('sector', sa.String(100)),
        sa.Column('notional_usd', sa.Numeric(18, 2)),
        sa.Column('tenor_years', sa.Numeric(4, 1)),
        sa.Column('framework', sa.String(30)),             # ICMA_SLBP, LMA_SLLP, APLMA_SLLP
        sa.Column('kpi_count', sa.Integer),
        sa.Column('kpi_materiality_score', sa.Numeric(5, 2)), # 0-100 overall materiality
        sa.Column('spt_ambition_score', sa.Numeric(5, 2)),    # 0-100 (ambitious/credible/measurable)
        sa.Column('sda_aligned', sa.Boolean),              # SBTi SDA trajectory alignment
        sa.Column('baseline_year', sa.Integer),
        sa.Column('spt_observation_date_1', sa.Date),
        sa.Column('spt_observation_date_2', sa.Date),
        sa.Column('margin_step_up_bps', sa.Numeric(5, 2)),
        sa.Column('margin_step_down_bps', sa.Numeric(5, 2)),
        sa.Column('coupon_adjustment_mechanism', sa.String(30)), # step_up_only, bidirectional, ratchet
        sa.Column('verifier_type', sa.String(50)),         # second_party, external_reviewer, auditor
        sa.Column('greenwashing_risk_score', sa.Numeric(5, 2)),
        sa.Column('overall_quality_score', sa.Numeric(5, 2)),
        sa.Column('icma_alignment_pct', sa.Numeric(5, 2)),
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('sll_slb_v2_assessments')
    op.drop_table('supply_chain_labour_map')
    op.drop_table('forced_labour_assessments')
    op.drop_table('loss_damage_finance_assessments')
    op.drop_table('retrofit_action_plans')
    op.drop_table('crrem_assessments')
