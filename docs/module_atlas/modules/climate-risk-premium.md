# Climate Risk Premium
**Module ID:** `climate-risk-premium` · **Route:** `/climate-risk-premium` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies the additional return premium demanded by investors for bearing climate-related financial risks across asset classes. Decomposes climate risk premium into physical risk, transition risk, and climate policy uncertainty components using factor model regression across equity, credit, and real asset markets.

> **Business value:** The climate risk premium is foundational for climate-adjusted asset valuation and portfolio construction. Understanding whether climate risk is priced by markets determines whether climate-aware portfolios earn alpha or simply reflect rational risk compensation, with direct implications for TCFD risk and opportunity disclosure.

**How an analyst works this module:**
- Select asset class and climate risk factor decomposition
- View factor loading β estimates for physical, transition, and policy uncertainty
- Compare climate risk premium across sectors and geographies
- Use premium estimates for climate-adjusted discount rate in DCF valuations

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_INTENSITY_SCATTER`, `CDS_DATA`, `CLIMATE_FACTORS`, `DEFAULT_HISTORY`, `EDF_DATA`, `EL_TABLE`, `FACTOR_CORR`, `FACTOR_RETURNS_MONTHLY`, `GEOGRAPHIES`, `GREENIUM_BY_RATING`, `GREENIUM_BY_YEAR`, `ISSUERS`, `ISSUER_NAMES_BASE`, `ISSUER_TYPES`, `KpiCard`, `OAS_TIME_SERIES`, `PEER_BANKS`, `RATINGS`, `RATING_OAS_SERIES`, `SCENARIO_SECTOR_3YR`, `SCENARIO_SPREADS`, `SECTORS`, `SPREAD_HISTOGRAM`, `SPREAD_VOL_SERIES`, `Sel`, `TABS`, `TERM_STRUCTURE`, `ZSCORE_DATA`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CLIMATE_FACTORS` | 5 | `name`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `GEOGRAPHIES` | `['US','EU','UK','Asia-Pac','EM','Japan','Canada','Australia'];` |
| `ISSUERS` | `ISSUER_NAMES_BASE.slice(0, 200).map((name, i) => {` |
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `rating` | `RATINGS[Math.floor(sr(i * 11) * RATINGS.length)];` |
| `geography` | `GEOGRAPHIES[Math.floor(sr(i * 13) * GEOGRAPHIES.length)];` |
| `issuerType` | `ISSUER_TYPES[Math.floor(sr(i * 17) * ISSUER_TYPES.length)];` |
| `maturity` | `1 + Math.floor(sr(i * 19) * 29);` |
| `totalSpread` | `30 + sr(i * 23) * 470;` |
| `physRiskScore` | `5 + sr(i * 29) * 85;` |
| `transRiskScore` | `5 + sr(i * 31) * 85;` |
| `physPremium` | `Math.max(0, totalSpread * (physRiskScore / 100) * (sr(i * 37) * 0.35 + 0.05));` |
| `transPremium` | `Math.max(0, totalSpread * (transRiskScore / 100) * (sr(i * 41) * 0.40 + 0.05));` |
| `residualPremium` | `Math.max(0, totalSpread - physPremium - transPremium);` |
| `basePD` | `0.001 + sr(i * 43) * 0.08;` |
| `climatePD` | `basePD * (1 + transRiskScore / 100 * 0.5);` |
| `carbonBeta` | `(physRiskScore * 0.4 + transRiskScore * 0.6) / 100;` |
| `greenBondPremium` | `sr(i * 47) > 0.7 ? -(sr(i * 53) * 15) : 0;` |
| `sectorBeta` | `0.5 + sr(i * 59) * 1.5;` |
| `issuanceYear` | `2015 + Math.floor(sr(i * 61) * 10);` |
| `lgd` | `0.20 + sr(i * 73) * 0.60;` |
| `ead` | `10 + sr(i * 79) * 490;` |
| `esgScore` | `10 + sr(i * 83) * 85;` |
| `spreadZ` | `(sr(i * 89) * 6) - 3;` |
| `climateAdjCDS` | `20 + sr(i * 97) * 280;` |
| `coupon` | `2 + sr(i * 101) * 6;` |
| `base` | `-(2 + sr(i * 17) * 12);` |
| `TERM_STRUCTURE` | `RATINGS.map((rating, ri) =>` |
| `baseSpread` | `sr(ri * 31 + mat * 7) * 300 + 30;` |
| `physComp` | `baseSpread * (0.15 + sr(ri * 31 + mat * 7 + 2) * 0.2);` |
| `transComp` | `baseSpread * (0.10 + sr(ri * 31 + mat * 7 + 4) * 0.18);` |
| `RATING_OAS_SERIES` | `RATINGS.map((r, ri) =>` |
| `EDF_DATA` | `ISSUERS.slice(0, 60).map((x, i) => ({` |
| `CARBON_INTENSITY_SCATTER` | `ISSUERS.slice(0, 80).map((x, i) => ({` |
| `SCENARIO_SPREADS` | `SECTORS.map((s, si) => {` |
| `GREENIUM_BY_RATING` | `RATINGS.map((r, ri) => {` |
| `avgGreenium` | `greenIssuers.length ? greenIssuers.reduce((a, x) => a + x.greenBondPremium, 0) / greenIssuers.length : 0;` |
| `SCENARIO_SECTOR_3YR` | `SECTORS.map((s, si) => ({` |
| `CDS_DATA` | `ISSUERS.slice(0, 40).map((x, i) => ({` |
| `EL_TABLE` | `SECTORS.map((s, si) => {` |
| `avgPD` | `sub.reduce((a, x) => a + x.climatePD, 0) / n;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-risk/physical/assess` | `assess_physical_risk` | api/v1/routes/climate_risk.py |
| POST | `/api/v1/climate-risk/transition/assess` | `assess_transition_risk` | api/v1/routes/climate_risk.py |
| POST | `/api/v1/climate-risk/integrated/assess` | `assess_integrated_risk` | api/v1/routes/climate_risk.py |
| GET | `/api/v1/climate-risk/methodologies` | `list_methodologies` | api/v1/routes/climate_risk.py |
| POST | `/api/v1/climate-risk/methodologies` | `create_methodology` | api/v1/routes/climate_risk.py |
| GET | `/api/v1/climate-risk/methodologies/{methodology_id}` | `get_methodology` | api/v1/routes/climate_risk.py |
| PATCH | `/api/v1/climate-risk/methodologies/{methodology_id}` | `update_methodology` | api/v1/routes/climate_risk.py |
| POST | `/api/v1/climate-risk/methodologies/{methodology_id}/publish` | `publish_methodology` | api/v1/routes/climate_risk.py |
| POST | `/api/v1/climate-risk/methodologies/{methodology_id}/retire` | `retire_methodology` | api/v1/routes/climate_risk.py |
| POST | `/api/v1/climate-risk/methodologies/{methodology_id}/archive` | `archive_methodology` | api/v1/routes/climate_risk.py |
| POST | `/api/v1/climate-risk/methodologies/{methodology_id}/clone` | `clone_methodology` | api/v1/routes/climate_risk.py |
| GET | `/api/v1/climate-risk/methodologies/{methodology_id}/export` | `export_methodology` | api/v1/routes/climate_risk.py |
| POST | `/api/v1/climate-risk/methodologies/import` | `import_methodology` | api/v1/routes/climate_risk.py |
| GET | `/api/v1/climate-risk/methodologies/{id_a}/diff/{id_b}` | `diff_methodologies` | api/v1/routes/climate_risk.py |
| GET | `/api/v1/climate-risk/templates` | `list_templates` | api/v1/routes/climate_risk.py |
| POST | `/api/v1/climate-risk/assessments/run` | `run_assessment` | api/v1/routes/climate_risk.py |
| GET | `/api/v1/climate-risk/assessments` | `list_runs` | api/v1/routes/climate_risk.py |
| GET | `/api/v1/climate-risk/assessments/{run_id}` | `get_run` | api/v1/routes/climate_risk.py |
| GET | `/api/v1/climate-risk/assessments/{run_id}/drill-down` | `drill_down` | api/v1/routes/climate_risk.py |
| DELETE | `/api/v1/climate-risk/assessments/{run_id}/cancel` | `cancel_run` | api/v1/routes/climate_risk.py |
| POST | `/api/v1/climate-risk/reports/generate` | `generate_report` | api/v1/routes/climate_risk.py |

