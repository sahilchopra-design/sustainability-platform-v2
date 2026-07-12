## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** MODULE_GUIDES describes a **Marine Climate Risk Index (MCRI)**
> composite — `MCRI = Σ(Hazardᵢ × Exposureᵢ × Sensitivityᵢ) / AdaptiveCapacity`, aligned to IPCC
> SROCC 2019 and the UNEP-WCMC Ocean Risk and Resilience Action Alliance. **No such formula exists
> in the code.** The page instead generates five *independent* random indicators per ocean zone
> (health index, sea-surface temperature, acidification, dissolved O₂, fish-stock health) from the
> platform's seeded PRNG, with no hazard/exposure/sensitivity/adaptive-capacity structure connecting
> them. The sections below document what the code actually computes; §8 specifies the MCRI model
> the guide describes, for future implementation.

### 7.1 What the module computes

For each of a fixed set of ocean zones, five independently-seeded metrics are drawn per zone index `i`:

```js
healthIdx        = round(sr(i*7)*40 + 40)          // 40–80
sst               = sr(i*11)*4 + 22                 // 22–26 °C
acidification     = sr(i*13)*0.3 + 7.8               // pH 7.8–8.1
o2                = sr(i*17)*3 + 4                   // 4–7 mg/L
fishStockPct      = round(sr(i*19)*50 + 30)          // 30–80%
overfished        = round(sr(i*23)*40)               // 0–40%
mpasPct           = sr(i*29)*30 + 2                  // 2–32%
plasticDensity    = round(sr(i*31)*50000 + 500)      // particles/km²
blueGDP           = sr(i*37)*50 + 2                  // $2–52B
shippingRoutes    = round(sr(i*41)*200 + 10)
coralCoverage     = round(sr(i*43)*60)
mangroveKm2       = round(sr(i*47)*5000)
```

A 6-year trend series per zone extrapolates `healthIdx` linearly (−5 baseline, +1.5/yr drift) and
`sst` (+0.1 °C/yr) with additional seeded noise — a crude warming trend overlay, not a physically
modelled SST projection.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Health index base range | 40–80 | Synthetic demo value, no source |
| SST range | 22–26 °C | Synthetic demo value; plausible tropical/temperate SST but not location-specific |
| Acidification (pH) range | 7.8–8.1 | Broadly consistent with observed global mean ocean pH (~8.05, IPCC SROCC) but not derived from it |
| SST warming drift | +0.1 °C/yr | Synthetic; roughly in the observed range (IPCC AR6: +0.88 °C since 1850 for upper ocean) but arbitrary per-zone |
| Risk tier bands | composite > 65 High / > 40 Medium / else Low (pattern shared across platform) | Not present in this module's `computed` list at all — no risk tier field is derived from the five random indicators |

None of these constants are IPCC SROCC- or Aqueduct-sourced; they are seeded pseudo-random draws
bounded to plausible-looking ranges.

### 7.3 Calculation walkthrough

1. `ASSETS`/zone table is generated once at module load via `sr(seed)`, seeded by zone index and a
   per-metric offset (7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47) so each metric is statistically
   independent of the others for a given zone.
2. `filtered` applies search/ocean-basin filters and an in-place `.sort()` on the filtered copy.
3. `stats` aggregates `avgHealth`, `avgSST`, and a `critical` count over `filtered`, each guarded
   with `|| 0` division-safety.
4. `oceanAgg` re-aggregates the *unfiltered* `ZONES` array by ocean basin (health/SST/fish-stock
   sums ÷ zone count `n`), independent of the page's search/filter state — a display inconsistency
   worth noting (basin roll-up ignores active filters while the KPI cards respect them).
5. `yearly` builds the 6-year trend overlay described above, purely cosmetic (chart-only).

### 7.4 Worked example

Zone index `i = 5`:

| Metric | Formula | Result |
|---|---|---|
| `healthIdx` | round(sr(35)×40+40) | e.g. 62 |
| `sst` | sr(55)×4+22 | e.g. 23.8 °C |
| `acidification` | sr(65)×0.3+7.8 | e.g. 7.94 |
| `fishStockPct` | round(sr(95)×50+30) | e.g. 58% |

There is no aggregation step combining these into a single "marine climate risk" number — each is
displayed as a standalone KPI/column. A user cannot reconstruct the guide's MCRI from the page's
own outputs because none of Hazard, Exposure, Sensitivity, or Adaptive Capacity are labelled or
computed anywhere in the code.

