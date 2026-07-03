# Api::Cdp_Scoring
**Module ID:** `api::cdp_scoring` · **Route:** `/api/v1/cdp` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/cdp/assess-climate` | `assess_climate` | api/v1/routes/cdp_scoring.py |
| POST | `/api/v1/cdp/assess-water` | `assess_water` | api/v1/routes/cdp_scoring.py |
| POST | `/api/v1/cdp/compare-peers` | `compare_peers` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/climate-modules` | `ref_climate_modules` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/water-modules` | `ref_water_modules` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/scoring-methodology` | `ref_scoring_methodology` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/score-bands` | `ref_score_bands` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/activity-groups` | `ref_activity_groups` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/peer-benchmarks` | `ref_peer_benchmarks` | api/v1/routes/cdp_scoring.py |
| GET | `/api/v1/cdp/ref/module-catalog` | `ref_module_catalog` | api/v1/routes/cdp_scoring.py |

### 2.3 Engine `cdp_scoring_engine` (services/cdp_scoring_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CDPScoringEngine.assess_climate` | entity_name, reporting_year, activity_group, responses | Score the CDP Climate Change questionnaire for an entity. |
| `CDPScoringEngine.assess_water` | entity_name, reporting_year, responses | Score the CDP Water Security questionnaire for an entity. |
| `CDPScoringEngine.compare_to_peers` | entity_name, activity_group, entity_score_pct | Compare an entity's CDP score against activity group median benchmarks. |
| `CDPScoringEngine._score_module` | code, title, category, resp | Score a single questionnaire module across all four levels. |
| `CDPScoringEngine._pct_to_grade` | pct | Convert a percentage score to a CDP letter grade and label. |
| `CDPScoringEngine._water_risk_level` | w1_resp, w2_resp | Derive overall water risk level from W1 and W2 module responses. |
| `CDPScoringEngine._identify_climate_gaps` | module_scores, verification_status, sbti_alignment | Identify disclosure and performance gaps in climate assessment. |
| `CDPScoringEngine._identify_water_gaps` | module_scores, water_risk, facility_accounting | Identify disclosure and performance gaps in water assessment. |
| `CDPScoringEngine._generate_climate_recommendations` | grade, scoring_breakdown, gaps, sbti_alignment, verification_status | Generate prioritised improvement recommendations for climate score. |
| `CDPScoringEngine._generate_water_recommendations` | grade, scoring_breakdown, gaps, water_risk | Generate prioritised improvement recommendations for water score. |
| `CDPScoringEngine.get_climate_modules` |  | Return all 15 CDP Climate Change questionnaire modules. |
| `CDPScoringEngine.get_water_modules` |  | Return all 9 CDP Water Security questionnaire modules. |
| `CDPScoringEngine.get_scoring_methodology` |  | Return the CDP four-level scoring methodology. |
| `CDPScoringEngine.get_score_bands` |  | Return all CDP letter-grade score bands (A through D-). |
| `CDPScoringEngine.get_activity_groups` |  | Return all 12 CDP Activity Group classifications. |
| `CDPScoringEngine.get_cross_framework_map` |  | Return CDP-to-TCFD/GRI/ISSB/SASB cross-framework mapping. |
| `CDPScoringEngine.get_peer_benchmarks` |  | Return activity group peer benchmark medians. |
| `CDPScoringEngine.get_module_catalog` |  | Flat combined catalog of all Climate + Water modules for UI dropdowns. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/cdp/ref/activity-groups** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['activity_groups'], 'n_keys': 1}`

**GET /api/v1/cdp/ref/climate-modules** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['climate_modules'], 'n_keys': 1}`

**GET /api/v1/cdp/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cross_framework_mapping'], 'n_keys': 1}`

**GET /api/v1/cdp/ref/module-catalog** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['module_catalog'], 'n_keys': 1}`

**GET /api/v1/cdp/ref/peer-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['peer_benchmarks'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `cdp_scoring_engine` — extracted transformation lines:**
```python
delta = round(entity_score_pct - median, 1)
total_input = disc + awar + mgmt + lead
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).