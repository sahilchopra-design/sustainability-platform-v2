# Predictive Analytics Hub
**Module ID:** `predictive-analytics-hub` · **Route:** `/predictive-analytics-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Machine learning-powered forward-looking ESG risk analytics hub integrating controversy prediction, rating forecasts, and climate scenario ML outputs.

> **Business value:** Elevates ESG analytics from backward-looking disclosure review to forward-looking AI-driven risk intelligence with explainable attribution.

**How an analyst works this module:**
- Select company or portfolio for predictive scoring.
- Review model-predicted ESG rating trajectory (12-month horizon).
- Inspect SHAP feature attribution for score drivers.
- Set alert for predicted controversy event probability exceeding threshold.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALGORITHMS`, `ALL_MODELS`, `ANOMALY_DAYS`, `CLIMATE_VARS`, `ESG_METRICS`, `MODEL_COLORS`, `SCENARIOS`, `StatusBadge`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ALL_MODELS` | 13 | `name`, `type`, `version`, `status`, `mae`, `auc`, `trained`, `infSec` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_jobSeq` | `0; // module-level counter — replaces non-deterministic Date.now() seed in job ID generator` |
| `ALGORITHMS` | `['Isolation Forest','LSTM Autoencoder','Statistical (z-score)'];` |
| `jobId` | ``JOB-${Math.floor(sr(++_jobSeq * 31 + 7) * 99999).toString().padStart(5, '0')}`;` |
| `historicalData` | `useMemo(() => { const histYears = 60; // 2020–2024, monthly return Array.from({ length: histYears }, (_, i) => { const mo = i % 12;` |
| `last` | `historicalData[historicalData.length - 1];` |
| `attentionHeatmap` | `useMemo(() => CLIMATE_VARS.map((v, vi) => ({` |
| `forecastAccuracy` | `useMemo(() => CLIMATE_VARS.map((v, i) => ({` |
| `carbonAttentionData` | `useMemo(() => CLIMATE_VARS.map((v, i) => ({` |
| `anomalyTimeSeries` | `useMemo(() => Array.from({ length: 90 }, (_, d) => { const isAnomaly = ANOMALY_DAYS.includes(d + 1);` |
| `base` | `65 + sr(d * 7 + 1) * 20;` |
| `value` | `isAnomaly ? base - 18 - sr(d * 13) * 8 : base;` |
| `anomalyLog` | `ANOMALY_DAYS.map((d, i) => ({` |
| `perfData90` | `useMemo(() => Array.from({ length: 90 }, (_, i) => ({ day: i + 1, xgb: +(0.085 + sr(i * 7 + 3) * 0.04 + (sr(i * 1) * 2 - 1) * 0.008).toFixed(4), lgbm: +(0.091 + sr(i * 11 + 5) * 0.045 + (sr(i * 1) * 2 - 1) * 0.009).toFixed(4), bert: +(0.063 + sr(i * 13 + 7) * 0.03 + (sr(i * 1) * 2 - 1) * 0.007).toFixed(4), itrans: +(0.075 + sr(i * 17 + 9)` |
| `driftMetrics` | `useMemo(() => CLIMATE_VARS.slice(0, 6).map((v, i) => ({` |
| `alerts` | `useMemo(() => [ { ts: '2026-04-01 09:12', type: 'Concept Drift', model: 'itransformer_climate_v1', detail: 'Carbon price — PSI=0.18', severity: 'HIGH' }, { ts: '2026-03-30 15:44', type: 'MAE Spike', model: 'xgb_climate_risk_v5', detail: 'MAE 0.121 > threshold 0.10', severity: 'MEDIUM' }, { ts: '2026-03-29 11:23', type: 'Data Drift', model` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALGORITHMS`, `ALL_MODELS`, `ANOMALY_DAYS`, `CLIMATE_VARS`, `ESG_METRICS`, `MODEL_COLORS`, `SCENARIOS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Model AUC (ROC) | — | Backtesting Engine | Area under ROC curve for controversy-event prediction model over 3-year backtest. |
| Features Used | — | Feature Store | Total input features spanning ESG pillars, macro variables, and NLP controversy signals. |
| Top Predictive Driver | — | SHAP Analysis | Most influential feature for predictive risk score across current coverage universe. |
- **Historical ESG data + controversy feeds + NLP text + macro factors** → Feature engineering; model training (XGBoost/LGBM); SHAP attribution → **Predictive scores, rating forecasts, and feature attribution outputs**

## 5 · Intermediate Transformation Logic
**Methodology:** Predictive Risk Score
**Headline formula:** `PR = f(features) via gradient-boosted ensemble; SHAP attribution for top-5 drivers`

