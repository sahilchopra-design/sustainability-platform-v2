# Api::Emissions_Data
**Module ID:** `api::emissions_data` · **Route:** `/api/v1/emissions` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/emissions/by-lei/{lei}` | `emissions_by_lei` | api/v1/routes/emissions_data.py |
| GET | `/api/v1/emissions/climate-trace` | `search_climate_trace` | api/v1/routes/emissions_data.py |
| GET | `/api/v1/emissions/climate-trace/sectors` | `ct_sectors` | api/v1/routes/emissions_data.py |
| GET | `/api/v1/emissions/climate-trace/countries` | `ct_countries` | api/v1/routes/emissions_data.py |
| GET | `/api/v1/emissions/owid` | `search_owid` | api/v1/routes/emissions_data.py |
| GET | `/api/v1/emissions/owid/countries` | `owid_countries` | api/v1/routes/emissions_data.py |
| GET | `/api/v1/emissions/owid/{iso3}` | `owid_country_series` | api/v1/routes/emissions_data.py |
| GET | `/api/v1/emissions/stats` | `emissions_stats` | api/v1/routes/emissions_data.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `CDP`, `OWID`, `__future__` *(shared)*, `api` *(shared)*, `country` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `national` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/emissions/by-lei/{lei}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/emissions/climate-trace** — status `passed`, provenance ['real-db'], source tables: `dh_climate_trace_emissions`
Output: `{'type': 'object', 'keys': ['total', 'offset', 'limit', 'records'], 'n_keys': 4}`

**GET /api/v1/emissions/climate-trace/countries** — status `passed`, provenance ['db-empty'], source tables: `dh_climate_trace_emissions`
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/emissions/climate-trace/sectors** — status `passed`, provenance ['db-empty'], source tables: `dh_climate_trace_emissions`
Output: `{'type': 'object', 'keys': ['sectors'], 'n_keys': 1}`

**GET /api/v1/emissions/owid** — status `passed`, provenance ['real-db'], source tables: `dh_owid_co2_energy`
Output: `{'type': 'object', 'keys': ['total', 'offset', 'limit', 'records'], 'n_keys': 4}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).