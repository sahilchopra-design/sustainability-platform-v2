"""Add vintage cohort, cascading default, recovery pathways, decommissioning, watchlist, covenant breach tables (Sprint CK)

Revision ID: 116
Revises: 115
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '116'
down_revision = '115'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('vintage_cohort_stranded', sa.Column('id', sa.Integer, primary_key=True), sa.Column('asset_id', sa.String(50), index=True), sa.Column('asset_name', sa.String(200)), sa.Column('sector', sa.String(50)), sa.Column('vintage_year', sa.Integer), sa.Column('book_value_usd_m', sa.Numeric(12,2)), sa.Column('remaining_life_yr', sa.Integer), sa.Column('stranding_probability', sa.Numeric(5,3)), sa.Column('decay_lambda', sa.Numeric(6,4)), sa.Column('scenario_writedowns', JSONB), sa.Column('regulatory_closure_risk', sa.String(20)))
    op.create_table('cascading_defaults', sa.Column('id', sa.Integer, primary_key=True), sa.Column('trigger_entity', sa.String(100)), sa.Column('sector', sa.String(50)), sa.Column('scenario', sa.String(50)), sa.Column('chain_path', JSONB), sa.Column('loan_loss_usd_m', sa.Numeric(12,2)), sa.Column('capital_impact_pct', sa.Numeric(5,2)), sa.Column('delta_covar_pct', sa.Numeric(5,2)), sa.Column('systemic_flag', sa.Boolean), sa.Column('concentration_risk', JSONB))
    op.create_table('stranded_recovery_pathways', sa.Column('id', sa.Integer, primary_key=True), sa.Column('original_asset_type', sa.String(100)), sa.Column('conversion_target', sa.String(100)), sa.Column('conversion_capex_usd_m', sa.Numeric(10,2)), sa.Column('conversion_irr_pct', sa.Numeric(5,2)), sa.Column('timeline_years', sa.Integer), sa.Column('jobs_created', sa.Integer), sa.Column('jobs_displaced', sa.Integer), sa.Column('case_studies', JSONB))
    op.create_table('decommissioning_liabilities', sa.Column('id', sa.Integer, primary_key=True), sa.Column('asset_type', sa.String(100)), sa.Column('avg_cost_per_unit', sa.Numeric(10,2)), sa.Column('unit', sa.String(20)), sa.Column('total_liability_usd_m', sa.Numeric(12,2)), sa.Column('current_provision_usd_m', sa.Numeric(12,2)), sa.Column('funding_gap_usd_m', sa.Numeric(12,2)), sa.Column('regulatory_requirements', JSONB), sa.Column('timeline', JSONB))
    op.create_table('stranded_asset_watchlist', sa.Column('id', sa.Integer, primary_key=True), sa.Column('asset_id', sa.String(50), index=True), sa.Column('asset_name', sa.String(200)), sa.Column('watch_reason', sa.String(200)), sa.Column('trigger_events', JSONB), sa.Column('alert_history', JSONB), sa.Column('engagement_status', sa.String(50)), sa.Column('added_at', sa.DateTime, server_default=sa.func.now()))
    op.create_table('covenant_breach_predictions', sa.Column('id', sa.Integer, primary_key=True), sa.Column('borrower_id', sa.String(50), index=True), sa.Column('borrower_name', sa.String(200)), sa.Column('covenant_type', sa.String(50)), sa.Column('current_value', sa.Numeric(8,2)), sa.Column('threshold', sa.Numeric(8,2)), sa.Column('breach_probability', JSONB), sa.Column('early_warning_signals', JSONB), sa.Column('remediation_options', JSONB), sa.Column('scenario', sa.String(50)))


def downgrade():
    op.drop_table('covenant_breach_predictions')
    op.drop_table('stranded_asset_watchlist')
    op.drop_table('decommissioning_liabilities')
    op.drop_table('stranded_recovery_pathways')
    op.drop_table('cascading_defaults')
    op.drop_table('vintage_cohort_stranded')
