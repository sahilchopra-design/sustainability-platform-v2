# ML Risk Scorer
**Module ID:** `ml-risk-scorer` · **Route:** `/ml-risk-scorer` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Machine learning-based ESG risk scoring engine that trains, evaluates, and deploys classification and regression models on structured ESG and financial data. Supports XGBoost, random forest, logistic regression, and neural network architectures with full feature importance, SHAP explainability, and model performance monitoring. Applies SR 11-7 and ECB model risk management guidance to document model governance requirements.

> **Business value:** Gives quantitative ESG researchers and risk managers a governed, explainable ML scoring capability that meets supervisory model risk standards while providing interpretable, SHAP-backed ESG risk assessments at portfolio scale.

**How an analyst works this module:**
- Configure the training data set by selecting features from the ESG database and defining the target variable (risk class or score)
- Train the selected model architecture and review performance metrics on train/validation/test split
- Analyse SHAP feature importance plots to validate that model drivers are economically interpretable
- Run PSI monitoring check to assess whether production data distribution has shifted from training sample
- Generate model validation documentation aligned with SR 11-7 and ECB model risk management requirements

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDIT_LOG`, `Badge`, `DEFAULT_QUANTILES`, `FEATURES`, `MODEL_REGISTRY_DATA`, `QUANTILE_OPTIONS`, `REGIONS`, `SECTORS`, `Slider`, `TASKS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America','Europe','Asia-Pacific'];` |
| `lrFactor` | `params.learningRate / 0.05;                                  // 1.0 at default` |
| `depthFactor` | `params.maxDepth / 6;                                      // 1.0 at default` |
| `regFactor` | `(params.subsample * params.colsampleBytree) / 0.64;         // 1.0 at default` |
| `childWeightFactor` | `3 / Math.max(1, params.minChildWeight);             // 1.0 at default` |
| `capacity` | `depthFactor * regFactor * childWeightFactor;                 // >1 = higher capacity` |
| `splitFactor` | `Math.max(0.5, params.trainSplit / 80);                    // 1.0 at default` |
| `decay` | `0.15 * lrFactor;` |
| `trainFloor` | `Math.min(0.4, Math.max(0.015, 0.09 / capacity));         // capped so under-fit doesn't invert the decay curve` |
| `overfitGap` | `Math.max(0, (capacity - 1) * 0.05) / splitFactor;` |
| `valFloor` | `trainFloor + overfitGap;` |
| `instability` | `Math.max(0, lrFactor - 1.5) * 0.03;                       // high LR = noisier curve` |
| `epochScale` | `params.nEstimators / 500;                                  // 1.0 at default` |
| `lossDataFull` | `useMemo(() => Array.from({ length: 20 }, (_, i) => ({ epoch: Math.round((i + 1) * 25 * epochScale), trainLoss: +Math.max(0.001, trainFloor + (0.45 - trainFloor) * Math.exp(-decay * i) + sr(i * 3) * (0.02 + instability)).toFixed(4), valLoss: +Math.max(0.001, valFloor + (0.48 - valFloor) * Math.exp(-decay * 0.87 * i) + sr(i * 7 + 1) * (0.02` |
| `finalMetrics` | `useMemo(() => { const last = lossDataFull[lossDataFull.length - 1];` |
| `importanceData` | `useMemo(() => { const raw = FEATURES.map((f, i) => ({ feature: f, value: sr(i * 17 + 3) }));` |
| `total` | `Math.max(1e-10, raw.reduce((a, b) => a + b.value, 0)); // floor prevents NaN if all feature importances are 0` |
| `shapData` | `useMemo(() => importanceData.slice(0, 10).flatMap((f, fi) => Array.from({ length: 30 }, (_, i) => ({ featureIdx: fi, shapValue: (sr(fi * 7 + i) - 0.5) * f.value * 12, featureValue: sr(fi * 3 + i + 2), })) ), [importanceData]);` |
| `predictions` | `useMemo(() => Array.from({ length: 50 }, (_, i) => { const actual = +(0.3 + sr(i * 19) * 0.6).toFixed(3);` |
| `p50` | `+(actual + (sr(i * 23 + 1) - 0.5) * 0.08).toFixed(3);` |
| `p25` | `+Math.max(0, p50 - 0.07 - sr(i * 7)  * 0.03).toFixed(3);` |
| `p75` | `+Math.min(1, p50 + 0.07 + sr(i * 11) * 0.03).toFixed(3);` |
| `p95` | `+Math.min(1, p50 + 0.15 + sr(i * 13) * 0.05).toFixed(3);` |
| `coverageRate` | `+(predictions.filter(p => p.covered).length / predictions.length * 100).toFixed(1);` |
| `calibrationData` | `useMemo(() => [5, 25, 50, 75, 95].map(q => ({` |
| `modelHash` | `useMemo(() => { const seed = params.nEstimators * 7 + params.maxDepth * 13 + Math.round(params.learningRate * 1000) * 3 + Math.round(params.subsample * 100) * 11 + Math.round(params.colsampleBytree * 100) * 17 + params.minChildWeight * 19 + params.trainSplit * 23;` |
| `sectorPerf` | `useMemo(() => SECTORS.map((s, i) => ({` |
| `regionPerf` | `useMemo(() => REGIONS.map((r, i) => ({` |
| `corr` | `fi === gi ? 1 : (sr(fi * 37 + gi * 7 + 5) - 0.5) * 2;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FEATURES`, `QUANTILE_OPTIONS`, `REGIONS`, `SECTORS`, `TASKS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Model AUC-ROC | — | Held-out test set evaluation | Area under ROC curve; above 0.75 indicates acceptable discrimination for ESG risk classification |
| SHAP Feature Importance (top 3) | — | SHAP Shapley value decomposition | Top three features by mean absolute SHAP value driving model risk score output |
| Population Stability Index (PSI) | — | Production monitoring | Distribution shift metric for model inputs; high PSI triggers mandatory model revalidation |
| Model Accuracy (%) | — | Test set confusion matrix | Proportion of correctly classified ESG risk categories on held-out validation data |
- **ESG database structured features** → Extract, clean, and engineer features; handle missing values; normalise scales → **Training feature matrix with target labels for ML model fitting**
- **Model training and evaluation pipeline** → Cross-validate on train/val/test splits; compute AUC, F1, and calibration metrics → **Model performance report and champion model selection**
- **Production scoring pipeline** → Score new entities via deployed model endpoint; log PSI and score distribution → **Entity-level ESG risk scores with SHAP explanations and monitoring alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** ML ESG Risk Score
**Headline formula:** `Scoreᵢ = f(β₁X₁ + β₂X₂ + ... + βₙXₙ)`

The scoring model maps ESG feature vectors to risk scores using gradient-boosted trees by default. Feature importance is computed via SHAP Shapley values, providing additive feature attribution consistent with game-theoretic fairness axioms. Model performance is monitored using Population Stability Index (PSI) to detect distribution shift in production inputs, triggering revalidation workflows.

**Standards:** ['SR 11-7 Supervisory Guidance on Model Risk Management', 'ECB Guide on Internal Models 2019', 'SHAP Lundberg & Lee 2017', 'ISO/IEC 42001 AI Management System Standard 2023']
**Reference documents:** Federal Reserve SR 11-7 Supervisory Guidance on Model Risk Management 2011; ECB Guide on Internal Models â€” Model Risk Management Chapter 2019; Lundberg & Lee â€” A Unified Approach to Interpreting Model Predictions (SHAP) 2017; ISO/IEC 42001:2023 â€” Artificial Intelligence Management System Standard; Chen & Guestrin â€” XGBoost: A Scalable Tree Boosting System 2016

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a governed ML training pipeline
> with real AUC-ROC evaluation, SHAP Shapley-value feature attribution, and PSI drift monitoring. The
> page's own "TRAIN MODEL" button **does not train anything** — it runs a `setInterval` that ticks a
> progress bar from 0→100% over 2 seconds and then reveals a set of **hard-coded metric literals**
> (`MAE (P50): '0.0823'`, `RMSE: '0.1142'`, `Calibration Err: '2.3%'`) that are identical regardless of
> the hyperparameters the user configured. Every feature-importance, SHAP, prediction, and calibration
> number elsewhere on the page is drawn from the seeded PRNG `sr(s)=frac(sin(s+1)×10⁴)`. Sections below
> document the interactive mock as actually implemented.

### 7.1 What the module computes

**"Training"** — a fake progress animation over a pre-computed loss curve:

```js
lossDataFull[i] = { trainLoss: 0.45·e^(−0.15i) + sr(i*3)*0.02, valLoss: 0.48·e^(−0.13i) + sr(i*7+1)*0.025 }
// trainModel(): setInterval ticks step 0→20, progress=min(100,step*5), reveals lossDataFull.slice(0, step*0.4)
// On completion: training.status='complete' — final metrics displayed are hard-coded strings, NOT
// derived from params.nEstimators/maxDepth/learningRate/etc. that the user set via the sliders
```

**Feature importance / SHAP:**

```js
importanceData = FEATURES.map((f,i) => ({feature:f, value: sr(i*17+3)}))
                  .normalize-to-sum-1()            // "gain" — actually just normalized PRNG draws
