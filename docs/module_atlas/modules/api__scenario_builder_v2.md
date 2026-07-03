# Api::Scenario_Builder_V2
**Module ID:** `api::scenario_builder_v2` · **Route:** `/api/v1/scenario-builder` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/scenario-builder/preview` | `preview_impacts` | api/v1/routes/scenario_builder_v2.py |
| POST | `/api/v1/scenario-builder/customize` | `create_custom_scenario` | api/v1/routes/scenario_builder_v2.py |
| POST | `/api/v1/scenario-builder/calculate-impacts` | `calc_impacts` | api/v1/routes/scenario_builder_v2.py |
| POST | `/api/v1/scenario-builder/validate` | `validate` | api/v1/routes/scenario_builder_v2.py |
| POST | `/api/v1/scenario-builder/simulate` | `run_simulation` | api/v1/routes/scenario_builder_v2.py |
| GET | `/api/v1/scenario-builder/simulations/{sim_id}` | `get_simulation` | api/v1/routes/scenario_builder_v2.py |
| GET | `/api/v1/scenario-builder/custom` | `list_custom_scenarios` | api/v1/routes/scenario_builder_v2.py |
| GET | `/api/v1/scenario-builder/custom/{cs_id}` | `get_custom_scenario` | api/v1/routes/scenario_builder_v2.py |
| PUT | `/api/v1/scenario-builder/custom/{cs_id}` | `update_custom_scenario` | api/v1/routes/scenario_builder_v2.py |
| DELETE | `/api/v1/scenario-builder/custom/{cs_id}` | `delete_custom_scenario` | api/v1/routes/scenario_builder_v2.py |
| POST | `/api/v1/scenario-builder/custom/{cs_id}/fork` | `fork_custom_scenario` | api/v1/routes/scenario_builder_v2.py |
| GET | `/api/v1/scenario-builder/base-scenarios` | `list_base_scenarios` | api/v1/routes/scenario_builder_v2.py |

### 2.3 Engine `builder_engine` (services/builder_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `interpolate_series` | data, method | Fill missing years in a time series dict. |
| `calculate_impacts` | base_trajectories, customizations | Calculate climate/economic/risk impacts from customized trajectories. |
| `run_monte_carlo` | base_trajectories, customizations, iterations, seed | Monte Carlo simulation — varies key parameters within uncertainty ranges. |
| `validate_customizations` | customizations | Validate parameter constraints. |
| `_find_series` | traj_map | Find a trajectory by keyword matching. |
| `_calc_temperature` | emissions_ts | Simple TCRE-based temperature projection. |
| `_calc_economic` | gdp_ts, carbon_price_ts | Economic impact assessment. |
| `_calc_risks` | temp_outcome, carbon_price_ts, emissions_ts | Calculate risk scores 1-10. |
| `_risk_label` | score |  |
| `_calc_energy_indicators` | traj_map | Extract energy transition indicators from trajectories. |
| `_build_trajectory_output` | ts |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `any`, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/scenario-builder/base-scenarios** — status `passed`, provenance ['real-db'], source tables: `hub_scenarios`, `hub_sources`, `hub_trajectories`
Output: `{'type': 'array', 'len': 102, 'item0_keys': ['id', 'name', 'source_name', 'category', 'temperature_target', 'trajectory_count', 'variables']}`

**GET /api/v1/scenario-builder/custom** — status `passed`, provenance ['real-db'], source tables: `custom_scenarios_v2`, `hub_scenarios`, `hub_sources`, `parameter_customizations`
Output: `{'type': 'array', 'len': 2, 'item0_keys': ['id', 'name', 'description', 'is_public', 'is_fork', 'tags', 'base_scenario', 'customizations', 'calculated_impacts', 'created_at', 'updated_at']}`

**GET /api/v1/scenario-builder/custom/{cs_id}** — status `failed`, provenance ['db-empty'], source tables: `custom_scenarios_v2`
Output: `None`

**GET /api/v1/scenario-builder/simulations/{sim_id}** — status `failed`, provenance ['db-empty'], source tables: `simulation_runs`
Output: `None`

**POST /api/v1/scenario-builder/calculate-impacts** — status `failed`, provenance ['db-empty'], source tables: `hub_trajectories`
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `builder_engine` — extracted transformation lines:**
```python
frac = (y - prev) / (nxt - prev)
vals[y] = round(vals[y] * noise, 4) if isinstance(vals[y], (int, float)) else vals[y]
temp = BASELINE_TEMP_2020 + cumulative * TCRE
p15 = max(0, min(100, round((1 - budget_used / CARBON_BUDGET_1_5C) * 100, 1))) if budget_used > 0 else 50
p20 = max(0, min(100, round((1 - budget_used / CARBON_BUDGET_2C) * 100 + 30, 1))) if budget_used > 0 else 70
investment_pct = round(min(8, cp_2050 / 80), 1)
physical = min(10, max(1, round((t2100 - 1.0) * 3.5, 1)))
transition = min(10, max(1, round(cp_2050 / 60, 1)))
overall = round(physical * 0.5 + transition * 0.5, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).