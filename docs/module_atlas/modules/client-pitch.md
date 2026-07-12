# Client Pitch
**Module ID:** `client-pitch` · **Route:** `/client-pitch` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Callout`, `DataTable`, `KpiCard`, `PALETTE`, `SECTION_IDS`, `SECTION_LABELS`, `SectionHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `engines` | `useMemo(() => runIndiaEngines(), []);  /* ── derived data ──────────────────────────────────────────────── */ const sectors = useMemo(() => { const unique = [...new Set(NIFTY_50.map(c => c.sector))];` |
| `totalMcap` | `arr.reduce((s, c) => s + (c.marketCap_usd_mn \|\| 0), 0);` |
| `totalScope1` | `arr.reduce((s, c) => s + (c.scope1_tco2e \|\| 0), 0);` |
| `totalScope2` | `arr.reduce((s, c) => s + (c.scope2_tco2e \|\| 0), 0);` |
| `totalScope3` | `arr.reduce((s, c) => s + (c.scope3_tco2e \|\| 0), 0);` |
| `avgEsg` | `arr.reduce((s, c) => s + (c.esgScore \|\| 0), 0) / n;` |
| `avgTemp` | `arr.reduce((s, c) => s + (c.temperatureAlignment_c \|\| 0), 0) / n;` |
| `avgTransition` | `arr.reduce((s, c) => s + (c.transitionScore \|\| 0), 0) / n;` |
| `avgPhysical` | `arr.reduce((s, c) => s + (c.physicalRiskScore \|\| 0), 0) / n;` |
| `avgWater` | `arr.reduce((s, c) => s + (c.waterStress \|\| 0), 0) / n;` |
| `waci` | `totalMcap > 0 ? (totalScope1 + totalScope2) / totalMcap : 0;` |
| `sectorEmissionsChart` | `useMemo(() => { return INDIA_SECTORS.map(s => ({ sector: s.sector.length > 18 ? s.sector.slice(0, 16) + '..' : s.sector, fullSector: s.sector, avgEmissions: Math.round(s.avgEmissions), avgESG: +(s.avgESG).toFixed(1), sbtiCoverage: +(s.sbtiCoverage_pct).toFixed(0), companies: s.companies` |
| `trajectoryData` | `useMemo(() => { return (INDIA_CLIMATE_TARGETS?.co2Trajectory \|\| []).map(d => ({ year: d.year, co2_mt: Math.round(d.co2_mt), target_2c: Math.round(d.co2_mt * (1 - (d.year - 2020) * 0.018)), target_15c: Math.round(d.co2_mt * (1 - (d.year - 2020) * 0.028)) }));` |
| `emissionFactors` | `useMemo(() => { return [...(INDIA_EMISSIONS_BY_SECTOR \|\| [])].sort((a, b) => (b.ef_kgco2_usd \|\| 0) - (a.ef_kgco2_usd \|\| 0)).slice(0, 20);` |
| `scatterData` | `useMemo(() => { return filteredCompanies.map(c => ({ name: c.ticker \|\| c.name, x: c.transitionScore \|\| 0, y: c.esgScore \|\| 0, z: Math.max(50, (c.marketCap_usd_mn \|\| 0) / 200), temp: (c.temperatureAlignment_c \|\| 0).toFixed(1) }));` |
| `topEmitters` | `useMemo(() => { return [...filteredCompanies] .sort((a, b) => ((b.scope1_tco2e \|\| 0) + (b.scope2_tco2e \|\| 0)) - ((a.scope1_tco2e \|\| 0) + (a.scope2_tco2e \|\| 0))) .slice(0, 10) .map(c => ({ name: c.ticker \|\| c.name, total_ktco2: +((( c.scope1_tco2e \|\| 0) + (c.scope2_tco2e \|\| 0)) / 1e3).toFixed(1), scope1_ktco2: +((c.scope1_tco2e \|\| 0) / 1e3` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PALETTE`, `SECTION_IDS`, `SECTION_LABELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Parameterised pitch over any portfolio, not just Nifty-50 (analytics ladder: rung 1 → 2)

**What.** §7 shows this is a presentation layer in good standing: a 10-section
printable India/Nifty-50 pitch over the real `indiaDataset.js` (NIFTY_50, CBAM
exposure, sector emissions, climate targets) plus `runIndiaEngines()`, with genuine
portfolio-KPI aggregation (WACI, scope totals, avgESG/ITR) — no guide↔code mismatch
because there is no guide. Its limitation is hard-coupling: one country, one index,
one dataset file. Evolution A generalises the deck into a parameterised pitch
generator: portfolio selector wired to `portfolios_pg` (the platform's populated
portfolio table), the same KPI aggregation computed over any holdings set, and the
scenario stress panel driven by the platform's NGFS scenario data rather than the
fixed multiplier — so the India deck becomes one instance of a reusable client-pitch
engine.

**How.** (1) Extract `portfolioKpis` into a shared utility taking any holdings array
with mcap/scopes/scores fields; the WACI formula (`(S1+S2)/mcap`) is already correct
and portable. (2) Section templates keep their India specialisations behind a
country-profile prop, with graceful omission (honest-nulls) when a dataset lacks CBAM
or targets equivalents. (3) Print-fidelity regression: the current Nifty-50 output
must render pixel-identical as the golden case.

**Prerequisites.** Portfolio holdings need the ESG/ITR/transition fields the KPI block
expects — gaps rendered as "—", never imputed; `runIndiaEngines()` clearly scoped as
India-only. **Acceptance:** selecting a `portfolios_pg` portfolio produces a complete
deck whose WACI reconciles to the platform's portfolio-analytics module for the same
holdings; the India golden case is unchanged.

### 9.2 Evolution B — Pitch narrative co-writer (LLM tier 2 → 3)

**What.** The deck's prose sections are where an LLM belongs: a co-writer that drafts
section narratives ("India transition story", "portfolio positioning") strictly from
the numbers the page has already computed — the KPI aggregates, sector rollups,
Paris-pathway overlay, and scenario stress outputs on screen — with per-client tone
controls. This is the roadmap's tier-3 render pattern in miniature: engine-sourced
numbers, LLM-drafted connective prose, report-studio-quality output.

**How.** Page state (all computed aggregates plus the dataset's cited constants)
passed as structured context; the no-fabrication validator is essential here because
pitch prose invites embellishment — every figure in generated text must match the
page's computed values, and claims about India policy must cite the dataset's
provenance fields. Draft-review-accept flow: the human keeps authorship, the LLM
proposes.

**Prerequisites.** Evolution A's generalisation multiplies the value but is not
blocking — the India deck's numbers are real today. A style corpus (2–3 approved past
pitches) for tone grounding. **Acceptance:** a generated section contains zero
numerics absent from page state; regenerating with a different tone changes prose but
not one number.