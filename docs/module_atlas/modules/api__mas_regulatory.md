# Api::Mas_Regulatory
**Module ID:** `api::mas_regulatory` · **Route:** `/api/v1/mas-regulatory` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/mas-regulatory/erm/principles` | `get_erm_principles` | api/v1/routes/mas_regulatory.py |
| POST | `/api/v1/mas-regulatory/erm/self-assessment` | `submit_erm_assessment` | api/v1/routes/mas_regulatory.py |
| GET | `/api/v1/mas-regulatory/notice-637/requirements` | `get_notice_637` | api/v1/routes/mas_regulatory.py |
| GET | `/api/v1/mas-regulatory/sgt/sectors` | `get_sgt_sectors` | api/v1/routes/mas_regulatory.py |
| POST | `/api/v1/mas-regulatory/sgt/check-activity` | `check_sgt_activity` | api/v1/routes/mas_regulatory.py |
| GET | `/api/v1/mas-regulatory/slgs/stages` | `get_slgs_stages` | api/v1/routes/mas_regulatory.py |
| POST | `/api/v1/mas-regulatory/slgs/application` | `track_slgs_application` | api/v1/routes/mas_regulatory.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `ICAAP`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `stranded`, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/mas-regulatory/erm/principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'url', 'principles'], 'n_keys': 3}`

**GET /api/v1/mas-regulatory/notice-637/requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'items'], 'n_keys': 2}`

**GET /api/v1/mas-regulatory/sgt/sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['taxonomy', 'url', 'sectors'], 'n_keys': 3}`

**GET /api/v1/mas-regulatory/slgs/stages** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['programme', 'description', 'stages'], 'n_keys': 3}`

**POST /api/v1/mas-regulatory/erm/self-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).