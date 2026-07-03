# Api::Sat_Coal_Checker
**Module ID:** `api::sat_coal_checker` · **Route:** `/api/v1/sat-coal` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sat-coal/check` | `check_coal_phase_out` | api/v1/routes/sat_coal_checker.py |
| GET | `/api/v1/sat-coal/thresholds` | `get_thresholds` | api/v1/routes/sat_coal_checker.py |
| GET | `/api/v1/sat-coal/gem-summary` | `get_gem_summary` | api/v1/routes/sat_coal_checker.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `real-db`

**Database tables:** `DB` *(shared)*, `db` *(shared)*, `dh_reference_data` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `reference`, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sat-coal/gem-summary** — status `passed`, provenance ['real-db'], source tables: `dh_reference_data`
Output: `{'type': 'object', 'keys': ['message'], 'n_keys': 1}`

**GET /api/v1/sat-coal/thresholds** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['revenue_thresholds', 'phase_out_deadlines', 'pipeline_risk_categories', 'criteria'], 'n_keys': 4}`

**POST /api/v1/sat-coal/check** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).