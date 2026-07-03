# Api::Csrd_Reports
**Module ID:** `api::csrd_reports` · **Route:** `/api/csrd` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/csrd/reports/upload` | `upload_csrd_pdf` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/reports` | `list_reports` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/reports/{report_id}` | `get_report` | api/v1/routes/csrd_reports.py |
| POST | `/api/csrd/reports/{report_id}/reprocess` | `reprocess_report` | api/v1/routes/csrd_reports.py |
| POST | `/api/csrd/ingest/bulk` | `bulk_ingest` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/entities` | `list_entities` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/entities/{entity_id}/kpis` | `get_entity_kpis` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/entities/{entity_id}/gaps` | `get_entity_gaps` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/entities/{entity_id}/dashboard` | `get_entity_dashboard` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/entities/{entity_id}/lineage` | `get_entity_lineage` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/catalog` | `list_catalog` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/catalog/summary/standards` | `catalog_summary_by_standard` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/catalog/summary/modules` | `catalog_summary_by_module` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/catalog/{indicator_code}` | `get_catalog_item` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/gri/standards` | `list_gri_standards` | api/v1/routes/csrd_reports.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `ESRS_INDICATORS`, `csrd_data_lineage`, `csrd_entity_registry` *(shared)*, `csrd_esrs_catalog`, `csrd_gap_tracker` *(shared)*, `csrd_kpi_values` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `gri_esrs_mapping`, `gri_standards`, `pathlib`, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `workers` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/csrd/catalog** — status `passed`, provenance ['real-db'], source tables: `csrd_esrs_catalog`
Output: `{'type': 'object', 'keys': ['total', 'page', 'page_size', 'items'], 'n_keys': 4}`

**GET /api/csrd/catalog/summary/modules** — status `passed`, provenance ['real-db'], source tables: `csrd_esrs_catalog`
Output: `{'type': 'object', 'keys': ['modules'], 'n_keys': 1}`

**GET /api/csrd/catalog/summary/standards** — status `passed`, provenance ['real-db'], source tables: `csrd_esrs_catalog`
Output: `{'type': 'object', 'keys': ['standards', 'total_data_points'], 'n_keys': 2}`

**GET /api/csrd/catalog/{indicator_code}** — status `failed`, provenance ['db-empty'], source tables: `csrd_esrs_catalog`
Output: `None`

**GET /api/csrd/entities** — status `passed`, provenance ['real-db'], source tables: `csrd_entity_registry`
Output: `{'type': 'array', 'len': 15, 'item0_keys': ['id', 'legal_name', 'primary_sector', 'country_iso', 'created_at']}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).