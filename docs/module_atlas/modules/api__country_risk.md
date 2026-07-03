# Api::Country_Risk
**Module ID:** `api::country_risk` · **Route:** `/api/v1/country-risk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/country-risk/indices` | `list_available_indices` | api/v1/routes/country_risk.py |
| GET | `/api/v1/country-risk/country/{country_iso3}` | `get_country_profile` | api/v1/routes/country_risk.py |
| GET | `/api/v1/country-risk/rankings/{index_name}` | `get_index_rankings` | api/v1/routes/country_risk.py |
| GET | `/api/v1/country-risk/compare` | `compare_countries` | api/v1/routes/country_risk.py |
| GET | `/api/v1/country-risk/heatmap` | `country_risk_heatmap` | api/v1/routes/country_risk.py |
| GET | `/api/v1/country-risk/coal-capacity` | `coal_capacity_by_country` | api/v1/routes/country_risk.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `GEM`, `db` *(shared)*, `dh_country_risk_indices` *(shared)*, `dh_reference_data` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/country-risk/coal-capacity** — status `passed`, provenance ['real-db'], source tables: `dh_reference_data`
Output: `{'type': 'object', 'keys': ['total_countries', 'showing', 'countries'], 'n_keys': 3}`

**GET /api/v1/country-risk/compare** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/country-risk/country/{country_iso3}** — status `failed`, provenance ['db-empty'], source tables: `dh_country_risk_indices`
Output: `None`

**GET /api/v1/country-risk/heatmap** — status `passed`, provenance ['real-db'], source tables: `dh_country_risk_indices`
Output: `{'type': 'object', 'keys': ['index_name', 'year', 'data'], 'n_keys': 3}`

**GET /api/v1/country-risk/indices** — status `passed`, provenance ['real-db'], source tables: `dh_country_risk_indices`
Output: `{'type': 'object', 'keys': ['indices'], 'n_keys': 1}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).