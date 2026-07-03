# Api::Sector_Assessments
**Module ID:** `api::sector_assessments` · **Route:** `/api/v1` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sector/technology/data-center` | `assess_data_center` | api/v1/routes/sector_assessments.py |
| POST | `/api/v1/sector/insurance/cat-risk` | `assess_cat_risk` | api/v1/routes/sector_assessments.py |
| POST | `/api/v1/sector/energy/plant-decarbonisation` | `assess_plant_decarbonisation` | api/v1/routes/sector_assessments.py |
| GET | `/api/v1/sector/technology/data-center/assessments` | `list_dc_assessments` | api/v1/routes/sector_assessments.py |
| GET | `/api/v1/sector/technology/data-center/assessments/{assessment_id}` | `get_dc_assessment` | api/v1/routes/sector_assessments.py |
| GET | `/api/v1/sector/insurance/cat-risk/assessments` | `list_cat_risk_assessments` | api/v1/routes/sector_assessments.py |
| GET | `/api/v1/sector/insurance/cat-risk/assessments/{assessment_id}` | `get_cat_risk_assessment` | api/v1/routes/sector_assessments.py |
| GET | `/api/v1/sector/energy/plant-decarbonisation/assessments` | `list_plant_assessments` | api/v1/routes/sector_assessments.py |
| GET | `/api/v1/sector/energy/plant-decarbonisation/assessments/{assessment_id}` | `get_plant_assessment` | api/v1/routes/sector_assessments.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `cat_risk_assessments`, `cat_risk_climate_scenarios`, `data_centre_assessments`, `datetime` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `power_plant_assessments`, `power_plant_trajectories`, `pydantic` *(shared)*, `score`, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sector/energy/plant-decarbonisation/assessments** — status `passed`, provenance ['real-db'], source tables: `power_plant_assessments`
Output: `{'type': 'object', 'keys': ['assessments', 'total_count'], 'n_keys': 2}`

**GET /api/v1/sector/energy/plant-decarbonisation/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `power_plant_assessments`
Output: `None`

**GET /api/v1/sector/insurance/cat-risk/assessments** — status `passed`, provenance ['real-db'], source tables: `cat_risk_assessments`
Output: `{'type': 'object', 'keys': ['assessments', 'total_count'], 'n_keys': 2}`

**GET /api/v1/sector/insurance/cat-risk/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `cat_risk_assessments`
Output: `None`

**GET /api/v1/sector/technology/data-center/assessments** — status `passed`, provenance ['real-db'], source tables: `data_centre_assessments`
Output: `{'type': 'object', 'keys': ['assessments', 'total_count'], 'n_keys': 2}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).