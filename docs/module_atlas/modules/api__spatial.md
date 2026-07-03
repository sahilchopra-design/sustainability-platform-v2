# Api::Spatial
**Module ID:** `api::spatial` · **Route:** `/api/v1/spatial` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/spatial/assets/wildfire-risk` | `assets_wildfire_risk` | api/v1/routes/spatial.py |
| GET | `/api/v1/spatial/ref/status` | `ref_postgis_status` | api/v1/routes/spatial.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `real-db`

**Database tables:** `__future__` *(shared)*, `db` *(shared)*, `eudr_geolocation_proofs`, `exc` *(shared)*, `fastapi` *(shared)*, `pg_am`, `pg_attribute`, `pg_class`, `pg_index`, `pg_namespace`, `pydantic` *(shared)*, `ref_flood_zones`, `ref_protected_areas`, `ref_sea_level_zones`, `ref_wildfire_zones`, `sqlalchemy` *(shared)*, `typing` *(shared)*, `valuation_assets`, `vw_postgis_status`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/spatial/ref/spatial-indexes** — status `passed`, provenance ['real-db'], source tables: `pg_am`, `pg_attribute`, `pg_class`, `pg_index`, `pg_namespace`
Output: `{'type': 'object', 'keys': ['gist_index_count', 'indexes'], 'n_keys': 2}`

**GET /api/v1/spatial/ref/status** — status `passed`, provenance ['real-db'], source tables: `ref_flood_zones`, `ref_protected_areas`, `ref_sea_level_zones`, `ref_wildfire_zones`, `vw_postgis_status`
Output: `{'type': 'object', 'keys': ['postgis_active', 'extensions', 'reference_table_counts', 'data_load_required', 'note'], 'n_keys': 5}`

**POST /api/v1/spatial/assets/flood-zones** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/spatial/assets/protected-areas** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/spatial/assets/wildfire-risk** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).