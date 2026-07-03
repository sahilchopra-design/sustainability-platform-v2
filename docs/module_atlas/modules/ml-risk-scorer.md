# ML Risk Scorer
**Module ID:** `ml-risk-scorer` · **Route:** `/ml-risk-scorer` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Machine learning-based ESG risk scoring engine that trains, evaluates, and deploys classification and regression models on structured ESG and financial data. Supports XGBoost, random forest, logistic regression, and neural network architectures with full feature importance, SHAP explainability, and model performance monitoring. Applies SR 11-7 and ECB model risk management guidance to document model governance requirements.

> **Business value:** Gives quantitative ESG researchers and risk managers a governed, explainable ML scoring capability that meets supervisory model risk standards while providing interpretable, SHAP-backed ESG risk assessments at portfolio scale.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDIT_LOG`, `Badge`, `DEFAULT_QUANTILES`, `FEATURES`, `MODEL_REGISTRY_DATA`, `QUANTILE_OPTIONS`, `REGIONS`, `SECTORS`, `Slider`, `TASKS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America','Europe','Asia-Pacific'];` |
| `raw` | `FEATURES.map((f, i) => ({ feature: f, value: sr(i * 17 + 3) }));` |
| `total` | `Math.max(1e-10, raw.reduce((a, b) => a + b.value, 0)); // floor prevents NaN if all feature importances are 0` |
| `actual` | `+(0.3 + sr(i * 19) * 0.6).toFixed(3);` |
| `p50` | `+(actual + (sr(i * 23 + 1) - 0.5) * 0.08).toFixed(3);` |
| `p25` | `+Math.max(0, p50 - 0.07 - sr(i * 7)  * 0.03).toFixed(3);` |
| `p75` | `+Math.min(1, p50 + 0.07 + sr(i * 11) * 0.03).toFixed(3);` |
| `p95` | `+Math.min(1, p50 + 0.15 + sr(i * 13) * 0.05).toFixed(3);` |
| `coverageRate` | `+(predictions.filter(p => p.covered).length / predictions.length * 100).toFixed(1);` |
| `calibrationData` | `useMemo(() => [5, 25, 50, 75, 95].map(q => ({` |
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
**Standards:** ['SR 11-7 Supervisory Guidance on Model Risk Management', 'ECB Guide on Internal Models 2019', 'SHAP Lundberg & Lee 2017', 'ISO/IEC 42001 AI Management System Standard 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).