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
