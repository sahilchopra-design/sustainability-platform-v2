## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (EP-DL5) describes a *Critical Mineral Supply Risk*
> engine — `SupplyRisk_i = (DemandGrowth_i − SupplyCapacity_i)/SupplyCapacity_i × HHI_i` and an
> ESG-weighted mining-risk score. **Neither formula is in the code.** `CriticalMineralsClimatePage.jsx`
> builds 75 fully synthetic mine projects with the platform PRNG `sr(s)=frac(sin(s+1)×10⁴)` and every
> supply-concentration, carbon-intensity, water, tailings, EV-demand, recycling and just-transition
> figure is a seeded number. The listed backend engine (`critical_minerals_engine.py`) — which *does*
> hold real IEA HHI and country shares — is not imported. The page is a filterable descriptive
> dashboard over fabricated data.

### 7.1 What the module computes

A fixed universe of 75 projects (`PROJECTS`, seeded on index `i`), each with:
`supplyConcentration ∈ [500, 5000]` (→ risk tier), `reservesMt`, `productionKt`, `carbonIntensity`,
`waterIntensity`, `tailingsRisk`, `evDemandGrowth`, `recyclingRate`, `justiceConcerns`,
`transitionCriticalScore`. Eight tabs aggregate the filtered subset. The genuine computations are
simple averages/sums plus two interactive scalars:

```js
evDemandMultiplier = (1 + (evAdoption/100)·2)                     // 5%→1.10× , 80%→2.60×
carbonCostM        = Σ(productionKt·carbonIntensity)·carbonPrice / 1e6   // $M carbon liability
supplyRisk         = conc<1500 Low | <2500 Med | <3500 High | else Critical  // HHI tiers
```

### 7.2 Parameterisation / scoring rubric

| Field | Formula | Provenance |
|---|---|---|
| Supply concentration (HHI proxy) | `round(500 + sr(i×17)×4500)` | synthetic seeded |
| Carbon intensity | `2 + sr(i×19)×48` tCO₂e/t | synthetic seeded |
| Water intensity | `50 + sr(i×23)×950` (units unlabelled) | synthetic seeded |
| Tailings risk | `1 + sr(i×29)×9` (1–10) | synthetic seeded |
| EV demand growth | `5 + sr(i×31)×45` % | synthetic seeded |
| Recycling rate | `round(5 + sr(i×37)×65)` % | synthetic seeded |
| Transition-critical score | `round(30 + sr(i×43)×65)` | synthetic seeded |
| Risk tiers 1500/2500/3500 | hard cuts | HHI market-structure convention (DOJ/FTC bands are 1500/2500) |

Mineral, region and country are also drawn by `sr()` from fixed lists, so the geographic
attribution is random rather than reflecting real deposit locations.

### 7.3 Calculation walkthrough

Filters (mineral/region/risk) subset `PROJECTS` → KPI cards recompute `avgCarbonIntensity`,
`avgSupplyConcentration`, `avgTransitionScore`, `carbonCostM` over the subset (guarded by
`n = max(1, len)`). The two sliders (`evAdoption`, `carbonPrice`) drive the multiplier and carbon-cost
cards live. Per-mineral bar charts (`mineralProdData`, `mineralHHIData`, `mineralEVData`) group and
average within each mineral; the carbon-vs-recycling scatter plots each project.

### 7.4 Worked example (carbon cost)

Take the unfiltered set with (illustratively) `Σ productionKt·carbonIntensity ≈ 1.9×10⁶` t·(tCO₂/t)
and `carbonPrice = 65`:
```
carbonCostM = 1.9e6 × 65 / 1e6 = $123.5M   (rounds to "$124M")
```
At `carbonPrice = 130` it doubles to ~$247M — a linear carbon-price sensitivity, correct arithmetic
on synthetic tonnages. `evDemandMultiplier` at `evAdoption=30` = `1+0.30×2 = 1.60×`.

### 7.5 Data provenance & limitations

- **All 75 projects are synthetic** (`sr()` PRNG); mineral/country pairings are random, not real
  deposits. HHI, carbon and water intensities carry no external calibration.
- The genuine IEA reference dataset in `critical_minerals_engine.py` (real HHI 7200 lithium, 8900
  cobalt; real top-3 shares) is available but unused — the page could be re-anchored to it directly.
- Water-intensity units unlabelled; tailings and justice scores are 1–10 heuristics with no standard.

**Framework alignment:** IEA *Critical Minerals for Clean Energy Transitions 2024* (mineral list,
HHI concept) · EU CRMA Reg (EU) 2024/1252 (supply-security framing) · HHI (Herfindahl-Hirschman,
1500/2500 concentration bands) · GISTM 2020 (tailings, referenced conceptually by "tailingsRisk").
The page names these frameworks but implements only tier cut-offs over seeded data.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The displayed supply-risk, carbon-cost and
EV-demand quantities have no calibrated model behind them.

**8.1 Purpose & scope.** Produce a defensible supply-security + climate-footprint score per mineral
and per producing region, and a portfolio carbon-liability estimate, across the 8 tracked minerals.

**8.2 Conceptual approach.** Two coupled sub-models mirroring **IEA CRM supply-risk** and **S&P
Trucost mine-level carbon**: (a) a supply-risk index from real HHI + governance overlays (WGI,
INFORM), (b) a life-cycle carbon-intensity model per mineral/route calibrated to peer-reviewed LCA.
Carbon liability then prices production × intensity at a carbon price.

**8.3 Mathematical specification.**
```
HHI_m      = Σ_c share²_{c,m}·10⁴                              # real USGS shares
GeoRisk_m  = Σ_c share_{c,m}·(1 − WGI_c_normalised)            # governance-weighted
SupplyRisk_m = 0.6·norm(HHI_m) + 0.4·GeoRisk_m
CI_{m,route}(LCA)  →  ProjectCI = Σ_route mix·CI_route          # tCO2e/t, IEA/ecoinvent
CarbonLiability = Σ_project Production·ProjectCI·CarbonPrice
EVDemand_m(t) = Base_m·(1 + EVpenetration(t)·Elasticity_m)
```

| Parameter | Source |
|---|---|
| Country shares `share_{c,m}` | USGS MCS 2024 (real; in engine) |
| Governance `WGI_c` | World Bank Worldwide Governance Indicators |
| Route carbon intensity | IEA / ecoinvent / Skarn Associates mine-level LCA |
| Carbon price | EU ETS / ICE settlement, or user scenario |
| EV elasticity | IEA EV Outlook mineral-intensity coefficients |

**8.4 Data requirements.** Per-mine production, ore route, energy mix, country; LCA intensity
factors; carbon-price curve. Vendors: Skarn Associates (mine carbon), Benchmark Mineral
Intelligence; free: USGS, IEA, World Bank WGI. The engine already supplies HHI and shares.

**8.5 Validation & benchmarking.** Reconcile mineral HHI to USGS; benchmark route carbon intensities
against Skarn/Trucost published ranges (e.g. Class-1 nickel HPAL vs sulphide); backtest EV-demand
elasticity against 2020–2024 observed lithium demand.

**8.6 Limitations & model risk.** LCA intensity varies 3–5× by route (laterite HPAL nickel vs
sulphide) — a single per-mineral scalar is inadequate; governance overlays are slow-moving and miss
acute export-ban shocks. Fallback: publish intensity ranges and flag routes lacking primary LCA.
