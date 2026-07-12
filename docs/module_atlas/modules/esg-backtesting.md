# ESG Backtesting Engine
**Module ID:** `esg-backtesting` · **Route:** `/esg-backtesting` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Historical ESG factor backtesting for return attribution. Tests ESG tilt strategies, exclusion impact, and engagement alpha across 10-year historical windows.

> **Business value:** The "does ESG outperform?" question requires rigorous backtesting controlling for known risk factors. This engine enables evidence-based investment strategy design, testing whether ESG integration adds value in specific asset classes, markets, and time periods before implementing with client capital.

**How an analyst works this module:**
- Strategy Configurator sets ESG tilt, exclusion rules, and rebalancing
- Performance Dashboard shows cumulative returns vs benchmark
- Factor Attribution isolates ESG from market/size/value/quality
- Exclusion Impact shows cost/benefit of each exclusion category
- Risk Metrics shows Sharpe ratio, drawdown, volatility comparison

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `EsgBacktestingPage`, `FACTORS`, `FACTOR_CORR`, `FACTOR_MAP`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FACTORS` | 8 | `name`, `annualReturn`, `annualVol`, `autoCorrelation`, `color`, `description` |

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
| `winRate` | `portfolioReturns.filter(r => r > 0).length / periods * 100;` |
| `startYear` | `2026 - lookbackYears;` |
| `chartData` | `monthLabels.map((label, t) => {` |
| `window` | `portfolioReturns.slice(t - 12, t);` |
| `wMean` | `window.reduce((s, r) => s + r, 0) / 12;` |
| `wVar` | `window.reduce((s, r) => s + (r - wMean) ** 2, 0) / 11;` |
| `wVol` | `Math.sqrt(wVar) * Math.sqrt(12);` |
| `wRet` | `Math.pow(window.reduce((p, r) => p * (1 + r), 1), 1) - 1;` |
| `annRet` | `Math.pow(1 + wRet, 1) - 1; // already 12-month` |
| `rSharpe` | `wVol > 0 ? ((wMean - monthlyRf) * Math.sqrt(12)) / (Math.sqrt(wVar) * Math.sqrt(12)) : 0;` |
| `endIdx` | `Math.min((y + 1) * 12, periods);` |
| `pRet` | `cumulativePortfolio[endIdx] / cumulativePortfolio[startIdx] - 1;` |
| `bRet` | `cumulativeBenchmark[endIdx] / cumulativeBenchmark[startIdx] - 1;` |
| `factorPerformance` | `FACTORS.map(f => {` |
| `fAnnRet` | `Math.pow(cumul[periods], 12 / periods) - 1;` |
| `fMean` | `rets.reduce((s, r) => s + r, 0) / periods;` |
| `fVar` | `rets.reduce((s, r) => s + (r - fMean) ** 2, 0) / (periods - 1);` |
| `fVol` | `Math.sqrt(fVar) * Math.sqrt(12);` |
| `fSharpe` | `fVol > 0 ? (fAnnRet - rf) / fVol : 0;` |
| `mMean` | `mRets.reduce((s, r) => s + r, 0) / periods;` |
| `corrToMarket` | `(mVar2 > 0 && fVar2 > 0) ? cov / Math.sqrt(mVar2 * fVar2) : 0;` |
| `sensitivity` | `selectedFactors.map(fId => {` |

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

ESG factor construction: long top ESG quintile, short bottom quintile. FF5 + ESG regression extracts pure ESG alpha. Exclusion impact: benchmark vs screened index performance attribution. 10-year window covers full market cycle.

**Standards:** ['Fama-French 5-Factor', 'MSCI ESG Historical', 'Bloomberg']
**Reference documents:** Fama & French 5-Factor Model; MSCI ESG Historical Database; Friede, Busch & Bassen (2015) Meta-analysis of ESG returns

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This is one of the more quantitatively serious modules in the atlas: a **Monte-Carlo factor
backtesting engine** that simulates ESG-tilt factor returns as AR(1) processes driven by
Box-Muller-generated normals, then computes the full institutional performance-stat suite (annualised
return, volatility, Sharpe, tracking error, alpha, information ratio, win rate, max drawdown,
rolling metrics). The guide's framing (`Alpha_ESG = R_ESG_portfolio − R_benchmark; FF5 + ESG`) matches
the intent. The key honesty caveat: the "historical" returns are **simulated**, not real market data —
there is no MSCI ESG historical database wired despite the guide's reference. No ⚠️ mismatch flag, but
the simulated-vs-historical distinction is material (see §7.5).

### 7.1 What the module computes

Each of 7 factors is simulated as a monthly **AR(1)** process:

```js
monthlyReturn = annualReturn / 12
monthlyVol    = annualVol / √12
innovation    = boxMuller() × monthlyVol
ret_t         = monthlyReturn + autoCorrelation × prev + innovation      // prev = ret_{t−1} − mean
```

`boxMuller()` returns a standard normal via `√(−2 ln u₁)·cos(2π u₂)` with `u₁,u₂` from the platform
PRNG `sr(s)=frac(sin(s+1)×10⁴)` and a monotonically advancing seed (`_bmSeed++`), so the whole
simulation is deterministic. The portfolio is a weight-normalised sum of selected factor returns,
rebalanced monthly/quarterly/annually.

Performance statistics (all standard and correctly specified):

```js
annualizedReturn = finalPortfolio^(12/periods) − 1          // geometric
annualizedVol    = √(sampleVar) × √12                        // (periods−1) denominator
sharpeRatio      = (annualizedReturn − rf) / annualizedVol
trackingError    = √(var(activeReturns)) × √12
alpha            = annualizedReturn − annualizedBenchReturn
infoRatio        = alpha / trackingError
winRate          = #(portfolioReturns>0) / periods × 100
maxDrawdown      = min_t (cumV_t − peak_t)/peak_t
```

### 7.2 Parameterisation — factor assumptions

| Factor | Annual return | Annual vol | AR(1) ρ | Rationale (from code comments) |
|---|---|---|---|---|
| ESG Quality | +2.1% | 8% | 0.10 | long high-ESG / short low-ESG |
| Carbon Transition | −1.5% | 12% | 0.15 | carbon-pricing drag on high-emitters |
| ESG Momentum | +1.2% | 6% | 0.20 | improving-ESG names |
| Green Innovation | +3.5% | 18% | 0.05 | clean-tech / green-patent holders |
| Governance Quality | +1.0% | 5% | 0.10 | board/transparency/anti-corruption |
| Social Impact | +0.8% | 7% | 0.10 | labour/community |
| Market (benchmark) | +8.2% | 16% | 0.08 | MSCI ACWI proxy |

All are **synthetic calibration assumptions** — plausible magnitudes (ESG alpha 0.8–2.1% p.a. sits in
the guide's stated "−0.5% to +1.5%" band; market 8.2%/16% ≈ long-run global equity) but not fitted to
data. A 7×7 `FACTOR_CORR` matrix encodes intuitive correlations (ESG-Quality↔Governance +0.55,
Carbon-Transition↔Green-Innovation −0.40); **note** the factor return generator draws each factor's
innovation independently and does *not* actually apply `FACTOR_CORR` via Cholesky — the matrix is
displayed/documentary but not yet wired into the simulation (a real limitation, §7.5).

### 7.3 Calculation walkthrough

1. User picks factors, weights, lookback (years) and rebalance frequency.
2. `runBacktest` simulates `periods = lookbackYears×12` monthly returns per factor via AR(1)+Box-Muller.
3. Weights normalised (`/totalWeight`); portfolio return = Σ weight×factor return each month;
   drift-then-rebalance every `rebalPeriod` months.
4. Cumulative portfolio and benchmark series built; annualised return/vol/Sharpe/TE/alpha/IR
   computed; rolling 12-month Sharpe and annual return windows charted.
5. Per-factor performance (`factorPerformance`) computes each factor's standalone annualised return,
   vol, Sharpe and correlation-to-market; a sensitivity view perturbs selected-factor weights.

### 7.4 Worked example — single-factor ESG-Quality, 10 yr

`periods = 120`, factor ESG-Quality (`annualReturn=0.021`, `annualVol=0.08`, ρ=0.10):
`monthlyReturn = 0.021/12 = 0.00175`; `monthlyVol = 0.08/√12 = 0.0231`. A representative month with
`boxMuller()=0.4` and `prev=0.005`: `ret = 0.00175 + 0.10×0.005 + 0.4×0.0231 = 0.00175 + 0.0005 +
0.00924 = 0.0115` (1.15%). Over 120 months the geometric annualised return lands near the 2.1% target
(mean 0.00175/mo → ~2.1% p.a.), with `annualizedVol ≈ 8%`, so `Sharpe ≈ (0.021 − rf)/0.08`. If
`rf≈2%`, Sharpe ≈ 0.01/0.08 ≈ 0.13 — a realistically modest ESG-factor Sharpe. The exact numbers
depend on the deterministic `_bmSeed` draws but reproduce identically each run.

### 7.5 Data provenance & limitations

- **Returns are simulated, not historical.** Despite the guide's "MSCI ESG Historical / Bloomberg /
  10-year 2014–2024" references, no real return series is loaded — factor returns come from AR(1)
  processes seeded by `boxMuller()`/`sr()`. Results are illustrative of factor *behaviour*, not a true
  historical backtest.
- **Correlation matrix not applied.** `FACTOR_CORR` is defined and shown but the simulator draws each
  factor's innovation independently; cross-factor dependence in the sim is only the incidental overlap
  of shared market exposure, not the stated correlations. A production build must Cholesky-decompose
  `FACTOR_CORR` and drive correlated innovations.
- Rebalancing "drift" is reset to target each `rebalPeriod` but intra-period drift is not modelled
  (weights held constant between rebalances rather than drifting with returns).
- No transaction costs, no survivorship/look-ahead controls (moot for simulated data), single
  simulation path (no distribution of outcomes / confidence bands).

**Framework alignment:** **Fama-French 5-factor** — the guide frames ESG alpha as the FF5 intercept;
the module approximates this by treating "Market" as the benchmark and ESG factors as additive
long-short premia, computing `alpha = portfolio − benchmark annualised return` (a single-factor CAPM-
style alpha rather than a true FF5 regression residual). **Information Ratio** (`alpha/TE`) and
**Sharpe** are textbook-correct. The AR(1) return process with monthly-vol scaling by `1/√12` follows
standard financial-time-series convention.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** The module displays alpha/IR/Sharpe from a
*simulated* series and shows a correlation matrix it does not apply; a production backtest is specified.

**8.1 Purpose & scope.** Estimate the risk-adjusted alpha of ESG-tilt strategies over real history,
controlling for known risk factors, to decide whether ESG integration adds value before deploying
client capital across an equity universe.

**8.2 Conceptual approach.** Replace the simulator with a **historical factor-return backtest** plus a
**FF5+ESG panel regression**, mirroring MSCI Barra factor attribution and academic ESG-alpha studies
(Nagy et al. 2016; Friede et al. 2015). Correlated shocks for scenario analysis via Cholesky of the
empirical factor covariance.

**8.3 Mathematical specification.**
- Factor construction: monthly long-short ESG factor `F^{ESG}_t = r̄_{top quintile,t} −
  r̄_{bottom quintile,t}`, sector-neutralised.
- Attribution: `r^p_t = α + β_M MKT_t + β_S SMB_t + β_H HML_t + β_R RMW_t + β_C CMA_t + β_E F^{ESG}_t +
  ε_t`, estimated by rolling 36-month OLS; α×12 = annualised ESG alpha, with Newey-West t-stats.
- Correlated simulation (for stress paths): `z_t = L·ε_t`, `L L' = Σ` (empirical factor covariance),
  replacing the current independent draws.

| Parameter | Source |
|---|---|
| FF5 factor returns | Kenneth French Data Library (monthly) |
| ESG scores/quintiles | MSCI / Sustainalytics historical |
| Universe returns | CRSP / Bloomberg / Refinitiv |
| Risk-free rate | 1-month T-bill (French library) |
| Factor covariance Σ | estimated from realised factor returns |

**8.4 Data requirements.** Monthly total returns for the universe; point-in-time ESG scores (to avoid
look-ahead); FF5 factor series and risk-free; GICS for sector-neutralisation. None currently loaded.

**8.5 Validation & benchmarking plan.** Out-of-sample rolling alpha stability; sub-period analysis
(pre/post-COVID, rate cycle); reconcile α and factor βs against MSCI ESG research and published FF5
loadings; bootstrap confidence intervals on annualised alpha.

**8.6 Limitations & model risk.** ESG-score history is short and vendor-dependent (rating changes bias
backtests); regime dependence means a single α understates uncertainty; sector-neutralisation choices
materially move the ESG factor; transaction costs and turnover must be netted before claiming alpha.

## 9 · Future Evolution

### 9.1 Evolution A — Backtest on actual history instead of simulated factors (analytics ladder: rung 2 → 3)

**What.** The page's statistics engine is real and careful — Box-Muller innovations with per-factor autocorrelation, correct annualization, Sharpe/tracking-error/information-ratio, rolling 12-month windows, yearly attribution — but it is a *simulator*, not a backtester: the 8 factors' return/vol/autocorrelation parameters are authored constants, and every "historical" path is generated at render. The guide promises FF5 regression on historical ESG portfolios; no regression and no history exist. For a module whose stated purpose is settling "does ESG outperform?" with evidence, simulated evidence is the one inadmissible kind. Evolution A grounds it.

**How.** (1) Real factor history: the Fama-French 5-factor series is public (Ken French data library, monthly, decades deep) — ingest it; ESG factor portfolios constructed from the platform's rating data where history exists, or licensed/public ESG index returns as the first ESG leg. (2) `services/esg_backtest_engine.py`: the page's statistics move server-side onto stored monthly series; add the promised FF5+ESG regression (statsmodels OLS with HAC errors) so "ESG alpha" is a regression intercept with a t-stat, not a return difference. (3) Exclusion impact backtested against actual screened-index constituent histories where obtainable, else labeled unavailable. (4) Keep the simulator — relabeled honestly as a *scenario lab* for hypothetical factor assumptions — the AR(1) machinery is good pedagogy when not impersonating history. (5) Bench-pin the annualization and Sharpe arithmetic.

**Prerequisites.** FF data ingester; an honest decision on ESG-score history depth (without ≥5y of scores, long-window ESG portfolios can't be formed — disclose the constraint). **Acceptance:** a known FF factor's backtested Sharpe matches published values for the same window; the regression output reports coefficients, t-stats, and R²; simulator and backtest are visually and verbally distinct modes.

### 9.2 Evolution B — Strategy-research copilot with statistical honesty rails (LLM tier 2)

**What.** A tool-calling research assistant: "backtest a best-in-class ESG tilt with fossil exclusions over 2015–2025, attribute against FF5, and tell me if the alpha is significant." It configures and runs Evolution A's backtest endpoints, reports the regression table verbatim, and — the distinctive rail — enforces statistical honesty: insignificant alpha is reported as such, multiple-testing across many tried configurations is disclosed ("this is your 7th variant this session — treat significance accordingly"), and the Friede/Busch/Bassen mixed-evidence context from the module's own references frames conclusions.

**How.** Tools: `run_backtest(config)`, `run_attribution(portfolio, factors)`, `get_factor_history(factor, window)`, `list_prior_runs(session)`. Grounding corpus = this Atlas record's §5 methodology and the cited meta-analysis. Every statistic in an answer must match an engine output; the session's run count feeds the multiple-testing disclosure mechanically. Recommendation language is bounded: the copilot characterizes evidence, it does not advise allocation — the module's users are the strategists.

**Prerequisites (hard).** Evolution A — a research copilot narrating simulated paths as backtest evidence would manufacture exactly the false confidence the module exists to prevent. **Acceptance:** a golden config's reported alpha/t-stat matches the engine; an insignificant result is never described as outperformance; the multiple-testing disclosure appears from the second same-session run onward.