### 2.3 Engine `assessment_methodology_manager` (services/assessment_methodology_manager.py)
| Function | Args | Purpose |
|---|---|---|
| `Methodology.to_dict` |  |  |
| `Methodology.from_dict` | d |  |
| `_config_from_dict` | d |  |
| `_validate_config` | config | Raise MethodologyValidationError if config is invalid. |
| `_make_template` | name, description, template_name, target_sectors, config |  |
| `_build_templates` |  |  |
| `AssessmentMethodologyManager.list_templates` |  | Return all 9 pre-calibrated templates. |
| `AssessmentMethodologyManager.get_template` | template_name | Fetch a template by its slug name. |
| `AssessmentMethodologyManager.create_draft` | name, description, config, created_by, target_sectors | Create a new DRAFT methodology after validating config. |
| `AssessmentMethodologyManager.get` | methodology_id |  |
| `AssessmentMethodologyManager.list_all` | status, sector, include_templates |  |
| `AssessmentMethodologyManager.update_draft` | methodology_id, updates, changed_by | Update fields on a DRAFT methodology. 'updates' keys: name, description, target_sectors, config (MethodologyConfig dict) |
| `AssessmentMethodologyManager.publish` | methodology_id, approved_by | Transition DRAFT → PUBLISHED. Increments version. |
| `AssessmentMethodologyManager.retire` | methodology_id, retired_by, reason | Transition PUBLISHED → RETIRED. |
| `AssessmentMethodologyManager.archive` | methodology_id, archived_by | Transition RETIRED → ARCHIVED. |
| `AssessmentMethodologyManager.clone` | source_id, new_name, cloned_by | Clone any methodology (including templates) to a new DRAFT. |
| `AssessmentMethodologyManager.diff` | id_a, id_b | Return field-level diff between two methodology configs. Returns: {field_path: {a: old, b: new}} |
| `AssessmentMethodologyManager.export_json` | methodology_id |  |
| `AssessmentMethodologyManager.import_json` | json_str, imported_by, override_status | Import a methodology from JSON. Always creates a DRAFT (override_status=True). |
| `AssessmentMethodologyManager._get_mutable` | methodology_id |  |
| `_deep_diff` | a, b, path, result |  |
| `get_manager` | db_session | Return a manager instance. Pass db_session for DB-backed mode. |

