"""add natcat loss, cat bond ILS, and insurance protection gap tables

Revision ID: 091
Revises: 090
Create Date: 2026-04-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '091'
down_revision = '090'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. natcat_loss_assessments ───────────────────────────────────────────
    op.create_table('natcat_loss_assessments',
        sa.Column('id',               postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('org_id',           postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('assessment_name',  sa.String(200)),
        sa.Column('portfolio_id',     sa.String(100)),
        sa.Column('peril',            sa.String(50)),
        sa.Column('region',           sa.String(100)),
        sa.Column('climate_scenario', sa.String(50)),
        sa.Column('horizon_year',     sa.Integer()),
        sa.Column('tiv',              sa.Numeric(20, 4)),
        sa.Column('aal',              sa.Numeric(20, 4)),
        sa.Column('pml_50yr',         sa.Numeric(20, 4)),
        sa.Column('pml_100yr',        sa.Numeric(20, 4)),
        sa.Column('pml_250yr',        sa.Numeric(20, 4)),
        sa.Column('pml_500yr',        sa.Numeric(20, 4)),
        sa.Column('freq_change_pct',  sa.Numeric(8, 4)),
        sa.Column('sev_change_pct',   sa.Numeric(8, 4)),
        sa.Column('ep_curve',         JSONB),
        sa.Column('model_version',    sa.String(50)),
        sa.Column('notes',            sa.Text()),
        sa.Column('created_at',       sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_natcat_peril',    'natcat_loss_assessments', ['peril'])
    op.create_index('idx_natcat_scenario', 'natcat_loss_assessments', ['climate_scenario'])
    op.create_index('idx_natcat_portfolio','natcat_loss_assessments', ['portfolio_id'])

    # ── 2. cat_bond_instruments ──────────────────────────────────────────────
    op.create_table('cat_bond_instruments',
        sa.Column('id',               postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('isin',             sa.String(20)),
        sa.Column('bond_name',        sa.String(200)),
        sa.Column('issuer',           sa.String(200)),
        sa.Column('sponsor',          sa.String(200)),
        sa.Column('peril',            sa.String(100)),
        sa.Column('trigger_type',     sa.String(50)),
        sa.Column('size_usd',         sa.Numeric(20, 4)),
        sa.Column('issue_date',       sa.Date()),
        sa.Column('maturity_date',    sa.Date()),
        sa.Column('tenor_years',      sa.Integer()),
        sa.Column('attachment_pct',   sa.Numeric(8, 4)),
        sa.Column('exhaustion_pct',   sa.Numeric(8, 4)),
        sa.Column('expected_loss_pct',sa.Numeric(8, 6)),
        sa.Column('spread_bps',       sa.Numeric(8, 2)),
        sa.Column('multiple_of_el',   sa.Numeric(8, 4)),
        sa.Column('rating',           sa.String(10)),
        sa.Column('status',           sa.String(20), server_default='Active'),
        sa.Column('trigger_details',  JSONB),
        sa.Column('created_at',       sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_catbond_peril',   'cat_bond_instruments', ['peril'])
    op.create_index('idx_catbond_trigger', 'cat_bond_instruments', ['trigger_type'])
    op.create_index('idx_catbond_status',  'cat_bond_instruments', ['status'])
    op.create_index('idx_catbond_isin',    'cat_bond_instruments', ['isin'])

    # ── 3. ils_loss_events ───────────────────────────────────────────────────
    op.create_table('ils_loss_events',
        sa.Column('id',                postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('event_name',        sa.String(200), nullable=False),
        sa.Column('peril',             sa.String(50)),
        sa.Column('event_year',        sa.Integer()),
        sa.Column('event_date',        sa.Date()),
        sa.Column('region',            sa.String(100)),
        sa.Column('total_insured_loss',sa.Numeric(20, 4)),
        sa.Column('ils_impact',        sa.Numeric(20, 4)),
        sa.Column('triggered_bonds',   JSONB),
        sa.Column('trigger_breached',  sa.Boolean(), server_default='false'),
        sa.Column('loss_index',        sa.String(50)),
        sa.Column('notes',             sa.Text()),
        sa.Column('created_at',        sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_ils_event_year',  'ils_loss_events', ['event_year'])
    op.create_index('idx_ils_peril',       'ils_loss_events', ['peril'])
    op.create_index('idx_ils_triggered',   'ils_loss_events', ['trigger_breached'])

    # ── 4. insurance_protection_gap ──────────────────────────────────────────
    op.create_table('insurance_protection_gap',
        sa.Column('id',                  postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('country_iso',         sa.String(3), nullable=False),
        sa.Column('country_name',        sa.String(100)),
        sa.Column('region',              sa.String(100)),
        sa.Column('income_group',        sa.String(50)),
        sa.Column('peril',               sa.String(50)),
        sa.Column('year',                sa.Integer()),
        sa.Column('climate_scenario',    sa.String(50), server_default='Current'),
        sa.Column('total_econ_loss',     sa.Numeric(20, 4)),
        sa.Column('insured_loss',        sa.Numeric(20, 4)),
        sa.Column('protection_gap',      sa.Numeric(20, 4)),
        sa.Column('penetration_pct',     sa.Numeric(6, 3)),
        sa.Column('gap_pct',             sa.Numeric(6, 3)),
        sa.Column('gdp_penetration_pct', sa.Numeric(6, 3)),
        sa.Column('climate_risk_score',  sa.Numeric(5, 2)),
        sa.Column('uninsurable_risk',    sa.Numeric(20, 4)),
        sa.Column('metadata',            JSONB),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_gap_country',   'insurance_protection_gap', ['country_iso'])
    op.create_index('idx_gap_region',    'insurance_protection_gap', ['region'])
    op.create_index('idx_gap_year',      'insurance_protection_gap', ['year'])
    op.create_index('idx_gap_scenario',  'insurance_protection_gap', ['climate_scenario'])
    op.create_index('idx_gap_peril',     'insurance_protection_gap', ['peril'])


def downgrade() -> None:
    op.drop_index('idx_gap_peril',     table_name='insurance_protection_gap')
    op.drop_index('idx_gap_scenario',  table_name='insurance_protection_gap')
    op.drop_index('idx_gap_year',      table_name='insurance_protection_gap')
    op.drop_index('idx_gap_region',    table_name='insurance_protection_gap')
    op.drop_index('idx_gap_country',   table_name='insurance_protection_gap')
    op.drop_table('insurance_protection_gap')

    op.drop_index('idx_ils_triggered',  table_name='ils_loss_events')
    op.drop_index('idx_ils_peril',      table_name='ils_loss_events')
    op.drop_index('idx_ils_event_year', table_name='ils_loss_events')
    op.drop_table('ils_loss_events')

    op.drop_index('idx_catbond_isin',    table_name='cat_bond_instruments')
    op.drop_index('idx_catbond_status',  table_name='cat_bond_instruments')
    op.drop_index('idx_catbond_trigger', table_name='cat_bond_instruments')
    op.drop_index('idx_catbond_peril',   table_name='cat_bond_instruments')
    op.drop_table('cat_bond_instruments')

    op.drop_index('idx_natcat_portfolio', table_name='natcat_loss_assessments')
    op.drop_index('idx_natcat_scenario',  table_name='natcat_loss_assessments')
    op.drop_index('idx_natcat_peril',     table_name='natcat_loss_assessments')
    op.drop_table('natcat_loss_assessments')
