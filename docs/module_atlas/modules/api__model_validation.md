# Api::Model_Validation
**Module ID:** `api::model_validation` · **Route:** `/api/v1/model-validation` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/model-validation/backtest` | `run_backtest` | api/v1/routes/model_validation.py |
| POST | `/api/v1/model-validation/compare-models` | `compare_models` | api/v1/routes/model_validation.py |
| POST | `/api/v1/model-validation/transition-lifecycle` | `transition_lifecycle` | api/v1/routes/model_validation.py |
| GET | `/api/v1/model-validation/inventory` | `get_inventory` | api/v1/routes/model_validation.py |
| GET | `/api/v1/model-validation/dashboard` | `get_dashboard` | api/v1/routes/model_validation.py |
| GET | `/api/v1/model-validation/ref/catalog` | `ref_catalog` | api/v1/routes/model_validation.py |
| GET | `/api/v1/model-validation/ref/lifecycle-states` | `ref_lifecycle_states` | api/v1/routes/model_validation.py |
| GET | `/api/v1/model-validation/ref/lifecycle-transitions` | `ref_lifecycle_transitions` | api/v1/routes/model_validation.py |
| GET | `/api/v1/model-validation/ref/validation-tests` | `ref_validation_tests` | api/v1/routes/model_validation.py |
| GET | `/api/v1/model-validation/ref/regulatory-frameworks` | `ref_regulatory_frameworks` | api/v1/routes/model_validation.py |

### 2.3 Engine `model_validation_framework` (services/model_validation_framework.py)
| Function | Args | Purpose |
|---|---|---|
| `ModelValidationFramework.run_backtest` | model_id, predicted, actual, observation_start, observation_end, tests_to_run | Run generalised backtesting for any model. |
| `ModelValidationFramework.get_model_inventory` | category, risk_tier | Get the full model inventory, optionally filtered. |
| `ModelValidationFramework.transition_lifecycle` | model_id, target_state, reason, transitioned_by | Transition a model to a new lifecycle state. |
| `ModelValidationFramework.compare_models` | champion_model_id, challenger_model_id, champion_predicted, challenger_predicted, actual, comparison_metric | Champion vs challenger model comparison. |
| `ModelValidationFramework.get_validation_dashboard` |  | Platform-wide model validation dashboard. |
| `ModelValidationFramework._compute_test` | test_name, predicted, actual | Compute a single statistical test. |
| `ModelValidationFramework._generate_backtest_recommendations` | model_id, results, overall_tl | Generate recommendations from backtest results. |
| `ModelValidationFramework.get_model_inventory_catalog` |  | Full model inventory registry. |
| `ModelValidationFramework.get_lifecycle_states` |  | Valid model lifecycle states. |
| `ModelValidationFramework.get_lifecycle_transitions` |  | Valid lifecycle state transitions. |
| `ModelValidationFramework.get_validation_tests` |  | Available validation test specifications. |
| `ModelValidationFramework.get_regulatory_frameworks` |  | Regulatory frameworks governing model validation. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/model-validation/dashboard** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_models', 'models_by_state', 'models_by_tier', 'models_by_category', 'overdue_validations', 'recent_findings', 'bcbs239_compliance_pct', 'eba_gl_2023_04_compliant'], 'n_keys': 8}`

**GET /api/v1/model-validation/inventory** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['models'], 'n_keys': 1}`

**GET /api/v1/model-validation/ref/catalog** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['catalog'], 'n_keys': 1}`

**GET /api/v1/model-validation/ref/lifecycle-states** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['lifecycle_states'], 'n_keys': 1}`

**GET /api/v1/model-validation/ref/lifecycle-transitions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['transitions'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `model_validation_framework` — extracted transformation lines:**
```python
improvement_pct = ((ch_primary - cl_primary) / ch_primary * 100) if ch_primary > 0 else 0
improvement_pct = ((cl_primary - ch_primary) / ch_primary * 100) if ch_primary > 0 else 0
ch_errors = [(p - a) ** 2 for p, a in zip(ch_pred, act)]
cl_errors = [(p - a) ** 2 for p, a in zip(cl_pred, act)]
diffs = [c - ch for c, ch in zip(cl_errors, ch_errors)]
t_stat = (mean_diff / (std_diff / math.sqrt(n))) if std_diff > 0 else 0
p_value = max(0.001, min(1.0, 2.0 * math.exp(-0.5 * abs(t_stat))))
bcbs239_pct = (compliant_models / total * 100) if total > 0 else 0.0
mse = sum((p - a) ** 2 for p, a in zip(predicted, actual)) / n
mean_a = sum(actual) / n
ss_tot = sum((a - mean_a) ** 2 for a in actual)
ss_res = sum((a - p) ** 2 for p, a in zip(predicted, actual))
total_pairs = len(pos) * len(neg)
max_ks = max(max_ks, abs(cum_pos - cum_neg))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).