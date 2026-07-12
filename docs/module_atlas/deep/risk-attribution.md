## 7 · Methodology Deep Dive

This module implements a genuine, if simplified, **linear multi-factor risk-attribution model** —
of the modules covered in this deep-dive batch, it is the one most faithful to its guide and least
reliant on seeded-PRNG fabrication. Company-level inputs (`esg_score`, `scope1_mt`, `scope2_mt`,
`revenue_usd_mn`, `market_cap_usd_mn`, `transition_risk_score`) come from the real
`GLOBAL_COMPANY_MASTER` dataset via `enrichFromMaster()`, not from `sr()` seeds.

### 7.1 What the module computes

Six factor **exposures** are derived per holding from real company fields, each normalised to
[-1, +1]:

```
ghgIntensity     = (scope1 + scope2) / revenue
esgExposure      = (esgScore - 50) / 50
carbonExposure   = clip(-(ghgIntensity - medianGHGIntensity) / medianGHGIntensity, -1, 1)
momentumExposure = esgScore>65 ? 0.2 : esgScore>50 ? 0 : -0.2 ; +0.15 if SBTi-committed
sizeExposure     = clip(-(log10(marketCap) - 4) / 2, -1, 1)
valueExposure    = clip((revenue/marketCap - 0.3) / 0.5, -1, 1)
qualityExposure  = clip((esgScore/100)*0.5 + (1 - transitionRisk/100)*0.5 - 0.5, -1, 1)
```
Portfolio-level factor **contribution to return**:
```
contrib_f = avgExposure_f * premium_f * weight_f * periodMult
totalFactorReturn = sum_f contrib_f
totalReturn = totalFactorReturn + residual + benchmark.totalReturn * periodMult
activeReturn = totalFactorReturn + residual
infoRatio = activeReturn / (benchmark.trackingError * sqrt(periodMult))
```

### 7.2 Parameterisation

| Factor | `defaultPremium` (annualised %) | Provenance |
|---|---|---|
| ESG Quality | +2.1 | Hard-coded assumption, directionally consistent with academic ESG-premium literature but not fitted from a regression |
| Carbon Transition | -3.4 | Hard-coded assumption (penalty for high carbon intensity) |
| ESG Momentum | +1.2 | Hard-coded assumption |
| Size | +0.8 | Hard-coded assumption; direction (small>large) matches the classical Fama-French size premium sign |
| Value | +1.5 | Hard-coded assumption |
| Quality | +1.0 | Hard-coded assumption |
| `residual` | `0.3 x periodMult` | **Fixed constant**, not a modelled idiosyncratic/specific-risk term — every portfolio gets the same residual regardless of composition |
| `BENCHMARKS` (4: MSCI ACWI, S&P 500, MSCI EM, Nifty 50) | sector weights, sector returns, total return, tracking error | Static illustrative benchmark table (plausible sector-weight/return figures) not sourced from a live index provider |
| `TIME_PERIODS` multiplier | 1M=1/12, 3M=3/12, 6M=6/12, YTD=0.25, 1Y=1 | Simple pro-rata annualisation, not a compounding calculation |

### 7.3 Calculation walkthrough

1. `enrichedRaw = holdings.map(enrichFromMaster)` merges each holding's ticker against
   `GLOBAL_COMPANY_MASTER` for real financial/ESG fields.
2. `medianGHGIntensity` is the portfolio median of `(scope1+scope2)/revenue` across holdings —
   used as the **carbon exposure z-anchor** so a holding's carbon score is relative to its own
   portfolio, not an absolute external benchmark.
3. `computeHoldingExposures` (§7.1) runs per holding, producing the 6 bounded exposures plus a
   `_dataQuality` flag (`assessDataQuality`) counting how many of 6 critical fields are populated.
4. Portfolio `avgExposures[fk]` = holding-weighted mean exposure per factor; `effectiveWeights` are
   user-adjustable sliders (default 1) multiplying `defaultPremium`; `activeFactors` toggles which
   of the 6 factors are included.
5. Sector allocation/selection effect (`allocation = (portW - benchW) * benchR / 100`) is a
   textbook **Brinson attribution allocation term** — genuinely correct methodology, using the
   selected `BENCHMARKS` entry's sector weights/returns.
6. `factorExplained = 55 + activeFactors.length * 3` (a heuristic, not an R-squared from a
   regression) — presented as "% of active risk explained by factors."

### 7.4 Worked example

