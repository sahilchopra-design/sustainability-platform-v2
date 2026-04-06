"""Add live carbon price, portfolio pulse, regulatory deadlines, news sentiment,
emissions monitoring, and client command center tables (Sprint CY)

Revision ID: 130
Revises: 129
Create Date: 2026-04-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '130'
down_revision = '129'
branch_labels = None
depends_on = None


def upgrade():
    # EP-CY1: Live Carbon Price Monitor
    op.create_table('carbon_price_live',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('market_id', sa.String(20), nullable=False, index=True),
        sa.Column('market_name', sa.String(100)),
        sa.Column('currency', sa.String(5)),
        sa.Column('price', sa.Numeric(10, 2)),
        sa.Column('change', sa.Numeric(8, 2)),
        sa.Column('change_pct', sa.Numeric(5, 2)),
        sa.Column('volume', sa.Integer),
        sa.Column('high', sa.Numeric(10, 2)),
        sa.Column('low', sa.Numeric(10, 2)),
        sa.Column('forward_curve', JSONB),
        sa.Column('timestamp', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('carbon_price_alerts',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('market_id', sa.String(20)),
        sa.Column('alert_type', sa.String(20)),
        sa.Column('severity', sa.String(10)),
        sa.Column('message', sa.Text),
        sa.Column('acknowledged', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    # EP-CY2: Portfolio Climate Pulse
    op.create_table('portfolio_climate_pulse',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('holding_id', sa.String(50)),
        sa.Column('holding_name', sa.String(200)),
        sa.Column('sector', sa.String(100)),
        sa.Column('exposure_mn', sa.Numeric(12, 2)),
        sa.Column('transition_score', sa.Integer),
        sa.Column('cvar_pct', sa.Numeric(6, 3)),
        sa.Column('itr_degrees', sa.Numeric(4, 2)),
        sa.Column('risk_dimensions', JSONB),
        sa.Column('alert_level', sa.String(10)),
        sa.Column('timestamp', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('intraday_var_snapshots',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('hour', sa.Integer),
        sa.Column('var_95_pct', sa.Numeric(6, 3)),
        sa.Column('var_99_pct', sa.Numeric(6, 3)),
        sa.Column('date', sa.Date),
    )

    # EP-CY3: Regulatory Deadline Tracker
    op.create_table('regulatory_deadlines',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('framework', sa.String(50), nullable=False),
        sa.Column('jurisdiction', sa.String(50), nullable=False),
        sa.Column('deadline', sa.Date, nullable=False),
        sa.Column('status', sa.String(20)),
        sa.Column('responsible', sa.String(100)),
        sa.Column('reviewer', sa.String(100)),
        sa.Column('approver', sa.String(100)),
        sa.Column('completeness_pct', sa.Integer),
        sa.Column('gaps', JSONB),
        sa.Column('submission_history', JSONB),
        sa.Column('notes', sa.Text),
    )

    # EP-CY4: Climate News Sentiment
    op.create_table('climate_news_sentiment',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('headline', sa.String(500)),
        sa.Column('source', sa.String(100)),
        sa.Column('sentiment', sa.String(10)),
        sa.Column('sentiment_score', sa.Numeric(4, 3)),
        sa.Column('topics', JSONB),
        sa.Column('relevance_score', sa.Numeric(4, 3)),
        sa.Column('portfolio_impact', JSONB),
        sa.Column('published_at', sa.DateTime),
        sa.Column('ingested_at', sa.DateTime, server_default=sa.func.now()),
    )

    # EP-CY5: Real-Time Emissions Monitor
    op.create_table('facility_emissions_live',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('facility_id', sa.String(50), index=True),
        sa.Column('facility_name', sa.String(200)),
        sa.Column('entity_id', sa.Integer),
        sa.Column('emission_rate_tco2_hr', sa.Numeric(8, 2)),
        sa.Column('daily_cumulative_tco2', sa.Numeric(10, 2)),
        sa.Column('ytd_total_tco2', sa.Numeric(12, 2)),
        sa.Column('permit_limit_tco2_yr', sa.Numeric(12, 2)),
        sa.Column('compliance_status', sa.String(10)),
        sa.Column('anomaly_flag', sa.Boolean, default=False),
        sa.Column('anomaly_score', sa.Numeric(5, 3)),
        sa.Column('ewma_value', sa.Numeric(8, 2)),
        sa.Column('timestamp', sa.DateTime, server_default=sa.func.now()),
    )

    # EP-CY6: Client Transition Command Center
    op.create_table('client_transition_profiles',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, index=True),
        sa.Column('client_name', sa.String(200)),
        sa.Column('sector', sa.String(100)),
        sa.Column('exposure_mn', sa.Numeric(12, 2)),
        sa.Column('transition_score', sa.Integer),
        sa.Column('risk_quadrant', sa.String(20)),
        sa.Column('instruments', JSONB),
        sa.Column('regulatory_readiness', JSONB),
        sa.Column('engagement_status', sa.String(20)),
        sa.Column('engagement_actions', JSONB),
        sa.Column('last_assessed', sa.DateTime, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('client_transition_profiles')
    op.drop_table('facility_emissions_live')
    op.drop_table('climate_news_sentiment')
    op.drop_table('regulatory_deadlines')
    op.drop_table('intraday_var_snapshots')
    op.drop_table('portfolio_climate_pulse')
    op.drop_table('carbon_price_alerts')
    op.drop_table('carbon_price_live')
