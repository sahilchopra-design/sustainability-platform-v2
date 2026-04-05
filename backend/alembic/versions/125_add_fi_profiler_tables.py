"""Add FI client portfolio, instrument exposure, line of business, regulatory capital,
concentration limits, and FI dashboard snapshot tables (Sprint CT)

Revision ID: 125
Revises: 124
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '125'
down_revision = '124'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('fi_client_portfolios',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('client_name', sa.String(200), nullable=False),
        sa.Column('client_sector', sa.String(100)),     # NACE sector
        sa.Column('client_country', sa.String(3)),
        sa.Column('exposure_amount_mn', sa.Numeric(12,2)),
        sa.Column('exposure_type', sa.String(30)),       # loan/bond/guarantee/derivative/trade_finance
        sa.Column('transition_score', sa.Integer),
        sa.Column('geopolitical_score', sa.Integer),
        sa.Column('combined_score', sa.Integer),
        sa.Column('data_quality', sa.Integer),
        sa.Column('maturity_date', sa.Date),
        sa.Column('internal_rating', sa.String(10)),
        sa.Column('pd_bps', sa.Numeric(8,2)),            # probability of default in bps
        sa.Column('lgd_pct', sa.Numeric(5,2)),
        sa.Column('ead_mn', sa.Numeric(12,2)),
        sa.Column('ecl_mn', sa.Numeric(10,2)),           # IFRS 9 ECL
        sa.Column('ifrs9_stage', sa.Integer),             # 1, 2, or 3
        sa.Column('facility_type', sa.String(50)),
        sa.Column('taxonomy_scores', JSONB),              # per-L1 topic scores
    )

    op.create_table('fi_instruments',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('instrument_type', sa.String(30)),     # term_loan/revolver/bond/cds/equity_swap/mortgage/trade_finance/guarantee
        sa.Column('isin', sa.String(12)),
        sa.Column('notional_mn', sa.Numeric(12,2)),
        sa.Column('market_value_mn', sa.Numeric(12,2)),
        sa.Column('sector', sa.String(100)),
        sa.Column('geography', sa.String(50)),
        sa.Column('transition_risk_score', sa.Integer),
        sa.Column('climate_var_pct', sa.Numeric(6,3)),
        sa.Column('regulatory_capital_mn', sa.Numeric(10,2)),
        sa.Column('risk_weight_pct', sa.Numeric(5,2)),   # Basel IV SA/IRB
        sa.Column('pcaf_class', sa.Integer),
        sa.Column('taxonomy_aligned_pct', sa.Numeric(5,2)),
        sa.Column('green_classification', sa.String(20)), # green/transition/brown/neutral
        sa.Column('maturity_date', sa.Date),
    )

    op.create_table('fi_lines_of_business',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('lob_name', sa.String(100), nullable=False),
        sa.Column('revenue_share_pct', sa.Numeric(5,2)),
        sa.Column('exposure_mn', sa.Numeric(12,2)),
        sa.Column('transition_risk_score', sa.Integer),
        sa.Column('transition_risk_contribution_pct', sa.Numeric(5,2)),
        sa.Column('climate_var_contribution_pct', sa.Numeric(5,2)),
        sa.Column('regulatory_capital_mn', sa.Numeric(10,2)),
        sa.Column('risk_weight_avg_pct', sa.Numeric(5,2)),
        sa.Column('green_asset_ratio_pct', sa.Numeric(5,2)),
        sa.Column('taxonomy_scores', JSONB),
    )

    op.create_table('fi_regulatory_capital_overlay',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('scenario', sa.String(50)),
        sa.Column('rwa_base_bn', sa.Numeric(10,2)),
        sa.Column('rwa_climate_adjusted_bn', sa.Numeric(10,2)),
        sa.Column('pillar2_addon_pct', sa.Numeric(5,2)),          # ECB SREP climate add-on
        sa.Column('stress_capital_buffer_pct', sa.Numeric(5,2)),
        sa.Column('cet1_impact_bps', sa.Numeric(6,2)),
        sa.Column('output_floor_binding', sa.Boolean),             # Basel IV 72.5% floor
        sa.Column('methodology', JSONB),
        sa.Column('run_date', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('fi_concentration_limits',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('dimension', sa.String(30)),                     # sector/geography/rating/single_name/instrument_type
        sa.Column('segment', sa.String(100)),
        sa.Column('current_exposure_mn', sa.Numeric(12,2)),
        sa.Column('limit_mn', sa.Numeric(12,2)),
        sa.Column('utilization_pct', sa.Numeric(5,2)),
        sa.Column('breach_status', sa.String(10)),                 # green/amber/red/breach
        sa.Column('hhi_index', sa.Numeric(6,4)),
        sa.Column('last_reviewed', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('fi_transition_dashboard_snapshots',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('snapshot_date', sa.DateTime, server_default=sa.func.now()),
        sa.Column('portfolio_transition_score', sa.Integer),
        sa.Column('waci', sa.Numeric(10,2)),
        sa.Column('green_asset_ratio_pct', sa.Numeric(5,2)),
        sa.Column('climate_var_pct', sa.Numeric(6,3)),
        sa.Column('capital_adequacy_pct', sa.Numeric(5,2)),
        sa.Column('client_engagement_rate_pct', sa.Numeric(5,2)),
        sa.Column('taxonomy_deep_drill', JSONB),
        sa.Column('action_items', JSONB),
    )


def downgrade():
    op.drop_table('fi_transition_dashboard_snapshots')
    op.drop_table('fi_concentration_limits')
    op.drop_table('fi_regulatory_capital_overlay')
    op.drop_table('fi_lines_of_business')
    op.drop_table('fi_instruments')
    op.drop_table('fi_client_portfolios')