shapData: for top-10 features, 30 synthetic points each:
  shapValue    = (sr(fi*7+i) − 0.5) × importance_fi × 12
  featureValue = sr(fi*3+i+2)
```

**Predictions (quantile regression mock), 50 synthetic assets:**

```js
actual = 0.3 + sr(i*19)*0.6
p50    = actual + (sr(i*23+1) − 0.5)*0.08
p5  = max(0, p50 − 0.15 − sr(i*5)*0.05);   p25 = max(0, p50 − 0.07 − sr(i*7)*0.03)
p75 = min(1, p50 + 0.07 + sr(i*11)*0.03);  p95 = min(1, p50 + 0.15 + sr(i*13)*0.05)
covered = actual ∈ [p5, p95]
coverageRate = count(covered) / 50 × 100
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Hyperparameter sliders | `n_estimators` 100–2000, `max_depth` 3–12, `learning_rate` 0.01–0.3, `subsample`/`colsample_bytree` 0.5–1.0, `min_child_weight` 1–10 | Standard XGBoost hyperparameter ranges — genuinely realistic defaults, but **cosmetically wired**: none feed the "training" loop or resulting metrics |
| Post-training metrics | MAE 0.0823, RMSE 0.1142, Pinball P25/P75 0.0314/0.0291, Calibration Err 2.3%, Training Time 1.8s | Six hard-coded literals, identical every run |
| `MODEL_REGISTRY_DATA` (5 rows) | `mae` 0.088–0.12, decaying by 0.008/version | `sr()`-jittered decay curve simulating iterative model improvement |
| `AUDIT_LOG` (10 rows) | TRAIN/PREDICT/EVALUATE/REGISTER/DEPLOY actions | Synthetic timestamped log, deterministic date arithmetic, not a real audit trail |
| Coverage target | 90% (P5–P95 band) | Standard conformal-prediction target coverage level |

