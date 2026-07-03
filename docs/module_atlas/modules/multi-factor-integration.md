# Multi-Factor Integration
**Module ID:** `multi-factor-integration` · **Route:** `/multi-factor-integration` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Simultaneous integration of ESG quality, smart beta (value, momentum, low volatility, quality), and macroeconomic factors in portfolio construction and risk attribution. Uses Barra-style factor model frameworks to decompose portfolio active return and risk across ESG, style, sector, and macro dimensions. Enables ESG-tilted factor portfolios that control for unintended sector and style biases while preserving ESG signal integrity.

> **Business value:** Enables systematic equity managers to build ESG-integrated factor portfolios that capture proven risk premia while maintaining ESG quality standards, with full transparency into factor interaction effects and active risk sources.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_COMMODITY_SCORES`, `Btn`, `CIRCULAR_METRICS`, `COMMODITIES`, `COMMODITY_META`, `CORRELATION_MATRIX`, `CROSS_COMMODITY_CORR`, `DIMENSIONS`, `KPI`, `PROJECTION_YEARS`, `REGULATIONS`, `SCENARIOS`, `STAGES`, `STAKEHOLDERS`, `STAKEHOLDER_MONETIZATION`, `Sec`, `TRUE_COST_DATA`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `base` | `ci * 41 + 11;` |
| `ALL_COMMODITY_SCORES` | `COMMODITIES.map((name, ci) => {` |
| `preds` | `[1, 2, 3, 4, 5].map(s => decisionStump(features, dim, s * 10 + di));` |
| `data` | `allScored.map(c => [c.finAvg, c.esgAvg, c.climAvg]);` |
| `means` | `[0, 1, 2].map(j => data.reduce((s, r) => s + r[j], 0) / data.length);` |
| `centered` | `data.map(r => r.map((v, j) => v - means[j]));` |
| `cov` | `[0, 1, 2].map(i => [0, 1, 2].map(j => centered.reduce((s, r) => s + r[i] * r[j], 0) / (data.length - 1)));` |
| `eigenvalues` | `cov.map((row, i) => row[i]); // diagonal approximation` |
| `totalVar` | `eigenvalues.reduce((a, b) => a + b, 0);` |
| `explainedVar` | `eigenvalues.map(e => Math.round((e / totalVar) * 100));` |
| `projected` | `centered.map((r, i) => ({` |
| `tierNames` | `['Gold', 'Silver', 'Bronze', 'At-Risk', 'Critical'];` |
| `sorted` | `[...allScored].sort((a, b) => a.overall - b.overall);` |
| `chunkSize` | `Math.ceil(sorted.length / 5);` |
| `clustered` | `sorted.map((c, i) => ({` |
| `centroids` | `tierNames.map((tier, ti) => {` |
| `TRUE_COST_DATA` | `COMMODITIES.map((name, i) => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMMODITIES`, `CORRELATION_MATRIX`, `DIMENSIONS`, `PROJECTION_YEARS`, `REGULATIONS`, `SCENARIOS`, `STAGES`, `STAKEHOLDERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Factor IC (Information Coefficient) | — | Rolling 12-month backtest | Correlation between ESG signal and forward 12-month returns; positive IC validates ESG as a return factor |
| Active Factor Exposure (β vs. benchmark) | — | Barra factor model attribution | Active loading on each factor relative to benchmark; near-zero indicates unintended factor bets are neutralise |
| Factor Diversification Ratio | — | Portfolio construction analytics | Ratio of weighted average factor volatility to portfolio volatility; higher values indicate better factor dive |
| Tracking Error (%) | — | Ex-ante risk model | Expected annualised active return volatility relative to benchmark from multi-factor risk model |
- **ESG ratings and raw pillar scores** → Z-score by sector to remove sector bias; compute ESG alpha signal → **Sector-neutralised ESG factor signal per security**
- **Financial statement and price data** → Compute smart beta factor scores: B/P, momentum, low vol, profitability, investment → **Multi-factor alpha signal matrix for optimisation input**
- **Barra factor covariance matrix** → Decompose portfolio variance into factor and specific components; compute ex-ante TE → **Factor attribution: active return and risk decomposition by factor type**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-Factor Portfolio Optimisation
**Headline formula:** `max αᵀw − λ wᵀΣw subject to constraints`
**Standards:** ['MSCI Barra Global Equity Factor Model GEM3 Documentation', 'Fama & French Five-Factor Model 1993/2015', 'MSCI ESG Ratings Methodology 2023', 'Grinold & Kahn â€” Active Portfolio Management 2000']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).