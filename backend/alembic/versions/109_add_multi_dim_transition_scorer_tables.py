"""Add multi-dim transition scorer, heatmap, and carbon footprint tables (Sprint CD)

Revision ID: 109
Revises: 108
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '109'
down_revision = '108'
branch_labels = None
depends_on = None


def upgrade():
    # ── EP-CD1: Multi-Dimensional Transition Scorer ──────────────────────────
    op.create_table(
        'multi_dim_transition_scores',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('company_id', sa.String(50), nullable=False, index=True),
        sa.Column('company_name', sa.String(200), nullable=False),
        sa.Column('sector', sa.String(100)),
        sa.Column('geography', sa.String(100)),
        sa.Column('scored_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('data_tier', sa.String(20), default='public'),   # 'public' | 'proprietary'
        # 6-pillar scores (0-100)
        sa.Column('carbon_exposure_score', sa.Numeric(5, 2)),       # weight 22%
        sa.Column('technology_readiness_score', sa.Numeric(5, 2)),  # weight 18%
        sa.Column('policy_risk_score', sa.Numeric(5, 2)),           # weight 20%
        sa.Column('market_dynamics_score', sa.Numeric(5, 2)),       # weight 18%
        sa.Column('capital_access_score', sa.Numeric(5, 2)),        # weight 12%
        sa.Column('social_license_score', sa.Numeric(5, 2)),        # weight 10%
        sa.Column('composite_score', sa.Numeric(5, 2)),
        sa.Column('rating', sa.String(2)),                          # A/B/C/D/E
        # Proprietary score overrides (NULL = not available)
        sa.Column('prop_carbon_exposure_score', sa.Numeric(5, 2)),
        sa.Column('prop_technology_readiness_score', sa.Numeric(5, 2)),
        sa.Column('prop_policy_risk_score', sa.Numeric(5, 2)),
        sa.Column('prop_market_dynamics_score', sa.Numeric(5, 2)),
        sa.Column('prop_capital_access_score', sa.Numeric(5, 2)),
        sa.Column('prop_social_license_score', sa.Numeric(5, 2)),
        sa.Column('prop_composite_score', sa.Numeric(5, 2)),
        sa.Column('prop_rating', sa.String(2)),
        # Source attribution
        sa.Column('data_sources', JSONB),                           # {carbon: 'CDP 2024', tech: 'CapEx public filings', ...}
        sa.Column('signal_feed', JSONB),                            # list of {headline, sentiment, ts}
        sa.Column('pillar_deltas', JSONB),                          # public vs proprietary deltas per pillar
        sa.Column('notes', sa.Text),
    )

    # ── EP-CD2: Transition Risk Heatmap Runs ─────────────────────────────────
    op.create_table(
        'transition_risk_heatmap_runs',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('run_name', sa.String(200)),
        sa.Column('scenario', sa.String(100), nullable=False),       # NGFS scenario name
        sa.Column('scenario_index', sa.Integer),                     # 0=CP, 1=B2C, 2=NZ2050
        sa.Column('scenario_multiplier', sa.Numeric(5, 3)),
        sa.Column('run_date', sa.DateTime, server_default=sa.func.now()),
        sa.Column('sectors', JSONB),                                 # list of GICS sectors
        sa.Column('geographies', JSONB),                             # list of geographies
        sa.Column('risk_matrix', JSONB),                             # sector -> [geo_scores]
        sa.Column('sector_averages', JSONB),                         # sector -> avg score
        sa.Column('geo_averages', JSONB),                            # geo -> avg score
        sa.Column('critical_cells', JSONB),                          # [{sector, geo, score}] where score >= 75
        sa.Column('high_cells', JSONB),                              # score >= 55
        sa.Column('notes', sa.Text),
    )

    # ── EP-CD3: Carbon Footprint Analyses ────────────────────────────────────
    op.create_table(
        'carbon_footprint_analyses',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('company_id', sa.String(50), nullable=False, index=True),
        sa.Column('company_name', sa.String(200), nullable=False),
        sa.Column('reporting_year', sa.Integer, nullable=False),
        sa.Column('sector', sa.String(100)),
        sa.Column('revenue_musd', sa.Numeric(12, 2)),
        # Scope 1/2/3
        sa.Column('scope1_tco2e', sa.Numeric(14, 2)),
        sa.Column('scope2_location_tco2e', sa.Numeric(14, 2)),
        sa.Column('scope2_market_tco2e', sa.Numeric(14, 2)),
        sa.Column('scope3_total_tco2e', sa.Numeric(14, 2)),
        sa.Column('scope3_by_category', JSONB),                     # {cat1: x, cat2: y, ...cat15: z}
        # Intensities
        sa.Column('scope12_intensity_tco2_musd', sa.Numeric(10, 3)),
        sa.Column('scope123_intensity_tco2_musd', sa.Numeric(10, 3)),
        # SBTi
        sa.Column('sbti_committed', sa.Boolean, default=False),
        sa.Column('sbti_target_year', sa.Integer),
        sa.Column('sbti_base_year', sa.Integer),
        sa.Column('sbti_reduction_pct', sa.Numeric(5, 2)),
        sa.Column('sbti_trajectory', JSONB),                         # [{year, target, actual}]
        # Benchmarks
        sa.Column('sector_intensity_benchmark', sa.Numeric(10, 3)),
        sa.Column('vs_benchmark_pct', sa.Numeric(8, 3)),            # negative = better than benchmark
        # Verification
        sa.Column('assurance_level', sa.String(50)),                 # Limited / Reasonable / None
        sa.Column('assurance_provider', sa.String(100)),
        sa.Column('ghg_protocol_compliant', sa.Boolean, default=True),
        sa.Column('data_quality_score', sa.Integer),                 # 1-5
        sa.Column('notes', sa.Text),
    )


def downgrade():
    op.drop_table('carbon_footprint_analyses')
    op.drop_table('transition_risk_heatmap_runs')
    op.drop_table('multi_dim_transition_scores')
