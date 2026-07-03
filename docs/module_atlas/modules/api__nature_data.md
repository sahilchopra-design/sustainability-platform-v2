# Api::Nature_Data
**Module ID:** `api::nature_data` · **Route:** `/api/v1/nature-data` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/nature-data/wdpa` | `search_wdpa` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/wdpa/countries` | `wdpa_countries` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/wdpa/nearby` | `wdpa_nearby` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/wdpa/{wdpa_id}` | `get_wdpa_by_id` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/gfw` | `search_gfw` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/gfw/countries` | `gfw_countries` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/gfw/{iso3}` | `gfw_country_timeseries` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/overlaps` | `nature_overlaps` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/stats` | `nature_data_stats` | api/v1/routes/nature_data.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `dh_gfw_tree_cover_loss`, `dh_nature_spatial_overlaps`, `dh_wdpa_protected_areas`, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/nature-data/gfw** — status `passed`, provenance ['real-db'], source tables: `dh_gfw_tree_cover_loss`
Output: `{'type': 'object', 'keys': ['records', 'total'], 'n_keys': 2}`

**GET /api/v1/nature-data/gfw/countries** — status `passed`, provenance ['db-empty'], source tables: `dh_gfw_tree_cover_loss`
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/nature-data/gfw/{iso3}** — status `failed`, provenance ['db-empty'], source tables: `dh_gfw_tree_cover_loss`
Output: `None`

**GET /api/v1/nature-data/overlaps** — status `passed`, provenance ['db-empty'], source tables: `dh_nature_spatial_overlaps`
Output: `{'type': 'object', 'keys': ['overlaps', 'total'], 'n_keys': 2}`

**GET /api/v1/nature-data/stats** — status `passed`, provenance ['real-db'], source tables: `dh_gfw_tree_cover_loss`, `dh_nature_spatial_overlaps`, `dh_wdpa_protected_areas`
Output: `{'type': 'object', 'keys': ['wdpa', 'gfw', 'overlaps'], 'n_keys': 3}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).