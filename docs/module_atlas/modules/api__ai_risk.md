# Api::Ai_Risk
**Module ID:** `api::ai_risk` · **Route:** `/api/v1/ai-risk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/ai-risk/classify-system` | `classify_system` | api/v1/routes/ai_risk.py |
| POST | `/api/v1/ai-risk/assess-nist-rmf` | `assess_nist_rmf_endpoint` | api/v1/routes/ai_risk.py |
| POST | `/api/v1/ai-risk/detect-bias` | `detect_bias` | api/v1/routes/ai_risk.py |
| POST | `/api/v1/ai-risk/score-explainability` | `score_explainability_endpoint` | api/v1/routes/ai_risk.py |
| POST | `/api/v1/ai-risk/calculate-liability` | `calculate_liability` | api/v1/routes/ai_risk.py |
| GET | `/api/v1/ai-risk/ref/annex3-categories` | `get_annex3_categories` | api/v1/routes/ai_risk.py |
| GET | `/api/v1/ai-risk/ref/prohibited-practices` | `get_prohibited_practices` | api/v1/routes/ai_risk.py |
| GET | `/api/v1/ai-risk/ref/nist-functions` | `get_nist_functions` | api/v1/routes/ai_risk.py |
| GET | `/api/v1/ai-risk/ref/bias-metrics` | `get_bias_metrics` | api/v1/routes/ai_risk.py |
| GET | `/api/v1/ai-risk/ref/enforcement-timeline` | `get_enforcement_timeline` | api/v1/routes/ai_risk.py |

### 2.3 Engine `ai_risk_engine` (services/ai_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `classify_ai_system` | entity_id, system_name, use_case, sector, automated_decision_making, training_compute_flops |  |
| `assess_nist_rmf` | entity_id, system_name, functions, subcategory_scores |  |
| `detect_algorithmic_bias` | entity_id, model_type, protected_attributes, performance_metrics |  |
| `score_explainability` | entity_id, model_type, explanation_methods, compliance_attestations |  |
| `calculate_ai_liability` | entity_id, system_type, harm_scenarios, standard_policy_coverage_usd, damage_severity_rates, do_inputs |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `AI`, `August`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ai-risk/ref/annex3-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'annex', 'categories_count', 'categories'], 'n_keys': 4}`

**GET /api/v1/ai-risk/ref/bias-metrics** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'regulatory_basis', 'metrics_count', 'metrics', 'intersectionality_note'], 'n_keys': 5}`

**GET /api/v1/ai-risk/ref/enforcement-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'entry_into_force', 'general_application', 'milestones', 'penalty_regime'], 'n_keys': 5}`

**GET /api/v1/ai-risk/ref/nist-functions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'version', 'published', 'total_subcategories', 'functions'], 'n_keys': 5}`

**GET /api/v1/ai-risk/ref/prohibited-practices** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'article', 'effective_date', 'practices_count', 'practices'], 'n_keys': 5}`

## 5 · Intermediate Transformation Logic

**Engine `ai_risk_engine` — extracted transformation lines:**
```python
max_penalty_usd = round(global_annual_turnover_usd * max_penalty_pct_global_turnover / 100, 0)
func_avg = round(func_sum / func_count, 3) if func_count else None
overall_score = total_score / total_count
attr_avg_bias = round(attr_bias_sum / attr_measured, 4) if attr_measured else None
overall_bias_score = round(overall_bias_sum / overall_bias_count, 4) if overall_bias_count else None
method_coverage_score = min(method_count / 4, 1.0)
annex12_score = sum(annex12_requirements.values()) / len(annex12_requirements)
gdpr_rec71_score = sum(gdpr_rec71_compliance.values()) / len(gdpr_rec71_compliance)
combined_score = (method_coverage_score * 0.4 + annex12_score * 0.35 + gdpr_rec71_score * 0.25)
damage_category_rates = {**DEFAULT_DAMAGE_SEVERITY_RATES, **(damage_severity_rates or {})}
expected_loss = probability * harm_magnitude_usd * rate
strict_liability_exposure = harm_magnitude_usd * rate  # no fault needed
coverage_gap_usd = round(max(0.0, total_liability_usd - float(standard_policy_coverage_usd)), 0)
recommended_additional_coverage_usd = round(coverage_gap_usd * 1.2, 0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).