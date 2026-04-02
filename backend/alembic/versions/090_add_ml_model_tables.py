"""add ML model registry, training runs, predictions, and NLP analysis tables

Revision ID: 090
Revises: 089
Create Date: 2026-04-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers
revision = '090'
down_revision = '089'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. ml_model_registry ─────────────────────────────────────────────────
    # ML model registry
    op.create_table('ml_model_registry',
        sa.Column('id',                   postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('model_name',           sa.String(200), nullable=False),
        sa.Column('model_type',           sa.String(50),  nullable=False),
        sa.Column('task',                 sa.String(100)),
        sa.Column('version',              sa.String(20),  server_default='1.0.0'),
        sa.Column('status',               sa.String(20),  server_default='staging'),
        sa.Column('architecture',         JSONB),
        sa.Column('hyperparameters',      JSONB),
        sa.Column('training_dataset',     sa.String(100)),
        sa.Column('n_training_samples',   sa.Integer),
        sa.Column('feature_names',        JSONB),
        sa.Column('target_variable',      sa.String(100)),
        sa.Column('mae',                  sa.Numeric(10, 6)),
        sa.Column('rmse',                 sa.Numeric(10, 6)),
        sa.Column('auc',                  sa.Numeric(6, 4)),
        sa.Column('pinball_loss_25',      sa.Numeric(10, 6)),
        sa.Column('pinball_loss_75',      sa.Numeric(10, 6)),
        sa.Column('calibration_error_pct', sa.Numeric(8, 4)),
        sa.Column('inference_per_sec',    sa.Numeric(10, 2)),
        sa.Column('model_card',           JSONB),
        sa.Column('champion_model',       sa.Boolean, server_default=sa.text('false')),
        sa.Column('org_id',               postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',           sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at',           sa.DateTime(timezone=True)),
        sa.CheckConstraint("status IN ('active','staging','training','deprecated')", name='ck_ml_model_status'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('model_name', name='uq_ml_model_name')
    )
    op.create_index('idx_ml_model_type', 'ml_model_registry', ['model_type'], unique=False)
    op.create_index('idx_ml_status',     'ml_model_registry', ['status'],     unique=False)

    # ── 2. ml_training_runs ───────────────────────────────────────────────────
    # Model training run history
    op.create_table('ml_training_runs',
        sa.Column('id',                     postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('model_id',               postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('ml_model_registry.id', ondelete='CASCADE'), nullable=False),
        sa.Column('run_name',               sa.String(200)),
        sa.Column('status',                 sa.String(20),   server_default='pending'),
        sa.Column('hyperparameters',        JSONB),
        sa.Column('training_config',        JSONB),
        sa.Column('n_folds',                sa.Integer,      server_default=sa.text('5')),
        sa.Column('validation_split',       sa.Numeric(5, 3), server_default=sa.text('0.2')),
        sa.Column('epochs_completed',       sa.Integer),
        sa.Column('total_epochs',           sa.Integer),
        sa.Column('train_loss_history',     JSONB),
        sa.Column('val_loss_history',       JSONB),
        sa.Column('final_mae',              sa.Numeric(10, 6)),
        sa.Column('final_rmse',             sa.Numeric(10, 6)),
        sa.Column('final_auc',              sa.Numeric(6, 4)),
        sa.Column('training_duration_sec',  sa.Numeric(10, 2)),
        sa.Column('started_at',             sa.DateTime(timezone=True)),
        sa.Column('completed_at',           sa.DateTime(timezone=True)),
        sa.Column('feature_importance',     JSONB),
        sa.Column('shap_values_summary',    JSONB),
        sa.Column('model_artifact_path',    sa.String(500)),
        sa.Column('error_message',          sa.Text),
        sa.Column('triggered_by',           sa.String(100)),
        sa.Column('org_id',                 postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',             sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.CheckConstraint("status IN ('pending','running','complete','failed')", name='ck_training_status'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_training_model',  'ml_training_runs', ['model_id'], unique=False)
    op.create_index('idx_training_status', 'ml_training_runs', ['status'],   unique=False)

    # ── 3. ml_predictions ────────────────────────────────────────────────────
    # Model prediction results
    op.create_table('ml_predictions',
        sa.Column('id',                postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('model_id',          postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('ml_model_registry.id'), nullable=False),
        sa.Column('asset_id',          sa.String(100),  nullable=False),
        sa.Column('prediction_date',   sa.DateTime(timezone=True), nullable=False),
        sa.Column('target_variable',   sa.String(100)),
        sa.Column('predicted_value',   sa.Numeric(20, 6)),
        sa.Column('actual_value',      sa.Numeric(20, 6)),
        sa.Column('quantile_05',       sa.Numeric(20, 6)),
        sa.Column('quantile_25',       sa.Numeric(20, 6)),
        sa.Column('quantile_50',       sa.Numeric(20, 6)),
        sa.Column('quantile_75',       sa.Numeric(20, 6)),
        sa.Column('quantile_95',       sa.Numeric(20, 6)),
        sa.Column('conformal_lower',   sa.Numeric(20, 6)),
        sa.Column('conformal_upper',   sa.Numeric(20, 6)),
        sa.Column('confidence_level',  sa.Numeric(5, 4)),
        sa.Column('within_interval',   sa.Boolean),
        sa.Column('input_features',    JSONB),
        sa.Column('shap_explanation',  JSONB),
        sa.Column('org_id',            postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',        sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_pred_asset', 'ml_predictions', ['asset_id'],       unique=False)
    op.create_index('idx_pred_date',  'ml_predictions', ['prediction_date'], unique=False)
    op.create_index('idx_pred_model', 'ml_predictions', ['model_id'],        unique=False)

    # ── 4. ml_feature_importance ─────────────────────────────────────────────
    # Feature importance tracking over time
    op.create_table('ml_feature_importance',
        sa.Column('id',                      postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('model_id',                postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('ml_model_registry.id'), nullable=False),
        sa.Column('training_run_id',         postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('ml_training_runs.id'), nullable=True),
        sa.Column('feature_name',            sa.String(100), nullable=False),
        sa.Column('importance_score',        sa.Numeric(10, 6)),
        sa.Column('importance_rank',         sa.Integer),
        sa.Column('shap_mean_abs',           sa.Numeric(10, 6)),
        sa.Column('permutation_importance',  sa.Numeric(10, 6)),
        sa.Column('recorded_at',             sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_feat_imp_model', 'ml_feature_importance', ['model_id'], unique=False)

    # ── 5. nlp_analysis_results ───────────────────────────────────────────────
    # NLP greenwashing / disclosure analysis
    op.create_table('nlp_analysis_results',
        sa.Column('id',                      postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id',             sa.String(100)),
        sa.Column('company_name',            sa.String(200)),
        sa.Column('document_type',           sa.String(50)),
        sa.Column('analysis_type',           sa.String(50)),
        sa.Column('input_text',              sa.Text),
        sa.Column('greenwashing_risk_level', sa.String(20)),
        sa.Column('greenwashing_confidence', sa.Numeric(6, 4)),
        sa.Column('detected_patterns',       JSONB),
        sa.Column('entity_extraction',       JSONB),
        sa.Column('esrs_violations',         JSONB),
        sa.Column('esrs_coverage',           JSONB),
        sa.Column('sentiment_ambition',      sa.Numeric(5, 2)),
        sa.Column('sentiment_credibility',   sa.Numeric(5, 2)),
        sa.Column('sentiment_specificity',   sa.Numeric(5, 2)),
        sa.Column('sentiment_urgency',       sa.Numeric(5, 2)),
        sa.Column('bert_attention_weights',  JSONB),
        sa.Column('model_version',           sa.String(50)),
        sa.Column('language',                sa.String(10), server_default='en'),
        sa.Column('org_id',                  postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',              sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_nlp_company',    'nlp_analysis_results', ['company_name'],            unique=False)
    op.create_index('idx_nlp_risk_level', 'nlp_analysis_results', ['greenwashing_risk_level'], unique=False)

    # ── 6. ml_data_drift_monitor ─────────────────────────────────────────────
    # Model data drift tracking
    op.create_table('ml_data_drift_monitor',
        sa.Column('id',                    postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('model_id',              postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('ml_model_registry.id'), nullable=False),
        sa.Column('feature_name',          sa.String(100)),
        sa.Column('monitoring_date',       sa.Date, nullable=False),
        sa.Column('psi_score',             sa.Numeric(10, 6)),
        sa.Column('ks_statistic',          sa.Numeric(10, 6)),
        sa.Column('ks_p_value',            sa.Numeric(10, 6)),
        sa.Column('drift_detected',        sa.Boolean, server_default=sa.text('false')),
        sa.Column('drift_severity',        sa.String(20)),
        sa.Column('baseline_distribution', JSONB),
        sa.Column('current_distribution',  JSONB),
        sa.Column('alert_triggered',       sa.Boolean, server_default=sa.text('false')),
        sa.Column('alert_message',         sa.Text),
        sa.Column('org_id',                postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',            sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_drift_model_date', 'ml_data_drift_monitor', ['model_id', 'monitoring_date'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_drift_model_date', table_name='ml_data_drift_monitor')
    op.drop_table('ml_data_drift_monitor')

    op.drop_index('idx_nlp_risk_level', table_name='nlp_analysis_results')
    op.drop_index('idx_nlp_company',    table_name='nlp_analysis_results')
    op.drop_table('nlp_analysis_results')

    op.drop_index('idx_feat_imp_model', table_name='ml_feature_importance')
    op.drop_table('ml_feature_importance')

    op.drop_index('idx_pred_model', table_name='ml_predictions')
    op.drop_index('idx_pred_date',  table_name='ml_predictions')
    op.drop_index('idx_pred_asset', table_name='ml_predictions')
    op.drop_table('ml_predictions')

    op.drop_index('idx_training_status', table_name='ml_training_runs')
    op.drop_index('idx_training_model',  table_name='ml_training_runs')
    op.drop_table('ml_training_runs')

    op.drop_index('idx_ml_status',     table_name='ml_model_registry')
    op.drop_index('idx_ml_model_type', table_name='ml_model_registry')
    op.drop_table('ml_model_registry')
