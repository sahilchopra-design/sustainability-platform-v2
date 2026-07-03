# Quant Dashboard
**Module ID:** `quant-dashboard` · **Route:** `/quant-dashboard` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantitative ESG analytics hub providing factor exposures, alpha signal diagnostics, and ESG-integrated risk model outputs for systematic strategies.

> **Business value:** Provides quant investment teams with rigorous ESG factor analytics, integrating sustainability signals into systematic risk-return optimisation frameworks.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ChartTooltip`, `QuantDashboardPage`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `idx` | `(p / 100) * (s.length - 1);` |
| `totalValue` | `holdings.reduce((s, h) => s + (h.value_usd \|\| 0), 0) \|\| 1;` |
| `weights` | `holdings.map(h => (h.value_usd \|\| 0) / totalValue);` |
| `vols` | `holdings.map(h => {` |
| `drifts` | `holdings.map(h => {` |
| `cvar95` | `-mean(portReturns.slice(0, Math.max(1, Math.floor(iterations * 0.05))));` |
| `holdingVarContrib` | `holdings.map((h, j) => {` |
| `contrib` | `w * vols[j] * 1.645;  // parametric approximation` |
| `totalValue` | `holdings.reduce((s, h) => s + (h.value_usd \|\| 0), 0) \|\| 1;` |
| `weights` | `holdings.map(h => (h.value_usd \|\| 0) / totalValue);` |
| `esgAlpha` | `((c.esg_score \|\| 50) - 50) / 5000;` |
| `vol` | `0.04 + (c.sector === 'Energy' ? 0.015 : 0);` |
| `annRet` | `(Math.pow(cumValue, 12 / months) - 1);` |
| `annVol` | `stdev(monthlyReturns) * Math.sqrt(12);` |
| `sharpe` | `annVol > 0 ? (annRet - 0.04) / annVol : 0;` |
| `dsVol` | `downside.length > 0 ? stdev(downside) * Math.sqrt(12) : annVol;` |
| `totalValue` | `holdings.reduce((s, h) => s + (h.value_usd \|\| 0), 0) \|\| 1;` |
| `weights` | `holdings.map(h => (h.value_usd \|\| 0) / totalValue);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Factor Alpha (ann., %) | — | Factor Backtest | Annualised alpha of ESG quality factor over trailing 5-year backtest period. |
| Factor Sharpe Ratio | — | Factor Analytics | Risk-adjusted return of ESG factor portfolio over backtest horizon. |
| ESG β (Portfolio) | — | Risk Model | Portfolio loading on ESG factor in Barra-style multi-factor risk model. |
- **Holdings + ESG scores + factor returns + risk model data** → Factor exposure calculation; return attribution; alpha diagnostics → **Factor exposure report, attribution output, and ESG signal diagnostics**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Factor Return
**Headline formula:** `r_ESG = β_ESG × f_ESG + ε; f_ESG = long top-quintile – short bottom-quintile return`
**Standards:** ['Fama & French (1993)', 'MSCI Barra ESG Factor Model']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).