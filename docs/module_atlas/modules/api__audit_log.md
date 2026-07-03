# Api::Audit_Log
**Module ID:** `api::audit_log` · **Route:** `/api/v1/audit-log` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/audit-log/` | `list_audit_entries` | api/v1/routes/audit_log.py |
| GET | `/api/v1/audit-log/stats` | `audit_stats` | api/v1/routes/audit_log.py |
| GET | `/api/v1/audit-log/{entry_id}` | `get_audit_entry` | api/v1/routes/audit_log.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `audit_log`, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `uuid` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/audit-log/** — status `passed`, provenance ['real-db'], source tables: `audit_log`
Output: `{'type': 'object', 'keys': ['total', 'limit', 'offset', 'entries'], 'n_keys': 4}`

**GET /api/v1/audit-log/stats** — status `passed`, provenance ['real-db'], source tables: `audit_log`
Output: `{'type': 'object', 'keys': ['since_hours', 'total_entries', 'error_count', 'by_action_class', 'top_users'], 'n_keys': 5}`

**GET /api/v1/audit-log/{entry_id}** — status `failed`, provenance ['db-empty'], source tables: `audit_log`
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).