### 7.5 Data provenance & limitations

- **All zone data is synthetic demo data** from `sr(seed) = frac(sin(seed+1)×10⁴)`; there is no
  ingestion of IPCC AR6 SLR grids, JBA/Aqueduct flood layers, or NOAA acidification time series
  despite the guide's `dataLineage` claiming this pipeline exists.
- No hazard/exposure/sensitivity decomposition, so the module cannot support the guide's stated
  user interaction "Compute MCRI by asset; estimate damage costs and adaptation investment
  requirements" — damage costs and adaptation capex are not computed anywhere in this page.
- Sea-level-rise, storm-surge, and ocean-acidification-*change* (the guide's two headline
  `dataPoints`, 0.63–1.01 m SLR by 2100 and −0.12 pH units since 1850) are absent from the code;
  the module shows only present-day pH level and SST, not the delta-since-preindustrial or a
  future SLR trajectory.

**Framework alignment:** the guide names IPCC SROCC 2019 and IPCC AR6 WG1 Ch.9 as bases for an
MCRI computation; the code implements neither — it is a generic seeded-random "ocean health"
dashboard. UNEP-WCMC ORRAA and Swiss Re Ocean Risk Initiative are cited as references but have no
corresponding logic in the page.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Score climate-driven ocean/marine risk for coastal real assets, fisheries exposure, and blue-economy
financings, producing a single composite index (MCRI) usable in underwriting, portfolio screening,
and adaptation-capex prioritisation — the decision the guide's `userInteraction` list describes.

### 8.2 Conceptual approach
Adopt the standard IPCC risk framework — **Risk = f(Hazard, Exposure, Vulnerability)** — as used in
IPCC AR6 WG2 and mirrored by Swiss Re CatNet and Aqueduct Water Risk methodologies: hazards are
scored independently per peril, combined multiplicatively with asset exposure value and a
sensitivity/vulnerability curve, then normalised by an adaptive-capacity discount (mirrors ND-GAIN
country vulnerability/readiness scoring, and Munich Re NatCatSERVICE's exposure×vulnerability
damage-function convention).

### 8.3 Mathematical specification

```
Hazard_h        = normalised 0–1 intensity of hazard h (SLR, marine heatwave, acidification, storm surge)
Exposure        = asset/fishery value at risk in the zone ($)
Sensitivity_h   = damage-function slope for asset/species class vs hazard h (0–1)
AdaptiveCap     = 0–1 composite of MPA coverage, monitoring density, early-warning infrastructure

MCRI = Σ_h (Hazard_h × Sensitivity_h) × Exposure / max(AdaptiveCap, 0.1)
```

| Parameter | Calibration source |
|---|---|
| SLR by 2100 (SSP5-8.5) | IPCC AR6 WG1 Ch.9, 0.63–1.01 m likely range |
| Acidification Δ pH | IPCC SROCC 2019, −0.12 units since 1850 |
| Marine heatwave frequency | NOAA Coral Reef Watch bleaching-alert-area time series |
| Species sensitivity curves | FAO/IPCC fisheries vulnerability assessments |
| MPA coverage / adaptive capacity | UNEP-WCMC Protected Planet database |

### 8.4 Data requirements
Per-zone: coordinates, asset class, insured/asset value ($), MPA coverage %, historical
bleaching/storm events. Public sources: NOAA Coral Reef Watch (bleaching), IPCC AR6 Atlas (SLR
grids), WRI Aqueduct 4.0 (coastal flood), UNEP-WCMC Protected Planet (MPA). None of this is
currently ingested into the platform's `reference_data` tables for this module.

### 8.5 Validation & benchmarking plan
Backtest composite scores against Swiss Re Ocean Risk Initiative loss data and EM-DAT
storm-surge/coastal-flood events; reconcile SLR outputs against IPCC AR6 regional sea-level
projections; sensitivity-test the AdaptiveCapacity denominator (it dominates the score at low
values — floor it as shown to avoid blow-up).

### 8.6 Limitations & model risk
Multiplicative hazard combination assumes independence across perils (SLR and storm surge are
correlated — a copula or max-of-perils treatment may be more conservative); species/asset
sensitivity curves are thin in public literature outside coral and mangrove ecosystems, so DQ will
be uneven across zones.
