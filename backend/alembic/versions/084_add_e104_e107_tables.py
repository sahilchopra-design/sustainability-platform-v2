"""Add E104–E107 tables: Physical Risk Pricing, ESG Data Quality, Climate Derivatives, Sovereign SWF

Revision ID: 084
Revises: 083
Create Date: 2026-03-18
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '084'
down_revision = '083'
branch_labels = None
depends_on = None


def upgrade():
    # E104 — Physical Climate Risk Pricing Engine
    # NatCat perils × NGFS damage functions × acute/chronic monetization
    op.create_table('physical_risk_pricing_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_id', sa.String(100)),
        sa.Column('entity_name', sa.String(255)),
        sa.Column('asset_class', sa.String(50)),          # property, infrastructure, agriculture, energy
        sa.Column('country_iso', sa.String(3)),
        sa.Column('latitude', sa.Numeric(9, 6)),
        sa.Column('longitude', sa.Numeric(9, 6)),
        sa.Column('asset_value_usd', sa.Numeric(18, 2)),
        sa.Column('ngfs_scenario', sa.String(50)),         # orderly, disorderly, hot_house
        sa.Column('time_horizon', sa.String(20)),          # 2030, 2040, 2050
        # Acute peril scores (0-1)
        sa.Column('flood_risk_score', sa.Numeric(5, 4)),
        sa.Column('cyclone_risk_score', sa.Numeric(5, 4)),
        sa.Column('wildfire_risk_score', sa.Numeric(5, 4)),
        sa.Column('earthquake_risk_score', sa.Numeric(5, 4)),
        sa.Column('heatwave_risk_score', sa.Numeric(5, 4)),
        # Chronic risk scores
        sa.Column('sea_level_rise_score', sa.Numeric(5, 4)),
        sa.Column('drought_risk_score', sa.Numeric(5, 4)),
        sa.Column('precipitation_change_score', sa.Numeric(5, 4)),
        # Financial impact
        sa.Column('expected_annual_loss_usd', sa.Numeric(18, 2)),
        sa.Column('probable_max_loss_100yr_usd', sa.Numeric(18, 2)),
        sa.Column('stranding_probability', sa.Numeric(5, 4)),
        sa.Column('insurance_protection_gap_pct', sa.Numeric(5, 2)),
        sa.Column('climate_var_95_usd', sa.Numeric(18, 2)),
        sa.Column('physical_risk_premium_bps', sa.Numeric(8, 2)),
        sa.Column('composite_physical_risk_score', sa.Numeric(5, 4)),
        sa.Column('risk_tier', sa.String(20)),              # low, medium, high, very_high, extreme
        sa.Column('damage_function_source', sa.String(100)), # RMS, AIR, Verisk, NGFS, JBA
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('natcat_loss_estimates',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('assessment_id', sa.Integer, sa.ForeignKey('physical_risk_pricing_assessments.id')),
        sa.Column('peril', sa.String(50)),                 # flood, cyclone, wildfire, earthquake, heatwave, drought
        sa.Column('return_period_years', sa.Integer),      # 10, 25, 50, 100, 200, 500
        sa.Column('loss_usd', sa.Numeric(18, 2)),
        sa.Column('loss_pct_of_value', sa.Numeric(5, 2)),
        sa.Column('insured_loss_usd', sa.Numeric(18, 2)),
        sa.Column('uninsured_loss_usd', sa.Numeric(18, 2)),
        sa.Column('damage_function_type', sa.String(50)),  # depth-damage, fragility, vulnerability
        sa.Column('climate_adjustment_factor', sa.Numeric(5, 3)),
        sa.Column('confidence_interval_low', sa.Numeric(18, 2)),
        sa.Column('confidence_interval_high', sa.Numeric(18, 2)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    # E105 — ESG Data Quality & Assurance Engine
    # BCBS 239 (14 principles) + CDP/MSCI/Bloomberg gaps + DQS + ISAE3000
    op.create_table('esg_data_quality_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_id', sa.String(100)),
        sa.Column('entity_name', sa.String(255)),
        sa.Column('reporting_year', sa.Integer),
        sa.Column('framework', sa.String(50)),             # CSRD, IFRS_S1, SEC, TCFD, CDP, GRI
        # BCBS 239 principle scores (0-100 each)
        sa.Column('bcbs239_accuracy_score', sa.Numeric(5, 2)),
        sa.Column('bcbs239_completeness_score', sa.Numeric(5, 2)),
        sa.Column('bcbs239_consistency_score', sa.Numeric(5, 2)),
        sa.Column('bcbs239_timeliness_score', sa.Numeric(5, 2)),
        sa.Column('bcbs239_governance_score', sa.Numeric(5, 2)),
        sa.Column('bcbs239_overall_score', sa.Numeric(5, 2)),
        # Data provider gaps
        sa.Column('cdp_coverage_pct', sa.Numeric(5, 2)),
        sa.Column('msci_coverage_pct', sa.Numeric(5, 2)),
        sa.Column('bloomberg_coverage_pct', sa.Numeric(5, 2)),
        sa.Column('refinitiv_coverage_pct', sa.Numeric(5, 2)),
        sa.Column('iss_coverage_pct', sa.Numeric(5, 2)),
        # DQS scoring
        sa.Column('scope1_dqs', sa.Integer),               # 1-5
        sa.Column('scope2_dqs', sa.Integer),
        sa.Column('scope3_dqs', sa.Integer),
        sa.Column('weighted_dqs', sa.Numeric(4, 2)),
        # Assurance
        sa.Column('assurance_standard', sa.String(50)),    # ISAE3000, ISSA5000, AA1000AS
        sa.Column('assurance_level', sa.String(30)),       # none, limited, reasonable
        sa.Column('assurance_provider', sa.String(100)),
        sa.Column('assurance_scope', sa.Text),
        sa.Column('material_misstatement_risk', sa.String(20)), # low, medium, high
        # AI imputation
        sa.Column('ai_imputed_fields', sa.Integer),
        sa.Column('imputation_confidence', sa.Numeric(5, 2)),
        sa.Column('overall_data_quality_tier', sa.String(20)), # platinum, gold, silver, bronze
        sa.Column('gaps_identified', JSONB),
        sa.Column('remediation_plan', JSONB),
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('data_verification_logs',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('assessment_id', sa.Integer, sa.ForeignKey('esg_data_quality_assessments.id')),
        sa.Column('data_field', sa.String(200)),
        sa.Column('reported_value', sa.Text),
        sa.Column('verified_value', sa.Text),
        sa.Column('variance_pct', sa.Numeric(8, 2)),
        sa.Column('verification_source', sa.String(100)),
        sa.Column('bcbs239_principle', sa.String(50)),     # which of the 14 principles
        sa.Column('dqs_tier', sa.Integer),
        sa.Column('flag_type', sa.String(30)),             # error, warning, imputed, estimated
        sa.Column('flag_description', sa.Text),
        sa.Column('resolved', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    # E106 — Climate-Linked Structured Products Engine
    # Weather derivatives + parametric cat bonds + EUA options + carbon spread options
    op.create_table('climate_derivatives_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('product_type', sa.String(50)),          # weather_derivative, cat_bond, eua_option, carbon_spread, parametric
        sa.Column('underlying', sa.String(100)),           # HDD, CDD, rainfall, EUA, temperature_index
        sa.Column('notional_usd', sa.Numeric(18, 2)),
        sa.Column('tenor_years', sa.Numeric(4, 1)),
        sa.Column('strike_value', sa.Numeric(12, 4)),
        sa.Column('current_spot', sa.Numeric(12, 4)),
        # Pricing outputs
        sa.Column('fair_value_usd', sa.Numeric(18, 2)),
        sa.Column('delta', sa.Numeric(8, 6)),
        sa.Column('gamma', sa.Numeric(8, 6)),
        sa.Column('vega', sa.Numeric(8, 6)),
        sa.Column('theta', sa.Numeric(8, 6)),
        sa.Column('implied_volatility', sa.Numeric(6, 4)),
        sa.Column('risk_premium_pct', sa.Numeric(6, 4)),
        # Cat bond specific
        sa.Column('attachment_point', sa.Numeric(18, 2)),
        sa.Column('exhaustion_point', sa.Numeric(18, 2)),
        sa.Column('expected_loss_pct', sa.Numeric(6, 4)),
        sa.Column('spread_bps', sa.Numeric(8, 2)),
        sa.Column('catastrophe_peril', sa.String(50)),
        sa.Column('trigger_type', sa.String(30)),          # indemnity, parametric, index, modelled_loss
        # Documentation
        sa.Column('isda_confirmation_type', sa.String(50)), # CSO, 2002_ISDA, 2022_ISDA
        sa.Column('ccp_eligible', sa.Boolean),
        sa.Column('clearing_venue', sa.String(50)),        # ICE, CME, LCH
        sa.Column('regulatory_classification', sa.String(50)), # MiFID_II, EMIR, CFTC
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('structured_product_registry',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('product_id', sa.String(50), unique=True),
        sa.Column('product_name', sa.String(255)),
        sa.Column('product_type', sa.String(50)),
        sa.Column('issuer', sa.String(255)),
        sa.Column('issuance_date', sa.Date),
        sa.Column('maturity_date', sa.Date),
        sa.Column('notional_usd', sa.Numeric(18, 2)),
        sa.Column('coupon_pct', sa.Numeric(5, 3)),
        sa.Column('climate_trigger_description', sa.Text),
        sa.Column('underlying_climate_index', sa.String(100)),
        sa.Column('rating', sa.String(10)),
        sa.Column('esg_classification', sa.String(50)),
        sa.Column('isin', sa.String(20)),
        sa.Column('metadata', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    # E107 — Sustainable Sovereign & SWF Engine
    # Norwegian GPFG exclusion model + IWG-SWF 2023 + Paris-aligned sovereign tilt
    op.create_table('sovereign_swf_assessments',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('fund_name', sa.String(255)),
        sa.Column('fund_type', sa.String(50)),             # sovereign_wealth, pension, central_bank, reserve
        sa.Column('country_iso', sa.String(3)),
        sa.Column('aum_usd_bn', sa.Numeric(12, 2)),
        sa.Column('iwg_swf_score', sa.Numeric(5, 2)),      # IWG-SWF Santiago Principles (24 principles)
        # ESG integration
        sa.Column('esg_policy_score', sa.Numeric(5, 2)),
        sa.Column('exclusion_policy_score', sa.Numeric(5, 2)),
        sa.Column('engagement_policy_score', sa.Numeric(5, 2)),
        sa.Column('climate_integration_score', sa.Numeric(5, 2)),
        # Exclusions (GPFG model)
        sa.Column('fossil_fuel_exclusions', sa.Integer),   # number of excluded companies
        sa.Column('conduct_exclusions', sa.Integer),
        sa.Column('weapons_exclusions', sa.Integer),
        sa.Column('exclusion_aum_impact_pct', sa.Numeric(5, 2)),
        # Climate alignment
        sa.Column('portfolio_temperature_c', sa.Numeric(4, 2)),
        sa.Column('fossil_fuel_exposure_pct', sa.Numeric(5, 2)),
        sa.Column('green_investment_pct', sa.Numeric(5, 2)),
        sa.Column('paris_alignment_score', sa.Numeric(5, 2)),
        sa.Column('ngfs_scenario_used', sa.String(50)),
        # Divestment
        sa.Column('divestment_commitment', sa.Boolean),
        sa.Column('divestment_target_year', sa.Integer),
        sa.Column('divestment_progress_pct', sa.Numeric(5, 2)),
        sa.Column('intergenerational_equity_score', sa.Numeric(5, 2)),
        sa.Column('sdg_alignment_score', sa.Numeric(5, 2)),
        sa.Column('overall_esg_tier', sa.String(20)),       # leader, advanced, developing, laggard
        sa.Column('full_results', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table('fossil_fuel_divestment_tracker',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('assessment_id', sa.Integer, sa.ForeignKey('sovereign_swf_assessments.id')),
        sa.Column('company_name', sa.String(255)),
        sa.Column('isin', sa.String(20)),
        sa.Column('sector', sa.String(100)),
        sa.Column('sub_sector', sa.String(100)),           # coal_mining, oil_sands, thermal_power, etc.
        sa.Column('holding_value_usd', sa.Numeric(18, 2)),
        sa.Column('holding_pct_portfolio', sa.Numeric(6, 4)),
        sa.Column('exclusion_criterion', sa.String(100)),  # GPFG_coal, conduct, weapons, own_criteria
        sa.Column('exclusion_status', sa.String(20)),      # excluded, under_observation, cleared
        sa.Column('carbon_intensity', sa.Numeric(10, 2)),  # tCO2/MUSD revenue
        sa.Column('stranded_asset_risk', sa.String(20)),
        sa.Column('divestment_priority', sa.Integer),      # 1=highest
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('fossil_fuel_divestment_tracker')
    op.drop_table('sovereign_swf_assessments')
    op.drop_table('structured_product_registry')
    op.drop_table('climate_derivatives_assessments')
    op.drop_table('data_verification_logs')
    op.drop_table('esg_data_quality_assessments')
    op.drop_table('natcat_loss_estimates')
    op.drop_table('physical_risk_pricing_assessments')
