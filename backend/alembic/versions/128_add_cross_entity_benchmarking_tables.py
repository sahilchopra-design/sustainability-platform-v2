"""Add universal entity comparator, peer groups, assessment versions,
portfolio taxonomy scores, supply chain network, and cross-entity dashboard tables (Sprint CW)

Revision ID: 128
Revises: 127
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '128'
down_revision = '127'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('peer_groups_v2',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(200)),
        sa.Column('entity_type', sa.String(30)),
        sa.Column('criteria', JSONB),                      # {sector: 'Energy', region: 'Europe', size: '>10B'}
        sa.Column('entity_ids', JSONB),
        sa.Column('created_by', sa.String(100)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('assessment_score_versions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('taxonomy_id', sa.Integer, sa.ForeignKey('transition_risk_taxonomy.id')),
        sa.Column('version', sa.Integer),
        sa.Column('old_score', sa.Numeric(5,2)),
        sa.Column('new_score', sa.Numeric(5,2)),
        sa.Column('change_reason', sa.String(200)),
        sa.Column('changed_by', sa.String(100)),
        sa.Column('changed_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('evidence', JSONB),
    )

    op.create_table('portfolio_taxonomy_scores',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('taxonomy_id', sa.Integer, sa.ForeignKey('transition_risk_taxonomy.id')),
        sa.Column('weighted_score', sa.Numeric(5,2)),
        sa.Column('exposure_weighted_score', sa.Numeric(5,2)),
        sa.Column('worst_entity_score', sa.Numeric(5,2)),
        sa.Column('best_entity_score', sa.Numeric(5,2)),
        sa.Column('entity_count', sa.Integer),
        sa.Column('total_exposure_mn', sa.Numeric(12,2)),
        sa.Column('scenario_scores', JSONB),
        sa.Column('scored_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('supply_chain_network_edges',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('source_entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id')),
        sa.Column('target_entity_id', sa.Integer),         # may be external (not in assessed_entities)
        sa.Column('target_name', sa.String(200)),
        sa.Column('relationship_type', sa.String(30)),     # supplier/customer/partner/investor
        sa.Column('tier', sa.Integer),
        sa.Column('spend_mn', sa.Numeric(10,2)),
        sa.Column('transition_score_propagated', sa.Integer),
        sa.Column('risk_propagation_factor', sa.Numeric(5,3)),
        sa.Column('critical', sa.Boolean),
    )

    op.create_table('cross_entity_dashboard_snapshots',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('snapshot_date', sa.DateTime, server_default=sa.func.now()),
        sa.Column('entities_assessed', sa.Integer),
        sa.Column('taxonomy_coverage_pct', sa.Numeric(5,2)),
        sa.Column('avg_transition_score', sa.Numeric(5,2)),
        sa.Column('score_distribution', JSONB),            # {A: 3, B: 5, C: 4, D: 2, E: 1}
        sa.Column('entity_type_comparison', JSONB),        # {fi: 62, energy: 48, corporate: 55}
        sa.Column('risk_heatmap', JSONB),                  # entity × L1 topic matrix
        sa.Column('active_alerts', JSONB),
        sa.Column('trend_data', JSONB),                    # quarterly score evolution
    )

    op.create_table('entity_comparison_reports',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_ids', JSONB),
        sa.Column('comparison_type', sa.String(30)),       # side_by_side/gap_analysis/historical
        sa.Column('results', JSONB),
        sa.Column('generated_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('generated_by', sa.String(100)),
    )


def downgrade():
    op.drop_table('entity_comparison_reports')
    op.drop_table('cross_entity_dashboard_snapshots')
    op.drop_table('supply_chain_network_edges')
    op.drop_table('portfolio_taxonomy_scores')
    op.drop_table('assessment_score_versions')
    op.drop_table('peer_groups_v2')