### 2.3 Engine `assessment_runner` (services/assessment_runner.py)
| Function | Args | Purpose |
|---|---|---|
| `AssessmentRunner.run_assessment` | run_config | Execute a full assessment run synchronously. Returns AssessmentRunResult with all entity scores. |
| `AssessmentRunner.run_batch` | run_configs | Execute multiple runs sequentially (parallel via Celery when available). |
| `AssessmentRunner.get_run` | run_id |  |
| `AssessmentRunner.list_runs` | status, methodology_id, limit |  |
| `AssessmentRunner.cancel_run` | run_id |  |
| `AssessmentRunner._score_entity` | entity, config, scenario, time_horizon, scope, depth | Score a single entity + optionally recurse into children. |
| `AssessmentRunner._build_physical_inputs` | entity, config, scenario, horizon |  |
| `AssessmentRunner._build_transition_inputs` | entity, config, scenario, horizon |  |
| `AssessmentRunner._extract_physical_score` | raw |  |
| `AssessmentRunner._extract_transition_score` | raw |  |
| `AssessmentRunner._integrate_scores` | phys_score, trans_score, config, scenario, entity | Combine physical + transition scores per integration config. |
| `AssessmentRunner._build_portfolio_aggregate` | results, config, scenarios, time_horizons | Build portfolio-level summary across all entities. |
| `AssessmentRunner._build_delta_report` | previous, current, threshold |  |
| `get_runner` | db_session |  |

