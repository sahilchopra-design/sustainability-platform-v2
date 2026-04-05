"""Add green bond optimizer, transition bond credibility, blended finance, CBI index, green loan, impact bond tables (Sprint CQ)

Revision ID: 122
Revises: 121
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '122'
down_revision = '121'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('green_bond_optimization', sa.Column('id', sa.Integer, primary_key=True), sa.Column('portfolio_id', sa.String(50), index=True), sa.Column('universe_size', sa.Integer), sa.Column('optimization_constraints', JSONB), sa.Column('efficient_frontier', JSONB), sa.Column('greenium_impact_bps', sa.Numeric(6,2)), sa.Column('taxonomy_aligned_pct', sa.Numeric(5,2)), sa.Column('duration_target', sa.Numeric(5,2)), sa.Column('tracking_error_bps', sa.Numeric(6,2)), sa.Column('optimal_allocation', JSONB), sa.Column('run_date', sa.DateTime, server_default=sa.func.now()))
    op.create_table('transition_bond_credibility', sa.Column('id', sa.Integer, primary_key=True), sa.Column('bond_isin', sa.String(20), index=True), sa.Column('issuer', sa.String(200)), sa.Column('bond_type', sa.String(20)), sa.Column('kpi_strength_score', sa.Integer), sa.Column('step_up_probability', sa.Numeric(5,3)), sa.Column('uop_verification_status', sa.String(20)), sa.Column('issuer_credibility_score', sa.Integer), sa.Column('peer_comparison', JSONB), sa.Column('assessment_date', sa.DateTime, server_default=sa.func.now()))
    op.create_table('blended_finance_structures', sa.Column('id', sa.Integer, primary_key=True), sa.Column('deal_name', sa.String(200)), sa.Column('sector', sa.String(50)), sa.Column('total_size_usd_m', sa.Numeric(10,2)), sa.Column('tranches', JSONB), sa.Column('catalytic_ratio', sa.Numeric(5,2)), sa.Column('first_loss_pct', sa.Numeric(5,2)), sa.Column('expected_return_by_tranche', JSONB), sa.Column('impact_metrics', JSONB), sa.Column('dfi_involvement', JSONB))
    op.create_table('climate_bond_index_data', sa.Column('id', sa.Integer, primary_key=True), sa.Column('index_name', sa.String(100)), sa.Column('date', sa.Date), sa.Column('total_return', sa.Numeric(8,4)), sa.Column('yield_pct', sa.Numeric(5,3)), sa.Column('duration', sa.Numeric(5,2)), sa.Column('num_constituents', sa.Integer), sa.Column('sector_allocation', JSONB), sa.Column('geographic_distribution', JSONB), sa.Column('new_issuance_usd_bn', sa.Numeric(8,2)))
    op.create_table('green_loan_frameworks', sa.Column('id', sa.Integer, primary_key=True), sa.Column('loan_id', sa.String(50), index=True), sa.Column('borrower', sa.String(200)), sa.Column('loan_type', sa.String(20)), sa.Column('glp_aligned', sa.Boolean), sa.Column('sllp_aligned', sa.Boolean), sa.Column('margin_ratchet_bps', sa.Numeric(6,2)), sa.Column('esg_kpis', JSONB), sa.Column('covenant_design', JSONB), sa.Column('testing_frequency', sa.String(20)), sa.Column('reporting_template', JSONB))
    op.create_table('impact_bond_analytics', sa.Column('id', sa.Integer, primary_key=True), sa.Column('bond_id', sa.String(50), index=True), sa.Column('bond_type', sa.String(30)), sa.Column('outcome_metrics', JSONB), sa.Column('sroi', sa.Numeric(6,2)), sa.Column('additionality_score', sa.Integer), sa.Column('target_outcomes', JSONB), sa.Column('actual_outcomes', JSONB), sa.Column('investor_return_pct', sa.Numeric(5,2)))


def downgrade():
    op.drop_table('impact_bond_analytics')
    op.drop_table('green_loan_frameworks')
    op.drop_table('climate_bond_index_data')
    op.drop_table('blended_finance_structures')
    op.drop_table('transition_bond_credibility')
    op.drop_table('green_bond_optimization')
