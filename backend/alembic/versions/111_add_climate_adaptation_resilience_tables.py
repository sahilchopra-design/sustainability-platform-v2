"""Add climate adaptation pathways, infrastructure resilience, and NbS tables (Sprint CF)

Revision ID: 111
Revises: 110
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '111'
down_revision = '110'
branch_labels = None
depends_on = None


def upgrade():
    # ── EP-CF1: Climate Adaptation Pathways ──────────────────────────────────
    op.create_table(
        'adaptation_strategies',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('strategy_id', sa.String(20), nullable=False, unique=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('sector', sa.String(100)),
        sa.Column('strategy_type', sa.String(50)),           # Engineered/Nature-Based/Operational/Financial/Hybrid
        sa.Column('hazard', sa.String(200)),
        sa.Column('cost_usd_m', sa.Numeric(12, 2)),
        sa.Column('benefit_usd_m', sa.Numeric(12, 2)),
        sa.Column('bcr', sa.Numeric(6, 2)),
        sa.Column('irr_pct', sa.Numeric(5, 2)),
        sa.Column('payback_years', sa.Integer),
        sa.Column('effectiveness_pct', sa.Integer),
        sa.Column('co_benefits_score', sa.Integer),
        sa.Column('maladaptation_risk_pct', sa.Integer),
        sa.Column('timeline', sa.String(50)),
        sa.Column('maturity', sa.String(50)),                # Proven/Scaling/Emerging
        sa.Column('ssp_sensitivity', JSONB),                  # [{ssp, bcr}]
        sa.Column('description', sa.Text),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        'maladaptation_cases',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('risk_level', sa.String(20)),               # HIGH/MEDIUM/LOW
        sa.Column('sector', sa.String(100)),
        sa.Column('hazard', sa.String(100)),
        sa.Column('consequence', sa.Text),
        sa.Column('mitigation', sa.Text),
    )

    # ── EP-CF2: Infrastructure Resilience Scorer ─────────────────────────────
    op.create_table(
        'infrastructure_resilience_scores',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('asset_id', sa.String(20), nullable=False, index=True),
        sa.Column('asset_name', sa.String(200), nullable=False),
        sa.Column('asset_type', sa.String(100)),
        sa.Column('location', sa.String(200)),
        sa.Column('value_usd_m', sa.Numeric(12, 2)),
        sa.Column('age_years', sa.Integer),
        sa.Column('remaining_life_years', sa.Integer),
        sa.Column('condition', sa.String(50)),
        # 5-pillar resilience
        sa.Column('structural_score', sa.Integer),
        sa.Column('operational_score', sa.Integer),
        sa.Column('financial_score', sa.Integer),
        sa.Column('environmental_score', sa.Integer),
        sa.Column('social_score', sa.Integer),
        sa.Column('composite_resilience_score', sa.Integer),
        sa.Column('resilience_band', sa.String(20)),          # RESILIENT/ADEQUATE/VULNERABLE/CRITICAL
        # Climate exposure
        sa.Column('hazards', JSONB),                           # list of hazard names
        sa.Column('climate_haircut_pct', sa.Numeric(5, 2)),
        # Retrofit
        sa.Column('retrofit_cost_usd_m', sa.Numeric(10, 2)),
        sa.Column('retrofit_benefit_usd_m', sa.Numeric(10, 2)),
        sa.Column('retrofit_bcr', sa.Numeric(5, 2)),
        # Trend
        sa.Column('score_trend', JSONB),                       # [score_yr1, ..., score_yr5]
        sa.Column('scored_at', sa.DateTime, server_default=sa.func.now()),
    )

    # ── EP-CF3: Nature-Based Adaptation Solutions ────────────────────────────
    op.create_table(
        'nbs_adaptation_projects',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('project_id', sa.String(20), nullable=False, unique=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('ecosystem', sa.String(100)),               # Coastal/Urban/Freshwater/Marine/Agricultural/Wetland
        sa.Column('hazard', sa.String(200)),
        sa.Column('region', sa.String(100)),
        sa.Column('area_ha', sa.Numeric(12, 2)),
        sa.Column('cost_per_ha', sa.Numeric(10, 2)),
        sa.Column('total_cost_usd_m', sa.Numeric(10, 2)),
        sa.Column('protection_value_usd_m', sa.Numeric(10, 2)),
        sa.Column('carbon_value_usd_m', sa.Numeric(10, 2)),
        sa.Column('bcr', sa.Numeric(6, 2)),
        sa.Column('biodiversity_score', sa.Integer),
        sa.Column('community_jobs', sa.Integer),
        sa.Column('co_benefits', JSONB),                       # {carbon_tco2, biodiversity, fisheries_m, ...}
        sa.Column('sdg_alignment', JSONB),                     # [13, 14, 15, ...]
        sa.Column('timeline', sa.String(50)),
        sa.Column('maturity', sa.String(50)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        'ecosystem_service_valuations',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('ecosystem', sa.String(100), nullable=False),
        sa.Column('value_per_ha_usd', sa.Numeric(12, 2)),
        sa.Column('key_services', sa.Text),
        sa.Column('source', sa.String(200)),
        sa.Column('year', sa.Integer),
    )


def downgrade():
    op.drop_table('ecosystem_service_valuations')
    op.drop_table('nbs_adaptation_projects')
    op.drop_table('infrastructure_resilience_scores')
    op.drop_table('maladaptation_cases')
    op.drop_table('adaptation_strategies')
