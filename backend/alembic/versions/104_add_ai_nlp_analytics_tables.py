"""add AI/NLP analytics tables — LLM extraction, greenwashing detection, narrative intelligence

Revision ID: 104
Revises: 103
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '104'
down_revision = '103'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # LLM ESG extraction runs — structured field-by-field output from reports
    op.create_table('llm_esg_extractions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('document_id', postgresql.UUID(as_uuid=True)),
        sa.Column('company_id', sa.String(50)),
        sa.Column('company_name', sa.String(200)),
        sa.Column('report_year', sa.Integer()),
        sa.Column('report_type', sa.String(50)),           # annual_report, sustainability_report, tcfd, issb
        sa.Column('llm_model', sa.String(100)),            # claude-3-opus, gpt-4o, gemini-pro
        sa.Column('extraction_version', sa.String(20)),    # v1.0, v2.0
        # Framework field extraction results
        sa.Column('esrs_fields', JSONB),                   # {field_id: {value, unit, confidence, page_ref, verbatim}}
        sa.Column('issb_fields', JSONB),                   # {S1/S2 field: {value, confidence, verbatim}}
        sa.Column('tcfd_fields', JSONB),                   # {pillar: {sub: {value, confidence}}}
        sa.Column('gri_fields', JSONB),                    # {gri_code: {value, unit, confidence}}
        sa.Column('sasb_fields', JSONB),                   # {industry_metric: {value, confidence}}
        # Cross-framework mapping
        sa.Column('framework_coverage', JSONB),            # {esrs: pct, issb: pct, tcfd: pct, gri: pct}
        sa.Column('avg_confidence_score', sa.Numeric(5, 4)),
        sa.Column('low_confidence_fields', JSONB),         # [{field, confidence, reason}] fields < 0.6
        sa.Column('missing_disclosures', JSONB),           # [{framework, field, materiality}] not found
        sa.Column('quantitative_kpis', JSONB),             # extracted numeric metrics {metric: {value, unit, year}}
        sa.Column('peer_benchmark_ready', sa.Boolean(), server_default='false'),
        sa.Column('processing_time_ms', sa.Integer()),
        sa.Column('token_count', sa.Integer()),
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_llm_ext_company', 'llm_esg_extractions', ['company_id', 'report_year'])
    op.create_index('idx_llm_ext_type', 'llm_esg_extractions', ['report_type'])
    op.create_index('idx_llm_ext_org', 'llm_esg_extractions', ['org_id'])

    # Greenwashing detection analysis runs
    op.create_table('greenwashing_detection_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', sa.String(50)),
        sa.Column('company_name', sa.String(200)),
        sa.Column('analysis_date', sa.Date()),
        sa.Column('document_ids', JSONB),                  # [uuid] source documents analyzed
        # 7-signal model scores (0-100, 100=highest greenwashing risk)
        sa.Column('vagueness_score', sa.Numeric(5, 2)),    # Signal 1: vague/ambiguous language
        sa.Column('omission_score', sa.Numeric(5, 2)),     # Signal 2: selective disclosure
        sa.Column('exaggeration_score', sa.Numeric(5, 2)), # Signal 3: unverifiable claims
        sa.Column('mismatch_score', sa.Numeric(5, 2)),     # Signal 4: claim vs data mismatch
        sa.Column('diversion_score', sa.Numeric(5, 2)),    # Signal 5: irrelevant positive framing
        sa.Column('regulatory_risk_score', sa.Numeric(5, 2)),  # Signal 6: EU Green Claims / ESMA risk
        sa.Column('temporal_shift_score', sa.Numeric(5, 2)),   # Signal 7: YoY target weakening
        sa.Column('composite_gw_score', sa.Numeric(5, 2)),
        sa.Column('severity_tier', sa.String(20)),         # low / medium / high / critical
        sa.Column('signal_evidence', JSONB),               # {signal: [{verbatim, page, reason}]}
        sa.Column('regulatory_violations', JSONB),         # [{regulation, article, description, severity}]
        sa.Column('positive_signals', JSONB),              # [{topic, evidence, credibility}]
        sa.Column('net_credibility_score', sa.Numeric(5, 2)),
        sa.Column('peer_comparison', JSONB),               # {percentile, sector_avg, delta}
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_gwd_company', 'greenwashing_detection_runs', ['company_id', 'analysis_date'])
    op.create_index('idx_gwd_severity', 'greenwashing_detection_runs', ['severity_tier'])
    op.create_index('idx_gwd_org', 'greenwashing_detection_runs', ['org_id'])

    # ESG narrative intelligence — multi-year arc analysis
    op.create_table('esg_narrative_intelligence',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', sa.String(50)),
        sa.Column('company_name', sa.String(200)),
        sa.Column('analysis_start_year', sa.Integer()),
        sa.Column('analysis_end_year', sa.Integer()),
        sa.Column('report_years_analyzed', JSONB),         # [2020, 2021, 2022, 2023, 2024]
        # Topic arc analysis
        sa.Column('topic_trajectory', JSONB),              # {topic: [{year, prominence_score, sentiment}]}
        sa.Column('topic_drift_signals', JSONB),           # [{topic, old_framing, new_framing, year, drift_score}]
        sa.Column('narrative_coherence_score', sa.Numeric(5, 2)),  # 0-100
        sa.Column('strategic_consistency_score', sa.Numeric(5, 2)),
        # Controversy & commitment tracking
        sa.Column('controversy_timeline', JSONB),          # [{year, event, source, severity, company_response}]
        sa.Column('commitment_tracker', JSONB),            # [{target, year_set, deadline, progress_pct, status}]
        sa.Column('target_restatement_count', sa.Integer()), # # of times targets were revised
        sa.Column('target_strengthening_count', sa.Integer()),
        sa.Column('target_weakening_count', sa.Integer()),
        # Linguistic analysis
        sa.Column('sentiment_arc', JSONB),                 # [{year, compound, positive, negative, neutral}]
        sa.Column('complexity_evolution', JSONB),          # [{year, readability_score, jargon_density}]
        sa.Column('quantification_trend', JSONB),          # [{year, pct_quantified_claims}]
        # Peer benchmarking
        sa.Column('sector_narrative_rank', sa.Integer()),
        sa.Column('narrative_alpha_score', sa.Numeric(5, 2)),  # differentiation from sector average
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_eni_company', 'esg_narrative_intelligence', ['company_id'])
    op.create_index('idx_eni_years', 'esg_narrative_intelligence', ['analysis_start_year', 'analysis_end_year'])
    op.create_index('idx_eni_org', 'esg_narrative_intelligence', ['org_id'])

    # AI signal aggregation bus — cross-module analytics pipeline
    op.create_table('ai_signal_bus',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', sa.String(50)),
        sa.Column('signal_date', sa.Date()),
        sa.Column('signal_source', sa.String(50)),         # llm_extraction, greenwashing, narrative, sentiment, ml_scorer
        sa.Column('signal_type', sa.String(50)),           # disclosure_quality, gw_risk, sentiment_shift, score_change
        sa.Column('signal_value', sa.Numeric(10, 4)),
        sa.Column('signal_direction', sa.String(10)),      # up, down, stable
        sa.Column('confidence', sa.Numeric(5, 4)),
        sa.Column('evidence', JSONB),
        sa.Column('downstream_impact', JSONB),             # {module: impact_score} cross-module ripple
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_asb_company_date', 'ai_signal_bus', ['company_id', 'signal_date'])
    op.create_index('idx_asb_type', 'ai_signal_bus', ['signal_type'])
    op.create_index('idx_asb_org', 'ai_signal_bus', ['org_id'])

def downgrade() -> None:
    op.drop_index('idx_asb_org', table_name='ai_signal_bus')
    op.drop_index('idx_asb_type', table_name='ai_signal_bus')
    op.drop_index('idx_asb_company_date', table_name='ai_signal_bus')
    op.drop_table('ai_signal_bus')

    op.drop_index('idx_eni_org', table_name='esg_narrative_intelligence')
    op.drop_index('idx_eni_years', table_name='esg_narrative_intelligence')
    op.drop_index('idx_eni_company', table_name='esg_narrative_intelligence')
    op.drop_table('esg_narrative_intelligence')

    op.drop_index('idx_gwd_org', table_name='greenwashing_detection_runs')
    op.drop_index('idx_gwd_severity', table_name='greenwashing_detection_runs')
    op.drop_index('idx_gwd_company', table_name='greenwashing_detection_runs')
    op.drop_table('greenwashing_detection_runs')

    op.drop_index('idx_llm_ext_org', table_name='llm_esg_extractions')
    op.drop_index('idx_llm_ext_type', table_name='llm_esg_extractions')
    op.drop_index('idx_llm_ext_company', table_name='llm_esg_extractions')
    op.drop_table('llm_esg_extractions')