Ensemble ML model score combining historical ESG trajectories, controversy signals, and macro risk factors.

**Standards:** ['MSCI ESG Controversy Research', 'XGBoost / LightGBM']
**Reference documents:** Lundberg & Lee (2017) A Unified Approach to Interpreting Model Predictions (SHAP); Chen & Guestrin (2016) XGBoost: A Scalable Tree Boosting System

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a working ML platform —
> gradient-boosted ensembles, SHAP feature attribution, a 0.83 backtested AUC, 124 live features.
> **None of this is computed in code.** `ALL_MODELS` is a 12-row hard-coded registry (MAE/AUC are
> literal constants, not backtest outputs); "Train New Model" and "Generate Forecast" trigger a
> `setInterval` progress bar that ends in a fixed `true` result with no model actually fitted;
> the iTransformer forecast, attention heatmap, drift PSI/KS statistics, and anomaly scores are
> all `sr()`-seeded numbers dressed as ML outputs. This is a **UI mock of an MLOps dashboard**,
> not an integrated model-serving layer. The sections below document what the code actually does.

### 7.1 What the module computes

Four tabs, each independently seeded:

- **Model Registry** — filters/displays the static `ALL_MODELS` array (id, type, version, status,
  `mae`, `auc`, `trained` date, `infSec`=inference throughput). All values are literals.
- **iTransformer Forecasting** — `historicalData` (60 synthetic months, 2020–2024) for 6 macro/
  climate variables; clicking "Generate Forecast" runs a UI timer (`p += 7` every 80ms) and, on
  completion, computes `forecastData` for the chosen horizon by extrapolating the last historical
  point with a linear drift term plus `sr()` noise — **not** a trained sequence model.
- **Anomaly Detection** — `anomalyTimeSeries` (90 days) flags 3 fixed days (`ANOMALY_DAYS =
  [23,47,71]`) as anomalies by construction, then computes a "z-score" style `score` that is
  itself just a seeded random number scaled to look like a threshold breach.
- **Performance Monitor** — `perfData90` (90-day MAE trend per model), `driftMetrics` (PSI/KS per
  feature), and a fixed 7-row `alerts` log — none derived from the other tabs' data.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `ALL_MODELS[i].mae/auc` | e.g. XGBoost MAE 0.0823, AUC 0.921 | Hard-coded literal per model row — plausible ML metric ranges, not a backtest |
| `attentionHeatmap` weights | `sr(vi×11+wi×7+3) × (diag?0.5:1)` | Synthetic self-attention matrix; diagonal down-weighted 0.5× to look plausible, no trained attention layer exists |
| `forecastAccuracy.mase/rmse/smape` | `0.82+sr()×0.35`, etc. | Synthetic per-variable "backtest" metrics |
| `driftMetrics.alert` threshold | PSI > 0.15 | Correct PSI alerting convention (>0.1 moderate, >0.25 major per industry practice) applied to a **synthetic** PSI value |
| `ANOMALY_DAYS` | `[23,47,71]` | Fixed, not detected — the "detector" labels these days true by definition then generates a score to match |
| Progress-bar increments | Forecast +7/80ms, Anomaly +8/75ms | UI pacing only, no computational meaning |

### 7.3 Calculation walkthrough

```js
// "Forecast" — linear extrapolation dressed as iTransformer output
CarbonPrice_{t+i} = last.CarbonPrice + (i+1)×1.2 + (sr(i·7+31) − 0.5) × 8
Temperature_{t+i} = last.Temperature + (i+1)×0.005 + (sr(i·17+41) − 0.5) × 0.08
```
This is deterministic linear drift + bounded noise, not a transformer forward pass. The 24-month
horizon slider changes array length only; no confidence-interval model backs `CarbonPriceLo/Hi`
(they are separately seeded linear bands, not derived from a predictive distribution).

```js
// "Anomaly" score — score is generated to match the pre-assigned label, not the reverse
score = isAnomaly ? 3.2 + sr(d·11)×1.5 : sr(d·7)×1.8   // anomalies always score 3.2–4.7, "normal" days 0–1.8
```
Because `isAnomaly` is set from the fixed `ANOMALY_DAYS` list *before* the score is computed, the
detector cannot actually miss an anomaly or raise a false positive — the causality is inverted
relative to a real detection pipeline (Isolation Forest / LSTM-autoencoder / z-score, as named in
the `ALGORITHMS` selector, none of which run).

### 7.4 Worked example

