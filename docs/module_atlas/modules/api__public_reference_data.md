# Api::Public_Reference_Data
**Module ID:** `api::public_reference_data` · **Route:** `/api/v1/refdata` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/refdata/sources` | `list_sources` | api/v1/routes/public_reference_data.py |
| GET | `/api/v1/refdata/{source_key}/metrics` | `list_metrics` | api/v1/routes/public_reference_data.py |
| GET | `/api/v1/refdata/{source_key}/points` | `get_points` | api/v1/routes/public_reference_data.py |
| GET | `/api/v1/refdata/{source_key}/records` | `get_records` | api/v1/routes/public_reference_data.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`, `reference-data`

**Database tables:** `db` *(shared)*, `fastapi` *(shared)*, `free`, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/refdata/sources** — status `passed`, provenance ['reference-data', 'real-db'], source tables: `reference_data_sources`
Output: `{'type': 'array', 'len': 31, 'item0_keys': ['source_key', 'name', 'provider', 'license', 'url', 'shape', 'cadence', 'row_count', 'last_ingested_at', 'status', 'meta']}`

**GET /api/v1/refdata/{source_key}/metrics** — status `passed`, provenance ['reference-data', 'db-empty'], source tables: `reference_data_points`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/refdata/{source_key}/points** — status `passed`, provenance ['reference-data', 'db-empty'], source tables: `reference_data_points`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/refdata/{source_key}/records** — status `passed`, provenance ['reference-data', 'db-empty'], source tables: `reference_data_records`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).