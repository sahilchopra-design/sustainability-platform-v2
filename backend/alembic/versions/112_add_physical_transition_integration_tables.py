"""Add physical-transition risk integration, regional impact, supply chain contagion,
early warning, compound events, and climate migration tables (Sprint CG)

Revision ID: 112
Revises: 111
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '112'
down_revision = '111'
branch_labels = None
depends_on = None


def upgrade():
    # EP-CG1: Physical-Transition Nexus
    op.create_table(
        'physical_transition_nexus',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('portfolio_id', sa.String(50), index=True),
        sa.Column('run_date', sa.DateTime, server_default=sa.func.now()),
        sa.Column('scenario_ngfs', sa.String(50)),
        sa.Column('scenario_ssp', sa.String(20)),
        sa.Column('aum_bn', sa.Numeric(10, 2)),
        sa.Column('cvar_transition_pct', sa.Numeric(8, 4)),
        sa.Column('cvar_physical_pct', sa.Numeric(8, 4)),
        sa.Column('rho_dynamic', sa.Numeric(6, 4)),
        sa.Column('cvar_interaction_pct', sa.Numeric(8, 4)),
        sa.Column('cvar_integrated_pct', sa.Numeric(8, 4)),
        sa.Column('sector_interaction_matrix', JSONB),
        sa.Column('double_hit_results', JSONB),
        sa.Column('notes', sa.Text),
    )

    # EP-CG2: Regional Climate Impact
    op.create_table(
        'regional_climate_impacts',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('region', sa.String(100), nullable=False),
        sa.Column('ssp_scenario', sa.String(20)),
        sa.Column('peril', sa.String(50)),
        sa.Column('hazard_probability', sa.Numeric(8, 6)),
        sa.Column('gdp_impact_pct', sa.Numeric(6, 3)),
        sa.Column('labor_productivity_loss_pct', sa.Numeric(5, 2)),
        sa.Column('agriculture_yield_loss_pct', sa.Numeric(5, 2)),
        sa.Column('infrastructure_damage_usd_m', sa.Numeric(12, 2)),
        sa.Column('sector_impacts', JSONB),
        sa.Column('year', sa.Integer),
    )

    # EP-CG3: Supply Chain Contagion
    op.create_table(
        'supply_chain_climate_contagion',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('company_id', sa.String(50), index=True),
        sa.Column('company_name', sa.String(200)),
        sa.Column('tier', sa.Integer),
        sa.Column('supplier_name', sa.String(200)),
        sa.Column('supplier_location', sa.String(200)),
        sa.Column('hazard_zone', sa.String(100)),
        sa.Column('disruption_probability', sa.Numeric(5, 3)),
        sa.Column('revenue_impact_usd_m', sa.Numeric(10, 2)),
        sa.Column('cascade_path', JSONB),
        sa.Column('chokepoint', sa.String(100)),
        sa.Column('mitigation_strategies', JSONB),
    )

    # EP-CG4: Physical Risk Early Warning
    op.create_table(
        'physical_risk_alerts',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('alert_id', sa.String(50), unique=True),
        sa.Column('severity', sa.String(20)),
        sa.Column('hazard_type', sa.String(50)),
        sa.Column('affected_assets', JSONB),
        sa.Column('estimated_loss_range', JSONB),
        sa.Column('forecast_hours', sa.Integer),
        sa.Column('issued_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('acknowledged', sa.Boolean, default=False),
        sa.Column('response_actions', JSONB),
    )

    # EP-CG5: Compound Event Modeler
    op.create_table(
        'compound_climate_events',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('event_pair', sa.String(200)),
        sa.Column('joint_probability', sa.Numeric(8, 6)),
        sa.Column('independent_probability', sa.Numeric(8, 6)),
        sa.Column('dependence_ratio', sa.Numeric(6, 3)),
        sa.Column('loss_amplification_factor', sa.Numeric(5, 2)),
        sa.Column('historical_occurrences', sa.Integer),
        sa.Column('copula_type', sa.String(50)),
        sa.Column('details', JSONB),
    )

    # EP-CG6: Climate Migration Risk
    op.create_table(
        'climate_migration_corridors',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('origin_region', sa.String(100)),
        sa.Column('destination_region', sa.String(100)),
        sa.Column('driver_hazard', sa.String(100)),
        sa.Column('projected_migrants_m', sa.Numeric(8, 2)),
        sa.Column('scenario', sa.String(50)),
        sa.Column('year', sa.Integer),
        sa.Column('urban_stress_score', sa.Integer),
        sa.Column('re_demand_impact_pct', sa.Numeric(5, 2)),
        sa.Column('labor_market_absorption', sa.Numeric(5, 2)),
        sa.Column('investment_implications', JSONB),
    )


def downgrade():
    op.drop_table('climate_migration_corridors')
    op.drop_table('compound_climate_events')
    op.drop_table('physical_risk_alerts')
    op.drop_table('supply_chain_climate_contagion')
    op.drop_table('regional_climate_impacts')
    op.drop_table('physical_transition_nexus')
