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
