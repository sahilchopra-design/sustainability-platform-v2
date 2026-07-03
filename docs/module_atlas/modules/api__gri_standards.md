# Api::Gri_Standards
**Module ID:** `api::gri_standards` · **Route:** `/api/v1/gri-standards` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/gri-standards/assess` | `assess_gri` | api/v1/routes/gri_standards.py |
| POST | `/api/v1/gri-standards/generate-content-index` | `generate_content_index` | api/v1/routes/gri_standards.py |
| POST | `/api/v1/gri-standards/materiality-screen` | `materiality_screen` | api/v1/routes/gri_standards.py |
| GET | `/api/v1/gri-standards/ref/gri-2-disclosures` | `ref_gri_2_disclosures` | api/v1/routes/gri_standards.py |
| GET | `/api/v1/gri-standards/ref/gri-300-standards` | `ref_gri_300_standards` | api/v1/routes/gri_standards.py |
| GET | `/api/v1/gri-standards/ref/material-topic-process` | `ref_material_topic_process` | api/v1/routes/gri_standards.py |
| GET | `/api/v1/gri-standards/ref/service-levels` | `ref_service_levels` | api/v1/routes/gri_standards.py |
| GET | `/api/v1/gri-standards/ref/content-index-requirements` | `ref_content_index_requirements` | api/v1/routes/gri_standards.py |

### 2.3 Engine `gri_standards_engine` (services/gri_standards_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `GRIStandardsEngine.assess` | entity_id, entity_name, reporting_period, material_topics, gri_2_disclosures_submitted, gri_300_data | Full GRI Standards compliance assessment. |
| `GRIStandardsEngine._identify_gri2_gaps` | submitted | Gaps = required GRI 2 disclosures not present in the submitted list (deterministic). |
| `GRIStandardsEngine._score_gri300` | material_topics, gri_300_data | Deterministic GRI 300 completeness. |
| `GRIStandardsEngine._identify_gri300_gaps` | material_topics, disclosed |  |
| `GRIStandardsEngine._build_recommendations` | gaps, score |  |
| `GRIStandardsEngine.generate_content_index` | entity_id, material_topics, disclosures_status | Generate GRI Content Index per GRI 101:2023 requirements. |
| `GRIStandardsEngine._content_index_entry` | disc_id, supplied | Normalise a caller-supplied status into a content-index row (no fabrication). |
| `GRIStandardsEngine.screen_material_topics` | entity_id, sector, stakeholder_inputs | Screen and prioritise material GRI topics using double materiality lens. |
| `GRIStandardsEngine.ref_gri_2_disclosures` |  |  |
| `GRIStandardsEngine.ref_gri_300_standards` |  |  |
| `GRIStandardsEngine.ref_material_topic_process` |  |  |
| `GRIStandardsEngine.ref_service_levels` |  |  |
| `GRIStandardsEngine.ref_content_index_requirements` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/gri-standards/ref/content-index-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/gri-standards/ref/gri-2-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/gri-standards/ref/gri-300-standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/gri-standards/ref/material-topic-process** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/gri-standards/ref/service-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic

**Engine `gri_standards_engine` — extracted transformation lines:**
```python
gaps = gri2_gaps + self._identify_gri300_gaps(material_topics, gri300_disclosed)
impact_materiality = min(1.0, base_weight + stakeholder_boost)
financial_materiality = min(1.0, base_weight * 0.8)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).