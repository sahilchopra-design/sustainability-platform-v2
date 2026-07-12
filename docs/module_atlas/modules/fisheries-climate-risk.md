# Fisheries Climate Risk Analytics
**Module ID:** `fisheries-climate-risk` · **Route:** `/fisheries-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DJ6 · **Sprint:** DJ

## 1 · Overview
Analyses climate impacts on fisheries productivity including species range shifts, ocean acidification, hypoxia, and temperature stress. Models fisheries revenue at risk, aquaculture investment resilience, and sovereign food security exposure for fishing-dependent economies.

> **Business value:** Critical for fisheries finance institutions, sovereign wealth funds of fishing-dependent nations (Iceland, Norway, Pacific SIDS), aquaculture investors, and food security analysts. Provides IPCC SROCC-aligned revenue risk quantification for both wild capture and aquaculture investment decisions.

**How an analyst works this module:**
- Select fishery region and target species
- Apply temperature/pH/oxygen change scenarios
- Calculate yield and revenue change under SSP pathways
- Assess aquaculture investment resilience
- Generate FAO/IPCC-aligned fisheries climate risk report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `FISHERIES`, `FISHERY_NAMES`, `KpiCard`, `REGIONS`, `STOCK_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `stockHealth` | `+(1 + sr(i * 7) * 9).toFixed(1);` |
| `catchVol` | `+(0.1 + sr(i * 3) * 9.9).toFixed(2);` |
| `totalCatch` | `filtered.reduce((a, f) => a + f.catchVolume, 0).toFixed(2);` |
| `totalSmallScale` | `filtered.reduce((a, f) => a + f.smallScaleFishersDependence, 0).toFixed(2);` |
| `catchByRegion` | `REGIONS.map(r => ({` |
| `climateVsStock` | `filtered.map(f => ({` |
| `projectedChangeData` | `[...filtered].sort((a, b) => a.climateProjectedCatchChange - b.climateProjectedCatchChange).slice(0, 20).map(f => ({` |
| `aquacultureByRegion` | `REGIONS.map(r => {` |
| `smallScaleData` | `[...filtered].sort((a, b) => b.smallScaleFishersDependence - a.smallScaleFishersDependence).slice(0, 15).map(f => ({` |
| `adaptData` | `[...filtered].sort((a, b) => a.adaptationCapacity - b.adaptationCapacity).slice(0, 15).map(f => ({` |
| `subsidyData` | `[...filtered].sort((a, b) => b.subsidiesM - a.subsidiesM).slice(0, 15).map(f => ({` |
| `overexploitData` | `[...filtered].sort((a, b) => b.overexploitationRisk - a.overexploitationRisk).slice(0, 15).map(f => ({` |
| `pct` | `filtered.length ? ((fs.length / filtered.length) * 100).toFixed(1) : '0';` |
| `catchPct` | `+totalCatch > 0 ? ((fs.reduce((a, f) => a + f.catchVolume, 0) / +totalCatch) * 100).toFixed(1) : '0';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FISHERY_NAMES`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Fisheries Catch | — | FAO SOFIA 2022 | Total global fisheries and aquaculture production — aquaculture now exceeds wild catch for human consumption |
| Fisheries Yield Change by 2100 | — | IPCC SROCC 2019 | Global marine fisheries maximum catch potential declines 3–25% under high emission scenario by 2100 |
| Fishing-Dependent Livelihoods | — | FAO SOFIA 2022 | 600M people depend on fisheries/aquaculture for livelihoods — predominantly in developing coastal countries |
- **FAO fisheries catch data by species/EEZ** → Baseline yield and revenue → **Species-level revenue at risk from climate scenarios**
- **Ocean physical/chemical projections (SST, pH, O2)** → Yield change modelling → **Species yield sensitivity to temperature/acidification/hypoxia**
- **Aquaculture site data + species thermal tolerances** → Aquaculture viability → **Site suitability under future ocean conditions**

