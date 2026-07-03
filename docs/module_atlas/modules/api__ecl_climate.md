# Api::Ecl_Climate
**Module ID:** `api::ecl_climate` · **Route:** `/api/v1` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/ecl/calculate` | `calculate_ecl` | api/v1/routes/ecl_climate.py |
| POST | `/api/v1/ecl/portfolio` | `calculate_portfolio_ecl` | api/v1/routes/ecl_climate.py |
| POST | `/api/v1/ecl/sicr-screening` | `screen_sicr` | api/v1/routes/ecl_climate.py |
| GET | `/api/v1/ecl/assessments` | `list_ecl_assessments` | api/v1/routes/ecl_climate.py |
| GET | `/api/v1/ecl/assessments/{assessment_id}` | `get_ecl_assessment` | api/v1/routes/ecl_climate.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `DB` *(shared)*, `climate`, `collections` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `ecl_assessments`, `ecl_exposures`, `ecl_scenario_results`, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ecl/assessments** — status `passed`, provenance ['real-db'], source tables: `ecl_assessments`
Output: `{'type': 'object', 'keys': ['total', 'assessments'], 'n_keys': 2}`

**GET /api/v1/ecl/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `ecl_assessments`
Output: `None`

**POST /api/v1/ecl/calculate** — status `passed`, provenance ['real-db'], source tables: `ecl_assessments`, `ecl_exposures`
Output: `{'type': 'object', 'keys': ['assessment_id', 'exposure_id', 'probability_weighted_ecl_12m_gbp', 'probability_weighted_ecl_lifetime_gbp', 'determined_stage', 'sicr_triggered', 'sicr_triggers', 'climate_uplift_pct', 'scena`

**POST /api/v1/ecl/portfolio** — status `passed`, provenance ['real-db'], source tables: `ecl_assessments`, `ecl_exposures`
Output: `{'type': 'object', 'keys': ['assessment_id', 'total_exposures', 'total_ead_gbp', 'total_ecl_baseline_gbp', 'total_ecl_climate_adjusted_gbp', 'total_ecl_uplift_gbp', 'total_ecl_uplift_pct', 'stage_distribution', 'sector_b`

**POST /api/v1/ecl/sicr-screening** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_screened', 'sicr_count', 'sicr_pct', 'exposures', 'validation_summary'], 'n_keys': 5}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).