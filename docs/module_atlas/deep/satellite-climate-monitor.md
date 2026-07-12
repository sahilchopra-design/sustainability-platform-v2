## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states `Hazard Anomaly Index =
> (Current Reading - Baseline Mean) / Baseline sigma` — a genuine statistical z-score against a
> historical baseline. **No z-score, standard deviation, or statistical anomaly test exists
> anywhere in the code.** `thermalAnomaly` is a flat 30%-probability coin-flip
> (`sr(i x 67) > 0.7`); the "baseline" plotted alongside each asset's emissions trend is simply
> `baseEmission x 0.8` (a fixed 80% ratio of the asset's own randomly-generated base value, not an
> independently observed historical mean); and monthly "anomaly counts" are seeded PRNG draws, not
> derived from any reading-vs-baseline comparison.

### 7.1 What the module computes

100 synthetic monitored assets, tiered by a single seed draw:
```
tier      = s<0.10 ? 'Critical' : s<0.35 ? 'High' : s<0.70 ? 'Medium' : 'Low'    // s = sr(i x 7)
anomalies = tier-dependent range: Critical 8-20, High 4-10, Medium 1-4, Low 0-2
baseline  = baseEmission x 0.8                          // fixed ratio, not a historical mean
emissionsTrend[m] = baseEmission + sr((i+1)(m+1)x3) x 80 - 40    // +/-40 monthly noise band
thermalAnomaly    = sr(i x 67) > 0.7                     // ~30% flat probability, no threshold logic
dataQuality       = 60 + sr(i x 71) x 39                  // 60-99
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `tier` thresholds | Critical <10%, High <35%, Medium <70%, Low remainder | Author-chosen tier split, not calibrated to any real anomaly-severity distribution |
| `anomalies` count | Critical 8-20, High 4-10, Medium 1-4, Low 0-2 | Synthetic demo, tier-conditioned but not derived from a real detection algorithm |
| `baseEmission` | 50-250 (units unspecified) | Synthetic demo |
| `ndvi` | 0.2-0.8 | Plausible NDVI (Normalised Difference Vegetation Index) range for vegetated land, correctly bounded [0,1]-ish, but seeded not measured |
| `dataQuality` | 60-99 | Synthetic demo |
| `ASSET_TYPES` (20), `OWNERS` (30) | Real asset-class and real company names (ExxonMobil, Shell, Vale, Glencore, Rio Tinto, Sinar Mas, JBS, Vestas, etc.) | Real, recognisable entities attached to synthetic per-asset monitoring data — same "real name, fabricated numbers" pattern seen elsewhere in this batch |
| `SAT_TYPES` (5) | Optical, SAR Radar, Methane Spectral, Thermal Infrared, Multispectral | Correct real satellite-sensing modality taxonomy |

### 7.3 Calculation walkthrough

1. `ASSETS` (100 rows) generated once; each asset's `riskTier` deterministically drives its
   `anomalies` count range, but the count itself within that range is a further independent PRNG
   draw — there is no underlying physical reading being compared to a threshold.
2. **Methane intelligence tab**: `METHANE_FACILITIES` monthly leak data aggregates
   `Sum(monthlyLeaks[mi].detected)` and mean `leakRate` across 40 facilities per month/sector —
   real aggregation, but over synthetic per-facility leak rates (0.5-80.5 range).
3. **Deforestation tab**: `deforestationByComm` sums `hectaresLost` per commodity across
   `FOREST_ZONES`, and computes mean `supplyChainRisk` per commodity — genuine group-by
   aggregation over synthetic zone-level data.
4. **Portfolio overlay tab**: `discrepancy = (satelliteEmissions - reportedEmissions) /
   reportedEmissions x 100` compares a company's self-reported emissions to a synthetic "satellite
   estimate" (`reportedEmissions x (0.85 + sr()×0.6)`, i.e. satellite reading is a random ±15-45%
   perturbation of the reported figure) — this correctly implements the *concept* of an
   independent-verification gap (the same idea Climate TRACE uses), but the "satellite" side of the
   comparison is fabricated rather than derived from actual remote-sensing data.

### 7.4 Worked example

Portfolio company with `reportedEmissions = 500` (kt CO2e, illustrative units), and seed draw
`s2 = 0.42`: `satelliteEmissions = round(500 x (0.85 + 0.42x0.6)) = round(500 x 1.102) =
551`. `discrepancy = (551-500)/500 x 100 = +10.2%` — flagged as a moderate under-reporting gap.
Because `s2` is an independent PRNG draw rather than an actual satellite reading, this discrepancy
carries no evidentiary weight; it is illustrative of what the analysis *would* look like with real
satellite data.

### 7.5 Data provenance & limitations

- No z-score, standard-deviation, or baseline-comparison statistical test exists despite being the
  guide's headline methodology — "anomaly" flags and counts are unconditioned PRNG draws (tier-
  scaled ranges for the count, flat probability for the thermal flag).
- Real company names (ExxonMobil, Shell, Vale, Glencore, JBS, Vestas, etc.) are attached to
  entirely fabricated per-asset emissions, leak-rate, and deforestation data — this is the module's
  primary risk of misinterpretation if presented outside a clearly-labelled demo context.
- The reported-vs-satellite emissions discrepancy calculation is methodologically sound in form
  (matches how Climate TRACE-style independent verification works) but both sides of the
  comparison in this implementation are synthetic.

**Framework alignment:** ESA Copernicus / Sentinel-1/2, NASA FIRMS, NOAA (satellite programme names
correctly cited as data-source references, none are actually queried) · Climate TRACE-style
independent emissions verification (conceptually correct discrepancy formula, fabricated inputs
on both sides) · standard NDVI vegetation-health index (correctly bounded field, seeded not
measured).
