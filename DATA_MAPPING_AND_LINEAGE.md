# Data Mapping & Data Lineage Documentation
**A2 Intelligence — Climate Risk Analytics Platform**
*AA Impact Inc. | Generated: 2026-03-03*

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Domain Map](#2-data-domain-map)
3. [Complete Table Inventory](#3-complete-table-inventory)
4. [API Endpoint → Table Mapping](#4-api-endpoint--table-mapping)
5. [Frontend Page → API → Table Lineage](#5-frontend-page--api--table-lineage)
6. [Service Layer Data Flows](#6-service-layer-data-flows)
7. [Cross-Module Data Dependencies](#7-cross-module-data-dependencies)
8. [Data Ingestion Flows](#8-data-ingestion-flows)
9. [State Management & Client-Side Data](#9-state-management--client-side-data)
10. [External Data Sources](#10-external-data-sources)
11. [Known Gaps & Architectural Constraints](#11-known-gaps--architectural-constraints)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BROWSER (React 19 + CRACO, port 4000)                                  │
│  ┌─────────────────┐  ┌────────────────┐  ┌──────────────────────────┐ │
│  │ Zustand Stores  │  │ Redux (carbon) │  │ React Query cache        │ │
│  └────────┬────────┘  └───────┬────────┘  └────────────┬─────────────┘ │
│           └──────────────────┴──────────────────────────┘              │
│                              │ HTTP / Bearer token                      │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │ CRACO proxy /api → :8001
┌──────────────────────────────▼──────────────────────────────────────────┐
│  FASTAPI BACKEND (Python 3.12, port 8001)                               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  28 API Routers  →  40+ Service / Calculation Engines              │ │
│  └──────────────────────────────┬─────────────────────────────────────┘ │
│                                 │ SQLAlchemy async                      │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│  SUPABASE POSTGRESQL                                                    │
│  17 Alembic migrations │ 80+ tables │ 10 data domains                  │
│  UUID PKs │ JSONB semi-structured │ FK cascade delete                   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Runtime Data Paths:**
- All client API calls use `Authorization: Bearer {session_token}` stored in `localStorage`
- Session tokens are stored in `user_sessions_pg`; validated on every request via `/api/v1/auth/me`
- CRACO webpack proxy forwards `/api/*` from port 4000 → port 8001 (avoids CORS in dev)
- CORS is open (`allow_origins=["*"]`) — all origins accepted in the FastAPI middleware

---

## 2. Data Domain Map

The database is organised into 10 logical domains, each corresponding to one or more Alembic migrations:

| Domain | Migration(s) | Core Tables | Frontend Route |
|--------|-------------|-------------|----------------|
| **Core Portfolio** | Baseline, 005 | `portfolios_pg`, `assets_pg`, `analysis_runs_pg`, `scenario_results`, `scenario_series` | `/`, `/portfolios`, `/analysis` |
| **CBAM** | 001 | `cbam_*` (8 tables) | `/regulatory` |
| **Stranded Assets** | 002 | `fossil_fuel_reserve`, `power_plant`, `infrastructure_asset`, `stranded_asset_calculation`, `technology_disruption_metric`, `energy_transition_pathway` | `/stranded-assets` |
| **Nature Risk** | 003 | `nature_risk_*` (7 tables), `ecosystem_dependency`, `spatial_asset_mapping`, `biodiversity_metric`, `water_risk_assessment`, `external_data_cache` | `/nature-risk` |
| **Real Estate** | 004, 010 | `properties`, `valuations`, `comparable_sales`, `valuation_assets`, `unified_valuations`, `valuation_method_results` | `/real-estate-assessment`, `/valuation` |
| **Portfolio Analytics** | 005 | `portfolio_analytics`, `portfolio_property_holdings`, `portfolio_reports` | `/portfolio-analytics` |
| **Financial Risk (ECL/PCAF)** | 006 | `ecl_assessments`, `ecl_exposures`, `ecl_scenario_results`, `ecl_climate_overlays`, `pcaf_portfolios`, `pcaf_investees`, `pcaf_portfolio_results`, `temperature_scores` | `/financial-risk` |
| **Supply Chain / Scope 3** | 007 | `sc_entities`, `scope3_assessments`, `scope3_activities`, `sbti_targets`, `sbti_trajectories`, `emission_factor_library`, `supply_chain_tiers` | `/supply-chain` |
| **Sector Assessments** | 008 | `data_centre_facilities`, `data_centre_assessments`, `cat_risk_properties`, `cat_risk_assessments`, `cat_risk_climate_scenarios`, `power_plants`, `power_plant_assessments`, `power_plant_trajectories` | `/sector-assessments` |
| **Regulatory** | 009, 011–015, 016 | `regulatory_entities`, `sfdr_pai_disclosures`, `eu_taxonomy_assessments/activities`, `tcfd_assessments`, `csrd_readiness_assessments`, `issb_assessments`, `brsr_disclosures`, `sf_taxonomy_alignments`, `regulatory_action_plans`, `fi_*`, `energy_*`, `csrd_*`, `esrs_*`, `issb_*`, `csrd_report_uploads` | `/regulatory` |
| **Auth** | Baseline | `users_pg`, `user_sessions_pg` | `/login` |

---

## 3. Complete Table Inventory

### 3.1 Auth & Session

| Table | PK | Key Columns | FKs | Notes |
|-------|----|-------------|-----|-------|
| `users_pg` | `user_id` UUID | email (UNIQUE), name, picture, password_hash, created_at | — | Auth users |
| `user_sessions_pg` | `id` UUID | session_token (UNIQUE), user_id, expires_at, created_at | `user_id → users_pg` | Bearer tokens; validated on every API call |

---

### 3.2 Core Portfolio (Baseline + Migration 005)

| Table | PK | Key Columns | FKs |
|-------|----|-------------|-----|
| `portfolios_pg` | `id` UUID | name, description, created_at, updated_at | — |
| `assets_pg` | `id` UUID | portfolio_id, asset_type ENUM, company_name, company_sector ENUM, exposure, market_value, base_pd, base_lgd, rating, maturity_years | `portfolio_id → portfolios_pg` |
| `analysis_runs_pg` | `id` UUID | portfolio_id, portfolio_name, scenarios JSONB, horizons JSONB, results JSONB, status, error_message, created_at, completed_at | `portfolio_id → portfolios_pg` |
| `scenario_series` | `id` INTEGER | year, scenario, model, region, variable, unit, value, source_version | — |
| `scenario_results` | `id` UUID | analysis_run_id, scenario, horizon, expected_loss, expected_loss_pct, risk_adjusted_return, avg_pd_change_pct, rating_migrations JSONB, var_95, concentration_hhi, total_exposure | `analysis_run_id → analysis_runs` |
| `portfolios` | `id` STRING | name, description | — | **Legacy — EMPTY; do not use** |
| `assets` | `id` STRING | portfolio_id, asset_type, company_name, company_sector, exposure... | `portfolio_id → portfolios` | **Legacy — EMPTY** |
| `portfolio_analytics` | `id` UUID | name, description, portfolio_type ENUM, investment_strategy, aum, currency, inception_date, owner_id | — |
| `portfolio_property_holdings` | `id` UUID | portfolio_id, property_id, property_name, acquisition_date, acquisition_cost, current_value, ownership_pct, gresb_score, certifications JSONB, risk_score, is_stranded, years_to_stranding | `portfolio_id → portfolio_analytics` |
| `portfolio_reports` | `id` UUID | portfolio_id, report_type ENUM, report_format, status ENUM, content JSONB, error_message, created_at, completed_at | `portfolio_id → portfolio_analytics` |

---

### 3.3 CBAM (Migration 001)

| Table | PK | Key Columns | FKs |
|-------|----|-------------|-----|
| `cbam_product_category` | `id` UUID | cn_code UNIQUE, hs_code, sector, product_name, default_direct_emissions, default_indirect_emissions, default_total_emissions | — |
| `cbam_supplier` | `id` UUID | counterparty_id, supplier_name, country_code, verification_status, has_domestic_carbon_price, domestic_carbon_price, risk_score, risk_category | — |
| `cbam_embedded_emissions` | `id` UUID | supplier_id, product_category_id, reporting_year, reporting_quarter, import_volume_tonnes, direct/indirect attributed emissions, specific emissions, is_verified, uses_default_values | `supplier_id → cbam_supplier`, `product_category_id → cbam_product_category` |
| `cbam_cost_projection` | `id` UUID | portfolio_id, holding_id, counterparty_id, projection_date, scenario_id, import_volume_tonnes, embedded_emissions_tco2, eu_ets_price_eur, domestic_carbon_price_eur, net_cbam_cost_eur, cost_as_pct_of_revenue, pd_impact_basis_points | — |
| `cbam_compliance_report` | `id` UUID | portfolio_id, reporting_entity_id, report_year, report_quarter, submission_status, total_embedded_emissions, total_certificate_cost, compliance_status | UNIQUE(reporting_entity_id, report_year, report_quarter) |
| `cbam_country_risk` | `id` UUID | country_code UNIQUE, has_carbon_pricing, carbon_price_eur, grid_emission_factor, overall_risk_score, risk_category | — |
| `cbam_verifier` | `id` UUID | verifier_name, accreditation_body, accreditation_number, country_code, accredited_sectors JSONB | — |
| `cbam_certificate_price` | `id` UUID | price_date, eu_ets_auction_price_eur, cbam_certificate_price_eur, scenario_id, is_projection | UNIQUE(price_date, scenario_id) |

---

### 3.4 Stranded Assets (Migration 002)

| Table | PK | Key Columns | FKs |
|-------|----|-------------|-----|
| `fossil_fuel_reserve` | `id` UUID | counterparty_id, asset_name, latitude, longitude, reserve_type [oil/gas/coal], reserve_category [1P/2P/3P], proven/probable/possible_reserves_mmBOE, breakeven_price_USD, lifting_cost_USD, remaining_capex_USD, carbon_intensity, methane_leakage_rate, production_start_year, expected_depletion_year | — |
| `power_plant` (stranded module) | `id` UUID | counterparty_id, plant_name, technology_type [coal/gas_ccgt/nuclear/wind/solar…], capacity_mw, commissioning_year, original_retirement_year, co2_intensity_tco2_mwh, fixed_om_cost, variable_om_cost, fuel_cost, ppa_expiry_year, ppa_price, repurposing_option, repurposing_cost | — |
| `infrastructure_asset` | `id` UUID | counterparty_id, asset_name, asset_type [pipeline_oil/pipeline_gas/lng_terminal/refinery…], design_capacity, utilisation_rate_pct, remaining_book_value_usd, take_or_pay_exposure_usd, hydrogen_ready, ammonia_ready, ccs_compatible | — |
| `stranded_asset_calculation` | `id` UUID | asset_type, asset_id, scenario_id, target_year, stranded_volume_pct, stranded_value_usd, baseline_npv_usd, scenario_npv_usd, npv_impact_pct, optimal_retirement_year, stranding_risk_score, key_assumptions JSONB, sensitivity_analysis JSONB | UNIQUE(asset_type, asset_id, scenario_id, target_year) |
| `technology_disruption_metric` | `id` UUID | metric_type [ev_sales_share/green_hydrogen_capacity/ccs_capacity…], region, country_code, value, unit, scenario_name [IEA_NZE/IEA_STEPS/NGFS_Orderly], data_source | — |
| `energy_transition_pathway` | `id` UUID | pathway_name, sector [oil/gas/coal/power], region, scenario_id, base_year, target_year, demand_trajectory JSONB, price_trajectory JSONB, capacity_trajectory JSONB, peak_demand_year, net_zero_year, carbon_price_trajectory JSONB | — |

---

### 3.5 Nature Risk (Migration 003)

| Table | PK | Key Columns | FKs |
|-------|----|-------------|-----|
| `nature_risk_assessment` | `id` UUID | portfolio_id, assessment_name, assessment_date, assessment_status, locate_results JSONB, evaluate_results JSONB, assess_results JSONB, prepare_results JSONB, tnfd_alignment_score (0–100) | — |
| `ecosystem_dependency` | `id` UUID | asset_id, counterparty_id, ecosystem_type [tropical_forest/freshwater/marine/grassland/wetland], ecosystem_service [water_purification/pollination/flood_protection/carbon_sequestration], dependency_score (0–1), financial_exposure_usd | UNIQUE(asset_id, ecosystem_type, ecosystem_service) |
| `spatial_asset_mapping` | `id` UUID | asset_id, asset_name, country_code, latitude, longitude, bbox coordinates, area_hectares, ecosystem_type, protected_area_status [iucn_ia/iucn_ii/none], protected_area_overlap_pct, kba_overlap, water_stress_level | — |
| `biodiversity_metric` | `id` UUID | scenario_id, metric_type [msa/bii/species_richness/habitat_integrity/extinction_risk], country_code, latitude, longitude, basin_id, baseline_value, target_value, value, data_source [globio/iucn/unep_wcmc/copernicus] | — |
| `water_risk_assessment` | `id` UUID | asset_id, country_code, basin_id, basin_name, latitude, longitude, baseline_overall_risk (0–5), projected_risk_2030/2040/2050 JSONB, aqueduct_bws_score, risk_category_label [Low/Medium-High/Extremely High], water_risk_exposure_usd | — |
| `nature_scenario` | `id` UUID | name, scenario_type [tnfd_current_trajectory/tnfd_sustainable/ipbes_ssps], gbf_target_alignment JSONB, gbf_alignment_score (0–100), parameters JSONB | — |
| `nature_impact_pathway` | `id` UUID | assessment_id, asset_id, pathway_type [dependency/impact], driver_category [land_use_change/pollution/overexploitation/invasive_species/climate_change], impact_magnitude (0–10), impact_probability (0–1), financial_impact_usd, risk_rating | — |
| `tnfd_disclosure_metric` | `id` UUID | assessment_id, portfolio_id, metric_id [C1.1/C2.1/C3.1…], metric_category [governance/strategy/risk_management/metrics_targets], gbf_target [T1/T2/T3…], metric_value, metric_unit, scope, baseline_year, reporting_year, is_compliant | UNIQUE(assessment_id, metric_id) |
| `external_data_cache` | `id` UUID | data_source [gbif/iucn_red_list/wri_aqueduct/unep_wcmc/copernicus], endpoint, query_params JSONB, response_data JSONB, latitude, longitude, fetched_at, expires_at, is_valid | — |
| `nature_risk_adjustment` | `id` UUID | asset_id, counterparty_id, base_pd, water_risk_multiplier, biodiversity_risk_multiplier, deforestation_risk_multiplier, nature_pd_multiplier, adjusted_pd, scenario_id | — |

---

### 3.6 Real Estate Valuation (Migrations 004 + 010)

| Table | PK | Key Columns | FKs |
|-------|----|-------------|-----|
| `properties` | `id` UUID | property_name, property_type [office/retail/industrial/multifamily/hotel…], address, city, country, latitude, longitude, year_built, gross_floor_area_m2, annual_rental_income, effective_gross_income, noi, cap_rate, discount_rate, vacancy_rate, epc_rating, energy_intensity_kwh_m2 | — |
| `valuations` | `id` UUID | property_id, valuation_date, income_approach_value, cost_approach_value, sales_comparison_value, reconciled_base_value, adjusted_value, value_per_sf, confidence_range_low/high, calculation_inputs JSONB | `property_id → properties` |
| `comparable_sales` | `id` UUID | property_type, address, city, country, latitude, longitude, sale_date, sale_price, size_sf, price_per_sf, year_built, quality_rating, total_adjustment, adjusted_price, data_source, verified | — |
| `valuation_assets` | `id` UUID | asset_reference, asset_name, asset_class [real_estate/infrastructure/energy/natural_capital/agriculture…], asset_sub_class, address, country_iso, latitude, longitude, gross_internal_area_m2, installed_capacity_mw, currency, book_value, acquisition_cost, annual_income, epc_rating, breeam_rating, leed_rating, gresb_score | — |
| `unified_valuations` | `id` UUID | asset_id, asset_class, valuation_date, valuation_purpose, valuation_basis [RICS_Red_Book/IVSC_IVS/USPAP/TEGoVA], primary_method, gross_value, esg_adjustment_total_pct, esg_adjusted_value, physical_risk_discount_pct, transition_risk_discount_pct, stranded_asset_discount_pct, climate_adjusted_value, final_value, value_confidence_pct | `asset_id → valuation_assets` |
| `valuation_method_results` | `id` UUID | valuation_id, method_name, method_value, method_weight, key_assumptions JSONB | `valuation_id → unified_valuations` |
| `esg_adjustments` | `id` UUID | valuation_id, adjustment_type, adjustment_factor_pct, rationale, source_standard | — |
| `climate_valuation_adjustments` | `id` UUID | valuation_id, climate_scenario, horizon_year, physical_risk_impact_pct, transition_risk_impact_pct, stranding_probability | — |

---

### 3.7 Financial Risk — ECL / PCAF (Migration 006)

| Table | PK | Key Columns | FKs |
|-------|----|-------------|-----|
| `ecl_assessments` | `id` UUID | portfolio_id, entity_name, reporting_date, base_currency, pd_model ENUM, lgd_model ENUM, total_ead_gbp, total_ecl_gbp, ecl_rate_bps, stage1/2/3_ead/ecl_gbp, climate_ecl_uplift_gbp, climate_ecl_uplift_pct, sector_breakdown JSONB, geography_breakdown JSONB, status | — |
| `ecl_exposures` | `id` UUID | assessment_id, instrument_id, obligor_name, instrument_type [mortgage/corporate_loan/bond/project_finance…], sector_gics, country_iso, outstanding_balance, ead, residual_maturity_years, ifrs9_stage (1–3), pd_12m, pd_lifetime, pd_climate_adjusted, lgd_downturn, lgd_pit, ecl_12m, ecl_lifetime, physical_risk_score, transition_risk_score, climate_pd_uplift_bps, climate_lgd_uplift_bps | `assessment_id → ecl_assessments` |
| `ecl_scenario_results` | `id` UUID | assessment_id, scenario_name [OPTIMISTIC/BASE/ADVERSE/SEVERE/CLIMATE_DISORDERLY/ORDERLY/HOT_HOUSE], scenario_weight, gdp_growth_pct, unemployment_rate_pct, base_rate_pct, hpi_growth_pct, total_ecl_gbp, stage1/2/3_ecl_gbp, ecl_time_series JSONB | `assessment_id → ecl_assessments` |
| `ecl_climate_overlays` | `id` UUID | assessment_id, climate_scenario [NGFS_NET_ZERO_2050/NGFS_DELAYED_TRANSITION/NGFS_HOT_HOUSE/RCP2.6/RCP4.5/RCP8.5…], horizon_years, physical_pd_uplift_avg_bps, physical_ecl_uplift_gbp, transition_pd_uplift_avg_bps, transition_ecl_uplift_gbp, total_climate_ecl_uplift_gbp, carbon_price_2030_usd, carbon_price_2050_usd | `assessment_id → ecl_assessments` |
| `pcaf_portfolios` | `id` UUID | entity_name, lei, reporting_year, portfolio_type, total_outstanding_gbp, financed_scope1/2/3_tco2e, total_financed_emissions_tco2e, waci, carbon_footprint, portfolio_coverage_pct, pcaf_data_quality_score_avg, portfolio_temperature_c, sfdr_pai_indicators JSONB, target_year, target_reduction_pct | — |
| `pcaf_investees` | `id` UUID | portfolio_id, investee_name, lei, isin, sector_gics, country_iso, outstanding_investment_gbp, enterprise_value_gbp, revenue_gbp, attribution_factor, attribution_method [evic/revenue/balance_sheet…], scope1/2/3 direct + financed tco2e, revenue_intensity, pcaf_dq_scope1/2/3 (1–5), emissions_data_source [reported/estimated_revenue/estimated_eeio], implied_temperature_c, sbti_committed, net_zero_target_year | `portfolio_id → pcaf_portfolios` |
| `pcaf_portfolio_results` | `id` UUID | portfolio_id, calculation_date, total_financed_scope1/2/3_tco2e, waci, carbon_footprint, portfolio_coverage_pct, weighted_avg_dq, portfolio_temperature_c, aligned_1_5c_pct, aligned_2c_pct, yoy_emissions_change_pct, sector_breakdown JSONB, sfdr_pai_table JSONB | `portfolio_id → pcaf_portfolios` |
| `temperature_scores` | `id` UUID | portfolio_id, assessment_date, methodology [SBTi/PACTA/MSCI_CTI/CDP], scope_coverage, aggregation_method [WATS/TETS/MOTS], portfolio_temperature_c, pct_aligned_1_5c, pct_aligned_2c, sector_temperatures JSONB | `portfolio_id → pcaf_portfolios` |

---

### 3.8 Supply Chain / Scope 3 (Migration 007)

| Table | PK | Key Columns | FKs |
|-------|----|-------------|-----|
| `sc_entities` | `id` UUID | legal_name, trading_name, lei, duns_number, sector_gics, nace_code, country_iso, annual_revenue_gbp, headcount, entity_type ENUM | — |
| `scope3_assessments` | `id` UUID | entity_id, reporting_year, calculation_approach ENUM, scope1_tco2e, scope2_market/location_tco2e, cat1 through cat15 tco2e (all 15 GHG Protocol categories), total_scope3_upstream/downstream_tco2e, data_quality_score_avg (1–5), primary_data_pct, hotspot_summary JSONB, reduction_opportunities JSONB, boundary ENUM, assurance_type | `entity_id → sc_entities` |
| `scope3_activities` | `id` UUID | assessment_id, category_number (1–15), category_label, activity_description, activity_quantity, activity_unit, data_source, supplier_name, supplier_country_iso, emission_factor_value, emission_factor_source [DEFRA/IEA/EPA/ecoinvent/supplier], global_warming_potential [AR4/AR5/AR6], co2e_tco2e, pcaf_dq_score, ghg_protocol_dq_tier | `assessment_id → scope3_assessments` |
| `sbti_targets` | `id` UUID | entity_id, target_type [near_term/long_term/net_zero], sbti_pathway [1.5C_absolute/well_below_2C/2C_sda], sbti_status [committed/submitted/approved/achieved], base_year, near_term_target_year, near_term_reduction_pct, long_term_target_year, long_term_reduction_pct, residual_emissions_tco2e, removal_mechanism, sbti_approval_date, sbti_reference_number | `entity_id → sc_entities` |
| `sbti_trajectories` | `id` UUID | target_id, year, target_emissions_tco2e, scope1/2/3_target_tco2e, actual_emissions_tco2e, is_on_track, deviation_pct, benchmark_1_5c/2c_tco2e, carbon_budget_remaining_tco2e | `target_id → sbti_targets` |
| `emission_factor_library` | `id` UUID | activity_type, activity_sub_type, scope (1/2/3), category_number (1–15), country_iso, region, valid_from/to_year, factor_value, factor_unit, data_quality_tier, source_name [DEFRA/IEA/EPA_eGRID/ecoinvent/IPCC/GHG_Protocol], gwp_basis [AR4/AR5/AR6], transport_mode, is_active | — |
| `supply_chain_tiers` | `id` UUID | buyer_entity_id, supplier_name, supplier_lei, supplier_country_iso, tier (1–3), spend_gbp, spend_pct_of_total, attributed_scope3_tco2e, emissions_data_source, pcaf_dq_score, has_sbti_target, engagement_status [not_engaged/contacted/committed/reporting], high_emission_flag, deforestation_risk, human_rights_risk | `buyer_entity_id → sc_entities` |

---

### 3.9 Sector Assessments (Migration 008)

| Table | PK | Key Columns | FKs |
|-------|----|-------------|-----|
| `data_centre_facilities` | `id` UUID | facility_name, operator_name, facility_type [enterprise/colocation/hyperscale/edge], city, country_iso, latitude, longitude, grid_region, total_floor_area_m2, design_it_load_mw, tier_classification [I/II/III/IV], cooling_type | — |
| `data_centre_assessments` | `id` UUID | facility_id, assessment_year, total_it_load_mw, pue, pue_target, pue_industry_avg (1.58), wue, wue_target, rer, renewable_energy_pct, grid_emission_factor_kgco2e_kwh, annual_co2e_tco2e, scope2_market_tco2e, scope1_backup_gen_tco2e, water_consumption_litres, certifications JSONB, efficiency_score (0–100), efficiency_rating [A+/A/B/C/D/E], gap_vs_1_5c_pathway JSONB | `facility_id → data_centre_facilities` |
| `cat_risk_properties` | `id` UUID | property_reference, property_name, property_type, address, country_iso, latitude, longitude, elevation_m, construction_type, construction_year, floor_area_m2, replacement_value_gbp, market_value_gbp, insured_value_gbp, owner_entity_id, portfolio_id | — |
| `cat_risk_assessments` | `id` UUID | property_id, assessment_date, peril [flood/earthquake/windstorm/wildfire/coastal_flood/subsidence…], cat_model_vendor [RMS/AIR_Verisk/CoreLogic/JBA], exceedance_probability_method [OEP/AEP/AEL], aal_gbp, aal_pct_of_value, eml_gbp (1-in-100yr), pml_gbp (1-in-250yr), loss_1in10yr through loss_1in1000yr (gbp), damage_ratio_mean, vulnerability_class [A/B/C/D/E], sii_cat_capital_gbp, risk_score (0–10), risk_category | `property_id → cat_risk_properties` |
| `cat_risk_climate_scenarios` | `id` UUID | assessment_id, climate_scenario [RCP2.6/RCP4.5/SSP2-4.5/SSP5-8.5…], time_horizon_year [2030/2050/2075/2100], hazard_intensity_delta_pct, frequency_delta_pct, aal_delta_pct, aal_climate_adjusted_gbp, pml_climate_adjusted_gbp, loss_1in100yr_climate_gbp, climate_model [CMIP6/HighResMIP/CORDEX/IPCC_AR6] | `assessment_id → cat_risk_assessments` |
| `power_plants` (sector module) | `id` UUID | plant_name, operator_name, owner_entity_id, country_iso, latitude, longitude, fuel_type [coal/gas_ccgt/gas_ocgt/nuclear/wind/solar/biomass/geothermal…], installed_capacity_mw, capacity_factor_pct, year_commissioned, year_decommission_planned, remaining_useful_life_years, operational_status, net_book_value_gbp, lcoe_gbp_per_mwh | — |
| `power_plant_assessments` | `id` UUID | plant_id, assessment_date, current_ci_gco2_kwh, annual_generation_mwh, annual_co2e_tco2e, iea_nze_2030/2040/2050_threshold_gco2_kwh, is_above_2030_threshold, projected_ci_2030/2040/2050, stranded_asset_risk_score (0–10), stranded_asset_risk_category [Low/Medium/High/Critical], implied_stranding_year, regulatory_stranding_year, stranded_value_at_risk_gbp, carbon_price_assumption_gbp_t, transition_capex_required_gbp, ccs_retrofit_cost_gbp | `plant_id → power_plants` |
| `power_plant_trajectories` | `id` UUID | assessment_id, year, baseline_ci_gco2_kwh, target_ci_gco2_kwh, nze_benchmark_ci_gco2_kwh, projected_generation_mwh, projected_co2e_tco2e, projected_carbon_cost_gbp, cumulative_overshoot_tco2e, is_aligned_with_nze | `assessment_id → power_plant_assessments` |

---

### 3.10 Regulatory Framework Tables (Migrations 009, 011–016)

**Migration 009 — Cross-Sector Regulatory Core:**

| Table | Key Purpose |
|-------|-------------|
| `regulatory_entities` | Master entity registry for all regulatory frameworks (SFDR, EU Taxonomy, TCFD, CSRD, ISSB, BRSR); stores LEI, jurisdiction, applicable_frameworks JSONB |
| `sfdr_pai_disclosures` | SFDR Article 8/9 PAI indicators 1–18 (scope1+2 emissions, GHG intensity, fossil fuel exposure, biodiversity violations, gender pay gap, board gender diversity, corruption incidents…) |
| `eu_taxonomy_assessments` | Turnover/Capex/Opex eligible & aligned % by objective (Obj1 climate mitigation → Obj6 biodiversity), DNSH compliance JSONB |
| `eu_taxonomy_activities` | Activity-level NACE codes, SC criteria, DNSH per objective, eligibility & alignment |
| `tcfd_assessments` | TCFD pillar scores (Governance, Strategy, Risk Management, Metrics & Targets) 0–4; maturity_level [Emerging/Leading] |
| `csrd_readiness_assessments` | ESRS standard completeness % per standard (E1–G1), DMA status, assurance_type, gap_analysis JSONB |
| `issb_assessments` | IFRS S1 + S2 pillar scores, industry_classification_sasb, industry_specific_metrics JSONB |
| `brsr_disclosures` | India BRSR principles P1–P9, Section A/B/C status, BRSR Core KPIs (scope1/2/3, gender pay, board diversity) |
| `sf_taxonomy_alignments` | Multi-jurisdiction taxonomy alignments (EU/UK/Singapore/ASEAN/China/Canada/Australia/India/OECD/Japan); turnover/capex/opex eligible & aligned % |
| `regulatory_action_plans` | Action items per framework; priority [Critical/High/Medium/Low]; effort_days, estimated_cost_gbp, target_completion_date, owner_team |

**Migrations 011–012 — Sector-Specific CSRD:**

| Table Prefix | Sector | Key Data |
|-------------|--------|----------|
| `fi_*` | Financial Institutions | fi_entities, fi_financials, fi_loan_books, fi_green_finance, fi_financed_emissions, fi_paris_alignment, fi_csrd_e1_climate, fi_csrd_s1_workforce, fi_csrd_g1_governance, fi_eu_taxonomy_kpis |
| `energy_*` | Energy | energy_entities, energy_financials, energy_generation_mix, energy_csrd_e1/e2/e3/e4/e5 (climate/pollution/water/biodiversity/circular), energy_csrd_s1_workforce, energy_csrd_g1_governance, energy_renewable_pipeline, energy_stranded_assets_register |

**Migration 013 — CSRD Cross-Sector Platform:**

| Table | Key Purpose |
|-------|-------------|
| `csrd_entity_registry` | Canonical cross-sector entity; used as FK anchor for all CSRD tables |
| `csrd_framework_applicability` | Which ESRS standards apply to which entity (by size, sector, listing status) |
| `csrd_esrs_catalog` | Master data point (DP) reference — all ~300+ ESRS IG3 quantitative DPs |
| `csrd_kpi_values` | Time-series KPI store: entity × DP code × year → value, unit, source |
| `csrd_materiality_topics` | Double materiality: impact materiality + financial materiality per topic |
| `csrd_disclosure_index` | Which DPs are disclosed, omitted, or subject to transitional relief |
| `csrd_peer_benchmarks` | Sector peer comparison for each KPI |
| `csrd_gap_tracker` | Open gaps per DP: gap_type, severity, owner, target_closure_date |
| `csrd_data_lineage` | Provenance: DP code → source (report, database, calculated), extraction_method |
| `csrd_assurance_log` | Audit trail for assured disclosures |
| `csrd_action_tracker` | Remediation actions for gaps |
| `csrd_target_registry` | Entity-level GHG / sustainability targets linked to ESRS E1 |
| `csrd_transition_plan` | Transition plan milestones and levers |

**Migrations 014–015 — ESRS + ISSB Quantitative:**

| Table | Key Purpose |
|-------|-------------|
| `esrs2_general_disclosures` | General governance, strategy, materiality |
| `esrs_e1_energy` | Energy consumption (renewable + non-renewable) by source |
| `esrs_e1_ghg_emissions` | Scope 1/2/3 by GHG gas; biogenic CO2; base year |
| `esrs_e1_ghg_removals` | Carbon removals and storage |
| `esrs_e1_carbon_price` | Internal carbon price + coverage |
| `esrs_e1_financial_effects` | Transition / physical risk financial effects (€) |
| `esrs_e2_pollution` | Pollution: air / water / soil emissions |
| `esrs_e3_water` | Water withdrawal, consumption, recycling by source |
| `esrs_e4_biodiversity` | Species, habitat, KBA impacts |
| `esrs_e5_circular` | Resource inflows, outflows, waste |
| `esrs_s1_workforce` | Workforce: headcount, turnover, gender pay gap, health & safety |
| `esrs_g1_conduct` | Business conduct: corruption incidents, fines, whistleblowing |
| `issb_s1_general` | IFRS S1 governance + strategy + risk management disclosures |
| `issb_s2_climate` | IFRS S2 climate risks/opportunities, scenario analysis, metrics & targets |
| `issb_sasb_industry_metrics` | 20 SASB sector × metric rows (sector-specific performance metrics) |
| `issb_s2_scenario_analysis` | Per-scenario records for IFRS S2 §22 scenario analysis |
| `issb_s2_offset_plan` | Carbon credit offset plan (§§13–16) |
| `issb_disclosure_relief_tracker` | Per-paragraph transitional relief log |
| `issb_risk_opportunity_register` | Typed physical/transition/opportunity register |
| `issb_s2_time_horizons` | Entity-defined short/medium/long-term horizons |

**Migration 016 — CSRD PDF Pipeline:**

| Table | Key Purpose |
|-------|-------------|
| `csrd_report_uploads` | PDF pipeline: entity_registry_id, status [uploaded/processing/completed/failed], kpis_extracted (count), gaps_found (count), extraction_summary JSONB |

---

## 4. API Endpoint → Table Mapping

| Router Prefix | Endpoint | Method | Tables Read | Tables Written |
|--------------|----------|--------|-------------|----------------|
| `/api/v1/auth` | `/login` | POST | `users_pg` | `user_sessions_pg` |
| `/api/v1/auth` | `/me` | GET | `users_pg`, `user_sessions_pg` | — |
| `/api/v1/auth` | `/logout` | POST | `user_sessions_pg` | `user_sessions_pg` (DELETE) |
| `/api/v1/auth` | `/register` | POST | `users_pg` | `users_pg`, `user_sessions_pg` |
| `/api/v1/portfolios` | `GET /` | GET | `portfolios_pg` | — |
| `/api/v1/portfolios` | `POST /` | POST | — | `portfolios_pg` |
| `/api/v1/portfolios` | `GET /{id}` | GET | `portfolios_pg`, `assets_pg` | — |
| `/api/v1/portfolios` | `PUT /{id}` | PUT | `portfolios_pg` | `portfolios_pg` |
| `/api/v1/portfolios` | `DELETE /{id}` | DELETE | `portfolios_pg`, `assets_pg` | CASCADE DELETE |
| `/api/v1/portfolios` | `GET /{id}/assets` | GET | `assets_pg` | — |
| `/api/v1/portfolios` | `POST /{id}/assets` | POST | — | `assets_pg` |
| `/api/v1/portfolios` | `DELETE /{id}/assets/{aid}` | DELETE | `assets_pg` | `assets_pg` |
| `/api/v1/analysis` | `POST /` | POST | `portfolios_pg`, `assets_pg`, `scenario_series` | `analysis_runs_pg`, `scenario_results` |
| `/api/v1/analysis` | `GET /{run_id}` | GET | `analysis_runs_pg`, `scenario_results` | — |
| `/api/v1/scenarios` | `GET /` | GET | `scenario_series` | — |
| `/api/v1/scenarios` | `POST /` | POST | — | `scenario_series` |
| `/api/v1/scenarios` | `GET /templates` | GET | `scenario_series` | — |
| `/api/v1/data-hub` | `GET /scenario-series` | GET | `scenario_series` | — |
| `/api/v1/data-hub` | `GET /variables` | GET | `scenario_series` | — |
| `/api/v1/ngfs-v2` | `GET /scenarios` | GET | `scenario_series` | — |
| `/api/v1/ngfs-v2` | `GET /{name}/data` | GET | `scenario_series` | — |
| `/api/v1/cbam` | `POST /assessments` | POST | `cbam_product_category`, `cbam_supplier`, `cbam_country_risk` | `cbam_embedded_emissions`, `cbam_cost_projection` |
| `/api/v1/cbam` | `GET /compliance-report` | GET | `cbam_compliance_report`, `cbam_embedded_emissions` | — |
| `/api/v1/stranded-assets` | `POST /calculate` | POST | `fossil_fuel_reserve`, `power_plant`, `infrastructure_asset`, `energy_transition_pathway` | `stranded_asset_calculation` |
| `/api/v1/nature-risk` | `POST /assessments` | POST | `spatial_asset_mapping`, `ecosystem_dependency`, `water_risk_assessment`, `nature_scenario` | `nature_risk_assessment`, `nature_impact_pathway`, `tnfd_disclosure_metric`, `nature_risk_adjustment` |
| `/api/v1/valuations` | `POST /` | POST | `properties`, `comparable_sales` | `valuations` |
| `/api/v1/valuations` | `GET /{id}/comparables` | GET | `comparable_sales` | — |
| `/api/v1/sustainability` | `POST /gresb` | POST | `properties` | — (returned inline) |
| `/api/v1/portfolio-analytics` | `POST /` | POST | — | `portfolio_analytics` |
| `/api/v1/portfolio-analytics` | `GET /{id}` | GET | `portfolio_analytics`, `portfolio_property_holdings` | — |
| `/api/v1/portfolio-analytics` | `GET /{id}/report/{type}` | GET | `portfolio_reports` | — |
| `/api/v1/ecl-climate` | `POST /assessments` | POST | `assets_pg`, `scenario_series` | `ecl_assessments`, `ecl_exposures`, `ecl_scenario_results`, `ecl_climate_overlays` |
| `/api/v1/ecl-climate` | `GET /assessments/{id}` | GET | `ecl_assessments`, `ecl_exposures`, `ecl_scenario_results`, `ecl_climate_overlays` | — |
| `/api/v1/pcaf` | `POST /portfolios` | POST | — | `pcaf_portfolios` |
| `/api/v1/pcaf` | `GET /{id}/investees/{iid}` | GET | `pcaf_investees` | — |
| `/api/v1/pcaf` | `GET /{id}/temperature` | GET | `temperature_scores` | — |
| `/api/v1/supply-chain` | `POST /scope3-assessments` | POST | `sc_entities`, `emission_factor_library` | `scope3_assessments`, `scope3_activities` |
| `/api/v1/supply-chain` | `POST /sbti-targets` | POST | `sc_entities` | `sbti_targets`, `sbti_trajectories` |
| `/api/v1/supply-chain` | `GET /emission-factors` | GET | `emission_factor_library` | — |
| `/api/v1/sector-assessments` | `POST /data-centres` | POST | `data_centre_facilities` | `data_centre_assessments` |
| `/api/v1/sector-assessments` | `POST /cat-risk` | POST | `cat_risk_properties` | `cat_risk_assessments`, `cat_risk_climate_scenarios` |
| `/api/v1/sector-assessments` | `POST /power-plants` | POST | `power_plants`, `scenario_series` | `power_plant_assessments`, `power_plant_trajectories` |
| `/api/v1/unified-valuations` | `POST /` | POST | `valuation_assets` | `unified_valuations`, `valuation_method_results`, `esg_adjustments`, `climate_valuation_adjustments` |
| `/api/v1/csrd` | `POST /reports/upload` | POST | `csrd_entity_registry` | `csrd_report_uploads` |
| `/api/v1/csrd` | `GET /reports/{entity_id}` | GET | `csrd_report_uploads`, `csrd_kpi_values`, `csrd_gap_tracker` | — |
| `/api/v1/portfolio-reporting` | `GET /{id}/pcaf` | GET | `pcaf_portfolios`, `pcaf_investees`, `pcaf_portfolio_results` | — |
| `/api/v1/portfolio-reporting` | `GET /{id}/sfdr-pai` | GET | `sfdr_pai_disclosures`, `pcaf_investees` | — |
| `/api/v1/portfolio-reporting` | `GET /{id}/ecl-stress` | GET | `ecl_assessments`, `ecl_scenario_results` | — |
| `/api/v1/portfolio-reporting` | `GET /{id}/eu-taxonomy` | GET | `eu_taxonomy_assessments`, `eu_taxonomy_activities` | — |
| `/api/v1/portfolio-reporting` | `GET /{id}/paris-alignment` | GET | `temperature_scores`, `pcaf_portfolio_results` | — |
| `/api/v1/re-clvar` | `POST /valuation` | POST | `properties`, `scenario_series` | `unified_valuations`, `climate_valuation_adjustments` |
| `/api/v1/exports` | `POST /` | POST | (all modules) | — (file stream) |
| `/api/v1/scenario-builder` | `POST /` | POST | `scenario_series` | `scenario_series` |
| `/api/v1/sub-parameter` | `POST /` | POST | `scenario_series`, `analysis_runs_pg` | — |
| `/api/health` | `GET /` | GET | — | — |

---

## 5. Frontend Page → API → Table Lineage

```
Overview Dashboard (/)
  └─ GET /api/v1/portfolios          → portfolios_pg
  └─ GET /api/v1/portfolios/{id}     → portfolios_pg, assets_pg
  └─ GET /api/v1/scenarios/templates → scenario_series
  └─ POST /api/v1/analysis           → analysis_runs_pg, scenario_results
                                       (reads: portfolios_pg, assets_pg, scenario_series)

Portfolio Analytics (/portfolio-analytics)
  └─ GET /api/v1/portfolio-analytics/{id}            → portfolio_analytics, portfolio_property_holdings
  └─ GET /api/v1/portfolio-analytics/{id}/report     → portfolio_reports
  └─ POST /api/v1/portfolio-reporting/{id}/pcaf      → pcaf_portfolios, pcaf_investees, pcaf_portfolio_results
  └─ POST /api/v1/portfolio-reporting/{id}/sfdr-pai  → sfdr_pai_disclosures, pcaf_investees
  └─ POST /api/v1/portfolio-reporting/{id}/ecl-stress→ ecl_assessments, ecl_scenario_results
  └─ POST /api/v1/portfolio-reporting/{id}/eu-taxonomy → eu_taxonomy_assessments, eu_taxonomy_activities
  └─ POST /api/v1/portfolio-reporting/{id}/paris-alignment → temperature_scores, pcaf_portfolio_results

Portfolio Manager (/portfolio-manager)
  └─ POST /api/v1/analysis/portfolio-upload/parse    → (CSV parse, no DB)
  └─ POST /api/v1/analysis/portfolio-upload/create   → portfolios_pg, assets_pg
  └─ PUT  /api/v1/portfolios/{id}                    → portfolios_pg, assets_pg

Financial Risk — ECL / PCAF (/financial-risk)
  └─ POST /api/v1/ecl-climate/assessments   → ecl_assessments, ecl_exposures,
                                              ecl_scenario_results, ecl_climate_overlays
                                              (reads: assets_pg, scenario_series)
  └─ POST /api/v1/pcaf/portfolios           → pcaf_portfolios, pcaf_investees, pcaf_portfolio_results
  └─ GET  /api/v1/pcaf/{id}/temperature     → temperature_scores

Supply Chain Scope 3 (/supply-chain)
  └─ POST /api/v1/supply-chain/scope3-assessments → scope3_assessments, scope3_activities
                                                     (reads: sc_entities, emission_factor_library)
  └─ POST /api/v1/supply-chain/sbti-targets       → sbti_targets, sbti_trajectories
  └─ GET  /api/v1/supply-chain/emission-factors   → emission_factor_library

Sector Assessments (/sector-assessments)
  └─ POST /api/v1/sector-assessments/data-centres  → data_centre_assessments
                                                     (reads: data_centre_facilities)
  └─ POST /api/v1/sector-assessments/cat-risk      → cat_risk_assessments, cat_risk_climate_scenarios
                                                     (reads: cat_risk_properties)
  └─ POST /api/v1/sector-assessments/power-plants  → power_plant_assessments, power_plant_trajectories
                                                     (reads: power_plants, scenario_series)

Real Estate Assessment (/real-estate-assessment)
  └─ POST /api/v1/valuations                       → valuations
                                                     (reads: properties, comparable_sales)
  └─ POST /api/v1/re-clvar/valuation               → unified_valuations, climate_valuation_adjustments
                                                     (reads: properties, scenario_series)

Valuation (/valuation)
  └─ POST /api/v1/unified-valuations               → unified_valuations, valuation_method_results,
                                                     esg_adjustments, climate_valuation_adjustments
                                                     (reads: valuation_assets)

Nature Risk (/nature-risk)
  └─ POST /api/v1/nature-risk/assessments          → nature_risk_assessment, nature_impact_pathway,
                                                     tnfd_disclosure_metric, nature_risk_adjustment
                                                     (reads: spatial_asset_mapping, ecosystem_dependency,
                                                      water_risk_assessment, external_data_cache)

Stranded Assets (/stranded-assets)
  └─ POST /api/v1/stranded-assets/calculate        → stranded_asset_calculation
                                                     (reads: fossil_fuel_reserve, power_plant,
                                                      infrastructure_asset, energy_transition_pathway)

Carbon Credits (/carbon)
  └─ GET  /api/v1/carbon-credits/methodologies     → (static methodology data)
  └─ POST /api/v1/carbon-credits/calculate         → (inline result, no write)

CBAM Calculator (/regulatory → CBAM panel)
  └─ POST /api/v1/cbam/assessments                 → cbam_embedded_emissions, cbam_cost_projection
                                                     (reads: cbam_product_category, cbam_supplier,
                                                      cbam_country_risk, cbam_certificate_price)

Regulatory Reporting (/regulatory)
  └─ POST /api/v1/pcaf/sfdr-pai                    → sfdr_pai_disclosures
                                                     (reads: pcaf_investees)
  └─ POST /api/v1/taxonomy/alignment               → eu_taxonomy_assessments, eu_taxonomy_activities
                                                     (reads: regulatory_entities)
  └─ POST /api/v1/tcfd/disclosure                  → tcfd_assessments
  └─ POST /api/v1/csrd/esrs-assessment             → csrd_readiness_assessments, csrd_kpi_values
                                                     (reads: csrd_entity_registry, csrd_esrs_catalog)
  └─ POST /api/v1/issb/climate-disclosure          → issb_assessments, issb_s2_climate
                                                     (reads: issb_sasb_industry_metrics)
  └─ POST /api/v1/brsr/disclosure                  → brsr_disclosures
  └─ POST /api/v1/csrd/reports/upload              → csrd_report_uploads
                                                     (async: csrd_entity_registry, csrd_kpi_values,
                                                      csrd_data_lineage, csrd_gap_tracker)

Scenario Browser (/browser)
  └─ GET  /api/v1/data-hub/sources                 → (data source metadata)
  └─ GET  /api/v1/data-hub/scenarios               → scenario_series
  └─ POST /api/v1/data-hub/scenarios/search        → scenario_series (filtered)
  └─ GET  /api/v1/data-hub/scenarios/{id}/trajectories → scenario_series
  └─ POST /api/v1/analysis/compare                 → scenario_results (inline)

Scenario Analysis (/scenario-analysis)
  └─ POST /api/v1/scenario-builder                 → scenario_series (custom scenario)
  └─ GET  /api/v1/scenario-analysis/sensitivity    → scenario_series, analysis_runs_pg
  └─ POST /api/v1/scenario-analysis/what-if        → (inline recalculation)

Sub-Parameter (/sub-parameter)
  └─ POST /api/v1/sub-parameter                    → (reads: scenario_series, analysis_runs_pg)

Interactive Analytics (/interactive)
  └─ NO API CALLS — all data generated client-side with deterministic seeded functions
```

---

## 6. Service Layer Data Flows

### 6.1 Scenario Analysis Engine (Core)

```
INPUT:
  portfolios_pg  →  assets_pg
  scenario_series (NGFS_NET_ZERO_2050 / DELAYED_TRANSITION / HOT_HOUSE / DIVERGENT)

PROCESSING (scenario_analysis_engine.py):
  assets_pg → pd_calculator.py   → pd_12m, pd_lifetime, pd_ttc per asset
  assets_pg → lgd_calculator.py  → lgd_downturn, lgd_market per asset
  assets_pg → var_calculator.py  → portfolio VaR_95
  Per (scenario × horizon):
    Adjust PD/LGD by macro overlay (GDP, unemployment, interest rate, carbon price)
    Apply sector-specific transition risk multiplier
    Apply physical risk overlay by geography (flood, heat, drought)
    Compute: expected_loss = sum(ead × pd_climate_adjusted × lgd_pit)
    Compute: rating_migrations JSONB (each asset: old_rating → new_rating)
    Compute: risk_adjusted_return = return_on_equity - expected_loss_pct
    Compute: concentration_hhi = Σ(sector_share²)

OUTPUT:
  analysis_runs_pg  (status: completed, results JSONB)
  scenario_results  (one row per scenario × horizon)
```

### 6.2 ECL Climate Engine (IFRS 9)

```
INPUT:
  ecl_exposures (submitted via API)
  scenario_series (NGFS scenarios)
  ecl_assessments (parent record)

PROCESSING (ecl_climate_engine.py):
  Stage classification: days_past_due, is_forbearance → ifrs9_stage 1/2/3
  PD Model: logistic_regression / merton / vasicek
  LGD Model: supervisory_lgd / market_lgd / downturn_lgd
  ECL = PD_12m × LGD × EAD  (stage 1)
       PD_lifetime × LGD × EAD  (stage 2/3)
  Climate overlay:
    Physical: peril exposure (flood/heat/drought) by lat/lng × severity → pd_uplift_bps
    Transition: sector carbon intensity vs IEA NZE pathway → pd_uplift_bps
  Probability weighting: Σ(scenario_weight × scenario_ecl)

OUTPUT:
  ecl_assessments   (total_ecl_gbp, climate_ecl_uplift_gbp, stage breakdown)
  ecl_exposures     (pd_climate_adjusted, lgd_pit, ecl_12m, ecl_lifetime per instrument)
  ecl_scenario_results (one row per BASE/ADVERSE/SEVERE/CLIMATE_DISORDERLY…)
  ecl_climate_overlays (one row per NGFS climate scenario)
```

### 6.3 PCAF / WACI Engine

```
INPUT:
  pcaf_investees (submitted via API)
  pcaf_portfolios (parent)

PROCESSING (pcaf_waci_engine.py):
  Attribution factor = outstanding_investment / enterprise_value  (EVIC method)
  Financed emissions = attribution_factor × investee_scope1/2/3_tco2e
  WACI = Σ(financed_emissions / revenue) weighted by portfolio share
  Carbon footprint = Σ(financed_emissions) / AUM_MEUR
  Portfolio temperature = interpolation vs IEA NZE / IEA APS / current policies curves
  SFDR PAI:
    PAI_1 = Σ(financed_scope1 + scope2) / total_enterprise_value
    PAI_3 = WACI = Σ(financed_ghg / revenue)
    PAI_4 = fossil_fuel_exposure_pct (fossil fuel sector assets / total)
    PAI_12 = gender_pay_gap_pct (from investee disclosures)

OUTPUT:
  pcaf_portfolio_results (aggregated WACI, carbon footprint, alignment %)
  temperature_scores (portfolio_temperature_c, aligned_1_5c_pct, aligned_2c_pct)
  sfdr_pai_disclosures (PAI indicators 1–18)
```

### 6.4 CSRD PDF Extraction Pipeline

```
INPUT:
  PDF file upload  →  POST /api/v1/csrd/reports/upload
                       saves to: csrd_report_uploads (status=uploaded)

ASYNC WORKER (csrd_tasks.py → csrd_extractor.py):
  Step 1: filename-based entity detection (_KNOWN_ENTITIES dict)
           → csrd_entity_registry.id
  Step 2: PDF text extraction (pdfminer / pdfplumber)
  Step 3: Regex + LLM pattern matching against csrd_esrs_catalog DP codes
           → Extracted KPIs: {dp_code, value, unit, year, page_ref, confidence}
  Step 4: Gap identification: csrd_esrs_catalog DPs - extracted_kpis → gaps

OUTPUT (csrd_ingest_service.py):
  csrd_report_uploads   (status=completed, kpis_extracted=N, gaps_found=M)
  csrd_kpi_values       (one row per extracted DP × year)
  csrd_data_lineage     (source=pdf_extraction, extraction_method, page_ref, confidence)
  csrd_gap_tracker      (one row per missing mandatory DP)

LIVE DATA (as of 2026-03-03):
  8 entities: Rabobank, BNP Paribas, ABN AMRO, ING, Ørsted, RWE, ENGIE, EDP
  82 KPI values | 120 gaps | 82 lineage entries
```

### 6.5 Stranded Asset Calculator

```
INPUT:
  fossil_fuel_reserve / power_plant / infrastructure_asset
  energy_transition_pathway (demand, price, capacity trajectories)
  scenario_id (NGFS / IEA NZE / IEA APS / IEA STEPS)
  carbon_price_trajectory JSONB from scenario

PROCESSING (stranded_asset_calculator.py):
  Baseline NPV = DCF(revenue_trajectory - cost_trajectory, lifetime)
  Scenario NPV = DCF(demand_adjusted_revenue - cost - carbon_cost, optimal_retirement)
  Stranded value = Baseline_NPV - Scenario_NPV
  Stranding risk score = f(ci_gap_to_nze, carbon_price, peak_demand_year)
  Technology disruption: EV uptake → oil demand reduction → breakeven shift

OUTPUT:
  stranded_asset_calculation (one row per asset × scenario × target_year)
  power_plant_assessments    (stranded_asset_risk_score, implied_stranding_year)
  power_plant_trajectories   (year-by-year CI vs IEA NZE benchmark)
```

### 6.6 Scope 3 / Supply Chain Engine

```
INPUT:
  scope3_activities (cat1–cat15 quantity + activity_unit per category)
  emission_factor_library (activity_type × country_iso × year)
  sc_entities (entity metadata)

PROCESSING (supply_chain_scope3_engine.py):
  Per activity:
    emission_factor = lookup(activity_type, country_iso, year, gwp_basis=AR6)
    co2e_tco2e = activity_quantity × emission_factor_value [unit conversion]
  Aggregate by category:
    cat1_purchased_goods = Σ(co2e for category_number=1)
    ... (categories 2–15)
  Total scope3 = Σ(cat1 … cat15)
  Hotspot = top 3 categories by % contribution
  SBTi trajectory = project target_emissions by near_term_annual_reduction_rate

OUTPUT:
  scope3_assessments  (all 15 category totals + intensity + hotspot_summary JSONB)
  scope3_activities   (individual activity rows with co2e)
  sbti_targets        (near/long-term reduction targets)
  sbti_trajectories   (year-by-year target vs actual)
```

---

## 7. Cross-Module Data Dependencies

```
portfolios_pg ─────────────────────────────────────────────────────┐
    │                                                               │
    ├─► assets_pg ──────────► ecl_exposures ──► ecl_assessments   │
    │       │                                        │             │
    │       │                              ecl_scenario_results    │
    │       │                              ecl_climate_overlays    │
    │       │                                                       │
    ├─► analysis_runs_pg ────► scenario_results                    │
    │                                │                             │
    │                         scenario_series ◄────────────────────┘
    │                         (NGFS trajectories:                  │
    │                          year, scenario, variable, value)    │
    │                                │                             │
    │                                ├─► ngfs_v2 routes           │
    │                                ├─► scenario_builder_v2      │
    │                                └─► sub_parameter_analysis   │
    │
    └─► pcaf_investees ──────► pcaf_portfolios ──► pcaf_portfolio_results
                                    │                   │
                            temperature_scores    sfdr_pai_disclosures

sc_entities ───────────► scope3_assessments ──────► scope3_activities
    │                           │                        │
    └─► supply_chain_tiers      │                 emission_factor_library
                                └─► sbti_targets ──► sbti_trajectories

regulatory_entities ──────────────────────────────────────────────────
    ├─► sfdr_pai_disclosures
    ├─► eu_taxonomy_assessments ──► eu_taxonomy_activities
    ├─► tcfd_assessments
    ├─► csrd_readiness_assessments
    ├─► issb_assessments
    ├─► brsr_disclosures
    └─► sf_taxonomy_alignments

csrd_entity_registry ─────────────────────────────────────────────────
    ├─► csrd_kpi_values       (time-series KPI store)
    ├─► csrd_gap_tracker      (open gaps)
    ├─► csrd_data_lineage     (provenance)
    ├─► csrd_materiality_topics
    ├─► csrd_disclosure_index
    ├─► csrd_peer_benchmarks
    ├─► csrd_target_registry
    ├─► csrd_transition_plan
    └─► csrd_report_uploads   (PDF pipeline)

cat_risk_properties ──► cat_risk_assessments ──► cat_risk_climate_scenarios
power_plants ─────────► power_plant_assessments ─► power_plant_trajectories
data_centre_facilities ─► data_centre_assessments

valuation_assets ──────► unified_valuations ──────────────────────────
                                │
                    ┌───────────┼──────────────────────┐
                    ▼           ▼                       ▼
          valuation_method_results  esg_adjustments  climate_valuation_adjustments

nature_risk_assessment ◄────────────────────────────────────────────
    │                  spatial_asset_mapping, ecosystem_dependency,
    │                  biodiversity_metric, water_risk_assessment,
    │                  nature_scenario, external_data_cache
    └─► nature_impact_pathway
    └─► tnfd_disclosure_metric
    └─► nature_risk_adjustment
```

**Note on Cross-Module Isolation:** Each domain uses its own entity reference (e.g., `cbam_supplier.counterparty_id`, `nature_risk_assessment.portfolio_id`, `cat_risk_properties.owner_entity_id`) as loose UUID references. There are **no enforced cross-module foreign keys** — each domain is currently a data island. The `csrd_entity_registry` is the intended canonical entity anchor but is not yet FK-linked to `regulatory_entities`, `sc_entities`, `fi_entities`, or `energy_entities`.

---

## 8. Data Ingestion Flows

### 8.1 Portfolio Upload (CSV/Excel)

```
User uploads CSV →  POST /api/v1/analysis/portfolio-upload/parse
                         │
                         ▼
                  upload_service.py
                    parse CSV: name, sector, exposure (required)
                               asset_type, rating, pd, lgd, maturity (optional)
                    column_mapping (fuzzy header matching)
                    return: parseResult {assets[], errors[], valid_rows}
                         │
                         ▼
                  POST /api/v1/analysis/portfolio-upload/create
                         │
                         ▼
                  portfolios_pg  (INSERT)
                  assets_pg      (INSERT × N assets)
```

### 8.2 NGFS Scenario Data Seeding

```
ngfs_seeder.py (run once at setup):
  Load NGFS v2 CSV/Excel data files
  ▼
  scenario_series  (bulk INSERT: year × scenario × region × variable × value)

ngfs_sync_service.py (periodic sync):
  Fetch from NGFS Climate Analytics API (external)
  Upsert into scenario_series
  Log to sync_logs
```

### 8.3 CSRD PDF Extraction (Async)

```
User uploads PDF → POST /api/v1/csrd/reports/upload
                        │
                        ▼
                   csrd_report_uploads  (status=uploaded)
                        │
             (NOT via FastAPI BackgroundTasks — run via direct Python script)
                        ▼
                   csrd_tasks.py → process_csrd_report_task(report_id)
                        │
              csrd_extractor.py:
                   pdfminer text extraction
                   entity detection via _KNOWN_ENTITIES filename dict
                   regex + LLM pattern match vs csrd_esrs_catalog
                        │
              csrd_ingest_service.py:
                        ├─► csrd_entity_registry (UPSERT entity)
                        ├─► csrd_kpi_values       (INSERT extracted KPIs)
                        ├─► csrd_data_lineage     (INSERT provenance per KPI)
                        ├─► csrd_gap_tracker      (INSERT missing mandatory DPs)
                        └─► csrd_report_uploads   (UPDATE status=completed,
                                                   kpis_extracted=N, gaps_found=M)
```

### 8.4 Emission Factor Library Seeding

```
Static sources:
  DEFRA (UK, annual update) → emission_factor_library (scope 1/2/3, UK grid factors)
  IEA (grid emission factors by country/region) → emission_factor_library
  EPA eGRID (US regional grid) → emission_factor_library
  ecoinvent (product lifecycle EFs) → emission_factor_library
  IPCC AR6 GWP values → gwp_basis='AR6' on all records

Validity tracking: valid_from_year, valid_to_year per factor row
```

---

## 9. State Management & Client-Side Data

| Store | Type | Managed Data | Persistence |
|-------|------|-------------|-------------|
| `localStorage['session_token']` | String | Bearer token for all API calls | Browser localStorage |
| `dashboardStore` (Zustand) | In-memory | Portfolios list, selected portfolio + assets, analysis runs, results, filter state | Session only |
| `scenarioBrowserStore` (Zustand) | In-memory | Scenario sources, scenario list, filters, compare workspace, favorites | Session only |
| `comparisonStore` (Zustand) | In-memory | Selected scenarios, variables, regions, comparison data, gap analysis | Session only |
| `dataHubStore` (Zustand) | In-memory | Sources, scenarios, trajectories, sync logs, analytics | Session only |
| `carbonSlice` (Redux) | In-memory | Carbon portfolio dashboard, active scenario, scenarios list | Session only |
| React Query cache | In-memory | Portfolio data, analytics, holdings — cached with `staleTime` | Session only |

**Client-Side Data Generation (InteractiveDashboard — no API):**
All KPI cards, charts, and sensitivity analysis in `/interactive` are generated entirely in the browser using deterministic seeded functions. No database reads occur on that page. Parameters: `sectors[]`, `assetTypes[]`, `horizon`, `varConfidenceLevel`, `discountRate`, `carbonPrice`, `interestRate`, `gdpGrowth`, `temperatureTarget`.

---

## 10. External Data Sources

| Source | Data Type | Used By | Tables Updated | Frequency |
|--------|-----------|---------|----------------|-----------|
| **NGFS Climate Analytics** | Scenario trajectories (NGFS v2) | `ngfs_sync_service.py` | `scenario_series` | Manual / periodic |
| **IEA World Energy Outlook** | Technology disruption, transition pathways | Static seed | `technology_disruption_metric`, `energy_transition_pathway`, `emission_factor_library` | Annual |
| **DEFRA UK Emissions Factors** | Scope 1/2/3 activity-based EFs | Static seed | `emission_factor_library` | Annual |
| **EPA eGRID** | US regional grid emission factors | Static seed | `emission_factor_library` | Annual |
| **ecoinvent** | Product lifecycle emission factors | Static seed | `emission_factor_library` | Version-based |
| **WRI Aqueduct** | Water risk scores by basin | `nature_risk_calculator.py`, `external_data_cache` | `water_risk_assessment`, `external_data_cache` | Cached (15-day TTL) |
| **GBIF** | Biodiversity species data | `nature_risk_calculator.py`, `external_data_cache` | `biodiversity_metric`, `external_data_cache` | Cached |
| **IUCN Red List** | Species extinction risk | `nature_risk_calculator.py`, `external_data_cache` | `biodiversity_metric`, `external_data_cache` | Cached |
| **UNEP-WCMC** | Protected areas / KBA boundaries | `nature_risk_calculator.py`, `external_data_cache` | `spatial_asset_mapping`, `external_data_cache` | Cached |
| **Copernicus (EU)** | Land use, deforestation rates | `nature_risk_calculator.py`, `external_data_cache` | `spatial_asset_mapping`, `external_data_cache` | Cached |
| **Bloomberg / Market** | EV sales share, technology adoption | Static seed | `technology_disruption_metric` | Annual |
| **CSRD Annual Reports (PDFs)** | Entity KPIs, GHG disclosures | `csrd_extractor.py` | `csrd_kpi_values`, `csrd_data_lineage`, `csrd_gap_tracker`, `csrd_report_uploads` | Per-upload |
| **Google OAuth** | User identity | `auth_pg.py` | `users_pg`, `user_sessions_pg` | Per login |

---

## 11. Known Gaps & Architectural Constraints

### 11.1 Data Island Problem
Each module stores its own entity reference as an unlinked UUID (`portfolio_id`, `counterparty_id`, `asset_id`, `owner_entity_id`). There is no enforced cross-module FK. A `cbam_supplier.counterparty_id` cannot be joined to a `pcaf_investee.investee_id` or `sc_entities.id` without application-layer logic.

**Implication:** Reporting that spans modules (e.g., a company's CBAM exposure + scope3 + SFDR PAI in a single query) must be assembled at the service layer, not in SQL.

### 11.2 Portfolio Analytics Engine — Mocked
`portfolio_analytics_engine.py` uses `import random` and `get_sample_portfolios()` with hardcoded sector data. All responses from `/api/v1/portfolio-analytics` reflect synthetic data, not real `portfolios_pg` or `assets_pg` values.

**Resolution path:** Wire `portfolio_analytics_engine_v2.py` to read from `portfolios_pg`, `assets_pg`, `analysis_runs_pg`, and aggregate real results.

### 11.3 No Audit Trail
No `audit_log` table exists in any migration. Write operations (INSERT/UPDATE/DELETE) on sensitive tables are untracked. The `csrd_assurance_log` exists but is scoped only to CSRD.

### 11.4 No PostGIS
`nature_risk_assessment`, `spatial_asset_mapping`, `cat_risk_properties`, `water_risk_assessment`, `biodiversity_metric` all store `latitude`, `longitude` as float columns. No spatial index, no `geometry` type. Radius queries, polygon containment, and KBA overlap calculations are done in Python, not SQL.

### 11.5 No Time-Series Database
`scenario_series` is a standard PostgreSQL table with a composite index `(year, scenario, region, variable)`. TimescaleDB hypertable creation (noted in comments in migration 002 for `technology_disruption_metric`) was not implemented. High-volume trajectory queries may be slow without partitioning.

### 11.6 Duplicate Power Plant Tables
There are two `power_plant` tables across migrations 002 and 008 serving different modules (stranded assets vs. sector assessments). These are **separate, unlinked tables** — a real power plant entity would require manual reconciliation between `power_plant` (migration 002) and `power_plants` (migration 008).

### 11.7 Legacy Portfolio Tables
`portfolios` and `assets` (from the initial migration, `models_sql.py`) are empty and unused. All active data is in `portfolios_pg` and `assets_pg`. The legacy tables should be dropped or explicitly documented as deprecated.

### 11.8 Authentication
`auth_pg.py` implements basic email/password auth with bcrypt hashing and session tokens. There is no RBAC, no role separation, and no multi-tenancy. All authenticated users can read and write all data across all modules.

### 11.9 Interactive Dashboard Has No Real Data Connection
The `/interactive` page (largest page at 1,248 lines) generates all its data client-side with seeded random functions. It is not connected to any backend API or database. It serves as a UX prototype only.

---

*Document generated from analysis of 17 Alembic migrations, 27 API route files, 40+ service files, and 23 frontend pages.*
*Last updated: 2026-03-03*
