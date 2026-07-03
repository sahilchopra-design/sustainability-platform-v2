# ESG Backtesting Engine
**Module ID:** `esg-backtesting` · **Route:** `/esg-backtesting` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Historical ESG factor backtesting for return attribution. Tests ESG tilt strategies, exclusion impact, and engagement alpha across 10-year historical windows.

> **Business value:** The "does ESG outperform?" question requires rigorous backtesting controlling for known risk factors. This engine enables evidence-based investment strategy design, testing whether ESG integration adds value in specific asset classes, markets, and time periods before implementing with client capital.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `EsgBacktestingPage`, `FACTORS`, `FACTOR_CORR`, `FACTOR_MAP`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `monthlyReturn` | `factorConfig.annualReturn / 12;` |
| `monthlyVol` | `factorConfig.annualVol / Math.sqrt(12);` |
| `innovation` | `boxMuller() * monthlyVol;` |
| `ret` | `monthlyReturn + factorConfig.autoCorrelation * prev + innovation;` |
| `periods` | `lookbackYears * 12;` |
| `totalWeight` | `selectedFactors.reduce((s, fId) => s + (weights[fId] \|\| 0), 0) \|\| 1;` |
| `annualizedReturn` | `Math.pow(finalPortfolio, 12 / periods) - 1;` |
| `annualizedBenchReturn` | `Math.pow(finalBenchmark, 12 / periods) - 1;` |
| `meanRet` | `portfolioReturns.reduce((s, r) => s + r, 0) / periods;` |
| `variance` | `portfolioReturns.reduce((s, r) => s + (r - meanRet) ** 2, 0) / (periods - 1);` |
| `annualizedVol` | `Math.sqrt(variance) * Math.sqrt(12);` |
| `sharpeRatio` | `annualizedVol > 0 ? (annualizedReturn - rf) / annualizedVol : 0;` |
| `activeReturns` | `portfolioReturns.map((r, i) => r - benchmarkReturns[i]);` |
| `meanActive` | `activeReturns.reduce((s, r) => s + r, 0) / periods;` |
| `activeVariance` | `activeReturns.reduce((s, r) => s + (r - meanActive) ** 2, 0) / (periods - 1);` |
| `trackingError` | `Math.sqrt(activeVariance) * Math.sqrt(12);` |
| `alpha` | `annualizedReturn - annualizedBenchReturn;` |
| `infoRatio` | `trackingError > 0 ? alpha / trackingError : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FACTORS`, `FACTOR_CORR`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Backtest Window | — | Historical | Covers 2014-2024 including COVID, rate cycle |
| ESG Alpha (typical) | — | Sector-dependent | Mixed evidence; strongest in quality/risk-reduction channel |
| Exclusion Impact | — | Screened index | Fossil fuel exclusion: positive in transition, negative in commodity bull |
- **Historical ESG scores** → Portfolio construction → **ESG factor portfolio**
- **ESG portfolio returns** → FF5 regression → **Pure ESG alpha estimate**
- **Alpha estimates** → Significance testing → **Statistical evidence of ESG factor**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG factor backtesting
**Headline formula:** `Alpha_ESG = R_ESG_portfolio - R_benchmark; Attribution = FF5 + ESG_factor`
**Standards:** ['Fama-French 5-Factor', 'MSCI ESG Historical', 'Bloomberg']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).