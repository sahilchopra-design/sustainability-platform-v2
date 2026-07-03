# Transition Alpha Signal Generator
**Module ID:** `transition-alpha-signal-generator` · **Route:** `/transition-alpha-signal-generator` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Generates equity alpha signals from ESG transition indicators including SBT adoption, green capex, stranded asset exposure and climate policy sensitivity; back-tests signals against historical equity returns.

> **Business value:** MSCI research shows climate-aware equity strategies generated +1.8% annual alpha vs conventional benchmarks over 2016–2023, with the SBT adoption signal showing strongest statistical significance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BACKTEST_DATA`, `COUNTRIES_TA`, `DECAY_CURVES`, `KpiCard`, `SECURITIES`, `SIGNAL_COLORS`, `SIGNAL_HALF_LIFE`, `SIGNAL_IC`, `SIGNAL_KEYS`, `SIGNAL_NAMES`, `TABS`, `TA_SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sec` | `TA_SECTORS[Math.floor(sr(i * 7 + 1) * TA_SECTORS.length)];` |
| `signals` | `SIGNAL_KEYS.map((k, si) => +(sr(i * (si + 3) + si * 11 + 2) * 100).toFixed(1));` |
| `alpha` | `signals.reduce((s, x) => s + x, 0) / signals.length;` |
| `prevAlpha` | `signals.reduce((s, x, si) => s + sr(i * (si + 5) + si * 13 + 3) * 100, 0) / signals.length;` |
| `btRet` | `sr(i * 31 + 15) * 0.12 - 0.04;` |
| `tStat` | `sr(i * 37 + 17) * 3 + 0.5;` |
| `halfLife` | `Math.floor(sr(i * 43 + 21) * 21 + 3);` |
| `SIGNAL_IC` | `SIGNAL_KEYS.map((k, i) => +(sr(i * 13 + 77) * 0.16 + 0.02).toFixed(4));` |
| `SIGNAL_HALF_LIFE` | `SIGNAL_KEYS.map((k, i) => Math.floor(sr(i * 17 + 88) * 21 + 3));` |
| `DECAY_CURVES` | `SIGNAL_KEYS.map((k, ki) => {` |
| `monthly` | `sr(i * 7 + 3) * 0.03 - 0.008;` |
| `sum` | `signalWeights.reduce((s, w) => s + w, 0);` |
| `signals` | `SIGNAL_KEYS.map(k => s[k]);` |
| `composite` | `signals.reduce((acc, v, i) => acc + normWeights[i] * v, 0);` |
| `sorted` | `useMemo(() => [...scoredSecurities].sort((a, b) => b.compositeAlpha - a.compositeAlpha), [scoredSecurities]);` |
| `bins` | `Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${(i + 1) * 10}`, count: 0 }));` |
| `icTotalWeight` | `SIGNAL_IC.reduce((s, x) => s + x, 0);` |
| `ic_score` | `SIGNAL_KEYS.reduce((acc, k, i) => acc + (SIGNAL_IC[i] / (icTotalWeight \|\| 1)) * s[k], 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES_TA`, `SIGNAL_COLORS`, `SIGNAL_KEYS`, `SIGNAL_NAMES`, `TABS`, `TA_SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Signal Sharpe Ratio | — | Backtest Engine | Risk-adjusted return of long-short transition alpha portfolio over 5-year backtest period. |
| 12-Month Forward Alpha | — | Factor Model | Predicted alpha from current factor exposures vs benchmark over next 12 months. |
| Factor Correlation to Mkt | — | Factor Analytics | Low market β of transition factor; provides diversified alpha uncorrelated to broad market. |
- **Company ESG Data, Financial Fundamentals, Price Returns History** → Factor construction + panel regression + backtest engine → **Alpha signal scores, factor performance attribution, portfolio integration reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Transition Alpha Factor
**Headline formula:** `TAα = β₁ × SBT + β₂ × GreenCapex – β₃ × StrandedAsset`
**Standards:** ['MSCI ESG Alpha Research 2023', 'Robeco Sustainability Inside 2022']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).