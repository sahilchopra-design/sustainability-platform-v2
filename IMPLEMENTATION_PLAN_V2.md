# Sustainability Platform — Enhancement Plan v2
## Data Lineage + FI Coverage Expansion + ESG/Geo/Tech Overlays

---

## Executive Summary

6-chunk implementation adding active cross-module data lineage tracking, reference data catalog, FI coverage expansion (insurance, banking, AM, agriculture), cross-module lineage completion, and ESG/geopolitical/tech factor overlays.

---

## Chunk 1: Data Lineage Service + Reference Data Catalog (FOUNDATION)

### 1A — Data Lineage Service (`services/data_lineage_service.py`)
**Purpose**: Active cross-module dependency tracking with full input→transformation→output chains.

| Aspect | Detail |
|--------|--------|
| **Input Parameters** | source_module (str), source_fields (list[str]), entity_id (str), calculation_id (str), target_module (str) |
| **Transformations** | Dependency graph construction, quality score propagation (DQS 1-5 → confidence 0.3-1.0), gap detection across chains |
| **Engine Logic** | Registry of all 105 services' I/O signatures; directed acyclic graph of module→module data flows; weakest-link quality scoring; automatic gap identification where lineage chain is broken |
| **Output** | LineageChain dataclass: nodes[] (source→transform→output per step), data_quality_score (float), gaps[] (missing links), reference_data_used[], total_chain_length |
| **Stakeholder Insights** | Complete audit trail from raw input to final output; identifies where data quality degrades across modules; shows which modules lack upstream data |
| **Data Lineage** | Self-documenting — the lineage service IS the lineage |
| **Reference Data** | Module registry (I/O schemas), PCAF DQS scale, ESRS data point catalog, existing bridge mappings (PCAF→ECL, CSRD auto-populate, China trade cross-module) |

**Key Classes**:
- `ModuleSignature` — input fields, output fields, reference data deps, quality indicators
- `LineageNode` — module_id, operation, input_fields, output_fields, quality_score, timestamp
- `LineageChain` — ordered list of LineageNode, aggregate quality, gaps
- `LineageGap` — source_module, target_module, missing_fields, severity, remediation
- `DataLineageEngine` — singleton engine: `trace_lineage()`, `find_gaps()`, `get_module_graph()`, `propagate_quality()`

**Module Dependency Graph** (key flows):
```
carbon_calculator → csrd_auto_populate → esrs_kpi_values
carbon_calculator → pcaf_waci_engine → pcaf_ecl_bridge → ecl_climate_engine
scenario_analysis → stress_test_runner → var_calculator
nature_risk → csrd_auto_populate (E4 biodiversity)
supply_chain_scope3 → carbon_calculator (Scope 3)
real_estate_valuation → crrem_stranding → epc_transition
entity360 ← ALL modules (unified profile)
```

### 1B — Reference Data Catalog (`services/reference_data_catalog.py`)
**Purpose**: Centralized registry of all reference/lookup data across the platform.

| Aspect | Detail |
|--------|--------|
| **Input Parameters** | module_id (str, optional), data_domain (str, optional), include_gaps (bool) |
| **Transformations** | Catalog indexing of all reference dicts/constants across 105 services; freshness check; gap identification |
| **Engine Logic** | Scans module reference data registries; maps: data_id → (module, source, records, last_update); identifies stale (>1yr) or missing reference datasets |
| **Output** | ReferenceCatalog: entries[] (CatalogEntry per dataset), total_datasets, coverage_pct, stale_count, missing_critical[] |
| **Stakeholder Insights** | Single view of all reference data across platform; identifies stale/missing datasets; regulatory source traceability |
| **Data Lineage** | Each catalog entry tracks: authoritative source URL, publication date, update frequency, last validation |
| **Reference Data** | Self-referencing — catalogs all reference data |

