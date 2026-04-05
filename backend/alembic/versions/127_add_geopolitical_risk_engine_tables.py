"""Add geopolitical risk index, sanctions registry, critical mineral geo risk,
conflict tracker, geo-transition nexus, and geo dashboard tables (Sprint CV)

Revision ID: 127
Revises: 126
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '127'
down_revision = '126'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('geopolitical_risk_index_v2',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('country_code', sa.String(3), nullable=False, index=True),
        sa.Column('country_name', sa.String(100)),
        sa.Column('year', sa.Integer),
        sa.Column('composite_score', sa.Numeric(5,2)),    # 0-100 (higher = more risk)
        # World Bank WGI 6 dimensions (-2.5 to +2.5, normalised to 0-100)
        sa.Column('voice_accountability', sa.Numeric(5,2)),
        sa.Column('political_stability', sa.Numeric(5,2)),
        sa.Column('govt_effectiveness', sa.Numeric(5,2)),
        sa.Column('regulatory_quality', sa.Numeric(5,2)),
        sa.Column('rule_of_law', sa.Numeric(5,2)),
        sa.Column('control_corruption', sa.Numeric(5,2)),
        # Extended dimensions
        sa.Column('conflict_intensity', sa.Numeric(5,2)),          # ACLED-derived
        sa.Column('sanctions_exposure', sa.String(20)),            # none/partial/sectoral/comprehensive
        sa.Column('regime_change_prob', sa.Numeric(5,3)),
        sa.Column('trade_policy_risk', sa.Numeric(5,2)),
        sa.Column('fragile_state_index', sa.Numeric(5,2)),         # Fund for Peace FSI
        sa.Column('democracy_index', sa.Numeric(5,2)),             # EIU
        sa.Column('fossil_export_dependency_pct', sa.Numeric(5,2)),
        sa.Column('critical_mineral_control', JSONB),              # {lithium: 15%, cobalt: 0%, ...}
    )

    op.create_table('sanctions_registry_v2',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('sanctioned_entity', sa.String(200), nullable=False),
        sa.Column('entity_type', sa.String(20)),           # country/entity/individual/vessel
        sa.Column('sanctions_regime', sa.String(20)),      # OFAC_SDN/EU/UK_OFSI/UN/OFAC_SSI
        sa.Column('country_code', sa.String(3)),
        sa.Column('date_listed', sa.Date),
        sa.Column('reason', sa.Text),
        sa.Column('program', sa.String(100)),              # e.g. 'UKRAINE-EO13662', 'IRAN', 'SDGT'
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('secondary_sanctions_risk', sa.Boolean),
        sa.Column('sector_restrictions', JSONB),           # which sectors restricted
    )

    op.create_table('mineral_geopolitical_risk_v2',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('mineral', sa.String(50)),
        sa.Column('supply_country', sa.String(3)),
        sa.Column('supply_share_pct', sa.Numeric(5,2)),
        sa.Column('processing_country', sa.String(3)),
        sa.Column('processing_share_pct', sa.Numeric(5,2)),
        sa.Column('geopolitical_risk_score', sa.Integer),
        sa.Column('substitution_feasibility', sa.String(20)),  # easy/moderate/difficult/impossible
        sa.Column('friendshoring_readiness', sa.Numeric(5,2)),
        sa.Column('export_control_status', sa.String(20)),     # none/restricted/banned
        sa.Column('recycling_potential_pct', sa.Numeric(5,2)),
        sa.Column('price_volatility_pct', sa.Numeric(5,2)),
    )

    op.create_table('conflict_stability_events',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('country_code', sa.String(3), index=True),
        sa.Column('event_type', sa.String(50)),            # battle/protest/riot/explosion/strategic
        sa.Column('event_date', sa.Date),
        sa.Column('fatalities', sa.Integer),
        sa.Column('latitude', sa.Numeric(9,6)),
        sa.Column('longitude', sa.Numeric(9,6)),
        sa.Column('source', sa.String(20)),                # ACLED/UCDP
        sa.Column('proximity_to_assets', JSONB),           # [{asset_id, distance_km}]
    )

    op.create_table('geo_transition_nexus',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('transition_score', sa.Integer),
        sa.Column('geopolitical_score', sa.Integer),
        sa.Column('geo_weight', sa.Numeric(4,3)),          # configurable, default 0.15
        sa.Column('combined_score', sa.Integer),
        sa.Column('correlation', sa.Numeric(5,3)),
        sa.Column('fossil_state_risk', sa.Boolean),        # high fossil + high geo = stranded state
        sa.Column('policy_reversal_risk', sa.Numeric(5,2)),
        sa.Column('scenario_impacts', JSONB),
        sa.Column('assessed_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('geopolitical_dashboard_snapshots',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('snapshot_date', sa.DateTime, server_default=sa.func.now()),
        sa.Column('top_10_exposures', JSONB),
        sa.Column('sanctions_alerts', JSONB),
        sa.Column('mineral_supply_alerts', JSONB),
        sa.Column('conflict_watch', JSONB),
        sa.Column('country_heatmap', JSONB),
    )


def downgrade():
    op.drop_table('geopolitical_dashboard_snapshots')
    op.drop_table('geo_transition_nexus')
    op.drop_table('conflict_stability_events')
    op.drop_table('mineral_geopolitical_risk_v2')
    op.drop_table('sanctions_registry_v2')
    op.drop_table('geopolitical_risk_index_v2')
