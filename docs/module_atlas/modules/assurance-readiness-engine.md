# Assurance Readiness Engine
**Module ID:** `assurance-readiness-engine` · **Route:** `/assurance-readiness-engine` · **Tier:** A (backend vertical) · **EP code:** EP-CR3 · **Sprint:** CR

## 1 · Overview
ISAE 3000/3410 readiness assessment with evidence scoring, control testing, and limited vs reasonable assurance gap.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSURANCE_LEVELS`, `CHECKLIST`, `PROVIDERS`, `READINESS`, `TABS`, `TRAIL`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Readiness Dashboard','ISAE 3000/3410 Checklist','Evidence Strength Scoring','Control Testing','Audit Trail Completeness','Assurance Provider Compari` |
| `overallScore` | `Math.round(READINESS.reduce((s,r)=>s+r.score,0)/READINESS.length);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/assurance-readiness/assess/batch` | `assess_batch` | api/v1/routes/assurance_readiness.py |
| GET | `/api/v1/assurance-readiness/ref/standards` | `ref_standards` | api/v1/routes/assurance_readiness.py |

### 2.3 Engine `assurance_readiness_engine` (services/assurance_readiness_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `AssuranceReadinessEngine.assess` | entity, assessment_date |  |
| `AssuranceReadinessEngine._build_score_map` | entity | Build a map of criterion_id → (score, status, evidence, quality, gaps). |
| `AssuranceReadinessEngine._build_domain_results` | crs |  |
| `AssuranceReadinessEngine._assess_standards_coverage` | crs, target_standard |  |
| `AssuranceReadinessEngine._derive_tier` | readiness_pct, blocking_count, level |  |
| `AssuranceReadinessEngine._derive_gaps_actions` | crs, blocking_gaps, entity |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ASSURANCE_LEVELS`, `CHECKLIST`, `PROVIDERS`, `READINESS`, `TABS`, `TRAIL`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Readiness Score | — | Self-assessment | Across 4 dimensions |
| Gap (Limited→Reasonable) | — | Model | Additional effort for reasonable vs limited assurance |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/assurance-readiness/ref/criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_criteria', 'blocking_criteria', 'domains', 'reference'], 'n_keys': 4}`

**GET /api/v1/assurance-readiness/ref/csrd-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['assurance_requirement', 'long_term_trajectory', 'waves', 'assurance_provider_eligibility', 'reference'], 'n_keys': 5}`

**GET /api/v1/assurance-readiness/ref/standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'standards'], 'n_keys': 2}`

**POST /api/v1/assurance-readiness/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/assurance-readiness/assess/batch** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Assurance readiness scoring
**Headline formula:** `Readiness = Evidence(25) + Controls(25) + Lineage(25) + Documentation(25)`
**Standards:** ['ISAE 3000', 'ISAE 3410']

**Engine `assurance_readiness_engine` — extracted transformation lines:**
```python
readiness_pct = total_weighted / _TOTAL_WEIGHT * 100
score_pct = earned_w / max(total_w, 0.001) * 100
score_pct = (met + partial * 0.5) / max(len(relevant), 1) * 100
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).