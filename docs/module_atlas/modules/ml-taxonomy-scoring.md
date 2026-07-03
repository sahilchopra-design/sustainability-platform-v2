# ML Taxonomy Scoring Engine
**Module ID:** `ml-taxonomy-scoring` · **Route:** `/ml-taxonomy-scoring` · **Tier:** B (frontend-computed) · **EP code:** EP-CS4 · **Sprint:** CS

## 1 · Overview
XGBoost ML model using 316 taxonomy features for 12-month forward transition score prediction with SHAP explainability and conformal intervals.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CALIBRATION_DATA`, `Card`, `ENTITIES`, `FEATURE_COUNT`, `PREDICTIONS`, `SHAP_WATERFALL`, `TABS`, `TOP_FEATURES`, `TRAINING_EPOCHS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PREDICTIONS` | `ENTITIES.map((name, i) => ({` |
| `TOP_FEATURES` | `leaves.slice(0, 15).map((l, i) => ({` |
| `SHAP_WATERFALL` | `TOP_FEATURES.slice(0, 15).map((f, i) => ({` |
| `err` | `Math.abs(p.predicted - p.actual);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Features | — | Taxonomy leaves | One feature per L4 node |
| R² | — | Cross-validation | Model explanatory power |
| Coverage | — | Conformal | Prediction interval coverage rate |

## 5 · Intermediate Transformation Logic
**Methodology:** XGBoost ensemble with conformal prediction
**Headline formula:** `y_hat = XGBoost(features_316); CI = [y_hat - q_α, y_hat + q_α]`
**Standards:** ['SHAP (Lundberg 2017)', 'Conformal Prediction (Vovk 2005)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).