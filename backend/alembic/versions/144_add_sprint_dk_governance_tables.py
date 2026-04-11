"""Add Sprint DK — Climate Governance & Board Analytics tables

Revision ID: 144
Revises: 143
Create Date: 2026-04-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '144'
down_revision = '143'
branch_labels = None
depends_on = None


def upgrade():
    # EP-DK1: Board Climate Oversight
    op.create_table(
        'ep_dk1_board_oversight',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('company_name', sa.String(255), nullable=False),
        sa.Column('sector', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('board_size', sa.Integer()),
        sa.Column('climate_experts_on_board', sa.Integer()),
        sa.Column('board_climate_committee', sa.Boolean(), default=False),
        sa.Column('ceo_climate_kpi', sa.Boolean(), default=False),
        sa.Column('climate_in_executive_comp', sa.Boolean(), default=False),
        sa.Column('board_meetings_on_climate', sa.Integer()),
        sa.Column('climate_expertise_pct', sa.Numeric(5, 2)),
        sa.Column('governance_score', sa.Numeric(5, 2)),
        sa.Column('carbon_network_score', sa.Numeric(4, 2)),
        sa.Column('third_party_audit', sa.Boolean(), default=False),
        sa.Column('climate_skills_gap', sa.Numeric(4, 2)),
        sa.Column('governance_level', sa.String(50)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_ep_dk1_sector', 'ep_dk1_board_oversight', ['sector'])
    op.create_index('ix_ep_dk1_country', 'ep_dk1_board_oversight', ['country'])
    op.create_index('ix_ep_dk1_governance_score', 'ep_dk1_board_oversight', ['governance_score'])

    # EP-DK2: Fiduciary Climate Risk
    op.create_table(
        'ep_dk2_fiduciary_investors',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('investor_name', sa.String(255), nullable=False),
        sa.Column('investor_type', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('aum_bn', sa.Numeric(12, 2)),
        sa.Column('climate_risk_integration', sa.Numeric(4, 2)),
        sa.Column('fiduciary_score', sa.Numeric(5, 2)),
        sa.Column('net_zero_commitment', sa.Boolean(), default=False),
        sa.Column('engagement_policy', sa.Boolean(), default=False),
        sa.Column('exclusion_policy', sa.Boolean(), default=False),
        sa.Column('proxy_voting_climate_pct', sa.Numeric(5, 2)),
        sa.Column('climate_risk_disclosure', sa.Boolean(), default=False),
        sa.Column('tcfd_aligned', sa.Boolean(), default=False),
        sa.Column('litigation_risk', sa.Numeric(4, 2)),
        sa.Column('carbon_footprint', sa.Numeric(8, 2)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_ep_dk2_type', 'ep_dk2_fiduciary_investors', ['investor_type'])
    op.create_index('ix_ep_dk2_country', 'ep_dk2_fiduciary_investors', ['country'])
    op.create_index('ix_ep_dk2_fiduciary_score', 'ep_dk2_fiduciary_investors', ['fiduciary_score'])

    # EP-DK3: ESG Governance Scorer
    op.create_table(
        'ep_dk3_esg_governance',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('company_name', sa.String(255), nullable=False),
        sa.Column('sector', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('e_score', sa.Numeric(5, 2)),
        sa.Column('s_score', sa.Numeric(5, 2)),
        sa.Column('g_score', sa.Numeric(5, 2)),
        sa.Column('esg_total', sa.Numeric(5, 2)),
        sa.Column('controversies', sa.Integer()),
        sa.Column('anti_corruption', sa.Numeric(4, 2)),
        sa.Column('tax_transparency', sa.Numeric(4, 2)),
        sa.Column('executive_pay_ratio', sa.Numeric(7, 1)),
        sa.Column('whistleblower_policy', sa.Boolean(), default=False),
        sa.Column('board_diversity_pct', sa.Numeric(5, 2)),
        sa.Column('shareholder_rights', sa.Numeric(4, 2)),
        sa.Column('audit_quality', sa.Numeric(4, 2)),
        sa.Column('lobbying_disclosure', sa.Boolean(), default=False),
        sa.Column('esg_tier', sa.String(20)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_ep_dk3_sector', 'ep_dk3_esg_governance', ['sector'])
    op.create_index('ix_ep_dk3_esg_total', 'ep_dk3_esg_governance', ['esg_total'])
    op.create_index('ix_ep_dk3_tier', 'ep_dk3_esg_governance', ['esg_tier'])

    # EP-DK4: Climate Executive Pay
    op.create_table(
        'ep_dk4_exec_pay',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('exec_name', sa.String(255), nullable=False),
        sa.Column('company_name', sa.String(255)),
        sa.Column('sector', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('total_comp_m', sa.Numeric(8, 2)),
        sa.Column('climate_kpi_weight_pct', sa.Numeric(5, 2)),
        sa.Column('climate_bonus_actual_m', sa.Numeric(8, 3)),
        sa.Column('scope1_reduction_pct', sa.Numeric(5, 2)),
        sa.Column('scope1_target_pct', sa.Numeric(5, 2)),
        sa.Column('climate_metric_met', sa.Boolean(), default=False),
        sa.Column('carbon_pricing_incentive', sa.Boolean(), default=False),
        sa.Column('long_term_climate_vesting', sa.Boolean(), default=False),
        sa.Column('peer_benchmark_pct', sa.Numeric(6, 1)),
        sa.Column('pay_ratio', sa.Integer()),
        sa.Column('climate_pay_score', sa.Numeric(5, 2)),
        sa.Column('target_status', sa.String(20)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_ep_dk4_sector', 'ep_dk4_exec_pay', ['sector'])
    op.create_index('ix_ep_dk4_climate_kpi_weight', 'ep_dk4_exec_pay', ['climate_kpi_weight_pct'])
    op.create_index('ix_ep_dk4_target_status', 'ep_dk4_exec_pay', ['target_status'])

    # EP-DK5: Shareholder Climate Engagement
    op.create_table(
        'ep_dk5_engagement_campaigns',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('company_name', sa.String(255), nullable=False),
        sa.Column('sector', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('resolution_type', sa.String(100)),
        sa.Column('year', sa.Integer()),
        sa.Column('support_pct', sa.Numeric(5, 2)),
        sa.Column('outcome', sa.String(50)),
        sa.Column('filing_investor', sa.String(255)),
        sa.Column('co_filers', sa.Integer()),
        sa.Column('management_recommendation', sa.String(20)),
        sa.Column('post_engagement_commitment', sa.Boolean(), default=False),
        sa.Column('engagement_duration_months', sa.Integer()),
        sa.Column('iss_score', sa.Integer()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_ep_dk5_sector', 'ep_dk5_engagement_campaigns', ['sector'])
    op.create_index('ix_ep_dk5_resolution_type', 'ep_dk5_engagement_campaigns', ['resolution_type'])
    op.create_index('ix_ep_dk5_year', 'ep_dk5_engagement_campaigns', ['year'])
    op.create_index('ix_ep_dk5_outcome', 'ep_dk5_engagement_campaigns', ['outcome'])

    # EP-DK6: Climate Reg & Policy Tracker
    op.create_table(
        'ep_dk6_reg_policies',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('policy_name', sa.String(500), nullable=False),
        sa.Column('jurisdiction', sa.String(100)),
        sa.Column('region', sa.String(100)),
        sa.Column('policy_type', sa.String(100)),
        sa.Column('status', sa.String(50)),
        sa.Column('effective_year', sa.Integer()),
        sa.Column('carbon_price_equivalent', sa.Numeric(8, 2)),
        sa.Column('affected_sector_count', sa.Integer()),
        sa.Column('compliance_cost_bn', sa.Numeric(8, 2)),
        sa.Column('policy_ambitiousness', sa.Numeric(4, 2)),
        sa.Column('aligned_with_paris', sa.Boolean(), default=False),
        sa.Column('enforcement_risk', sa.Numeric(4, 2)),
        sa.Column('business_impact_score', sa.Numeric(4, 2)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_ep_dk6_jurisdiction', 'ep_dk6_reg_policies', ['jurisdiction'])
    op.create_index('ix_ep_dk6_region', 'ep_dk6_reg_policies', ['region'])
    op.create_index('ix_ep_dk6_policy_type', 'ep_dk6_reg_policies', ['policy_type'])
    op.create_index('ix_ep_dk6_status', 'ep_dk6_reg_policies', ['status'])
    op.create_index('ix_ep_dk6_effective_year', 'ep_dk6_reg_policies', ['effective_year'])


def downgrade():
    op.drop_table('ep_dk6_reg_policies')
    op.drop_table('ep_dk5_engagement_campaigns')
    op.drop_table('ep_dk4_exec_pay')
    op.drop_table('ep_dk3_esg_governance')
    op.drop_table('ep_dk2_fiduciary_investors')
    op.drop_table('ep_dk1_board_oversight')
