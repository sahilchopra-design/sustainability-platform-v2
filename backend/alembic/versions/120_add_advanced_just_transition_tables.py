"""Add workforce transition, social license, regional economic impact, indigenous rights, green jobs, JT finance tables (Sprint CO)

Revision ID: 120
Revises: 119
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '120'
down_revision = '119'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('workforce_transition_tracking', sa.Column('id', sa.Integer, primary_key=True), sa.Column('region', sa.String(100)), sa.Column('programme_name', sa.String(200)), sa.Column('workers_enrolled', sa.Integer), sa.Column('completion_rate_pct', sa.Numeric(5,2)), sa.Column('job_placement_rate_pct', sa.Numeric(5,2)), sa.Column('wage_comparison', JSONB), sa.Column('time_to_employment_months', sa.Integer), sa.Column('pathway', sa.String(100)), sa.Column('training_roi', sa.Numeric(5,2)))
    op.create_table('social_license_risk', sa.Column('id', sa.Integer, primary_key=True), sa.Column('project_id', sa.String(50), index=True), sa.Column('project_name', sa.String(200)), sa.Column('community_benefit_promised', JSONB), sa.Column('community_benefit_delivered', JSONB), sa.Column('fpic_status', sa.String(20)), sa.Column('timeline_delay_years', sa.Numeric(4,1)), sa.Column('protest_risk_score', sa.Integer), sa.Column('litigation_risk_score', sa.Integer), sa.Column('stakeholder_map', JSONB))
    op.create_table('regional_economic_impact', sa.Column('id', sa.Integer, primary_key=True), sa.Column('region', sa.String(100)), sa.Column('fossil_dependency_pct', sa.Numeric(5,2)), sa.Column('io_multiplier', sa.Numeric(5,2)), sa.Column('direct_job_loss', sa.Integer), sa.Column('indirect_job_loss', sa.Integer), sa.Column('fiscal_impact_usd_m', sa.Numeric(10,2)), sa.Column('migration_outflow_pct', sa.Numeric(5,2)), sa.Column('gini_change', sa.Numeric(5,3)), sa.Column('diversification_pathways', JSONB))
    op.create_table('indigenous_rights_fpic', sa.Column('id', sa.Integer, primary_key=True), sa.Column('project_id', sa.String(50), index=True), sa.Column('community_name', sa.String(200)), sa.Column('consent_status', sa.String(20)), sa.Column('rights_framework', sa.String(100)), sa.Column('cultural_heritage_impact', JSONB), sa.Column('benefit_sharing', JSONB), sa.Column('grievance_mechanism', JSONB))
    op.create_table('green_jobs_pipeline', sa.Column('id', sa.Integer, primary_key=True), sa.Column('sector', sa.String(100)), sa.Column('job_category', sa.String(100)), sa.Column('jobs_2025', sa.Integer), sa.Column('jobs_2030', sa.Integer), sa.Column('jobs_2040', sa.Integer), sa.Column('skills_required', JSONB), sa.Column('avg_wage_usd', sa.Numeric(10,2)), sa.Column('geographic_distribution', JSONB), sa.Column('policy_incentives', JSONB))
    op.create_table('just_transition_finance', sa.Column('id', sa.Integer, primary_key=True), sa.Column('instrument', sa.String(100)), sa.Column('provider', sa.String(100)), sa.Column('amount_usd_bn', sa.Numeric(10,2)), sa.Column('target_region', sa.String(100)), sa.Column('impact_metrics', JSONB), sa.Column('status', sa.String(20)), sa.Column('details', JSONB))


def downgrade():
    op.drop_table('just_transition_finance')
    op.drop_table('green_jobs_pipeline')
    op.drop_table('indigenous_rights_fpic')
    op.drop_table('regional_economic_impact')
    op.drop_table('social_license_risk')
    op.drop_table('workforce_transition_tracking')
