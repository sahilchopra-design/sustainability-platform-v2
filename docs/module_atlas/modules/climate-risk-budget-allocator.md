# Climate Risk Budget Allocator
**Module ID:** `climate-risk-budget-allocator` · **Route:** `/climate-risk-budget-allocator` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Allocates a portfolio's total climate risk budget across asset classes, sectors, and geographies using marginal contribution to climate VaR as the allocation driver.

> **Business value:** Provides portfolio risk managers with a systematic framework to enforce climate risk limits and optimise budget allocation without sacrificing return objectives.

**How an analyst works this module:**
- Compute asset-level Climate VaR using physical and transition risk scenarios
- Aggregate to portfolio Climate VaR using weighted covariance structure
- Decompose into marginal contributions by asset, sector, and geography
- Compare allocations to risk budget limits; generate rebalancing recommendations

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `ASSET_CLASSES`, `BASE_ASSETS`, `CORR_MATRIX`, `FACTORS`, `FACTOR_COLORS`, `FACTOR_VARIANCE`, `KpiCard`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `BASE_ASSETS` | `ASSET_CLASSES.map((name, i) => {` |
| `ret` | `sr(i * 11 + 2) * 0.12 + 0.03;` |
| `carbonBeta` | `sr(i * 13 + 3) * 1.5 - 0.5;` |
| `greenBeta` | `sr(i * 17 + 4) * 1.5 - 0.5;` |
| `physBeta` | `sr(i * 19 + 5) * 1.2 - 0.2;` |
| `transBeta` | `sr(i * 23 + 6) * 1.5 - 0.5;` |
| `totalVaR` | `sr(i * 29 + 7) * 800 + 100;` |
| `physVaR` | `totalVaR * (sr(i * 31 + 8) * 0.4 + 0.1);` |
| `transVaR` | `totalVaR - physVaR;` |
| `totalW` | `BASE_ASSETS.reduce((s, x) => s + x.weight, 0);` |
| `ASSETS` | `BASE_ASSETS.map(a => ({ ...a, weight: a.weight / totalW }));` |
| `FACTOR_VARIANCE` | `FACTORS.map((_, i) => sr(i * 17 + 5) * 0.04 + 0.01);` |
| `normalizedWeights` | `useMemo(() => { const sum = weights.reduce((s, w) => s + w, 0);` |
| `assetVols` | `useMemo(() => ASSETS.map(a => a.totalClimateVaR / 10000), []);` |
| `pVol` | `portfolioVaR / 10000;` |
| `totalBudgetUsed` | `useMemo(() => mrc.reduce((s, x) => s + x.mrc, 0), [mrc]);` |
| `budgetUtilization` | `useMemo(() => totalBudget > 0 ? totalBudgetUsed / totalBudget * 100 : 0, [totalBudgetUsed, totalBudget]);` |
| `factorAttribution` | `useMemo(() => { return ASSETS.map((a, i) => { const betas = [a.carbonBeta, a.greenBeta, a.physicalBeta, a.transitionBeta];` |
| `contributions` | `FACTORS.map((f, fi) =>` |
| `idio` | `normalizedWeights[i] * a.totalClimateVaR * 0.3;` |
| `optimalMRC` | `useMemo(() => { const perAssetBudget = totalBudget / ASSETS.length;` |
| `eigenvalues` | `useMemo(() => Array.from({ length: 8 }, (_, i) => +(sr(i * 17 + 99) * 3 + 0.1).toFixed(3)).sort((a, b) => b - a), []);` |
| `hedgingData` | `useMemo(() => { return ASSETS.map((a, i) => ({ name: a.name.substring(0, 12), costBps: a.hedgingCostBps, riskReduction: +(sr(i * 13 + 7) * 40 + 5).toFixed(1), optimalHedgeRatio: +(sr(i * 17 + 8) * 0.8 + 0.1).toFixed(3), }));` |
| `sensitivityData` | `useMemo(() => { return ASSETS.map((a, i) => { const base = portfolioVaR;` |
| `impactPls` | `mrc[i] > 0 ? +(mrc[i] * delta / (normalizedWeights[i] \|\| 0.001) * 10).toFixed(1) : 0;` |
| `totalMRC` | `mrc.reduce((s, x) => s + x.mrc, 0);` |
| `pctOfTotal` | `totalMRC > 0 ? (m.mrc / totalMRC * 100).toFixed(1) : 0;` |
| `covar` | `p.corr * assetVols[p.i] * assetVols[p.j] * 10000;` |
| `joint` | `normalizedWeights[p.i] * normalizedWeights[p.j] * covar * 2;` |
| `total` | `factorAttribution.reduce((s, x) => s + (x[f.key] \|\| 0), 0);` |
| `grandTotal` | `factorAttribution.reduce((s, x) => s + x.carbon + x.green + x.physical + x.transition + x.idiosyncratic, 0);` |
| `pct` | `grandTotal > 0 ? (total / grandTotal * 100).toFixed(1) : 0;` |
| `varBefore` | `a.totalClimateVaR * normalizedWeights[i] * 10000;` |
| `varAfter` | `varBefore * (1 - h.riskReduction / 100);` |
| `netBenefit` | `(varBefore - varAfter) - h.costBps;` |
| `fVol` | `+(sr(fi * 9 + 11) * 15 + 5).toFixed(1);` |
| `avgBeta` | `+(sr(fi * 13 + 17) * 0.8 + 0.2).toFixed(3);` |
| `expl` | `+(sr(fi * 7 + 23) * 20 + 5).toFixed(1);` |
| `shock1` | `+(fVol * avgBeta).toFixed(1);` |
| `shock2` | `+(fVol * avgBeta * 2).toFixed(1);` |

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
**Frontend seed datasets:** `ASSET_CLASSES`, `FACTORS`, `FACTOR_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Typical Portfolio Climate VaR (RCP 4.5) | — | MSCI 2023 | Range of Climate Value-at-Risk for a diversified equity portfolio under RCP 4.5 scenario over a 15-year horizon. |
| Budget Breach Trigger | — | Internal Policy | Risk budget policy threshold; breaches trigger rebalancing review or sector exposure cap. |
- **Position-level weights, Climate VaR scores, scenario probability distributions** → Marginal contribution decomposition, budget allocation optimisation → **Budget utilisation dashboards, breach alerts, rebalancing trade lists**

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
**Methodology:** Marginal Climate VaR Contribution
**Headline formula:** `MC-CVaRᵢ = ∂CVaRₚ / ∂wᵢ`

Partial derivative of total portfolio Climate VaR with respect to asset weight; used to identify which positions consume disproportionate climate risk budget.

**Standards:** ['MSCI Climate VaR', 'TCFD Scenario Analysis Guidance']
**Reference documents:** MSCI Climate Value-at-Risk Methodology 2022; TCFD Implementing Scenario Analysis 2020; Bank of England CBES Methodology 2021

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
| `climate-risk-premium` | engine:assessment_methodology_manager, engine:assessment_runner, engine:climate_integrated_risk, engine:climate_physical_risk_engine, engine:climate_transition_risk_engine, table:JSON |
| `greenwashing-detector` | table:dataclasses |
| `greenwashing-detection` | table:dataclasses |
| `monte-carlo-uncertainty-engine` | table:dataclasses |
| `monte-carlo-var` | table:dataclasses |
| `climate-underwriting-workbench` | table:dataclasses |
| `carbon-offtake-structurer` | table:dataclasses |
| `monte-carlo-climate` | table:dataclasses |
| `greenwashing-exposure-monitor` | table:dataclasses |

## 7 · Methodology Deep Dive

The guide describes **Marginal Contribution to Climate VaR** (`MC-CVaR = ∂CVaR_p/∂w_i`). The code *does*
implement a recognisable marginal-risk-contribution decomposition and a factor-attribution model — the
mathematical skeleton is real Euler-allocation. What is synthetic is every input: asset betas, VaRs,
factor variances and the correlation structure are all `sr()` seeded, and the "Climate VaR" itself is a
random draw, not a scenario-loss estimate.

### 7.1 What the module computes

Each asset carries seeded climate betas and a total climate VaR:
```js
carbonBeta = sr(i·13+3)·1.5 − 0.5   greenBeta = sr(i·17+4)·1.5 − 0.5
physBeta   = sr(i·19+5)·1.2 − 0.2   transBeta = sr(i·23+6)·1.5 − 0.5
totalVaR   = sr(i·29+7)·800 + 100    physVaR = totalVaR·(sr(i·31+8)·0.4+0.1);  transVaR = totalVaR − physVaR
```
Marginal risk contribution (Euler allocation form) uses asset vols and normalised weights:
```js
assetVols[i] = ASSETS[i].totalClimateVaR / 10000
pVol         = portfolioVaR / 10000
covar(i,j)   = corr·assetVols[i]·assetVols[j]·10000
joint(i,j)   = w_i·w_j·covar·2
```
Factor attribution splits each asset's VaR across carbon/green/physical/transition + idiosyncratic:
```js
idio = normalizedWeights[i]·a.totalClimateVaR·0.3
// contributions per factor = f(betas, factor variance)
pct  = total_factor / grandTotal · 100
```
Budget utilisation and hedging:
```js
budgetUtilization = totalBudgetUsed/totalBudget·100
netBenefit(hedge) = (varBefore − varAfter) − costBps,  varAfter = varBefore·(1 − riskReduction/100)
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Generation | Provenance |
|---|---|---|
| Asset betas (carbon/green/phys/trans) | `sr()·range − offset` | synthetic demo value |
| `totalVaR` | `sr(i·29+7)·800+100` (100–900) | synthetic demo value |
| `FACTOR_VARIANCE` | `sr(i·17+5)·0.04+0.01` | synthetic demo value |
| `idio` weight | fixed `0.3` (30% idiosyncratic) | heuristic |
| `eigenvalues` (PCA display) | `sr(i·17+99)·3+0.1`, sorted desc | synthetic demo value |
| Hedge `riskReduction`, `optimalHedgeRatio` | `sr()` seeded | synthetic demo value |

