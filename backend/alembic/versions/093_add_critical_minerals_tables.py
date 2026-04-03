"""add critical minerals, battery EV, energy transition commodity tables

Revision ID: 093
Revises: 092
Create Date: 2026-04-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '093'
down_revision = '092'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. critical_minerals ──────────────────────────────────────────────────
    op.create_table('critical_minerals',
        sa.Column('id',                  postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('mineral',             sa.String(100), nullable=False),
        sa.Column('symbol',              sa.String(10)),
        sa.Column('category',            sa.String(50)),     # battery / pv / wind / nuclear / etc.
        sa.Column('price_usd_per_t',     sa.Numeric(16, 2)),
        sa.Column('price_date',          sa.Date()),
        sa.Column('yoy_change_pct',      sa.Numeric(8, 2)),
        sa.Column('supply_concentration',sa.Numeric(8, 2)),  # HHI 0–10000
        sa.Column('demand_2030_mt',      sa.Numeric(12, 2)),
        sa.Column('demand_2040_mt',      sa.Numeric(12, 2)),
        sa.Column('supply_2030_mt',      sa.Numeric(12, 2)),
        sa.Column('market_balance_mt',   sa.Numeric(12, 2)),
        sa.Column('recycling_rate_pct',  sa.Numeric(6, 2)),
        sa.Column('top_producers',       JSONB),             # [{country, share_pct}]
        sa.Column('criticality_level',   sa.String(20)),     # Critical / High / Moderate
        sa.Column('geopolitical_risk',   sa.String(20)),     # High / Medium / Low
        sa.Column('eu_crma_listed',      sa.Boolean(), server_default='false'),
        sa.Column('us_dod_listed',       sa.Boolean(), server_default='false'),
        sa.Column('notes',               sa.Text()),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_crit_min_mineral',    'critical_minerals', ['mineral'])
    op.create_index('idx_crit_min_category',   'critical_minerals', ['category'])
    op.create_index('idx_crit_min_price_date', 'critical_minerals', ['price_date'])

    # ── 2. mineral_country_supply ─────────────────────────────────────────────
    op.create_table('mineral_country_supply',
        sa.Column('id',              postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('mineral',         sa.String(100), nullable=False),
        sa.Column('country_iso',     sa.String(3),   nullable=False),
        sa.Column('country_name',    sa.String(100)),
        sa.Column('supply_share_pct',sa.Numeric(6, 2)),
        sa.Column('production_kt',   sa.Numeric(12, 2)),
        sa.Column('reserve_kt',      sa.Numeric(16, 2)),
        sa.Column('year',            sa.Integer()),
        sa.Column('data_source',     sa.String(100)),
        sa.Column('created_at',      sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_mcs_mineral',  'mineral_country_supply', ['mineral'])
    op.create_index('idx_mcs_country',  'mineral_country_supply', ['country_iso'])
    op.create_index('idx_mcs_year',     'mineral_country_supply', ['year'])

    # ── 3. mine_pipeline ─────────────────────────────────────────────────────
    op.create_table('mine_pipeline',
        sa.Column('id',              postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_name',    sa.String(200), nullable=False),
        sa.Column('mineral',         sa.String(100)),
        sa.Column('country_iso',     sa.String(3)),
        sa.Column('country_name',    sa.String(100)),
        sa.Column('stage',           sa.String(50)),    # Exploration / Feasibility / Construction / Producing
        sa.Column('capex_bn_usd',    sa.Numeric(10, 2)),
        sa.Column('annual_capacity_kt', sa.Numeric(12, 2)),
        sa.Column('first_production_year', sa.Integer()),
        sa.Column('operator',        sa.String(200)),
        sa.Column('esg_risk',        sa.String(20)),
        sa.Column('permitting_status', sa.String(50)),
        sa.Column('created_at',      sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_mine_mineral', 'mine_pipeline', ['mineral'])
    op.create_index('idx_mine_stage',   'mine_pipeline', ['stage'])
    op.create_index('idx_mine_country', 'mine_pipeline', ['country_iso'])

    # ── 4. battery_cost_curves ────────────────────────────────────────────────
    op.create_table('battery_cost_curves',
        sa.Column('id',               postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('year',             sa.Integer(), nullable=False),
        sa.Column('chemistry',        sa.String(50)),    # LFP / NMC811 / NCA / LMFP / SolidState / Na-Ion
        sa.Column('cost_usd_per_kwh', sa.Numeric(10, 2)),
        sa.Column('energy_density_wh_per_kg', sa.Numeric(8, 2)),
        sa.Column('cycle_life',       sa.Integer()),
        sa.Column('calendar_life_yrs',sa.Numeric(5, 1)),
        sa.Column('market_share_pct', sa.Numeric(6, 2)),
        sa.Column('learning_rate_pct',sa.Numeric(6, 2)),
        sa.Column('source_model',     sa.String(100)),
        sa.Column('created_at',       sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_bat_year',      'battery_cost_curves', ['year'])
    op.create_index('idx_bat_chemistry', 'battery_cost_curves', ['chemistry'])

    # ── 5. gigafactory_tracker ────────────────────────────────────────────────
    op.create_table('gigafactory_tracker',
        sa.Column('id',                  postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('factory_name',        sa.String(200), nullable=False),
        sa.Column('operator',            sa.String(200)),
        sa.Column('country_iso',         sa.String(3)),
        sa.Column('country_name',        sa.String(100)),
        sa.Column('region',              sa.String(50)),
        sa.Column('capacity_gwh',        sa.Numeric(10, 1)),
        sa.Column('production_2024_gwh', sa.Numeric(10, 1)),
        sa.Column('chemistry',           sa.String(50)),
        sa.Column('status',              sa.String(30)),    # Operating / Construction / Planned
        sa.Column('start_year',          sa.Integer()),
        sa.Column('capex_bn_usd',        sa.Numeric(8, 2)),
        sa.Column('jobs_created',        sa.Integer()),
        sa.Column('green_power_pct',     sa.Numeric(6, 2)),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_giga_operator', 'gigafactory_tracker', ['operator'])
    op.create_index('idx_giga_country',  'gigafactory_tracker', ['country_iso'])
    op.create_index('idx_giga_status',   'gigafactory_tracker', ['status'])

    # ── 6. ev_market_penetration ──────────────────────────────────────────────
    op.create_table('ev_market_penetration',
        sa.Column('id',                  postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('country_iso',         sa.String(3)),
        sa.Column('country_name',        sa.String(100)),
        sa.Column('year',                sa.Integer()),
        sa.Column('ev_share_pct',        sa.Numeric(6, 2)),
        sa.Column('ev_sales_units',      sa.BigInteger()),
        sa.Column('total_car_sales',     sa.BigInteger()),
        sa.Column('ev_stock_mn',         sa.Numeric(10, 2)),
        sa.Column('charging_points_k',   sa.Numeric(10, 1)),
        sa.Column('policy_score',        sa.Numeric(5, 2)),   # 0-10 policy support
        sa.Column('subsidy_usd_per_ev',  sa.Numeric(8, 0)),
        sa.Column('source',              sa.String(100)),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_ev_country', 'ev_market_penetration', ['country_iso'])
    op.create_index('idx_ev_year',    'ev_market_penetration', ['year'])

    # ── 7. et_commodity_exposure ──────────────────────────────────────────────
    op.create_table('et_commodity_exposure',
        sa.Column('id',                  postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_name',        sa.String(200), nullable=False),
        sa.Column('sector',              sa.String(100)),
        sa.Column('mineral_dependency',  JSONB),   # {Li: 0.4, Co: 0.3, ...}
        sa.Column('revenue_at_risk_pct', sa.Numeric(6, 2)),
        sa.Column('supply_chain_stage',  sa.String(50)),
        sa.Column('hedge_ratio_pct',     sa.Numeric(6, 2)),
        sa.Column('lt_contracts_pct',    sa.Numeric(6, 2)),
        sa.Column('recycled_content_pct',sa.Numeric(6, 2)),
        sa.Column('geopolitical_score',  sa.Numeric(5, 2)),
        sa.Column('transition_risk',     sa.String(20)),
        sa.Column('assessment_date',     sa.Date()),
        sa.Column('org_id',              postgresql.UUID(as_uuid=True)),
        sa.Column('created_at',          sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_et_company',  'et_commodity_exposure', ['company_name'])
    op.create_index('idx_et_sector',   'et_commodity_exposure', ['sector'])
    op.create_index('idx_et_org',      'et_commodity_exposure', ['org_id'])


def downgrade() -> None:
    op.drop_index('idx_et_org',      table_name='et_commodity_exposure')
    op.drop_index('idx_et_sector',   table_name='et_commodity_exposure')
    op.drop_index('idx_et_company',  table_name='et_commodity_exposure')
    op.drop_table('et_commodity_exposure')

    op.drop_index('idx_ev_year',    table_name='ev_market_penetration')
    op.drop_index('idx_ev_country', table_name='ev_market_penetration')
    op.drop_table('ev_market_penetration')

    op.drop_index('idx_giga_status',   table_name='gigafactory_tracker')
    op.drop_index('idx_giga_country',  table_name='gigafactory_tracker')
    op.drop_index('idx_giga_operator', table_name='gigafactory_tracker')
    op.drop_table('gigafactory_tracker')

    op.drop_index('idx_bat_chemistry', table_name='battery_cost_curves')
    op.drop_index('idx_bat_year',      table_name='battery_cost_curves')
    op.drop_table('battery_cost_curves')

    op.drop_index('idx_mine_country', table_name='mine_pipeline')
    op.drop_index('idx_mine_stage',   table_name='mine_pipeline')
    op.drop_index('idx_mine_mineral', table_name='mine_pipeline')
    op.drop_table('mine_pipeline')

    op.drop_index('idx_mcs_year',    table_name='mineral_country_supply')
    op.drop_index('idx_mcs_country', table_name='mineral_country_supply')
    op.drop_index('idx_mcs_mineral', table_name='mineral_country_supply')
    op.drop_table('mineral_country_supply')

    op.drop_index('idx_crit_min_price_date', table_name='critical_minerals')
    op.drop_index('idx_crit_min_category',   table_name='critical_minerals')
    op.drop_index('idx_crit_min_mineral',    table_name='critical_minerals')
    op.drop_table('critical_minerals')
