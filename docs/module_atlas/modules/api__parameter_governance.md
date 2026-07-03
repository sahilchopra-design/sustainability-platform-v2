# Api::Parameter_Governance
**Module ID:** `api::parameter_governance` · **Route:** `/api/v1/parameters` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/parameters` | `list_parameters` | api/v1/routes/parameter_governance.py |
| POST | `/api/v1/parameters` | `propose_parameter` | api/v1/routes/parameter_governance.py |
| GET | `/api/v1/parameters/change-requests` | `list_change_requests` | api/v1/routes/parameter_governance.py |
| GET | `/api/v1/parameters/{param_id}` | `get_parameter` | api/v1/routes/parameter_governance.py |
| POST | `/api/v1/parameters/{param_id}/approve` | `approve_parameter` | api/v1/routes/parameter_governance.py |
| POST | `/api/v1/parameters/{param_id}/reject` | `reject_parameter` | api/v1/routes/parameter_governance.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `__future__` *(shared)*, `calculation_parameters`, `datetime` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `parameter_change_requests`, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/parameters** — status `passed`, provenance ['db-empty'], source tables: `calculation_parameters`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/parameters/change-requests** — status `passed`, provenance ['db-empty'], source tables: `parameter_change_requests`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/parameters/{param_id}** — status `failed`, provenance ['db-empty'], source tables: `calculation_parameters`
Output: `None`

**POST /api/v1/parameters** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/parameters/{param_id}/approve** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).