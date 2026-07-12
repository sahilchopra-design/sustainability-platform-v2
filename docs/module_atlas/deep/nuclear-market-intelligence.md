## 7 · Methodology Deep Dive

This module is almost entirely **static, real-world reference data** — it is closer to a curated
market almanac than a calculation engine. The guide's "Uranium Spot Price Model" formula
(`Spot = Supply–Demand Balance + Speculative Premium + Policy Shift Indicator`) is descriptive
framing for the module's *content*, not an implemented pricing model; there is no spot-price
calculation anywhere in the file (uranium price series live in the separate `nuclear-fuel-cycle`
module).

### 7.1 What the module computes

Nine static reference tables carry almost all of the module's informational content:

- **`GLOBAL_FLEET`** (10 countries) — operating/building/planned reactor counts, net GW, % of
  national electricity, primary vendor. Figures (USA 93 operating/95.5 GW, France 56/61.4 GW,
  China 56 operating + 27 building, Germany phased out 2023) match real IAEA PRIS-class fleet
  statistics closely.
- **`NEW_BUILD`** (8 flagship projects) — Hinkley Point C ($46bn, EPR, 2029 COD), Vogtle 3+4
  (complete 2023/24, $35bn), Akkuyu, El-Dabaa, Rooppur, Barakah, Paks II, Flamanville 3 — capex and
  COD figures are consistent with widely reported project cost overruns (Hinkley's $46bn and
  Vogtle's $35bn both match commonly cited public figures for these specific projects).
- **`EXPORT_MARKETS`** (8 emerging nuclear markets) — Poland, Czech Republic, Saudi Arabia,
  Indonesia, Ghana/Kenya, Kazakhstan, India, Brazil — with a qualitative `risk` rating (Low/Medium/
  High), not a scored risk model.
- **`VENDORS`** (8 reactor vendors) — Rosatom 28% export share, CGN/CNNC 20%, Westinghouse 14%,
  KEPCO 9%, EDF/Framatome 7% — plausible relative rankings (Rosatom's dominant export share and
  Westinghouse's post-Vogtle position are consistent with the real vendor landscape) with a
  supporting `mw_export` figure per vendor.
- **`COP28_COMMITMENTS`** — the real **"Triple Nuclear Capacity by 2050"** declaration (25
  signatories, 372 GW baseline → 600 GW target, adopted December 2023 at COP28) — this is an
  accurate real-world figure and date.
- **`FINANCING`** (6 structures) — CfD/PPA, Export Credit Agency, MDB development finance, ATOM
  bonds, DOE Loan Programs Office guarantees, and the UK's Regulated Asset Base (RAB) model
  (Sizewell C, ~6.5% allowed return) — correctly named real nuclear-project financing mechanisms.

### 7.2 Parameterisation — the two derived series

```js
fleetGrowth[i]  = { operable: 372 + annualAddition×i − 4×i,        // linear net-addition model
                    building: 90 − 2×i + sr(i×5)×20 }              // linear decline + small PRNG jitter
exportPipelineData[m] = { capex: gwPlanned × 6 }                    // flat $6bn/GW capex assumption
```

`372` (2025 baseline operable reactors) and the `600` GW 2050 target slider default both trace
directly to the real COP28 declaration figures above — a genuine anchor point, even though the
year-by-year interpolation between them is a simple linear model, not a project-by-project pipeline
roll-up.

### 7.3 Calculation walkthrough

1. User sets `annualAddition` (net new reactors/yr) and `gwTarget2050` sliders.
2. `fleetGrowth` extrapolates `operable` reactor count linearly from the 372-unit 2025 baseline,
   netting a flat "4 retirements/yr" assumption against the slider's addition rate — a first-order
   approximation with no country-level or reactor-lifetime detail.
3. `exportPipelineData` values each `EXPORT_MARKETS` row's implied capex at a flat $6bn/GW — a
   single blended rate that doesn't differentiate reactor technology (AP1000 vs. VVER vs. SMR) or
   country risk premium, despite the same table carrying a `risk` field that isn't fed into the
   capex estimate.
4. All other tabs (Vendor Landscape, Policy & COP28, Fuel Supply Chain reference, Financing
   Structures, SMR Market) render the static tables directly with filtering/sorting, no additional
   computation.

### 7.4 Worked example

`annualAddition=15` (default), year `i=5` (2030): `operable = 372+15×5−4×5 = 372+75−20 = 427`
reactors. `building = 90−2×5+sr(25)×20`. `sr(25)`: `sin(26)=0.7626`, ×10000=7626.3, `frac=0.2628`
(`floor(7626.3)=7626`, remainder 0.3, recompute precisely: `sin(26 rad)`; using radians,
`sin(26)≈0.7626`) → `building ≈ 90−10+0.2628×20 = 80+5.26=85.3 → 85` (rounded). By 2030 the model
projects **427 operable reactors** (net +55 from the 372 baseline) — a materially slower ramp than
the COP28 600 GW-by-2050 target implies if reactors averaged ~1 GW each (600−372=228 net reactor-
equivalents needed over 25 years ≈ 9.1/yr net, close to the 15/yr gross addition minus 4/yr
retirement = 11/yr net assumed here, so the default slider is roughly consistent with, if slightly
ahead of, the COP28 pace).

### 7.5 Data provenance & limitations

- The module's principal value is its **curated, broadly accurate static dataset** — fleet counts,
  flagship project costs, vendor export shares, and the real COP28 declaration — rather than any
  computation.
- `fleetGrowth`'s linear model has no country-level granularity, no reactor-specific construction
  timeline, and a flat retirement-rate assumption (4/yr) that doesn't vary with slider inputs.
- `exportPipelineData`'s flat $6bn/GW capex ignores the very real technology/country cost spread
  visible elsewhere on the same page (Hinkley's EPR at ~$14bn/GW vs. VVER-1200 projects at
  ~$5–6bn/GW in `NEW_BUILD`) — a self-inconsistency between two tabs of the same module.
- No live uranium spot-price feed exists in this file, despite the guide's "Uranium Spot Price
  Model" framing (that content lives in the sibling `nuclear-fuel-cycle` module's `u3o8Spot` series,
  itself `sr()`-seeded, not live).

**Framework alignment:** IAEA PRIS (Power Reactor Information System) — fleet counts are consistent
with PRIS-class real statistics · COP28 Declaration to Triple Nuclear Energy Capacity (Dec 2023) —
accurately represented, real signatory count and target · World Nuclear Association *World Nuclear
Performance Report* — vendor/export-market framing consistent with WNA's annual reporting structure.