### 2.3 Engine `climate_integrated_risk` (services/climate_integrated_risk.py)
| Function | Args | Purpose |
|---|---|---|
| `ClimateIntegratedRisk._validate_config` |  | Validate configuration parameters and raise on invalid values. |
| `ClimateIntegratedRisk.compute_interaction_term` | physical_score, transition_score | Compute the interaction term between physical and transition risk. The interaction captures the compounding effect when both risk types are elevated simultaneously (e.g., a stranded-asset holder in a flood-prone region). |
| `ClimateIntegratedRisk.compute_nature_amplifier` | sector, lat, lon | Compute nature-risk amplifier based on sector ecosystem dependency. Uses ENCORE-aligned sensitivity factors. The *lat/lon* parameters are reserved for future spatial lookups (e.g., proximity to biodiversity hotspots) but are not used in this version. |
| `ClimateIntegratedRisk.weight_scenarios` | scenario_scores | Weight per-scenario integrated scores into a single number. Returns: Weighted average integrated score (0-100). |
| `ClimateIntegratedRisk.integrate` | physical_result, transition_result, sector, lat, lon | Integrate one physical + transition result pair into a single score. Parameters: physical_result: PhysicalRiskResult from the physical risk engine. transition_result: TransitionRiskResult from the transition risk engine. sector: Sector key for nature-risk amplifier lookup. lat: Latitude (reserved for future spatial lookups). lon: Longitude (reserved for future spatial lookups). Returns: Integrated |
| `ClimateIntegratedRisk.integrate_multi_scenario` | physical_results, transition_results, sector, lat, lon | Integrate across multiple scenarios and apply scenario weighting. Matches physical and transition results by scenario name, integrates each pair, then applies the configured scenario-weighting method to produce a single blended result. Parameters: physical_results: List of PhysicalRiskResult (one per scenario). transition_results: List of TransitionRiskResult (one per entity; each contains per-sce |
| `ClimateIntegratedRisk.score_to_rating` | score | Convert a 0-100 integrated risk score to a human-readable rating. Thresholds: < 20 Very Low < 40 Low < 60 Medium < 80 High >= 80 Very High |

### 2.3 Engine `climate_physical_risk_engine` (services/climate_physical_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PhysicalRiskEngine._validate_config` |  | Validate configuration ranges and constraints. |
| `PhysicalRiskEngine._build_hazard_weights` |  | Build normalised hazard weight vector from config or defaults. |
| `PhysicalRiskEngine._get_active_hazards` |  | Return hazard types enabled by the inclusion mask (all if empty). |
| `PhysicalRiskEngine.assess_hazard` | hazard_type, asset_lat, asset_lon, scenario, time_horizon | Compute a normalised hazard score for one hazard at one location. Without real CMIP6 grid data the engine uses deterministic proxy formulas based on latitude bands, scenario severity, and time-horizon progression. |
| `PhysicalRiskEngine._latitude_intensity` | hazard_type, lat, lon | Deterministic latitude-band intensity proxy for a hazard type. |
| `PhysicalRiskEngine._time_horizon_factor` | horizon, category | Interpolate time horizon scaling factor. |
| `PhysicalRiskEngine.assess_exposure` | asset_value, asset_type, lat, lon, hazard_type | Compute exposure score for an asset against a specific hazard. Exposure = asset_value * exposure_fraction * concentration_factor |
| `PhysicalRiskEngine._base_exposure_fraction` | hazard_type, lat, lon | Proxy exposure fraction based on hazard type and location. |
| `PhysicalRiskEngine.assess_vulnerability` | sector, hazard_type, building_age_years, elevation_m, has_adaptation | Compute vulnerability for a sector-hazard pair with modifiers. Vulnerability = base * modifiers * (1 - adaptation) * cascading |
| `PhysicalRiskEngine.compute_damage` | hazard_score, exposure, vulnerability, hazard_type | Compute damage for one hazard using the configured damage function. CVaR contribution = H * E_frac * V * DamageFunc(H*E_frac*V) * weight * (1 + business_interruption_multiplier) |
| `PhysicalRiskEngine._apply_damage_function` | combined_score, hazard_type | Dispatch to the configured damage curve type. Returns 0-1 damage ratio. |
| `PhysicalRiskEngine._sigmoid` | x, midpoint, steepness | Standard logistic sigmoid normalised to [0, 1]. |
| `PhysicalRiskEngine._step_function` | x, thresholds, values | Step (piecewise-constant) damage function. |
| `PhysicalRiskEngine._compute_physical_cvar` | damage_results, asset_value, time_horizon | Compute aggregate physical Climate-Value-at-Risk for one entity. CVaR = asset_value * Sum(cvar_contributions) * discount_factor |
| `PhysicalRiskEngine.assess_entity` | entity_id, entity_name, entity_type, sector, asset_value, lat, lon, scenario | Run the full 5-stage pipeline for a single entity. Parameters ---------- entity_id, entity_name : str Identifiers for the entity being assessed. entity_type : str One of ``asset``, ``security``, ``fund``, ``portfolio``. sector : str Sector name matching :data:`SECTOR_VULNERABILITY_MATRIX` keys. asset_value : float Monetary value used for exposure (EUR). lat, lon : float Geographic coordinates. sce |
| `PhysicalRiskEngine.assess_portfolio` | entities, scenario, time_horizon | Assess physical risk for a portfolio of entities. Parameters ---------- entities : list[dict] Each dict must contain keys matching :meth:`assess_entity` params: ``entity_id``, ``entity_name``, ``entity_type``, ``sector``, ``asset_value``, ``lat``, ``lon``. Optional: ``building_age_years``, ``elevation_m``, ``has_adaptation``, ``asset_type``. scenario, time_horizon : optional Override per-entity de |
| `PhysicalRiskEngine.score_to_rating` | score | Convert a 0-100 physical risk score to a categorical rating. |

**Engine `climate_physical_risk_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_SECTORS` | `['Agriculture', 'Forestry', 'Fishing', 'Mining', 'Food Processing', 'Chemicals', 'Non-Metallic Minerals', 'Basic Metals', 'Manufacturing', 'Energy', 'Water Utilities', 'Construction', 'Real Estate', 'Transport Land', 'Transport Water', 'Transport Air', 'Finance', 'ICT', 'Tourism', 'Healthcare']` |

### 2.3 Engine `climate_transition_risk_engine` (services/climate_transition_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `TransitionRiskEngine._validate_config` |  | Validate configuration parameters are within acceptable ranges. |
| `TransitionRiskEngine.classify_sector` | entity_name, nace_codes_with_revenue | Map NACE activities to CPRS category, IAM sectors, and GHG bucket. Parameters ---------- entity_name: Legal name of the entity. nace_codes_with_revenue: List of dicts, each with ``nace_code`` (str), ``revenue_share`` (float 0-1), and optionally ``ghg_intensity_tco2e_per_eur_m``. |
| `TransitionRiskEngine.assess_carbon_pricing` | scope1_tco2e, scope2_tco2e, scope3_tco2e, revenue_eur, is_cbam_sector, home_carbon_price, scenario, time_horizon | Compute carbon cost under a specific scenario and time horizon. Parameters ---------- scope1_tco2e, scope2_tco2e, scope3_tco2e: Annual emissions in tCO2e for each scope. revenue_eur: Annual revenue (EUR). is_cbam_sector: Whether the entity's products fall under EU CBAM. home_carbon_price: Effective carbon price already paid in the entity's home jurisdiction (EUR / tCO2e). Used when cbam_rate_metho |
| `TransitionRiskEngine._get_carbon_price` | scenario, year | Return the carbon price (EUR / tCO2e) for a scenario and year. Linearly interpolates between the scenario's 2030 and 2050 prices for intermediate years. Years before 2030 are extrapolated from a base of EUR 10 (current approximate average). Custom overrides take precedence. |
| `TransitionRiskEngine.assess_stranded_assets` | fossil_reserve_value, asset_categories, scenario, time_horizon | Compute stranded-asset writedown risk. Parameters ---------- fossil_reserve_value: Book value of fossil-fuel reserves or high-carbon assets (EUR). asset_categories: List of asset categories, e.g. ``["fossil_reserves", "coal_plants"]``. scenario: NGFS scenario name. Defaults to first in ``scenario_selection``. time_horizon: Target year. Defaults to 2040. |
| `TransitionRiskEngine._apply_writedown_curve` | base_factor, years_elapsed, total_years | Dispatch to the configured writedown-curve function. Returns a value in [0, 1] representing the fraction of the asset that has been written down at ``years_elapsed`` into the transition. |
| `TransitionRiskEngine.assess_alignment` | sector, current_emission_intensity, revenue_eur, readiness_data | Compute alignment gap and transition-readiness score. Parameters ---------- sector: IEA NZE sector key (e.g. ``"power"``, ``"cement"``). If not found in ``IEA_NZE_PATHWAY`` the closest match is attempted via the CPRS->IEA mapping. current_emission_intensity: tCO2e per EUR M revenue for the entity today. revenue_eur: Annual revenue (EUR). readiness_data: Dict mapping indicator names to scores (0-10 |
| `TransitionRiskEngine._interpolate_pathway` | pathway, year | Linearly interpolate pathway targets between milestone years. |
| `TransitionRiskEngine._compute_readiness` | readiness_data | Compute weighted readiness scores for each indicator. Returns a dict of indicator -> weighted score. If explicit weights are not configured, equal weighting is applied. |
| `TransitionRiskEngine.stress_test_scenarios` | carbon_cost_base, stranded_risk_base, sector_risk_score, revenue_eur, fossil_exposure_pct | Run transition-risk stress tests across selected NGFS scenarios. Parameters ---------- carbon_cost_base: Carbon cost from Stage 2 for the default scenario (EUR). stranded_risk_base: Stranded-asset risk from Stage 3 (EUR). sector_risk_score: CPRS sector risk score from Stage 1 (0-1). revenue_eur: Annual revenue (EUR). fossil_exposure_pct: Percentage of revenue / assets exposed to fossil fuels (0-10 |
| `TransitionRiskEngine.compute_composite_score` | sector_score, carbon_pricing_results, stranded_result, alignment_result, scenario_results | Compute the weighted composite transition-risk score. Returns ------- tuple[float, dict[str, float]] ``(composite_score_0_100, {category: score_0_100})``. |
| `TransitionRiskEngine.assess_entity` | entity_id, entity_name, nace_codes_with_revenue, scope1_tco2e, scope2_tco2e, scope3_tco2e, revenue_eur, fossil_reserve_value | Run all six stages for one entity and return a unified result. Parameters ---------- entity_id: Unique identifier. entity_name: Legal name. nace_codes_with_revenue: NACE codes with revenue shares (see :meth:`classify_sector`). scope1_tco2e, scope2_tco2e, scope3_tco2e: Annual emissions by scope (tCO2e). revenue_eur: Annual revenue (EUR). fossil_reserve_value: Book value of fossil / high-carbon asse |
| `TransitionRiskEngine.assess_portfolio` | entities | Assess transition risk for every entity in a portfolio. Parameters ---------- entities: List of dicts, each containing the keyword arguments accepted by :meth:`assess_entity`. Returns ------- list[TransitionRiskResult] |
| `TransitionRiskEngine.score_to_rating` | score | Convert a 0-100 composite score to a human-readable rating. Thresholds: < 20 Very Low < 40 Low < 60 Medium < 80 High >= 80 Very High |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `JSON` *(shared)*, `__future__` *(shared)*, `dataclasses` *(shared)*, `datetime` *(shared)*, `entity` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CLIMATE_FACTORS`, `FACTOR_CORR`, `GEOGRAPHIES`, `ISSUER_NAMES_BASE`, `ISSUER_TYPES`, `PEER_BANKS`, `PIE_COLORS`, `RATINGS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Equity Climate Risk Premium | — | Academic literature consensus | Annualised return premium for high climate risk stocks vs low climate risk peers |
| Credit Climate Spread Premium | — | NGFS/ECB | Additional credit spread for high-carbon issuers controlling for credit rating and sector |
- **Asset return data and climate risk scores** → Fama-MacBeth cross-sectional regression → **Climate beta estimates and risk premium decomposition**
- **NGFS scenario pathways** → Scenario-conditional factor loading → **Forward-looking CRP under each scenario**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-risk/assessments** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/climate-risk/assessments/{run_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/climate-risk/assessments/{run_id}/drill-down** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/climate-risk/methodologies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'data'], 'n_keys': 3}`

**GET /api/v1/climate-risk/methodologies/{id_a}/diff/{id_b}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'changed_fields', 'data'], 'n_keys': 3}`

**GET /api/v1/climate-risk/methodologies/{methodology_id}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/climate-risk/methodologies/{methodology_id}/export** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/climate-risk/templates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'data'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate risk factor premium
**Headline formula:** `CRP = α + β_phys × PhysRisk + β_trans × TransRisk + β_pol × PolicyUnc + ε`

Climate risk premium estimated via Fama-MacBeth cross-sectional regression of excess returns on physical and transition risk factor loadings; policy uncertainty factor from Baker-Bloom-Davis EPU index climate component.

**Standards:** ['TCFD Portfolio Alignment', 'NGFS Scenarios', 'Fama-French Factor Models']
**Reference documents:** Giglio et al. (2021) Climate Change and Long-Run Discount Rates; ECB/ESRB Climate Risk Report 2023; NGFS Phase 4 Scenario Database

**Engine `assessment_methodology_manager` — extracted transformation lines:**
```python
int_sum = i.physical_weight + i.transition_weight
hz_sum = p.acute_weight + p.chronic_weight
```

**Engine `assessment_runner` — extracted transformation lines:**
```python
result.duration_seconds = round(time.time() - t_start, 3)
result.duration_seconds = round(time.time() - t_start, 3)
depth=depth + 1,
interaction = alpha * (phys_score + trans_score) / 2
interaction = alpha * phys_score * trans_score / 100
interaction = alpha * max(phys_score, trans_score)
interaction = alpha * math.sqrt(max(phys_score * trans_score, 0))
raw = wp * phys_score + wt * trans_score + interaction
avg = sum(scores) / len(scores) if scores else 0.0
change_pct = abs((curr_val - prev_val) / prev_val) * 100
is_significant=change_pct > (threshold * 100),
```

**Engine `climate_integrated_risk` — extracted transformation lines:**
```python
weight_sum = cfg.physical_weight + cfg.transition_weight
term = alpha * (physical_score + transition_score) / 2.0
term = alpha * (physical_score * transition_score) / 100.0
term = alpha * max(physical_score, transition_score)
term = alpha * math.sqrt(physical_score * transition_score)
result = sum(scenario_scores.values()) / len(scenario_scores)
result = weighted_sum / total_weight if total_weight > 0 else 0.0
result = weighted_sum / total_weight if total_weight > 0 else 0.0
result = sum(scenario_scores.values()) / len(scenario_scores)
combined_cvar = physical_cvar + transition_cvar
physical_contrib = round(cfg.physical_weight * p_score * amplifier, 2)
transition_contrib = round(cfg.transition_weight * t_score * amplifier, 2)
interaction_contrib = round(interaction * amplifier, 2)
avg_physical = sum(r.physical_score for r in per_scenario_results) / len(per_scenario_results)
avg_transition = sum(r.transition_score for r in per_scenario_results) / len(per_scenario_results)
```

**Engine `climate_physical_risk_engine` — extracted transformation lines:**
```python
equal_w = 1.0 / len(active) if active else 0.0
intensity = min(1.0, raw_intensity * severity * th_scale)
base_freq = 0.3 + 0.4 * raw_intensity  # 0.3-0.7 events/yr proxy
frequency = min(1.0, base_freq * severity * th_scale)
frequency = min(1.0, 0.7 * severity * th_scale)
duration = min(1.0, 0.6 + 0.3 * severity)
duration = min(1.0, 0.2 + 0.3 * raw_intensity)
score = (intensity * frequency * duration) ** (1.0 / 3.0)
tropical_frac = max(0.0, 1.0 - abs_lat / 23.5)
temperate_frac = max(0.0, min(1.0, (abs_lat - 23.5) / 36.5))
polar_frac = max(0.0, (abs_lat - 60.0) / 30.0)
coastal_frac = max(0.0, 1.0 - min(abs(lon % 90), abs(90 - lon % 90)) / 30.0)
belt = max(0.0, 1.0 - abs(abs_lat - 16.0) / 15.0)
med_frac = max(0.0, 1.0 - abs(abs_lat - 38.0) / 15.0)
low_elev = max(0.0, coastal_frac * 0.8)
dry_belt = max(0.0, 1.0 - abs(abs_lat - 30.0) / 12.0)
frac = (horizon - lo) / (hi - lo)
Exposure = asset_value * exposure_fraction * concentration_factor
exposure_fraction = max(0.0, min(1.0, base_fraction * type_mod))
exposure_score = asset_value * exposure_fraction * concentration_factor
belt = max(0.0, 1.0 - abs(abs_lat - 16.0) / 20.0)
med_frac = max(0.0, 1.0 - abs(abs_lat - 38.0) / 18.0)
dry = max(0.0, 1.0 - abs(abs_lat - 30.0) / 15.0)
Vulnerability = base * modifiers * (1 - adaptation) * cascading
age_mod = 1.0 + max(0.0, (building_age_years - 20)) * 0.005
elev_mod = max(0.5, 1.5 - elevation_m / 100.0)
adaptation_discount = self.config.adaptation_discount_pct / 100.0
final = base_vuln * modifier_product * (1.0 - adaptation_discount) * cascading
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **9** other module(s).
**Shared engines (edits propagate!):** `assessment_methodology_manager` (used by 2 modules), `assessment_runner` (used by 2 modules), `climate_integrated_risk` (used by 2 modules), `climate_physical_risk_engine` (used by 2 modules), `climate_transition_risk_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `climate-risk-budget-allocator` | engine:assessment_methodology_manager, engine:assessment_runner, engine:climate_integrated_risk, engine:climate_physical_risk_engine, engine:climate_transition_risk_engine, table:JSON |
| `greenwashing-detector` | table:dataclasses |
| `greenwashing-detection` | table:dataclasses |
| `monte-carlo-uncertainty-engine` | table:dataclasses |
| `monte-carlo-var` | table:dataclasses |
| `climate-underwriting-workbench` | table:dataclasses |
| `carbon-offtake-structurer` | table:dataclasses |
| `monte-carlo-climate` | table:dataclasses |
| `greenwashing-exposure-monitor` | table:dataclasses |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a **Fama-MacBeth cross-sectional regression**
> (`CRP = α + β_phys·PhysRisk + β_trans·TransRisk + β_pol·PolicyUnc + ε`) estimating priced climate
> premia. **No regression is run in the code.** The page instead *constructs* each issuer's spread as an
> algebraic split — physical premium + transition premium + residual — from seeded risk scores, then
> displays term structures, greenium-by-rating and EDF/CDS panels that are all `sr()`-generated. There is
> no factor loading estimation, no EPU index, no cross-sectional step. It is a spread-decomposition
> *display*, not a premium *estimator*. §8 specifies the regression the guide claims.

### 7.1 What the module computes

For up to 200 synthetic issuers, total spread is split into climate components:
```js
totalSpread   = 30 + sr(i·23)·470                                   // 30–500 bp
physPremium   = max(0, totalSpread·(physRiskScore/100)·(sr(i·37)·0.35+0.05))
transPremium  = max(0, totalSpread·(transRiskScore/100)·(sr(i·41)·0.40+0.05))
residualPremium = max(0, totalSpread − physPremium − transPremium)
```
Credit primitives are then conditioned on transition risk:
```js
climatePD   = basePD·(1 + transRiskScore/100·0.5)      // up to +50% PD from transition
carbonBeta  = (physRiskScore·0.4 + transRiskScore·0.6)/100
greenBondPremium = sr(i·47) > 0.7 ? −(sr(i·53)·15) : 0   // ~30% of issuers get −0..15bp greenium
```
Term structures build synthetic curves by rating × maturity (`baseSpread` seeded, physical/transition
components as fixed fractions).

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula | Provenance |
|---|---|---|
| `totalSpread` | `30 + sr(i·23)·470` | synthetic demo value |
| `physRiskScore`, `transRiskScore` | `5 + sr()·85` | synthetic demo value |
| Physical premium fraction | `physScore/100 × (sr·0.35+0.05)` | heuristic decomposition weight |
| Transition premium fraction | `transScore/100 × (sr·0.40+0.05)` | heuristic (transition weighted higher) |
| `climatePD` uplift | `1 + transScore/100·0.5` | heuristic (+50% cap) |
| `carbonBeta` | `0.4·phys + 0.6·trans` | heuristic loading split |
| Greenium | `−sr·15` bp for top ~30% | synthetic; cf. guide 20–80 bp credit premium |

### 7.3 Calculation walkthrough

Seeds → sector/rating/geography/maturity + risk scores → `totalSpread` decomposed into phys/trans/residual
→ `climatePD`, `carbonBeta`, LGD/EAD, ESG score, greenium. Derived panels: `TERM_STRUCTURE` (rating×maturity
curves), `RATING_OAS_SERIES`, `EDF_DATA` (60 issuers), `CARBON_INTENSITY_SCATTER`, `SCENARIO_SPREADS`,
`GREENIUM_BY_RATING`, `EL_TABLE` (expected loss by sector = avgPD·LGD·EAD).

### 7.4 Worked example

Issuer: `totalSpread=200 bp`, `physRiskScore=60`, `transRiskScore=80`, seeds giving phys-mult 0.20,
trans-mult 0.30; `basePD=2.0%`:

| Component | Computation | Result |
|---|---|---|
| Physical premium | 200·(60/100)·0.20 | **24 bp** |
| Transition premium | 200·(80/100)·0.30 | **48 bp** |
| Residual premium | 200 − 24 − 48 | **128 bp** |
| Climate PD | 2.0%·(1 + 0.80·0.5) | **2.8%** |
| Carbon beta | 0.4·0.60 + 0.6·0.80 | **0.72** |

Of the 200 bp spread, 72 bp (36%) is attributed to climate — the transition share dominating because of the
0.6 loading and higher score. This is definitional, not estimated: change the seeds and the "premium"
changes with no market data involved.

### 7.5 Data provenance & limitations

- **All issuer, spread and curve data synthetic** (`sr()` PRNG). No excess-return panel, no Fama-MacBeth,
  no Baker-Bloom-Davis EPU climate component (all named in the guide, none present).
- The climate "premium" is an assumed fraction of a random spread — it cannot tell you whether climate risk
  is *priced*; it merely reallocates a given spread by seeded scores.
- `climatePD` and `carbonBeta` are heuristic scalings, not estimated betas; `EL_TABLE` compounds seeded PD.

**Framework alignment:** TCFD portfolio alignment framing · NGFS scenarios (referenced, not simulated) ·
Fama-French / Fama-MacBeth factor methodology (the guide's intended engine, specified in §8) · the
academic 1.5–3.0% equity / 20–80 bp credit premia (Giglio et al.; ECB/ESRB) are cited as target magnitudes.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Estimate the *priced* climate risk premium in credit and equity — the excess
return/spread investors demand per unit physical, transition and policy-uncertainty exposure — for use as a
climate-adjusted discount-rate add-on.

**8.2 Conceptual approach.** **Fama-MacBeth two-pass cross-sectional regression** (asset-pricing standard)
with climate factors, cross-checked against a mimicking-portfolio (long-high-minus-low climate risk) return
series à la Fama-French factor construction; policy-uncertainty factor from the Baker-Bloom-Davis climate-EPU
index. This mirrors published methodology (Giglio-Kelly-Stroebel; Bolton-Kacperczyk carbon-premium).

**8.3 Mathematical specification.**
```
Pass 1 (time series, per asset i):  r_it − r_ft = a_i + β_i^phys·PHYS_t + β_i^trans·TRANS_t + β_i^pol·EPU_t + e_it
Pass 2 (cross-section, each t):     r_it − r_ft = λ0_t + λ_phys_t·β_i^phys + λ_trans_t·β_i^trans + λ_pol_t·β_i^pol + u_it
CRP_f = mean_t(λ_f_t) ;  t-stat = mean/ (sd/√T)   (Newey-West adjusted)
Discount-rate add-on_i = Σ_f β_i^f · CRP_f
```

| Parameter | Source |
|---|---|
| PHYS_t, TRANS_t factor returns | high-minus-low climate-score portfolio sorts (Trucost/MSCI scores) |
| EPU_t | Baker-Bloom-Davis climate policy uncertainty index |
| Excess returns r_it | CRSP/Compustat (equity), ICE BofA OAS (credit) |
| β estimation window | 36–60 month rolling |

**8.4 Data requirements.** Asset returns/OAS panel; firm climate scores (physical hazard, carbon intensity,
transition alignment — platform Trucost-style data, `reference_data` CO2 tables); EPU index. Free: EPU,
OWID emissions; vendor: MSCI/Trucost scores, ICE OAS.

**8.5 Validation & benchmarking.** Newey-West t-stats on λ; out-of-sample premium stability; reconcile
equity CRP against Giglio et al. 1.5–3.0% and credit CRP against ECB 20–80 bp; GRS test on mimicking
portfolio.

**8.6 Limitations & model risk.** Short climate-return history → weak identification; score vendor
disagreement; premium regime-shifts around policy shocks. Fallback: report factor betas with wide CIs and a
literature-anchored premium band rather than a point discount add-on.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the Fama-MacBeth estimator the guide already claims (analytics ladder: rung 1 → 3)

**What.** §7 carries an explicit guide↔code mismatch flag: the methodology promises
`CRP = α + β_phys·PhysRisk + β_trans·TransRisk + β_pol·PolicyUnc + ε` via Fama-MacBeth
cross-sectional regression, but no regression exists — the page algebraically *splits*
`sr()`-seeded spreads into phys/trans/residual components for 200 synthetic issuers.
Evolution A closes that gap: an actual premium estimator, so the module measures whether
climate risk is priced rather than asserting a decomposition.

**How.** (1) New endpoint `POST /api/v1/climate-risk/premium/estimate` running two-pass
Fama-MacBeth with statsmodels (already in the environment): time-series pass estimates
per-issuer betas against physical/transition factor returns; cross-sectional pass
estimates the priced premium per period with Newey-West errors. (2) Risk-factor inputs
come from the platform's own engines — `climate_physical_risk_engine.assess_entity` and
`TransitionRiskEngine.assess_entity` scores as the characteristic sorts — so the factor
construction is reproducible. (3) Benchmark the output against the Giglio et al. (2021)
and ECB/ESRB ranges §5 already cites; publish the comparison in the response payload.
(4) Replace the seeded `ISSUERS` array with the estimation sample; keep the term-structure
and greenium panels but drive them from residuals.

**Prerequisites.** A real spread panel (the market-data seed from EA-hybrid-v3 or a
bond-pricing ingest) — the estimator must refuse to run on synthetic issuers; the §7
mismatch flag removed only after code matches guide. **Acceptance:** regression output
includes t-statistics and sample size; estimated transition premium falls within (or is
honestly flagged against) the cited literature range.

### 9.2 Evolution B — Discount-rate copilot for valuation teams (LLM tier 1)

**What.** The stated workflow ends with "use premium estimates for climate-adjusted
discount rates in DCF valuations" — a judgment-heavy step the module leaves to the
analyst. Evolution B adds a copilot that explains what the premium panels mean for a
specific valuation: "what discount-rate uplift is defensible for an EU BBB utility?",
answering from the module's own decomposition logic, the §7.4 worked example
(24bp/48bp/128bp split, carbon beta 0.72), and the cited literature — with explicit
caveats that current issuer data is synthetic.

**How.** Tier-1 RAG per the roadmap: corpus is this Atlas record (§5 formula and
standards, §7 including the mismatch flag, §8 spec) embedded in `llm_corpus_chunks`;
served via `POST /api/v1/copilot/climate-risk-premium/ask` with the page's selected
sector/rating/geography state passed as context. The mismatch flag is load-bearing: the
system prompt must instruct the copilot to disclose that displayed premia are
constructed, not estimated, until Evolution A ships — honesty is the feature.

**Prerequisites.** Atlas corpus embedding pipeline (roadmap D3); no module code changes
needed. **Acceptance:** asked "is this premium estimated from market data?", the copilot
correctly answers no and cites §7; every quantitative claim cites either page state or a
referenced document; refusal on questions requiring the unbuilt regression.