The mathematical **forms** (Euler MRC, weighted-covariance portfolio vol, factor Σβ·contribution) are
standard; only the numbers are demo.

### 7.3 Calculation walkthrough

Weights are normalised (`normalizedWeights`) → portfolio vol from weighted covariance → per-asset marginal
contribution `mrc` → `totalBudgetUsed = Σ mrc`, `budgetUtilization` vs `totalBudget`. `factorAttribution`
projects each asset's VaR onto the four climate factors plus idiosyncratic; `pctOfTotal` and `grandTotal`
give the budget pie. Hedging tab ranks assets by `netBenefit`. Sensitivity tab perturbs weights (`delta`)
and reports `impactPls`.

### 7.4 Worked example

Two-asset slice: `w = [0.6, 0.4]`, `assetVol = [0.05, 0.03]` (i.e. totalClimateVaR 500 and 300),
`corr = 0.5`:

| Step | Computation | Result |
|---|---|---|
| Var contribution A (own) | 0.6²·0.05² | 0.00090 |
| Var contribution B (own) | 0.4²·0.03² | 0.000144 |
| Joint | 0.6·0.4·(0.5·0.05·0.03)·2 | 0.00036 |
| Portfolio var | sum | 0.001404 |
| Portfolio vol | √0.001404 | **0.03747** |
| MRC_A ≈ w_A·(∂σ/∂w_A) | (0.6·0.05² + 0.24·0.5·0.05·0.03)/0.03747·0.6 | ≈ **0.0195** |

