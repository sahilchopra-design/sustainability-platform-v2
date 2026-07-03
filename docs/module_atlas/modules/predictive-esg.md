# Predictive ESG
**Module ID:** `predictive-esg` · **Route:** `/predictive-esg` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ML-driven ESG rating forecast and controversy early-warning system providing 12-month forward-looking ESG trajectories for companies.

> **Business value:** Provides asset managers with predictive ESG intelligence to anticipate rating changes, manage controversy risk, and improve portfolio quality proactively.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `Card`, `FEATURES`, `FEATURE_GROUPS`, `GROUP_COLORS`, `Label`, `ModelBadge`, `SECTORS`, `SectionTitle`, `TABS`, `TabModelPerformance`, `TabPathwayDivergence`, `TabPortfolio`, `TabPredictionStudio`, `TabSHAP`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `mean` | `(arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;` |
| `aug` | `A.map((row, i) => [...row.map(v => v), b[i]]);` |
| `factor` | `aug[row][col] / aug[col][col];` |
| `XtX` | `Xt.map(row => Xt.map((_, j) => row.reduce((sum, val, k) => sum + val * X[k][j], 0)));` |
| `Xty` | `Xt.map(row => row.reduce((sum, val, i) => sum + val * y[i], 0));` |
| `predictions` | `X.map(row => row.reduce((s, x, j) => s + x * beta[j], 0));` |
| `ssTot` | `y.reduce((s, v) => s + (v - yMean) ** 2, 0);` |
| `ssRes` | `y.reduce((s, v, i) => s + (v - predictions[i]) ** 2, 0);` |
| `contribs` | `FEATURES.map(f => {` |
| `norm` | `(vals[f.id] - f.min) / (f.max - f.min);` |
| `directed` | `f.direction === 1 ? norm : f.direction === -1 ? (1 - norm) : 0.5;` |
| `raw` | `contribs.reduce((s, v) => s + v, 0) / FEATURES.reduce((s, f) => s + f.shapW, 0);` |
| `base` | `clamp(raw * 100 * noise, 5, 97);` |
| `consensus` | `clamp(score + (sr(i * 13 + 99) - 0.5) * 16, 10, 95);` |
| `norm` | `(vals[f.id] - f.min) / (f.max - f.min);` |
| `directed` | `f.direction === 1 ? norm : f.direction === -1 ? (1 - norm) : 0.5;` |
| `maxPossible` | `fts.reduce((s, f) => s + f.shapW, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FEATURES`, `FEATURE_GROUPS`, `SECTORS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Forecast Accuracy (MAE) | — | Walk-Forward Validation | Mean absolute error of 12-month rating forecast on held-out validation set. |
| Controversy Alert Rate | — | RepRisk/NLP Pipeline | Share of coverage universe with elevated 30-day controversy signal triggering early warning. |
| Upgrade Probability (%) | — | Forecast Model | Model-estimated probability of ESG rating upgrade within 12-month horizon for median firm. |
- **ESG time-series + controversy text + analyst ratings** → Panel regression; NLP controversy scoring; forecast generation → **12-month rating forecasts + controversy early-warning alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** Rating Forecast
**Headline formula:** `R̂(t+12) = ΣβᵢXᵢ(t) + ε; trained on 5-year panel; L2 regularisation`
**Standards:** ['Bloomberg ESG Data', 'RepRisk Controversy Database']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).