**Reference Data Categories** (discovered across 105 services):
1. **Emission Factors** (12 services): GHG Protocol scope 1/2/3 EFs, DEFRA conversion factors, IEA grid EF trajectories, methane GWP factors
2. **Financial Parameters** (18 services): Basel III risk weights, NGFS scenario parameters, PD/LGD calibration tables, yield curves, carbon prices
3. **Regulatory Mappings** (15 services): ESRS 330+ DP catalog, ISSB SASB industry metrics, SFDR 18 PAI indicators, EU Taxonomy technical screening criteria
4. **Sector Benchmarks** (9 services): NACE→GICS classification, CDP sector benchmarks, SBTi sector pathways, CRREM decarbonisation curves
5. **Geographic Data** (6 services): Country risk scores, grid emission factors by country, climate vulnerability indices, water stress maps
6. **Entity Master** (4 services): Entity type taxonomy (7 types), sector classification (12 sectors), module registry (10 modules in Entity 360)

### Routes
- `POST /api/v1/lineage/trace` — Build lineage chain for entity+module
- `GET /api/v1/lineage/gaps` — Identify lineage gaps across platform
- `GET /api/v1/lineage/module-graph` — Full module dependency graph
- `GET /api/v1/lineage/quality/{entity_id}` — Quality propagation for entity
- `GET /api/v1/reference-catalog/` — Full reference data catalog
- `GET /api/v1/reference-catalog/{module_id}` — Module-specific reference data
- `GET /api/v1/reference-catalog/gaps` — Missing/stale reference data
- `GET /api/v1/reference-catalog/domains` — Reference data domains

### Tests: 60+ test cases

---

## Chunk 2: FI Coverage — Insurance Risk Engine

### Service: `services/insurance_risk_engine.py`

| LOB | Sub-Module | Input Parameters | Transformations | Output | Stakeholder Insights |
|-----|-----------|-----------------|----------------|--------|---------------------|
| **Life** | Mortality/Longevity | age_cohorts[], mortality_table (WHO/national), climate_stress_scenario | Base mortality × climate adjustment factors (heat stress, air quality, disease vector shift) | adjusted_mortality_rates[], life_expectancy_delta, reserve_impact_eur | Actuaries: climate-adjusted reserving; Board: capital adequacy under climate stress |
| **Life** | Liability Valuation | policy_book (lives, SA, term), discount_curve, longevity_shock_bps | PV of future obligations under base + stressed longevity; ORSA capital calculation | liability_pv_base, liability_pv_stressed, solvency_ratio, capital_buffer_eur | CFO: solvency position; Regulator: ORSA compliance |
| **P&C** | Nat-Cat Exposure | asset_locations[], hazard_type (flood/storm/wildfire/drought), return_period_years | Frequency-severity modeling under NGFS climate scenarios; exposure aggregation by geography | expected_annual_loss, PML_100yr, PML_250yr, concentration_risk[], tail_VaR | Underwriting: pricing adequacy; CRO: aggregation limits |
| **P&C** | Climate Loss Frequency | historical_claims[], warming_scenario_c, hazard_types[] | Trend extrapolation + climate multiplier per hazard (IPCC AR6 damage functions) | loss_freq_base, loss_freq_stressed, loss_ratio_impact_pct, combined_ratio_delta | Actuaries: reserve adequacy; Strategy: product line profitability under warming |
| **P&C** | Underwriting Risk | portfolio_mix (LOB%), loss_triangles, expense_ratios | Combined ratio decomposition; climate-adjusted technical pricing | technical_price_adequacy_pct, risk_margin, diversification_benefit_pct | Underwriting: pricing signals; CFO: profitability outlook |
| **Reinsurance** | Retrocession Chain | ceded_premiums, retention_levels[], retro_layers[] | Layer-by-layer aggregation; cascade failure under extreme scenarios | net_retention_eur, retro_exhaustion_prob, counterparty_credit_risk | CRO: cascade risk; Treasury: capital optimisation |
| **Health** | Medical Trend | claim_cost_per_member, trend_rate_pct, pandemic_scenario | Medical CPI inflation + climate-health overlay (heat/pollution-driven morbidity) | projected_claim_cost_3yr, pandemic_surge_pct, premium_adequacy_ratio | Product: pricing review; Actuaries: IBNR adequacy |

