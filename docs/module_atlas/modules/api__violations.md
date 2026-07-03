# Api::Violations
**Module ID:** `api::violations` · **Route:** `/api/v1/violations` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/violations/search` | `search_violations` | api/v1/routes/violations.py |
| GET | `/api/v1/violations/companies` | `violation_companies` | api/v1/routes/violations.py |
| GET | `/api/v1/violations/types` | `violation_types` | api/v1/routes/violations.py |
| GET | `/api/v1/violations/agencies` | `violation_agencies` | api/v1/routes/violations.py |
| GET | `/api/v1/violations/sectors` | `violation_sectors` | api/v1/routes/violations.py |
| GET | `/api/v1/violations/company/{company_name}` | `violations_by_company` | api/v1/routes/violations.py |
| GET | `/api/v1/violations/stats` | `violation_stats` | api/v1/routes/violations.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `dh_violation_tracker`, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/violations/agencies** — status `passed`, provenance ['real-db'], source tables: `dh_violation_tracker`
Output: `{'type': 'object', 'keys': ['agencies'], 'n_keys': 1}`

**GET /api/v1/violations/companies** — status `passed`, provenance ['real-db'], source tables: `dh_violation_tracker`
Output: `{'type': 'object', 'keys': ['companies'], 'n_keys': 1}`

**GET /api/v1/violations/company/{company_name}** — status `failed`, provenance ['db-empty'], source tables: `dh_violation_tracker`
Output: `None`

**GET /api/v1/violations/search** — status `passed`, provenance ['real-db'], source tables: `dh_violation_tracker`
Output: `{'type': 'object', 'keys': ['records', 'total'], 'n_keys': 2}`

**GET /api/v1/violations/sectors** — status `passed`, provenance ['real-db'], source tables: `dh_violation_tracker`
Output: `{'type': 'object', 'keys': ['sectors'], 'n_keys': 1}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).