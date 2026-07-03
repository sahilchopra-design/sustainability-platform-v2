# Climate Risk Budget Allocator
**Module ID:** `climate-risk-budget-allocator` · **Route:** `/climate-risk-budget-allocator` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Allocates a portfolio's total climate risk budget across asset classes, sectors, and geographies using marginal contribution to climate VaR as the allocation driver.

> **Business value:** Provides portfolio risk managers with a systematic framework to enforce climate risk limits and optimise budget allocation without sacrificing return objectives.

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
| `sum` | `weights.reduce((s, w) => s + w, 0);` |
| `assetVols` | `useMemo(() => ASSETS.map(a => a.totalClimateVaR / 10000), []);` |
| `pVol` | `portfolioVaR / 10000;` |
| `totalBudgetUsed` | `useMemo(() => mrc.reduce((s, x) => s + x.mrc, 0), [mrc]);` |
| `budgetUtilization` | `useMemo(() => totalBudget > 0 ? totalBudgetUsed / totalBudget * 100 : 0, [totalBudgetUsed, totalBudget]);` |
| `contributions` | `FACTORS.map((f, fi) =>` |

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
| `AssessmentMethodologyManager.update_draft` | methodology_id, updates, changed_by | Update fields on a DRAFT methodology. |
| `AssessmentMethodologyManager.publish` | methodology_id, approved_by | Transition DRAFT → PUBLISHED. Increments version. |
| `AssessmentMethodologyManager.retire` | methodology_id, retired_by, reason | Transition PUBLISHED → RETIRED. |
| `AssessmentMethodologyManager.archive` | methodology_id, archived_by | Transition RETIRED → ARCHIVED. |
| `AssessmentMethodologyManager.clone` | source_id, new_name, cloned_by | Clone any methodology (including templates) to a new DRAFT. |
| `AssessmentMethodologyManager.diff` | id_a, id_b | Return field-level diff between two methodology configs. |
| `AssessmentMethodologyManager.export_json` | methodology_id |  |

### 2.3 Engine `assessment_runner` (services/assessment_runner.py)
| Function | Args | Purpose |
|---|---|---|
| `AssessmentRunner.run_assessment` | run_config | Execute a full assessment run synchronously. |
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
| `ClimateIntegratedRisk.compute_interaction_term` | physical_score, transition_score | Compute the interaction term between physical and transition risk. |
| `ClimateIntegratedRisk.compute_nature_amplifier` | sector, lat, lon | Compute nature-risk amplifier based on sector ecosystem dependency. |
| `ClimateIntegratedRisk.weight_scenarios` | scenario_scores | Weight per-scenario integrated scores into a single number. |
| `ClimateIntegratedRisk.integrate` | physical_result, transition_result, sector, lat, lon | Integrate one physical + transition result pair into a single score. |
| `ClimateIntegratedRisk.integrate_multi_scenario` | physical_results, transition_results, sector, lat, lon | Integrate across multiple scenarios and apply scenario weighting. |
| `ClimateIntegratedRisk.score_to_rating` | score | Convert a 0-100 integrated risk score to a human-readable rating. |

### 2.3 Engine `climate_physical_risk_engine` (services/climate_physical_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PhysicalRiskEngine._validate_config` |  | Validate configuration ranges and constraints. |
| `PhysicalRiskEngine._build_hazard_weights` |  | Build normalised hazard weight vector from config or defaults. |
| `PhysicalRiskEngine._get_active_hazards` |  | Return hazard types enabled by the inclusion mask (all if empty). |
| `PhysicalRiskEngine.assess_hazard` | hazard_type, asset_lat, asset_lon, scenario, time_horizon | Compute a normalised hazard score for one hazard at one location. |
| `PhysicalRiskEngine._latitude_intensity` | hazard_type, lat, lon | Deterministic latitude-band intensity proxy for a hazard type. |
| `PhysicalRiskEngine._time_horizon_factor` | horizon, category | Interpolate time horizon scaling factor. |
| `PhysicalRiskEngine.assess_exposure` | asset_value, asset_type, lat, lon, hazard_type | Compute exposure score for an asset against a specific hazard. |
| `PhysicalRiskEngine._base_exposure_fraction` | hazard_type, lat, lon | Proxy exposure fraction based on hazard type and location. |
| `PhysicalRiskEngine.assess_vulnerability` | sector, hazard_type, building_age_years, elevation_m, has_adaptation | Compute vulnerability for a sector-hazard pair with modifiers. |
| `PhysicalRiskEngine.compute_damage` | hazard_score, exposure, vulnerability, hazard_type | Compute damage for one hazard using the configured damage function. |
| `PhysicalRiskEngine._apply_damage_function` | combined_score, hazard_type | Dispatch to the configured damage curve type. Returns 0-1 damage ratio. |
| `PhysicalRiskEngine._sigmoid` | x, midpoint, steepness | Standard logistic sigmoid normalised to [0, 1]. |
| `PhysicalRiskEngine._step_function` | x, thresholds, values | Step (piecewise-constant) damage function. |
| `PhysicalRiskEngine._compute_physical_cvar` | damage_results, asset_value, time_horizon | Compute aggregate physical Climate-Value-at-Risk for one entity. |
| `PhysicalRiskEngine.assess_entity` | entity_id, entity_name, entity_type, sector, asset_value, lat | Run the full 5-stage pipeline for a single entity. |
| `PhysicalRiskEngine.assess_portfolio` | entities, scenario, time_horizon | Assess physical risk for a portfolio of entities. |
| `PhysicalRiskEngine.score_to_rating` | score | Convert a 0-100 physical risk score to a categorical rating. |

