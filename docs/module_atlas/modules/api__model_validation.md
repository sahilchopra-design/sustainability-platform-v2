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
| `ModelValidationFramework.run_backtest` | model_id, predicted, actual, observation_start, observation_end, tests_to_run | Run generalised backtesting for any model. Args: model_id: Model identifier from inventory predicted: List of predicted values actual: List of actual/observed values observation_start: Start of observation window (ISO date) observation_end: End of observation window (ISO date) tests_to_run: Specific tests to run (default: all applicable) Returns: BacktestResult with test-level results and overall  |
| `ModelValidationFramework.get_model_inventory` | category, risk_tier | Get the full model inventory, optionally filtered. Args: category: Filter by category (credit_risk, climate_risk, etc.) risk_tier: Filter by risk tier (1=highest, 3=lowest) Returns: List of ModelInventoryEntry |
| `ModelValidationFramework.transition_lifecycle` | model_id, target_state, reason, transitioned_by | Transition a model to a new lifecycle state. Args: model_id: Model identifier target_state: Target lifecycle state reason: Reason for transition transitioned_by: User/system making the transition Returns: Dict with transition result |
| `ModelValidationFramework.compare_models` | champion_model_id, challenger_model_id, champion_predicted, challenger_predicted, actual, comparison_metric | Champion vs challenger model comparison. Args: champion_model_id: Current production model ID challenger_model_id: Challenger model ID champion_predicted: Champion model predictions challenger_predicted: Challenger model predictions actual: Actual/observed values comparison_metric: Primary metric for comparison Returns: ChampionChallengerResult with winner and significance |
| `ModelValidationFramework.get_validation_dashboard` |  | Platform-wide model validation dashboard. Returns: ValidationDashboard with model counts, overdue validations, compliance |
| `ModelValidationFramework._compute_test` | test_name, predicted, actual | Compute a single statistical test. |
| `ModelValidationFramework._generate_backtest_recommendations` | model_id, results, overall_tl | Generate recommendations from backtest results. |
| `ModelValidationFramework.get_model_inventory_catalog` |  | Full model inventory registry. |
| `ModelValidationFramework.get_lifecycle_states` |  | Valid model lifecycle states. |
| `ModelValidationFramework.get_lifecycle_transitions` |  | Valid lifecycle state transitions. |
| `ModelValidationFramework.get_validation_tests` |  | Available validation test specifications. |
| `ModelValidationFramework.get_regulatory_frameworks` |  | Regulatory frameworks governing model validation. |

**Engine `model_validation_framework` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `MODEL_LIFECYCLE_STATES` | `['DEVELOPMENT', 'VALIDATION', 'APPROVED', 'MONITORING', 'UNDER_REVIEW', 'RETIRED']` |

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

**GET /api/v1/model-validation/ref/regulatory-frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulatory_frameworks'], 'n_keys': 1}`

