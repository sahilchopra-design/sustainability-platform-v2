"""add carbon credit engine hub tables (portfolio, market prices, integrity scores)

Revision ID: 101
Revises: 100
Create Date: 2026-04-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '101'
down_revision = '100'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table('cc_portfolio_snapshots',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('snapshot_date', sa.Date()), sa.Column('total_credits', sa.Numeric(20,4)),
        sa.Column('total_retired', sa.Numeric(20,4)), sa.Column('total_available', sa.Numeric(20,4)),
        sa.Column('total_pipeline', sa.Numeric(20,4)),
        sa.Column('by_family', JSONB), sa.Column('by_geography', JSONB), sa.Column('by_vintage', JSONB),
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_snap_date', 'cc_portfolio_snapshots', ['snapshot_date'])
    op.create_index('idx_cc_snap_org', 'cc_portfolio_snapshots', ['org_id'])

    op.create_table('cc_market_prices',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('methodology_code', sa.String(30)), sa.Column('vintage_year', sa.Integer()),
        sa.Column('price_date', sa.Date()), sa.Column('price_usd', sa.Numeric(10,2)),
        sa.Column('volume_traded', sa.Numeric(14,2)), sa.Column('source', sa.String(100)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_mktprice_meth', 'cc_market_prices', ['methodology_code'])
    op.create_index('idx_cc_mktprice_date', 'cc_market_prices', ['price_date'])

    op.create_table('cc_integrity_scores',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('methodology_id', postgresql.UUID(as_uuid=True)),
        sa.Column('assessment_date', sa.Date()),
        sa.Column('additionality_score', sa.Numeric(5,2)), sa.Column('baseline_robustness', sa.Numeric(5,2)),
        sa.Column('leakage_risk', sa.Numeric(5,2)), sa.Column('mrv_quality', sa.Numeric(5,2)),
        sa.Column('permanence_score', sa.Numeric(5,2)), sa.Column('overall_integrity', sa.Numeric(5,2)),
        sa.Column('assessor', sa.String(100)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_integ_meth', 'cc_integrity_scores', ['methodology_id'])

def downgrade() -> None:
    op.drop_index('idx_cc_integ_meth', table_name='cc_integrity_scores'); op.drop_table('cc_integrity_scores')
    op.drop_index('idx_cc_mktprice_date', table_name='cc_market_prices'); op.drop_index('idx_cc_mktprice_meth', table_name='cc_market_prices'); op.drop_table('cc_market_prices')
    op.drop_index('idx_cc_snap_org', table_name='cc_portfolio_snapshots'); op.drop_index('idx_cc_snap_date', table_name='cc_portfolio_snapshots'); op.drop_table('cc_portfolio_snapshots')
