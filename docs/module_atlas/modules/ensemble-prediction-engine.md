# Ensemble Prediction Engine
**Module ID:** `ensemble-prediction-engine` · **Route:** `/ensemble-prediction-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-CX2 · **Sprint:** CX

## 1 · Overview
XGBoost (0.4) + LightGBM (0.3) + Neural MLP (0.3) ensemble with 12-month forward prediction, backtest, and deployment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AB_TEST`, `BACKTEST`, `Badge`, `Card`, `ENSEMBLE`, `KPI`, `MODELS`, `PREDICTIONS`, `TABS`, `WEIGHT_GRID`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `BACKTEST` | `['2023-Q1','2023-Q2','2023-Q3','2023-Q4','2024-Q1','2024-Q2','2024-Q3','2024-Q4','2025-Q1','2025-Q2','2025-Q3','2025-Q4'].map((q,i) => ({` |
| `comparisonData` | `useMemo(() => ['RMSE','MAE','R-squared','AUC'].map(metric => {` |
| `delta` | `p.predicted - p.current;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BACKTEST`, `MODELS`, `TABS`, `WEIGHT_GRID`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Ensemble RMSE | — | Cross-validation | Root mean squared error |
| Best Single Model | — | Comparison | Ensemble outperforms best single model |

## 5 · Intermediate Transformation Logic
**Methodology:** Weighted ensemble prediction
**Headline formula:** `y_hat = 0.4×XGBoost + 0.3×LightGBM + 0.3×MLP`
**Standards:** ['Chen (2016)', 'Ke (2017)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).