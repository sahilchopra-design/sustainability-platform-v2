# Api::Carbon_Prices
**Module ID:** `api::carbon_prices` · **Route:** `/api/v1/carbon-prices` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/carbon-prices/compare` | `compare_carbon_prices` | api/v1/routes/carbon_prices.py |
| GET | `/api/v1/carbon-prices/scenarios` | `list_carbon_price_scenarios` | api/v1/routes/carbon_prices.py |
| GET | `/api/v1/carbon-prices/stats` | `carbon_price_stats` | api/v1/routes/carbon_prices.py |
| GET | `/api/v1/carbon-prices/{scenario}` | `get_carbon_price` | api/v1/routes/carbon_prices.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `NGFS` *(shared)*, `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/carbon-prices/compare** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['region', 'year', 'scenarios'], 'n_keys': 3}`

**GET /api/v1/carbon-prices/scenarios** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['scenarios', 'total'], 'n_keys': 2}`

**GET /api/v1/carbon-prices/stats** — status `passed`, provenance ['real-db'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['total_data_points', 'distinct_scenarios', 'distinct_models'], 'n_keys': 3}`

**GET /api/v1/carbon-prices/{scenario}** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['scenario', 'region', 'year', 'price_usd', 'unit', 'source', 'time_series'], 'n_keys': 7}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).