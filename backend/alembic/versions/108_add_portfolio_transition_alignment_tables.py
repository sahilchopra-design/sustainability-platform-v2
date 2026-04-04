"""add portfolio transition alignment, financed emissions, and transition finance tables

Revision ID: 108
Revises: 107
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '108'
down_revision = '107'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Portfolio transition alignment — GFANZ/TPT aligned
    op.create_table('portfolio_transition_alignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('portfolio_name', sa.String(200)),
        sa.Column('assessment_date', sa.Date()),
        sa.Column('total_aum_usd_mn', sa.Numeric(16, 2)),
        # Implied temperature rise (ITR)
        sa.Column('portfolio_itr', sa.Numeric(4, 2)),       # °C by 2100
        sa.Column('itr_method', sa.String(50)),              # TCFD/MSCI/Trucost/PACTA
        sa.Column('itr_by_sector', JSONB),                   # [{sector, itr_c, weight_pct, aum_usd_mn}]
        # GFANZ alignment pillars
        sa.Column('gfanz_commitment_level', sa.String(50)),  # committed, transitioning, not_aligned
        sa.Column('gfanz_net_zero_year', sa.Integer()),
        sa.Column('gfanz_interim_target_2030', sa.Numeric(6, 2)),  # % reduction
        # TPT (Taskforce on Nature) alignment
        sa.Column('tpt_strategy_score', sa.Numeric(6, 2)),   # 0–100
        sa.Column('tpt_governance_score', sa.Numeric(6, 2)),
        sa.Column('tpt_metrics_score', sa.Numeric(6, 2)),
        sa.Column('tpt_overall', sa.Numeric(6, 2)),
        # PACTA alignment
        sa.Column('pacta_aligned_pct', sa.Numeric(6, 2)),    # % of portfolio 2D aligned
        sa.Column('pacta_misaligned_pct', sa.Numeric(6, 2)),
        sa.Column('pacta_by_technology', JSONB),
        # Engagement metrics
        sa.Column('engagement_coverage_pct', sa.Numeric(6, 2)),
        sa.Column('escalation_targets', JSONB),              # [{company, engagement_status, escalation_action}]
        sa.Column('divestment_candidates', JSONB),
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

    # Financed emissions — PCAF-aligned
    op.create_table('financed_emissions_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('portfolio_name', sa.String(200)),
        sa.Column('reporting_year', sa.Integer()),
        sa.Column('asset_class', sa.String(50)),             # listed_equity, corporate_bonds, project_finance, mortgages, commercial_re, sme
        sa.Column('pcaf_asset_class', sa.String(50)),        # PCAF category
        sa.Column('pcaf_data_quality_score', sa.Numeric(4, 2)),  # 1–5
        sa.Column('outstanding_amount_usd_mn', sa.Numeric(16, 2)),
        sa.Column('company_enterprise_value', sa.Numeric(16, 2)),  # for equity/bonds attribution
        sa.Column('attribution_factor', sa.Numeric(8, 6)),   # loan/EVIC or loan/property_value
        sa.Column('scope1_gross_mtco2e', sa.Numeric(12, 4)),
        sa.Column('scope2_gross_mtco2e', sa.Numeric(12, 4)),
        sa.Column('scope3_gross_mtco2e', sa.Numeric(12, 4)),
        sa.Column('financed_emissions_mtco2e', sa.Numeric(12, 4)),  # attributed
        sa.Column('avoided_emissions_mtco2e', sa.Numeric(12, 4)),
        sa.Column('waci', sa.Numeric(12, 4)),                # Weighted Avg Carbon Intensity tCO2e/M$revenue
        sa.Column('absolute_target_2025', sa.Numeric(12, 4)),
        sa.Column('absolute_target_2030', sa.Numeric(12, 4)),
        sa.Column('absolute_target_2050', sa.Numeric(12, 4)),
        sa.Column('on_track', sa.Boolean()),
        sa.Column('emissions_by_company', JSONB),            # [{company, financed_emissions, attribution_factor}]
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

    # Transition finance screener
    op.create_table('transition_finance_instruments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('instrument_id', sa.String(50)),
        sa.Column('instrument_name', sa.String(300)),
        sa.Column('issuer', sa.String(200)),
        sa.Column('instrument_type', sa.String(50)),         # green_bond, sustainability_bond, transition_bond, SLB, blue_bond
        sa.Column('isin', sa.String(20)),
        sa.Column('issue_date', sa.Date()),
        sa.Column('maturity_date', sa.Date()),
        sa.Column('face_value_usd_mn', sa.Numeric(16, 2)),
        sa.Column('coupon_pct', sa.Numeric(6, 4)),
        sa.Column('greenium_bps', sa.Numeric(8, 2)),         # green premium vs. vanilla
        # Label/certification
        sa.Column('label', sa.String(50)),                   # ICMA_GBP, CBI, EU_GBS, ASEAN
        sa.Column('second_opinion_provider', sa.String(100)),
        sa.Column('external_review', sa.String(50)),         # second_opinion, verification, rating, assurance
        # Use of proceeds / KPIs
        sa.Column('use_of_proceeds', JSONB),                 # [{category, allocation_pct, amount_usd_mn}]
        sa.Column('kpi_targets', JSONB),                     # [{kpi, baseline, target, target_year}]
        sa.Column('step_up_bps', sa.Numeric(6, 2)),          # SLB coupon step-up if KPI missed
        # EU Taxonomy alignment
        sa.Column('taxonomy_aligned_pct', sa.Numeric(6, 2)),
        sa.Column('taxonomy_eligible_pct', sa.Numeric(6, 2)),
        sa.Column('dnsh_assessment', JSONB),                 # Do No Significant Harm per objective
        # Paris alignment
        sa.Column('paris_aligned', sa.Boolean()),
        sa.Column('implied_temperature_rise', sa.Numeric(4, 2)),
        sa.Column('screening_result', sa.String(20)),        # pass, fail, watch, insufficient_data
        sa.Column('screening_notes', sa.Text()),
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('transition_finance_instruments')
    op.drop_table('financed_emissions_records')
    op.drop_table('portfolio_transition_alignments')