Asset A, though only 60% weight, consumes the larger share of risk budget because of its higher vol and
positive correlation — the concentration signal the allocator is built to flag.

### 7.5 Data provenance & limitations

- **Every input synthetic** (`sr()` PRNG): betas, VaRs, correlations, eigenvalues, hedge parameters.
- "Climate VaR" is a random scalar `100–900`, not a scenario-conditioned loss quantile; the physical/
  transition split is a random fraction. So the decomposition is structurally correct but numerically
  illustrative.
- Correlation matrix and factor variances are seeded independently of the betas, so factor attribution and
  covariance risk are not internally consistent with a single generating model.
- The four `climate_risk` assessment endpoints exist but are not the source of these numbers.

**Framework alignment:** Euler/marginal risk-contribution allocation (RiskMetrics, standard risk-budgeting)
· MSCI Climate VaR as the CVaR concept the module visualises · TCFD scenario-analysis framing · BoE CBES
as the supervisory budgeting context.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Allocate a portfolio's climate-risk budget across positions/sectors by their
marginal contribution to a *properly estimated* Climate VaR, and flag breaches of budget limits.

**8.2 Conceptual approach.** Climate VaR from a **scenario-loss distribution** (MSCI Climate VaR / Aladdin
Climate transition-repricing) feeding an **Euler risk-contribution** allocation (standard risk-budgeting,
RiskMetrics). Factor structure from a climate risk-factor model (carbon, green, physical, transition) à la
Goldman Marquee / Barra climate factors.

**8.3 Mathematical specification.**
```
Asset climate P&L: r_i = α_i + Σ_f β_if · F_f + ε_i
CVaR_p = −quantile_5%( Σ_i w_i·r_i )   from scenario-simulated F_f and ε_i
MC-CVaR_i = w_i · ∂CVaR_p/∂w_i = w_i · E[ r_i | Σ w_i r_i = −CVaR_p ]   (Euler)
Σ_i MC-CVaR_i = CVaR_p          (full allocation)
BudgetUtil_i = MC-CVaR_i / Limit_i
```

