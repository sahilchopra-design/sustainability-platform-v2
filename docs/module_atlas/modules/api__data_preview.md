# Api::Data_Preview
**Module ID:** `api::data_preview` · **Route:** `/api/v1/data-preview` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/data-preview/tables` | `list_tables` | api/v1/routes/data_preview.py |
| GET | `/api/v1/data-preview/tables/{table_name}/preview` | `preview_table` | api/v1/routes/data_preview.py |
| GET | `/api/v1/data-preview/relationships` | `get_relationships` | api/v1/routes/data_preview.py |
| GET | `/api/v1/data-preview/datapoint-mappings` | `get_datapoint_mappings` | api/v1/routes/data_preview.py |
| GET | `/api/v1/data-preview/modules` | `get_modules` | api/v1/routes/data_preview.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `its`, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/data-preview/datapoint-mappings** — status `passed`, provenance ['real-db'], source tables: `information_schema.columns`, `information_schema.constraint_column_usage`, `information_schema.key_column_usage`, `information_schema.table_constraints`
Output: `{'type': 'object', 'keys': ['mappings', 'total_mappings', 'by_category', 'by_confidence', 'module_pair_summary'], 'n_keys': 5}`

**GET /api/v1/data-preview/modules** — status `passed`, provenance ['real-db'], source tables: `information_schema.tables`
Output: `{'type': 'object', 'keys': ['modules', 'total_modules'], 'n_keys': 2}`

**GET /api/v1/data-preview/relationships** — status `passed`, provenance ['real-db'], source tables: `information_schema.constraint_column_usage`, `information_schema.key_column_usage`, `information_schema.table_constraints`
Output: `{'type': 'object', 'keys': ['relationships', 'total_relationships', 'cross_module_count', 'module_adjacency'], 'n_keys': 4}`

**GET /api/v1/data-preview/tables** — status `passed`, provenance ['real-db'], source tables: `information_schema.columns`, `information_schema.key_column_usage`, `information_schema.table_constraints`, `information_schema.tables`, `public`
Output: `{'type': 'object', 'keys': ['tables', 'total_tables'], 'n_keys': 2}`

**GET /api/v1/data-preview/tables/{table_name}/preview** — status `failed`, provenance ['db-empty'], source tables: `information_schema.tables`
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).