Selecting "Generate Forecast" with `horizon=24`, scenario "NGFS NZ2050", last historical point
`CarbonPrice=$102.40` (month 60): month 1 of the forecast computes
`102.40 + 1×1.2 + (sr(38)−0.5)×8`. With `sr(38) = frac(sin(39)×10⁴)`, `sin(39) ≈ 0.9633`,
`×10⁴ = 9632.5`, fractional part `≈0.5`, so the noise term ≈ 0 and `CarbonPrice_{t+1} ≈ $103.60`.
Every subsequent point repeats this drift+noise pattern — the resulting chart is a straight line
with jitter, not a scenario-conditioned macro forecast, even though the UI presents an "NGFS
NZ2050" scenario selector next to it (the selector has no wiring into the formula above).

### 7.5 Companion analytics on the page

- **Model Registry status counts** (Active/Training/Deprecated) are simple `.filter().length`
  tallies over the static array — accurate as a display of the array's own contents, not of any
  live training infrastructure.
- **Training job submission** produces a client-side-only `JOB-#####` id (`sr(++_jobSeq×31+7)`)
  and is discarded on page reload; no job is queued to a backend.
- **Alerts log** (7 rows) is a fixed illustrative list, not generated from `driftMetrics`, even
  though the PSI/severity language matches.

### 7.6 Data provenance & limitations

- Every numeric series on the page is either a hard-coded literal or the `sr(seed)=frac(sin(seed+1)×10⁴)`
  seeded PRNG; there is no backend ML service, feature store, or training pipeline behind any tab.
- The page is best understood as a **product mock / UX prototype** for an ML operations hub — the
  visual grammar (PSI, MASE, AUC, attention weights) is correct, but none of it is computed from
  real data or a real model.
- No SHAP values, no model versioning diff, no real train/serve split exist despite being named in
  the guide.

### 7.7 Framework alignment

The page references standard MLOps/ML concepts correctly by name — PSI/KS drift statistics, MASE/
RMSE/sMAPE forecast accuracy, Isolation Forest / LSTM-autoencoder / z-score anomaly detection,
SHAP attribution — but implements none of the underlying algorithms. See §8 for what a real
implementation would require.

## 8 · Model Specification — Predictive ESG/Climate Model Hub

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Provide (a) a governed model registry with real backtested performance, (b) genuine multivariate
climate/macro forecasting, and (c) statistically grounded anomaly and drift detection for ESG/
climate risk time series feeding downstream engines (PD models, physical-risk scores, disclosure
scoring). Scope: the 6 macro/climate variables and 8 ESG metrics already enumerated in
`CLIMATE_VARS`/`ESG_METRICS`, plus the model lifecycle (train → validate → serve → monitor → retire).

### 8.2 Conceptual approach
Mirror (1) **MLflow/SageMaker Model Registry** conventions for versioning, stage transitions, and
metric lineage, and (2) **industry time-series forecasting practice** for macro/climate variables —
gradient-boosted trees (XGBoost/LightGBM) for tabular ESG scoring (as MSCI and Moody's use for
controversy/rating prediction), and a proper sequence model (temporal fusion transformer /
iTransformer, as actually named in the UI) for multivariate forecasting with quantile output,
following the same population-level approach as **NGFS scenario-conditioned climate variable
paths**. Anomaly detection should use a real unsupervised detector (Isolation Forest or an
LSTM-autoencoder reconstruction error) with PSI/KS drift monitoring per **Evidently AI /
whylogs**-style production ML monitoring conventions.

### 8.3 Mathematical specification
```
Forecasting (quantile regression or probabilistic sequence model):
  ŷ_{t+h} = f_θ(y_{t-L:t}, x_{t-L:t}, scenario)         // L = lookback window, θ = trained weights
  Prediction interval: [ŷ_{t+h}^{q10}, ŷ_{t+h}^{q90}] from quantile loss heads, NOT ad-hoc bands

Anomaly detection (Isolation Forest path length):
  score(x) = 2^{−E[h(x)] / c(n)}                         // h = path length, c(n) = avg path length in BST of n points
  Anomaly if score(x) > threshold (typically 0.6–0.7)

Drift monitoring (Population Stability Index):
  PSI = Σ_i (Actual%_i − Expected%_i) × ln(Actual%_i / Expected%_i)
  PSI < 0.1 stable · 0.1–0.25 moderate shift · > 0.25 material shift → retrain trigger

Model registry metric (classification, e.g. controversy prediction):
  AUC = P(score(positive) > score(negative)) estimated via rank statistic on held-out set
```
| Parameter | Calibration source |
|---|---|
| Lookback window `L` | Cross-validated per variable; start at 36 months (3× seasonal cycle) |
| Isolation Forest `n_estimators`, contamination | scikit-learn defaults (100 trees, contamination auto) as starting grid |
| PSI thresholds (0.1/0.25) | Industry-standard credit-risk model monitoring convention (SR 11-7 aligned) |
| Retrain trigger | PSI > 0.25 on ≥1 top-10 feature, or held-out AUC drop > 5pts |
| Forecast quantiles | 10/50/90 minimum, aligned to P10/P50/P90 convention used elsewhere on the platform (e.g. PPA revenue module) |