| Parameter | Source |
|---|---|
| Factor loadings β_if | regression on carbon/green/physical/transition factor returns |
| Factor covariance Σ_F | NGFS-scenario simulated factor paths |
| Idiosyncratic σ_ε | residual variance from factor regression |
| Scenario distribution | NGFS Phase IV + MSCI Climate VaR damage functions |

**8.4 Data requirements.** Position weights, sector/geo tags, carbon intensity, physical hazard exposure;
factor returns (built from platform `climate-risk-premium`, `climate-stress-test`); NGFS variables
(migration 088). Vendor: MSCI Climate VaR, Aladdin; free: NGFS database.

**8.5 Validation & benchmarking.** Check Σ MC = CVaR (Euler identity); backtest CVaR exceedances; reconcile
against MSCI Climate VaR for overlapping names; stability of allocation under weight perturbation.

**8.6 Limitations & model risk.** Climate-factor returns are short/noisy; tail estimation unstable at 5%
with few scenarios; correlation regime-dependent. Fallback: parametric Gaussian CVaR with shrinkage
covariance when scenario simulation is unavailable.

## 9 · Future Evolution

### 9.1 Evolution A — Real-portfolio MRC decomposition and risk-budget optimizer (analytics ladder: rung 2 → 5)

**What.** The backend vertical is real — `assessment_runner`, `climate_physical_risk_engine`
(5-stage CVaR pipeline), `climate_transition_risk_engine` (NGFS carbon pricing, stranded
assets), and `climate_integrated_risk` all exist behind 21 `/api/v1/climate-risk/*`
routes — but the allocator page never calls them: every asset's `carbonBeta`, `totalVaR`,
`physVaR`, eigenvalues and hedging numbers are `sr()`-seeded in the UI. Evolution A wires
the MRC math (`MC-CVaRᵢ = ∂CVaRₚ/∂wᵢ`) to real engine output over real holdings, then adds
the missing prescriptive step: a risk-budget optimizer producing the rebalancing trade
list the overview promises.

**How.** (1) New endpoint `POST /api/v1/climate-risk/budget/allocate` that loads holdings
from `portfolios_pg`, runs `assess_portfolio` on both engines per entity, and computes
Euler-decomposed marginal contributions from the resulting CVaR vector plus a factor
covariance estimated from the per-scenario results (replacing the seeded `CORR_MATRIX`
and `FACTOR_VARIANCE`). (2) scipy SLSQP equal-risk-contribution / budget-constrained
optimizer (the roadmap names risk allocation as a natural rung-5 mover) emitting weight
deltas per asset. (3) Frontend swaps `BASE_ASSETS` for the endpoint payload.

**Prerequisites.** Fix the lineage-harness failures on `GET /assessments*` (status
`failed`, output `None`) before layering allocation on the runner; seed the 200–500
holding demo portfolio (roadmap D0). **Acceptance:** sum of reported MRCs equals
portfolio CVaR within 1%; optimizer output satisfies budget constraints; zero `sr()`
calls remain in the allocation path.

### 9.2 Evolution B — Budget-breach analyst with rebalancing what-ifs (LLM tier 2)

**What.** A tool-calling analyst on the allocator page answering "which positions are
consuming my climate risk budget and what trade fixes it?" by invoking the module's own
endpoints — `POST /assessments/run`, `GET /assessments/{run_id}/drill-down`, and the
Evolution A `/budget/allocate` — and narrating real MRC decompositions, never inventing
betas. Follow-ups like "re-run under Delayed Transition with a 20% utilities cap" become
parameterized tool calls against the methodology system (`create_methodology` →
`run_assessment`), exploiting the draft/publish lifecycle that already exists in
`assessment_methodology_manager`.

**How.** Tool schemas filtered from the 21 OpenAPI operations via this Atlas endpoint
map; read-only first, with `POST /assessments/run` gated behind explicit confirmation
since runs persist. System prompt grounded in §5 (MRC formula, MSCI Climate VaR / TCFD
standards) and §7; the no-fabrication validator checks each numeric against
tool outputs. The "show work" expander lists run_id, methodology version, and scenario
set, which `get_run` already returns.

**Prerequisites.** Evolution A (otherwise the copilot can only describe seeded UI
numbers); the failed `GET /assessments` routes fixed so run retrieval works.
**Acceptance:** an end-to-end "breach → explain → propose trade" conversation where
every figure traces to a run_id; refusal when asked for asset classes not in the
portfolio.