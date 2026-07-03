# Api::Scenario_Analysis
**Module ID:** `api::scenario_analysis` · **Route:** `/api/v1/scenarios` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/scenarios/dashboard` | `get_dashboard` | api/v1/routes/scenario_analysis.py |
| POST | `/api/v1/scenarios/build` | `build_scenario` | api/v1/routes/scenario_analysis.py |
| GET | `/api/v1/scenarios/list` | `list_all_scenarios` | api/v1/routes/scenario_analysis.py |
| GET | `/api/v1/scenarios/properties` | `get_available_properties` | api/v1/routes/scenario_analysis.py |
| GET | `/api/v1/scenarios/{scenario_id}` | `get_scenario_by_id` | api/v1/routes/scenario_analysis.py |
| POST | `/api/v1/scenarios/compare` | `compare_scenarios` | api/v1/routes/scenario_analysis.py |
| POST | `/api/v1/scenarios/batch-create` | `batch_create_scenarios` | api/v1/routes/scenario_analysis.py |
| GET | `/api/v1/scenarios/templates/list` | `get_templates` | api/v1/routes/scenario_analysis.py |
| POST | `/api/v1/scenarios/templates/apply` | `apply_template` | api/v1/routes/scenario_analysis.py |

### 2.3 Engine `scenario_analysis_engine` (services/scenario_analysis_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `get_sample_properties` |  | Sample properties for scenario analysis. |
| `_get_db_engine` |  | Get or create database engine. |
| `save_scenario` | scenario_id, scenario_data | Save scenario to PostgreSQL. |
| `get_scenario` | scenario_id | Get scenario from PostgreSQL. |
| `list_scenarios` |  | List all scenarios from PostgreSQL. |
| `delete_scenario` | scenario_id | Delete scenario from PostgreSQL. |
| `calculate_value_direct_cap` | noi, cap_rate | Calculate property value using direct capitalization. |
| `calculate_noi` | gross_floor_area, rent_psf, vacancy_rate, expense_ratio | Calculate Net Operating Income. |
| `calculate_dcf_value` | noi, rent_growth, discount_rate, exit_cap, holding_years | Calculate DCF value and IRR. |
| `ScenarioBuilderEngine.get_property` | property_id | Get property by ID. |
| `ScenarioBuilderEngine.calculate_property_value` | property_data | Calculate comprehensive property valuation. |
| `ScenarioBuilderEngine.apply_modification` | property_data, mod | Apply a single modification to property data. |
| `ScenarioBuilderEngine.build_scenario` | request | Build a custom scenario with modifications. |
| `ScenarioBuilderEngine.compare_scenarios` | base_property_id, scenario_ids, metrics | Compare multiple scenarios. |
| `SensitivityAnalysisEngine.analyze` | property_id, base_valuation, variables | Perform comprehensive sensitivity analysis. |
| `SensitivityAnalysisEngine._apply_variable_change` | property_data, var_name, value | Apply variable change to property data. |
| `SensitivityAnalysisEngine._generate_tornado_data` | sensitivities, base_value, variables | Generate tornado chart data. |
| `SensitivityAnalysisEngine._generate_spider_data` | property_data, variables | Generate spider chart data. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `mock-sample`, `real-db`

**Database tables:** `api` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `highest`, `schemas` *(shared)*, `services` *(shared)*, `typing` *(shared)*, `uuid` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/scenarios/dashboard** — status `passed`, provenance ['real-db'], source tables: `scenarios`
Output: `{'type': 'object', 'keys': ['total_scenarios', 'total_analyses', 'recent_scenarios', 'most_impactful_variables', 'avg_value_swing_pct'], 'n_keys': 5}`

**GET /api/v1/scenarios/list** — status `passed`, provenance ['real-db'], source tables: `scenarios`
Output: `{'type': 'object', 'keys': ['items', 'total'], 'n_keys': 2}`

**GET /api/v1/scenarios/properties** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'object', 'keys': ['properties'], 'n_keys': 1}`

**GET /api/v1/scenarios/templates/list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['templates', 'total'], 'n_keys': 2}`

**GET /api/v1/scenarios/{scenario_id}** — status `passed`, provenance ['real-db'], source tables: `scenarios`
Output: `{'type': 'object', 'keys': ['scenario_name', 'description', 'base_property_id', 'modifications', 'base_value', 'adjusted_value', 'value_change_pct', 'id', 'user_id', 'created_at'], 'n_keys': 10}`

## 5 · Intermediate Transformation Logic

**Engine `scenario_analysis_engine` — extracted transformation lines:**
```python
pgi = Decimal(str(gross_floor_area)) * rent_psf
egi = pgi * (1 - vacancy_rate)
expenses = egi * expense_ratio
terminal_value = current_noi / float(exit_cap)
npv = sum(cf / ((1 + disc) ** (i + 1)) for i, cf in enumerate(cash_flows))
irr_estimate = disc + (growth * 0.5) + ((float(exit_cap) - disc) * 0.1)
impact = new_value - running_value
value_change = adjusted_value - base_value
worst_scenario = sorted_rows[-1].scenario_name
value_spread = max(r.value for r in comparison_rows) - min(r.value for r in comparison_rows)
step_size = (var.range.max - var.range.min) / (var.steps - 1)
current_value = var.range.min + (i * step_size)
change_from_base = new_value - base_valuation
swing = high_impact - low_impact
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).