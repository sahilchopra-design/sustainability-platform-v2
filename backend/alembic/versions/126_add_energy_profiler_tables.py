"""Add energy asset registry, segment analysis, supplier network, revenue split,
decommissioning liability, and energy dashboard tables (Sprint CU)

Revision ID: 126
Revises: 125
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '126'
down_revision = '125'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('energy_asset_registry',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('asset_name', sa.String(200), nullable=False),
        sa.Column('asset_type', sa.String(50)),          # power_plant/refinery/lng_terminal/pipeline/mine/well/storage
        sa.Column('fuel_type', sa.String(50)),            # coal/gas/oil/nuclear/hydro/wind/solar/biomass/geothermal
        sa.Column('segment', sa.String(20)),              # upstream/midstream/downstream
        sa.Column('capacity_mw', sa.Numeric(10,2)),
        sa.Column('annual_output_gwh', sa.Numeric(10,2)),
        sa.Column('carbon_intensity_tco2_gwh', sa.Numeric(8,2)),
        sa.Column('annual_emissions_tco2', sa.Numeric(12,2)),
        sa.Column('country_code', sa.String(3)),
        sa.Column('latitude', sa.Numeric(9,6)),
        sa.Column('longitude', sa.Numeric(9,6)),
        sa.Column('commissioning_year', sa.Integer),
        sa.Column('planned_retirement_year', sa.Integer),
        sa.Column('book_value_mn', sa.Numeric(10,2)),
        sa.Column('decommissioning_liability_mn', sa.Numeric(10,2)),
        sa.Column('stranded_risk_score', sa.Integer),
        sa.Column('wri_gppd_id', sa.String(20)),          # WRI Global Power Plant DB cross-ref
        sa.Column('epa_ghgrp_id', sa.String(20)),         # EPA facility ID
        sa.Column('eutl_id', sa.String(20)),              # EU ETS installation ID
        sa.Column('taxonomy_scores', JSONB),
    )

    op.create_table('energy_segment_analysis',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('segment', sa.String(20), nullable=False),  # upstream/midstream/downstream/renewables/retail
        sa.Column('year', sa.Integer),
        sa.Column('revenue_mn', sa.Numeric(12,2)),
        sa.Column('ebitda_mn', sa.Numeric(12,2)),
        sa.Column('capex_mn', sa.Numeric(12,2)),
        sa.Column('emissions_tco2', sa.Numeric(14,2)),
        sa.Column('transition_score', sa.Integer),
        sa.Column('stranded_exposure_mn', sa.Numeric(12,2)),
        sa.Column('internal_carbon_price_usd', sa.Numeric(8,2)),
        sa.Column('details', JSONB),
    )

    op.create_table('energy_supplier_network',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('supplier_name', sa.String(200)),
        sa.Column('tier', sa.Integer),                    # 1, 2, 3
        sa.Column('category', sa.String(100)),            # equipment/services/materials/logistics/technology
        sa.Column('country_code', sa.String(3)),
        sa.Column('spend_mn', sa.Numeric(10,2)),
        sa.Column('transition_score', sa.Integer),
        sa.Column('geopolitical_risk_score', sa.Integer),
        sa.Column('critical_dependency', sa.Boolean),
        sa.Column('alternative_suppliers', sa.Integer),
        sa.Column('engagement_status', sa.String(20)),    # not_started/in_progress/responsive/non_responsive
    )

    op.create_table('energy_revenue_split',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('year', sa.Integer),
        sa.Column('total_revenue_mn', sa.Numeric(12,2)),
        sa.Column('legacy_revenue_pct', sa.Numeric(5,2)),
        sa.Column('renewable_revenue_pct', sa.Numeric(5,2)),
        sa.Column('transition_revenue_pct', sa.Numeric(5,2)),  # gas transition, blue H2, etc.
        sa.Column('total_capex_mn', sa.Numeric(12,2)),
        sa.Column('legacy_capex_pct', sa.Numeric(5,2)),
        sa.Column('green_capex_pct', sa.Numeric(5,2)),
        sa.Column('green_revenue_ratio', sa.Numeric(5,3)),
        sa.Column('iea_nze_capex_alignment_pct', sa.Numeric(5,2)),
    )

    op.create_table('energy_decommissioning',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('asset_id', sa.Integer, sa.ForeignKey('energy_asset_registry.id')),
        sa.Column('estimated_cost_mn', sa.Numeric(10,2)),
        sa.Column('current_provision_mn', sa.Numeric(10,2)),
        sa.Column('funding_gap_mn', sa.Numeric(10,2)),
        sa.Column('regulatory_bond_required', sa.Boolean),
        sa.Column('jurisdiction', sa.String(50)),
        sa.Column('expected_year', sa.Integer),
        sa.Column('scenario_accelerated_year', JSONB),    # {nz2050: 2032, b2c: 2035, cp: 2042}
    )

    op.create_table('energy_transition_dashboard',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_id', sa.Integer, sa.ForeignKey('assessed_entities.id'), index=True),
        sa.Column('snapshot_date', sa.DateTime, server_default=sa.func.now()),
        sa.Column('green_revenue_ratio', sa.Numeric(5,3)),
        sa.Column('capex_alignment_pct', sa.Numeric(5,2)),
        sa.Column('portfolio_carbon_intensity', sa.Numeric(8,2)),
        sa.Column('decom_liability_gap_mn', sa.Numeric(10,2)),
        sa.Column('supplier_avg_score', sa.Integer),
        sa.Column('itr_degrees', sa.Numeric(4,2)),
        sa.Column('taxonomy_deep_drill', JSONB),
        sa.Column('peer_ranking', JSONB),
    )


def downgrade():
    op.drop_table('energy_transition_dashboard')
    op.drop_table('energy_decommissioning')
    op.drop_table('energy_revenue_split')
    op.drop_table('energy_supplier_network')
    op.drop_table('energy_segment_analysis')
    op.drop_table('energy_asset_registry')