### 7.3 Calculation walkthrough

1. **Config & Training tab** — sliders update `params` state; clicking TRAIN MODEL starts the fake
   progress animation described in §7.1; the loss chart shown *during* "training" is a genuine slice
   of the pre-computed `lossDataFull` array (so the curve shape is real), but it is the *same* curve
   regardless of hyperparameter changes.
2. **Feature Importance & SHAP tab** — normalizes 19 PRNG draws to sum to 1.0 and relabels the result
   "XGBoost Gain"; SHAP beeswarm plots 300 synthetic points (30 per top-10 feature) with an
   `importance × 12` scale factor that is arbitrary, not derived from any base-value decomposition.
3. **Feature Correlation Matrix (top 6×6)** — `corr = fi===gi ? 1 : (sr(fi*37+gi*7+5)-0.5)*2`; like the
   sister modules, this is not guaranteed symmetric or PSD.
4. **Predictions & Validation tab** — `coverageRate` is a genuine calculation over the synthetic
   `predictions` array (see worked example); calibration plot compares `expected` quantile to a
   PRNG-jittered `actual` value at 5 fixed quantile points.
5. **Model Governance tab** — static registry/audit-log tables; "Fairness Metrics by Sector" bar chart
   plots `sr()`-seeded MAE/RMSE per of 8 sectors — not measured from any actual per-sector model
   evaluation.

### 7.4 Worked example

