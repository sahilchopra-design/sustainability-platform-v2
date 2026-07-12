# Ensemble Prediction Engine
**Module ID:** `ensemble-prediction-engine` · **Route:** `/ensemble-prediction-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-CX2 · **Sprint:** CX

## 1 · Overview
XGBoost (0.4) + LightGBM (0.3) + Neural MLP (0.3) ensemble with 12-month forward prediction, backtest, and deployment.

**How an analyst works this module:**
- Ensemble Dashboard shows 3 model comparison
- Prediction Results for 15 entities with confidence intervals
- Backtest shows 3-year rolling performance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `ENTITY_NAMES`, `HISTORY`, `HISTORY_LEN`, `KPI`, `MIN_HISTORY`, `QUARTERS`, `TABS`, `WEIGHT_CANDIDATES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `WEIGHT_CANDIDATES` | 10 | `movAvg`, `nn` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['2023-Q1','2023-Q2','2023-Q3','2023-Q4','2024-Q1','2024-Q2','2024-Q3','2024-Q4','2025-Q1','2025-Q2','2025-Q3','2025-Q4'];` |
| `HISTORY_LEN` | `QUARTERS.length; // 12 observed quarters` |
| `MIN_HISTORY` | `4; // minimum points required before a walk-forward forecast is evaluated` |
| `HISTORY` | `ENTITY_NAMES.map((entity, e) => {` |
| `base` | `55 + (sr(e * 23) * 2 - 1) * 20;` |
| `drift` | `(sr(e * 77) * 2 - 1) * 1.5;` |
| `noise` | `(sr(e * 131 + t * 7) * 2 - 1) * 4;` |
| `denom` | `n * sumXX - sumX * sumX;` |
| `slice` | `series.slice(series.length - w);` |
| `last` | `series[n - 1];` |
| `sum` | `w.linear + w.movAvg + w.nn \|\| 1;` |
| `meanActual` | `rows.reduce((s, r) => s + r.actual, 0) / n;` |
| `weights` | `useMemo(() => { const sum = rawWeights.linear + rawWeights.movAvg + rawWeights.nn \|\| 1;` |
| `gridResults` | `useMemo(() => WEIGHT_CANDIDATES.map(c => ({` |
| `PREDICTIONS` | `useMemo(() => HISTORY.map(({ entity, hist }) => {` |
| `current` | `hist[hist.length - 1];` |
| `relSpread` | `current !== 0 ? (spreadHigh - spreadLow) / Math.abs(current) : 0;` |
| `confidence` | `Math.max(50, Math.min(99, Math.round(100 - relSpread * 200)));` |
| `equalWeightMetrics` | `useMemo(() => computeMetrics(runBacktest({ linear:1/3, movAvg:1/3, nn:1/3 }), 'ensemble'), []);` |
| `optimizedMetrics` | `useMemo(() => computeMetrics(runBacktest(bestGrid), 'ensemble'), [bestGrid]);  const comparisonData = useMemo(() => ['RMSE','MAE','R-squared'].map(metric => { const row = { metric };` |
| `delta` | `p.predicted - p.current;` |
| `lastQ` | `perQuarterBacktest[perQuarterBacktest.length - 1];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITY_NAMES`, `QUARTERS`, `TABS`, `WEIGHT_CANDIDATES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Ensemble RMSE | — | Cross-validation | Root mean squared error |
| Best Single Model | — | Comparison | Ensemble outperforms best single model |

## 5 · Intermediate Transformation Logic
**Methodology:** Weighted ensemble prediction
**Headline formula:** `y_hat = 0.4×XGBoost + 0.3×LightGBM + 0.3×MLP`

3-model ensemble with weights optimized via grid search. 5-fold cross-validation. Conformal prediction for 90% coverage intervals. 3-year rolling backtest.

**Standards:** ['Chen (2016)', 'Ke (2017)']
**Reference documents:** Chen & Guestrin (2016) XGBoost; Ke et al. (2017) LightGBM

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — no machine learning runs here.** The guide describes a real 3-model
> ensemble — `y_hat = 0.4·XGBoost + 0.3·LightGBM + 0.3·MLP`, weights optimised by grid search, 5-fold
> cross-validation, conformal 90% prediction intervals, 3-year rolling backtest. **None of this
> executes.** There is no XGBoost, no LightGBM, no neural net, no training loop, no cross-validation,
> no conformal calibration anywhere in the code. Every number — the base-model RMSE/MAE/R²/AUC, the
> ensemble metrics, the weight-grid RMSEs, the per-entity predictions, the backtest series, the A/B
> test p-value — is a **hard-coded constant or an `sr()` random draw**. The page is a *visual mockup*
> of an ML-ops dashboard. §8 specifies the ensemble model it pretends to run.

### 7.1 What the module computes

Nothing is trained or predicted. The "results" are static objects:

```js
MODELS = [ {XGBoost rmse:4.2 r2:0.89 auc:0.92 weight:0.4}, {LightGBM rmse:4.5 ...}, {MLP ...} ]
ENSEMBLE = { rmse:3.8, r2:0.92, auc:0.94 }              // hard-coded, not aggregated
WEIGHT_GRID = [ {xgb:0.4,lgbm:0.3,mlp:0.3, rmse:3.8}, ... ]   // 9 hand-set rows
```

Per-entity "predictions" are independent random draws — **not** `0.4·XGB + 0.3·LGBM + 0.3·MLP`:
```js
predicted = round(57 + (sr(i·23)·2−1)·19 + (sr(i·510)·2−1)·3)   // random, not ensembled
ciLow     = round(53 + (sr(i·23)·2−1)·19)                       // CI not from conformal calibration
confidence= round(82 + (sr(i·10)·2−1)·8)
```

The only render-time computation is `comparisonData`, which merely *reshapes* the static MODELS/ENSEMBLE
metrics into a table — no arithmetic on data.

### 7.2 Parameterisation / scoring rubric

| Object | Content | Nature |
|---|---|---|
| `MODELS` | XGB (w 0.4, RMSE 4.2, R² 0.89), LGBM (0.3, 4.5, 0.87), MLP (0.3, 4.8, 0.85) | hard-coded metrics |
| `ENSEMBLE` | RMSE 3.8, R² 0.92, AUC 0.94 | hard-coded (better than any base — the intended message) |
| `WEIGHT_GRID` | 9 weight triples + RMSE | hand-set "grid search" (best = 0.4/0.3/0.3 @ 3.8) |
| `PREDICTIONS` | 15 real entities (JPM, Shell, Microsoft…) | `sr()`-random current/predicted/CI |
| `BACKTEST` | 12 quarters RMSE↓, R²↑ | scripted improving trend + noise |
| `AB_TEST` | control v2.1 vs treatment v3.0, p=0.003 | hard-coded "significant" result |

The weights (0.4/0.3/0.3) and the ordering (ensemble beats best single model) are correct *in spirit*
for a well-tuned ensemble — but they are asserted, not derived.

### 7.3 Calculation walkthrough

Load the static model registry → the dashboard displays ensemble RMSE/R²/AUC and per-model cards
(version, last-trained date, drift status) → model-comparison reshapes metrics into a bar/radar → the
weight-optimisation tab plots the 9 hand-set grid rows (highlighting the 3.8-RMSE optimum) → prediction
results table shows random per-entity forecasts with CIs → backtest shows the scripted RMSE decline →
deployment tab shows the fabricated A/B test. No data flows into a model.

### 7.4 Worked example

The guide's ensemble rule, *if it ran*, on the stated base outputs. Suppose for one entity XGBoost
predicts 60, LightGBM 58, MLP 55:
```
y_hat = 0.4×60 + 0.3×58 + 0.3×55 = 24 + 17.4 + 16.5 = 57.9
```
The code does **not** do this — its `predicted` for that entity is `round(57 + (sr(i·23)·2−1)·19 +
(sr(i·510)·2−1)·3)`, a random number near 57 that ignores any base-model output (indeed there are no
base-model outputs to combine — only aggregate RMSE constants exist). The displayed ensemble RMSE of
3.8 vs the best base RMSE of 4.2 is likewise asserted, not measured.

### 7.5 Companion analytics

- **Weight optimisation:** the 9-row "grid search" is a lookup table, not an optimisation.
- **Backtest:** a scripted 12-quarter improving RMSE/R² — no rolling re-fit.
- **A/B test & deployment:** hard-coded p-value (0.003) and drift status ("None"/"Low") — MLOps
  chrome without an underlying pipeline.

### 7.6 Data provenance & limitations

- **No model exists.** All metrics are hard-coded; all predictions and CIs are `sr()` random draws.
  The entity names (JPMorgan, Shell, Microsoft…) are real labels on synthetic forecasts.
- Prediction intervals are **not** conformal (no calibration set); the "90% coverage" claim is not
  validated. The backtest is not a real out-of-sample evaluation.

**Framework alignment:** **Chen & Guestrin (2016) XGBoost** and **Ke et al. (2017) LightGBM** — the
gradient-boosted-tree learners named in the guide; **conformal prediction** — the distribution-free
interval method the guide claims (real predictions ± a calibrated quantile of nonconformity scores).
The module references these correctly but implements none of them.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce genuine 12-month-forward ESG/score predictions per entity from a trained 3-model ensemble,
with calibrated 90% prediction intervals and a real rolling backtest — replacing the mocked dashboard.

### 8.2 Conceptual approach
Stacked/weighted ensemble of gradient-boosted trees (**XGBoost**, **LightGBM**) and a **neural MLP**,
weights tuned by cross-validated grid search, with **split-conformal** prediction intervals.
Benchmarks: **Chen & Guestrin (2016)**, **Ke et al. (2017)**, and **Vovk et al. conformal prediction**;
industry analogue: vendor ESG-score forecasting (MSCI/Sustainalytics predictive models).

### 8.3 Mathematical specification
```
ŷ_ens(x) = Σ_m w_m · f_m(x),   Σ w_m = 1,  m ∈ {XGB, LGBM, MLP}
w* = argmin_w  (1/K) Σ_k RMSE_k(w)          // K-fold CV grid search over the simplex
Conformal:  q̂ = Quantile_{1−α}( { |y_i − ŷ(x_i)| : i ∈ calib } )
Interval(x) = [ ŷ_ens(x) − q̂ , ŷ_ens(x) + q̂ ]     // α = 0.10 ⇒ 90% coverage
Backtest: rolling origin, refit each quarter, report out-of-sample RMSE/R²
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Base learners | `f_m` | XGBoost / LightGBM / MLP (trained on feature matrix) |
| Ensemble weights | `w_m` | K-fold CV grid search (K=5) |
| Conformal level | `α` | 0.10 (90% coverage) |
| Features | `x` | ESG factors, financials, momentum, sector dummies |