**Reference Data Required**:
- WHO mortality tables, national life tables
- Munich Re NatCatSERVICE loss data (or synthetic equivalents)
- IPCC AR6 damage functions per hazard
- Solvency II standard formula parameters
- ICD-10 climate-health linkage codes

**Data Lineage**: Policy data → actuarial model → climate adjustment → stressed output → ORSA/Solvency II capital → regulatory reporting

---

## Chunk 3: FI Coverage — Banking Risk Expansion

### Service: `services/banking_risk_engine.py`

| LOB | Sub-Module | Input Parameters | Transformations | Output | Stakeholder Insights |
|-----|-----------|-----------------|----------------|--------|---------------------|
| **Retail** | AML/KYC Risk | customer_id, transaction_patterns, jurisdiction, pep_status | Rule-based + risk scoring (geography, product, customer type, transaction anomaly) | aml_risk_score (1-10), kyc_status, enhanced_dd_required, risk_factors[] | Compliance: screening prioritisation; Board: regulatory risk exposure |
| **Corporate** | Funding Risk (NSFR) | asset_book (maturity profile), liability_book, off_balance_sheet | Available stable funding / Required stable funding per Basel III factors | nsfr_ratio, asf_total, rsf_total, maturity_mismatch_gaps[], stress_nsfr | Treasury: funding stability; Regulator: Basel III compliance |
| **Corporate** | Large Exposure | counterparty_exposures[], cet1_capital, group_connections | Exposure aggregation by connected party group; limit monitoring (25% CET1) | exposure_by_group[], utilisation_pct, breaches[], concentration_hhi | Credit: limit monitoring; CRO: concentration risk |
| **Trade Finance** | SC Climate Risk | trade_routes[], commodity_types[], origin_countries[] | Supply chain disruption probability under climate scenarios; CBAM tariff passthrough | disruption_prob_by_route, cbam_cost_passthrough_eur, alternative_routes[], resilience_score | Trade desk: pricing adjustments; Strategy: market opportunity |
| **Treasury** | IRRBB | rate_sensitive_assets[], rate_sensitive_liabilities[], gap_analysis | Duration gap, EVE sensitivity, NII repricing under +/-200bp parallel shifts | eve_delta_eur, nii_at_risk_eur, duration_gap_years, repricing_schedule[] | ALM: hedging strategy; CFO: earnings stability |
| **OpRisk** | Climate OpRisk | operational_events[], climate_hazard_exposure, business_continuity_plans | OpRisk event taxonomy mapping to climate drivers; scenario loss estimation | oprisk_capital_climate_adj_eur, top_climate_op_risks[], bc_gaps[], ilo_frequency_delta | CRO: operational resilience; Board: climate-related op risk appetite |
| **Liquidity** | LCR Enhancement | hqla_stock, net_cash_outflows_30d, climate_stress_outflows | LCR calculation with climate stress overlay (deposit run-off, credit line drawdown) | lcr_ratio, lcr_stressed, hqla_composition[], outflow_buckets[], climate_buffer_needed | Treasury: liquidity buffer; Regulator: LCR compliance |

**Reference Data Required**:
- Basel III NSFR/LCR factors (CRR2 Art 428a-428ai)
- FATF country risk ratings
- EBA large exposure framework
- EBA IRRBB guidelines (GL/2022/14)
- Basel II OpRisk event type taxonomy

**Data Lineage**: Loan book → exposure aggregation → risk parameter calibration → regulatory ratio → stress scenario → capital requirement → regulatory report

---

## Chunk 4: FI Coverage — Asset Management + Agriculture

### 4A — Asset Management Engine (`services/am_engine.py`)