## 5 · Intermediate Transformation Logic
**Methodology:** Fisheries Climate Yield Model
**Headline formula:** `YieldChange = BaseYield × (1 + β_T × ΔTemp + β_pH × ΔpH + β_O2 × ΔO2); RevenueAtRisk = ΔYield × CatchPrice × FleetDependency`

Beta coefficients from empirical studies relate temperature/pH/oxygen changes to yield — varies by species and region; revenue at risk aggregates physical production decline with fleet economic dependency

**Standards:** ['IPCC SROCC Chapter 5 — Changing Ocean, Marine Ecosystems and Dependent Communities', 'FAO State of World Fisheries and Aquaculture 2022', 'FishMIP Climate Impact Model', 'RCP-driven Stock Assessment Models']
**Reference documents:** IPCC Special Report on the Ocean and Cryosphere (SROCC 2019) Chapter 5; FAO State of World Fisheries and Aquaculture 2022 (SOFIA); FishMIP: Fisheries and Marine Ecosystem Model Intercomparison Project; World Bank Hidden Harvest — The Global Importance of Capture Fisheries (2012)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide promises a *Fisheries Climate Yield Model*
> (`YieldChange = BaseYield × (1 + β_T·ΔTemp + β_pH·ΔpH + β_O2·ΔO2)`) with empirical beta coefficients
> for temperature, ocean acidification and oxygen, plus `RevenueAtRisk = ΔYield × CatchPrice ×
> FleetDependency`. **None of that mechanism exists.** There are no β coefficients, no ΔpH/ΔO2 inputs,
> no revenue-at-risk formula. `climateProjectedCatchChange` is a **single `sr()`-seeded number**
> (−60% to −10%), and the only temperature response is a linear post-hoc rescale
> `×(1 + (tempScenario − 1.5)×0.15)`. The sections below document the descriptive dashboard as built.

### 7.1 What the module computes

For 60 named synthetic fisheries the page computes filtered aggregates and rankings:

```js
totalCatch          = Σ catchVolume                              // Mt
avgStockHealth      = Σ fishStockHealth / n                      // 1–10 scale
totalSmallScale     = Σ smallScaleFishersDependence              // M people
avgProjectedChange  = Σ climateProjectedCatchChange / n          // % catch change
catchByRegion       = per-region Σ catchVolume
projectedChange (scenario) = climateProjectedCatchChange × (1 + (tempScenario − 1.5)×0.15)
```

`stockStatus` is banded from `fishStockHealth`: ≥7 Healthy, ≥4 Moderate, else Depleted. The 8 tabs
are cuts of the same 60-fishery table (stock, climate exposure, overexploitation, aquaculture,
small-scale dependence, adaptation, subsidies), each a sort-and-slice bar/scatter view.

### 7.2 Parameterisation / scoring rubric

All fishery attributes are `sr()`-seeded:

| Field | Formula | Range | Meaning |
|---|---|---|---|
| catchVolume | `0.1 + sr(i·3)·9.9` | 0.1–10 Mt | Landings |
| catchValue | `0.1 + sr(i·5)·29.9` | $0.1–30 Bn | Ex-vessel value |
| fishStockHealth | `1 + sr(i·7)·9` | 1–10 | Stock status (drives band) |
| climateExposure | `1 + sr(i·11)·9` | 1–10 | Composite hazard |
| overexploitationRisk | `1 + sr(i·13)·9` | 1–10 | Fishing pressure |
| aquacultureShare | `5 + sr(i·17)·75` | 5–80% | Farmed vs wild |
| smallScaleFishersDependence | `0.05 + sr(i·19)·4.95` | 0.05–5 M | Livelihood dependence |
| adaptationCapacity | `1 + sr(i·23)·9` | 1–10 | Resilience |
| climateProjectedCatchChange | `−60 + sr(i·31)·50` | −60 to −10% | **The headline yield impact** |
| subsidiesM | `5 + sr(i·37)·1495` | $5–1500 M | Harmful subsidies |

The **scenario response** `(1 + (tempScenario − 1.5)×0.15)` means every 1°C above 1.5°C amplifies the
seeded catch decline by 15% — a single uniform sensitivity, not species- or hazard-specific.

