# Api::Tnfd_Assessment
**Module ID:** `api::tnfd_assessment` · **Route:** `/api/v1/tnfd` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/tnfd/assess-disclosures` | `assess_disclosures` | api/v1/routes/tnfd_assessment.py |
| POST | `/api/v1/tnfd/assess-materiality` | `assess_materiality` | api/v1/routes/tnfd_assessment.py |
| POST | `/api/v1/tnfd/assess-leap-readiness` | `assess_leap_readiness` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/recommended-disclosures` | `ref_recommended_disclosures` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/leap-phases` | `ref_leap_phases` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/ecosystem-services` | `ref_ecosystem_services` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/nature-risk-categories` | `ref_nature_risk_categories` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/sector-guidance` | `ref_sector_guidance` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/pillar-structure` | `ref_pillar_structure` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/priority-areas` | `ref_priority_areas` | api/v1/routes/tnfd_assessment.py |

### 2.3 Engine `tnfd_assessment_engine` (services/tnfd_assessment_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `TNFDAssessmentEngine.assess_disclosures` | entity_name, reporting_year, disclosure_data, sector | Score each of the 14 TNFD recommended disclosures, run LEAP phase |
| `TNFDAssessmentEngine.assess_nature_materiality` | entity_name, reporting_year, sector, dependencies, impacts | Evaluate which ecosystem services are material, score financial vs |
| `TNFDAssessmentEngine.assess_leap_readiness` | entity_name, reporting_year, leap_data | Score each LEAP phase and sub-component and return an overall |
| `TNFDAssessmentEngine.get_recommended_disclosures` |  | Return the 14 TNFD recommended disclosures. |
| `TNFDAssessmentEngine.get_leap_phases` |  | Return LEAP phases with sub-components. |
| `TNFDAssessmentEngine.get_encore_ecosystem_services` |  | Return the 21 ENCORE ecosystem services. |
| `TNFDAssessmentEngine.get_nature_risk_categories` |  | Return the 3 nature risk categories with sub-types. |
| `TNFDAssessmentEngine.get_sector_guidance` |  | Return sector-specific TNFD guidance for 8 sectors. |
| `TNFDAssessmentEngine.get_cross_framework_map` |  | Return TNFD-to-peer-framework mapping. |
| `TNFDAssessmentEngine.get_disclosure_pillar_structure` |  | Return pillar-grouped disclosure structure for UI rendering. |
| `TNFDAssessmentEngine.get_priority_area_criteria` |  | Return priority area criteria (KBAs, protected areas, etc.). |
| `TNFDAssessmentEngine._status_to_score` | status | Convert a compliance status string to a numeric score. |
| `TNFDAssessmentEngine._build_disclosure_findings` | disclosure_id, status, evidence | Build findings list for a single disclosure. |
| `TNFDAssessmentEngine._score_leap_phases` | leap_data | Score each LEAP phase and its sub-components. |
| `TNFDAssessmentEngine._build_risk_profile` | risk_data | Build a nature risk profile from provided risk scores. |
| `TNFDAssessmentEngine._resolve_ecosystem_services` | service_ids | Resolve ES IDs to full ENCORE ecosystem service records. |
| `TNFDAssessmentEngine._find_ecosystem_service` | service_id | Find a single ENCORE ecosystem service by ID. |
| `TNFDAssessmentEngine._build_cross_framework_mapping` | scored | Map scored disclosures to equivalent requirements in peer frameworks. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/tnfd/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cross_framework_mapping'], 'n_keys': 1}`

**GET /api/v1/tnfd/ref/ecosystem-services** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ecosystem_services'], 'n_keys': 1}`

**GET /api/v1/tnfd/ref/leap-phases** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['leap_phases'], 'n_keys': 1}`

**GET /api/v1/tnfd/ref/nature-risk-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['nature_risk_categories'], 'n_keys': 1}`

**GET /api/v1/tnfd/ref/pillar-structure** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pillar_structure'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `tnfd_assessment_engine` — extracted transformation lines:**
```python
avg = sum(scores) / len(scores) if scores else 0.0
mag_score = min(mag_score + 15.0, 100.0)
fin_materiality = round(sum(fin_scores) / len(fin_scores), 1) if fin_scores else 0.0
adjusted = min(base * mult, 100.0)
imp_materiality = round(sum(imp_scores) / len(imp_scores), 1) if imp_scores else 0.0
avg = sum(scores_list) / len(scores_list) if scores_list else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).