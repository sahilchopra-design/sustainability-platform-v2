"""add carbon markets tables: VCM registry, ETS markets, carbon forward curves, credit integrity

Revision ID: 092
Revises: 091
Create Date: 2026-04-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '092'
down_revision = '091'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. vcm_projects ──────────────────────────────────────────────────────
    op.create_table('vcm_projects',
        sa.Column('id',               postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id',       sa.String(50),  nullable=False),
        sa.Column('project_name',     sa.String(300), nullable=False),
        sa.Column('registry',         sa.String(50)),
        sa.Column('project_type',     sa.String(100)),
        sa.Column('methodology',      sa.String(100)),
        sa.Column('country_iso',      sa.String(3)),
        sa.Column('country_name',     sa.String(100)),
        sa.Column('region',           sa.String(100)),
        sa.Column('credits_issued',   sa.Numeric(20, 4)),
        sa.Column('credits_retired',  sa.Numeric(20, 4)),
        sa.Column('buffer_credits',   sa.Numeric(20, 4)),
        sa.Column('vintage_start',    sa.Integer()),
        sa.Column('vintage_end',      sa.Integer()),
        sa.Column('validation_body',  sa.String(100)),
        sa.Column('verification_body',sa.String(100)),
        sa.Column('sdgs',             JSONB),
        sa.Column('status',           sa.String(30),  server_default='Active'),
        sa.Column('created_at',       sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_vcm_registry',    'vcm_projects', ['registry'])
    op.create_index('idx_vcm_type',        'vcm_projects', ['project_type'])
    op.create_index('idx_vcm_country',     'vcm_projects', ['country_iso'])
    op.create_index('idx_vcm_status',      'vcm_projects', ['status'])
    op.create_index('idx_vcm_project_id',  'vcm_projects', ['project_id'])

    # ── 2. vcm_issuance_retirements ──────────────────────────────────────────
    op.create_table('vcm_issuance_retirements',
        sa.Column('id',               postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id',       sa.String(50), nullable=False),
        sa.Column('registry',         sa.String(50)),
        sa.Column('event_type',       sa.String(20)),      # issuance | retirement | buffer_contribution
        sa.Column('vintage_year',     sa.Integer()),
        sa.Column('quantity',         sa.Numeric(20, 4)),
        sa.Column('transaction_date', sa.Date()),
        sa.Column('buyer',            sa.String(200)),
        sa.Column('use_category',     sa.String(100)),
        sa.Column('created_at',       sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_vcm_ir_project', 'vcm_issuance_retirements', ['project_id'])
    op.create_index('idx_vcm_ir_type',    'vcm_issuance_retirements', ['event_type'])
    op.create_index('idx_vcm_ir_vintage', 'vcm_issuance_retirements', ['vintage_year'])

    # ── 3. ets_market_prices ─────────────────────────────────────────────────
    op.create_table('ets_market_prices',
        sa.Column('id',               postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('market',           sa.String(50), nullable=False),
        sa.Column('price_date',       sa.Date(),     nullable=False),
        sa.Column('spot_price',       sa.Numeric(12, 4)),
        sa.Column('futures_dec',      sa.Numeric(12, 4)),
        sa.Column('futures_1y',       sa.Numeric(12, 4)),
        sa.Column('volume',           sa.Numeric(20, 4)),
        sa.Column('open_interest',    sa.Numeric(20, 4)),
        sa.Column('currency',         sa.String(5)),
        sa.Column('source',           sa.String(100)),
        sa.Column('created_at',       sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_ets_market',     'ets_market_prices', ['market'])
    op.create_index('idx_ets_date',       'ets_market_prices', ['price_date'])
    op.create_index('idx_ets_market_date','ets_market_prices', ['market', 'price_date'])

    # ── 4. carbon_forward_curves ─────────────────────────────────────────────
    op.create_table('carbon_forward_curves',
        sa.Column('id',               postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('curve_date',       sa.Date(),     nullable=False),
        sa.Column('market',           sa.String(50), nullable=False),
        sa.Column('scenario',         sa.String(50)),
        sa.Column('horizon_year',     sa.Integer(),  nullable=False),
        sa.Column('forward_price',    sa.Numeric(12, 4)),
        sa.Column('lower_bound',      sa.Numeric(12, 4)),
        sa.Column('upper_bound',      sa.Numeric(12, 4)),
        sa.Column('source_model',     sa.String(100)),
        sa.Column('created_at',       sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_fwd_market',   'carbon_forward_curves', ['market'])
    op.create_index('idx_fwd_scenario', 'carbon_forward_curves', ['scenario'])
    op.create_index('idx_fwd_horizon',  'carbon_forward_curves', ['horizon_year'])

    # ── 5. credit_integrity_scores ───────────────────────────────────────────
    op.create_table('credit_integrity_scores',
        sa.Column('id',                   postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id',           sa.String(50), nullable=False),
        sa.Column('registry',             sa.String(50)),
        sa.Column('assessment_date',      sa.Date()),
        sa.Column('additionality_score',  sa.Numeric(5, 2)),
        sa.Column('permanence_score',     sa.Numeric(5, 2)),
        sa.Column('mrv_score',            sa.Numeric(5, 2)),
        sa.Column('cobenefits_score',     sa.Numeric(5, 2)),
        sa.Column('safeguards_score',     sa.Numeric(5, 2)),
        sa.Column('overall_score',        sa.Numeric(5, 2)),
        sa.Column('ccp_eligible',         sa.Boolean(), server_default='false'),
        sa.Column('vcmi_tier',            sa.String(20)),
        sa.Column('greenwash_risk',       sa.String(20)),
        sa.Column('reversal_risk',        sa.String(20)),
        sa.Column('flags',                JSONB),
        sa.Column('assessor',             sa.String(100)),
        sa.Column('notes',                sa.Text()),
        sa.Column('created_at',           sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_integrity_project',  'credit_integrity_scores', ['project_id'])
    op.create_index('idx_integrity_ccp',      'credit_integrity_scores', ['ccp_eligible'])
    op.create_index('idx_integrity_gw_risk',  'credit_integrity_scores', ['greenwash_risk'])


def downgrade() -> None:
    op.drop_index('idx_integrity_gw_risk', table_name='credit_integrity_scores')
    op.drop_index('idx_integrity_ccp',     table_name='credit_integrity_scores')
    op.drop_index('idx_integrity_project', table_name='credit_integrity_scores')
    op.drop_table('credit_integrity_scores')

    op.drop_index('idx_fwd_horizon',  table_name='carbon_forward_curves')
    op.drop_index('idx_fwd_scenario', table_name='carbon_forward_curves')
    op.drop_index('idx_fwd_market',   table_name='carbon_forward_curves')
    op.drop_table('carbon_forward_curves')

    op.drop_index('idx_ets_market_date', table_name='ets_market_prices')
    op.drop_index('idx_ets_date',        table_name='ets_market_prices')
    op.drop_index('idx_ets_market',      table_name='ets_market_prices')
    op.drop_table('ets_market_prices')

    op.drop_index('idx_vcm_ir_vintage', table_name='vcm_issuance_retirements')
    op.drop_index('idx_vcm_ir_type',    table_name='vcm_issuance_retirements')
    op.drop_index('idx_vcm_ir_project', table_name='vcm_issuance_retirements')
    op.drop_table('vcm_issuance_retirements')

    op.drop_index('idx_vcm_project_id', table_name='vcm_projects')
    op.drop_index('idx_vcm_status',     table_name='vcm_projects')
    op.drop_index('idx_vcm_country',    table_name='vcm_projects')
    op.drop_index('idx_vcm_type',       table_name='vcm_projects')
    op.drop_index('idx_vcm_registry',   table_name='vcm_projects')
    op.drop_table('vcm_projects')
