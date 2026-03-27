# Data Requirements — Module-by-Module Reference

> Platform: A2 Intelligence / Sustainability Analytics
> Last updated: 2026-03-01
> Purpose: Define the exact input data points, output metrics, and database tables for every module.

---

## Table of Contents

1. [Carbon Calculator (Scope 1/2/3)](#1-carbon-calculator)
2. [CBAM Calculator](#2-cbam-calculator)
3. [Stranded Assets Calculator](#3-stranded-assets-calculator)
4. [Nature Risk (TNFD LEAP)](#4-nature-risk-tnfd-leap)
5. [Real Estate Valuation Engine](#5-real-estate-valuation-engine)
6. [NGFS Scenario Analysis Engine](#6-ngfs-scenario-analysis-engine)
7. [PD Calculator (Credit Risk)](#7-pd-calculator-credit-risk)
8. [ECL + PCAF (Financial Risk)](#8-ecl--pcaf-financial-risk)
9. [Supply Chain (Scope 3 / SBTi)](#9-supply-chain-scope-3--sbti)
10. [Sector Assessments](#10-sector-assessments)
11. [Regulatory Reporting (SFDR / CSRD / ISSB)](#11-regulatory-reporting)
12. [Sustainability (GRESB / LEED / BREEAM)](#12-sustainability-gresb--ratings)
13. [Portfolio Analytics Engine](#13-portfolio-analytics-engine)

---

## 1. Carbon Calculator

**Route:** `POST /api/v1/carbon/calculate`
**Frontend:** `/carbon`
**DB Tables:** `carbon_calculations`, `scope3_categories`

### Required Inputs

| Field | Type | Notes |
|-------|------|-------|
| `entity_name` | string | Company / fund name |
| `reporting_year` | int | e.g. 2024 |
| `scope1_fuel_combustion_tco2e` | float | Direct combustion emissions |
| `scope1_process_emissions_tco2e` | float | Industrial process emissions |
| `scope1_fugitive_emissions_tco2e` | float | Refrigerants, methane leaks |
| `scope2_location_based_tco2e` | float | Grid-average electricity emissions |
| `scope2_market_based_tco2e` | float | Contract/attribute-adjusted (RECs, PPAs) |
| `scope3_cat_1_purchased_goods` | float | tCO2e — purchased goods & services |
| `scope3_cat_2_capital_goods` | float | tCO2e |
| `scope3_cat_3_energy_fuels` | float | tCO2e — upstream energy |
| `scope3_cat_4_upstream_transport` | float | tCO2e |
| `scope3_cat_5_waste` | float | tCO2e |
| `scope3_cat_6_business_travel` | float | tCO2e |
| `scope3_cat_7_employee_commuting` | float | tCO2e |
| `scope3_cat_11_use_of_products` | float | tCO2e — often largest for energy/tech |
| `scope3_cat_15_investments` | float | tCO2e — PCAF financed emissions |
| `revenue_meur` | float | For intensity calculations |
| `employees_fte` | int | For headcount-normalised intensity |
| `methodology` | string | GHG Protocol / IPCC AR6 / custom |

### Key Outputs

| Metric | Unit |
|--------|------|
| Total Scope 1+2+3 | tCO2e |
| Revenue intensity | tCO2e / MEUR |
| Employee intensity | tCO2e / FTE |
| Scope split (%) | % |
| Carbon credit offset eligible | tCO2e |
| Paris alignment gap | tCO2e reduction needed |

### Carbon Credit Methodology Inputs (56+ supported)

| Field | Notes |
|-------|-------|
| `methodology_id` | CDM / VCS / Gold Standard / ACM / AMS codes |
| `project_type` | afforestation, REDD+, cookstoves, biogas, solar, etc. |
| `baseline_emissions` | tCO2e/yr reference case |
| `project_area_ha` | for land-based methodologies |
| `monitoring_period_years` | vintage/crediting period |
| `country_iso` | for country-specific baselines |
| `additionality_flag` | boolean |
| `co_benefits` | JSON: biodiversity, water, SDG tags |

---

## 2. CBAM Calculator

**Route:** `POST /api/v1/cbam/calculate`
**Frontend:** `/cbam`
**DB Tables:** `cbam_calculations`, `cbam_embedded_emissions`
**Regulations:** EU Articles 7 (production), 21 (certificates), 31 (default values)

### Required Inputs

| Field | Type | Notes |
|-------|------|-------|
| `importer_entity` | string | EU importer name |
| `reporting_year` | int | |
| `goods_category` | enum | `cement`, `steel`, `aluminium`, `fertilisers`, `electricity`, `hydrogen` |
| `goods_quantity_tonnes` | float | Import volume |
| `country_of_origin` | string | ISO-3166 2-letter |
| `installation_id` | string | Third-country installation identifier |
| `direct_emissions_tco2e_per_tonne` | float | Actual or Article 31 default |
| `indirect_emissions_tco2e_per_tonne` | float | Electricity-related (sector-specific) |
| `electricity_consumption_mwh` | float | For electricity-intensive goods |
| `carbon_price_paid_origin` | float | EUR/tCO2e — Article 9 deduction |
| `eu_ets_price_eur_per_tco2e` | float | Current EUA price |
| `free_allocation_factor` | float | 0.0–1.0 under transitional rules |

### Key Outputs

| Metric | Unit |
|--------|------|
| Total embedded emissions | tCO2e |
| CBAM liability (gross) | EUR |
| Carbon price deduction | EUR |
| Net CBAM liability | EUR |
| CBAM certificates required | count |
| Effective carbon price | EUR/tCO2e |
| Vs. EU ETS benchmark | EUR (savings/cost) |

### Reference Data (built-in)

- Article 31 default embedded emission values per sector/country
- EU ETS sector free allocation benchmarks (2021–2030 Phase 4)
- Country-specific electricity emission factors (IEA grid mix)

---

## 3. Stranded Assets Calculator

**Route:** `POST /api/v1/stranded-assets/calculate`
**Frontend:** `/stranded-assets`
**DB Tables:** `stranded_asset_assessments`, `stranded_reserves`, `stranded_power_plants`, `stranded_infrastructure`, `stranded_tech_disruption`

### Sub-Modules and Required Inputs

#### 3a. Fossil Fuel Reserves
| Field | Notes |
|-------|-------|
| `asset_name` | Field / basin name |
| `fuel_type` | `coal`, `oil`, `gas` |
| `reserves_proved_mt` | Proved reserves (Mt or Mboe) |
| `reserves_probable_mt` | 2P additions |
| `production_cost_usd_per_boe` | Lifting cost |
| `breakeven_price_usd` | Min price for positive NPV |
| `remaining_life_years` | Asset life under current plan |
| `ngfs_scenario` | For carbon budget alignment |
| `discount_rate` | % for NPV calculation |

#### 3b. Power Plant Assessment
| Field | Notes |
|-------|-------|
| `plant_name` | |
| `technology` | `coal`, `gas`, `oil`, `nuclear`, `hydro`, `wind`, `solar` |
| `capacity_mw` | Installed capacity |
| `capacity_factor` | 0.0–1.0 |
| `construction_year` | |
| `planned_retirement_year` | |
| `capex_remaining_musd` | Book value of unrecovered capex |
| `lcoe_usd_per_mwh` | Levelised cost |
| `ppa_price_usd_per_mwh` | If contracted |
| `regulatory_carbon_risk` | enum: low/medium/high/extreme |

#### 3c. Real Estate / Infrastructure
| Field | Notes |
|-------|-------|
| `asset_class` | `office`, `retail`, `industrial`, `residential` |
| `energy_rating` | A–G (EPC) |
| `carbon_intensity_kgco2_m2` | CRREM reference |
| `capex_to_decarbonise_meur` | Retrofit cost estimate |
| `stranding_year` | Year asset exceeds carbon budget |
| `location_flood_risk` | 1–5 score |
| `location_heat_stress_days` | Days >35°C by 2050 |

#### 3d. Technology Disruption
| Field | Notes |
|-------|-------|
| `technology_segment` | e.g. ICE vehicles, gas boilers |
| `adoption_s_curve_midpoint_year` | Inflection point |
| `disruption_probability` | 0.0–1.0 |
| `revenue_at_risk_musd` | |

### Key Outputs
- Stranded value at risk (MEUR) per NGFS scenario
- Residual asset life under 1.5°C / 2°C / 3°C pathways
- Carbon budget alignment (years ahead/behind)
- Stranding probability distribution
- Recommended capex/divestment timing

---

## 4. Nature Risk (TNFD LEAP)

**Route:** `POST /api/v1/nature-risk/assess`
**Frontend:** `/nature-risk`
**DB Tables:** `nature_risk_assessments`, `biodiversity_assessments`, `water_risk_assessments`, `tnfd_leap_assessments`
**Note:** PostGIS not yet implemented — lat/lng stored as floats

### TNFD LEAP Framework Inputs

#### Locate
| Field | Notes |
|-------|-------|
| `site_latitude` | Decimal degrees |
| `site_longitude` | Decimal degrees |
| `site_area_ha` | Operational footprint |
| `biome_type` | IUCN ecosystem classification |
| `country_iso` | |
| `protected_area_overlap` | boolean (WDPA check) |
| `key_biodiversity_area` | boolean (KBA check) |
| `ecosystem_condition_baseline` | 1–5 score |

#### Evaluate — Dependencies & Impacts
| Field | Notes |
|-------|-------|
| `water_abstraction_m3_yr` | Annual withdrawal |
| `water_discharge_m3_yr` | |
| `wastewater_treatment_level` | primary/secondary/tertiary |
| `land_use_change_ha` | Net conversion from natural habitat |
| `soil_disturbance_ha` | |
| `invasive_species_risk` | low/medium/high |
| `pollution_type` | air/water/soil/light/noise |
| `pollution_load_tonnes_yr` | |
| `ghg_emissions_tco2e_yr` | Climate → nature connection |

#### Assess — Dependencies
| Field | Notes |
|-------|-------|
| `ecosystem_services_relied_on` | list: pollination, water purification, timber, etc. |
| `revenue_dependent_on_ecosystem` | MEUR — value at risk if service lost |
| `nature_dependency_score` | 1–5 (TNFD DD metric) |

#### Prepare — Materiality
| Field | Notes |
|-------|-------|
| `materiality_threshold_meur` | Reporting threshold |
| `sbtn_sector` | Science Based Targets for Nature sector |
| `science_target_set` | boolean |

### Key Outputs
- TNFD LEAP assessment report (4 phases)
- Biodiversity footprint (MSA.ha — mean species abundance)
- Water risk score (WRI Aqueduct equivalent)
- Ecosystem service dependency value (MEUR at risk)
- Nature-related financial disclosures (TNFD Table A, B, C)
- BNG (Biodiversity Net Gain) units (England metric)
- SBTN priority action areas

---

## 5. Real Estate Valuation Engine

**Route:** `POST /api/v1/valuation/calculate`
**Frontend:** `/valuation`
**DB Tables:** `valuation_assets`, `unified_valuations`, `method_results`, `esg_adjustments`, `comparable_sales`, `climate_valuation_adjustments`
**Standards:** RICS Red Book, IVSC IVS, CRREM pathways

### Required Inputs — All Methods

| Field | Notes |
|-------|-------|
| `asset_name` | |
| `asset_class` | `office`, `retail`, `industrial`, `residential`, `hotel`, `logistics` |
| `gross_internal_area_m2` | GIA |
| `location` | City / postcode / coordinates |
| `construction_year` | |
| `last_major_refurbishment_year` | |
| `tenure` | `freehold` / `leasehold` |
| `epc_rating` | A–G |
| `breeam_rating` | Outstanding/Excellent/Very Good/Good/Pass/Unclassified |
| `leed_rating` | Platinum/Gold/Silver/Certified/None |

### Income Approach Inputs
| Field | Notes |
|-------|-------|
| `passing_rent_pa_meur` | Current contracted rent |
| `estimated_rental_value_pa_meur` | ERV — market rent |
| `lease_expiry_profile` | JSON: {year: WAULT} |
| `void_rate_pct` | Current vacancy |
| `capex_deferred_meur` | Deferred maintenance |
| `management_fee_pct` | % of gross income |
| `yield_equivalent` | Net initial yield (%) |
| `reversionary_yield` | % |
| `discount_rate` | % IRR target |
| `exit_yield` | Terminal cap rate |
| `hold_period_years` | |

### Cost Approach Inputs
| Field | Notes |
|-------|-------|
| `land_value_meur` | |
| `replacement_cost_meur` | DRC gross |
| `depreciation_pct` | Physical + functional + locational |
| `construction_cost_m2_eur` | RICS BCIS benchmark |

### Sales Comparison Inputs
| Field | Notes |
|-------|-------|
| `comparables` | JSON array: [{address, date, price_eur, gla_m2, epc, notes}] |
| `adjustment_epc` | EUR/m2 per energy band |
| `adjustment_location` | % premium/discount |
| `adjustment_age` | % per decade |

### ESG Adjustment Inputs
| Field | Notes |
|-------|-------|
| `crrem_pathway` | `1.5C` / `2C` / `BAU` |
| `energy_intensity_kwh_m2` | Actual energy use |
| `carbon_intensity_kgco2_m2` | CRREM operational |
| `retrofit_cost_meur` | Cost to reach pathway compliance |
| `stranding_year` | Year building exceeds pathway |
| `green_premium_pct` | Observed green premium vs. brown discount |
| `flood_risk_zone` | 1–5 |
| `heat_stress_score` | 1–5 |
| `sea_level_rise_exposure` | boolean |

### Key Outputs
- Headline valuation (MEUR) per method
- Blended valuation with method weights
- ESG-adjusted valuation (brown discount / green premium applied)
- Climate-adjusted value (flood, heat, stranding risk)
- CRREM alignment status and stranding date
- Sensitivity table: ±50bps yield, ±5% rent
- Valuation certificate narrative (RICS-format)

---

## 6. NGFS Scenario Analysis Engine

**Route:** `POST /api/v1/scenarios/analyze`
**Frontend:** `/scenario-analysis`, `/browser`, `/ngfs`, `/comparison`, `/custom-builder`
**DB Tables:** `analysis_runs_pg`, `ngfs_scenarios`, `scenario_pathways`, `asset_scenario_results`

### Scenario Catalogue (Built-in NGFS v2 Scenarios)

| Code | Name | Temp (2100) |
|------|------|-------------|
| `NZ2050` | Net Zero 2050 | 1.5°C |
| `B2D` | Below 2°C | ~1.8°C |
| `DT` | Delayed Transition | ~1.8°C |
| `DN` | Divergent Net Zero | 1.5°C |
| `NDC` | Nationally Determined Contributions | ~2.5°C |
| `HHW` | Hot House World | ~3°C+ |

### Analysis Inputs

| Field | Notes |
|-------|-------|
| `portfolio_id` | UUID (from `portfolios_pg`) |
| `scenarios` | list of scenario codes (1–6) |
| `time_horizons` | list: [2030, 2040, 2050] |
| `base_year` | int |
| `discount_rate` | % |
| `carbon_price_trajectory` | `ngfs_central` / `iea_step` / custom |
| `physical_risk_model` | `chronic` / `acute` / `combined` |
| `transition_risk_model` | `carbon_cost` / `revenue_shock` / `combined` |
| `sector_filter` | optional list of NACE codes |

### Key Outputs Per Asset/Scenario

| Metric | Unit |
|--------|------|
| Expected Loss (climate-adjusted EL) | MEUR |
| Transition risk exposure | MEUR |
| Physical risk exposure | MEUR |
| Capital charge (climate VaR) | % AUM |
| Climate VaR (95%, 99%) | % AUM |
| Carbon cost impact | MEUR/yr |
| Revenue at risk | MEUR |
| PD uplift | bps |

### Sub-Parameter Analysis
- Carbon price sensitivity (±50 EUR/t)
- GDP shock sensitivity (±2%)
- Interest rate sensitivity (±100bps)
- Temperature pathway sensitivity (±0.5°C)
- Sector-specific shock modelling (energy, real estate, agriculture)

---

## 7. PD Calculator (Credit Risk)

**Route:** `POST /api/v1/analysis/pd`
**Frontend:** `/analysis`, `/sub-analysis`
**DB Tables:** `analysis_runs_pg`, `asset_scenario_results`
**Status:** Partial — PD implemented; LGD/EAD/ECL in ECL module (see §8)

### Required Inputs

| Field | Notes |
|-------|-------|
| `obligor_name` | |
| `sector_nace` | NACE Rev.2 code (e.g. B05.1 = coal) |
| `country_iso` | For sovereign risk overlay |
| `credit_rating` | S&P/Moody's/Fitch: AAA–D |
| `internal_rating` | 1–10 scale if no external rating |
| `financial_year` | |
| `revenue_meur` | |
| `ebitda_margin_pct` | |
| `net_debt_meur` | |
| `interest_coverage_ratio` | EBITDA/Interest |
| `debt_to_equity_ratio` | |
| `current_ratio` | |
| `asset_quality_score` | 1–5 (collateral quality) |

### Climate Overlay Inputs (for climate-adjusted PD)
| Field | Notes |
|-------|-------|
| `carbon_intensity_tco2e_per_meur` | |
| `physical_risk_score` | 1–5 (TCFD: acute + chronic) |
| `transition_risk_score` | 1–5 (policy, technology, market) |
| `ngfs_scenario` | For forward-looking stress |
| `time_horizon` | 2030 / 2040 / 2050 |

### Key Outputs

| Metric | Notes |
|--------|-------|
| PD base (%) | Financial ratios only |
| PD climate-adjusted (%) | + climate risk overlay |
| PD uplift from climate (bps) | Delta |
| Internal rating equivalent | |
| Sector peer comparison | |

---

## 8. ECL + PCAF (Financial Risk)

**Route:** `POST /api/v1/ecl/assess`, `POST /api/v1/pcaf/portfolio`
**Frontend:** `/financial-risk`
**DB Tables:** `ecl_assessments`, `ecl_exposures`, `ecl_scenario_results`, `ecl_climate_overlays`, `pcaf_portfolios`, `pcaf_investees`, `pcaf_results`, `temperature_scores`

### ECL Inputs

| Field | Notes |
|-------|-------|
| `portfolio_name` | |
| `reporting_date` | |
| `ifrs9_stage` | 1 / 2 / 3 |
| `exposures` | JSON array (see below) |

#### Per-Exposure Fields
| Field | Notes |
|-------|-------|
| `obligor_id` | Internal ID |
| `obligor_name` | |
| `sector_nace` | |
| `country_iso` | |
| `ead_meur` | Exposure at Default |
| `lgd_pct` | Loss Given Default (0.0–1.0) |
| `pd_12m_pct` | 12-month PD (Stage 1) |
| `pd_lifetime_pct` | Lifetime PD (Stage 2/3) |
| `maturity_years` | Remaining term |
| `collateral_type` | `unsecured`, `property`, `equipment`, `financial` |
| `collateral_value_meur` | |
| `carbon_intensity_tco2e_per_meur` | For climate overlay |
| `physical_risk_score` | 1–5 |
| `transition_risk_score` | 1–5 |

#### Climate Scenario Overlay
| Field | Notes |
|-------|-------|
| `scenarios` | list: `NZ2050`, `B2D`, `DT`, `HHW` |
| `time_horizon` | 2030 / 2040 / 2050 |
| `pd_stress_factor` | Multiplier on base PD per scenario |

### ECL Outputs

| Metric | Unit |
|--------|------|
| ECL (Stage 1, 12-month) | MEUR |
| ECL (Stage 2, lifetime) | MEUR |
| ECL (Stage 3, credit-impaired) | MEUR |
| Total ECL provision | MEUR |
| Climate-adjusted ECL | MEUR |
| ECL uplift from climate | MEUR |
| Capital charge (8% RWA) | MEUR |
| ECL by sector breakdown | table |

### PCAF Inputs

| Field | Notes |
|-------|-------|
| `portfolio_name` | |
| `asset_class` | `listed_equity`, `corporate_bonds`, `loans`, `project_finance`, `real_estate`, `sovereign` |
| `investees` | JSON array (see below) |

#### Per-Investee Fields
| Field | Notes |
|-------|-------|
| `company_name` | |
| `isin` | optional |
| `sector_nace` | |
| `outstanding_amount_meur` | Loan book / investment value |
| `enterprise_value_meur` | EVIC (listed equity) or total assets (unlisted) |
| `scope1_tco2e` | Reported or estimated |
| `scope2_tco2e` | |
| `scope3_tco2e` | optional |
| `revenue_meur` | For WACI calculation |
| `data_quality_score` | 1–5 (PCAF DQ scale) |
| `emission_source` | `reported`, `estimated`, `proxy`, `default` |

### PCAF Outputs

| Metric | Unit |
|--------|------|
| Financed emissions (Scope 1+2) | tCO2e |
| Financed emissions (Scope 3) | tCO2e |
| WACI (Portfolio) | tCO2e / MEUR invested |
| Weighted DQ score | 1–5 |
| Attribution factor per investee | % |
| Alignment vs. benchmark | tCO2e delta |
| Temperature score (ITR) | °C |
| Paris alignment status | PASS/WATCH/FAIL |

---

## 9. Supply Chain (Scope 3 / SBTi)

**Route:** `POST /api/v1/supply-chain/scope3`, `POST /api/v1/supply-chain/sbti`
**Frontend:** `/supply-chain`
**DB Tables:** `sc_entities`, `scope3_assessments`, `scope3_activities`, `sbti_targets`, `sbti_trajectories`, `emission_factor_library`, `supply_chain_tiers`

### Scope 3 Assessment Inputs

| Field | Notes |
|-------|-------|
| `entity_name` | |
| `reporting_year` | |
| `sector_nace` | |
| `revenue_meur` | |
| `category` | GHG Protocol Scope 3 category (1–15) |
| `activity_data` | JSON: units, quantity, unit_type |
| `emission_factor_id` | From `emission_factor_library` |
| `spend_based_data_meur` | Category 1 spend-based alternative |
| `supplier_reported_emissions` | tCO2e if available |
| `data_quality_tier` | 1–4 (primary/secondary/spend/proxy) |
| `boundary` | `upstream` / `downstream` / `both` |

### SBTi Inputs

| Field | Notes |
|-------|-------|
| `entity_name` | |
| `base_year` | e.g. 2019 |
| `target_year` | e.g. 2030 (near-term) / 2050 (long-term) |
| `scope1_base_tco2e` | |
| `scope2_base_tco2e` | |
| `scope3_base_tco2e` | |
| `sbti_pathway` | `1.5C`, `WB2C`, `2C` |
| `sbti_method` | `absolute_contraction`, `SBT_power_sector`, `intensity_based` |
| `sector` | for sector-specific pathways (power, steel, cement, aviation, etc.) |

### Key Outputs

**Scope 3:**
- Total Scope 3 by category
- Hotspot categories (top 3 by tCO2e)
- Supplier coverage rate (%)
- Data quality score (weighted)
- Reduction levers and cost estimates

**SBTi:**
- Required annual reduction rate (% p.a.)
- 2030 / 2040 / 2050 targets (tCO2e)
- Current trajectory vs. pathway (on-track / off-track)
- Carbon budget remaining (tCO2e)
- Recommended interventions per scope

---

## 10. Sector Assessments

**Route:** `POST /api/v1/sectors/data-centre`, `POST /api/v1/sectors/cat-risk`, `POST /api/v1/sectors/power-plant`
**Frontend:** `/sector-assessments`
**DB Tables:** `data_centre_facilities`, `data_centre_assessments`, `cat_risk_properties`, `cat_risk_assessments`, `power_plants`, `power_plant_assessments`, `power_plant_trajectories`

### 10a. Data Centre Assessment Inputs

| Field | Notes |
|-------|-------|
| `facility_name` | |
| `location` | City / country |
| `total_it_load_mw` | |
| `design_pue` | Power Usage Effectiveness (1.0–3.0) |
| `actual_pue_trailing_12m` | |
| `cooling_system_type` | `air`, `liquid`, `immersion`, `free_cooling` |
| `renewable_energy_pct` | % of electricity from renewables |
| `water_usage_effectiveness` | WUE litres/kWh |
| `carbon_usage_effectiveness` | CUE kgCO2e/kWh IT |
| `grid_carbon_intensity` | gCO2e/kWh — location-based |
| `backup_generator_fuel` | `diesel`, `hvo`, `gas` |
| `server_utilisation_pct` | |
| `physical_risk_flood_score` | 1–5 |
| `physical_risk_heat_score` | 1–5 |

### Key DC Outputs
- Annualised Scope 1+2 emissions (tCO2e)
- EU Taxonomy alignment (Climate Change Mitigation — Data Centres)
- PUE gap vs. best practice (1.2)
- WUE gap vs. benchmark
- Stranding risk year (if grid doesn't decarbonise)
- Efficiency improvement roadmap

### 10b. CAT Risk (Catastrophe) Assessment Inputs

| Field | Notes |
|-------|-------|
| `property_name` | |
| `property_type` | `residential`, `commercial`, `industrial` |
| `latitude`, `longitude` | |
| `construction_year` | |
| `construction_type` | `wood_frame`, `masonry`, `reinforced_concrete`, `steel` |
| `insured_value_meur` | |
| `flood_zone` | FEMA/EU zone |
| `seismic_zone` | PGA (peak ground acceleration) |
| `wind_speed_design` | m/s |
| `wildfire_risk_index` | 1–100 |
| `storm_surge_exposure` | boolean |
| `ssp_scenario` | SSP1-2.6 / SSP2-4.5 / SSP5-8.5 |

### Key CAT Outputs
- Annual Average Loss (AAL) — MEUR
- Probable Maximum Loss (PML 100yr, 250yr) — MEUR
- Expected Shortfall (ES 99%) — MEUR
- Peril decomposition (flood/wind/earthquake/wildfire)
- Climate-adjusted AAL by SSP scenario (2050)
- Insurance adequacy gap (insured vs. modelled loss)

### 10c. Power Plant Assessment Inputs

See §3b above for overlapping inputs, plus:

| Field | Notes |
|-------|-------|
| `grid_connection_kv` | Transmission voltage |
| `heat_rate_mmbtu_per_mwh` | Thermal efficiency |
| `co2_emissions_factor_tco2_per_mwh` | Actual reported |
| `nox_sox_pm_compliance` | boolean (EU IED compliance) |
| `water_withdrawal_m3_per_mwh` | |
| `ngfs_scenario` | For dispatch curve modelling |
| `carbon_price_forecast` | EUR/tCO2e by year |
| `wholesale_power_price_forecast` | EUR/MWh by year |

### Key Power Plant Outputs
- Gross margin per year (power price — fuel cost — carbon cost)
- Break-even carbon price (EUR/tCO2e)
- Zero-crossing year (when plant becomes uneconomic)
- Stranded capex (MEUR)
- Paris alignment (production-weighted emission factor vs. IPCC budget)
- Recommended retirement date per scenario

---

## 11. Regulatory Reporting

**Route:** Multiple — `/api/v1/regulatory/*`
**Frontend:** `/regulatory`
**DB Tables:** `regulatory_entities`, `sfdr_pai_disclosures`, `eu_taxonomy_assessments`, `eu_taxonomy_activities`, `tcfd_assessments`, `csrd_readiness`, `issb_assessments`, `brsr_disclosures`, `sf_taxonomy_alignments`, `regulatory_action_plans`
**CSRD DB Tables:** `csrd_entity_registry`, `csrd_esrs_catalog`, `csrd_kpi_values`, `csrd_gap_tracker`, `csrd_data_lineage`, `csrd_report_uploads`

### 11a. SFDR PAI Disclosures (Article 7 / Annex I)

**Mandatory Principal Adverse Impact Indicators (14)**

| PAI # | Indicator | Unit |
|--------|-----------|------|
| 1 | GHG emissions (Scope 1+2+3) | tCO2e |
| 2 | Carbon footprint | tCO2e / MEUR invested |
| 3 | GHG intensity of investee companies | tCO2e / MEUR revenue |
| 4 | Fossil fuel sector exposure | % portfolio |
| 5 | Non-renewable energy consumption/production | % |
| 6 | Energy consumption intensity (high-impact sectors) | GWh / MEUR revenue |
| 7 | Biodiversity-sensitive area activities | boolean per investee |
| 8 | Emissions to water | tonnes |
| 9 | Hazardous waste ratio | tonnes / MEUR revenue |
| 10 | UNGC/OECD violations | boolean per investee |
| 11 | Lack of UNGC compliance processes | % |
| 12 | Unadjusted gender pay gap | % |
| 13 | Board gender diversity | % female |
| 14 | Controversy exposure (weapons, tobacco, coal) | boolean |

**Per-Investee Required Data:**
- GHG emissions (scope 1/2/3) or proxy
- Revenue and enterprise value (for normalisation)
- Sector classification
- ESG controversy flags
- Board composition
- Wage data (for gender pay gap)
- Biodiversity-sensitive area overlap

### 11b. EU Taxonomy Assessment

| Field | Notes |
|-------|-------|
| `entity_name` | |
| `reporting_year` | |
| `nace_activity_code` | e.g. 4.9 (manufacture of low carbon technologies) |
| `revenue_meur` | Taxonomy-eligible revenue |
| `capex_meur` | Taxonomy-eligible capex |
| `opex_meur` | Taxonomy-eligible opex |
| `substantial_contribution_objective` | 1–6 (climate mitigation, adaptation, water, circular, pollution, biodiversity) |
| `substantial_contribution_criteria_met` | boolean (per technical screening criteria) |
| `dnsh_criteria_met` | JSON — Do No Significant Harm per objective |
| `minimum_social_safeguards` | boolean (UNGC, OECD, ILO) |

**Outputs:** Revenue/Capex/Opex alignment % per objective, aggregate portfolio alignment

### 11c. CSRD — ESRS KPI Extraction

**Via PDF Pipeline:**

| Field | Notes |
|-------|-------|
| `pdf_file` | Annual/sustainability report PDF |
| `entity_name_override` | Optional — corrects auto-detection |
| `reporting_year_override` | Optional |
| `primary_sector` | `financial`, `energy`, `real_estate`, `other` |
| `country_iso` | |

**Extracted ESRS KPIs (330+ data points from ESRS IG3):**

Key mandatory ESRS quantitative disclosures:
- **ESRS E1:** GHG emissions (Scope 1/2/3), energy consumption (total, by source), renewable % (DR E1-4), carbon removal activities, Paris-aligned targets, internal carbon price (E1-7)
- **ESRS E2:** Pollution to air/water/soil, hazardous waste (E2-4/5)
- **ESRS E3:** Water withdrawal, consumption, recycled water (E3-4/5)
- **ESRS E4:** Biodiversity — species affected, ecosystem area changed (E4-4/5)
- **ESRS E5:** Waste by recovery/disposal route (E5-5)
- **ESRS S1:** Female employees (%), gender pay gap, CEO pay ratio, injury rate (S1-6/11/16)
- **ESRS G1:** Fines/penalties (MEUR), anti-corruption training % (G1-4)
- **ESRS 2:** Strategy — climate-related transition plan, scenario analysis (SBM-3)

### 11d. ISSB S1/S2 Inputs (IFRS)

| Field | Notes |
|-------|-------|
| `entity_name` | |
| `reporting_period` | |
| `climate_risks` | JSON: physical (acute/chronic) + transition risks |
| `climate_opportunities` | JSON: resource efficiency, clean energy, markets, resilience |
| `scenario_names` | List of scenarios used (must include ≤1.5°C) |
| `scenario_assumptions` | Temperature, carbon price, policy regime |
| `ghg_scope1_mt` | |
| `ghg_scope2_location_mt` | |
| `ghg_scope2_market_mt` | |
| `ghg_scope3_total_mt` | |
| `ghg_scope3_by_category` | JSON (15 categories) |
| `ghg_removals_mt` | |
| `internal_carbon_price` | USD/tCO2e |
| `transition_plan_adopted` | boolean |
| `paris_aligned_target` | boolean |
| `climate_capex_musd` | Investment in climate solutions |
| `climate_opex_musd` | Costs of climate risk management |

**Outputs:** ISSB S2 disclosure package, scenario analysis tables, GHG protocol reconciliation, cross-reference index to TCFD

---

## 12. Sustainability (GRESB / Ratings)

**Route:** `POST /api/v1/sustainability/assess`
**Frontend:** `/sustainability`
**DB Tables:** `sustainability_assessments`, `gresb_results`, `leed_results`, `breeam_results`, `nabers_results`

### GRESB Real Estate Assessment Inputs

| Field | Notes |
|-------|-------|
| `entity_name` | |
| `portfolio_type` | `standing_investment` / `development` |
| `asset_class` | office / retail / residential / logistics / etc. |
| `reporting_year` | |

**Management Component (30 pts):**
| Field | Notes |
|-------|-------|
| `esg_objectives_set` | boolean |
| `esg_objectives_disclosed` | boolean |
| `board_esg_responsibility` | boolean |
| `esg_performance_linked_remuneration` | boolean |
| `esg_due_diligence_acquisitions` | boolean |
| `supply_chain_esg_requirements` | boolean |
| `stakeholder_engagement_score` | 0–5 |

**Performance Component (70 pts):**
| Field | Notes |
|-------|-------|
| `energy_consumption_mwh` | Total portfolio |
| `energy_coverage_pct` | % of portfolio with measured data |
| `electricity_renewable_pct` | |
| `ghg_scope1_tco2e` | |
| `ghg_scope2_market_tco2e` | |
| `water_consumption_m3` | |
| `water_coverage_pct` | |
| `waste_total_tonnes` | |
| `waste_recycled_pct` | |
| `green_certifications_pct` | % of portfolio with BREEAM/LEED/etc |
| `energy_star_score` | US — if applicable |
| `crrem_pathway_compliance_pct` | |
| `tenant_engagement_score` | 0–5 |

### Key Outputs
- GRESB Score (0–100) and Star Rating (1–5)
- Management score, Performance score
- Sector peer percentile
- Energy/Carbon/Water intensity benchmarks
- GRESB mandatory disclosure items

### Building Rating Inputs (LEED / BREEAM / NABERS / CASBEE / WELL)

| Field | Notes |
|-------|-------|
| `rating_scheme` | `leed_v4`, `breeam_in_use`, `nabers_energy`, `casbee`, `well_v2` |
| `credits_achieved` | JSON: {category: score} |
| `energy_use_kwh_m2` | |
| `water_use_l_person_day` | |
| `iot_monitoring_installed` | boolean |
| `waste_diversion_rate_pct` | |
| `indoor_air_quality_co2_ppm` | |
| `daylight_factor_pct` | |
| `health_and_wellbeing_score` | 0–100 |

---

## 13. Portfolio Analytics Engine

**Route:** `POST /api/v1/portfolio-analytics/analyze`
**Frontend:** `/portfolio-analytics`, `/interactive`
**DB Tables:** `portfolios_pg`, `assets_pg`, `analysis_runs_pg`
**Note:** Currently MOCKED — uses `import random` + `get_sample_portfolios()`. P0 gap to fix.

### Required Inputs (for real implementation)

#### Portfolio Level
| Field | Notes |
|-------|-------|
| `portfolio_id` | UUID from `portfolios_pg` |
| `benchmark_id` | Reference index (MSCI World, Bloomberg Barclays, etc.) |
| `reporting_date` | |
| `base_currency` | EUR / USD / GBP |
| `aum_meur` | Total AUM |
| `sfdr_classification` | Article 6 / 8 / 9 |

#### Per-Asset (from `assets_pg`)
| Field | Notes |
|-------|-------|
| `asset_name` | |
| `isin` | |
| `asset_class` | equity / bond / loan / real_estate / infrastructure |
| `sector_nace` | |
| `country_iso` | |
| `market_value_meur` | |
| `weight_pct` | |
| `duration_years` | bonds |
| `credit_rating` | |
| `scope1_tco2e` | |
| `scope2_tco2e` | |
| `scope3_tco2e` | |
| `revenue_meur` | |
| `enterprise_value_meur` | |
| `pd_base_pct` | |
| `lgd_pct` | |
| `physical_risk_score` | 1–5 |
| `transition_risk_score` | 1–5 |
| `eu_taxonomy_alignment_pct` | Revenue |
| `sbti_target_set` | boolean |
| `controversy_score` | 0–10 |
| `esg_score` | 0–100 |

### Key Outputs

| Metric | Unit |
|--------|------|
| Portfolio WACI | tCO2e / MEUR invested |
| Implied Temperature Rise (ITR) | °C |
| EU Taxonomy alignment | % revenue-weighted |
| SFDR PAI completeness | 14-indicator coverage |
| Climate VaR (95%, 99%) | % AUM |
| Expected Loss (ECL) | MEUR |
| Capital at Risk (CaR) | MEUR |
| Green bond allocation | % |
| Paris alignment | % on-track |
| Sector concentration | % by NACE |
| Country concentration | % by ISO |
| Physical risk exposure | % AUM |
| Transition risk exposure | % AUM |
| Engagement status | per-company flags |
| Performance vs. benchmark | % outperformance |

---

## Data Quality and Coverage Standards

| Standard | Minimum Threshold |
|----------|------------------|
| PCAF DQ Score (portfolio) | < 3.0 (weighted avg) |
| SFDR PAI investee coverage | ≥ 50% per indicator |
| CSRD entity coverage | 100% mandatory ESRS |
| EU Taxonomy eligible revenue | Verified against Delegated Act 2021/2139 |
| NGFS scenario calibration | NGFS Phase 2 (2021) reference |
| GHG Protocol compliance | GHG Protocol Corporate Standard (2015) + PCAF Standard v1.0 |
| ESRS framework version | ESRS Set 1 (Commission Delegated Regulation 2023/2772) |
| ISSB framework version | IFRS S1 / S2 (June 2023, effective 1 Jan 2024) |

---

## API Base URL

Development: `http://localhost:8001`
Health check: `GET http://localhost:8001/api/health`
