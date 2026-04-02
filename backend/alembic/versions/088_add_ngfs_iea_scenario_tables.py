"""Add NGFS/IEA/IPCC climate scenario tables — EP-BJ integration

Revision ID: 088
Revises: 087
Create Date: 2026-04-02

Sources: NGFS Phase 5, IEA WEO 2024, IPCC AR6, IRENA 1.5°C, GFANZ
Ref: Kimi_Agent_NGFS IEA Scenario Integration / SCENARIO_INTEGRATION_EXECUTIVE_SUMMARY.md
     PRACTICAL_INTEGRATION_GUIDE.md, climate_risk_platform/README.md
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
import uuid

revision = '088'
down_revision = '087'
branch_labels = None
depends_on = None


def upgrade():
    # ── 1. scenarios ─────────────────────────────────────────────────────────
    # Master catalogue: NGFS, IEA, IPCC AR6, IRENA, GFANZ scenarios
    op.create_table('climate_scenarios',
        sa.Column('id',                  sa.Integer,      primary_key=True, autoincrement=True),
        sa.Column('scenario_code',       sa.String(30),   nullable=False, unique=True),  # e.g. NGFS_NZ2050
        sa.Column('scenario_name',       sa.String(120),  nullable=False),
        sa.Column('provider',            sa.String(50),   nullable=False),  # NGFS, IEA, IPCC, IRENA, GFANZ
        sa.Column('provider_version',    sa.String(20)),                    # Phase 5, WEO 2024, AR6
        sa.Column('release_date',        sa.Date),
        sa.Column('temperature_outcome', sa.Numeric(3, 1)),                 # e.g. 1.5, 2.0, 2.7
        sa.Column('temperature_label',   sa.String(20)),                    # 1.5°C, Well-below 2°C, NDC, etc.
        sa.Column('ipcc_category',       sa.String(5)),                     # C1–C7 for IPCC scenarios
        sa.Column('carbon_price_2030',   sa.Numeric(10, 2)),                # USD/t CO₂
        sa.Column('carbon_price_2050',   sa.Numeric(10, 2)),                # USD/t CO₂
        sa.Column('orderly',             sa.Boolean, default=True),         # orderly vs disorderly transition
        sa.Column('physical_risk_level', sa.String(20)),                    # low, medium, high, very_high
        sa.Column('transition_risk_level', sa.String(20)),                  # low, medium, high, very_high
        sa.Column('description',         sa.Text),
        sa.Column('ngfs_damage_fn',      sa.Boolean, default=False),        # uses Kotz 2024 4x damage function
        sa.Column('metadata',            JSONB),
        sa.Column('created_at',          sa.DateTime, server_default=sa.func.now()),
        sa.Column('org_id',              sa.String(36)),                    # multi-tenancy — ref organisations(id)
    )
    op.create_index('ix_climate_scenarios_provider', 'climate_scenarios', ['provider'])
    op.create_index('ix_climate_scenarios_temp',     'climate_scenarios', ['temperature_outcome'])

    # ── 2. scenario_variables ─────────────────────────────────────────────────
    # Time-series variable values per scenario (500+ variables, 2020–2100)
    op.create_table('climate_scenario_variables',
        sa.Column('id',                 sa.Integer,     primary_key=True, autoincrement=True),
        sa.Column('scenario_id',        sa.Integer,     sa.ForeignKey('climate_scenarios.id', ondelete='CASCADE'), nullable=False),
        sa.Column('variable_name',      sa.String(100), nullable=False),   # e.g. carbon_price, co2_emissions_gt
        sa.Column('variable_category',  sa.String(50)),                    # emissions, energy, macro, policy
        sa.Column('sector',             sa.String(50)),                    # power, steel, transport, buildings, all
        sa.Column('region',             sa.String(50), default='Global'),
        sa.Column('unit',               sa.String(30)),                    # USD/tCO₂, GtCO₂, EJ, GW, %
        sa.Column('year',               sa.Integer,     nullable=False),
        sa.Column('value',              sa.Numeric(22, 6), nullable=False),
        sa.Column('confidence_lower',   sa.Numeric(22, 6)),                # 5th percentile
        sa.Column('confidence_upper',   sa.Numeric(22, 6)),                # 95th percentile
        sa.Column('source_file',        sa.String(200)),                   # original NGFS/IEA data file
        sa.Column('created_at',         sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index('ix_csv_scenario_year', 'climate_scenario_variables', ['scenario_id', 'year'])
    op.create_index('ix_csv_variable',      'climate_scenario_variables', ['variable_name'])

    # ── 3. scenario_ensemble_weights ─────────────────────────────────────────
    # Bayesian Model Averaging weights; 6 weighting methods from spec
    op.create_table('scenario_ensemble_weights',
        sa.Column('id',               sa.Integer,     primary_key=True, autoincrement=True),
        sa.Column('ensemble_name',    sa.String(100), nullable=False),
        sa.Column('scenario_id',      sa.Integer,     sa.ForeignKey('climate_scenarios.id', ondelete='CASCADE')),
        sa.Column('weight_method',    sa.String(30),  nullable=False),  # equal, bma, temperature, skill, expert, performance
        sa.Column('weight',           sa.Numeric(8, 6), nullable=False),  # sums to 1 per ensemble_name
        sa.Column('target_temp',      sa.Numeric(3, 1)),                  # conditioning temperature
        sa.Column('kernel_bandwidth', sa.Numeric(6, 4)),                  # Gaussian kernel σ
        sa.Column('created_at',       sa.DateTime, server_default=sa.func.now()),
        sa.Column('org_id',           sa.String(36)),
    )
    op.create_index('ix_sew_ensemble', 'scenario_ensemble_weights', ['ensemble_name'])

    # ── 4. asset_climate_risk ─────────────────────────────────────────────────
    # Physical and transition risk scores per asset × scenario
    op.create_table('asset_climate_risk',
        sa.Column('id',                    sa.Integer,    primary_key=True, autoincrement=True),
        sa.Column('asset_id',              sa.String(100), nullable=False),
        sa.Column('asset_name',            sa.String(255)),
        sa.Column('asset_type',            sa.String(50)),  # real_estate, equity, bond, loan, infrastructure
        sa.Column('sector',                sa.String(80)),
        sa.Column('country_iso',           sa.String(3)),
        sa.Column('latitude',              sa.Numeric(9, 6)),
        sa.Column('longitude',             sa.Numeric(9, 6)),
        sa.Column('scenario_id',           sa.Integer, sa.ForeignKey('climate_scenarios.id')),
        sa.Column('calculation_date',      sa.Date, nullable=False),
        sa.Column('time_horizon_years',    sa.Integer, default=10),        # 10, 20, 30 year horizons
        # Physical risk scores (0–100)
        sa.Column('physical_risk_score',   sa.Numeric(5, 2)),
        sa.Column('flood_risk',            sa.Numeric(5, 2)),
        sa.Column('wildfire_risk',         sa.Numeric(5, 2)),
        sa.Column('hurricane_risk',        sa.Numeric(5, 2)),
        sa.Column('earthquake_risk',       sa.Numeric(5, 2)),
        sa.Column('heat_stress_risk',      sa.Numeric(5, 2)),
        sa.Column('drought_risk',          sa.Numeric(5, 2)),
        sa.Column('sea_level_rise_risk',   sa.Numeric(5, 2)),
        # Financial impact
        sa.Column('expected_annual_loss',  sa.Numeric(18, 2)),             # EAL USD
        sa.Column('probable_max_loss_250', sa.Numeric(18, 2)),             # PML 250-year USD
        sa.Column('var_95',                sa.Numeric(18, 2)),             # 95th percentile loss
        sa.Column('var_99',                sa.Numeric(18, 2)),             # 99th percentile loss
        # Transition risk
        sa.Column('transition_risk_score', sa.Numeric(5, 2)),
        sa.Column('carbon_cost_2030',      sa.Numeric(18, 2)),             # USD
        sa.Column('carbon_cost_2050',      sa.Numeric(18, 2)),             # USD
        sa.Column('stranded_asset_value',  sa.Numeric(18, 2)),             # USD at risk of stranding
        sa.Column('temperature_alignment', sa.Numeric(3, 1)),              # implied °C
        # ML model outputs
        sa.Column('xgboost_damage_p50',    sa.Numeric(18, 2)),
        sa.Column('xgboost_damage_p05',    sa.Numeric(18, 2)),
        sa.Column('xgboost_damage_p95',    sa.Numeric(18, 2)),
        sa.Column('model_version',         sa.String(20)),
        sa.Column('metadata',              JSONB),
        sa.Column('created_at',            sa.DateTime, server_default=sa.func.now()),
        sa.Column('org_id',                sa.String(36)),
    )
    op.create_index('ix_acr_asset_scenario', 'asset_climate_risk', ['asset_id', 'scenario_id'])
    op.create_index('ix_acr_calc_date',      'asset_climate_risk', ['calculation_date'])

    # ── 5. climate_hazard_sector_matrix ──────────────────────────────────────
    # Sector × hazard exposure weights (used for transition/physical crosswalk)
    op.create_table('climate_hazard_sector_matrix',
        sa.Column('id',              sa.Integer,  primary_key=True, autoincrement=True),
        sa.Column('sector',          sa.String(80), nullable=False),
        sa.Column('hazard',          sa.String(50), nullable=False),  # flood, wildfire, heat, drought, carbon_price, policy
        sa.Column('risk_type',       sa.String(20), nullable=False),  # physical, transition
        sa.Column('exposure_weight', sa.Numeric(5, 4), nullable=False),  # 0–1 relative exposure
        sa.Column('vulnerability',   sa.Numeric(5, 4)),                  # depth-damage coefficient
        sa.Column('scenario_code',   sa.String(30)),                     # null = all scenarios
        sa.Column('source',          sa.String(100)),                    # HAZUS, JRC, CRREM, MPP, TPI
        sa.Column('updated_at',      sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index('ix_chsm_sector_hazard', 'climate_hazard_sector_matrix', ['sector', 'hazard'])

    # ── 6. portfolio_climate_alignment ───────────────────────────────────────
    # Portfolio-level aggregation: WACI, temperature score, ECL uplift
    op.create_table('portfolio_climate_alignment',
        sa.Column('id',                    sa.Integer,     primary_key=True, autoincrement=True),
        sa.Column('portfolio_id',          sa.String(100), nullable=False),
        sa.Column('portfolio_name',        sa.String(255)),
        sa.Column('scenario_id',           sa.Integer, sa.ForeignKey('climate_scenarios.id')),
        sa.Column('calculation_date',      sa.Date, nullable=False),
        # Temperature alignment
        sa.Column('implied_temperature',   sa.Numeric(3, 1)),   # portfolio-level °C
        sa.Column('waci',                  sa.Numeric(12, 4)),  # tCO₂e / $M EVIC
        sa.Column('financed_emissions_mt', sa.Numeric(14, 4)),  # MtCO₂e
        # Physical risk aggregates
        sa.Column('portfolio_physical_risk', sa.Numeric(5, 2)),
        sa.Column('portfolio_eal_usd',       sa.Numeric(18, 2)),
        # Transition risk aggregates
        sa.Column('portfolio_transition_risk', sa.Numeric(5, 2)),
        sa.Column('total_carbon_cost_2030',    sa.Numeric(18, 2)),
        sa.Column('total_carbon_cost_2050',    sa.Numeric(18, 2)),
        sa.Column('stranded_exposure_pct',     sa.Numeric(6, 3)),   # % of portfolio
        # Credit risk
        sa.Column('ecl_baseline_usd',     sa.Numeric(18, 2)),
        sa.Column('ecl_climate_adj_usd',  sa.Numeric(18, 2)),
        sa.Column('ecl_uplift_pct',       sa.Numeric(6, 3)),        # (adjusted - baseline) / baseline
        sa.Column('stage2_migration_pct', sa.Numeric(6, 3)),        # % of book migrating to Stage 2
        sa.Column('stage3_migration_pct', sa.Numeric(6, 3)),        # % of book migrating to Stage 3
        # Basel IV
        sa.Column('rwa_baseline_usd',     sa.Numeric(18, 2)),
        sa.Column('rwa_climate_adj_usd',  sa.Numeric(18, 2)),
        sa.Column('capital_uplift_usd',   sa.Numeric(18, 2)),
        sa.Column('metadata',             JSONB),
        sa.Column('created_at',           sa.DateTime, server_default=sa.func.now()),
        sa.Column('org_id',               sa.String(36)),
    )
    op.create_index('ix_pca_portfolio_scenario', 'portfolio_climate_alignment', ['portfolio_id', 'scenario_id'])

    # ── 7. climate_credit_risk ────────────────────────────────────────────────
    # Obligor-level climate-adjusted PD/LGD/ECL per scenario (IFRS 9 / Basel IV)
    op.create_table('climate_credit_risk',
        sa.Column('id',                   sa.Integer,     primary_key=True, autoincrement=True),
        sa.Column('obligor_id',           sa.String(100), nullable=False),
        sa.Column('obligor_name',         sa.String(255)),
        sa.Column('sector',               sa.String(80)),
        sa.Column('country_iso',          sa.String(3)),
        sa.Column('scenario_id',          sa.Integer, sa.ForeignKey('climate_scenarios.id')),
        sa.Column('calculation_date',     sa.Date, nullable=False),
        sa.Column('time_horizon',         sa.String(10), default='12M'),   # 12M, LT (lifetime)
        # Baseline credit metrics
        sa.Column('pd_baseline',          sa.Numeric(8, 6), nullable=False),
        sa.Column('lgd_baseline',         sa.Numeric(6, 4), nullable=False),
        sa.Column('ead_usd',              sa.Numeric(18, 2), nullable=False),
        sa.Column('ecl_baseline_usd',     sa.Numeric(18, 2)),
        # Climate-adjusted metrics
        sa.Column('pd_climate_adj',       sa.Numeric(8, 6)),
        sa.Column('lgd_climate_adj',      sa.Numeric(6, 4)),
        sa.Column('ecl_climate_adj_usd',  sa.Numeric(18, 2)),
        sa.Column('ecl_uplift_usd',       sa.Numeric(18, 2)),
        sa.Column('ecl_uplift_pct',       sa.Numeric(7, 4)),              # %
        # IFRS 9 staging
        sa.Column('stage_baseline',       sa.SmallInteger),               # 1, 2, 3
        sa.Column('stage_climate_adj',    sa.SmallInteger),               # 1, 2, 3
        sa.Column('stage_migration',      sa.Boolean, default=False),     # has stage changed?
        sa.Column('sicr_z_score_adj',     sa.Numeric(6, 3)),              # climate-adjusted SICR z-score
        # Merton model parameters
        sa.Column('merton_asset_val',     sa.Numeric(18, 2)),
        sa.Column('merton_asset_vol',     sa.Numeric(8, 6)),
        sa.Column('merton_dd',            sa.Numeric(8, 4)),              # distance to default
        # Physical + transition drivers
        sa.Column('physical_risk_score',  sa.Numeric(5, 2)),
        sa.Column('transition_risk_score', sa.Numeric(5, 2)),
        sa.Column('carbon_cost_adj',      sa.Numeric(18, 2)),             # USD carbon cost impact
        sa.Column('stranded_asset_adj',   sa.Numeric(18, 2)),             # USD stranded value
        sa.Column('metadata',             JSONB),
        sa.Column('created_at',           sa.DateTime, server_default=sa.func.now()),
        sa.Column('org_id',               sa.String(36)),
    )
    op.create_index('ix_ccr_obligor_scenario', 'climate_credit_risk', ['obligor_id', 'scenario_id'])
    op.create_index('ix_ccr_calc_date',        'climate_credit_risk', ['calculation_date'])

    # ── 8. intermodule_climate_links ─────────────────────────────────────────
    # Registry: which platform modules consume NGFS/IEA scenario data and how
    op.create_table('intermodule_climate_links',
        sa.Column('id',               sa.Integer,     primary_key=True, autoincrement=True),
        sa.Column('source_module',    sa.String(50),  nullable=False),  # ngfs_iea_scenario
        sa.Column('target_module',    sa.String(50),  nullable=False),  # portfolio_manager, sbti_registry, etc.
        sa.Column('target_ep_code',   sa.String(20),  nullable=False),  # EP-F1, EP-G2, EP-AL1 …
        sa.Column('link_type',        sa.String(50),  nullable=False),  # scenario_feed, ecl_uplift, pd_adjustment, etc.
        sa.Column('variables_passed', JSONB),                           # list of variable names
        sa.Column('direction',        sa.String(10),  default='output'),# output = scenario → target; input = target → scenario
        sa.Column('active',           sa.Boolean,     default=True),
        sa.Column('description',      sa.Text),
        sa.Column('created_at',       sa.DateTime,    server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('intermodule_climate_links')
    op.drop_table('climate_credit_risk')
    op.drop_table('portfolio_climate_alignment')
    op.drop_table('climate_hazard_sector_matrix')
    op.drop_table('asset_climate_risk')
    op.drop_table('scenario_ensemble_weights')
    op.drop_table('climate_scenario_variables')
    op.drop_table('climate_scenarios')
