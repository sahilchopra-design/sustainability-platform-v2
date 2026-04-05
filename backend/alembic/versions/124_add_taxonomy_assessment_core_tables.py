"""Add taxonomy tree, assessed entities, taxonomy assessments, assessment runs,
reference data source registry, and ML feature store tables (Sprint CS)

Revision ID: 124
Revises: 123
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '124'
down_revision = '123'
branch_labels = None
depends_on = None


def upgrade():
    # ── Transition Risk Taxonomy (4-level self-referential tree) ──────────
    op.create_table(
        'transition_risk_taxonomy',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('code', sa.String(20), nullable=False, unique=True),   # e.g. 'CE.S1.CO.NG'
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('level', sa.Integer, nullable=False),                   # 1-4
        sa.Column('parent_id', sa.Integer, sa.ForeignKey('transition_risk_taxonomy.id')),
        sa.Column('path', sa.String(500)),                                # materialized path '1.3.12.47'
        sa.Column('weight', sa.Numeric(5, 4)),                            # aggregation weight (0-1)
        sa.Column('data_sources', JSONB),                                 # array of source keys
        sa.Column('methodology', JSONB),                                  # scoring methodology
        sa.Column('sector_applicability', JSONB),                         # which NACE sectors
        sa.Column('geographic_applicability', JSONB),                     # which regions
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('sort_order', sa.Integer),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_taxonomy_level', 'transition_risk_taxonomy', ['level'])
    op.create_index('ix_taxonomy_parent', 'transition_risk_taxonomy', ['parent_id'])
    op.create_index('ix_taxonomy_path', 'transition_risk_taxonomy', ['path'])

    # ── Assessed Entities (FI, Energy, Corporate) ────────────────────────
    op.create_table(
        'assessed_entities',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_type', sa.String(30), nullable=False),          # financial_institution / energy_company / corporate
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('lei', sa.String(20)),                                  # GLEIF Legal Entity Identifier
        sa.Column('country_code', sa.String(3)),
        sa.Column('sector', sa.String(100)),                              # NACE sector code
        sa.Column('subsector', sa.String(100)),
        sa.Column('profile_data', JSONB),                                 # entity-type-specific
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index('ix_entity_type', 'assessed_entities', ['entity_type'])
    op.create_index('ix_entity_lei', 'assessed_entities', ['lei'])

    # ── Taxonomy Assessments (entity × taxonomy_node × run) ──────────────
    op.create_table(
        'taxonomy_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), nullable=False),
        sa.Column('taxonomy_id', sa.Integer, sa.ForeignKey('transition_risk_taxonomy.id'), nullable=False),
        sa.Column('assessment_run_id', sa.String(50), nullable=False),
        sa.Column('score', sa.Numeric(5, 2)),                             # 0-100
        sa.Column('confidence_lo', sa.Numeric(5, 2)),
        sa.Column('confidence_hi', sa.Numeric(5, 2)),
        sa.Column('data_quality', sa.Integer),                             # 1-5 PCAF-style
        sa.Column('data_source_tier', sa.String(20)),                      # public / proprietary / estimated
        sa.Column('ml_forward_score', sa.Numeric(5, 2)),                   # 12-month predicted
        sa.Column('ml_model_version', sa.String(20)),
        sa.Column('scenario_scores', JSONB),                               # {nz2050: 72, b2c: 65, cp: 45}
        sa.Column('geopolitical_overlay', sa.Numeric(5, 2)),               # optional 0-100
        sa.Column('evidence', JSONB),                                      # array of evidence items
        sa.Column('assessed_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('assessor', sa.String(100)),
    )
    op.create_index('ix_assessment_entity', 'taxonomy_assessments', ['entity_id'])
    op.create_index('ix_assessment_taxonomy', 'taxonomy_assessments', ['taxonomy_id'])
    op.create_index('ix_assessment_run', 'taxonomy_assessments', ['assessment_run_id'])

    # ── Assessment Runs (batch metadata) ─────────────────────────────────
    op.create_table(
        'assessment_runs',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('name', sa.String(200)),
        sa.Column('entity_ids', JSONB),
        sa.Column('taxonomy_scope', JSONB),                                # which taxonomy codes included
        sa.Column('config', JSONB),                                        # weights, thresholds, scenario
        sa.Column('status', sa.String(20)),                                # pending / running / complete / failed
        sa.Column('total_nodes', sa.Integer),
        sa.Column('scored_nodes', sa.Integer),
        sa.Column('started_at', sa.DateTime),
        sa.Column('completed_at', sa.DateTime),
        sa.Column('created_by', sa.String(100)),
    )

    # ── Reference Data Source Registry ────────────────────────────────────
    op.create_table(
        'reference_data_sources',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('source_key', sa.String(50), nullable=False, unique=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('provider', sa.String(100)),
        sa.Column('url', sa.String(500)),
        sa.Column('data_type', sa.String(50)),
        sa.Column('coverage', JSONB),
        sa.Column('refresh_frequency', sa.String(50)),
        sa.Column('quality_rating', sa.Integer),                           # 1-5
        sa.Column('license', sa.String(100)),
        sa.Column('taxonomy_mapping', JSONB),                              # which taxonomy codes this source covers
        sa.Column('last_refreshed', sa.DateTime),
        sa.Column('is_active', sa.Boolean, default=True),
    )

    # ── ML Feature Store ─────────────────────────────────────────────────
    op.create_table(
        'ml_taxonomy_features',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('feature_date', sa.Date, nullable=False),
        sa.Column('current_scores', JSONB),                                # {CE.S1.CO.NG: 72, ...} all 316 leaves
        sa.Column('velocity_3m', JSONB),                                   # 3-month deltas
        sa.Column('acceleration_12m', JSONB),                              # 12-month deltas
        sa.Column('metadata_features', JSONB),                             # sector/region/size one-hots
        sa.Column('feature_count', sa.Integer),
    )
    op.create_index('ix_ml_features_date', 'ml_taxonomy_features', ['entity_id', 'feature_date'])


def downgrade():
    op.drop_table('ml_taxonomy_features')
    op.drop_table('reference_data_sources')
    op.drop_table('assessment_runs')
    op.drop_table('taxonomy_assessments')
    op.drop_table('assessed_entities')
    op.drop_table('transition_risk_taxonomy')
