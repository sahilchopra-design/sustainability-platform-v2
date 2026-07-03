# Api::Energy_Data
**Module ID:** `api::energy_data` · **Route:** `/api/v1/energy-data` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/energy-data/coal-plants` | `search_coal_plants` | api/v1/routes/energy_data.py |
| GET | `/api/v1/energy-data/coal-plants/countries` | `coal_plant_countries` | api/v1/routes/energy_data.py |
| GET | `/api/v1/energy-data/coal-plants/owners` | `coal_plant_owners` | api/v1/routes/energy_data.py |
| GET | `/api/v1/energy-data/coal-plants/nearby` | `coal_plants_nearby` | api/v1/routes/energy_data.py |
| GET | `/api/v1/energy-data/coal-plants/pipeline` | `coal_plant_pipeline` | api/v1/routes/energy_data.py |
| GET | `/api/v1/energy-data/coal-plants/{gem_id}` | `get_coal_plant` | api/v1/routes/energy_data.py |
| GET | `/api/v1/energy-data/coal-units/{plant_id}` | `coal_plant_units` | api/v1/routes/energy_data.py |
| GET | `/api/v1/energy-data/stats` | `energy_data_stats` | api/v1/routes/energy_data.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `dh_gem_coal_plant_units`, `dh_gem_coal_plants`, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/energy-data/coal-plants** — status `passed`, provenance ['real-db'], source tables: `dh_gem_coal_plants`
Output: `{'type': 'object', 'keys': ['records', 'total'], 'n_keys': 2}`

**GET /api/v1/energy-data/coal-plants/countries** — status `passed`, provenance ['db-empty'], source tables: `dh_gem_coal_plants`
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/energy-data/coal-plants/nearby** — status `failed`, provenance ['db-empty'], source tables: `dh_gem_coal_plants`
Output: `None`

**GET /api/v1/energy-data/coal-plants/owners** — status `passed`, provenance ['db-empty'], source tables: `dh_gem_coal_plants`
Output: `{'type': 'object', 'keys': ['owners'], 'n_keys': 1}`

**GET /api/v1/energy-data/coal-plants/pipeline** — status `passed`, provenance ['db-empty'], source tables: `dh_gem_coal_plants`
Output: `{'type': 'object', 'keys': ['pipeline', 'total'], 'n_keys': 2}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).