| LOB | Sub-Module | Input Parameters | Output | Stakeholder Insights |
|-----|-----------|-----------------|--------|---------------------|
| **Active Equity** | ESG Attribution | portfolio_holdings[], benchmark_id, factor_model (Fama-French + ESG) | esg_alpha_bps, factor_contributions{}, selection_effect, allocation_effect | PM: ESG value-add proof; CIO: strategy validation |
| **Active Equity** | Paris Alignment Tracker | holdings[], target_pathway (1.5C/2.0C), base_year | portfolio_temperature_c, alignment_gap_pct, laggard_holdings[], trajectory_chart | PM: alignment progress; Compliance: Article 9 fund mandate |
| **Fixed Income** | Green Bond Screening | bond_universe[], icma_gbs_criteria, taxonomy_alignment | eligible_bonds[], greenium_bps, use_of_proceeds_breakdown, dnsh_flags[] | PM: eligible universe; Risk: greenwashing detection |
| **Fixed Income** | Climate-Adjusted Spreads | issuer_financials[], sector, transition_risk_score | spread_base_bps, spread_climate_adj_bps, spread_delta_bps, migration_prob | PM: relative value; Risk: credit migration under climate stress |
| **Multi-Asset** | LP Analytics | fund_aum, investor_base[], redemption_terms, side_pockets | liquidity_coverage_ratio, investor_concentration_hhi, redemption_stress_pct | COO: liquidity management; IR: investor communication |
| **Multi-Asset** | ESG-Constrained Optimization | holdings[], constraints (exclusion/tilt/integration), risk_budget | optimal_weights[], tracking_error_vs_benchmark, esg_score_improvement, return_drag_bps | CIO: portfolio construction; PM: implementation signals |

### 4B — Agriculture Risk Engine (`services/agriculture_risk_engine.py`)

| LOB | Sub-Module | Input Parameters | Output | Stakeholder Insights |
|-----|-----------|-----------------|--------|---------------------|
| **Crop Finance** | Weather-Indexed Risk | crop_type, region, historical_yields[], climate_scenario | yield_volatility_pct, drought_prob, flood_prob, insurance_premium_base, parametric_trigger | Lender: collateral adequacy; Insurer: pricing signal |
| **Crop Finance** | EUDR Compliance | supply_chain_origins[], commodity (soy/palm/cocoa/coffee/rubber/cattle/wood), geolocation_data | deforestation_risk_score, compliance_status, due_diligence_gaps[], remediation_cost_eur | Compliance: EUDR readiness; Procurement: supplier screening |
| **Livestock** | Methane Intensity | herd_size, breed, feed_system, region | methane_tco2e, intensity_kg_per_head, abatement_options[], cost_per_tco2e_abated | ESG: emissions reporting; Strategy: decarbonisation pathway |
| **Livestock** | Disease Outbreak | herd_value_eur, biosecurity_score, regional_disease_history | outbreak_prob_annual, economic_loss_scenario_eur, insurance_gap_eur, supply_disruption_days | Risk: exposure quantification; Treasury: contingency planning |
| **Land Use** | Soil Carbon | land_area_ha, soil_type, current_practice, target_practice | carbon_stock_tco2, sequestration_rate_tco2_yr, credit_revenue_potential_eur, permanence_risk | Finance: carbon credit revenue; ESG: nature-positive metrics |
| **Land Use** | Biodiversity Net Gain | site_area_ha, baseline_habitat_units, development_plan | habitat_units_pre, habitat_units_post, net_gain_pct, bng_credits_required, cost_eur | Developer: planning compliance; Investor: nature risk exposure |

**Reference Data Required**:
- FAO crop yield databases, FAOSTAT emission factors
- EU Deforestation Regulation (2023/1115) commodity criteria
- IPCC Agriculture Guidelines (2019 Refinement)
- Natural England BNG metric 4.0
- Weather index trigger definitions (WMO standards)

---

## Chunk 5: Cross-Module Data Lineage Completion

