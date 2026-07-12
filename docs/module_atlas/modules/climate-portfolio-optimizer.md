# Climate Portfolio Optimizer
**Module ID:** `climate-portfolio-optimizer` · **Route:** `/climate-portfolio-optimizer` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Implements multi-objective portfolio optimisation balancing financial return, risk, and climate objectives including temperature alignment, carbon intensity, and green revenue exposure.

> **Business value:** Enables portfolio managers to construct climate-aligned portfolios that meet financial objectives while systematically reducing transition risk and increasing climate solution exposure.

**How an analyst works this module:**
- Define optimisation universe, constraints (sector limits, ESG floor, liquidity), and climate objectives
- Estimate expected returns using factor model; compute covariance matrix
- Solve mean-variance-climate optimisation using quadratic programming with climate penalty term
- Generate efficient frontier; report carbon intensity, temperature score, and green revenue at each solution

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BENCHMARK`, `COUNTRIES`, `FRONTIER`, `KpiCard`, `NGFS_SCENARIOS`, `NORMALIZED`, `SECTORS`, `SECURITIES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `NGFS_SCENARIOS` | 5 | `retMult`, `volMult`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sec` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `cty` | `COUNTRIES[Math.floor(sr(i * 13 + 1) * COUNTRIES.length)];` |
| `ret` | `sr(i * 3 + 2) * 0.15 + 0.03;` |
| `vol` | `sr(i * 5 + 3) * 0.25 + 0.08;` |
| `itr` | `sr(i * 17 + 5) * 3 + 1.5;` |
| `totalRawWeight` | `SECURITIES.reduce((s, x) => s + x.weight, 0);` |
| `NORMALIZED` | `SECURITIES.map(s => ({ ...s, weight: s.weight / totalRawWeight }));` |
| `bmkTotal` | `NORMALIZED.reduce((s, x) => s + sr(x.id * 53 + 20) * 0.01, 0);` |
| `BENCHMARK` | `NORMALIZED.map(s => ({ ...s, bmkWeight: (sr(s.id * 53 + 20) * 0.01) / bmkTotal }));` |
| `unconstrained` | `useMemo(() => { const total = filtered.reduce((s, x) => s + x.weight, 0);` |
| `total` | `eligible.reduce((s, x) => s + x.weight, 0);` |
| `renormed` | `eligible.map(s => ({ ...s, optWeight: total > 0 ? s.weight / total : 0 }));` |
| `tilted` | `renormed.map(s => ({` |
| `tTotal` | `tilted.reduce((s, x) => s + x.optWeight, 0);` |
| `caSharp` | `vol > 0 ? (ret - rfRate) / (vol * (1 + ci / 500)) : 0;` |
| `bmkVol` | `Math.sqrt(holdings.reduce((s, x) => s + Math.pow(x.bmkWeight * x.volatility, 2), 0));` |
| `stats` | `useMemo(() => ({ unc: portfolioStats(unconstrained, 'Unconstrained'), cc: portfolioStats(carbonConstrained, 'Carbon-Constrained'), nz: portfolioStats(netZero, 'Net-Zero'), }), [unconstrained, carbonConstrained, netZero, portfolioStats]);` |
| `activePortfolio` | `compareMode === 'Unconstrained' ? unconstrained : compareMode === 'Net-Zero' ? netZero : carbonConstrained;` |
| `activeStats` | `compareMode === 'Unconstrained' ? stats.unc : compareMode === 'Net-Zero' ? stats.nz : stats.cc;` |
| `constraintData` | `useMemo(() => { const carbonUtil = activeStats.ci / carbonBudget * 100;` |
| `itrUtil` | `activeStats.itr / itrConstraint * 100;` |
| `sectorUtilMax` | `Math.max(...sectorBreakdown.map(s => s.weight)) / sectorMax * 100;` |
| `riskAttribution` | `useMemo(() => { return sectorBreakdown.map(s => ({ sector: s.sector, systematic: +(s.weight * sr(s.sector.length * 7 + 1) * 0.6).toFixed(2), idiosyncratic: +(s.weight * sr(s.sector.length * 11 + 2) * 0.4).toFixed(2), factorExposure: +(sr(s.sector.length * 13 + 3) * 2 - 1).toFixed(3), }));` |
| `top20` | `useMemo(() => [...activePortfolio].sort((a, b) => b.optWeight - a.optWeight).slice(0, 20), [activePortfolio]);` |
| `sharpe` | `((activeStats.ret * sc.retMult / 100 - rfRate) / (activeStats.vol * sc.volMult / 100)).toFixed(3);` |
| `optW` | `sh.reduce((s, x) => s + x.optWeight, 0) * 100;` |
| `bmkW` | `sh.reduce((s, x) => s + x.bmkWeight, 0) * 100;` |
| `avgCI` | `sh.reduce((s, x) => s + x.carbonIntensity, 0) / n;` |
| `avgITR` | `sh.reduce((s, x) => s + x.temperature, 0) / n;` |
| `avgESG` | `sh.reduce((s, x) => s + x.esgScore, 0) / n;` |
| `avgRet` | `sh.reduce((s, x) => s + x.expectedReturn * 100, 0) / n;` |
| `avgVol` | `sh.reduce((s, x) => s + x.volatility * 100, 0) / n;` |
| `alloc` | `+(sr(i * 7 + 11) * 0.4 - 0.2).toFixed(3);` |
| `sel` | `+(sr(i * 11 + 13) * 0.4 - 0.2).toFixed(3);` |
| `interact` | `+(alloc * sel * 0.5).toFixed(3);` |
| `contrib` | `+(sec.weight / 100 * (total + 5)).toFixed(3);` |
| `sRet` | `activeStats.ret * sc.retMult;` |
| `sVol` | `activeStats.vol * sc.volMult;` |
| `sSharpe` | `((sRet / 100 - rfRate) / (sVol / 100)).toFixed(3);` |
| `itrChange` | `sc.retMult >= 1 ? -sr(i * 13 + 7) * 0.2 : sr(i * 13 + 7) * 0.3;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `NGFS_SCENARIOS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Efficient Frontier Solutions | — | Internal Solver | Number of Pareto-optimal portfolios generated per optimisation run across return, risk, and climate dimensions. |
| Carbon Intensity Reduction vs Benchmark | — | MSCI 2023 | Typical carbon intensity reduction achievable with <0.5% tracking error versus a standard equity benchmark. |
- **Return and risk factor data, carbon intensity and ITR scores, green revenue datasets** → Quadratic optimisation solver, climate penalty calibration, efficient frontier generation → **Optimal portfolio weights, carbon/temperature metrics, green revenue breakdown**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Sharpe Ratio
**Headline formula:** `CASR = (Rₚ – Rₑ) / (σₚ × (1 + λ×CIₚ))`

Penalises portfolio Sharpe ratio by a climate intensity loading factor λ and carbon intensity CIₚ to embed transition risk in optimisation objective.

**Standards:** ['Pedersen et al. 2021', 'MSCI Climate Value-at-Risk']
**Reference documents:** Pedersen, Fitzgibbons & Pomorski (2021) Responsible Investing: The ESG-Efficient Frontier; MSCI Climate Value-at-Risk Methodology 2022; FTSE Russell Smart Sustainability Index Series

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — An actual QP optimiser behind the existing UI (analytics ladder: rung 1 → 5)

**What.** §7 draws the line precisely: the Climate-Adjusted Sharpe Ratio
(`CASR = (Rₚ−Rₑ)/(σₚ×(1+λ·CIₚ))`) is genuinely implemented, but the promised
Markowitz optimiser is not — the three "optimised" portfolios are filter-and-
renormalise heuristics over 200 seeded securities, and the efficient frontier is a
parametric curve drawn from a formula, not solved from a covariance matrix.
Portfolio construction is a roadmap-designated rung-5 first mover, and this module's
UI (carbon budget, sector max, ITR limit, ESG floor, liquidity sliders) already
defines the constraint set. Evolution A ships the solver: mean-variance QP with a
linear climate-penalty term (the Pedersen et al. formulation §5 cites), long-only and
sector/name caps, solved server-side with scipy — the module's first backend route —
tracing a real frontier by sweeping the climate-penalty λ.

**How.** (1) `POST /api/v1/climate-portfolio/optimize` taking universe, constraints,
λ; factor-model covariance (a few observable factors beat a full 200×200 sample
estimate and are explainable). (2) The heuristic portfolios retained as labelled
baselines — showing the optimiser's improvement over them is the honest selling
chart. (3) Universe inputs upgraded where platform data allows (carbon intensities
and ITRs from holdings data rather than seeds); return/vol assumptions labelled as
assumptions with sensitivity display, per §8 model-card convention.

**Prerequisites (hard).** Solver correctness bench (a 3-asset fixture with an
analytic optimum); the seeded universe relabelled demo pending real holdings; the
"500+ Pareto portfolios" guide claim reconciled to the shipped sweep. **Acceptance:**
the QP solution weakly dominates all three heuristics on the stated objective;
binding constraints are reported per solve; the frontier is solver output, not a
drawn curve.

### 9.2 Evolution B — Mandate-translation analyst (LLM tier 2)

**What.** The genuinely hard step in climate optimisation is translating mandate
prose into constraints — "Article 9 fund, 50% WACI reduction vs benchmark, no
thermal-coal revenue >5%, tracking error under 3%" — and that is language work. The
analyst parses mandate text into the optimiser's constraint schema, runs the solve
as a tool call, and narrates the result: achieved WACI/ITR/green-revenue vs targets,
which constraints bound, what the climate penalty cost in Sharpe terms (the CASR the
module already computes).

**How.** Tool schema over the Evolution A endpoint; a constraint-schema validator
between parse and solve (the LLM proposes, the schema gatekeeps — malformed
constraints fail loudly); the no-fabrication validator on all weights and metrics;
"show work" includes the full constraint set so compliance can audit the
translation.

**Prerequisites (hard).** Evolution A first — there is nothing to call; and
mandate-parse accuracy needs a golden set (mandate text → expected constraints) per
the bench_llm pattern before anyone trusts it. **Acceptance:** a solved portfolio
regenerates identically from the logged constraint set; the analyst reports binding
constraints truthfully; an unsatisfiable mandate returns infeasibility with the
conflicting constraints named, never a silently relaxed answer.