### 7.3 Calculation walkthrough

1. Generate 60 fisheries with seeded fields; band `stockStatus`.
2. Filters (region, stock status, adaptation tier) → `filtered`.
3. KPIs: total catch, mean stock health, small-scale dependence sum, mean projected change.
4. Tab views: sort `filtered` by the relevant field, slice top-N, map to chart series.
5. Scenario slider rescales projected change linearly; fishing-effort slider (20% default) is a UI
   control feeding the overexploitation view.

### 7.4 Worked example (scenario amplification)

A fishery with `climateProjectedCatchChange = −40%` under the default `tempScenario = 1.5`:
```
displayed = −40 × (1 + (1.5 − 1.5)×0.15) = −40.0%
```
Raise the scenario to `3.0°C`:
```
displayed = −40 × (1 + (3.0 − 1.5)×0.15) = −40 × 1.225 = −49.0%
```
So a 1.5°C warming step deepens the projected loss from −40% to −49%. Note the base −40% itself is
`sr()`-random and unconnected to the fishery's temperature exposure, acidification, or species — the
scenario multiplier is the only "physics" and it is a flat 15%/°C for all stocks.

### 7.5 Data provenance & limitations

- **Every fishery attribute is synthetic**, from `sr(seed)=frac(sin(seed+1)×10⁴)`.
- The guide's β_T/β_pH/β_O2 yield model, revenue-at-risk, and FishMIP-style projections are absent.
- The temperature response is a single linear 15%/°C rescale applied uniformly; real yield responses
  differ by species thermal tolerance, latitude, and trophic level.
- No revenue-at-risk, no fleet economics, no sovereign food-security linkage despite the guide.

**Framework alignment (named, not implemented):** IPCC SROCC Ch.5 (ocean warming/acidification/hypoxia
impacts on fisheries) · FAO SOFIA 2022 (stock-status and production framing) · FishMIP (multi-model
fisheries projections) · RCP/SSP-driven stock assessments. The dashboard *references* these but derives
its numbers from PRNG.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's yield model is unbuilt and the
catch-change figures are `sr()`-random. Below is the production fisheries climate-yield model.

### 8.1 Purpose & scope
Project climate-driven change in fisheries yield and the associated revenue-at-risk and food-security
exposure, by stock/region under RCP/SSP scenarios — supporting blue-economy investment and sovereign
food-security risk assessment.

### 8.2 Conceptual approach
A **bio-economic yield model** driven by ocean-climate stressors, benchmarked against **FishMIP**
(the Fisheries and Marine Ecosystem Model Intercomparison Project) ensemble projections and the
**IPCC SROCC** synthesis. Yield responds to temperature (thermal-niche shift), pH (calcifier stress)
and dissolved O₂ (hypoxia); revenue-at-risk multiplies yield loss by ex-vessel price and fleet
dependence, à la Sea Around Us / Sumaila economic valuation.