### Service: `services/lineage_orchestrator.py`

**Purpose**: Wire ALL 105 services into the data lineage graph; fill gaps; identify required reference data.

**Activities**:
1. **Register all module I/O signatures** — Input/output field names and types for each of 105 services
2. **Build complete dependency graph** — Directed acyclic graph of all module→module data flows
3. **Wire existing bridges into lineage** — PCAF→ECL, CSRD auto-populate (56 mappings), China trade (6 bridges), Entity 360 (10 modules)
4. **Quality score propagation** — DQS flows through chains; weakest-link flagging at each node
5. **Fill lineage gaps** — Insert missing entries for undocumented module connections
6. **Reference data gap analysis** — For each broken chain, identify what reference data would complete it
7. **Audit integration** — Connect lineage events to existing audit_log middleware

**Reference Data Required to Complete Lineage**:

| Category | Dataset | Source | Used By (Modules) | Status |
|----------|---------|--------|--------------------|--------|
| Emission Factors | GHG Protocol Scope 1 EFs | IPCC 2006/2019 | carbon_calculator, supply_chain_scope3 | Embedded |
| Emission Factors | DEFRA conversion factors | UK DEFRA annual | carbon_calculator_v2 | Embedded |
| Emission Factors | IEA grid EF by country | IEA annual | carbon_calculator, pcaf_waci | Embedded |
| Financial | NGFS scenario parameters | ECB/NGFS Phase IV | scenario_analysis, stress_test | Embedded |
| Financial | Basel III risk weights | CRR2/CRD V | pd_calculator, ecl_climate | Embedded |
| Financial | PD/LGD calibration tables | Internal | pd_calculator, lgd_calculator | Embedded |
| Regulatory | ESRS DP catalog (330+ DPs) | EFRAG IG3 | csrd_auto_populate, esrs KPI store | Embedded (migration 014) |
| Regulatory | ISSB SASB industry metrics | IFRS Foundation | issb modules | Embedded (migration 015) |
| Regulatory | SFDR PAI indicators (18) | SFDR RTS | sfdr_report_generator | Embedded |
| Regulatory | EU Taxonomy TSC | EU Commission | gar_calculator, taxonomy routes | Embedded |
| Sector | NACE→GICS mapping | Eurostat/MSCI | entity360, sector classification | Embedded |
| Sector | SBTi sector pathways | SBTi | supply_chain_scope3 | Embedded |
| Sector | CRREM decarbonisation curves | CRREM v2.0 | crrem_stranding_engine | Embedded |
| Geographic | Country risk scores | Various | china_trade, geopolitical | Embedded |
| Geographic | Water stress maps | WRI Aqueduct | nature_risk_calculator | Seed data |
| Entity | LEI registry structure | GLEIF | entity360, counterparty master | Schema only |
| **MISSING** | Insurance mortality tables | WHO/national | insurance_risk_engine (NEW) | **Needed** |
| **MISSING** | NatCat loss data | Munich Re/Swiss Re | insurance_risk_engine (NEW) | **Needed** |
| **MISSING** | IPCC AR6 damage functions | IPCC WG2 | insurance_risk_engine (NEW) | **Needed** |
| **MISSING** | Basel III NSFR/LCR factors | CRR2 | banking_risk_engine (NEW) | **Needed** |
| **MISSING** | FATF country risk ratings | FATF | banking_risk_engine (NEW) | **Needed** |
| **MISSING** | FAO crop yield DB | FAOSTAT | agriculture_risk_engine (NEW) | **Needed** |
| **MISSING** | EUDR commodity criteria | EU 2023/1115 | agriculture_risk_engine (NEW) | **Needed** |
| **MISSING** | BNG metric 4.0 | Natural England | agriculture_risk_engine (NEW) | **Needed** |

---

## Chunk 6: ESG/Geopolitical/Tech Factor Overlays

### Service: `services/factor_overlay_engine.py`

