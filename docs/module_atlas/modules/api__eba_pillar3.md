# Api::Eba_Pillar3
**Module ID:** `api::eba_pillar3` · **Route:** `/api/v1/eba-pillar3` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/eba-pillar3/assess` | `assess` | api/v1/routes/eba_pillar3.py |
| POST | `/api/v1/eba-pillar3/template-completeness` | `template_completeness` | api/v1/routes/eba_pillar3.py |
| POST | `/api/v1/eba-pillar3/physical-risk-heatmap` | `physical_risk_heatmap` | api/v1/routes/eba_pillar3.py |
| GET | `/api/v1/eba-pillar3/ref/templates` | `ref_templates` | api/v1/routes/eba_pillar3.py |
| GET | `/api/v1/eba-pillar3/ref/institution-types` | `ref_institution_types` | api/v1/routes/eba_pillar3.py |
| GET | `/api/v1/eba-pillar3/ref/nace-sectors` | `ref_nace_sectors` | api/v1/routes/eba_pillar3.py |
| GET | `/api/v1/eba-pillar3/ref/climate-hazards` | `ref_climate_hazards` | api/v1/routes/eba_pillar3.py |
| GET | `/api/v1/eba-pillar3/ref/regulatory-timeline` | `ref_regulatory_timeline` | api/v1/routes/eba_pillar3.py |

### 2.3 Engine `eba_pillar3_engine` (services/eba_pillar3_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `EBAPillar3Engine.assess` | entity_id, entity_name, institution_type, total_assets_bn, templates_submitted, portfolio_data |  |
| `EBAPillar3Engine.score_template_completeness` | templates_submitted, institution_type |  |
| `EBAPillar3Engine.generate_physical_risk_heatmap` | entity_id, portfolio_nace_exposure, hazard_scores |  |
| `EBAPillar3Engine.ref_templates` |  |  |
| `EBAPillar3Engine.ref_institution_types` |  |  |
| `EBAPillar3Engine.ref_nace_sectors` |  |  |
| `EBAPillar3Engine.ref_climate_hazards` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/eba-pillar3/ref/climate-hazards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 8, 'item0_keys': None}`

**GET /api/v1/eba-pillar3/ref/institution-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['G-SII', 'O-SII', 'Other'], 'n_keys': 3}`

**GET /api/v1/eba-pillar3/ref/nace-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 15, 'item0_keys': None}`

**GET /api/v1/eba-pillar3/ref/regulatory-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'effective_date', 'applies_to', 'mandatory_templates_gsii', 'mandatory_templates_osii', 'reporting_frequency', 't7_financed_emissions_from', 't9_t10_from'], 'n_keys': 8}`

**GET /api/v1/eba-pillar3/ref/templates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10'], 'n_keys': 10}`

## 5 · Intermediate Transformation Logic

**Engine `eba_pillar3_engine` — extracted transformation lines:**
```python
completed_mandatory = len(mandatory) - len(missing)
result.compliance_score = round((completed_mandatory / max(len(mandatory), 1)) * 100, 1)
fe_by_sector = {s: round(float(nace_exposure[s]) * 1_000 * float(efs[s]), 0)
fe.intensity_tco2e_per_mn_eur = round(fe.total_tco2e / max(total_assets_bn * 1_000, 1), 2)
tkpis.taxonomy_aligned_total_bn = round(total_assets_bn * tkpis.gar_pct / 100, 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).