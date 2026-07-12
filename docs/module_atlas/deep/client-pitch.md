## 7 · Methodology Deep Dive

The Client Pitch page is a **10-section printable pitch deck** for the India / Nifty-50 climate story.
It is not a calculator so much as a presentation layer over the platform's India dataset
(`frontend/src/data/indiaDataset.js`): `NIFTY_50`, `INDIA_PROFILE`, `INDIA_CBAM_EXPOSURE`,
`INDIA_SECTORS`, `INDIA_EMISSIONS_BY_SECTOR`, `INDIA_CLIMATE_TARGETS`, plus a call to
`runIndiaEngines()`. There is no MODULE_GUIDES entry, so no guide↔code reconciliation is required.

### 7.1 What the module computes

The only genuine on-page maths is the **portfolio-KPI aggregation** over the sector-filtered
Nifty-50 slice (`portfolioKpis`):

```
totalMcap   = Σ marketCap_usd_mn
totalScope1 = Σ scope1_tco2e ;  totalScope2 = Σ scope2_tco2e ;  totalScope3 = Σ scope3_tco2e
avgEsg      = Σ esgScore / n ;  avgTemp = Σ temperatureAlignment_c / n
avgTransition = Σ transitionScore / n ;  avgPhysical = Σ physicalRiskScore / n
waci        = totalMcap > 0 ? (totalScope1 + totalScope2) / totalMcap : 0
```

Everything else is a chart transform: a Paris-pathway overlay, a scenario emissions multiplier, a
risk radar, and a scenario stress panel.

### 7.2 Parameterisation / provenance

| Constant | Value | Provenance |
|---|---|---|
| Paris `target_2c` decay | `co2_mt × (1 − (year−2020)×0.018)` | Synthetic linear proxy (1.8%/yr) — not a calibrated IPCC budget |
| Paris `target_15c` decay | `co2_mt × (1 − (year−2020)×0.028)` | Synthetic linear proxy (2.8%/yr) |
| Scenario multipliers | `[1.0, 0.85, 0.7, 1.15]` | Hard-coded per scenario `[NDC Current, Below 2 °C, Net Zero 2050, Delayed Transition]` — demo scalars, not NGFS outputs |
| Radar benchmarks | `[55, 50, 60, 55, 30, 40]` | Hard-coded reference line, no source |
| CBAM vulnerability index | `INDIA_PROFILE.cbam_vulnerability_index ?? 0.26` | Dataset value with a literal fallback |

`NIFTY_50` / `INDIA_*` constituent data is labelled `dataSource: 'estimated'`/`'real'` inside the
dataset; ESG, temperature-alignment and emissions fields are estimates, not audited disclosures.

### 7.3 Calculation walkthrough

1. `sectorFilter` slices `NIFTY_50` → `filteredCompanies`.
2. `portfolioKpis` reduces that slice to the headline cards (Market Cap, Avg ESG, Portfolio Temp,
   SBTi count, CBAM count) and `waci`.
3. `trajectoryData` maps `INDIA_CLIMATE_TARGETS.co2Trajectory` into three series (actual + two
   linear Paris proxies).
4. `scenarioImpactData` multiplies each sector's `avgEmissions` by `scenarioMultipliers[scenarioIdx]`
   and reports `delta = avgEmissions × (mult − 1)`.
5. `radarData` re-scales six KPIs onto 0–100 (e.g. physical axis = `100 − avgPhysical`, temp axis =
   `(3 − avgTemp)/3 × 100`) for the risk radar.
6. `engineCards` reads `runIndiaEngines()` output for 13 headline engine metrics.

### 7.4 Worked example — scenario delta (Net Zero 2050)

Take a sector with `avgEmissions = 4,000,000 tCO₂e` under **Net Zero 2050** (`scenarioIdx = 2`,
`mult = 0.7`):

| Step | Computation | Result |
|---|---|---|
| Scenario emissions | 4,000,000 × 0.7 | 2,800,000 tCO₂e |
| Delta from baseline | 4,000,000 × (0.7 − 1) | −1,200,000 tCO₂e |
| Aggregate reduction label | \|round((0.7 − 1) × 100)\| | 30 % |

The callout then reads "…a reduction in aggregate emissions of 30 %." The multiplier is a flat
scalar applied uniformly to every sector — there is no sector-specific abatement elasticity.

### 7.5 The `runIndiaEngines()` cards — and a key wiring bug

`engineCards` reads flat keys such as `engines.nifty50_waci`, `engines.nifty50_climateVaR`,
`engines.nifty50_temperature`. But `runIndiaEngines()` returns a **nested** object:
`{ nifty50: { waci, climateVaR, temperature, … } }` (see `_runEnginesOnPortfolio`). No
`nifty50_waci` key exists, so every one of the 13 engine cards resolves to `undefined` → renders
**"N/A"**. This is a live defect: the pitch deck's "Proprietary Engine Results" section shows no
numbers. The underlying engines themselves are real:

