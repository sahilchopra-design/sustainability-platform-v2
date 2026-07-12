## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (and the page's own header strap-line) promises
> *"Markowitz mean-variance optimization … quadratic programming with climate penalty term"* and
> *"500+ Pareto-optimal portfolios per run"*. **No optimiser exists in the code.** The three
> "optimised" portfolios are produced by *filtering the universe and renormalising the original
> random weights*; the efficient frontier chart is a parametric curve drawn from a formula, not
> solved from a covariance matrix. The guide's Climate-Adjusted Sharpe Ratio **is** genuinely
> implemented (`caSharp`, §7.2). The sections below document what the code actually does.

### 7.1 What the module computes

`ClimatePortfolioOptimizerPage.jsx` (919 lines) builds a 200-security synthetic universe and
compares three heuristic portfolios — Unconstrained, Carbon-Constrained, Net-Zero — under user
sliders (carbon budget 50–500 tCO₂e/$M, sector max 5–50%, ITR limit 1.5–3.0 °C, ESG min, liquidity
min). Universe generation (seeded PRNG `sr(s)=frac(sin(s+1)×10⁴)`):

```js
expectedReturn  = sr(i*3+2) *0.15 + 0.03      // 3–18 % p.a.
volatility      = sr(i*5+3) *0.25 + 0.08      // 8–33 %
carbonIntensity = sr(i*11+4)*800  + 10        // 10–810 tCO₂e/$M
temperature     = sr(i*17+5)*3    + 1.5       // ITR 1.5–4.5 °C
weight (raw)    = sr(i*19+6)*0.03 + 0.001     // → normalised to Σw = 1
sharpe          = (ret − 0.02) / vol
```

### 7.2 Portfolio construction rules & scoring formulas

| Portfolio | Rule (verbatim logic) |
|---|---|
| Unconstrained | filtered universe (ESG ≥ min, liquidity ≥ min, ITR ≤ limit+1.5, sector/search), weights renormalised |
| Carbon-Constrained | drop `CI > 1.5×budget`; renormalise; tilt `w ×= 1 − max(0,(CI−budget)/(2×budget))`; renormalise again |
| Net-Zero | keep only `temperature ≤ 2.0 && greenRevenue ≥ 0.2`; renormalise |

Portfolio statistics (`portfolioStats`):

```js
ret  = Σ w·E[r]                                  // weighted mean return
vol  = sqrt( Σ (w·σ)² )                          // ⚠ zero-correlation assumption — no covariance matrix
ci   = Σ w·CI ;  itr = Σ w·ITR                   // weighted-average intensity & temperature
sharpe  = (ret − 2%) / vol
caSharp = (ret − 2%) / (vol × (1 + ci/500))      // guide's CASR with λ = 1/500 (per tCO₂e/$M)
te      = sqrt(|vol² − bmkVol²|)                 // ⚠ not a true tracking error (no active-weight covariance)
```

The CASR penalty loading λ = 1/500 is an **unsourced demo constant** — at CI = 500 tCO₂e/$M the
denominator doubles. Pedersen et al. (2021), cited by the guide, motivates the *form* (risk-
adjusted return penalised by an ESG/climate term) but not this calibration.

Other synthetic layers: `FRONTIER` (50 points: `vol = 8%+t·22%`, `ret = 3%+t·14%±noise`,
`ci = 50+(1−t)·400` — carbon intensity falls as risk rises, a drawn illustration); NGFS scenario
multipliers (Orderly ×1.05 ret/×0.90 vol; Disorderly 0.92/1.15; Hot House 0.75/1.40; Net Zero
1.10/0.85 — stylised, not from the NGFS database); risk attribution seeded by **sector name
length** (`sr(s.sector.length*7+1)` — all sectors with equal-length names get identical splits);
Brinson-style attribution `alloc/sel = ±0.2` random draws.

### 7.3 Calculation walkthrough

Sliders → `filtered` universe → three rule-based portfolios → `portfolioStats` per portfolio →
KPI cards (return, vol, Sharpe, CI vs budget, ITR, TE, CA-Sharpe, holdings count). Constraint tab
computes utilisations: `ci/budget`, `itr/limit`, `max sector weight/sectorMax` and labels each
Slack/Binding at 100%. Scenario tab rescales the active portfolio: `sRet = ret×retMult`,
`sVol = vol×volMult`, `sSharpe = (sRet/100 − rf)/(sVol/100)`.

### 7.4 Worked example — CA-Sharpe under the carbon tilt

Suppose the Carbon-Constrained portfolio lands at `ret = 9.60%`, `vol = 14.0%`, `ci = 250`
(budget = 250):

| Step | Computation | Result |
|---|---|---|
| Sharpe | (0.096 − 0.02) / 0.14 | 0.543 |
| Carbon penalty | 1 + 250/500 | 1.50 |
| CA-Sharpe | 0.076 / (0.14 × 1.50) | **0.362** |
| Tilt on a CI=400 security | 1 − max(0,(400−250)/500) = 0.70 | weight cut 30% |
| Tilt on a CI=250 security | 1 − 0 | unchanged |
| Constraint status | 250/250 = 100% | Carbon Budget **Binding** |

