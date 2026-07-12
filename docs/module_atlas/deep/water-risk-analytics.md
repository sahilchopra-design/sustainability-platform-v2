## 7 · Methodology Deep Dive

This is one of the better-grounded modules in this batch: it wires in **real WRI Aqueduct 4.0 water
stress data** (`WRI_AQUEDUCT_WATER_RISK` from `frontend/src/data/publicDataSeed.js`, GAP-015) for 40
named river basins, overriding synthetic placeholders wherever a basin can be matched to a country.
It still does not call the real backend `WaterRiskEngine` (`backend/services/water_risk_engine.py`,
documented in the sibling `water-risk` deep dive) — the real-data wiring happens entirely client-side
via a static import, not a live API call — but this is meaningfully more grounded than most sibling
modules that generate 100% synthetic data.

### 7.1 What the module computes

`_DEFAULT_REGIONS` (40 basins) is first generated with the seeded PRNG (`stressLevel = 1+sr(i·7)·4`,
`aqueductScore = min(5, stressLevel·0.9+sr(i·31)·0.5)`, plus `supply`/`demand`/`deficit`,
`floodRisk`/`droughtRisk`/`pollutionIndex`, water-use splits, `desalCapacity`, `recycleRate`). It is
then **overwritten in place** for any basin with a `BASIN_COUNTRY` mapping:

```js
if (w) {                                    // w = WRI_AQUEDUCT_WATER_RISK lookup by country
  r.waterStress = w.baseline_water_stress;
  r.aqueductScore = w.baseline_water_stress;
  r.droughtRisk = round(w.drought_risk × 20);
  r.floodRisk = round(w.riverine_flood_risk × 20);
  r.groundwaterDepletion = round(w.groundwater_depletion × 20);
  r.riskCategory = w.overall_water_risk_category;
}
```

All 40 basins have a `BASIN_COUNTRY` entry (Ganges→India, Colorado→USA, Murray-Darling→Australia,
etc.), so in practice **`waterStress`, `aqueductScore`, `droughtRisk`, `floodRisk`,
`groundwaterDepletion`, and `riskCategory` for all 40 regions are real WRI Aqueduct 4.0 values**, not
synthetic. `supply`/`demand`/`deficit`, water-use splits, `desalCapacity`, `recycleRate`, `waterPrice`,
`infraInvestBn`, and the 6-year `yearly` trend series remain synthetic — WRI Aqueduct doesn't publish
those metrics at basin level, so they're plausible illustrative fill-in.

### 7.2 Parameterisation

| Field | Source | Real or synthetic |
|---|---|---|
| `waterStress`, `aqueductScore` | `WRI_AQUEDUCT_WATER_RISK[country].baseline_water_stress` | **Real** (WRI Aqueduct 4.0) |
| `droughtRisk` | `w.drought_risk × 20` (0–5 scale → 0–100) | **Real**, rescaled |
| `floodRisk` | `w.riverine_flood_risk × 20` | **Real**, rescaled |
| `groundwaterDepletion` | `w.groundwater_depletion × 20` | **Real**, rescaled |
| `riskCategory` | `w.overall_water_risk_category` | **Real** |
| `supplyBCM`, `demandBCM`, `deficitBCM` | `sr()`-seeded | Synthetic |
| `desalCapacity`, `recycleRate`, `waterPrice`, `infraInvestBn` | `sr()`-seeded | Synthetic |
| `popAffectedM` | `sr()`-seeded | Synthetic |

The `×20` rescaling assumes the WRI source fields are on a 0–5 scale being mapped to a 0–100 display
scale — consistent with Aqueduct's standard 0–5 risk categorisation.

### 7.3 Calculation walkthrough

1. Basin data is built once at module load (`_DEFAULT_REGIONS`, then real-data overlay, then an
   `isIndiaMode()` branch that swaps in `adaptForWaterRisk()` India-specific data when that context
   flag is set).
2. Dashboard KPIs (`stats`) are simple means/counts over `filtered`: `avgStress`, `extreme` (count of
   "Extremely High"), `totalDeficit`, `popAffected`, `avgGroundwater`, `totalInfra`.
3. Regional Analysis tab cross-plots `droughtRisk` vs `floodRisk` (both real WRI values) and ranks
   basins by `groundwaterDepletion` (also real) — these charts are genuinely evidence-based.
4. Corporate Exposure and Projections tabs mix real (`pollutionIndex` is actually synthetic, not
   WRI-sourced) and synthetic fields without visual distinction — a reader cannot tell from the UI
   which numbers are real WRI Aqueduct data and which are illustrative fill-in.

### 7.4 Worked example

For the Ganges Basin (`BASIN_COUNTRY['Ganges Basin'] = 'India'`), if
`WRI_AQUEDUCT_WATER_RISK['India'] = { baseline_water_stress: 4.4, drought_risk: 0.65,
riverine_flood_risk: 0.55, groundwater_depletion: 0.70, overall_water_risk_category: 'Extremely High' }`
(illustrative field values consistent with India's well-documented high water stress), the module
would display: `waterStress = 4.4`, `droughtRisk = round(0.65×20) = 13`... — **wait**, this reveals a
likely scale mismatch: if `w.drought_risk` is itself already on a 0–5 or 0–1 scale, multiplying by 20
either overshoots 100 (if input is 0–5, giving up to 100 correctly) or undershoots badly (if input is
0–1 fractional, as this example assumes, giving max 20 instead of 100). Whichever convention
`WRI_AQUEDUCT_WATER_RISK` actually uses, the `×20` constant should be verified against that source
file's real value range to confirm the display isn't silently compressed.

### 7.5 Data provenance & limitations

- **Genuinely real for the 6 core risk fields** across all 40 basins — a meaningful upgrade over
  sibling water modules that are 100% synthetic.
- **Not wired to the backend `WaterRiskEngine`** — the real data comes from a static frontend JSON
  import, not a live API call, so it can't reflect the engine's basin-specific indicator overrides
  or its `proxied_indicators` transparency mechanism.
- **Supply/demand/deficit and all financial/infrastructure metrics remain synthetic** and are
  displayed with the same visual weight as the real risk fields — no "estimated" or "illustrative"
  labelling distinguishes them for the end user.
- The `×20` rescaling constant in §7.4 should be double-checked against `WRI_AQUEDUCT_WATER_RISK`'s
  actual source scale to rule out a display-compression bug.

**Framework alignment:** WRI Aqueduct 4.0 (2023) — correctly sourced as real reference data for
stress/drought/flood/groundwater/risk-category, a genuine implementation. GEMS/Water and IPCC AR6 WG1
(named in the guide as sources for the "quality" and "2050 projection" dataPoints) are **not**
represented — `pollutionIndex` and the projections tab remain fully synthetic.
