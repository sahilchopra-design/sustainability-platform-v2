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
