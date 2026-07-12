# Climate Claims Forecasting
**Module ID:** `climate-claims-forecasting` · **Route:** `/climate-claims-forecasting` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Actuarial engine for climate-adjusted insurance claims forecasting. Projects loss ratios, claims frequency, and severity trends under physical climate scenarios for property, agricultural, and liability lines using CAT model integration and climate scenario overlays.

> **Business value:** Climate-adjusted expected loss = baseline E[Loss] × ClimateMultiplier(t, RCP). Multiplier compounds at 1–3%/yr depending on peril and scenario. Flood and wildfire show highest multiplier acceleration under RCP8.5.

**How an analyst works this module:**
- Select insurance line: property, agriculture, or liability
- Peril Selection tab activates hazard-specific climate multipliers
- Frequency Model projects event counts under selected RCP
- Severity Model projects cost per event with demand surge
- Loss Ratio Dashboard shows combined ratio trend to 2050

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `LOSS_DISTRIBUTIONS`, `NGFS_SCENARIOS`, `PERILS`, `PML_RETURN_PERIODS`, `REGIONS`, `REGION_PERIL_COMBOS`, `SCEN_COLORS`, `SCEN_FREQ_MULTS`, `SCEN_SEV_MULTS`, `TIME_POINTS`, `TabBtn`, `TrendArrow`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PERILS` | `['Hurricane/Typhoon','Flood','Wildfire','Earthquake','Hail','Drought','Extreme Heat','Freeze/Ice Storm','Subsidence','Tsunami'];` |
| `REGIONS` | `['North America','Europe','Asia-Pacific','Latin America','Middle East','Africa','Oceania','South Asia','East Asia','Southeast Asia','Caribbean','Scandinavia','Mediterranean','Central Africa','Australasia'];` |
| `seed` | `ri * 100 + pi * 7;` |
| `baseFreq` | `+(sr(seed + 1) * 0.08 + 0.01).toFixed(4);` |
| `baseSev` | `+(sr(seed + 2) * 900 + 50).toFixed(0);` |
| `clFreqTrend` | `+(sr(seed + 3) * 0.05 + 0.005).toFixed(4);` |
| `clSevTrend` | `+(sr(seed + 4) * 0.04 + 0.005).toFixed(4);` |
| `catProb` | `+(sr(seed + 5) * 0.6 + 0.05).toFixed(3);` |
| `socInfl` | `+(sr(seed + 6) * 0.04 + 0.01).toFixed(3);` |
| `demSurge` | `+(catProb > 0.3 ? sr(seed + 7) * 0.05 + 0.10 : sr(seed + 7) * 0.05).toFixed(3);` |
| `insGap` | `+(sr(seed + 8) * 60 + 10).toFixed(1);` |
| `emergRisk` | `+(sr(seed + 9) * 0.8).toFixed(3);` |
| `reinsThreshold` | `+(baseSev * (sr(seed + 10) * 3 + 5)).toFixed(0);` |
| `pml100` | `+(baseSev * (sr(seed + 11) * 8 + 4) * baseFreq * 100).toFixed(0);` |
| `pml250` | `+(pml100 * (1 + sr(seed + 12) * 0.6 + 0.3)).toFixed(0);` |
| `inflLoad` | `+(sr(seed + 13) * 0.03 + 0.02).toFixed(3);` |
| `lossDistIdx` | `Math.floor(sr(seed + 14) * 4);` |
| `annualHistory` | `Array.from({ length: 5 }, (_, y) => +(baseSev * baseFreq * (0.8 + sr(seed + 15 + y) * 0.4)).toFixed(0));` |
| `histMean` | `annualHistory.reduce((a, b) => a + b, 0) / 5;` |
| `histStdev` | `Math.sqrt(annualHistory.reduce((s, v) => s + Math.pow(v - histMean, 2), 0) / 5);` |
| `freqMult` | `Math.pow(1 + rp.climateFreqTrend * SCEN_FREQ_MULTS[si], ti);` |
| `sevMult` | `Math.pow(1 + rp.climateSeverityTrend * SCEN_SEV_MULTS[si], ti);` |
| `expMult` | `Math.pow(1 + rp.exposureGrowth, ti);` |
| `base` | `rp.baseClaimsFreq * rp.baseSeverityK;` |
| `proj` | `base * freqMult * sevMult * expMult;` |
| `ceded` | `gross > rp.reinsuranceTrigger ? (gross - rp.reinsuranceTrigger) * 0.7 : 0;` |
| `totalClaims2050` | `filtered.reduce((s, r) => s + calcProjectedClaims(r, scenIdx, 5), 0);` |
| `avgFreqTrend` | `filtered.reduce((s, r) => s + r.climateFreqTrend, 0) / filtered.length;` |
| `avgSevTrend` | `filtered.reduce((s, r) => s + r.climateSeverityTrend, 0) / filtered.length;` |
| `totalPML100` | `filtered.reduce((s, r) => s + r.pml100, 0);` |
| `forecastData` | `useMemo(() => TIME_POINTS.map((yr, ti) => {` |
| `perilGroupData` | `useMemo(() => PERILS.map((peril, pi) => {` |
| `regionData` | `useMemo(() => REGIONS.map((region, ri) => {` |
| `freqSevScatter` | `useMemo(() => filtered.map(r => ({` |
| `emergingHeatmap` | `useMemo(() => { return REGIONS.slice(0, 8).map(region => { const row = { region: region.slice(0, 12) };` |
| `pmlData` | `useMemo(() => PERILS.map((peril, pi) => {` |
| `decompData` | `useMemo(() => TIME_POINTS.map((yr, ti) => {` |
| `freqEffect` | `base * (Math.pow(1 + drillRp.climateFreqTrend * SCEN_FREQ_MULTS[scenIdx], ti) - 1);` |
| `sevEffect` | `base * (Math.pow(1 + drillRp.climateSeverityTrend * SCEN_SEV_MULTS[scenIdx], ti) - 1);` |
| `expEffect` | `base * (Math.pow(1 + drillRp.exposureGrowth, ti) - 1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LOSS_DISTRIBUTIONS`, `NGFS_SCENARIOS`, `PERILS`, `PML_RETURN_PERIODS`, `REGIONS`, `SCEN_COLORS`, `SCEN_FREQ_MULTS`, `SCEN_SEV_MULTS`, `TABS`, `TIME_POINTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Frequency Multiplier | `IPCC AR6 hazard change factors` | IPCC AR6 Atlas | Multiplication factor applied to baseline claims frequency under climate scenario |
| Severity Trend | `Historical regression + climate overlay` | Munich Re NatCat | Annual severity increase rate combining economic growth and climate intensification |
| Combined Loss Ratio | `(Claims + Expenses) / Premium` | Actuarial model | Insurance loss ratio; above 100% indicates underwriting loss |
| CAT Loss Load | `Excess losses above attritional baseline` | CAT model | Catastrophe loss component of total projected claims |
- **NatCat historical database** → 20-yr loss data → baseline frequency/severity → **Attritional and CAT base rates**
- **IPCC AR6 Atlas** → Hazard intensity changes → climate multiplier → **Climate-adjusted projected losses**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-adjusted claims frequency × severity model
**Headline formula:** `E[Loss](t) = Σ_{perils} FreqBase(t) × SevBase(t) × ClimateMultiplier(t,RCP); ClimateMultiplier(t,RCP) = 1 + γ(RCP) × (t–t₀)`

Baseline claims frequency and severity derived from 20-year historical NatCat loss data by peril and region. Climate multiplier applied linearly with rate parameter γ calibrated to IPCC AR6 projected hazard intensity changes by RCP. Attritional loss trends separated from CAT loss trends. Demand surge modelled as post-event severity uplift (15–35% for major events).

**Standards:** ['IPCC AR6 Extremes Atlas', "Lloyd's Market Association Climate Change Scenarios", 'Munich Re NatCatSERVICE', 'ACTUARIES Climate Risk Guidance']
**Reference documents:** IPCC AR6 Interactive Atlas Hazard Projections; Lloyd's Climate Change Scenarios Report 2023; Munich Re NatCatSERVICE Database; Institute and Faculty of Actuaries Climate Risk Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an RCP-based *linear* climate multiplier
> (`ClimateMultiplier(t,RCP) = 1 + γ(RCP)×(t−t₀)`, γ calibrated to IPCC AR6 hazard changes),
> baselines "derived from 20-year historical NatCat loss data", and a combined-loss-ratio
> dashboard. The code differs on all three: scenarios are the six **NGFS** transition scenarios
> (not RCPs) used as frequency/severity multipliers; climate trends **compound geometrically per
> 5-year step**, not linearly per year; baselines are **synthetic seeded values**, not Munich Re
> history; and there is **no premium anywhere**, so no loss ratio or combined ratio exists. The
> PML figures are heuristic scalings, not return-period losses from the (cosmetic) loss
> distribution labels. The projection engine itself is real and documented below; §8 specifies the
> production frequency–severity model.

### 7.1 What the module computes

150 region-peril cells (15 regions × 10 perils), each with seeded actuarial primitives, projected
over 7 quinquennial time points (2025–2055) under 6 scenarios:

```js
// calcProjectedClaims(rp, si, ti)   — ti = time index (each step = 5 years)
freqMult = (1 + climateFreqTrend × SCEN_FREQ_MULTS[si]) ^ ti
sevMult  = (1 + climateSeverityTrend × SCEN_SEV_MULTS[si]) ^ ti
expMult  = (1 + exposureGrowth) ^ ti
proj     = baseClaimsFreq × baseSeverityK × freqMult × sevMult × expMult
if (catastropheProbability > 0.3) proj ×= (1 + demandSurge)      // applied at ALL horizons
proj    ×= (1 + inflationLoading × ti)                            // linear inflation load
// calcNetAfterReins: ceded = gross > reinsuranceTrigger ? (gross − trigger) × 0.7 : 0
```

### 7.2 Parameterisation

**Scenario multipliers** (`SCEN_FREQ_MULTS` / `SCEN_SEV_MULTS`) — synthetic demo values scaling
the per-cell climate trends:

| Scenario | Freq mult | Sev mult |
|---|---|---|
| Net Zero 2050 | 1.05 | 1.08 |
| Delayed Transition | 1.12 | 1.15 |
| Divergent Net Zero | 1.09 | 1.12 |
| Nationally Determined | 1.18 | 1.22 |
| Current Policies | 1.28 | 1.35 |
| Fragmented World | 1.38 | 1.45 |

The ordering (hot-house worse than orderly) is NGFS-plausible, but NGFS publishes macro paths,
not claims-frequency multipliers — these numbers have no external calibration.

**Per-cell seeded primitives** (seed = `regionIdx×100 + perilIdx×7`): baseClaimsFreq 0.01–0.09,
baseSeverityK $50–950K, climateFreqTrend 0.5–5.5%/step, climateSeverityTrend 0.5–4.5%/step,
exposureGrowth 1–4%/step, catastropheProbability 0.05–0.65, demandSurge 10–15% (if catProb > 0.3,
else 0–5%), socialInflation 1–5%, insuranceGap 10–70%, inflationLoading 2–5%/step, emergingRisk
0–0.8, reinsuranceTrigger = baseSev×(5–8), pml100 = baseSev×(4–12)×baseFreq×100,
pml250 = pml100×(1.3–1.9). All synthetic.

### 7.3 Calculation walkthrough

Filters (peril, region, insurance-gap ≥ slider, emerging-risk ≥ slider, search) subset the 150
cells. KPI strip: `totalClaims2050 = Σ calcProjectedClaims(r, scenIdx, 5)`, mean freq/sev trends,
`Σ pml100`, count of cells with emergingRisk > 0.6. `forecastData` evaluates all 6 scenarios × 7
horizons over the filtered set (42 full-portfolio projections per render). The actuarial
decomposition tab isolates additive effects for one drill-down cell:
`freqEffect = base×(freqMult−1)`, `sevEffect = base×(sevMult−1)`, `expEffect = base×(expMult−1)`,
`socialEffect = base×socialInflation×ti` (toggle), `surgeEffect = base×demandSurge` (toggle) — a
stacked-area attribution. A pseudo development triangle assigns
`ultimate = paid × (1 + sr(...)×0.12)`, `IBNR = ultimate − paid` to the 5-year seeded history.

### 7.4 Worked example (North America / Hurricane-Typhoon, Net Zero 2050, 2050)

Cell ri = 0, pi = 0 → seed = 0: baseFreq = sr(1)×0.08+0.01 = **0.0879**, baseSev = sr(2)×900+50 =
**$230K**, clFreqTrend = **0.0538**, clSevTrend = **0.0353**, expGrowth = **0.011**, catProb =
**0.557**, demandSurge = **0.129**, inflLoad = **0.022**, reinsTrigger = **1,218**.

| Step (ti = 5, si = 0) | Computation | Result |
|---|---|---|
| base | 0.0879 × 230 | 20.22 |
| freqMult | (1 + 0.0538×1.05)⁵ = 1.05649⁵ | 1.3162 |
| sevMult | (1 + 0.0353×1.08)⁵ = 1.03812⁵ | 1.2057 |
| expMult | 1.011⁵ | 1.0562 |
| product | 20.22 × 1.3162 × 1.2057 × 1.0562 | 33.89 |
| demand surge | ×(1 + 0.129) (catProb 0.557 > 0.3) | 38.26 |
| inflation | ×(1 + 0.022×5) | **42 (rounded)** |
| net of reinsurance | 42 < 1,218 trigger → ceded 0 | **42** |

Expected claims roughly double 2025→2050 for this cell (20 → 42), driven ~⅔ by the compounded
frequency/severity trends.

### 7.5 Data provenance & limitations

- **All 150 cells are synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`); no Munich Re/EM-DAT
  history, no IPCC AR6 hazard factors, despite the guide's citations. Units of the projected
  quantity (freq × $K severity) are an index-level expected-loss proxy, never tied to a portfolio
  exposure base.
- Time semantics: trends compound per 5-year *index step*; a reader assuming annual rates would
  overstate growth ~5×.
- Demand surge is a permanent multiplier whenever catProb > 0.3, not a post-event severity
  uplift as the guide (and actuarial practice) describes.
- PML100/250 are heuristic multiples of AAL, not quantiles of the labelled loss distribution
  (`Normal/LogNormal/Pareto/Weibull` labels are cosmetic); the reinsurance layer is a flat 70%
  cession above a trigger, not an XoL tower.
- The development triangle is not a chain-ladder: development factors are random draws, IBNR is
  synthetic.

**Framework alignment:** *NGFS scenarios* — names adopted; NGFS provides macro-financial
transition paths, and using them to scale *physical* claims frequency inverts their design
(physical intensity is highest in Current Policies/Fragmented World, which the multiplier ordering
does at least respect). *IPCC AR6 WGI Interactive Atlas* — the intended source for hazard change
factors (e.g. ~7%/°C atmospheric moisture scaling for extreme precipitation); not used. *Lloyd's
LMA climate scenarios & IFoA climate risk guidance* — motivate the freq/sev decomposition and
demand-surge concepts implemented here in stylised form. *Solvency II / rating-agency PML
practice* — PML at 1-in-100/1-in-250 corresponds to VaR of the aggregate-loss distribution
(1-in-200 is the Solvency II SCR standard), which requires an EP curve the module lacks.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Produce climate-conditioned expected claims, EP curves (AEP/OEP), and PML100/250 by region-peril
for pricing, reserving and reinsurance-purchase decisions for a P&C book. Coverage: property CAT
perils (TC, flood, wildfire, SCS/hail, drought-subsidence, freeze) by region.

### 8.2 Conceptual approach

Collective-risk (frequency–severity) model with climate change factors applied to hazard
parameters — the structure used by **Verisk (AIR) Touchstone** and **Moody's RMS** climate-change
conditioned catalogues, and by **Swiss Re sigma / Munich Re NatCatSERVICE** trend analytics for
baselining. Frequency ~ Poisson/Neg-Binomial fitted to 20y de-trended event counts; severity ~
Lognormal body + GPD tail (peaks-over-threshold); climate conditioning via per-peril change
factors from IPCC AR6 / peril-specific literature, applied to λ and severity scale.

### 8.3 Mathematical specification

```
Frequency:   N_t ~ NegBin(λ_t, k),   λ_t = λ₀ · CF_freq(peril, region, scenario, t)
Severity:    X ~ Lognormal(μ, σ) for X < u;  X − u ~ GPD(ξ, β) for X ≥ u
             severity trend: μ_t = μ₀ + ln[CF_sev(·,t)] + ln[(1+π_infl)(1+π_social)]^(t−t₀)
Exposure:    E_t = E₀(1+g)^(t−t₀)  (values insured, geocoded)
Aggregate:   S_t = Σ_{j=1..N_t} X_j · E_t/E₀      (simulate ≥100k years)
Outputs:     AAL = E[S_t];  AEP_q = quantile(S_t, q);  PML100 = AEP_0.99;  PML250 = AEP_0.996
Demand surge: X_j ×(1 + DS·1{event size > s*}) — event-conditional, 15–35% for majors
Reinsurance: net = S − Σ_layers min(max(S−att,0), lim)·placement   (XoL tower)
```

| Parameter | Calibration source |
|---|---|
| λ₀, μ, σ, u, ξ, β | EM-DAT + Swiss Re sigma / Munich Re NatCatSERVICE 20y losses, on-levelled |
| CF_freq / CF_sev | IPCC AR6 WGI Atlas change factors per peril·region·GWL; CC-scaling ≈ 7%/°C for precip-driven perils |
| Scenario → GWL(t) | NGFS Phase IV GWL trajectories (map scenario → warming level → change factor) |
| π_infl | national CPI + construction-cost indices (OECD, free) |
| π_social | ILS/industry litigation-inflation studies (Swiss Re sigma 4/2021) |
| DS demand surge | post-event studies (15–35% for Katrina/Andrew-class events) |

### 8.4 Data requirements

Exposure: TIV, geocode, occupancy, construction (internal); Hazard/history: EM-DAT (free), sigma
(free summaries), NOAA/Copernicus reanalysis (free); Scenario: NGFS GWL paths (free). Platform
fit: EM-DAT and Swiss Re anchors already exist in the platform's public-data seeds; NGFS scenario
tables exist in the scenario modules; region-peril taxonomy here maps 1:1.

### 8.5 Validation & benchmarking plan

- Backtest AAL vs held-out last-5-years actual losses per region-peril (on-levelled).
- Benchmark PML100/250 against published vendor industry EP curves (Verisk/RMS industry loss
  reports) and Lloyd's RDS scenarios.
- Sensitivity: ξ ±0.1 (tail), CF at GWL ±0.5 °C, demand-surge on/off; Poisson vs NegBin
  dispersion test.
- Reconcile net-of-reinsurance distribution against broker (Aon/Guy Carpenter) tower analytics.

### 8.6 Limitations & model risk

EM-DAT under-reports small events (threshold bias — fit above u only); change factors are
GWL-mapped averages that miss regional circulation changes; social inflation is US-liability
centric. Fallback: where cell data < 10 events, borrow peril-level parameters with a region
credibility weight (Bühlmann), and floor PML at the heuristic multiple currently displayed.

## 9 · Future Evolution

### 9.1 Evolution A — Historical baselines and a real loss ratio (analytics ladder: rung 2 → 3)

**What.** §7 confirms the projection engine is real — 150 region-peril cells projected
over 7 quinquennial steps under 6 NGFS scenarios with geometric compounding — but the
guide diverges on three counts: baselines are synthetic seeds, not the "20-year Munich
Re history" claimed; PMLs are heuristic scalings, not return-period losses from the
(cosmetic) loss-distribution labels; and there is no premium anywhere, so the promised
loss-ratio dashboard cannot exist. Evolution A grounds the baselines in observable
loss history — EM-DAT (public disaster database) and the OpenFEMA NFIP claims the
platform already ingests give per-region-peril frequency/severity anchors — and adds a
premium input so the combined-ratio view becomes computable rather than impossible.

**How.** (1) `ref_natcat_baselines(region, peril, freq_pa, median_severity, source,
period)` calibrated from EM-DAT/NFIP aggregates; seeded cells retained only where
history is absent, flagged via `resolution_tier`. (2) The loss-distribution labels
made real: fit lognormal/Pareto severity to the claims data where density permits and
compute PML as an actual return-period quantile, per §8 model-card convention.
(3) Premium as a per-line input (rate per exposure unit) so
`lossRatio = E[Loss]/Premium` finally has a denominator; the guide's RCP-vs-NGFS and
linear-vs-geometric wording reconciled to the code's actual (defensible) choices.

**Prerequisites.** EM-DAT licensing (research use); the flagged guide discrepancies
clear in the same change. **Acceptance:** a US-flood cell's baseline traces to NFIP
aggregates; PML at 1-in-100 equals the fitted distribution's 99th percentile; loss
ratio renders only when a premium is supplied (honest-null otherwise).

### 9.2 Evolution B — Actuarial scenario copilot (LLM tier 1 → 2)

**What.** A copilot for pricing and reserving analysts: "why do 2045 wildfire claims
triple under Hot House?" (geometric compounding of the frequency trend — the §7
mechanic), "which region-peril cells deteriorate fastest under Disorderly?", "re-run
North America hurricane with demand surge at 30%" — the last as a client-side tool
call into `calcProjectedClaims` with modified parameters (no backend routes exist).

**How.** Tier 1: atlas §5/§7 as corpus with the multiplier mechanics explained
faithfully (NGFS scenarios, 5-year compounding — not the guide's RCP/linear text until
Evolution A reconciles it); page state (selected line, peril, scenario) injected.
Tier 2: tool schema over the projection function; the validator ties every projected
loss to an invocation. Scenario-definition questions cite the NGFS corpus.

**Prerequisites.** Evolution A's baseline grounding before the copilot presents
absolute dollar losses as meaningful — growth *rates* are defensible today, levels are
not, and the system prompt must make that distinction explicit pre-A. **Acceptance:**
a what-if answer matches the projection function's output; asked for a market-share
adjusted loss forecast, the copilot notes exposure data is not in the module.