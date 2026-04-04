"""add advanced predictive and agentic analytics tables

Revision ID: 105
Revises: 104
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '105'
down_revision = '104'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # ESG Time Series Forecasts — per-company, per-metric, multi-model
    op.create_table('esg_time_series_forecasts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', sa.String(50)),
        sa.Column('company_name', sa.String(200)),
        sa.Column('metric', sa.String(100)),              # esg_score, scope1, scope2, scope3, energy_intensity, water, diversity
        sa.Column('model_type', sa.String(30)),           # arima, holt_winters, ensemble
        sa.Column('training_start', sa.Integer()),        # year
        sa.Column('training_end', sa.Integer()),
        sa.Column('forecast_horizon_years', sa.Integer()),
        sa.Column('actuals', JSONB),                      # [{year, value}]
        sa.Column('forecasts', JSONB),                    # [{year, value, lower_95, upper_95}]
        sa.Column('model_params', JSONB),                 # {p, d, q} for ARIMA; {alpha, beta, gamma} for HW
        sa.Column('mae', sa.Numeric(10, 4)),
        sa.Column('rmse', sa.Numeric(10, 4)),
        sa.Column('mape', sa.Numeric(8, 4)),              # Mean Absolute Percentage Error
        sa.Column('aic', sa.Numeric(10, 4)),              # Akaike Information Criterion
        sa.Column('sbti_pathway', JSONB),                 # [{year, sbti_target, forecast, divergence_pct}]
        sa.Column('change_point_years', JSONB),           # [year] structural breaks detected
        sa.Column('seasonality_detected', sa.Boolean()),
        sa.Column('trend_direction', sa.String(20)),      # improving, deteriorating, flat, volatile
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_etsf_company_metric', 'esg_time_series_forecasts', ['company_id', 'metric'])
    op.create_index('idx_etsf_model', 'esg_time_series_forecasts', ['model_type'])
    op.create_index('idx_etsf_org', 'esg_time_series_forecasts', ['org_id'])

    # Sentiment alpha runs — ESG sentiment to alpha signal
    op.create_table('sentiment_alpha_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('run_date', sa.Date()),
        sa.Column('universe', sa.String(100)),            # sp500, msci_world, custom_portfolio
        sa.Column('signal_type', sa.String(50)),          # esg_momentum, controversy_reversal, disclosure_quality, gw_score
        sa.Column('lookback_days', sa.Integer()),
        sa.Column('factor_model', sa.String(30)),         # fama_french_5, capm, barra
        # Portfolio construction
        sa.Column('long_portfolio', JSONB),               # [{ticker, weight, signal_score}]
        sa.Column('short_portfolio', JSONB),
        # Performance metrics
        sa.Column('backtest_start', sa.Date()),
        sa.Column('backtest_end', sa.Date()),
        sa.Column('annualized_return', sa.Numeric(8, 4)),
        sa.Column('sharpe_ratio', sa.Numeric(8, 4)),
        sa.Column('sortino_ratio', sa.Numeric(8, 4)),
        sa.Column('max_drawdown', sa.Numeric(8, 4)),
        sa.Column('information_ratio', sa.Numeric(8, 4)),
        sa.Column('alpha', sa.Numeric(8, 4)),             # Jensen's alpha vs benchmark
        sa.Column('beta', sa.Numeric(8, 4)),
        sa.Column('factor_exposures', JSONB),             # {factor: loading}
        sa.Column('monthly_returns', JSONB),              # [{month, return, benchmark_return, excess}]
        sa.Column('signal_decay', JSONB),                 # [{horizon_days, ic, rank_ic}] information coefficient decay
        sa.Column('turnover_pct', sa.Numeric(6, 3)),
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_sar_run_date', 'sentiment_alpha_runs', ['run_date'])
    op.create_index('idx_sar_signal', 'sentiment_alpha_runs', ['signal_type'])
    op.create_index('idx_sar_org', 'sentiment_alpha_runs', ['org_id'])

    # AI compliance agent scans — agentic gap analysis across 8 frameworks
    op.create_table('ai_compliance_scans',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', sa.String(50)),
        sa.Column('company_name', sa.String(200)),
        sa.Column('scan_date', sa.Date()),
        sa.Column('agent_version', sa.String(20)),
        # Framework scan results
        sa.Column('csrd_gaps', JSONB),                    # [{topic, esrs_ref, gap_type, severity, evidence, recommendation}]
        sa.Column('issb_gaps', JSONB),
        sa.Column('tcfd_gaps', JSONB),
        sa.Column('sfdr_gaps', JSONB),
        sa.Column('gri_gaps', JSONB),
        sa.Column('sec_climate_gaps', JSONB),
        sa.Column('tnfd_gaps', JSONB),
        sa.Column('uk_sdr_gaps', JSONB),
        # Aggregate scores
        sa.Column('csrd_compliance_pct', sa.Numeric(5, 2)),
        sa.Column('issb_compliance_pct', sa.Numeric(5, 2)),
        sa.Column('tcfd_compliance_pct', sa.Numeric(5, 2)),
        sa.Column('sfdr_compliance_pct', sa.Numeric(5, 2)),
        sa.Column('overall_compliance_pct', sa.Numeric(5, 2)),
        sa.Column('critical_gap_count', sa.Integer()),
        sa.Column('total_gap_count', sa.Integer()),
        # Evidence and remediation
        sa.Column('evidence_map', JSONB),                 # {gap_id: [{source, verbatim, page, confidence}]}
        sa.Column('remediation_roadmap', JSONB),          # [{gap_id, action, deadline, effort, owner_function}]
        sa.Column('regulatory_deadline_risk', JSONB),     # [{framework, deadline, days_remaining, readiness_pct}]
        sa.Column('peer_benchmark', JSONB),               # {sector_avg, quartile_rank, top_performer}
        sa.Column('agent_reasoning_log', JSONB),          # [{step, action, finding, confidence}] agentic trace
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_acs_company', 'ai_compliance_scans', ['company_id', 'scan_date'])
    op.create_index('idx_acs_compliance', 'ai_compliance_scans', ['overall_compliance_pct'])
    op.create_index('idx_acs_org', 'ai_compliance_scans', ['org_id'])

def downgrade() -> None:
    op.drop_index('idx_acs_org', table_name='ai_compliance_scans')
    op.drop_index('idx_acs_compliance', table_name='ai_compliance_scans')
    op.drop_index('idx_acs_company', table_name='ai_compliance_scans')
    op.drop_table('ai_compliance_scans')

    op.drop_index('idx_sar_org', table_name='sentiment_alpha_runs')
    op.drop_index('idx_sar_signal', table_name='sentiment_alpha_runs')
    op.drop_index('idx_sar_run_date', table_name='sentiment_alpha_runs')
    op.drop_table('sentiment_alpha_runs')

    op.drop_index('idx_etsf_org', table_name='esg_time_series_forecasts')
    op.drop_index('idx_etsf_model', table_name='esg_time_series_forecasts')
    op.drop_index('idx_etsf_company_metric', table_name='esg_time_series_forecasts')
    op.drop_table('esg_time_series_forecasts')
