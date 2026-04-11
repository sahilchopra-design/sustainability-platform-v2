"""add sprint df cleantech tables

Revision ID: 139
Revises: 138
Create Date: 2026-04-11

"""
from alembic import op
import sqlalchemy as sa

revision = '139'
down_revision = '138'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'ep_df1_cleantech_companies',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('sector', sa.String(100)),
        sa.Column('stage', sa.String(50)),
        sa.Column('country', sa.String(100)),
        sa.Column('investment_raised', sa.Numeric(12, 2)),
        sa.Column('valuation', sa.Numeric(12, 2)),
        sa.Column('carbon_abatement', sa.Numeric(8, 3)),
        sa.Column('irr', sa.Numeric(6, 2)),
        sa.Column('trl', sa.Integer),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        'ep_df2_hydrogen_projects',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('route', sa.String(50)),
        sa.Column('country', sa.String(100)),
        sa.Column('capacity_kt', sa.Numeric(10, 2)),
        sa.Column('lcoh', sa.Numeric(8, 3)),
        sa.Column('capex', sa.Numeric(12, 2)),
        sa.Column('co2_intensity', sa.Numeric(8, 3)),
        sa.Column('online_year', sa.Integer),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        'ep_df3_ccs_projects',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('type', sa.String(50)),
        sa.Column('country', sa.String(100)),
        sa.Column('capture_capacity', sa.Numeric(10, 3)),
        sa.Column('capex', sa.Numeric(12, 3)),
        sa.Column('opex', sa.Numeric(10, 2)),
        sa.Column('status', sa.String(50)),
        sa.Column('net_zero_contribution', sa.Numeric(6, 2)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        'ep_df4_storage_projects',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('technology', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('capacity_mwh', sa.Numeric(12, 2)),
        sa.Column('power_mw', sa.Numeric(10, 2)),
        sa.Column('lcoes', sa.Numeric(8, 2)),
        sa.Column('capex_kwh', sa.Numeric(8, 2)),
        sa.Column('duration_hrs', sa.Numeric(8, 2)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        'ep_df5_ev_companies',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('type', sa.String(50)),
        sa.Column('country', sa.String(100)),
        sa.Column('ev_revenue_pct', sa.Numeric(6, 2)),
        sa.Column('ice_stranded_assets', sa.Numeric(10, 2)),
        sa.Column('ev_capex', sa.Numeric(10, 2)),
        sa.Column('transition_score', sa.Integer),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        'ep_df6_patent_filers',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('type', sa.String(50)),
        sa.Column('country', sa.String(100)),
        sa.Column('sector', sa.String(100)),
        sa.Column('patents_total', sa.Integer),
        sa.Column('patent_growth_rate', sa.Numeric(6, 2)),
        sa.Column('rd_spend', sa.Numeric(10, 3)),
        sa.Column('innovation_score', sa.Integer),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('ep_df6_patent_filers')
    op.drop_table('ep_df5_ev_companies')
    op.drop_table('ep_df4_storage_projects')
    op.drop_table('ep_df3_ccs_projects')
    op.drop_table('ep_df2_hydrogen_projects')
    op.drop_table('ep_df1_cleantech_companies')