`coverageRate` is the one metric on the page that is a real function of the (synthetic) data it
displays. For asset `i=0`: `actual = 0.3 + sr(0)*0.6`. `sr(0) = frac(sin(1)×10⁴) ≈ 0.7096`, so
`actual ≈ 0.3 + 0.426 = 0.726`. `p50 = 0.726 + (sr(23×1... wait i*23+1=1)−0.5)×0.08`; `sr(1)=frac(sin(2)×10⁴)≈frac(9092.97)≈0.9297` → `p50 ≈ 0.726 + (0.9297−0.5)×0.08 ≈ 0.726+0.0344=0.760`.
`p5 = max(0, 0.760 − 0.15 − sr(0)×0.05) = max(0, 0.760−0.15−0.0355)=0.575`.
`p95 = min(1, 0.760+0.15+sr(13)×0.05)` (a further PRNG draw) `≈ 0.760+0.15+0.03=0.940`.
`0.575 ≤ 0.726 ≤ 0.940` → **covered = true** for asset 0. Repeating across all 50 synthetic assets and
counting the `true` fraction is exactly how the page's displayed `coverageRate` (~90%, by construction
of the ±0.15/±0.05 P5/P95 half-widths around a ±0.08-jittered P50) is produced.

### 7.5 Companion analytics