**GET /api/v1/model-validation/ref/validation-tests** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['validation_tests'], 'n_keys': 1}`

**POST /api/v1/model-validation/backtest** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

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
group_size = max(1, n // 10)
group = sorted_pairs[i:i + group_size]
expected_p = sum(p for p, _ in group) / len(group)
observed_p = sum(a for _, a in group) / len(group)
dof = max(1, min(10, n // group_size) - 2)
p_approx = max(0.001, math.exp(-chi_sq / (2 * dof)))
predicted_rate = sum(predicted) / n if n > 0 else 0
actual_rate = sum(actual) / n if n > 0 else 0
diff = abs(actual_rate - predicted_rate)
se = math.sqrt(predicted_rate * (1 - predicted_rate) / n) if n > 0 else 1
z = diff / se if se > 0 else 0
p_val = max(0.001, 2 * math.exp(-0.5 * z ** 2))
bucket_size = max(1, n // 10)
p_pct = len(sorted_pred[i:i + bucket_size]) / n
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine docstring is the methodology statement; nothing to reconcile.)*

### 7.1 What the module computes

`backend/services/model_validation_framework.py` (class `ModelValidationFramework`) is the platform's **second-line model-risk-management layer**: a model inventory, a generalised backtesting harness, lifecycle governance, champion–challenger comparison and a compliance dashboard, aligned (per docstring) to BCBS 239, EBA GL/2023/04 and Fed SR 11-7. Exposed via `api/v1/routes/model_validation.py`: `POST /backtest`, `GET /inventory`, `GET /dashboard`, and `GET /ref/{catalog, lifecycle-states, lifecycle-transitions, validation-tests, regulatory-frameworks}`.

**Model inventory** (`MODEL_INVENTORY`): 17 registered platform models across credit risk (PD/LGD/EAD/staging), climate risk (physical HEV, transition CPRS/NGFS, scenario analysis, sovereign), valuation (real estate, stranded assets), emissions (GHG calculator, PCAF), market risk (VaR, stress testing), regulatory (CBAM, EU Taxonomy) and ESG (factor overlay) — each with risk tier (1–3), model type, owning team, validation frequency and mapped engine module.

### 7.2 Validation test suite & thresholds (`VALIDATION_TESTS` — 12 tests, green/amber/red traffic lights)

| Test | Category | Green | Amber | Direction |
|---|---|---|---|---|
| RMSE | accuracy | ≤ 0.05 | ≤ 0.10 | lower better |
| MAE | accuracy | ≤ 0.03 | ≤ 0.07 | lower better |
| MAPE | accuracy | ≤ 10.0 | ≤ 20.0 | lower better |
| R² | accuracy | ≥ 0.70 | ≥ 0.50 | higher better |
| Hit rate (direction) | discriminatory power | ≥ 70% | ≥ 55% | higher better |
| AUC-ROC | discriminatory power | ≥ 0.75 | ≥ 0.65 | higher better |
| KS statistic | calibration | ≥ 0.40 | ≥ 0.25 | higher better |
| Hosmer–Lemeshow p | calibration | ≥ 0.05 | ≥ 0.01 | higher better |
| Binomial test p | calibration | ≥ 0.05 | ≥ 0.01 | higher better |
| Basel traffic-light breaches (250d) | backtesting | ≤ 4 | ≤ 9 | lower better |
| PSI | stability | ≤ 0.10 | ≤ 0.25 | lower better |
| CSI | stability | ≤ 0.10 | ≤ 0.25 | lower better |

Provenance: the Basel breach bands (green ≤ 4, amber 5–9, red ≥ 10 exceptions in 250 days) match the BCBS backtesting traffic-light framework; the PSI 0.10/0.25 bands are the industry-standard convention; KS ≥ 0.40 "good discrimination" and AUC ≥ 0.75 follow common IRB-validation rules of thumb; RMSE/MAE/MAPE thresholds are platform conventions (they are scale-dependent, so fixed cut-offs implicitly assume rate-like 0–1 targets).

**Lifecycle governance:** 6 states (DEVELOPMENT → VALIDATION → APPROVED → MONITORING → UNDER_REVIEW → RETIRED) with an explicit transition whitelist (e.g. MONITORING → {UNDER_REVIEW, RETIRED}; UNDER_REVIEW → {VALIDATION, MONITORING, RETIRED}).

### 7.3 Calculation walkthrough

**Backtest (`run_backtest`):** given `predicted[]` and `actual[]` (truncated to common length n), every requested test is computed by `_compute_test`, banded green/amber/red per direction, and aggregated worst-case: any red → overall red / "fail" / regulatory `non_compliant`; any amber → amber / `under_observation`; else green / `compliant`. Deterministic run id = first 16 hex chars of SHA-256 of `bt:{model}:{window}`. Recommendations cite the frameworks — red overall → "Immediate review required per EBA GL/2023/04" + transition to UNDER_REVIEW; Tier-1 model not green → "escalate to Model Risk Committee per SR 11-7".

Test implementations worth noting (all pure-Python, self-labelled "simplified"): AUC = concordant-pairs (Mann–Whitney) statistic; KS = max CDF separation of predicted scores between actual 1s and 0s; Hosmer–Lemeshow builds deciles and converts χ² to an **approximate** p via `exp(−χ²/(2·dof))` (not the true χ² tail); binomial test uses a normal z with p ≈ `2·exp(−z²/2)`; PSI compares *sorted* predicted vs actual decile shares; hit rate = fraction of consecutive-step direction agreements.

**Champion–challenger (`compare_models`):** computes RMSE/MAE/MAPE/R²/hit-rate for both models, picks a winner on the chosen metric, then a paired squared-error difference test: `t = mean(diff)/(sd(diff)/√n)` with approximate `p = 2·exp(−|t|/2)`… precisely, `2·exp(−0.5·|t|)`, floored at 0.001. Challenger promotion is recommended only when it wins **and** p < 0.05.

**Dashboard:** counts models by state/tier/category; `bcbs239_compliance_pct` = share of models with a periodic validation frequency **and** documented key outputs; `eba_gl_2023_04_compliant` checks all Tier-1/2 models are validated (currently assumed true — in-code comment: "production reads from DB").

### 7.4 Worked example — backtesting a PD model on 5 observations

`predicted = [0.02, 0.03, 0.05, 0.04, 0.06]`, `actual = [0.025, 0.028, 0.06, 0.035, 0.055]`, tests = RMSE, MAE, hit rate.

| Test | Computation | Value | Light |
|---|---|---|---|
| RMSE | errors −0.005, 0.002, −0.01, 0.005, 0.005 → mse = (25+4+100+25+25)/5 ×10⁻⁶ = 35.8×10⁻⁶ | **0.00598** | green (≤ 0.05) |
| MAE | (5+2+10+5+5)/5 ×10⁻³ | **0.0054** | green (≤ 0.03) |
| Hit rate | steps: pred +,+,−,+ vs act +,+,−,+ → 4/4 | **100%** | green (≥ 70) |

Overall: green / pass / `compliant`; no recommendations beyond none. Had actual step 4 moved up instead (breaking one direction), hit rate = 75% (still green); two breaks → 50% → red → overall red → EBA GL/2023/04 critical recommendation + SR-11-7 escalation for this Tier-1 model.

### 7.5 Data provenance & limitations

- **No PRNG** — deterministic throughout (even run ids are content-hashed); all data is caller-supplied prediction/actual series.
- **Statistical approximations:** the Hosmer–Lemeshow, binomial and paired-t p-values use exponential approximations rather than proper χ²/normal/t distributions — fine for traffic-light triage, not for formal hypothesis testing; PSI on sorted arrays measures distributional shift only coarsely (equal-count deciles of each series make within-bucket shares nearly identical by construction, so the implemented PSI is systematically near zero).
- **Governance is stateless in this layer:** lifecycle current-state is hard-coded to MONITORING, dashboard overdue/findings lists are empty, and EBA Tier-1/2 validation is assumed complete — the in-code comments explicitly defer persistence to the database layer. Treat the dashboard as a schema demonstration until wired.
- Fixed accuracy thresholds (RMSE ≤ 0.05 etc.) presume probability-scaled outputs; backtesting a €-denominated model against them would misclassify.
- Inventory metadata (owners, frameworks, engine modules) is a curated registry, not auto-discovered from code.

### 7.6 Framework alignment

- **SR 11-7 (Fed, 2011):** the canonical three-pillar MRM guidance — development documentation, *independent* validation, ongoing monitoring, governed by a model inventory — mirrored by the inventory registry, lifecycle state machine and Tier-1 escalation language.
- **EBA GL/2023/04 (Model Risk Management):** model inventory, annual independent validation of material models, change management — encoded as validation frequencies, the Tier-1/2 annual-validation compliance check and red-result review triggers.
- **BCBS 239 (2013):** risk-data aggregation principles (completeness, accuracy, timeliness, governance) proxied by the metadata-completeness compliance percentage.
- **Basel III CRE 35 / backtesting traffic lights:** the IRB validation triad (discriminatory power / calibration / stability) structures the test categories, and the 4/9-breach VaR traffic-light bands are reproduced exactly (BCBS's zones derive from binomial probabilities of exceptions at 99% VaR over 250 days).
- **IFRS 9 ECL validation (EBA/GL/2017/16):** stage-classification and PD/LGD/EAD backtesting named in the framework catalogue; the registered ECL models carry it as their governing framework.

## 9 · Future Evolution

### 9.1 Evolution A — Live model registry with real backtest telemetry and calibrated significance tests (analytics ladder: rung 3 → 4)

**What.** `ModelValidationFramework` is the platform's second-line MRM layer: a 17-model
inventory (PD/LGD/EAD, climate physical/transition, valuation, PCAF, VaR, CBAM…), a
generalised backtesting harness (MSE, R², KS statistic, Hosmer-Lemeshow-style grouped
chi-square, binomial calibration z-test), champion-challenger comparison with a paired
t-test, and a BCBS 239 / EBA GL/2023/04 / SR 11-7 dashboard. The honest limits: the
inventory is a hardcoded `MODEL_INVENTORY` constant, and several p-values are analytic
approximations (`p_value = 2·exp(−0.5·|t_stat|)`, `p_approx = exp(−chi_sq/(2·dof))`)
rather than true distribution tails. Evolution A makes the registry live and the tests
exact.

**How.** (1) Replace the static inventory with a generated engine registry — the roadmap
calls for exactly this (AST-scanned engine registry with version stamps); model
lifecycle state and validation history then persist, not reset per process. (2) Swap the
exponential p-value approximations for scipy.stats exact tails (t, chi-square, binomial),
which are already in the environment — MRM p-values must survive a regulator's
recomputation. (3) Feed backtests from real engine prediction logs (the bench_quant
harness and lineage traces are the data source) so `overdue_validations` and the
BCBS 239 compliance % reflect actual model runs. (4) Bench-pin every test statistic.

**Prerequisites.** The engine registry artifact (roadmap engine-platform work); a store
of model predictions vs realised outcomes. **Acceptance:** the inventory reflects the
real engine set with version stamps; p-values match scipy exact values within tolerance;
backtest inputs trace to logged predictions; test statistics bench-pinned.

### 9.2 Evolution B — Model-risk governance copilot for validators (LLM tier 2)

**What.** A copilot for the second line: "which models are overdue for validation and
what's our BCBS 239 compliance?" (calling `/dashboard`), "backtest the PD model against
this outcome set and tell me if it passes calibration" (calling `/backtest` and narrating
the KS/HL/binomial results), and "compare champion vs challenger" (`/compare-models`).

**How.** Five endpoints (`/backtest`, `/compare-models`, `/transition-lifecycle`,
`/inventory`, `/dashboard`) plus reference GETs (catalog, lifecycle-states/transitions,
validation-tests, regulatory-frameworks) that ground the MRM regime. The copilot explains
*which* statistical test failed and *why* (e.g. "KS = 0.42 indicates weak discrimination")
using the reference catalog. Lifecycle transitions are the gated tier-2 action (model
state changes inherit RBAC). This is the meta-module the tier-3 orchestrator consults to
report model provenance and version for any other copilot's answer.

**Prerequisites.** Evolution A's exact tests — a validator copilot narrating approximate
p-values as decisions would be indefensible in an audit. **Acceptance:** every statistic,
p-value, and compliance % traces to a tool response; the copilot names the regulatory
framework behind each test from the reference endpoint; lifecycle transitions require
confirmation and log to audit; it refuses to declare a model "validated" beyond what the
harness computes.