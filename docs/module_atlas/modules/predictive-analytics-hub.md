# Predictive Analytics Hub
**Module ID:** `predictive-analytics-hub` · **Route:** `/predictive-analytics-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Machine learning-powered forward-looking ESG risk analytics hub integrating controversy prediction, rating forecasts, and climate scenario ML outputs.

> **Business value:** Elevates ESG analytics from backward-looking disclosure review to forward-looking AI-driven risk intelligence with explainable attribution.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALGORITHMS`, `ALL_MODELS`, `ANOMALY_DAYS`, `CLIMATE_VARS`, `ESG_METRICS`, `MODEL_COLORS`, `SCENARIOS`, `StatusBadge`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_jobSeq` | `0; // module-level counter — replaces non-deterministic Date.now() seed in job ID generator` |
| `ALGORITHMS` | `['Isolation Forest','LSTM Autoencoder','Statistical (z-score)'];` |
| `jobId` | ``JOB-${Math.floor(sr(++_jobSeq * 31 + 7) * 99999).toString().padStart(5, '0')}`;` |
| `histYears` | `60; // 2020–2024, monthly` |
| `last` | `historicalData[historicalData.length - 1];` |
| `attentionHeatmap` | `useMemo(() => CLIMATE_VARS.map((v, vi) => ({` |
| `forecastAccuracy` | `useMemo(() => CLIMATE_VARS.map((v, i) => ({` |
| `carbonAttentionData` | `useMemo(() => CLIMATE_VARS.map((v, i) => ({` |
| `isAnomaly` | `ANOMALY_DAYS.includes(d + 1);` |
| `base` | `65 + sr(d * 7 + 1) * 20;` |
| `value` | `isAnomaly ? base - 18 - sr(d * 13) * 8 : base;` |
| `anomalyLog` | `ANOMALY_DAYS.map((d, i) => ({` |
| `driftMetrics` | `useMemo(() => CLIMATE_VARS.slice(0, 6).map((v, i) => ({` |

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
**Standards:** ['MSCI ESG Controversy Research', 'XGBoost / LightGBM']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).