### 8.4 Data requirements
Labelled panel: historical entity scores (target), lagged features (ESG sub-scores, fundamentals,
price/vol), sector/region encodings, and a held-out calibration split for conformal. Sources: internal
score history + the platform's company master and reference-data layer.

### 8.5 Validation & benchmarking plan
Rolling-origin backtest (refit quarterly), report out-of-sample RMSE/R² and **empirical conformal
coverage** (should sit ≈90%). Ablate each base learner to confirm the ensemble beats the best single
model. Compare weight-grid optimum to equal-weight and to stacking (meta-learner).

### 8.6 Limitations & model risk
Ensembles overfit if base learners are correlated and CV folds leak temporally — use blocked/time-series
CV. Conformal coverage degrades under distribution shift (drift). Conservative fallback: widen intervals
by the drift-adjusted quantile and fall back to the equal-weight ensemble when grid-search gains are
within CV noise.

## 9 · Future Evolution

### 9.1 Evolution A — Train the advertised ensemble; keep the honest walk-forward scaffold (analytics ladder: rung 1 → 4)

**What.** The §7 flag is the atlas's bluntest: "no machine learning runs here" — no XGBoost, LightGBM, or MLP exists; the advertised model metrics (RMSE 4.2/4.5, ensemble 3.8, AUC 0.94), the weight-grid results, and the A/B p-value are hard-coded constants, and per-entity predictions are independent draws, not `0.4·XGB + 0.3·LGBM + 0.3·MLP`. What the page *does* compute is a modest, real walk-forward scaffold — linear-trend/moving-average candidate models with grid-searched weights over a 12-quarter (seeded) history. Evolution A trains the real thing server-side, per the §8 spec already on this page.

