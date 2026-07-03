# Api::Tcfd_Metrics
**Module ID:** `api::tcfd_metrics` · **Route:** `/api/v1/tcfd-metrics` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/tcfd-metrics/assess` | `assess` | api/v1/routes/tcfd_metrics.py |
| POST | `/api/v1/tcfd-metrics/assess/pillar` | `assess_pillar` | api/v1/routes/tcfd_metrics.py |
| POST | `/api/v1/tcfd-metrics/assess/batch` | `assess_batch` | api/v1/routes/tcfd_metrics.py |
| GET | `/api/v1/tcfd-metrics/ref/recommendations` | `ref_recommendations` | api/v1/routes/tcfd_metrics.py |
| GET | `/api/v1/tcfd-metrics/ref/pillars` | `ref_pillars` | api/v1/routes/tcfd_metrics.py |
| GET | `/api/v1/tcfd-metrics/ref/sector-supplements` | `ref_sector_supplements` | api/v1/routes/tcfd_metrics.py |
| GET | `/api/v1/tcfd-metrics/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/tcfd_metrics.py |

### 2.3 Engine `tcfd_metrics_engine` (services/tcfd_metrics_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `RecommendationAssessment.to_dict` |  |  |
| `PillarResult.to_dict` |  |  |
| `TCFDResult.to_dict` |  |  |
| `TCFDMetricsEngine.assess` | entity_id, entity_name, sector, disclosure_year, recommendation_inputs | Full 11-recommendation TCFD assessment. |
| `TCFDMetricsEngine.assess_pillar` | pillar_id, entity_id, entity_name, rec_inputs | Single-pillar assessment. |
| `TCFDMetricsEngine.get_recommendations` |  |  |
| `TCFDMetricsEngine.get_pillars` |  |  |
| `TCFDMetricsEngine.get_sector_supplements` |  |  |
| `TCFDMetricsEngine.get_maturity_levels` |  |  |
| `TCFDMetricsEngine.get_cross_framework` |  |  |
| `TCFDMetricsEngine._build_rec_assessment` | rec_id, rec_def, raw |  |
| `TCFDMetricsEngine._build_pillar_result` | pillar_id, pillar_def, rec_assessments |  |
| `TCFDMetricsEngine._resolve_maturity` | score |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/tcfd-metrics/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['csrd_esrs_e1', 'issb_s2', 'cdp_c_modules', 'gri_305', 'sec_reg_sk_1501'], 'n_keys': 5}`

**GET /api/v1/tcfd-metrics/ref/maturity-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [1, 2, 3, 4, 5], 'n_keys': 5}`

**GET /api/v1/tcfd-metrics/ref/pillars** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['governance', 'strategy', 'risk_management', 'metrics_targets'], 'n_keys': 4}`

**GET /api/v1/tcfd-metrics/ref/recommendations** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['G1', 'G2', 'S1', 'S2', 'S3', 'RM1', 'RM2', 'RM3', 'MT1', 'MT2', 'MT3'], 'n_keys': 11}`

**GET /api/v1/tcfd-metrics/ref/sector-supplements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['financial_institutions', 'energy', 'transport', 'buildings', 'agriculture'], 'n_keys': 5}`

## 5 · Intermediate Transformation Logic

**Engine `tcfd_metrics_engine` — extracted transformation lines:**
```python
completeness_pct = (len(valid_covered) / total * 100.0) if total > 0 else 0.0
pillar_score = (weighted_score_sum / weight_sum) if weight_sum > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).