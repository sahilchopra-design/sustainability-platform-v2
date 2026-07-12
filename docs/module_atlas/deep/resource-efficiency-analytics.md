## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states two formulas:
> `EfficiencyROI = (ResourceSavings × ResourcePrice + CarbonSavings × CarbonPrice) /
> EfficiencyInvestment` and `ResourceIntensity = ResourceConsumption / RevenueOrProduction`.
> **Neither is implemented as described.** There is no `revenue`, `production`, or `carbonPrice`
> field anywhere in the code (`grep revenue` returns nothing) — "resource intensity" as a
> revenue-normalised ratio does not exist on the page. The ROI actually computed is the simpler
> `roi = (resourceCostSavings / efficiencyCapex) × 100`, a single-term payback ratio with **no
> carbon-savings/carbon-price component** despite the guide's two-term formula.

### 7.1 What the module computes

70 synthetic companies, each with an independently seeded `resourceEfficiencyScore` (20–96) that
buckets into 4 tiers (`Laggard <35`, `Standard <55`, `Efficient <75`, `Best-in-Class ≥75`):

```
roi = efficiencyCapex > 0 ? (resourceCostSavings / efficiencyCapex) × 100 : 0
avgScore   = Σ resourceEfficiencyScore / n
totalSavings = Σ resourceCostSavings
pctIso50001  = (companies with iso50001=true / n) × 100
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `resourceEfficiencyScore` | 20–96 | Synthetic demo |
| `wasteIntensity` | 2.0–50.0 (t/$M, implied) | Synthetic demo |
| `energyProductivity` | 5.0–60.0% (5yr improvement, implied) | Synthetic demo |
| `iso50001` | boolean, `sr(i×31) > 0.45` → ~55% certified | Synthetic demo |
| `efficiencyCapex` | $1–100M | Synthetic demo |
| `resourceCostSavings` | $0.5–50M | Synthetic demo, independently seeded from `efficiencyCapex` — i.e. a company can show savings exceeding its own capex (ROI > 100%) purely by chance, not because of a modelled payback relationship |
| Tier thresholds (35/55/75) | — | Author-chosen breakpoints, not calibrated to any published resource-productivity benchmark |

### 7.3 Calculation walkthrough

1. `COMPANIES` (70 rows) built once at load; all fields independently seeded via `sr(i×k)`.
2. `filtered` subsets by sector/country/tier selectors; all KPI aggregates (`avgScore`,
   `totalSavings`, `avgEnergyProd`, `pctIso`, `totalCapex`) recompute over the filtered set.
3. `sectorEffData`/`countryEnergyData`/`sectorWaterData` are per-sector or per-country group-by
   means of `resourceEfficiencyScore`, `energyProductivity`, and `wasteIntensity` respectively.
4. `scatterData` plots `efficiencyCapex` (x) vs `resourceCostSavings` (y) per company — the
   "efficiency ROI" scatter the guide describes, but since both axes are independent PRNG draws,
   any visible trend line would be spurious.
5. `roiData` computes the per-company single-term ROI ratio (§7.1) and ranks companies by it.

### 7.4 Worked example

Company with `efficiencyCapex = $42M`, `resourceCostSavings = $18M`:
`roi = (18/42) × 100 = 42.9%` — i.e. the company recovers 43% of its efficiency investment in
**cost savings alone** (not annualised — the code does not specify a payback period, so this ratio
cannot be read as an annual return or IRR without an implicit assumption about the savings horizon
that the page never states).

### 7.5 Companion analytics

- **Efficiency tier distribution** — count of companies per `EFFICIENCY_TIERS` bucket
  (Laggard/Standard/Efficient/Best-in-Class), coloured `T.red/T.amber/T.blue/T.green`.
- **Sector/country cuts** — mean score, energy productivity, and waste intensity by `SECTORS` and
  `COUNTRIES` group-bys.
- **ISO 50001 certification split** — mean `energyProductivity` compared between certified and
  non-certified companies (`avgProd` by `iso50001` boolean) — the one comparison on the page that
  tests a real qualitative hypothesis (does certification correlate with productivity), though
  still against synthetic underlying data.

### 7.6 Data provenance & limitations

- All 70 companies and every numeric field are synthetic, seeded via `sr()`; no field is derived
  from another (score, waste intensity, capex, and savings are all independently drawn), so
  cross-field relationships shown in scatter/bar charts (capex vs savings, ISO cert vs
  productivity) are illustrative only and not evidence of any real efficiency-investment payoff.
- The guide's two-term ROI formula (resource savings + carbon savings, both priced) and the
  revenue-normalised resource-intensity metric are **not implemented** — a user cannot get a
  genuine "$ saved per $ invested including the carbon value of avoided energy/material use" from
  this page.
- `roi` as computed conflates a cumulative-to-date savings figure with an investment amount without
  specifying a time horizon, so it cannot be compared like-for-like across companies with different
  project vintages.

**Framework alignment:** EU Resource Efficiency Scoreboard 2023 (cited for the resource-
productivity concept, not implemented as a €GDP/kg-materials calculation) · WBCSD Resource
Productivity Framework (referenced qualitatively) · IRP Global Resources Outlook 2019 (context
figures only, not wired into any calculation) · SBTN Step 3 land/water guidance (named in
references, no SBTN target-gap logic present in code).