Under "Hot House 3°C": sRet = 9.60×0.75 = 7.20%, sVol = 14.0×1.40 = 19.6%,
sSharpe = (0.072−0.02)/0.196 = **0.265**.

### 7.5 Data provenance & limitations

- **Entire universe, benchmark weights, frontier and attribution are synthetic** (`sr()` seeded).
  No real prices, no factor model, no covariance matrix.
- `vol = sqrt(Σ(wσ)²)` prices every pairwise correlation at zero — portfolio vol is materially
  understated vs any realistic equity correlation structure (~0.3 average pairwise correlation
  would roughly triple the variance for 200 names).
- Tracking error formula is a vol-difference identity, not `sqrt((w−w_b)ᵀΣ(w−w_b))`.
- Sector cap and liquidity constraints are displayed but never enforced in construction (only the
  utilisation is reported); "Binding" is a label, not a KKT condition.
- λ = 1/500, scenario multipliers, and the frontier shape are demo constants without provenance.

**Framework alignment:** Pedersen, Fitzgibbons & Pomorski (2021) *ESG-efficient frontier* — the
CASR functional form echoes their ESG-adjusted objective; Markowitz (1952) mean-variance — named
but not implemented; MSCI Climate VaR / Implied Temperature Rise — ITR here is a weighted average
of synthetic security temperatures, whereas MSCI derives ITR by converting a company's emissions
overshoot/undershoot of its carbon budget into a warming contribution; NGFS scenarios — used as
return/vol multipliers only; TCFD portfolio-alignment metrics (WACI = Σw·CI matches the TCFD
recommended weighted-average carbon intensity definition).

## 8 · Model Specification — Mean-Variance-Climate Optimiser

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Replace the filter-and-renormalise heuristic with a true constrained optimiser supporting
decarbonisation mandates (EU PAB/CTB-style), for equity portfolios of 100–5,000 names, run
on-demand and monthly for rebalancing.

### 8.2 Conceptual approach

Quadratic programme with linear climate constraints — the architecture of **MSCI BarraOne /
Barra Optimizer** tilted-index construction and **BlackRock Aladdin** portfolio construction with
Aladdin Climate metrics as constraint inputs; objective form follows Pedersen et al. (2021).
Covariance from a factor model (market + sector + region + carbon-beta factor per Görgen et al.
"Carbon Risk" BMG factor).

### 8.3 Mathematical specification

```
max_w   wᵀμ − (γ/2)·wᵀΣw − λ·wᵀc                     # c = carbon intensity vector
s.t.    1ᵀw = 1 ;  0 ≤ w ≤ w_max
        wᵀc ≤ (1−R)·w_bᵀc            # R = 30% (CTB) or 50% (PAB) reduction vs benchmark, EU 2020/1818
        wᵀθ ≤ θ*                     # portfolio ITR cap, θ per SBTi/CDP-WWF temperature rating method
        |Σ_{i∈s} w_i − Σ_{i∈s} w_b,i| ≤ 5%  ∀ sectors s      # active sector bounds
        (w−w_b)ᵀΣ(w−w_b) ≤ TE_max²   # tracking-error budget (e.g. 1–3%)
Σ = B F Bᵀ + D                        # factor covariance + specific variance
Frontier: solve over grid λ ∈ [0, λ_max] → true Pareto set (return, TE, carbon)
```

| Parameter | Calibration source |
|---|---|
| μ expected returns | equilibrium (Black-Litterman on market-cap prior) or factor-implied |
| B, F, D | 60-month returns regression; factors incl. BMG carbon factor (Görgen et al. 2020) |
| c carbon intensities | company Scope 1+2/EVIC per EU 2020/1818; CDP/issuer reports |
| θ ITR | MSCI ITR or CDP-WWF temperature rating methodology |
| R reduction | EU Climate Benchmark Regulation 2020/1818 (CTB 30% / PAB 50%, −7% p.a. trajectory) |
| γ risk aversion | calibrated so unconstrained solution ≈ benchmark vol |

### 8.4 Data requirements

Monthly total returns (vendor: MSCI/Refinitiv; free: Stooq/Yahoo for demo), Scope 1+2 emissions
and EVIC (CDP, company reports; free: OWID sector proxies already in platform `reference_data`),
ITR scores (MSCI/S&P vendor; approximable from SBTi target data already ingested), benchmark
constituents/weights. Solver: OSQP/quadprog (WASM build runs client-side for ≤1,000 names).

### 8.5 Validation & benchmarking plan

Reconcile optimised weights vs MSCI Climate Paris-Aligned index methodology on a common universe
(target: active-share vs PAB index < 10% at matched constraints); frontier convexity checks; TE
realised-vs-ex-ante backtest over 36 months; constraint-attribution report (shadow prices) for
every binding constraint — replacing the current Slack/Binding label with true duals.

### 8.6 Limitations & model risk

μ estimates dominate results (garbage-in) — default to minimum-TE tilted-index mode when return
forecasts are absent; carbon data lags 12–18 months (use trajectory extrapolation per PAB −7%
rule); ITR vendor dispersion is large (CDP vs MSCI can differ >0.5 °C) — disclose metric source;
zero-correlation fallback must never be used for risk reporting.
