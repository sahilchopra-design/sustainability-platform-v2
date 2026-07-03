# Api::Sub_Parameter
**Module ID:** `api::sub_parameter` · **Route:** `/api/v1/sub-parameter` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/sub-parameter/parameters` | `list_analyzable_parameters` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/sensitivity-analysis` | `sensitivity_analysis` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/what-if` | `what_if_analysis` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/what-if/batch` | `what_if_batch` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/attribution` | `attribution_analysis` | api/v1/routes/sub_parameter.py |
| GET | `/api/v1/sub-parameter/interactions/{scenario_id}` | `interaction_analysis` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/interaction-matrix` | `interaction_matrix` | api/v1/routes/sub_parameter.py |
| GET | `/api/v1/sub-parameter/visualization/tornado/{scenario_id}` | `viz_tornado` | api/v1/routes/sub_parameter.py |
| GET | `/api/v1/sub-parameter/visualization/waterfall/{scenario_id}` | `viz_waterfall` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/elasticity` | `elasticity_analysis` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/partial-correlation` | `partial_corr` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/ols-attribution` | `ols_attribution` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/shapley` | `shapley_attribution` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/export` | `export_analyses` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/custom-scenario/{cs_id}/analysis` | `analyze_custom_scenario` | api/v1/routes/sub_parameter.py |

### 2.3 Engine `analysis_export` (services/analysis_export.py)
| Function | Args | Purpose |
|---|---|---|
| `export_analysis_excel` | analyses | Export analysis results to Excel. |
| `export_analysis_pdf` | analyses | Export analysis results to PDF. |
| `export_analysis_json` | analyses | Export raw analysis data as JSON. |

### 2.3 Engine `sub_parameter_engine` (services/sub_parameter_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_extract_metric` | impacts, metric_key | Extract a metric value from nested impacts dict. |
| `_get_matching_trajs` | base_trajs, param_name | Find trajectories matching a parameter name pattern. |
| `run_sensitivity_analysis` | base_trajs, target_metric, parameters, variation_range, analysis_type | Run sensitivity analysis on scenario parameters. |
| `run_what_if` | base_trajs, changes | What-if analysis: apply changes and compare to baseline. |
| `run_attribution` | base_trajs, outcome_metric | Shapley-inspired attribution: estimate each parameter's contribution to outcome. |
| `run_interaction_analysis` | base_trajs, parameters | Pairwise interaction analysis between parameters. |
| `get_visualization_tornado` | base_trajs, target_metric, top_n | Pre-formatted tornado chart data. |
| `get_visualization_waterfall` | base_trajs, customizations | Waterfall chart showing step-by-step parameter impact. |
| `run_elasticity_analysis` | base_trajs, target_metric, parameters, delta_pct | Elasticity analysis: (% change in outcome) / (% change in parameter). |
| `_interpret_elasticity` | e, param |  |
| `run_partial_correlation` | base_trajs, target_metric, parameters | Partial correlation: isolate each parameter's independent effect, |
| `run_ols_attribution` | base_trajs, target_metric, parameters | OLS regression-based attribution. |
| `_solve_linear` | A, b, n | Solve Ax = b via Gaussian elimination. |
| `run_enhanced_shapley` | base_trajs, target_metric, parameters, n_permutations | Enhanced Shapley attribution with permutation sampling. |
| `get_key_drivers` | base_trajs, top_n | Get top N parameters driving scenario outcomes across all metrics. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sub-parameter/custom-scenario/{cs_id}/key-drivers** — status `failed`, provenance ['db-empty'], source tables: `custom_scenarios_v2`
Output: `None`

**GET /api/v1/sub-parameter/interactions/{scenario_id}** — status `failed`, provenance ['db-empty'], source tables: `hub_scenarios`
Output: `None`

**GET /api/v1/sub-parameter/parameters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['parameters'], 'n_keys': 1}`

**GET /api/v1/sub-parameter/visualization/tornado/{scenario_id}** — status `failed`, provenance ['db-empty'], source tables: `hub_scenarios`
Output: `None`

**GET /api/v1/sub-parameter/visualization/waterfall/{scenario_id}** — status `failed`, provenance ['db-empty'], source tables: `hub_scenarios`
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `analysis_export` — extracted transformation lines:**
```python
doc = SimpleDocTemplate(filepath, pagesize=A4, leftMargin=25*mm, rightMargin=25*mm)
```

**Engine `sub_parameter_engine` — extracted transformation lines:**
```python
low_vals = {y: round(v * (1 - variation_range), 4) for y, v in ts.items() if isinstance(v, (int, float))}
high_vals = {y: round(v * (1 + variation_range), 4) for y, v in ts.items() if isinstance(v, (int, float))}
swing = abs(high_val - low_val)
contribution = baseline_val - zero_val
unexplained = max(0, abs(baseline_val) - explained) if baseline_val != 0 else 0
high_vals = {y: round(v * (1 + variation), 4) for y, v in ts.items() if isinstance(v, (int, float))}
expected = e1 + e2
high_vals = {y: round(v * (1 + variation), 4) for y, v in ts.items() if isinstance(v, (int, float))}
joint_val = (_extract_metric(joint_impacts, metric_key) or baseline_val) - baseline_val
interaction_effect = joint_val - expected
strength = abs(interaction_effect) / max(abs(expected), 0.001)
delta = new_val - baseline_temp
perturbed = {y: round(v * (1 + delta_pct / 100), 4) for y, v in ts.items() if isinstance(v, (int, float))}
outcome_pct_change = (new_val - baseline_val) / abs(baseline_val) * 100
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).