## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide names an "Agricultural Water Risk Score"
> (`AWRS = Water Stress × Crop Sensitivity × Sourcing Concentration`). **No `AWRS` variable exists in
> code.** The page has no engine and no `sourcingConcentration` field at all — every displayed metric
> (water stress, yield risk, revenue at risk, crop-water footprint) is an independent synthetic field
> per region, not the guide's multiplicative composite. The module is a 40-region agricultural
> water-risk directory with a drought-impact simulator.

### 7.1 What the module computes

40 named agricultural regions (Punjab, Murray-Darling, Central Valley, Nile Delta, North China Plain,
Ogallala, Mekong Delta, São Francisco, Indus Basin, Po Valley, etc.), each independently seeded:
`waterStress` (1.0–5.0), `agWithdrawal` (40–90%), `irrigEfficiency` (30–85%), `groundwaterDepletion`
(0–8), `annualRainfall`, `irrigArea`, `primaryCrop`/`secondaryCrop`, `awsCert` (AWS Alliance for
Water Stewardship certification level), `droughtFreq`, blue/green/grey crop-water footprints
(`cropWaterBlue/Green/Grey`), `yieldRisk` (5–50%), `revenueAtRisk` ($10M–$210M), `waterPrice`,
`reductionTarget`/`currentReduction`, `circularWater`, `investmentNeeded`, and a 6-year `yearlyStress`/
`yearlyYield` trend.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `waterStress` | 1.0–5.0 | `1 + s1×4`, synthetic uniform, independent of region name plausibility |
| `agWithdrawal` | 40–90% | `40 + s2×50` |
| `yieldRisk` | 5–50% | `5 + sr(i·59+27)×45` |
| `revenueAtRisk` | $10M–$210M | `10 + sr(i·61+29)×200` |
| `cropWaterBlue/Green/Grey` | 200–2,000 / 500–4,000 / 50–500 m³/t | Synthetic, but plausible relative ordering (green > blue > grey, consistent with real water-footprint literature convention) |
| `awsCert` | `AWS_LEVELS` random pick | Synthetic |

The `cropWaterData` table (aggregated by crop, not region) independently re-derives blue/green/grey
footprints per crop using a *different* seed formula (`sr(ci·17+1)` etc.) than the per-region fields —
two different code paths computing conceptually the same quantity with no cross-check between them.

### 7.3 Calculation walkthrough

1. `stats` aggregates `filtered` regions: `avgStress`, `totalIrrigArea`, `avgEfficiency`,
   `highRiskPct` (share with `waterStress > 2.5`), `totalRevAtRisk`, `avgDepletion`.
2. **Drought scenario simulator** (`impactData`): for a selected severity index `sevIdx` and duration
   `durMo`, `impact = min(95, floor(base + sevIdx×15 + durMo×5 + sr(id·23)×10))` where `base = r.yieldRisk`
   — a linear severity/duration additive model with random noise, applied per region.
3. `scenarioMatrix` (Drought Severity × Duration grid) uses a *separate* formula:
   `avgYieldLoss = floor(10 + si×15 + dur×2 + sr(si·17+dur·11)×8)` — similar structure but different
   coefficients than `impactData`, so the standalone matrix and the region-level simulator would give
   different yield-loss estimates for nominally the same severity/duration inputs.
4. `historicalDroughts` — 6 hardcoded real-world drought events (2012 US Midwest, 2015 India El Niño,
   2018 Europe Heat, 2019 Australia, etc.) with real-looking `yieldImpact`/`econLoss` figures — the
   only genuinely-sourced-looking data in the file, though no citation is given for the exact numbers.

### 7.4 Worked example

For a region with `yieldRisk = 25%` (`base`), drought severity index `sevIdx = 2` (of the
`DROUGHT_SEVERITY` scale) and duration `durMo = 6` months:

```
impact = min(95, floor(25 + 2×15 + 6×5 + noise)) = min(95, floor(25+30+30+noise)) ≈ min(95, 85+noise)
```

At `sevIdx=2`, the severity and duration terms alone (60 points) already dominate the base yield risk
(25 points) — meaning the simulator's output is driven far more by the two slider inputs than by any
region-specific characteristic, undermining the premise that different regions should respond
differently to the same drought severity/duration based on their real vulnerability.

### 7.5 Data provenance & limitations

- **All 40 regions are synthetic** despite using real basin/region names; no linkage to WRI Aqueduct
  Agriculture, FAO AQUASTAT, or any other named data source exists in the code — the guide's cited
  sources are text-only references, not live data feeds or hardcoded lookup tables.
- **No AWRS multiplicative composite exists** — the guide's core methodology is absent.
- **Two independent, inconsistent formulas** compute drought-impact yield loss (`impactData` vs
  `scenarioMatrix`), which would give different answers for nominally identical inputs — a
  reconciliation bug a model-validation review would flag immediately.
- `historicalDroughts` figures, while plausible, are not sourced/cited to a specific dataset (e.g.
  EM-DAT, USDA) in the code.

**Framework alignment:** WRI Aqueduct Agriculture 2022 and FAO AQUASTAT (both named in the guide) are
**not implemented** as data sources or calculations — see the `water-risk-analytics` module's deep
dive for how real WRI Aqueduct data has been successfully wired into a sibling module and could be
reused here for the `waterStress` field at minimum.