### 2.3 Engine `climate_transition_risk_engine` (services/climate_transition_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `TransitionRiskEngine._validate_config` |  | Validate configuration parameters are within acceptable ranges. |
| `TransitionRiskEngine.classify_sector` | entity_name, nace_codes_with_revenue | Map NACE activities to CPRS category, IAM sectors, and GHG bucket. |
| `TransitionRiskEngine.assess_carbon_pricing` | scope1_tco2e, scope2_tco2e, scope3_tco2e, revenue_eur, is_cbam_sector, home_carbon_price | Compute carbon cost under a specific scenario and time horizon. |
| `TransitionRiskEngine._get_carbon_price` | scenario, year | Return the carbon price (EUR / tCO2e) for a scenario and year. |
| `TransitionRiskEngine.assess_stranded_assets` | fossil_reserve_value, asset_categories, scenario, time_horizon | Compute stranded-asset writedown risk. |
| `TransitionRiskEngine._apply_writedown_curve` | base_factor, years_elapsed, total_years | Dispatch to the configured writedown-curve function. |
| `TransitionRiskEngine.assess_alignment` | sector, current_emission_intensity, revenue_eur, readiness_data | Compute alignment gap and transition-readiness score. |
| `TransitionRiskEngine._interpolate_pathway` | pathway, year | Linearly interpolate pathway targets between milestone years. |
| `TransitionRiskEngine._compute_readiness` | readiness_data | Compute weighted readiness scores for each indicator. |
| `TransitionRiskEngine.stress_test_scenarios` | carbon_cost_base, stranded_risk_base, sector_risk_score, revenue_eur, fossil_exposure_pct | Run transition-risk stress tests across selected NGFS scenarios. |
| `TransitionRiskEngine.compute_composite_score` | sector_score, carbon_pricing_results, stranded_result, alignment_result, scenario_results | Compute the weighted composite transition-risk score. |
| `TransitionRiskEngine.assess_entity` | entity_id, entity_name, nace_codes_with_revenue, scope1_tco2e, scope2_tco2e, scope3_tco2e | Run all six stages for one entity and return a unified result. |
| `TransitionRiskEngine.assess_portfolio` | entities | Assess transition risk for every entity in a portfolio. |
| `TransitionRiskEngine.score_to_rating` | score | Convert a 0-100 composite score to a human-readable rating. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `JSON` *(shared)*, `__future__` *(shared)*, `dataclasses` *(shared)*, `datetime` *(shared)*, `entity` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ASSET_CLASSES`, `FACTORS`, `FACTOR_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Typical Portfolio Climate VaR (RCP 4.5) | — | MSCI 2023 | Range of Climate Value-at-Risk for a diversified equity portfolio under RCP 4.5 scenario over a 15-year horizo |
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

## 5 · Intermediate Transformation Logic
**Methodology:** Marginal Climate VaR Contribution
**Headline formula:** `MC-CVaRᵢ = ∂CVaRₚ / ∂wᵢ`
**Standards:** ['MSCI Climate VaR', 'TCFD Scenario Analysis Guidance']

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
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **60** other module(s).
**Shared engines (edits propagate!):** `assessment_methodology_manager` (used by 2 modules), `assessment_runner` (used by 2 modules), `climate_integrated_risk` (used by 2 modules), `climate_physical_risk_engine` (used by 2 modules), `climate_transition_risk_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `climate-risk-premium` | engine:assessment_methodology_manager, engine:assessment_runner, engine:climate_integrated_risk, engine:climate_physical_risk_engine, engine:climate_transition_risk_engine, table:JSON |
| `greenwashing-detection` | table:dataclasses |
| `monte-carlo-var` | table:dataclasses |
| `monte-carlo-climate` | table:dataclasses |
| `monte-carlo-uncertainty-engine` | table:dataclasses |
| `greenwashing-exposure-monitor` | table:dataclasses |
| `greenwashing-detector` | table:dataclasses |
| `carbon-aware-allocation` | table:datetime |
| `stranded-assets` | table:datetime |
| `portfolio-optimizer` | table:datetime |