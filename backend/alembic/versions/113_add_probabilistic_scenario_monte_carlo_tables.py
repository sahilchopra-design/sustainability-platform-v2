"""Add Monte Carlo, scenario blending, stress test, tail risk, dashboard builder, and submission tables (Sprint CH)

Revision ID: 113
Revises: 112
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '113'
down_revision = '112'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'monte_carlo_climate_runs',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('run_date', sa.DateTime, server_default=sa.func.now()),
        sa.Column('num_paths', sa.Integer, default=5000),
        sa.Column('horizon_years', sa.Integer),
        sa.Column('distribution', sa.String(20)),
        sa.Column('var_95_pct', sa.Numeric(8, 4)),
        sa.Column('var_99_pct', sa.Numeric(8, 4)),
        sa.Column('cvar_995_pct', sa.Numeric(8, 4)),
        sa.Column('expected_shortfall', sa.Numeric(8, 4)),
        sa.Column('fan_chart_data', JSONB),
        sa.Column('correlation_matrix', JSONB),
        sa.Column('parameter_sensitivity', JSONB),
        sa.Column('path_summary', JSONB),
    )

    op.create_table(
        'scenario_blends',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('blend_name', sa.String(200)),
        sa.Column('created_by', sa.String(100)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('scenario_weights', JSONB),
        sa.Column('composite_carbon_price', JSONB),
        sa.Column('composite_gdp_path', JSONB),
        sa.Column('bma_posterior_weights', JSONB),
        sa.Column('is_orderly', sa.Boolean),
    )

    op.create_table(
        'climate_stress_test_results',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('regulator', sa.String(50)),
        sa.Column('methodology_version', sa.String(50)),
        sa.Column('run_date', sa.DateTime, server_default=sa.func.now()),
        sa.Column('scenario', sa.String(100)),
        sa.Column('horizon_years', sa.Integer),
        sa.Column('results', JSONB),
        sa.Column('reverse_stress_result', JSONB),
        sa.Column('submission_status', sa.String(20)),
        sa.Column('submission_deadline', sa.Date),
    )

    op.create_table(
        'tail_risk_analyses',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('evt_distribution', sa.String(20)),
        sa.Column('shape_parameter', sa.Numeric(6, 4)),
        sa.Column('scale_parameter', sa.Numeric(8, 4)),
        sa.Column('return_period_100yr', sa.Numeric(8, 4)),
        sa.Column('return_period_250yr', sa.Numeric(8, 4)),
        sa.Column('return_period_1000yr', sa.Numeric(8, 4)),
        sa.Column('black_swan_scenarios', JSONB),
        sa.Column('run_date', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        'scenario_dashboards',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('dashboard_name', sa.String(200)),
        sa.Column('template', sa.String(50)),
        sa.Column('widgets', JSONB),
        sa.Column('created_by', sa.String(100)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('last_refreshed', sa.DateTime),
        sa.Column('shared_with', JSONB),
    )

    op.create_table(
        'regulatory_stress_submissions',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('regulator', sa.String(50)),
        sa.Column('submission_year', sa.Integer),
        sa.Column('template_version', sa.String(20)),
        sa.Column('data_quality_score', sa.Integer),
        sa.Column('completeness_pct', sa.Integer),
        sa.Column('submitted_at', sa.DateTime),
        sa.Column('status', sa.String(20)),
        sa.Column('audit_trail', JSONB),
        sa.Column('approvals', JSONB),
    )


def downgrade():
    op.drop_table('regulatory_stress_submissions')
    op.drop_table('scenario_dashboards')
    op.drop_table('tail_risk_analyses')
    op.drop_table('climate_stress_test_results')
    op.drop_table('scenario_blends')
    op.drop_table('monte_carlo_climate_runs')
