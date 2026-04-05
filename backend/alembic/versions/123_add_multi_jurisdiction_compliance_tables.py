"""Add CSRD ESRS full suite, global disclosure tracker, assurance readiness, XBRL taxonomy, regulatory radar, compliance workflow tables (Sprint CR)

Revision ID: 123
Revises: 122
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '123'
down_revision = '122'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('csrd_esrs_disclosures', sa.Column('id', sa.Integer, primary_key=True), sa.Column('company_id', sa.String(50), index=True), sa.Column('esrs_standard', sa.String(10)), sa.Column('disclosure_requirement', sa.String(20)), sa.Column('datapoint_count', sa.Integer), sa.Column('completed_count', sa.Integer), sa.Column('financial_materiality', sa.Boolean), sa.Column('impact_materiality', sa.Boolean), sa.Column('iro_assessment', JSONB), sa.Column('status', sa.String(20)), sa.Column('reporting_year', sa.Integer))
    op.create_table('global_disclosure_requirements', sa.Column('id', sa.Integer, primary_key=True), sa.Column('jurisdiction', sa.String(50)), sa.Column('framework', sa.String(50)), sa.Column('requirement_id', sa.String(20)), sa.Column('requirement_text', sa.Text), sa.Column('effective_date', sa.Date), sa.Column('mandatory', sa.Boolean), sa.Column('cross_walk', JSONB), sa.Column('overlap_jurisdictions', JSONB), sa.Column('unique_requirements', JSONB))
    op.create_table('assurance_readiness', sa.Column('id', sa.Integer, primary_key=True), sa.Column('company_id', sa.String(50), index=True), sa.Column('standard', sa.String(50)), sa.Column('readiness_score', sa.Integer), sa.Column('evidence_availability', JSONB), sa.Column('internal_controls', JSONB), sa.Column('data_lineage_complete', sa.Boolean), sa.Column('methodology_documented', sa.Boolean), sa.Column('limited_vs_reasonable_gap', JSONB), sa.Column('provider_comparison', JSONB))
    op.create_table('xbrl_climate_taxonomy', sa.Column('id', sa.Integer, primary_key=True), sa.Column('taxonomy_source', sa.String(50)), sa.Column('tag_id', sa.String(100)), sa.Column('tag_label', sa.String(200)), sa.Column('data_type', sa.String(50)), sa.Column('platform_metric', sa.String(100)), sa.Column('module_source', sa.String(20)), sa.Column('validation_rules', JSONB), sa.Column('filing_format', sa.String(20)))
    op.create_table('regulatory_change_radar', sa.Column('id', sa.Integer, primary_key=True), sa.Column('change_id', sa.String(50), unique=True), sa.Column('jurisdiction', sa.String(50)), sa.Column('regulation', sa.String(200)), sa.Column('status', sa.String(20)), sa.Column('effective_date', sa.Date), sa.Column('consultation_deadline', sa.Date), sa.Column('impact_assessment', JSONB), sa.Column('affected_modules', JSONB), sa.Column('affected_holdings', JSONB), sa.Column('response_status', sa.String(20)))
    op.create_table('compliance_workflows', sa.Column('id', sa.Integer, primary_key=True), sa.Column('workflow_name', sa.String(200)), sa.Column('framework', sa.String(50)), sa.Column('tasks', JSONB), sa.Column('assigned_to', JSONB), sa.Column('deadlines', JSONB), sa.Column('evidence_checklist', JSONB), sa.Column('approval_chain', JSONB), sa.Column('status', sa.String(20)), sa.Column('completion_pct', sa.Integer), sa.Column('created_at', sa.DateTime, server_default=sa.func.now()))


def downgrade():
    op.drop_table('compliance_workflows')
    op.drop_table('regulatory_change_radar')
    op.drop_table('xbrl_climate_taxonomy')
    op.drop_table('assurance_readiness')
    op.drop_table('global_disclosure_requirements')
    op.drop_table('csrd_esrs_disclosures')
