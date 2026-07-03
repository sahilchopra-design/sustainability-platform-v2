# Api::Ingestion
**Module ID:** `api::ingestion` · **Route:** `/api/v1/ingestion` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/ingestion/ingesters` | `list_ingesters` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/ingesters/{source_id}` | `get_ingester_status` | api/v1/routes/ingestion.py |
| POST | `/api/v1/ingestion/trigger` | `trigger_ingestion` | api/v1/routes/ingestion.py |
| POST | `/api/v1/ingestion/trigger-all` | `trigger_all_ingestion` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/running` | `get_running_jobs` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/jobs` | `list_sync_jobs` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/jobs/{job_id}` | `get_sync_job` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/scheduler` | `get_scheduler_status` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/stats` | `get_ingestion_stats` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/sources` | `list_data_sources` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/sources/{source_id}` | `get_data_source` | api/v1/routes/ingestion.py |
| PATCH | `/api/v1/ingestion/sources/{source_id}/sync-config` | `update_sync_config` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/kpis` | `list_kpis` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/kpis/{kpi_id}` | `get_kpi_detail` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/kpi-categories` | `list_kpi_categories` | api/v1/routes/ingestion.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `an` *(shared)*, `api` *(shared)*, `collections` *(shared)*, `db` *(shared)*, `dh_data_sources`, `fastapi` *(shared)*, `info`, `ingestion`, `mappings`, `pydantic` *(shared)*, `registry` *(shared)*, `source` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ingestion/cross-source** — status `passed`, provenance ['db-empty'], source tables: `dh_kpi_mappings`
Output: `{'type': 'object', 'keys': ['comparisons', 'total'], 'n_keys': 2}`

**GET /api/v1/ingestion/ingesters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ingesters', 'total'], 'n_keys': 2}`

**GET /api/v1/ingestion/ingesters/{source_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/ingestion/jobs** — status `passed`, provenance ['real-db'], source tables: `dh_sync_jobs`
Output: `{'type': 'object', 'keys': ['total', 'limit', 'offset', 'jobs'], 'n_keys': 4}`

**GET /api/v1/ingestion/jobs/{job_id}** — status `failed`, provenance ['db-empty'], source tables: `dh_sync_jobs`
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).