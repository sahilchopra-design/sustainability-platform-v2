"""Add Climate VaR, Transition Risk Dashboard, and Reg Reporting tables (Sprint CE)

Revision ID: 110
Revises: 109
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '110'
down_revision = '109'
branch_labels = None
depends_on = None


def upgrade():
    # ── EP-CE1: Climate VaR Engine Runs ──────────────────────────────────────
    op.create_table(
        'climate_var_runs',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('run_name', sa.String(200)),
        sa.Column('run_date', sa.DateTime, server_default=sa.func.now()),
        sa.Column('aum_bn_usd', sa.Numeric(10, 2), nullable=False),  # AUM in $B
        sa.Column('scenario', sa.String(100), nullable=False),         # NGFS scenario
        sa.Column('horizon_years', sa.Integer, nullable=False),
        sa.Column('confidence_pct', sa.Numeric(5, 2), default=95.0),  # 90-99%
        # Output components
        sa.Column('transition_var_pct', sa.Numeric(8, 4)),
        sa.Column('physical_var_pct', sa.Numeric(8, 4)),
        sa.Column('interaction_var_pct', sa.Numeric(8, 4)),
        sa.Column('total_var_pct', sa.Numeric(8, 4)),
        sa.Column('total_var_usd_bn', sa.Numeric(12, 4)),
        sa.Column('correlation_rho', sa.Numeric(6, 4)),
        # Distribution parameters
        sa.Column('loss_dist_mean', sa.Numeric(8, 4)),
        sa.Column('loss_dist_std', sa.Numeric(8, 4)),
        sa.Column('tail_risk_multiplier', sa.Numeric(6, 4)),
        # Scenario parameters used
        sa.Column('carbon_price_2030', sa.Numeric(8, 2)),
        sa.Column('gdp_shock_pct', sa.Numeric(6, 3)),
        sa.Column('energy_price_shock_pct', sa.Numeric(6, 3)),
        # Outputs
        sa.Column('delta_covar_by_sector', JSONB),                    # sector -> delta CoVaR%
        sa.Column('stress_test_matrix', JSONB),                       # scenario -> horizon -> VaR%
        sa.Column('loss_distribution_chart', JSONB),                  # [{x, density, cumulative}]
        sa.Column('scenario_decomposition', JSONB),                   # [{component, var_pct}]
        sa.Column('notes', sa.Text),
    )

    # ── EP-CE2: Transition Risk Dashboard Snapshots ───────────────────────────
    op.create_table(
        'transition_risk_dashboard_snapshots',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('snapshot_date', sa.DateTime, server_default=sa.func.now()),
        sa.Column('scenario', sa.String(100)),
        # Portfolio-level KPIs
        sa.Column('portfolio_climate_var_pct', sa.Numeric(6, 3)),
        sa.Column('portfolio_itr_degrees', sa.Numeric(4, 2)),
        sa.Column('portfolio_waci', sa.Numeric(10, 2)),
        sa.Column('stranded_asset_usd_bn', sa.Numeric(10, 3)),
        sa.Column('gfanz_alignment_pct', sa.Numeric(5, 2)),
        sa.Column('transition_score_composite', sa.Numeric(5, 2)),
        sa.Column('green_bond_screen_pass_count', sa.Integer),
        sa.Column('green_bond_screen_total_count', sa.Integer),
        # Sector breakdown
        sa.Column('sector_heat_data', JSONB),                         # [{sector, score, itr, var, stranded, gfanz}]
        sa.Column('holdings_monitor', JSONB),                         # [{name, sector, weight, score, itr, flag}]
        # Alerts
        sa.Column('active_alerts', JSONB),                            # [{level, message, ts}]
        # Regulatory readiness
        sa.Column('reg_readiness', JSONB),                            # {TCFD: 92, ISSB_S2: 88, CSRD: 75, SFDR: 90, TPT: 72}
        # Engagement pipeline
        sa.Column('engagement_register', JSONB),                      # [{company, action, due, status, priority}]
        sa.Column('pillar_radar', JSONB),                             # [{axis, val}]
        sa.Column('notes', sa.Text),
    )

    # ── EP-CE3: Transition Regulatory Reports ────────────────────────────────
    op.create_table(
        'transition_reg_reports',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('report_name', sa.String(200), nullable=False),
        sa.Column('report_type', sa.String(50), nullable=False),      # TCFD/ISSB/CSRD/SFDR/TPT
        sa.Column('reporting_year', sa.Integer, nullable=False),
        sa.Column('generated_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('scenario', sa.String(100)),
        sa.Column('export_format', sa.String(20)),                    # PDF/XBRL/Excel/Word/JSON
        # Framework completeness
        sa.Column('tcfd_governance_pct', sa.Integer),
        sa.Column('tcfd_strategy_pct', sa.Integer),
        sa.Column('tcfd_risk_mgmt_pct', sa.Integer),
        sa.Column('tcfd_metrics_pct', sa.Integer),
        sa.Column('issb_s2_pct', sa.Integer),
        sa.Column('csrd_esrs_e1_pct', sa.Integer),
        sa.Column('sfdr_pai_pct', sa.Integer),
        sa.Column('uk_tpt_pct', sa.Integer),
        # Disclosure content (JSONB blobs)
        sa.Column('tcfd_disclosures', JSONB),                         # pillar -> [{id, req, status, text}]
        sa.Column('issb_items', JSONB),                               # [{para, topic, status}]
        sa.Column('csrd_gaps', JSONB),                                # [{topic, tcfd_ref, issb_ref, csrd_ref, status, gap}]
        sa.Column('scenario_narratives', JSONB),                      # {scenario: {title, itr, vaR, stranded, text}}
        sa.Column('metrics_register', JSONB),                         # [{metric, value, unit, source, status}]
        sa.Column('emissions_trajectory', JSONB),                     # [{yr, actual, target}]
        # Submission tracking
        sa.Column('submission_deadline', sa.Date),
        sa.Column('submission_status', sa.String(20)),                # DRAFT/SUBMITTED/OVERDUE/ON_TRACK
        sa.Column('assurance_provider', sa.String(100)),
        sa.Column('assurance_standard', sa.String(100)),              # ISAE 3000 / AA1000AS
        sa.Column('approved_by', sa.String(100)),
        sa.Column('board_date', sa.Date),
        sa.Column('notes', sa.Text),
    )

    # ── Submission deadline tracking ──────────────────────────────────────────
    op.create_table(
        'reg_submission_deadlines',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('framework', sa.String(100), nullable=False),
        sa.Column('reporting_year', sa.Integer, nullable=False),
        sa.Column('deadline', sa.Date, nullable=False),
        sa.Column('status', sa.String(20)),                           # ON_TRACK/AT_RISK/OVERDUE/SUBMITTED
        sa.Column('notes', sa.Text),
        sa.Column('last_updated', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade():
    op.drop_table('reg_submission_deadlines')
    op.drop_table('transition_reg_reports')
    op.drop_table('transition_risk_dashboard_snapshots')
    op.drop_table('climate_var_runs')
