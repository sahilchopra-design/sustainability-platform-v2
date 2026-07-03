# Api::Biodiversity_Finance
**Module ID:** `api::biodiversity_finance` · **Route:** `/api/v1/biodiversity-finance` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/biodiversity-finance/assess` | `assess` | api/v1/routes/biodiversity_finance.py |
| POST | `/api/v1/biodiversity-finance/msa-footprint` | `msa_footprint` | api/v1/routes/biodiversity_finance.py |
| GET | `/api/v1/biodiversity-finance/ref/tnfd-pillars` | `ref_tnfd_pillars` | api/v1/routes/biodiversity_finance.py |
| GET | `/api/v1/biodiversity-finance/ref/land-use-msa` | `ref_land_use_msa` | api/v1/routes/biodiversity_finance.py |
| GET | `/api/v1/biodiversity-finance/ref/sbtn-steps` | `ref_sbtn_steps` | api/v1/routes/biodiversity_finance.py |
| GET | `/api/v1/biodiversity-finance/ref/cbd-gbf-target15` | `ref_cbd_gbf_target15` | api/v1/routes/biodiversity_finance.py |
| GET | `/api/v1/biodiversity-finance/ref/encore-services` | `ref_encore_services` | api/v1/routes/biodiversity_finance.py |
| GET | `/api/v1/biodiversity-finance/ref/assessment-types` | `ref_assessment_types` | api/v1/routes/biodiversity_finance.py |
| GET | `/api/v1/biodiversity-finance/ref/pbaf-standard` | `ref_pbaf_standard` | api/v1/routes/biodiversity_finance.py |

### 2.3 Engine `biodiversity_finance_engine` (services/biodiversity_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `BiodiversityFinanceEngine.assess` | entity_id, entity_name, sector, assessment_type, operational_area_km2, land_use_breakdown |  |
| `BiodiversityFinanceEngine.calculate_msa_footprint` | entity_id, land_use_areas |  |
| `BiodiversityFinanceEngine.ref_tnfd_pillars` |  |  |
| `BiodiversityFinanceEngine.ref_land_use_msa` |  |  |
| `BiodiversityFinanceEngine.ref_sbtn_steps` |  |  |
| `BiodiversityFinanceEngine.ref_cbd_gbf_target15` |  |  |
| `BiodiversityFinanceEngine.ref_encore_services` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/biodiversity-finance/ref/assessment-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['types', 'descriptions'], 'n_keys': 2}`

**GET /api/v1/biodiversity-finance/ref/cbd-gbf-target15** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['15a', '15b', '15c', '15d', '15e', '15f'], 'n_keys': 6}`

**GET /api/v1/biodiversity-finance/ref/encore-services** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['services'], 'n_keys': 1}`

**GET /api/v1/biodiversity-finance/ref/land-use-msa** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['primary_vegetation', 'secondary_vegetation', 'extensive_agriculture', 'intensive_agriculture', 'plantation_forestry', 'urban_built_up', 'mining_quarrying', 'aquaculture'], 'n_keys': 8}`

**GET /api/v1/biodiversity-finance/ref/pbaf-standard** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['standard', 'scope', 'methods', 'asset_classes', 'alignment_with'], 'n_keys': 5}`

## 5 · Intermediate Transformation Logic

**Engine `biodiversity_finance_engine` — extracted transformation lines:**
```python
result.tnfd_overall_maturity = int(sum(scored) / len(scored)) if scored else None
area_lt = area * frac / total_fraction
msa_loss = area_lt * (1 - msa_factor)
sbtn.overall_readiness_score = round(steps_done / 5 * 100, 1)
sbtn.next_priority_step = min(steps_done + 1, 5)
cbd.average_score = round(sum(sub_scores.values()) / len(sub_scores), 1)
msa_loss = area * (1 - factor)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).