**How.** (1) `services/ensemble_forecast_engine.py` using the environment's existing sklearn/statsmodels stack (gradient boosting + a simple MLP; add xgboost/lightgbm only if a dependency review clears them against the pinned FastAPI constraint set). (2) A real target and real history: pick one platform series with genuine time depth — ESG score history once `dme_index_history` persists, or ingested market/claims series — because with no real corpus, "training" would just relocate the fabrication. (3) Keep the page's honest machinery: walk-forward evaluation, weight grid search, and per-quarter backtest become server-computed over real runs; conformal intervals implemented as specified (the current `confidence = 100 − relSpread·200` heuristic is not conformal and should be renamed or replaced). (4) `ml_model_runs` persistence (shared schema with `dme-ml-materiality`'s Evolution A); hard-coded MODEL/ENSEMBLE constants deleted the day real metrics exist.

**Prerequisites (hard).** A real training series (the honest gate); dependency review; model cards per §8 convention. **Acceptance:** displayed RMSE/R² equal a reproducible run's persisted metrics; the ensemble weight actually used equals the grid-search winner; a fixed-seed retrain reproduces within tolerance.

### 9.2 Evolution B — Forecast-consumer copilot with trained-or-refuse discipline (LLM tier 2)

**What.** Once real runs exist, the natural assistant is a forecast interpreter for non-quant users: "what does the model predict for entity X next quarter, how confident is it, and what drove the last backtest miss?" — answered by querying run and prediction endpoints, quoting the conformal interval, and explaining the ensemble's composition from the persisted weights. Its defining behavior is the refuse path: for entities with fewer than the walk-forward minimum (`MIN_HISTORY = 4` in the current code — keep the concept), it says "insufficient history to forecast," never interpolating.

**How.** Tools: `get_prediction(entity)`, `get_model_run(latest)`, `get_backtest(entity)`, `list_covered_entities`. Grounding corpus = this Atlas record's §5/§8 plus the model card, so methodology answers describe the *actual* trained configuration, not the guide's aspirational 0.4/0.3/0.3. The no-fabrication validator is strictest here: any numeric confidence or metric must match a persisted run — an ML-ops copilot inventing an AUC would recreate the module's original sin conversationally.

**Prerequisites (hard).** Evolution A end-to-end — there is nothing real to interpret today, and a copilot over the current mockup would eloquently explain hard-coded constants as model behavior. **Acceptance:** golden Q&A metrics match run records exactly; below-minimum-history entities always get the refusal; "why did the model miss in Q3?" answers cite the actual backtest residual, not a narrative invention.