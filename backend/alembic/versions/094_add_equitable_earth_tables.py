"""add equitable earth methodology framework tables

Revision ID: 094
Revises: 093
Create Date: 2026-04-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '094'
down_revision = '093'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. ee_methodology_standards ──────────────────────────────────────────
    op.create_table('ee_methodology_standards',
        sa.Column('id',                  postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('standard_id',         sa.String(20),  nullable=False),   # EE-NF, EE-AR, EE-BS, ...
        sa.Column('name',                sa.String(200), nullable=False),
        sa.Column('version',             sa.String(10)),
        sa.Column('category',            sa.String(50)),                    # REDD+ / A_R / Blue Carbon / Peatland / Soil Carbon
        sa.Column('status',              sa.String(20)),                    # Certified / Draft / Retired
        sa.Column('coverage',            sa.String(200)),
        sa.Column('baseline_method',     sa.String(300)),
        sa.Column('additionality_tests', sa.String(200)),
        sa.Column('permanence_mechanism',sa.String(200)),
        sa.Column('mrv_protocol',        sa.String(100)),
        sa.Column('ep_weight',           sa.Numeric(5, 3)),
        sa.Column('co_weight',           sa.Numeric(5, 3)),
        sa.Column('ac_weight',           sa.Numeric(5, 3)),
        sa.Column('pm_weight',           sa.Numeric(5, 3)),
        sa.Column('mv_weight',           sa.Numeric(5, 3)),
        sa.Column('composite_score',     sa.Numeric(5, 2)),
        sa.Column('credits_issued_tco2e',sa.Numeric(20, 4)),
        sa.Column('avg_market_price',    sa.Numeric(10, 2)),
        sa.Column('active_jurisdictions',sa.Integer()),
        sa.Column('years_active',        sa.Integer()),
        sa.Column('cobenefits',          JSONB),              # ['FPIC','Water','Biodiversity',...]
        sa.Column('effective_date',      sa.Date()),
        sa.Column('review_date',         sa.Date()),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('standard_id', 'version', name='uq_ee_std_version'),
    )
    op.create_index('idx_ee_std_id',       'ee_methodology_standards', ['standard_id'])
    op.create_index('idx_ee_std_category', 'ee_methodology_standards', ['category'])
    op.create_index('idx_ee_std_status',   'ee_methodology_standards', ['status'])

    # ── 2. ee_project_assessments ─────────────────────────────────────────────
    op.create_table('ee_project_assessments',
        sa.Column('id',                  postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_ref',         sa.String(30),  nullable=False),   # EE-PRJ-001 etc.
        sa.Column('project_name',        sa.String(300), nullable=False),
        sa.Column('standard_id',         sa.String(20)),
        sa.Column('country_iso',         sa.String(3)),
        sa.Column('country_name',        sa.String(100)),
        sa.Column('category',            sa.String(50)),
        sa.Column('area_ha',             sa.Numeric(16, 2)),
        sa.Column('vintage_year',        sa.Integer()),
        # Pillar scores
        sa.Column('ep_score',            sa.Numeric(5, 2)),
        sa.Column('co_score',            sa.Numeric(5, 2)),
        sa.Column('ac_score',            sa.Numeric(5, 2)),
        sa.Column('pm_score',            sa.Numeric(5, 2)),
        sa.Column('mv_score',            sa.Numeric(5, 2)),
        sa.Column('overall_score',       sa.Numeric(5, 2)),
        sa.Column('tier',                sa.String(20)),    # Gold / Silver / Bronze / Ineligible
        # Sub-metric inputs (stored for reproducibility)
        sa.Column('sub_metric_inputs',   JSONB),
        # Volume
        sa.Column('gross_emissions_tco2e',  sa.Numeric(20, 4)),
        sa.Column('leakage_pct',            sa.Numeric(6, 2)),
        sa.Column('buffer_pct',             sa.Numeric(6, 2)),
        sa.Column('adjusted_credits_tco2e', sa.Numeric(20, 4)),
        sa.Column('credits_issued_tco2e',   sa.Numeric(20, 4)),
        sa.Column('avg_price_usd',          sa.Numeric(10, 2)),
        # Social
        sa.Column('fpic_status',            sa.String(30)),   # Compliant / Partial / Non-Compliant
        sa.Column('status',                 sa.String(30)),   # Active / Draft / Under Review / Suspended
        sa.Column('assessment_date',        sa.Date()),
        sa.Column('assessor',               sa.String(100)),
        sa.Column('org_id',                 postgresql.UUID(as_uuid=True)),
        sa.Column('notes',                  sa.Text()),
        sa.Column('created_at',             sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_ee_proj_ref',      'ee_project_assessments', ['project_ref'])
    op.create_index('idx_ee_proj_std',      'ee_project_assessments', ['standard_id'])
    op.create_index('idx_ee_proj_country',  'ee_project_assessments', ['country_iso'])
    op.create_index('idx_ee_proj_tier',     'ee_project_assessments', ['tier'])
    op.create_index('idx_ee_proj_vintage',  'ee_project_assessments', ['vintage_year'])
    op.create_index('idx_ee_proj_org',      'ee_project_assessments', ['org_id'])

    # ── 3. ee_calc_runs ───────────────────────────────────────────────────────
    op.create_table('ee_calc_runs',
        sa.Column('id',                  postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_ref',         sa.String(30)),
        sa.Column('standard_id',         sa.String(20)),
        sa.Column('run_name',            sa.String(200)),
        sa.Column('inputs',              JSONB, nullable=False),   # all slider values
        sa.Column('ep_score',            sa.Numeric(5, 2)),
        sa.Column('co_score',            sa.Numeric(5, 2)),
        sa.Column('ac_score',            sa.Numeric(5, 2)),
        sa.Column('pm_score',            sa.Numeric(5, 2)),
        sa.Column('mv_score',            sa.Numeric(5, 2)),
        sa.Column('overall_score',       sa.Numeric(5, 2)),
        sa.Column('tier',                sa.String(20)),
        sa.Column('credit_multiplier',   sa.Numeric(6, 4)),
        sa.Column('adjusted_credits',    sa.Numeric(20, 4)),
        sa.Column('notes',               sa.Text()),
        sa.Column('run_by',              sa.String(100)),
        sa.Column('org_id',              postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_ee_calc_proj',  'ee_calc_runs', ['project_ref'])
    op.create_index('idx_ee_calc_tier',  'ee_calc_runs', ['tier'])
    op.create_index('idx_ee_calc_org',   'ee_calc_runs', ['org_id'])

    # ── 4. ee_integrity_flags ─────────────────────────────────────────────────
    op.create_table('ee_integrity_flags',
        sa.Column('id',                  postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_ref',         sa.String(30)),
        sa.Column('standard_id',         sa.String(20)),
        sa.Column('flag_type',           sa.String(50)),    # Reversal / Additionality / Leakage / Baseline / Social / Greenwash
        sa.Column('severity',            sa.String(20)),    # High / Medium / Low
        sa.Column('description',         sa.Text()),
        sa.Column('mitigation',          sa.Text()),
        sa.Column('raised_date',         sa.Date()),
        sa.Column('resolved_date',       sa.Date()),
        sa.Column('status',              sa.String(20)),    # Open / Resolved / Monitoring
        sa.Column('org_id',              postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_ee_flag_proj',  'ee_integrity_flags', ['project_ref'])
    op.create_index('idx_ee_flag_type',  'ee_integrity_flags', ['flag_type'])
    op.create_index('idx_ee_flag_sev',   'ee_integrity_flags', ['severity'])


def downgrade() -> None:
    op.drop_index('idx_ee_flag_sev',   table_name='ee_integrity_flags')
    op.drop_index('idx_ee_flag_type',  table_name='ee_integrity_flags')
    op.drop_index('idx_ee_flag_proj',  table_name='ee_integrity_flags')
    op.drop_table('ee_integrity_flags')

    op.drop_index('idx_ee_calc_org',   table_name='ee_calc_runs')
    op.drop_index('idx_ee_calc_tier',  table_name='ee_calc_runs')
    op.drop_index('idx_ee_calc_proj',  table_name='ee_calc_runs')
    op.drop_table('ee_calc_runs')

    op.drop_index('idx_ee_proj_org',      table_name='ee_project_assessments')
    op.drop_index('idx_ee_proj_vintage',  table_name='ee_project_assessments')
    op.drop_index('idx_ee_proj_tier',     table_name='ee_project_assessments')
    op.drop_index('idx_ee_proj_country',  table_name='ee_project_assessments')
    op.drop_index('idx_ee_proj_std',      table_name='ee_project_assessments')
    op.drop_index('idx_ee_proj_ref',      table_name='ee_project_assessments')
    op.drop_table('ee_project_assessments')

    op.drop_index('idx_ee_std_status',   table_name='ee_methodology_standards')
    op.drop_index('idx_ee_std_category', table_name='ee_methodology_standards')
    op.drop_index('idx_ee_std_id',       table_name='ee_methodology_standards')
    op.drop_table('ee_methodology_standards')
