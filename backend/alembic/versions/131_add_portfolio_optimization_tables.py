"""Add climate portfolio optimization, net-zero alignment, benchmark construction,
green bond analytics, risk budget allocation, and transition alpha tables (Sprint CZ)

Revision ID: 131
Revises: 130
Create Date: 2026-04-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '131'
down_revision = '130'
branch_labels = None
depends_on = None


def upgrade():
    # EP-CZ1: Climate-Aware Portfolio Optimizer
    op.create_table('portfolio_optimization_runs',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('portfolio_id', sa.String(50), nullable=False, index=True),
        sa.Column('run_name', sa.String(200)),
        sa.Column('objective', sa.String(30)),  # min_vol, max_sharpe, max_return
        sa.Column('target_return', sa.Numeric(6, 4)),
        sa.Column('carbon_budget_tco2', sa.Numeric(12, 2)),
        sa.Column('max_position_weight', sa.Numeric(5, 4)),
        sa.Column('result_return', sa.Numeric(6, 4)),
        sa.Column('result_volatility', sa.Numeric(6, 4)),
        sa.Column('result_sharpe', sa.Numeric(6, 4)),
        sa.Column('result_carbon_intensity', sa.Numeric(10, 2)),
        sa.Column('result_tracking_error', sa.Numeric(6, 4)),
        sa.Column('optimized_weights', JSONB),
        sa.Column('efficient_frontier', JSONB),
        sa.Column('constraints', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('carbon_budget_allocations',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('sector', sa.String(100)),
        sa.Column('budget_tco2', sa.Numeric(12, 2)),
        sa.Column('actual_tco2', sa.Numeric(12, 2)),
        sa.Column('utilization_pct', sa.Numeric(5, 2)),
        sa.Column('carbon_price_sensitivity', JSONB),
        sa.Column('as_of_date', sa.Date),
    )

    # EP-CZ2: Net Zero Portfolio Alignment
    op.create_table('net_zero_alignment',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('portfolio_id', sa.String(50), nullable=False, index=True),
        sa.Column('base_year', sa.Integer),
        sa.Column('target_year', sa.Integer),
        sa.Column('current_waci', sa.Numeric(10, 2)),
        sa.Column('target_waci', sa.Numeric(10, 2)),
        sa.Column('yoy_decarbonization_pct', sa.Numeric(5, 2)),
        sa.Column('budget_remaining_mtco2', sa.Numeric(12, 2)),
        sa.Column('pct_aum_aligned', sa.Numeric(5, 2)),
        sa.Column('portfolio_itr_degrees', sa.Numeric(4, 2)),
        sa.Column('decarbonization_pathway', JSONB),
        sa.Column('paii_framework_status', JSONB),
        sa.Column('as_of_date', sa.Date),
    )

    op.create_table('asset_alignment_assessments',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('holding_id', sa.String(50)),
        sa.Column('holding_name', sa.String(200)),
        sa.Column('sector', sa.String(100)),
        sa.Column('weight_pct', sa.Numeric(5, 2)),
        sa.Column('waci', sa.Numeric(10, 2)),
        sa.Column('sbti_status', sa.String(30)),
        sa.Column('alignment_category', sa.String(30)),
        sa.Column('itr_degrees', sa.Numeric(4, 2)),
        sa.Column('green_revenue_pct', sa.Numeric(5, 2)),
        sa.Column('as_of_date', sa.Date),
    )

    # EP-CZ3: Climate Benchmark Constructor
    op.create_table('climate_benchmarks',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('benchmark_name', sa.String(200), nullable=False),
        sa.Column('benchmark_type', sa.String(10)),  # PAB, CTB, Custom
        sa.Column('parent_index', sa.String(100)),
        sa.Column('carbon_reduction_pct', sa.Numeric(5, 2)),
        sa.Column('yoy_decarbonization', sa.Numeric(5, 2)),
        sa.Column('tracking_error', sa.Numeric(6, 4)),
        sa.Column('constituents_count', sa.Integer),
        sa.Column('exclusion_rules', JSONB),
        sa.Column('tilt_factors', JSONB),
        sa.Column('sector_neutrality', sa.Boolean, default=False),
        sa.Column('carbon_pathway', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('benchmark_constituents',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('benchmark_id', sa.Integer, sa.ForeignKey('climate_benchmarks.id')),
        sa.Column('security_id', sa.String(50)),
        sa.Column('security_name', sa.String(200)),
        sa.Column('sector', sa.String(100)),
        sa.Column('weight_pct', sa.Numeric(6, 4)),
        sa.Column('parent_weight_pct', sa.Numeric(6, 4)),
        sa.Column('carbon_intensity', sa.Numeric(10, 2)),
        sa.Column('tilt_reason', sa.String(200)),
        sa.Column('as_of_date', sa.Date),
    )

    # EP-CZ4: Green Bond Portfolio Analytics
    op.create_table('green_bond_holdings',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('isin', sa.String(12)),
        sa.Column('issuer', sa.String(200)),
        sa.Column('amount_mn', sa.Numeric(12, 2)),
        sa.Column('coupon', sa.Numeric(5, 3)),
        sa.Column('maturity', sa.Date),
        sa.Column('rating', sa.String(5)),
        sa.Column('green_framework', sa.String(50)),
        sa.Column('spo_provider', sa.String(100)),
        sa.Column('use_of_proceeds', JSONB),
        sa.Column('impact_metrics', JSONB),
        sa.Column('greenium_bps', sa.Numeric(6, 2)),
        sa.Column('eu_gbs_alignment', JSONB),
    )

    # EP-CZ5: Climate Risk Budget Allocator
    op.create_table('climate_risk_budgets',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('portfolio_id', sa.String(50), nullable=False, index=True),
        sa.Column('total_budget_mn', sa.Numeric(12, 2)),
        sa.Column('transition_budget_mn', sa.Numeric(12, 2)),
        sa.Column('physical_budget_mn', sa.Numeric(12, 2)),
        sa.Column('litigation_budget_mn', sa.Numeric(12, 2)),
        sa.Column('utilized_mn', sa.Numeric(12, 2)),
        sa.Column('utilization_pct', sa.Numeric(5, 2)),
        sa.Column('factor_decomposition', JSONB),
        sa.Column('marginal_contributions', JSONB),
        sa.Column('breach_log', JSONB),
        sa.Column('as_of_date', sa.Date),
    )

    # EP-CZ6: Transition Alpha Signal Generator
    op.create_table('transition_alpha_signals',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('signal_name', sa.String(100), nullable=False),
        sa.Column('signal_type', sa.String(30)),
        sa.Column('current_strength', sa.String(20)),
        sa.Column('z_score', sa.Numeric(6, 3)),
        sa.Column('ic_current', sa.Numeric(6, 4)),
        sa.Column('ic_avg_12m', sa.Numeric(6, 4)),
        sa.Column('half_life_months', sa.Numeric(5, 2)),
        sa.Column('turnover_pct', sa.Numeric(5, 2)),
        sa.Column('factor_loadings', JSONB),
        sa.Column('backtest_metrics', JSONB),
        sa.Column('alpha_attribution', JSONB),
        sa.Column('as_of_date', sa.Date),
    )

    op.create_table('transition_alpha_backtests',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('strategy_name', sa.String(200)),
        sa.Column('start_date', sa.Date),
        sa.Column('end_date', sa.Date),
        sa.Column('annualized_return', sa.Numeric(6, 4)),
        sa.Column('annualized_vol', sa.Numeric(6, 4)),
        sa.Column('sharpe_ratio', sa.Numeric(6, 4)),
        sa.Column('sortino_ratio', sa.Numeric(6, 4)),
        sa.Column('max_drawdown', sa.Numeric(6, 4)),
        sa.Column('information_ratio', sa.Numeric(6, 4)),
        sa.Column('hit_rate', sa.Numeric(5, 4)),
        sa.Column('monthly_returns', JSONB),
        sa.Column('factor_attribution', JSONB),
        sa.Column('signal_decay_curve', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('transition_alpha_backtests')
    op.drop_table('transition_alpha_signals')
    op.drop_table('climate_risk_budgets')
    op.drop_table('green_bond_holdings')
    op.drop_table('benchmark_constituents')
    op.drop_table('climate_benchmarks')
    op.drop_table('asset_alignment_assessments')
    op.drop_table('net_zero_alignment')
    op.drop_table('carbon_budget_allocations')
    op.drop_table('portfolio_optimization_runs')
