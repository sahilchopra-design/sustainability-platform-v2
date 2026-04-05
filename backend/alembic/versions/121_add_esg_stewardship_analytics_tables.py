"""Add engagement outcome, proxy voting, stewardship report, shareholder resolution, board competence, ESG integration tables (Sprint CP)

Revision ID: 121
Revises: 120
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '121'
down_revision = '120'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('engagement_outcomes', sa.Column('id', sa.Integer, primary_key=True), sa.Column('company_id', sa.String(50), index=True), sa.Column('company_name', sa.String(200)), sa.Column('engagement_type', sa.String(50)), sa.Column('ca100_focus', sa.Boolean), sa.Column('milestones', JSONB), sa.Column('escalation_level', sa.Integer), sa.Column('collaborative', sa.Boolean), sa.Column('outcome_assessment', sa.String(50)), sa.Column('impact_attribution', JSONB), sa.Column('started_at', sa.DateTime), sa.Column('last_updated', sa.DateTime, server_default=sa.func.now()))
    op.create_table('proxy_voting_climate', sa.Column('id', sa.Integer, primary_key=True), sa.Column('company_id', sa.String(50), index=True), sa.Column('resolution_year', sa.Integer), sa.Column('resolution_type', sa.String(100)), sa.Column('filer', sa.String(100)), sa.Column('support_pct', sa.Numeric(5,2)), sa.Column('management_recommendation', sa.String(20)), sa.Column('our_vote', sa.String(20)), sa.Column('say_on_climate', sa.Boolean), sa.Column('director_climate_score', JSONB))
    op.create_table('stewardship_reports', sa.Column('id', sa.Integer, primary_key=True), sa.Column('report_year', sa.Integer), sa.Column('framework', sa.String(50)), sa.Column('principles_met', JSONB), sa.Column('case_studies', JSONB), sa.Column('engagement_stats', JSONB), sa.Column('voting_stats', JSONB), sa.Column('generated_at', sa.DateTime, server_default=sa.func.now()), sa.Column('export_format', sa.String(20)))
    op.create_table('shareholder_resolutions', sa.Column('id', sa.Integer, primary_key=True), sa.Column('resolution_id', sa.String(50), unique=True), sa.Column('company_name', sa.String(200)), sa.Column('topic', sa.String(100)), sa.Column('year', sa.Integer), sa.Column('filer', sa.String(100)), sa.Column('support_pct', sa.Numeric(5,2)), sa.Column('outcome', sa.String(20)), sa.Column('management_response', sa.String(50)), sa.Column('impact_assessment', JSONB))
    op.create_table('board_climate_competence', sa.Column('id', sa.Integer, primary_key=True), sa.Column('company_id', sa.String(50), index=True), sa.Column('company_name', sa.String(200)), sa.Column('directors', JSONB), sa.Column('climate_committee', sa.Boolean), sa.Column('committee_mandate', sa.Text), sa.Column('meeting_frequency', sa.Integer), sa.Column('competence_score', sa.Integer), sa.Column('training_programmes', JSONB), sa.Column('peer_benchmark', JSONB))
    op.create_table('esg_integration_effectiveness', sa.Column('id', sa.Integer, primary_key=True), sa.Column('portfolio_id', sa.String(50), index=True), sa.Column('alpha_attribution_pct', sa.Numeric(5,2)), sa.Column('risk_reduction_pct', sa.Numeric(5,2)), sa.Column('pri_assessment_score', sa.Integer), sa.Column('integration_depth', JSONB), sa.Column('client_reporting', JSONB), sa.Column('process_maturity_score', sa.Integer), sa.Column('assessed_at', sa.DateTime, server_default=sa.func.now()))


def downgrade():
    op.drop_table('esg_integration_effectiveness')
    op.drop_table('board_climate_competence')
    op.drop_table('shareholder_resolutions')
    op.drop_table('stewardship_reports')
    op.drop_table('proxy_voting_climate')
    op.drop_table('engagement_outcomes')
