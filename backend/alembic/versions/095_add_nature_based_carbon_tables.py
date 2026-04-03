"""add nature-based carbon credit engine foundational tables

Revision ID: 095
Revises: 094
Create Date: 2026-04-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '095'
down_revision = '094'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. cc_methodologies — shared reference for all carbon credit engines ──
    op.create_table('cc_methodologies',
        sa.Column('id',                  postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('method_code',         sa.String(30),  nullable=False),  # VM0047, VM0007, ACM0002, EE-M001, etc.
        sa.Column('name',                sa.String(300), nullable=False),
        sa.Column('version',             sa.String(20)),
        sa.Column('family',              sa.String(30)),   # nature / agriculture / energy / waste / industrial / cdr
        sa.Column('cluster',             sa.String(30)),   # ARR / IFM / REDD / wetlands / soil / livestock / rice / grid / cooking / ...
        sa.Column('registry',            sa.String(50)),   # Verra VCS / Gold Standard / ACR / Puro / Isometric / EE
        sa.Column('credit_type',         sa.String(30)),   # Removal / Avoidance / Reduction
        sa.Column('applicable_activities', JSONB),
        sa.Column('default_params',      JSONB),           # default leakage%, buffer%, growth params, etc.
        sa.Column('calculation_logic',   JSONB),           # formula references
        sa.Column('validation_rules',    JSONB),
        sa.Column('complexity',          sa.String(20)),    # Low / Medium / High / Very High
        sa.Column('crediting_period_yrs',sa.Integer()),
        sa.Column('status',              sa.String(20)),    # Active / Draft / Retired
        sa.Column('effective_date',      sa.Date()),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('method_code', 'version', name='uq_cc_meth_code_ver'),
    )
    op.create_index('idx_cc_meth_code',    'cc_methodologies', ['method_code'])
    op.create_index('idx_cc_meth_family',  'cc_methodologies', ['family'])
    op.create_index('idx_cc_meth_cluster', 'cc_methodologies', ['cluster'])
    op.create_index('idx_cc_meth_registry','cc_methodologies', ['registry'])

    # ── 2. cc_projects — shared project registry for all carbon credit engines ──
    op.create_table('cc_projects',
        sa.Column('id',                  postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_ref',         sa.String(30),  nullable=False),
        sa.Column('name',                sa.String(300), nullable=False),
        sa.Column('family',              sa.String(30),  nullable=False),
        sa.Column('cluster',             sa.String(30)),
        sa.Column('methodology_id',      postgresql.UUID(as_uuid=True)),
        sa.Column('country_iso',         sa.String(3)),
        sa.Column('country_name',        sa.String(100)),
        sa.Column('region',              sa.String(100)),
        sa.Column('latitude',            sa.Numeric(10, 6)),
        sa.Column('longitude',           sa.Numeric(10, 6)),
        sa.Column('area_ha',             sa.Numeric(16, 2)),
        sa.Column('start_date',          sa.Date()),
        sa.Column('end_date',            sa.Date()),
        sa.Column('crediting_period_yrs',sa.Integer()),
        sa.Column('registry',            sa.String(50)),
        sa.Column('registry_project_id', sa.String(50)),
        sa.Column('status',              sa.String(30)),   # Draft / Active / Under Verification / Suspended / Completed
        sa.Column('developer',           sa.String(200)),
        sa.Column('verifier',            sa.String(200)),
        sa.Column('buffer_contribution_pct', sa.Numeric(5, 2)),
        sa.Column('total_credits_issued',sa.Numeric(20, 4)),
        sa.Column('metadata',            JSONB),
        sa.Column('org_id',              postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_cc_proj_ref',     'cc_projects', ['project_ref'])
    op.create_index('idx_cc_proj_family',  'cc_projects', ['family'])
    op.create_index('idx_cc_proj_cluster', 'cc_projects', ['cluster'])
    op.create_index('idx_cc_proj_country', 'cc_projects', ['country_iso'])
    op.create_index('idx_cc_proj_status',  'cc_projects', ['status'])
    op.create_index('idx_cc_proj_org',     'cc_projects', ['org_id'])

    # ── 3. cc_calculations — all calculation runs across all methodologies ──
    op.create_table('cc_calculations',
        sa.Column('id',                  postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id',          postgresql.UUID(as_uuid=True)),
        sa.Column('methodology_id',      postgresql.UUID(as_uuid=True)),
        sa.Column('calc_type',           sa.String(30)),   # BASELINE / PROJECT / LEAKAGE / NET / FULL / SENSITIVITY
        sa.Column('calc_name',           sa.String(200)),
        sa.Column('input_params',        JSONB, nullable=False),
        sa.Column('calculation_steps',   JSONB),            # intermediate step results
        sa.Column('output_results',      JSONB),            # final output summary
        sa.Column('gross_tco2e',         sa.Numeric(20, 4)),
        sa.Column('leakage_tco2e',       sa.Numeric(20, 4)),
        sa.Column('buffer_tco2e',        sa.Numeric(20, 4)),
        sa.Column('uncertainty_tco2e',   sa.Numeric(20, 4)),
        sa.Column('net_tco2e',           sa.Numeric(20, 4)),
        sa.Column('crediting_period_yrs',sa.Integer()),
        sa.Column('version',             sa.Integer(), server_default='1'),
        sa.Column('status',              sa.String(20)),    # Draft / Final / Superseded
        sa.Column('calculated_by',       sa.String(100)),
        sa.Column('org_id',              postgresql.UUID(as_uuid=True)),
        sa.Column('calculated_at',       sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_cc_calc_proj',   'cc_calculations', ['project_id'])
    op.create_index('idx_cc_calc_meth',   'cc_calculations', ['methodology_id'])
    op.create_index('idx_cc_calc_type',   'cc_calculations', ['calc_type'])
    op.create_index('idx_cc_calc_org',    'cc_calculations', ['org_id'])

    # ── 4. cc_monitoring_events — MRV data points ──
    op.create_table('cc_monitoring_events',
        sa.Column('id',                  postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id',          postgresql.UUID(as_uuid=True)),
        sa.Column('event_type',          sa.String(50)),   # satellite_pass / field_audit / vvb_review / issuance / fire_alert
        sa.Column('event_date',          sa.Date()),
        sa.Column('monitoring_period',   sa.String(50)),
        sa.Column('satellite_data',      JSONB),
        sa.Column('ground_truth_data',   JSONB),
        sa.Column('findings',            sa.Text()),
        sa.Column('non_conformities',    JSONB),
        sa.Column('status',              sa.String(20)),    # Pending / Complete / Non-Conformity
        sa.Column('performed_by',        sa.String(100)),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_cc_mon_proj',  'cc_monitoring_events', ['project_id'])
    op.create_index('idx_cc_mon_type',  'cc_monitoring_events', ['event_type'])
    op.create_index('idx_cc_mon_date',  'cc_monitoring_events', ['event_date'])


def downgrade() -> None:
    op.drop_index('idx_cc_mon_date',  table_name='cc_monitoring_events')
    op.drop_index('idx_cc_mon_type',  table_name='cc_monitoring_events')
    op.drop_index('idx_cc_mon_proj',  table_name='cc_monitoring_events')
    op.drop_table('cc_monitoring_events')

    op.drop_index('idx_cc_calc_org',    table_name='cc_calculations')
    op.drop_index('idx_cc_calc_type',   table_name='cc_calculations')
    op.drop_index('idx_cc_calc_meth',   table_name='cc_calculations')
    op.drop_index('idx_cc_calc_proj',   table_name='cc_calculations')
    op.drop_table('cc_calculations')

    op.drop_index('idx_cc_proj_org',     table_name='cc_projects')
    op.drop_index('idx_cc_proj_status',  table_name='cc_projects')
    op.drop_index('idx_cc_proj_country', table_name='cc_projects')
    op.drop_index('idx_cc_proj_cluster', table_name='cc_projects')
    op.drop_index('idx_cc_proj_family',  table_name='cc_projects')
    op.drop_index('idx_cc_proj_ref',     table_name='cc_projects')
    op.drop_table('cc_projects')

    op.drop_index('idx_cc_meth_registry','cc_methodologies')
    op.drop_index('idx_cc_meth_cluster', 'cc_methodologies')
    op.drop_index('idx_cc_meth_family',  'cc_methodologies')
    op.drop_index('idx_cc_meth_code',    'cc_methodologies')
    op.drop_table('cc_methodologies')
