# Api::Scenarios
**Module ID:** `api::scenarios` · **Route:** `/api/v1/scenarios` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/scenarios/ngfs/sources` | `get_ngfs_sources` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios/ngfs/sources` | `create_ngfs_source` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios/ngfs/sync` | `sync_ngfs_data` | api/v1/routes/scenarios.py |
| GET | `/api/v1/scenarios/templates` | `get_scenario_templates` | api/v1/routes/scenarios.py |
| GET | `/api/v1/scenarios` | `list_scenarios` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios` | `create_scenario` | api/v1/routes/scenarios.py |
| GET | `/api/v1/scenarios/{scenario_id}` | `get_scenario` | api/v1/routes/scenarios.py |
| PATCH | `/api/v1/scenarios/{scenario_id}` | `update_scenario` | api/v1/routes/scenarios.py |
| DELETE | `/api/v1/scenarios/{scenario_id}` | `delete_scenario` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios/{scenario_id}/fork` | `fork_scenario` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios/{scenario_id}/publish` | `publish_scenario` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios/{scenario_id}/submit-for-approval` | `submit_for_approval` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios/{scenario_id}/approve` | `approve_scenario` | api/v1/routes/scenarios.py |
| GET | `/api/v1/scenarios/{scenario_id}/versions` | `get_scenario_versions` | api/v1/routes/scenarios.py |
| POST | `/api/v1/scenarios/{scenario_id}/preview` | `calculate_impact_preview` | api/v1/routes/scenarios.py |

### 2.3 Engine `ngfs_sync_service` (services/ngfs_sync_service.py)
| Function | Args | Purpose |
|---|---|---|
| `NGFSSyncService.get_ngfs_sources` |  | Get all NGFS data sources. |
| `NGFSSyncService.create_or_update_source` | name, url, version, release_date | Create or update NGFS data source. |
| `NGFSSyncService.sync_ngfs_scenarios` | source_id | Sync NGFS scenarios from a data source. |
| `NGFSSyncService.download_ngfs_data` | url | Download NGFS data from URL. |
| `NGFSSyncService.detect_changes` | source_id | Detect if NGFS data has changed since last sync. |

### 2.3 Engine `scenario_builder_service` (services/scenario_builder_service.py)
| Function | Args | Purpose |
|---|---|---|
| `ScenarioBuilderService.list_scenarios` | approval_status, source, published_only | List scenarios with optional filters. |
| `ScenarioBuilderService.get_scenario` | scenario_id | Get scenario by ID. |
| `ScenarioBuilderService.create_scenario` | scenario_data | Create a new scenario. |
| `ScenarioBuilderService.update_scenario` | scenario_id, updates, updated_by | Update scenario and create new version. |
| `ScenarioBuilderService.fork_scenario` | scenario_id, new_name, description, created_by | Fork (copy) a scenario. |
| `ScenarioBuilderService.submit_for_approval` | scenario_id, submitted_by, notes | Submit scenario for approval. |
| `ScenarioBuilderService.approve_scenario` | scenario_id, approved_by, notes | Approve a scenario. |
| `ScenarioBuilderService.reject_scenario` | scenario_id, rejected_by, reason | Reject a scenario. |
| `ScenarioBuilderService.publish_scenario` | scenario_id | Publish an approved scenario. |
| `ScenarioBuilderService.get_scenario_versions` | scenario_id | Get all versions of a scenario. |
| `ScenarioBuilderService.get_ngfs_templates` |  | Get NGFS scenario templates. |
| `ScenarioBuilderService._create_version` | scenario_id, version_number, parameters, change_summary, changed_by | Create a scenario version record. |

### 2.3 Engine `scenario_impact_service` (services/scenario_impact_service.py)
| Function | Args | Purpose |
|---|---|---|
| `ScenarioImpactService.calculate_impact` | scenario_id, portfolio_id, parameters_override | Calculate scenario impact on a portfolio. |
| `ScenarioImpactService._get_portfolio_holdings` | portfolio_id | Get holdings for a portfolio. |
| `ScenarioImpactService._calculate_baseline_expected_loss` | holdings | Calculate baseline expected loss (EL = PD * LGD * EAD). |
| `ScenarioImpactService._calculate_scenario_expected_loss` | holdings, parameters | Calculate scenario expected loss with climate impacts. |
| `ScenarioImpactService._calculate_impact_by_sector` | holdings, parameters | Calculate impact breakdown by sector. |
| `ScenarioImpactService._calculate_impact_by_rating` | holdings, parameters | Calculate impact breakdown by credit rating. |
| `ScenarioImpactService._get_top_impacted_holdings` | holdings, parameters, limit | Get holdings with highest expected loss increase. |
| `ScenarioImpactService._get_baseline_pd` | rating | Get baseline probability of default by credit rating. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `DRAFT`, `backend`, `db` *(shared)*, `fastapi` *(shared)*, `scenario`, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `workers` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/scenarios** — status `passed`, provenance ['real-db'], source tables: `scenarios`
Output: `{'type': 'array', 'len': 40, 'item0_keys': None}`

**GET /api/v1/scenarios/ngfs/sources** — status `passed`, provenance ['real-db'], source tables: `ngfs_data_sources`
Output: `{'type': 'array', 'len': 2, 'item0_keys': None}`

**GET /api/v1/scenarios/templates** — status `passed`, provenance ['real-db'], source tables: `scenarios`
Output: `{'type': 'array', 'len': 12, 'item0_keys': None}`

**GET /api/v1/scenarios/{scenario_id}** — status `failed`, provenance ['db-empty'], source tables: `scenarios`
Output: `None`

**GET /api/v1/scenarios/{scenario_id}/preview/{portfolio_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `ngfs_sync_service` — extracted transformation lines:**
```python
approval_status=ScenarioApprovalStatus.APPROVED,  # NGFS scenarios are pre-approved
```

**Engine `scenario_impact_service` — extracted transformation lines:**
```python
el_change = scenario_el - baseline_el
el_change_pct = (el_change / baseline_el * 100) if baseline_el > 0 else 0
el = pd * lgd * exposure
temperature_factor = 1 + (avg_temp_increase - 1.0) * 0.15  # 15% PD increase per degree above 1°C
gdp_factor = 1 + abs(gdp_impact_2050) * 0.05  # 5% PD increase per 1% GDP decline
scenario_pd = baseline_pd * sector_multiplier * temperature_factor * gdp_factor
scenario_lgd = min(baseline_lgd * 1.1, 0.9)  # Max 90% LGD
el = scenario_pd * scenario_lgd * exposure
baseline_el = baseline_pd * self.BASELINE_LGD * exposure
scenario_el = baseline_el * sector_multiplier * 1.5  # Simplified factor
baseline_el = baseline_pd * self.BASELINE_LGD * exposure
scenario_el = baseline_el * 1.8  # Simplified multiplier
baseline_el = baseline_pd * self.BASELINE_LGD * exposure
scenario_el = baseline_el * sector_multiplier * 1.5
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).