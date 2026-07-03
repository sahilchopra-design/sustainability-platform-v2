# Api::Irena_Five_Pillars
**Module ID:** `api::irena_five_pillars` · **Route:** `/api/v1/irena-five-pillars` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/irena-five-pillars/framework` | `get_framework` | api/v1/routes/irena_five_pillars.py |
| POST | `/api/v1/irena-five-pillars/assess` | `assess_five_pillars` | api/v1/routes/irena_five_pillars.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `DB` *(shared)*, `IRENA`, `db` *(shared)*, `dh_country_risk_indices` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/irena-five-pillars/framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pillars'], 'n_keys': 1}`

**POST /api/v1/irena-five-pillars/assess** — status `passed`, provenance ['db-empty'], source tables: `dh_country_risk_indices`
Output: `{'type': 'object', 'keys': ['entity_name', 'entity_type', 'country_iso2', 'assessment_year', 'pillar_results', 'overall_score', 'overall_max', 'overall_pct', 'overall_rating', 'transition_readiness', 'gap_analysis', 'rec`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).