- `calcWACI` = `Σ (weight/totalW) × (scope1 + scope2)` — a genuine WACI.
- `calcTemp` = weight-averaged `temperatureAlignment_c` over the holdings.
- `calcVaR` = `totalVal × (0.03 + sr(seed)×0.08)` — **explicitly `dataSource:'mock'`**; the "Climate
  VaR" is a seeded random 3–11 % of portfolio value, not a modelled tail loss.

### 7.6 Data provenance & limitations

- India constituent/sector data is real-ish platform seed data (`'real'`/`'estimated'`/`'derived'`
  tags), not live feeds. The **Climate VaR engine is seeded-random** via
  `sr(seed) = frac(sin(seed+1)×10⁴)` and marked `mock`.
- Paris pathways are **linear percentage decays**, not carbon-budget-consistent trajectories.
- Scenario multipliers are four hard-coded scalars, disconnected from any NGFS/IEA pathway.
- The engine-results section is non-functional (§7.5 key mismatch); a reader should not treat those
  cards as populated.

**Framework alignment:** the *methodology appendix* names PCAF (EVIC attribution, DQ 1–5), SBTi
portfolio-temperature (ITR budget approach), SFDR Annex I PAIs, EU Taxonomy (6 objectives + DNSH),
EU CBAM Regulation 2023/956, and NGFS Phase IV physical scenarios. These are **described** in the
appendix cards but only WACI and a mock VaR are actually computed on-page; the Climate VaR in
particular has no NGFS/Merton model behind it (see §8).

## 8 · Model Specification — Portfolio Climate VaR (Nifty-50)

**Status: specification — not yet implemented in code.** The page presents a "Climate VaR (95%)"
that is `sr()`-seeded random (`calcVaR`, `dataSource:'mock'`); this section specifies the production
model it should run.

### 8.1 Purpose & scope
Estimate the 1-year 95%/99% climate-conditional loss of value for a listed-equity portfolio (Nifty-50
and its sub-indices), decomposed into transition and physical channels, to support the "Risk
Deep-Dive" pitch section and client stress reporting.

### 8.2 Conceptual approach
A **scenario-expansion factor model** in the spirit of MSCI Climate VaR and BlackRock Aladdin
Climate transition-repricing: each holding's equity value is repriced under NGFS scenarios via a
discounted-cash-flow shock (transition) plus a damage-function shock (physical), and the loss
distribution is taken across scenario × Monte-Carlo draws. Benchmarks: MSCI Climate VaR
(policy-cost + technology-opportunity + physical NPV shocks) and NGFS Phase IV macro-financial
pathways mapped to sector equity betas.

### 8.3 Mathematical specification
For holding `i`, scenario `s`:
```
ΔVtrans_i,s = − Σ_t [ (CarbonPrice_s,t · Emissions_i,t − Abatement_i,t) / (1+r)^t ] / MktCap_i
ΔVphys_i,s  = − Σ_h  Damage_h(Hazard_h,s) · AssetShare_i,h
Loss_i,s    = w_i · ( ΔVtrans_i,s + ΔVphys_i,s )
PortfolioLoss_s = Σ_i Loss_i,s
ClimateVaR_q = Quantile_q( { PortfolioLoss_s weighted by π_s, + N(0,Σ) MC noise } )
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Carbon price path | `CarbonPrice_s,t` | NGFS Phase IV (REMIND/GCAM) shadow-price trajectories |
| Emissions | `Emissions_i,t` | PCAF Scope 1+2+3 from `NIFTY_50` |
| Discount rate | `r` | Sector WACC (Damodaran country/industry tables) |
| Damage function | `Damage_h` | IPCC AR6 WGII / Swiss Re sigma sectoral loss curves |
| Scenario weights | `π_s` | NGFS likelihood or equal-weight with sensitivity band |

### 8.4 Data requirements
Per-holding Scope 1/2/3 (exists in `NIFTY_50`), market cap (exists), sector (exists), asset-location
hazard exposure (needs WRI Aqueduct / ND-GAIN join — available in platform reference data), NGFS
carbon-price and GDP paths (platform `climate_scenarios` tables), sector WACC (vendor/Damodaran).

### 8.5 Validation & benchmarking plan
Backtest transition shocks against realised 2021–22 EU-ETS repricing of high-carbon equities;
reconcile portfolio-level ClimateVaR against an MSCI Climate VaR run on the same universe;
sensitivity-test to carbon-price path and damage-function elasticity; stability-test Monte-Carlo
seed dependence (the current `sr()` mock fails this by construction).

### 8.6 Limitations & model risk
Equity-repricing DCF is first-order (no second-round macro feedback); physical damage functions are
sector-average, not asset-precise; NGFS scenarios are not probabilities. Conservative fallback:
report the worst orderly and worst disorderly scenario loss as a range rather than a single VaR.
