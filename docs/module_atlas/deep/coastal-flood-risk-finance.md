## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide specifies a coastal expected-annual-loss engine —
> `EAL = Σ P(SLR_t + Surge_i) × DamageFunction(depth) × AssetValue × ExposureShare` with a USACE
> Hazus damage function and an insurability-cliff year (premium > 1% of property value). **None of
> that exists in code.** The page generates 65 synthetic coastal-city records with the seeded PRNG,
> filters/aggregates them, and applies one linear what-if scaler to exposure. There is no
> probability, no damage function, no premium model. The second slider ("Adaptation Investment
> $10–1,000Bn") is **display-only — it feeds no calculation at all**. Sections below document the
> code as it behaves.

### 7.1 What the module computes

For 65 cities (real city names, synthetic attributes; `CoastalFloodRiskFinancePage.jsx`):

```
riskScore  = (stormSurgeArg + floodArg) / 2         → Extreme ≥7.5 | High ≥5.5 | Medium ≥3.5 | Low
KPIs       = Σ exposedAssets, Σ populationAtRisk, Σ adaptationCost, mean(insurancePenetration)
adjusted   = exposedAssets × (1 + (slrScenario − 50)/200)     slrScenario ∈ [20, 200] cm
gap_c      = 100 − insurancePenetration_c
```

### 7.2 Parameterisation (per-city seeded generators)

| Field | Generator | Range |
|---|---|---|
| stormSurge / stormSurgeRisk | `1 + sr(i·7)·9` / `1 + sr(i·13)·9` | 1–10 |
| floodFrequency | `round(1 + sr(i·5)·19)` | 1–20 events/decade |
| exposedAssets | `5 + sr(i·3)·245` | $5–250bn |
| seaLevelRise2050 | `round(10 + sr(i·11)·70)` | 10–80 cm |
| populationAtRisk | `0.1 + sr(i·19)·9.9` | 0.1–10 M |
| adaptationCost | `1 + sr(i·17)·29` | $1–30bn |
| residualRisk | `adapt·0.3 + sr(i·23)·5` | couples residual risk to adaptation *cost* (not benefit) |
| insurancePenetration | `5 + sr(i·29)·85` | 5–90% |
| natureSolutionsPotential | `1 + sr(i·31)·9` | 1–10 index |

All values are **synthetic demo data** (`sr(seed)=frac(sin(seed+1)×10⁴)`). Risk classification is
called as `getRiskLevel(stormRisk, sr(i·7)·10)` — the second argument re-uses the storm-surge seed
scaled ×10, so "flood" in the classifier is not the flood-frequency field; the two arguments are
near-duplicates of each other.

### 7.3 Calculation walkthrough

1. Region (8 options) and risk-level filters subset the 65 cities; the four KPI cards are simple
   sums/means over the subset (mean guarded for empty selection).
2. **Asset Exposure tab**: top-15 by exposed assets, plus the SLR what-if — the 20–200 cm slider
   linearly scales exposure by ±75%/+75% around the 50 cm anchor:
   `exposure × (1 + (SLR − 50)/200)`.
3. **Sea Level Rise / Storm Surge tabs**: scatter of SLR-2050 vs adaptation cost; bar of storm
   risk vs SLR for the first 15 cities in filter order (not ranked).
4. **Insurance Gap tab**: 15 lowest-penetration cities, `gap = 100 − penetration`.
5. **NbS tab**: nature-solutions index vs adaptation cost for 20 cities (no cost-effectiveness
   arithmetic).

### 7.4 Worked example — city i = 0 ("Miami")

At i = 0 every seed `i·k = 0`, so all draws collapse to `sr(0) = frac(sin(1)·10⁴) ≈ 0.4147`:

| Field | Computation | Result |
|---|---|---|
| stormSurgeRisk | 1 + 0.4147×9 | 4.73 |
| exposedAssets | 5 + 0.4147×245 | $106.6bn |
| seaLevelRise2050 | round(10 + 0.4147×70) | 39 cm |
| adaptationCost | 1 + 0.4147×29 | $13.0bn |
| insurancePenetration | 5 + 0.4147×85 | 40.3% → gap 59.7% |
| risk class | (4.73 + 4.15)/2 = 4.44 | **Medium** |
| adjusted exposure @ 100 cm slider | 106.6 × (1 + 50/200) | **$133.3bn** |

### 7.5 Data provenance & limitations

- Entirely synthetic: city attributes bear no relation to the real cities named (Jakarta and
  Rotterdam draw from the same uniform distributions). Real-world anchors from the guide (IPCC AR6
  0.63–1.02 m SSP5-8.5, First Street $1.1Tn US exposure) appear nowhere in code.
- The SLR what-if is linear in centimetres with an arbitrary 1:200 slope — no elevation,
  bathymetry, or return-period physics; a 200 cm SLR raises exposure only +75%.
- `adaptInvest` slider is inert (header display only); `residualRisk` *increases* with adaptation
  cost, the opposite of an adaptation-benefit relationship.
- No EAL, no insurance pricing, no affordability cliff, no managed-retreat economics.

**Framework alignment:** IPCC AR6 WGI Ch.9 (SLR scenarios) — the 20–200 cm slider spans the AR6
likely-to-high-impact range but is not tied to SSPs · FEMA NFIP / Risk Rating 2.0 — insurance-gap
concept only; RR2.0 actually prices per-property using catastrophe-model loss cost, replacement
value and distance-to-water · Swiss Re coastal-resilience research is cited in the guide as the
premium-withdrawal evidence base; the module's penetration numbers are random · UNDRR/Sendai not
referenced.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Coastal flood expected annual loss and insurability forecasting for mortgage books, muni-bond
screening, and reinsurance pricing at city/ZCTA granularity — replacing the seeded city table.

### 8.2 Conceptual approach
Compound coastal-flood hazard chain (mean SLR + tide + surge extreme-value distribution → depth →
damage), following **First Street Foundation NFM** and **CoreLogic/RMS North Atlantic surge**
methodology, with the FEMA BCA damage functions and a premium model per NFIP Risk Rating 2.0
principles.

### 8.3 Mathematical specification

```
Water level:   WL_T,t = MSL_t(SSP) + Tide_99 + GEV⁻¹(1−1/T; μ,σ,ξ)      T ∈ {10,50,100,500}y
               MSL_t from IPCC AR6 regional SLR projections (median + p83)
Inundation:    depth_p,T,t = max(0, WL_T,t − elev_p)                    (parcel DEM elevation)
Damage:        dmg_p,T,t = DDF_class(depth) × RCV_p                     (USACE/FEMA depth-damage)
EAL:           EAL_p,t = ∫ dmg dF ≈ Σ_T Δ(1/T) × avg(dmg_T, dmg_T+1)
Premium:       prem_p,t = EAL_p,t × (1+load)/(1−exp_ratio),  load ≈ 0.35 (cat load, sigma studies)
Cliff year:    t* = min{t : prem_p,t > 1% × PropertyValue_p}
City rollup:   EAL_city = Σ_p EAL_p ;  InsGap = Σ_p EAL_p×(1−insured_p)/Σ_p EAL_p
```

| Parameter | Calibration source |
|---|---|
| Regional MSL_t | IPCC AR6 / NASA sea-level projection tool (free) |
| GEV surge params | GESLA-3 tide-gauge extremes (free); NOAA CO-OPS for US |
| DDF curves | USACE Generic Depth-Damage / FEMA BCA Toolkit v6 (public) |
| RCV, elevation | Lidar DEMs (USGS 3DEP, Copernicus DEM free); assessor values |
| Cat load | Swiss Re sigma expense/load benchmarks |
| insured_p | NFIP OpenFEMA policy data (US, free); national penetration elsewhere |

### 8.4 Data requirements
Parcel/asset points with elevation (platform PostGIS layer exists), IPCC AR6 SLR API pulls into
`reference_data`, GESLA extremes, portfolio LTV/collateral values from lending contexts. Vendor
upgrades: First Street (US), Fathom global flood maps.

### 8.5 Validation & benchmarking plan
Backtest modelled 100-y depths against observed surge events (Katrina, Sandy, Haiyan footprints in
EM-DAT/USGS high-water marks); reconcile city EALs to Swiss Re sigma and World Bank city studies
(±50% order-of-magnitude gate); sensitivity to ξ (GEV shape) and DDF class; p50 vs p83 SLR
scenario spread reported as model uncertainty.

### 8.6 Limitations & model risk
Defences (seawalls, levees) materially cut losses — without a defence layer, cap modelled EAL by a
protection-standard mask (FLOPROS database) or losses overstate 2–10×. DDFs are US-calibrated;
apply regional adjustment for building stock. SLR beyond 2100 and Antarctic-instability tails are
deep uncertainty — report low-likelihood/high-impact (2 m) as a separate stress, not in EAL.
