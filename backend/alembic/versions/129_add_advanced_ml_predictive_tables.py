"""Add ML model registry v2, predictions v2, feature engineering config,
anomaly flags, peer clusters, scenario-conditional, and ML governance tables (Sprint CX)

Revision ID: 129
Revises: 128
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '129'
down_revision = '128'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('ml_model_registry_v2',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('model_name', sa.String(100), nullable=False),
        sa.Column('model_version', sa.String(20)),
        sa.Column('model_type', sa.String(30)),            # xgboost/lightgbm/neural_mlp/isolation_forest/kmeans
        sa.Column('task', sa.String(30)),                   # forward_score/anomaly/clustering/scenario_conditional
        sa.Column('hyperparameters', JSONB),
        sa.Column('feature_set', JSONB),                    # list of feature codes from taxonomy
        sa.Column('feature_count', sa.Integer),
        sa.Column('training_metrics', JSONB),               # {rmse, mae, r2, auc, silhouette}
        sa.Column('validation_metrics', JSONB),
        sa.Column('training_data_range', JSONB),            # {start, end, n_samples}
        sa.Column('conformal_alpha', sa.Numeric(4,3)),      # coverage level (default 0.90)
        sa.Column('status', sa.String(20)),                  # staging/active/deprecated/archived
        sa.Column('deployed_at', sa.DateTime),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('created_by', sa.String(100)),
    )

    op.create_table('ml_predictions_v2',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('model_id', sa.Integer, sa.ForeignKey('ml_model_registry_v2.id'), index=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('taxonomy_code', sa.String(20)),          # which taxonomy node predicted (or 'COMPOSITE')
        sa.Column('prediction_date', sa.Date),
        sa.Column('forward_score', sa.Numeric(5,2)),
        sa.Column('prediction_lo', sa.Numeric(5,2)),        # conformal lower bound
        sa.Column('prediction_hi', sa.Numeric(5,2)),        # conformal upper bound
        sa.Column('confidence', sa.Numeric(4,3)),
        sa.Column('shap_top10', JSONB),                     # [{feature, value, contribution}] top 10
        sa.Column('anomaly_flag', sa.Boolean, default=False),
        sa.Column('anomaly_score', sa.Numeric(5,3)),        # Isolation Forest score
        sa.Column('cluster_id', sa.Integer),                 # K-means cluster assignment
    )

    op.create_table('ml_feature_engineering_config',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('config_name', sa.String(100)),
        sa.Column('raw_feature_count', sa.Integer),         # e.g. 948 (316 current + 316 velocity + 316 acceleration)
        sa.Column('selected_feature_count', sa.Integer),    # e.g. 200 after selection
        sa.Column('selection_method', sa.String(30)),        # mutual_information/pca/lasso/all
        sa.Column('pca_explained_variance', JSONB),          # [0.35, 0.22, 0.12, ...] per component
        sa.Column('correlation_threshold', sa.Numeric(4,3)), # drop features correlated > threshold
        sa.Column('missing_imputation', sa.String(20)),      # median_sector/mean/knn/zero
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('ml_anomaly_detections',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('detection_date', sa.Date),
        sa.Column('anomaly_score', sa.Numeric(5,3)),
        sa.Column('contamination', sa.Numeric(4,3)),        # Isolation Forest parameter
        sa.Column('outlier_taxonomy_nodes', JSONB),          # which nodes are anomalous
        sa.Column('investigation_status', sa.String(20)),    # open/investigating/confirmed/false_positive
        sa.Column('resolution_notes', sa.Text),
        sa.Column('investigated_by', sa.String(100)),
    )

    op.create_table('ml_peer_clusters',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('cluster_run_id', sa.String(50)),
        sa.Column('k', sa.Integer),                          # number of clusters
        sa.Column('silhouette_score', sa.Numeric(5,3)),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('cluster_id', sa.Integer),
        sa.Column('cluster_label', sa.String(50)),           # e.g. "Leaders", "Transitioning", "Lagging"
        sa.Column('cluster_centroid', JSONB),                # avg taxonomy scores for this cluster
        sa.Column('distance_to_centroid', sa.Numeric(6,3)),
        sa.Column('quarter', sa.String(10)),                 # e.g. '2026-Q1' for migration tracking
    )

    op.create_table('ml_scenario_conditional',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('scenario_name', sa.String(50)),
        sa.Column('carbon_price_input', sa.Numeric(8,2)),
        sa.Column('gdp_growth_input', sa.Numeric(5,2)),
        sa.Column('tech_cost_input', sa.Numeric(8,2)),
        sa.Column('policy_stringency_input', sa.Numeric(5,2)),
        sa.Column('predicted_score', sa.Numeric(5,2)),
        sa.Column('prediction_interval', JSONB),
        sa.Column('sensitivity', JSONB),                     # partial derivatives wrt each input
        sa.Column('pathway_label', sa.String(30)),           # orderly/disorderly/hot_house/delayed
        sa.Column('predicted_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('ml_governance_log',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('model_id', sa.Integer, sa.ForeignKey('ml_model_registry_v2.id')),
        sa.Column('action', sa.String(30)),                  # deployed/retrained/deprecated/drift_alert/audit
        sa.Column('psi_score', sa.Numeric(5,3)),             # Population Stability Index
        sa.Column('drift_detected', sa.Boolean),
        sa.Column('compliance_status', JSONB),               # {fed_sr117: true, eu_ai_act: true, ...}
        sa.Column('explainability_report', JSONB),
        sa.Column('user_id', sa.String(100)),
        sa.Column('logged_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('details', JSONB),
    )


def downgrade():
    op.drop_table('ml_governance_log')
    op.drop_table('ml_scenario_conditional')
    op.drop_table('ml_peer_clusters')
    op.drop_table('ml_anomaly_detections')
    op.drop_table('ml_feature_engineering_config')
    op.drop_table('ml_predictions_v2')
    op.drop_table('ml_model_registry_v2')