### 8.3 Mathematical specification
```
ΔYield_s   = BaseYield_s · ( β_T,s·ΔT_r + β_pH,s·ΔpH_r + β_O2,s·ΔO2_r )   per stock s, region r
  β’s are species-group elasticities; ΔT/ΔpH/ΔO2 from Earth-system model outputs by scenario
RangeShift_s = f(thermalNiche_s, ΔT_r)   → reallocation of biomass across EEZs
RevenueAtRisk_s = |min(0, ΔYield_s)| · exVesselPrice_s · fleetDependence_s
FoodSecurity_c  = Σ_{s∈c} ΔYield_s · proteinShare_{s,c}                   per country c
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| β_T,s, β_pH,s, β_O2,s | stressor elasticities by species group | FishMIP / peer-reviewed empirical studies |
| ΔT_r, ΔpH_r, ΔO2_r | regional ocean change | CMIP6 Earth-system models (RCP2.6/4.5/8.5) |
| BaseYield_s | current MSY / landings | FAO / RAM Legacy stock database |
| exVesselPrice_s | landed price | Sea Around Us price database |
| fleetDependence_s | economic reliance | national fisheries statistics |

### 8.4 Data requirements
Per stock: current landings/MSY, species thermal niche, region/EEZ, ex-vessel price, fleet dependence.
Per region: CMIP6 ΔT/ΔpH/ΔO2 by scenario/decade. Sources: FAO SOFIA, RAM Legacy (public), FishMIP
outputs (public), Sea Around Us (public), CMIP6 (public). None currently on platform.

### 8.5 Validation & benchmarking plan
Reconcile projected ΔYield against the FishMIP ensemble mean and IPCC SROCC ranges (target within model
spread); backtest against observed range shifts (e.g. North Sea cod poleward retreat); sensitivity-test
β’s and scenario choice; validate revenue-at-risk against Sea Around Us economic estimates.

### 8.6 Limitations & model risk
Species elasticities are uncertain and non-linear near thermal limits; range shifts cross EEZ boundaries
creating governance risk; hypoxia effects are highly local. Conservative fallback: present the FishMIP
ensemble range rather than a point estimate and floor food-security impacts at the SROCC lower bound.

## 9 · Future Evolution

### 9.1 Evolution A — Build the β-coefficient yield model the guide promises (analytics ladder: rung 1 → 2)

**What.** §7 flags a total guide↔code gap: the promised Fisheries Climate Yield Model (`YieldChange = BaseYield × (1 + β_T·ΔTemp + β_pH·ΔpH + β_O2·ΔO2)`) with revenue-at-risk (`ΔYield × CatchPrice × FleetDependency`) does not exist. What runs is a descriptive dashboard over 60 `sr()`-seeded fisheries where `climateProjectedCatchChange` is a single seeded number and the only climate response is a uniform `×(1 + (tempScenario−1.5)×0.15)` rescale. Evolution A builds the module's first analytical vertical: a real multi-stressor yield model with species/region-specific β coefficients drawn from the SROCC and FishMIP literature the module already cites, taking ΔTemp/ΔpH/ΔO2 as scenario inputs and producing revenue-at-risk from catch price and fleet dependency.

**How.** (1) A backend route holding a β table keyed by species thermal guild and region (curated from published FishMIP/SROCC elasticities, documented per §8 model-card convention with honest uncertainty). (2) Real fishery attributes seeded from FAO SOFIA stock-status data rather than PRNG. (3) Revenue-at-risk chains ΔYield to catch price and the small-scale-fisher dependency field the page already carries, giving the sovereign food-security linkage §7.5 says is absent.

**Prerequisites.** The 60 seeded fisheries must be replaced with sourced stock data (all attributes are §7-flagged synthetic); β coefficients labeled as literature-derived ranges, not point truths. **Acceptance:** two species with different thermal tolerance under the same ΔTemp produce different yield changes; revenue-at-risk reproduces the §5 formula; no `sr()` in any headline metric.

### 9.2 Evolution B — Blue-economy risk copilot (LLM tier 1 → 2)

**What.** A copilot for fisheries-finance and sovereign-fund users: "how exposed is Pacific SIDS tuna revenue to a 2°C ocean, and which stressor dominates?" Tier-1 slice narrates the module's rankings and framework context (SROCC Ch.5 warming/acidification/hypoxia mechanisms) from the atlas corpus; tier-2 slice runs the Evolution A yield model as tool calls, decomposing the projected change into temperature/pH/oxygen contributions.

**How.** Tier 1 grounds on this atlas record; because §7 documents the current numbers as PRNG-derived, the pre-Evolution-A copilot must explicitly frame outputs as illustrative and refuse quantitative revenue-at-risk questions. Tier 2 wraps the yield endpoint with per-stressor decomposition so the "which stressor dominates" answer is engine-computed. Cross-links to sovereign and food-security modules come from the atlas interconnection graph.

**Prerequisites.** Evolution A for any quantitative answer (the module computes no yield model today); corpus embedding. **Acceptance:** post-Evolution-A, every yield/revenue figure traces to a tool call and the stressor decomposition sums to the total; pre-Evolution-A, quantitative probes return a documented refusal rather than seeded numbers.