# Asset Valuation Engine
**Module ID:** `asset-valuation-engine` · **Route:** `/asset-valuation-engine` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate-adjusted DCF and NAV engine incorporating stranded asset write-downs, transition risk premiums in WACC, and physical risk-adjusted terminal values. Supports 5 NGFS scenarios across 8 asset classes and generates regulatory-grade IFRS 13 fair value disclosures. Integrates carbon price trajectories, energy transition capex, and stranded asset half-life models.

> **Business value:** Climate-adjusted valuation is increasingly required for IFRS 13 fair value disclosures as regulators expect material climate assumptions to be incorporated into goodwill impairment tests and investment property valuations. The engine provides auditable scenario-weighted NAVs that withstand scrutiny from external auditors and climate disclosure assurance providers.

**How an analyst works this module:**
- Select asset and NGFS scenario from configuration panel
- DCF Engine tab shows base vs climate-adjusted cash flow waterfall
- WACC Decomposition tab breaks down transition risk premium components
- Stranded Asset tab models write-down schedule with half-life decay
- Physical Risk tab adjusts terminal value for flood, heat, and storm damage
- IFRS 13 Export tab generates fair value hierarchy disclosures

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACQUIRERS`, `COMPS_DATA`, `COMP_NAMES`, `SECTORS`, `SECTOR_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `call` | `S * normCDF(d1) - K * Math.exp(-r * Tm) * normCDF(d2);` |
| `put` | `K * Math.exp(-r * Tm) * normCDF(-d2) - S * normCDF(-d1);` |
| `gamma` | `Math.exp(-d1 * d1 / 2) / (S * sigma * Math.sqrt(Tm) * Math.sqrt(2 * Math.PI));` |
| `vega` | `S * Math.exp(-d1 * d1 / 2) * Math.sqrt(Tm) / Math.sqrt(2 * Math.PI);` |
| `theta` | `-(S * Math.exp(-d1 * d1 / 2) * sigma) / (2 * Math.sqrt(Tm)) - r * K * Math.exp(-r * Tm) * normCDF(d2);` |
| `cpInterp` | `inputs.carbonPrice2030 + (inputs.carbonPrice2050 - inputs.carbonPrice2030) * (yr / inputs.projYears);` |
| `carbonCost` | `rev * (inputs.emissionsIntensity / 1000) * cpInterp / 1000;` |
| `adaptCost` | `rev * 0.003 * (yr / inputs.projYears);` |
| `ebitda` | `rev * (inputs.opMargin / 100) - carbonCost - physRisk - adaptCost;` |
| `tax` | `Math.max(0, ebitda * inputs.taxRate / 100);` |
| `fcf` | `(ebitda - tax) - rev * 0.05;` |
| `lastFCF` | `cashFlows[cashFlows.length - 1].fcf;` |
| `pvTV` | `tv / Math.pow(1 + dr, inputs.projYears);` |
| `sectorIdx` | `Math.floor(sr(i * 3 + 1) * SECTORS.length);` |
| `dcfResult` | `useMemo(() => calcDCF(dcfInputs), [dcfInputs]);  const sensitivityGrid = useMemo(() => { const waccVals = [dcfInputs.wacc - 2, dcfInputs.wacc, dcfInputs.wacc + 2];` |
| `tgVals` | `[dcfInputs.terminalGrowth - 1, dcfInputs.terminalGrowth, dcfInputs.terminalGrowth + 1];` |
| `revVolFrac` | `mcInputs.revVol / 100;` |
| `cpVolFrac` | `mcInputs.cpVol / 100;` |
| `rho` | `Math.max(-1, Math.min(1, mcInputs.revCpCorr));` |
| `zIndep` | `Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4);` |
| `revShock` | `1 + z1 * revVolFrac;` |
| `cpShock` | `1 + z2 * cpVolFrac;` |
| `pct` | `(p) => results[Math.max(0, Math.min(results.length - 1, Math.floor(p * nSims)))];` |
| `mean` | `results.reduce((a, b) => a + b, 0) / nSims;` |
| `pPos` | `results.filter(v => v > 0).length / nSims * 100;` |
| `minV` | `results[0], maxV = results[results.length - 1];` |
| `binW` | `maxV !== minV ? (maxV - minV) / 20 : (Math.abs(maxV) * 0.01 \|\| 1);` |
| `optionValue` | `roInputs.optionType === 'Expand' ? bs.call : roInputs.optionType === 'Abandon' ? bs.put : bs.call * 0.85;` |
| `vol` | `0.10 + i * 0.05;` |
| `sorted1` | `[...data].sort((a, b) => a.evEbitda - b.evEbitda);` |
| `sorted2` | `[...data].sort((a, b) => a.premium - b.premium);` |
| `medEV` | `sorted1[Math.floor(sorted1.length / 2)]?.evEbitda \|\| 0;` |
| `medPrem` | `sorted2[Math.floor(sorted2.length / 2)]?.premium \|\| 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACQUIRERS`, `COMP_NAMES`, `SECTORS`, `SECTOR_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate-Adjusted NAV | `Σ(FCF_t / (1+WACC_adj)^t) – Stranded` | DCF model | Net asset value after applying transition risk premium and stranded write-downs |
| Transition Risk Premium | `β_transition × RP_carbon` | Market calibration | Additional WACC component reflecting carbon price and policy risk exposure |
| Physical Risk Terminal Value Haircut | `Scenario damage function` | NGFS/IPCC | Reduction in terminal value due to chronic and acute physical climate risk |
- **NGFS carbon price and macro scenario data** → Overlay carbon cost trajectories on company FCF projections; adjust WACC by carbon beta → **Climate-adjusted NAV per asset under 5 scenarios with sensitivity ranges**
- **Physical hazard models (IPCC/RMS)** → Apply damage functions to terminal value by asset location and hazard type → **Physical risk terminal value haircuts and scenario-weighted expected NAV**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-adjusted DCF with transition risk WACC
**Headline formula:** `NAV_climate = Σ_t[FCF_t / (1+WACC_adj)^t] – StrandedWriteDown; WACC_adj = WACC_base + β_transition × RP_carbon`

Transition risk premium (RP_carbon) is calibrated from market-implied carbon beta (β_transition) using cross-sectional regression of credit spreads on carbon intensity. Physical risk adjusts terminal value via scenario-specific damage function. Stranded write-down follows exponential decay with sector half-life.

**Standards:** ['NGFS Phase 5', 'IFRS 13 Fair Value', 'IASB Climate Commitments']
**Reference documents:** NGFS Phase 5 Climate Scenarios (2024); IFRS 13 Fair Value Measurement; IASB Educational Material on Climate (2020); Carbon Tracker Initiative Valuation Reports

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Deliver the promised climate-DCF mechanics honestly (analytics ladder: rung 2 → 3)

**What.** The page has real machinery — a working 10-year DCF with carbon-cost interpolation, a TV spread guard, a 3×3 sensitivity grid, correct Black–Scholes with Greeks — but §7's mismatch flag lists what the guide over-claims: no NGFS scenario selector, the "climate risk premium" is a raw slider (no β calibration), physical risk is a flat 0.5% of revenue, no stranded write-down, no IFRS 13 export, and the Monte Carlo panel **ignores its own `revVol`/`cpVol`/`revCpCorr` inputs** while presenting deterministic seeded draws as simulation. Evolution A wires the inputs it already collects and grounds the climate parameters.

**How.** (1) Fix the MC first — a defect, not a feature gap: use the collected vol/correlation inputs in the shock generation (the Box–Muller `zIndep` code path already exists) and replace the fixed 15% carbon-price pass-through with the DCF's actual carbon sensitivity, recomputed per draw. (2) Replace the carbon-price sliders' defaults with selectable NGFS Phase-5 trajectories from the platform's ingested scenario data, keeping sliders as overrides. (3) Physical risk drag replaced by an EAL-based haircut from the E104 physical-risk-pricing engine for a located asset (country + coordinates), applied to both cash flows and terminal value. (4) Calibrate the transition premium: cross-sectional regression of spread on carbon intensity over the platform's market-data seed, published with fit statistics — or, if data is insufficient, keep the slider and label it user-asserted (the current honest state).

**Prerequisites.** NGFS trajectory data accessible to the frontend or a new backend valuation route; E104 integration; comps stay clearly labelled synthetic until real transaction data exists. **Acceptance:** MC percentiles respond to the vol inputs; two identical firms in Rotterdam vs Zurich produce different physical-risk drags; a bench case pins the §7.4 worked example (Year-1 FCF $100.48M, PV(TV) ≈ $489M) against regressions.

### 9.2 Evolution B — Valuation copilot with slider-driving what-ifs (LLM tier 2)

**What.** A copilot that narrates the DCF waterfall from live page state — "carbon cost grows 6.7× over the projection and almost exactly offsets your 4% revenue growth" is §7.4's genuine analytical insight, computable from the cash-flow table — and executes what-ifs by setting the model's actual inputs ("price this under $250/t by 2030", "show me NPV at 12% WACC") rather than estimating results. Once Evolution A lands a backend route, these become tool calls; before that, a tier-1 explanation-only slice runs on the already-computed waterfall.

**How.** Tool schema over a new `POST /api/v1/asset-valuation/dcf` (extracting `calcDCF` server-side — it is pure and small), plus MC and real-options equivalents. Grounding corpus: this Atlas record — §7.2's parameter table with provenance labels lets the copilot answer "is this WACC calibrated?" truthfully ("no — user slider, synthetic default"), and §7.6's limitations are mandatory caveats (Defer = 0.85×call heuristic; comps are fictional targets with real acquirer names, never citable as market evidence). The no-fabrication validator checks every NPV/percentile against tool output.

**Prerequisites.** The backend extraction (small, pure functions); Evolution A's MC fix before the copilot may describe MC output as a distribution. **Acceptance:** every figure in an answer traces to a tool response; asked for comparable-transaction evidence, the copilot discloses the comps are synthetic; what-if answers restate the exact parameter set used.