Holding with `esg_score=72`, `scope1_mt=1.2Mt`, `scope2_mt=0.4Mt`, `revenue=$3,200M`,
`market_cap=$45,000M`, `transition_risk_score=35`, portfolio `medianGHGIntensity=0.35`:
```
ghgIntensity    = (1.2+0.4)/3,200 x 1000 = 0.50   (Mt->kt scaling implicit in source units)
esgExposure     = (72-50)/50 = 0.44
carbonExposure  = clip(-(0.50-0.35)/0.35) = clip(-0.43) = -0.43
sizeExposure    = clip(-(log10(45,000)-4)/2) = clip(-(4.65-4)/2) = -0.33   (large-cap -> negative)
qualityExposure = clip(0.72x0.5 + (1-0.35)x0.5 - 0.5) = clip(0.36+0.325-0.5) = 0.185
```
With `defaultPremium_esg=2.1%`, `weight=1`, `periodMult=1` (1Y): `contrib_esg = 0.44 x 2.1 x 1 x 1
= 0.924%`. Summed across all 6 active factors plus the fixed `residual=0.3%` and the selected
benchmark's `totalReturn x periodMult` gives `totalReturn`.

### 7.5 Data provenance & limitations

- Factor **exposures** are computed from real portfolio company data — a genuine strength versus
  most other modules in this batch.
- Factor **premia** (2.1%, -3.4%, 1.2%, 0.8%, 1.5%, 1.0%) are static assumptions, not estimated via
  cross-sectional regression of realised returns on exposures (the standard Barra/Axioma approach)
  — they do not update with market conditions or vary by period despite the `TIME_PERIODS`
  selector implying a time-varying analysis.
- `residual` is a flat constant unrelated to portfolio composition — a real specific-risk term
  would vary with idiosyncratic holding-level volatility and diversification.
- `BENCHMARKS` sector weights/returns are static, not live index data.

**Framework alignment:** MSCI Barra-style multi-factor risk model (exposures times premia gives
contribution — implemented structurally, but premia are assumptions not regression-estimated) ·
Brinson-Fachler sector allocation/selection attribution (correctly implemented for the sector tab)
· PRI Investor Reporting Framework (context only).

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

#### 8.1 Purpose & scope
Support portfolio managers and risk committees in decomposing active ESG/climate risk and return
into transparent, defensible factor contributions for client reporting and internal risk budgeting
across equity portfolios benchmarked to MSCI/S&P/regional indices.

#### 8.2 Conceptual approach
Replace the fixed factor premia with a **cross-sectional regression-estimated factor model**,
mirroring **MSCI Barra (USE4/GEMLT)** and **Axioma's ESG factor overlay**: each period, regress
realised stock returns on the same 6 style exposures (plus sector/country dummies) to estimate
time-varying factor returns, then decompose portfolio active return/risk using the fitted factor
covariance matrix — the industry-standard approach Goldman Marquee and BlackRock Aladdin use for
factor-based risk decomposition.

#### 8.3 Mathematical specification
```
r_i,t   = sum_f beta_i,f,t * f_f,t + eps_i,t         // cross-sectional regression, per period t
f_f,t   = (X_t' W_t X_t)^-1 X_t' W_t r_t             // WLS factor return estimation (X=exposures, W=cap weights)
Var(r_p)= b_p' Sigma_f b_p + sum_i w_i^2 sigma_eps_i^2   // factor risk + specific risk
b_p     = sum_i w_i beta_i,f                          // portfolio factor exposure vector
Sigma_f = factor covariance, estimated via EWMA (lambda ~ 0.97) over f_f,t history
```
| Parameter | Calibration source |
|---|---|
| `beta_i,f` (exposures) | Already computed in code from real company fundamentals — reusable |
| `f_f,t` (factor returns) | Estimated monthly via WLS cross-sectional regression on realised returns (needs a returns feed — not currently in platform) |
| `sigma_eps_i` (specific risk) | Regression residual std dev per stock, shrunk via Bayesian/Vasicek shrinkage toward sector mean |
| `Sigma_f` | EWMA or Newey-West covariance of estimated factor-return time series |

#### 8.4 Data requirements
- Monthly total-return time series per holding (not currently in the platform; would need a market
  data vendor feed — Bloomberg/Refinitiv/Polygon).
- Existing: `esg_score`, `scope1/2_mt`, `revenue_usd_mn`, `market_cap_usd_mn`,
  `transition_risk_score` from `GLOBAL_COMPANY_MASTER` (already wired).
- Sector/country classification for the regression control dummies (present in company master).

#### 8.5 Validation & benchmarking plan
Backtest factor-return time series against MSCI Barra's published ESG/Carbon factor returns where
overlapping constituents exist; validate specific-risk shrinkage via out-of-sample realised
volatility comparison; reconcile aggregate portfolio tracking error against the benchmark's
published tracking-error figure.

#### 8.6 Limitations & model risk
Cross-sectional regression requires a broad, liquid universe with return history — thin coverage
for small-cap/EM names risks unstable factor-return estimates; factor collinearity (ESG and
Quality exposures are likely correlated) requires orthogonalisation or ridge regression; regime
shifts (e.g. carbon-price shocks) can invalidate EWMA covariance stability, requiring a stress-
tested floor on factor volatility.
