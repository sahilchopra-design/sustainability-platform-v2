# Api::Ca100
**Module ID:** `api::ca100` · **Route:** `/api/v1/ca100` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/ca100/companies` | `list_ca100_companies` | api/v1/routes/ca100.py |
| GET | `/api/v1/ca100/companies/{company_id}` | `get_ca100_company` | api/v1/routes/ca100.py |
| GET | `/api/v1/ca100/sectors` | `ca100_sector_summary` | api/v1/routes/ca100.py |
| GET | `/api/v1/ca100/filters` | `ca100_filter_options` | api/v1/routes/ca100.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `db` *(shared)*, `dh_ca100_assessments` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sector_cluster`, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ca100/companies** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`
Output: `{'type': 'object', 'keys': ['total', 'limit', 'offset', 'companies'], 'n_keys': 4}`

**GET /api/v1/ca100/companies/{company_id}** — status `failed`, provenance ['db-empty'], source tables: `dh_ca100_assessments`
Output: `None`

**GET /api/v1/ca100/filters** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`
Output: `{'type': 'object', 'keys': ['sector_clusters', 'sectors', 'hq_regions', 'overall_assessments'], 'n_keys': 4}`

**GET /api/v1/ca100/sectors** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`
Output: `{'type': 'object', 'keys': ['total_companies', 'sector_clusters'], 'n_keys': 2}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).