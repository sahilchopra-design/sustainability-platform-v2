# Api::Analysis
**Module ID:** `api::analysis` · **Route:** `/api/v1/analysis` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/analysis/comparisons` | `list_comparisons` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/comparisons` | `create_comparison` | api/v1/routes/analysis.py |
| GET | `/api/v1/analysis/comparisons/{comp_id}` | `get_comparison` | api/v1/routes/analysis.py |
| GET | `/api/v1/analysis/comparisons/{comp_id}/data` | `get_comparison_data` | api/v1/routes/analysis.py |
| DELETE | `/api/v1/analysis/comparisons/{comp_id}` | `delete_comparison` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/compare` | `adhoc_compare` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/comparisons/{comp_id}/gap-analysis` | `run_gap_analysis` | api/v1/routes/analysis.py |
| GET | `/api/v1/analysis/comparisons/{comp_id}/gap-analysis` | `get_gap_analysis` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/scenarios/{scenario_id}/consistency-check` | `run_consistency_check` | api/v1/routes/analysis.py |
| GET | `/api/v1/analysis/scenarios/{scenario_id}/consistency-check` | `get_consistency_checks` | api/v1/routes/analysis.py |
| GET | `/api/v1/analysis/alerts` | `list_alerts` | api/v1/routes/analysis.py |
| PATCH | `/api/v1/analysis/alerts/{alert_id}/read` | `mark_alert_read` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/alerts` | `create_alert` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/impact` | `calculate_impact` | api/v1/routes/analysis.py |
| POST | `/api/v1/analysis/custom-scenarios` | `create_custom_scenario` | api/v1/routes/analysis.py |

### 2.3 Engine `custom_scenario_builder` (services/custom_scenario_builder.py)
| Function | Args | Purpose |
|---|---|---|
| `build_custom_scenario` | db, name, description, base_scenario_id, overrides, created_by | Create a custom scenario by blending trajectories. |

### 2.3 Engine `impact_calculator` (services/impact_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `map_scenario_to_engine` | scenario | Map a hub scenario to one of the 3 engine scenario types. |
| `extract_scenario_multipliers` | db, scenario_id | Extract key multipliers from scenario trajectories for impact calculation. |
| `run_impact_calculation` | db, scenario_id, portfolio_assets, horizons | Run impact calculation for a hub scenario against a portfolio. |

### 2.3 Engine `portfolio_upload` (services/portfolio_upload.py)
| Function | Args | Purpose |
|---|---|---|
| `parse_portfolio_csv` | content, column_mapping | Parse CSV content into portfolio assets. |
| `_auto_map_columns` | columns | Auto-detect column mapping from CSV headers. |
| `_parse_row` | row, mapping, row_num | Parse a single CSV row into an asset dict. |

### 2.3 Engine `report_generator` (services/report_generator.py)
| Function | Args | Purpose |
|---|---|---|
| `_build_narrative_data` | impact_data, portfolio_data, scenario_data | Build the template data dict from raw report inputs. |
| `generate_pdf_report` | impact_data, portfolio_data, scenario_data | Generate a professional PDF report. Returns the filename. |
| `generate_excel_report` | impact_data, portfolio_data, scenario_data | Generate an Excel report. Returns the filename. |
| `generate_csv_report` | impact_data, portfolio_data | Generate a CSV report of impact results. |

### 2.3 Engine `scenario_comparison_service` (services/scenario_comparison_service.py)
| Function | Args | Purpose |
|---|---|---|
| `ScenarioComparisonService.create_comparison` | data |  |
| `ScenarioComparisonService.get_comparison` | comp_id |  |
| `ScenarioComparisonService.list_comparisons` |  |  |
| `ScenarioComparisonService.delete_comparison` | comp_id |  |
| `ScenarioComparisonService.build_comparison_data` | comp_id | Build the full comparison dataset for a saved comparison. |
| `ScenarioComparisonService.build_adhoc_comparison` | scenario_ids, variables, regions, time_range | Build comparison data on-the-fly without saving. |
| `ScenarioComparisonService._build_data` | scenario_ids, variables, regions, time_range | Core: fetch trajectories for given scenarios, align and compute stats. |
| `ScenarioComparisonService._compute_stats` | series_list, years | Compute statistics across scenarios for each year. |
| `ScenarioComparisonService.run_gap_analysis` | comparison_id | Run gap analysis for a comparison. Compares base scenario to each compared scenario. |
| `ScenarioComparisonService._suggest_action` | gap_type, variable, gap_pct |  |
| `ScenarioComparisonService.get_gap_analyses` | comparison_id |  |
| `ScenarioComparisonService.run_consistency_check` | scenario_id | Run consistency checks on a scenario's trajectories. |
| `ScenarioComparisonService._check_carbon_budget` | scenario_id, traj_map, scenario |  |
| `ScenarioComparisonService._check_energy_balance` | scenario_id, traj_map |  |
| `ScenarioComparisonService._check_tech_deployment` | scenario_id, traj_map |  |
| `ScenarioComparisonService._check_economic_feasibility` | scenario_id, traj_map, scenario |  |
| `ScenarioComparisonService._save_check` | scenario_id, check_type, status, score, issues, details |  |
| `ScenarioComparisonService.get_consistency_checks` | scenario_id |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `api` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `models`, `parsed`, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/analysis/alerts** — status `passed`, provenance ['real-db'], source tables: `hub_alerts`
Output: `{'type': 'array', 'len': 1, 'item0_keys': None}`

**GET /api/v1/analysis/comparisons** — status `passed`, provenance ['real-db'], source tables: `hub_comparisons`
Output: `{'type': 'array', 'len': 3, 'item0_keys': None}`

**GET /api/v1/analysis/comparisons/{comp_id}** — status `failed`, provenance ['db-empty'], source tables: `hub_comparisons`
Output: `None`

**GET /api/v1/analysis/comparisons/{comp_id}/data** — status `failed`, provenance ['db-empty'], source tables: `hub_comparisons`
Output: `None`

**GET /api/v1/analysis/comparisons/{comp_id}/gap-analysis** — status `passed`, provenance ['db-empty'], source tables: `hub_gap_analyses`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

## 5 · Intermediate Transformation Logic

**Engine `report_generator` — extracted transformation lines:**
```python
best = sorted_h[-1] if sorted_h else {}
leftMargin=25*mm, rightMargin=25*mm,
topMargin=20*mm, bottomMargin=20*mm)
last = horizons[-1]
col_w = [140] + [100] * len(horizons)
```

**Engine `scenario_comparison_service` — extracted transformation lines:**
```python
comp = DataHubComparison(**data)
all_ids = [comp.base_scenario_id] + (comp.compare_scenario_ids or [])
last_year = years[-1] if years else None
gap_val = cv - bv
gap_pct = (gap_val / abs(bv) * 100) if bv != 0 else 0
score = max(0.1, 1.0 - len(issues) * 0.2)
growth = (last / first - 1) * 100
span = int(years[-1]) - int(years[0])
annual = growth / span if span > 0 else 0
score = max(0.2, 1.0 - len(issues) * 0.25)
jump = (curr - prev) / prev * 100
score = max(0.3, 1.0 - len(issues) * 0.2)
alert = ScenarioAlert(**data)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).