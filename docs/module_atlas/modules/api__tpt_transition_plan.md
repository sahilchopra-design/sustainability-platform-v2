# Api::Tpt_Transition_Plan
**Module ID:** `api::tpt_transition_plan` · **Route:** `/api/v1/tpt-transition-plan` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/tpt-transition-plan/assess` | `assess_tpt` | api/v1/routes/tpt_transition_plan.py |
| POST | `/api/v1/tpt-transition-plan/score-element` | `score_element` | api/v1/routes/tpt_transition_plan.py |
| POST | `/api/v1/tpt-transition-plan/gap-analysis` | `gap_analysis` | api/v1/routes/tpt_transition_plan.py |
| GET | `/api/v1/tpt-transition-plan/ref/elements` | `ref_elements` | api/v1/routes/tpt_transition_plan.py |
| GET | `/api/v1/tpt-transition-plan/ref/entity-types` | `ref_entity_types` | api/v1/routes/tpt_transition_plan.py |
| GET | `/api/v1/tpt-transition-plan/ref/quality-tiers` | `ref_quality_tiers` | api/v1/routes/tpt_transition_plan.py |
| GET | `/api/v1/tpt-transition-plan/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/tpt_transition_plan.py |
| GET | `/api/v1/tpt-transition-plan/ref/interim-targets-guidance` | `ref_interim_targets_guidance` | api/v1/routes/tpt_transition_plan.py |

### 2.3 Engine `tpt_transition_plan_engine` (services/tpt_transition_plan_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_tier_midpoint` | tier | Midpoint of a QUALITY_TIERS score range (deterministic). |
| `TPTTransitionPlanEngine.assess` | entity_id, entity_name, entity_type, plan_year, net_zero_target_year, elements_completed | Full TPT Disclosure Framework assessment. |
| `TPTTransitionPlanEngine._get_quality_tier` | score |  |
| `TPTTransitionPlanEngine._generate_gaps` | element_scores, net_zero_year, interim_targets, capex_pct, entity_type |  |
| `TPTTransitionPlanEngine.score_element` | entity_id, element_id, sub_elements_completed, sub_element_quality | Score a single TPT element based on sub-element completion. |
| `TPTTransitionPlanEngine.generate_gap_analysis` | entity_id, assessment | Generate detailed gap analysis from a TPT assessment. |
| `TPTTransitionPlanEngine.ref_elements` |  |  |
| `TPTTransitionPlanEngine.ref_entity_types` |  |  |
| `TPTTransitionPlanEngine.ref_quality_tiers` |  |  |
| `TPTTransitionPlanEngine.ref_cross_framework` |  |  |
| `TPTTransitionPlanEngine.ref_interim_targets_guidance` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/tpt-transition-plan/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/tpt-transition-plan/ref/elements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/tpt-transition-plan/ref/entity-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/tpt-transition-plan/ref/interim-targets-guidance** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/tpt-transition-plan/ref/quality-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic

**Engine `tpt_transition_plan_engine` — extracted transformation lines:**
```python
score = min(100, score + 10)
score = min(100, score + 15)
score = min(100, score + 10)
tcfd_pct = round(overall * 0.9, 1)
s2_pct = round(overall * 0.85, 1)
esrs_pct = round(overall * 0.88, 1)
completion_pct=round(sub_completed / self._TOTAL_SUB_ELEMENTS * 100, 1),
element_score = total_score / len(all_sub) if all_sub else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).