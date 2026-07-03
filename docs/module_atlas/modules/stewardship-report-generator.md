# Stewardship Report Generator
**Module ID:** `stewardship-report-generator` · **Route:** `/stewardship-report-generator` · **Tier:** A (backend vertical) · **EP code:** EP-CP3 · **Sprint:** CP

## 1 · Overview
UK Stewardship Code 2020 (12 Principles), ICGN Global Stewardship Principles, PRI signatory reporting. Case study generator and export.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CASE_STUDIES`, `ICGN_DATA`, `PRI_SCORES`, `REPORTS`, `TABS`, `UK_PRINCIPLES`

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/stewardship/engagement` | `assess_single_engagement` | api/v1/routes/stewardship.py |
| GET | `/api/v1/stewardship/ref/engagement-types` | `ref_engagement_types` | api/v1/routes/stewardship.py |
| GET | `/api/v1/stewardship/ref/proxy-resolutions` | `ref_proxy_resolutions` | api/v1/routes/stewardship.py |
| GET | `/api/v1/stewardship/ref/initiatives` | `ref_initiatives` | api/v1/routes/stewardship.py |
| GET | `/api/v1/stewardship/ref/frameworks` | `ref_frameworks` | api/v1/routes/stewardship.py |

### 2.3 Engine `stewardship_engine` (services/stewardship_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `StewardshipEngine.assess_portfolio` | entity_name, engagements, proxy_votes, initiative_memberships, assessment_date | Full portfolio stewardship assessment. |
| `StewardshipEngine.assess_engagement` | e | Assess engagement effectiveness for a single investee company. |
| `StewardshipEngine.assess_proxy_votes` | v | Score proxy voting alignment for an AGM. |
| `StewardshipEngine.assess_escalation` | e | Determine current and recommended escalation level for a company. |
| `StewardshipEngine._engagement_score` | e |  |
| `StewardshipEngine._rating` | score |  |
| `StewardshipEngine._escalation_signal` | e |  |
| `StewardshipEngine._gfanz_milestone` | e, score |  |
| `StewardshipEngine._engagement_gaps` | e |  |
| `StewardshipEngine._assess_initiatives` | memberships, engagements |  |
| `StewardshipEngine._aggregate` | run_id, entity_name, assessment_date, company_results, escalation_plans, proxy_results |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `ownership` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CASE_STUDIES`, `ICGN_DATA`, `PRI_SCORES`, `REPORTS`, `TABS`, `UK_PRINCIPLES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| UK Code Principles | — | FRC | UK Stewardship Code 2020 |
| ICGN Principles | — | ICGN | Global Stewardship Principles |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/stewardship/ref/engagement-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'engagement_types', 'reference'], 'n_keys': 3}`

**GET /api/v1/stewardship/ref/escalation-ladder** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['steps', 'escalation_ladder', 'engagement_type_details', 'reference'], 'n_keys': 4}`

**GET /api/v1/stewardship/ref/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'reference'], 'n_keys': 2}`

**GET /api/v1/stewardship/ref/initiatives** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'initiatives', 'reference'], 'n_keys': 3}`

**GET /api/v1/stewardship/ref/proxy-resolutions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'resolution_types', 'reference'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-framework stewardship reporting
**Headline formula:** `Compliance = Principles_met / Total_principles per framework`
**Standards:** ['UK Stewardship Code', 'ICGN', 'PRI']

**Engine `stewardship_engine` — extracted transformation lines:**
```python
alignment_score = min(100.0, alignment_score / total_weight)
next_level = current + 1
coverage = (engaged / max(len(company_results), 1)) * 100
proxy_align = sum(p.alignment_score for p in proxy_results) / len(proxy_results)
nzami_pct = (nzami_aligned / max(total_nzami, 1)) * 100
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `stewardship_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `stewardship-tracker` | engine:stewardship_engine, table:ownership |