### 8.4 Data requirements
Versioned feature store with point-in-time correctness (avoid leakage across the historical
window), a model artifact registry (MLflow-compatible), held-out labelled data for AUC/MAE
computation, and streaming feature statistics for PSI/KS computation. The platform's existing
`reference_data` tables (OWID CO2/energy, World Bank) could seed the macro/climate lookback
window; ESG controversy labels would need a licensed feed (RepRisk, Sustainalytics) not currently
in the platform.

### 8.5 Validation & benchmarking plan
Walk-forward backtesting (expanding window, no shuffling) for the forecaster with MASE/RMSE/sMAPE
reported per variable; precision/recall on a labelled anomaly set (even a small hand-curated one)
for the Isolation Forest; PSI/KS computed against a true held-out reference window rather than a
synthetic one; reconcile classification AUC against MSCI/Sustainalytics controversy-prediction
literature benchmarks (~0.75–0.85 AUC is realistic; treat the guide's 0.83 as a target, not a
result, until backtested).

### 8.6 Limitations & model risk
Small labelled anomaly sets make precision/recall estimates noisy — report confidence intervals;
climate/macro forecasts beyond 12 months carry wide, likely underestimated uncertainty absent a
true scenario-conditioned ensemble (NGFS-style); PSI/KS on ESG features with low signal-to-noise
(e.g. controversy indices) will generate frequent false drift alerts — apply a materiality floor
(e.g. require 2 consecutive periods above threshold) before triggering retraining.

## 9 · Future Evolution

### 9.1 Evolution A — First real model-serving vertical: forecaster + drift monitor (analytics ladder: rung 1 → 4)

**What.** §7 is unambiguous: this page is a UI mock of an MLOps dashboard — `ALL_MODELS` metrics are literals, "Generate Forecast" is a `setInterval` progress bar over linear drift + `sr()` noise, the anomaly "detector" scores days already labelled by `ANOMALY_DAYS = [23,47,71]`, and no backend exists. Evolution A implements the §8 spec's minimum honest slice: a backend that actually fits and serves two things — a walk-forward-validated forecaster for the 6 `CLIMATE_VARS` series, and a real Isolation Forest + PSI drift monitor.

**How.** Stage it: (1) `api/v1/routes/predictive_hub.py` with `POST /forecast` (statsmodels seasonal/quantile regression first — already in the environment per the roadmap; a sequence model only after the baseline is beaten on MASE), `POST /anomaly` (scikit-learn IsolationForest, real path-length scores), `GET /models` (registry read from a new `ml_model_registry` table where MAE/AUC are written by the backtest job, never hand-entered). (2) Seed lookback windows from the platform's `reference_data` tables (OWID CO2/energy, World Bank) per §8.4. (3) Delete the inverted-causality anomaly mock and the fake attention heatmap; the UI renders only served values.

**Prerequisites.** The §7 mock must be acknowledged in release notes (numbers will change because today's are fabricated); point-in-time-correct feature windows to avoid leakage. **Acceptance:** registry AUC/MAE reproduce from the backtest artifact; walk-forward MASE beats naive drift for at least 4 of 6 variables before any "ML" label appears in the UI.

### 9.2 Evolution B — Model-governance copilot (LLM tier 1, gated behind Evolution A)

**What.** Once real models exist, this hub is where a risk-governance user asks "why did `xgb_climate_risk` trigger a retrain?", "is this PSI alert material?", "summarize this model's card for the validation committee". The copilot answers from the registry rows, drift metrics, and per-model §8-convention model cards — SR 11-7-style narrative generation grounded in computed monitoring statistics.

**How.** Tier-1 RAG over the module's Atlas record plus the live `ml_model_registry` and drift tables (retrieved via the module's own `GET /models` and monitoring endpoints, injected as context, not tool-called — keeping the first slice cheap). System prompt enforces the platform's honest-nulls posture: before Evolution A ships, the copilot must not exist on this page at all — narrating a mock would institutionalize the fabrication §7 documents. Post-A, add tier-2 tool calls for "re-run drift check on feature X".

**Prerequisites (hard).** Evolution A complete and the §7.6 fabricated series removed — this is the strongest do-not-ship-B-first case in the atlas. **Acceptance:** every metric the copilot quotes matches a registry/monitoring row; asked about SHAP attributions (named in the guide, not yet computed), it states they are not available rather than inventing drivers.