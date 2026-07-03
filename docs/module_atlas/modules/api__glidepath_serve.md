# Api::Glidepath_Serve
**Module ID:** `api::glidepath_serve` · **Route:** `/api/v1/glidepaths` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/glidepaths/nze/{sector}` | `get_nze_glidepath` | api/v1/routes/glidepath_serve.py |
| GET | `/api/v1/glidepaths/crrem/{country}/{asset_type}` | `get_crrem_pathway` | api/v1/routes/glidepath_serve.py |
| GET | `/api/v1/glidepaths/sectors` | `list_glidepath_sectors` | api/v1/routes/glidepath_serve.py |
| GET | `/api/v1/glidepaths/stats` | `glidepath_stats` | api/v1/routes/glidepath_serve.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `A13`, `NGFS` *(shared)*, `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `dh_crrem_pathways` *(shared)*, `dh_ngfs_scenario_data`, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/glidepaths/crrem/{country}/{asset_type}** — status `failed`, provenance ['db-empty'], source tables: `dh_crrem_pathways`
Output: `None`

**GET /api/v1/glidepaths/nze/{sector}** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['sector', 'scenario', 'region', 'variable_pattern', 'data_points', 'glidepath_series'], 'n_keys': 6}`

**GET /api/v1/glidepaths/sectors** — status `passed`, provenance ['real-db'], source tables: `dh_crrem_pathways`
Output: `{'type': 'object', 'keys': ['ngfs_sectors', 'crrem_asset_types', 'crrem_countries', 'crrem_source'], 'n_keys': 4}`

**GET /api/v1/glidepaths/stats** — status `passed`, provenance ['real-db'], source tables: `dh_crrem_pathways`, `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['ngfs_emission_records', 'ngfs_carbon_price_records', 'crrem_records', 'crrem_asset_types', 'crrem_countries', 'crrem_source'], 'n_keys': 6}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).