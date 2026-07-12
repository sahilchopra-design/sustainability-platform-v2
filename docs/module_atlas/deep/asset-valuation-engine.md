## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry promises "5 NGFS scenarios across 8
> asset classes", a market-calibrated transition beta (`WACC_adj = WACC_base + β_transition ×
> RP_carbon` from credit-spread regression), an exponential stranded-asset half-life model, a
> physical-risk terminal-value damage function, and an IFRS 13 fair-value export tab. **None of
> these exist in code.** The page has exactly 4 tabs — DCF Calculator, Monte Carlo, Real Options,
> Comparable Transactions. The climate-risk premium is a *user slider* added to WACC (no beta
> calibration), carbon cost is a linear price interpolation, physical risk is a flat 0.5% of
> revenue, and there is no stranded write-down or NGFS scenario selector anywhere. Sections below
> document the code as it behaves.

### 7.1 What the module computes

A single-asset, climate-adjusted 10-year DCF (`calcDCF`), a seeded Monte Carlo distribution around
the DCF NPV, Black–Scholes real-option values (`bsCalc`), and a 30-deal synthetic M&A comps table.
Core DCF loop, quoted from code (values in $M):

```js
dr         = (wacc + climateRiskPremium) / 100
rev       *= 1.04                                                        // fixed 4% p.a. growth
cpInterp   = cp2030 + (cp2050 − cp2030) × (yr / projYears)               // linear carbon price path
carbonCost = rev × (emissionsIntensity / 1000) × cpInterp / 1000
physRisk   = rev × 0.005                                                 // flat 0.5% of revenue
adaptCost  = rev × 0.003 × (yr / projYears)                              // ramps 0 → 0.3%
ebitda     = rev × (opMargin/100) − carbonCost − physRisk − adaptCost
fcf        = (ebitda − max(0, ebitda × taxRate/100)) − rev × 0.05        // 5% of rev = capex proxy
tv         = (dr − tg) > 0.005 ? lastFCF × (1+tg) / (dr − tg) : lastFCF × 15
NPV        = Σ fcf_t /(1+dr)^t + tv /(1+dr)^projYears
```

The terminal value is a Gordon growth perpetuity with an explicit **50 bp minimum WACC−g spread
guard** (inline comment: "prevents implausibly large TV when WACC ≈ TG"); below that spread it
falls back to a 15× exit multiple on final-year FCF.

### 7.2 Parameterisation

| Parameter | Default | Provenance |
|---|---|---|
| Base revenue | $500M | synthetic demo value |
| WACC | 9.5% | user slider, synthetic default |
| Climate risk premium | 0.5% (50 bp) | user slider — added straight to WACC, **not** β-calibrated |
| Terminal growth | 2.0% | synthetic demo value |
| Op margin / tax rate | 35% / 25% | synthetic demo values |
| Carbon price 2030 / 2050 | $150 / $1,200 per tCO₂e | user sliders; defaults broadly NGFS Net-Zero-like but uncited in code |
| Emissions intensity | 80 tCO₂e/$M revenue | user slider, synthetic default |
| Revenue growth | 4% p.a. | hard-coded |
| Physical risk drag | 0.5% of revenue, flat | hard-coded, no hazard model |
| Capex proxy | 5% of revenue | hard-coded |
| MC shocks | revShock ∈ [0.85, 1.15], cpShock ∈ [0.6, 1.4] | hard-coded uniform ranges |
| Real-option "Defer" value | `call × 0.85` | hard-coded heuristic |

The Monte Carlo panel collects `revVol`, `cpVol` and `revCpCorr` inputs, but **none of the three is
used** in the shock formula — only `nSims` is. The simulated NPV is
`baseNPV × revShock × (1 − (cpShock − 1) × 0.15)`, i.e. a ±15% multiplicative revenue shock and a
carbon-price shock whose NPV pass-through is a fixed 15% sensitivity, drawn from the deterministic
seeded PRNG (`sr(i·7+1)`, `sr(i·13+2)`), then sorted for empirical percentiles (P5 reported as
"VaR 95").

### 7.3 Calculation walkthrough

1. **DCF tab** — sliders → `calcDCF` → cash-flow waterfall (revenue, carbonCost, physRisk,
   adaptCost, FCF, PV per year) + a 3×3 sensitivity grid over WACC ± 2 pp × terminal growth ± 1 pp
   (recomputing the full DCF per cell, with `max(0.1, tg)` floor).
2. **Monte Carlo tab** — button triggers `handleRunMC` (1.5 s simulated delay), producing mean,
   median, P5/P25/P50/P75/P95, probability-positive, and a 20-bin histogram.
3. **Real Options tab** — Black–Scholes via the Abramowitz–Stegun 5-term polynomial CDF
   approximation (constants 0.2316419, 0.3989423…): Expand = call, Abandon = put, Defer =
   0.85 × call; plus Greeks (Δ, Γ, vega, θ) and value-vs-underlying / value-vs-volatility curves.
4. **Comps tab** — 30 seeded deals (EV/EBITDA 8–28×, EV/Revenue 0.8–4.8×, premium 15–60%,
   2019–2024); sector filter + column sort; "median" is the upper-median element of the sorted
   array (`sorted[floor(n/2)]`).

### 7.4 Worked example — default inputs, Year 1 and terminal value

Defaults: rev₀ $500M, WACC 9.5% + CRP 0.5% → **dr = 10%**, g_T = 2%, margin 35%, tax 25%,
CP $150→$1,200, intensity 80, 10 years.

| Step (Year 1) | Computation | Result |
|---|---|---|
| Revenue | 500 × 1.04 | $520.0M |
| Carbon price | 150 + 1,050 × (1/10) | $255/t |
| Carbon cost | 520 × 0.08 × 0.255 | $10.61M |
| Physical risk | 520 × 0.005 | $2.60M |
| Adaptation | 520 × 0.003 × 0.1 | $0.16M |
| EBITDA | 520 × 0.35 − 13.36 | $168.64M |
| FCF | 168.64 × 0.75 − 26.0 | $100.48M |
| PV | 100.48 / 1.10 | **$91.3M** |

Year 10: rev = 500 × 1.04¹⁰ = $740.1M; carbon price $1,200/t → carbonCost $71.1M; FCF ≈ $99.5M.
Terminal value = 99.5 × 1.02 / (0.10 − 0.02) ≈ **$1,269M**; PV(TV) = 1,269 / 1.10¹⁰ ≈ **$489M**.
Note carbon cost grows ~6.7× over the projection while FCF stays roughly flat — the carbon-price
ramp almost exactly offsets the 4% revenue growth at these defaults.

### 7.5 Companion analytics

- **Sensitivity grid** — NPV over {WACC−2, WACC, WACC+2} × {g−1, g, g+1}; near-singular cells are
  caught by the 50 bp TV spread guard.
- **Comps stats** — median EV/EBITDA and median premium per sector filter; deal data is entirely
  synthetic (fictional targets, real PE-firm acquirer names).

### 7.6 Data provenance & limitations

- **All inputs and comps are synthetic**, seeded via `sr(seed) = frac(sin(seed+1)×10⁴)`. No market
  data, NGFS pathway files, or filings are read.
- The "climate-adjusted WACC" is user-asserted (slider), not derived from carbon beta; the guide's
  cross-sectional spread regression does not exist.
- Physical risk is a scalar revenue drag, not a hazard/damage function; terminal value receives no
  physical haircut (contrary to the guide's 5–25% claim).
- MC ignores its own volatility/correlation inputs (§7.2) and uses deterministic seeds — repeated
  runs give identical "simulations".
- Real-options Defer = 0.85 × call is a heuristic, not a compound/American option model; theta
  omits the dividend-yield term and normCDF is a ±7.5e-8 accuracy polynomial approximation.

### 7.7 Framework alignment

- **IFRS 13 (guide reference)** — not implemented; no fair-value-hierarchy (Level 1/2/3) tagging or
  disclosure export exists. The DCF itself is an income-approach (Level 3-style) technique
  consistent in spirit with IFRS 13 §B10 ff., but nothing is generated for disclosure.
- **NGFS Phase 5 (guide reference)** — no scenario set is consumed; the $150/$1,200 carbon-price
  defaults are of the same order as NGFS Net Zero 2050 trajectories (NGFS publishes shadow carbon
  prices rising to several hundred–>$1,000/t by 2050 in 1.5 °C scenarios) but are user sliders, not
  scenario data.
- **Black–Scholes (1973)** — correctly implemented European call/put with standard Greeks; real
  options for Expand/Abandon follow the classic Trigeorgis mapping (expansion = call on incremental
  value, abandonment = put at salvage strike).
- **Carbon Tracker-style stranded-asset analysis (guide reference)** — absent from code.
