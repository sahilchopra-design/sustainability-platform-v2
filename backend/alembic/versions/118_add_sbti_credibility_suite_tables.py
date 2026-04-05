"""Add SBTi credibility, temperature waterfall, net zero index, scope 3 materiality, target tracker, peer benchmark tables (Sprint CM)

Revision ID: 118
Revises: 117
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '118'
down_revision = '117'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('sbti_credibility_scores', sa.Column('id', sa.Integer, primary_key=True), sa.Column('company_id', sa.String(50), index=True), sa.Column('company_name', sa.String(200)), sa.Column('validation_status', sa.String(20)), sa.Column('target_ambition', sa.String(10)), sa.Column('scope_coverage', sa.String(20)), sa.Column('interim_milestones', JSONB), sa.Column('action_evidence', JSONB), sa.Column('credibility_score', sa.Integer), sa.Column('say_do_gap_pct', sa.Numeric(5,2)), sa.Column('scored_at', sa.DateTime, server_default=sa.func.now()))
    op.create_table('temperature_alignment_waterfall', sa.Column('id', sa.Integer, primary_key=True), sa.Column('portfolio_id', sa.String(50), index=True), sa.Column('portfolio_itr', sa.Numeric(4,2)), sa.Column('sector_contributions', JSONB), sa.Column('company_contributions', JSONB), sa.Column('scope_decomposition', JSONB), sa.Column('what_if_scenarios', JSONB), sa.Column('target_gap', sa.Numeric(4,2)), sa.Column('run_date', sa.DateTime, server_default=sa.func.now()))
    op.create_table('net_zero_credibility_index', sa.Column('id', sa.Integer, primary_key=True), sa.Column('company_id', sa.String(50), index=True), sa.Column('company_name', sa.String(200)), sa.Column('kpi_scores', JSONB), sa.Column('composite_score', sa.Integer), sa.Column('rating', sa.String(2)), sa.Column('capex_green_ratio', sa.Numeric(5,2)), sa.Column('lobbying_alignment', sa.Numeric(5,2)), sa.Column('exec_comp_linkage', sa.Boolean), sa.Column('offset_dependency_pct', sa.Numeric(5,2)), sa.Column('scored_at', sa.DateTime, server_default=sa.func.now()))
    op.create_table('scope3_materiality', sa.Column('id', sa.Integer, primary_key=True), sa.Column('company_id', sa.String(50), index=True), sa.Column('sector', sa.String(50)), sa.Column('category_materiality', JSONB), sa.Column('data_quality_by_category', JSONB), sa.Column('supplier_engagement_pct', sa.Numeric(5,2)), sa.Column('estimation_methodology', sa.String(50)), sa.Column('improvement_roadmap', JSONB))
    op.create_table('target_vs_action_tracking', sa.Column('id', sa.Integer, primary_key=True), sa.Column('company_id', sa.String(50), index=True), sa.Column('target_description', sa.Text), sa.Column('target_year', sa.Integer), sa.Column('baseline_year', sa.Integer), sa.Column('progress_pct', sa.Numeric(5,2)), sa.Column('on_track', sa.Boolean), sa.Column('capex_trajectory', JSONB), sa.Column('tech_deployment', JSONB), sa.Column('policy_advocacy_consistent', sa.Boolean), sa.Column('gap_analysis', JSONB))
    op.create_table('peer_transition_benchmarks', sa.Column('id', sa.Integer, primary_key=True), sa.Column('sector', sa.String(50)), sa.Column('company_id', sa.String(50), index=True), sa.Column('company_name', sa.String(200)), sa.Column('transition_score', sa.Integer), sa.Column('pillar_scores', JSONB), sa.Column('peer_rank', sa.Integer), sa.Column('peer_count', sa.Integer), sa.Column('best_in_class', sa.Boolean), sa.Column('convergence_trend', sa.String(20)))


def downgrade():
    op.drop_table('peer_transition_benchmarks')
    op.drop_table('target_vs_action_tracking')
    op.drop_table('scope3_materiality')
    op.drop_table('net_zero_credibility_index')
    op.drop_table('temperature_alignment_waterfall')
    op.drop_table('sbti_credibility_scores')
