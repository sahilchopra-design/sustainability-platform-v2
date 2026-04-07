"""Add climate litigation and legal intelligence tables

Revision ID: 132
Revises: 131
Create Date: 2026-04-07

Sprint DA — Climate Litigation Risk & Legal Intelligence
Tables: climate_litigation_cases, entity_litigation_scores,
        greenwashing_flags, disclosure_gaps,
        disclosure_adequacy_scores, enforcement_actions
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '132'
down_revision = '131'
branch_labels = None
depends_on = None


def upgrade():
    # ------------------------------------------------------------------ #
    # climate_litigation_cases — case-level records (EP-DA1)             #
    # ------------------------------------------------------------------ #
    op.create_table(
        'climate_litigation_cases',
        sa.Column('id',             sa.Integer,     primary_key=True, autoincrement=True),
        sa.Column('case_reference', sa.String(100), nullable=False),
        sa.Column('entity_name',    sa.String(200), nullable=False),
        sa.Column('sector',         sa.String(100)),
        sa.Column('jurisdiction',   sa.String(100)),
        sa.Column('claim_type',     sa.String(100)),   # e.g. Failure to Disclose, Greenwashing
        sa.Column('filing_date',    sa.Date),
        sa.Column('case_status',    sa.String(50)),    # Active / Settled / Dismissed
        sa.Column('financial_exposure_usd', sa.Numeric(18, 2)),
        sa.Column('gcel_category',  sa.String(100)),   # GCEL taxonomy
        sa.Column('sabin_category', sa.String(100)),   # Sabin Center taxonomy
        sa.Column('outcome',        sa.Text),
        sa.Column('notes',          sa.Text),
        sa.Column('created_at',     sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at',     sa.TIMESTAMP(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now()),
    )
    op.create_index('ix_climate_litigation_cases_entity', 'climate_litigation_cases', ['entity_name'])
    op.create_index('ix_climate_litigation_cases_jurisdiction', 'climate_litigation_cases', ['jurisdiction'])

    # ------------------------------------------------------------------ #
    # entity_litigation_scores — aggregate risk score per entity (EP-DA1) #
    # ------------------------------------------------------------------ #
    op.create_table(
        'entity_litigation_scores',
        sa.Column('id',                   sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_name',          sa.String(200), nullable=False),
        sa.Column('sector',               sa.String(100)),
        sa.Column('litigation_risk_score',sa.Numeric(5, 2)),   # 0-100
        sa.Column('active_cases',         sa.Integer, default=0),
        sa.Column('total_exposure_usd',   sa.Numeric(18, 2)),
        sa.Column('highest_risk_claim',   sa.String(100)),
        sa.Column('jurisdiction_count',   sa.Integer, default=0),
        sa.Column('score_date',           sa.Date),
        sa.Column('created_at',           sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_entity_litigation_scores_entity', 'entity_litigation_scores', ['entity_name'])

    # ------------------------------------------------------------------ #
    # greenwashing_flags — detected greenwashing claims (EP-DA2)         #
    # ------------------------------------------------------------------ #
    op.create_table(
        'greenwashing_flags',
        sa.Column('id',               sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_name',      sa.String(200), nullable=False),
        sa.Column('claim_text',       sa.Text),
        sa.Column('claim_category',   sa.String(100)),   # Net-Zero, Carbon-Neutral, Green Product
        sa.Column('regulator',        sa.String(50)),    # FCA, SEC, ASIC, BaFin, ESMA
        sa.Column('enforcement_action', sa.Boolean, default=False),
        sa.Column('gap_score',        sa.Numeric(5, 2)), # claim-reality gap 0-100
        sa.Column('detection_date',   sa.Date),
        sa.Column('source_url',       sa.Text),
        sa.Column('created_at',       sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_greenwashing_flags_entity', 'greenwashing_flags', ['entity_name'])
    op.create_index('ix_greenwashing_flags_regulator', 'greenwashing_flags', ['regulator'])

    # ------------------------------------------------------------------ #
    # disclosure_gaps — framework gap analysis per entity (EP-DA3)       #
    # ------------------------------------------------------------------ #
    op.create_table(
        'disclosure_gaps',
        sa.Column('id',             sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_name',    sa.String(200), nullable=False),
        sa.Column('framework',      sa.String(100)),  # TCFD, IFRS S1, IFRS S2, ESRS E1…
        sa.Column('requirement',    sa.String(200)),
        sa.Column('status',         sa.String(50)),   # Disclosed / Partial / Missing
        sa.Column('gap_severity',   sa.String(20)),   # High / Medium / Low
        sa.Column('period',         sa.Integer),      # reporting year
        sa.Column('notes',          sa.Text),
        sa.Column('created_at',     sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_disclosure_gaps_entity', 'disclosure_gaps', ['entity_name'])
    op.create_index('ix_disclosure_gaps_framework', 'disclosure_gaps', ['framework'])

    # ------------------------------------------------------------------ #
    # disclosure_adequacy_scores — aggregate scores (EP-DA3)             #
    # ------------------------------------------------------------------ #
    op.create_table(
        'disclosure_adequacy_scores',
        sa.Column('id',                 sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_name',        sa.String(200), nullable=False),
        sa.Column('sector',             sa.String(100)),
        sa.Column('overall_score',      sa.Numeric(5, 2)),  # 0-100
        sa.Column('tcfd_score',         sa.Numeric(5, 2)),
        sa.Column('ifrs_s1_score',      sa.Numeric(5, 2)),
        sa.Column('ifrs_s2_score',      sa.Numeric(5, 2)),
        sa.Column('esrs_score',         sa.Numeric(5, 2)),
        sa.Column('gri_score',          sa.Numeric(5, 2)),
        sa.Column('peer_rank',          sa.Integer),
        sa.Column('score_date',         sa.Date),
        sa.Column('created_at',         sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_disclosure_adequacy_scores_entity', 'disclosure_adequacy_scores', ['entity_name'])

    # ------------------------------------------------------------------ #
    # enforcement_actions — regulatory actions (EP-DA5)                  #
    # ------------------------------------------------------------------ #
    op.create_table(
        'enforcement_actions',
        sa.Column('id',               sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('regulator',        sa.String(100), nullable=False),
        sa.Column('jurisdiction',     sa.String(100)),
        sa.Column('entity_name',      sa.String(200)),
        sa.Column('sector',           sa.String(100)),
        sa.Column('action_type',      sa.String(100)),   # Fine, Suspension, Cease-and-desist…
        sa.Column('violation_category', sa.String(100)), # Greenwashing, Failure-to-Disclose…
        sa.Column('fine_amount_usd',  sa.Numeric(18, 2)),
        sa.Column('action_date',      sa.Date),
        sa.Column('resolution_date',  sa.Date),
        sa.Column('status',           sa.String(50)),    # Active / Resolved / Appealed
        sa.Column('case_url',         sa.Text),
        sa.Column('notes',            sa.Text),
        sa.Column('created_at',       sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_enforcement_actions_regulator', 'enforcement_actions', ['regulator'])
    op.create_index('ix_enforcement_actions_entity',    'enforcement_actions', ['entity_name'])
    op.create_index('ix_enforcement_actions_date',      'enforcement_actions', ['action_date'])


def downgrade():
    op.drop_index('ix_enforcement_actions_date',           table_name='enforcement_actions')
    op.drop_index('ix_enforcement_actions_entity',         table_name='enforcement_actions')
    op.drop_index('ix_enforcement_actions_regulator',      table_name='enforcement_actions')
    op.drop_table('enforcement_actions')

    op.drop_index('ix_disclosure_adequacy_scores_entity',  table_name='disclosure_adequacy_scores')
    op.drop_table('disclosure_adequacy_scores')

    op.drop_index('ix_disclosure_gaps_framework',          table_name='disclosure_gaps')
    op.drop_index('ix_disclosure_gaps_entity',             table_name='disclosure_gaps')
    op.drop_table('disclosure_gaps')

    op.drop_index('ix_greenwashing_flags_regulator',       table_name='greenwashing_flags')
    op.drop_index('ix_greenwashing_flags_entity',          table_name='greenwashing_flags')
    op.drop_table('greenwashing_flags')

    op.drop_index('ix_entity_litigation_scores_entity',    table_name='entity_litigation_scores')
    op.drop_table('entity_litigation_scores')

    op.drop_index('ix_climate_litigation_cases_jurisdiction', table_name='climate_litigation_cases')
    op.drop_index('ix_climate_litigation_cases_entity',       table_name='climate_litigation_cases')
    op.drop_table('climate_litigation_cases')