- **Model Card (Governance tab)** — narrative text ("45,000 assets, 30 sectors, 2010–2025, NGFS
  scenario-adjusted", "Out-of-distribution performance degraded for unlisted SMEs and sovereigns") is
  well-written, realistic model-card prose but describes a training run that never happened in this
  codebase.
- **Champion/Challenger card** — static comparison (`xgb_climate_risk_v5` MAE 0.0823 vs
  `lgbm_climate_risk_v1` MAE 0.0891) — illustrative only.

### 7.6 Data provenance & limitations

- **The TRAIN MODEL button is a UI animation, not a model run.** No gradient boosting, no
  cross-validation, no actual hyperparameter sensitivity exists — this is the most significant
  finding for this module, since a user could reasonably believe adjusting `n_estimators` or
  `learning_rate` changes the resulting metrics; it does not.
- All feature importances, SHAP values, predictions, and calibration points are `sr()`-seeded, not
  computed from `FEATURES` × any real entity dataset.
- `coverageRate` is genuinely computed from the synthetic prediction array — the only bona fide
  calculation on the page beyond simple lookups.

**Framework alignment:** XGBoost 2.0 (named, referenced, not run) · Split conformal prediction
(Romano et al. 2019 — named methodology matches the P5/P25/P50/P75/P95 band structure conceptually,
though the bands are PRNG-generated rather than conformally calibrated on a held-out set) · SHAP
(Lundberg & Lee 2017, named, not computed) · SR 11-7 governance narrative (Model Card / Champion-
Challenger structure genuinely mirrors SR 11-7 documentation expectations, populated with fictional
content).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Wire the existing, well-designed hyperparameter UI to an actual training pipeline producing genuine
quantile-regression predictions, SHAP attributions, and conformal-calibrated prediction intervals for
climate physical-risk scoring, PD prediction, stranding probability, and ESG scoring across the
platform's asset universe.

### 8.2 Conceptual approach
Train real **XGBoost quantile regression** models (one per requested quantile, or a single model with
the pinball-loss objective per quantile) with **split conformal calibration** (Romano, Patterson &
Candès 2019) to guarantee marginal coverage — the same architecture BlackRock Aladdin Climate and
Moody's Climate on Demand use for physical-risk scoring, and structurally identical to what the page's
own UI copy already describes.

### 8.3 Mathematical specification

```
For each quantile τ ∈ {0.05,0.25,0.50,0.75,0.95}:
  Train XGBoost regressor f_τ minimizing pinball loss:
    L_τ(y, ŷ) = max(τ(y−ŷ), (τ−1)(y−ŷ))

Split conformal calibration (post-hoc, on held-out calibration set):
  s_i = max(f_lo(x_i) − y_i, y_i − f_hi(x_i))          // nonconformity score
  q̂ = the ⌈(n+1)(1−α)⌉/n empirical quantile of {s_i}
  Final interval: [f_lo(x) − q̂, f_hi(x) + q̂]            // guarantees ≥1−α marginal coverage

SHAP (TreeSHAP, exact for XGBoost):
  φ_j(x) such that f(x) = φ_0 + Σ_j φ_j(x)               (additivity / local accuracy axiom)
```

| Parameter | Calibration source |
|---|---|
| Quantile set | 5/25/50/75/95 (already selectable in the UI) |
| Conformal α | 0.10 (matches the page's stated 90% coverage target) |
| XGBoost hyperparameters | already exposed in UI; tune via 5-fold CV grid/Bayesian search, not fixed |
| Feature set | the 19 named features already listed (`carbon_intensity`, `flood_risk_score`, `pd_baseline`, etc.) — need to be sourced from the platform's actual physical-risk and credit-risk engines rather than fabricated |

### 8.4 Data requirements
Historical (feature, outcome) pairs for each task — physical risk scores from `natcat-loss-engine`/
`physical-hazard-map`, PD outcomes from actual default/rating-migration history, ESG scores from the
platform's taxonomy scoring engine — none of which currently feed this page.

### 8.5 Validation & benchmarking plan
Verify empirical coverage on a held-out test set matches the target (90% ± sampling noise); backtest
pinball loss against a naive baseline (e.g. unconditional quantiles); reconcile SHAP importances
against permutation importance as a sanity cross-check (Lundberg et al. 2020 recommend this as a
standard TreeSHAP validation step).

### 8.6 Limitations & model risk
Conformal guarantees are marginal (average coverage across the population), not conditional
(coverage can be poor for underrepresented subgroups like the "unlisted SMEs and sovereigns" the
Model Card already flags) — production deployment should report coverage by sector/region segment
(the page's existing `sectorPerf`/`regionPerf` structure is the right shape for this, once populated
with real evaluation results instead of `sr()` draws) and should never surface a "TRAIN MODEL" action
that silently ignores its own configured hyperparameters.

## 9 · Future Evolution

### 9.1 Evolution A — Make TRAIN train: a real, modest, governed model (analytics ladder: rung 1 → 4)

**What.** §7's finding is a complete simulation: the TRAIN button runs a 2-second `setInterval` progress bar and reveals hard-coded metric literals (`MAE '0.0823'`) identical regardless of hyperparameters; SHAP points, predictions, quantile bands and the feature-correlation matrix are all `sr()` draws — though the *simulation itself* is unusually thoughtful (the loss-curve generator responds to hyperparameters via capacity/overfit-gap heuristics, and `coverageRate` is genuinely computed over the synthetic predictions). Evolution A builds the real thing at deliberately modest scope: one gradient-boosted model (sklearn/XGBoost — in-environment per the platform's rung-4 tooling convention) on a real feature panel from the ml-feature-engineering evolution's store, a declared target (ESG risk class or score change), honest train/val/test evaluation, real SHAP via the shap library, real conformal quantiles (the page already renders the right visualizations for all of these — the UI survives; the data source changes).

**How.** (1) `POST /ml-risk-scorer/train` executing an actual fit server-side (async job, real progress), persisting the run (params, data vintage, metrics, artifacts) to the model registry the ml-governance evolution defines. (2) Metrics computed from held-out data — the hard-coded literals deleted; hyperparameter sliders now genuinely change outcomes. (3) SHAP computed per-entity; PSI monitoring wired to the governance dashboard's computed-PSI path. (4) SR 11-7-style validation documentation generated from run records per the §1 workflow. (5) Rung-4 honesty: a first model on a shallow panel will have unimpressive metrics — reporting them honestly *is* the deliverable, per the platform's no-fabrication ethos.

**Prerequisites (hard).** The feature store and a defensible target variable with enough history (the binding constraint — assess panel depth first); registry integration. **Acceptance:** changing max_depth changes measured validation error; metrics reproduce from stored runs; SHAP values differ by entity; the fake-progress path is gone.

### 9.2 Evolution B — Model-development copilot over real runs (LLM tier 2)

**What.** Once runs are real, the workflow questions follow: "compare run 14 vs 17 — what did halving the learning rate do to the val curve and calibration?", "is the top SHAP feature economically interpretable, or a leakage suspect?" (the §1 workflow's own validation question), "draft the SR 11-7 conceptual-soundness section from this run's records", "did production PSI drift justify the retraining alert?"

**How.** Tier 2 over the run-registry/metrics/SHAP routes: run comparisons diff stored records mechanically; interpretability discussions ground in the actual SHAP values and feature definitions from the feature store, with leakage hypotheses framed as checks to run (target-adjacent features, temporal leakage) rather than verdicts; validation-doc drafting assembles run evidence with every metric linked. The hard rule inherited from this module's history: no metric without a stored run behind it — the copilot must be unable to reproduce the hard-coded-literal failure mode, enforced by the no-fabrication validator against the run store. Hyperparameter advice cites the observed run history ("depth >8 overfit on this panel: runs 9, 12") rather than generic lore.

**Prerequisites (hard).** Evolution A's real training path and run persistence; Phase 2 tooling. **Acceptance:** every metric in an answer resolves to a run id; comparisons cite both runs; validation drafts link evidence; zero numerics outside the run store.