# Api::Scenario_Data
**Module ID:** `api::scenario_data` · **Route:** `/api/v1/scenario-data` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/scenario-data/ngfs` | `search_ngfs` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/ngfs/scenarios` | `ngfs_scenarios` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/ngfs/variables` | `ngfs_variables` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/ngfs/models` | `ngfs_models` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/ngfs/compare` | `ngfs_compare` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/sbti` | `search_sbti` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/sbti/sectors` | `sbti_sectors` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/sbti/countries` | `sbti_countries` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/sbti/stats` | `sbti_stats` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/stats` | `combined_stats` | api/v1/routes/scenario_data.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/scenario-data/ngfs** — status `passed`, provenance ['real-db'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['total', 'offset', 'limit', 'records'], 'n_keys': 4}`

**GET /api/v1/scenario-data/ngfs/compare** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['variable', 'region', 'scenarios'], 'n_keys': 3}`

**GET /api/v1/scenario-data/ngfs/models** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['models'], 'n_keys': 1}`

**GET /api/v1/scenario-data/ngfs/scenarios** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['scenarios'], 'n_keys': 1}`

**GET /api/v1/scenario-data/ngfs/variables** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['variables'], 'n_keys': 1}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).