**Purpose**: Cross-cutting overlay engine adding ESG, geopolitical, and technology dimensions to existing analytics.

| User Type | LOB | Current Module | Overlay Dimension | New Insight |
|-----------|-----|---------------|-------------------|-------------|
| Bank — Credit | Corporate Lending | ecl_climate_engine | ESG: transition risk PD uplift; Geo: sovereign risk passthrough; Tech: automation disruption score | Climate-adjusted ECL with country and tech risk overlays |
| Bank — Treasury | ALM | scenario_analysis | ESG: green bond premium curve; Geo: FX climate correlation; Tech: fintech disruption to NIM | Forward-looking ALM with ESG/macro overlays |
| Bank — Compliance | Regulatory | csrd modules | ESG: automated gap closure; Geo: cross-jurisdiction mapping; Tech: AI assurance confidence | Multi-jurisdiction regulatory readiness |
| Insurer — UW | P&C | insurance_risk (NEW) | ESG: biodiversity loss → nat-cat freq; Geo: supply chain → BI claims; Tech: parametric pricing | Climate-adjusted technical pricing |
| Insurer — Actuarial | Life | insurance_risk (NEW) | ESG: air quality → mortality; Geo: migration patterns; Tech: medical advancement | Climate-adjusted life reserves |
| AM — PM | Equity | portfolio_analytics | ESG: alpha decomposition; Geo: tariff impact by holding; Tech: AI adoption scoring | ESG-attributed performance |
| AM — Risk | Multi-Asset | var_calculator | ESG: climate VaR overlay; Geo: country concentration; Tech: stranded asset filter | Enhanced risk reporting |
| PE — Deals | Buyout | pe_deal_engine | ESG: carbon reduction → valuation uplift; Geo: political stability; Tech: digital readiness | ESG-integrated deal scoring |
| RE — Valuations | Commercial | valuation_engine | ESG: green premium %; Geo: climate zone adjustment; Tech: smart building score | Enhanced property valuation |
| Energy — Strategy | Generation | generation_transition | ESG: methane abatement curve; Geo: energy independence; Tech: H2 blending economics | Transition pathway optimisation |
| Agriculture — Finance | Crop/Livestock | agriculture_risk (NEW) | ESG: deforestation-free cert; Geo: food security index; Tech: precision ag adoption | Sustainable agriculture finance |
| Geopolitical — Advisory | Trade | china_trade_engine | ESG: carbon border alignment; Geo: sanctions cascade; Tech: supply chain digitisation | Integrated trade risk |

---

## Documentation Standard (per service)

Every service includes:
1. **Module Docstring**: Purpose, data flow, key references
2. **Input Parameters**: All fields with types, units, valid ranges, defaults
3. **Transformations**: Step-by-step data processing logic with formulas
4. **Calculation Engine Logic**: Weights, thresholds, regulatory references (article/paragraph)
5. **Output Results**: All output fields with types, units, interpretation guide
6. **Stakeholder Insights**: What each FI type / LOB learns from the output
7. **Data Lineage**: Complete chain from raw input → transformations → final output
8. **Reference Data**: All lookup tables, constants, external sources with publication dates
9. **FI Type × LOB Matrix**: Which financial institution types and LOBs benefit

---

## Implementation Order

| Chunk | Scope | New Services | New Routes | Est. Tests |
|-------|-------|-------------|-----------|------------|
| 1 | Data Lineage + Ref Catalog | 2 | 2 | 60+ |
| 2 | Insurance Risk Engine | 1 | 1 | 50+ |
| 3 | Banking Risk Expansion | 1 | 1 | 50+ |
| 4 | AM + Agriculture Engines | 2 | 2 | 60+ |
| 5 | Lineage Orchestrator | 1 | 0 (extends Chunk 1 routes) | 40+ |
| 6 | Factor Overlay Engine | 1 | 1 | 50+ |

**Total**: 8 new services, 7 new route files, 310+ new tests
