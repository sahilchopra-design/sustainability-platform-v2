## 7 · Methodology Deep Dive

The guide states carbon intensity is computed `CI = AnnualEmissions / AnnualOutput`. In practice the
`carbon_intensity` field is **stored directly** on each of the 30 assets (not derived from an
emissions ÷ output division — indeed several assets carry `annual_output_gwh: 0`, e.g. LNG terminals,
refineries, pipelines, yet still show a CI). The stored values are realistic and fuel-consistent, so
the registry is a faithful *descriptive* facility inventory rather than a calculation engine. This is
a minor guide↔code gap, not a methodological contradiction.

### 7.1 What the module computes

The data layer is a **hand-authored 30-row asset table** (the guide says "30"; the seed schema
reports 31 rows — 30 assets plus a header). Each asset holds: `name, type, fuel, capacity_mw,
annual_output_gwh, carbon_intensity (tCO₂/GWh), country, lat/lng, year, retirement, book_mn, wri_id`.

Only two derived quantities exist:

```js
sectorAvgCI = round( Σ carbon_intensity / ASSETS.length )     // portfolio-mean CI
watchlist   = ASSETS.filter(a => a.carbon_intensity > sectorAvgCI)
```

Everything else is aggregation for charts: `capacityByFuel` (sum MW by fuel, excluding zero-capacity
assets), `ageData` (count by commissioning decade), `retirementTimeline` (count by retirement year).

### 7.2 Parameterisation / scoring rubric

Carbon-intensity values by fuel track published life-cycle/operational grid factors:

| Fuel | CI in registry (tCO₂/GWh) | Real-world anchor |
|---|---|---|
| Coal | 890–1,100 | ≈820–1,050 gCO₂/kWh operational (IEA); brown coal highest (Polish 1,080) |
| Gas (CCGT) | 380–410 | ≈350–450 gCO₂/kWh CCGT |
| Oil / oil sands | 195–580 | refining + heavy oil |
| Nuclear | 5–6 | ≈5–12 gCO₂/kWh lifecycle (IPCC) |
| Hydro | 4–18 | ≈4–24 gCO₂/kWh (reservoir-dependent) |
| Wind | 10–13 | ≈11–12 gCO₂/kWh |
| Solar | 7–9 | ≈8–48 gCO₂/kWh (technology-dependent) |
| Biomass | 45–50 | net-of-biogenic operational estimate |

| Constant | Value | Provenance |
|---|---|---|
| `FUEL_COLORS` | 8 fuels | Display taxonomy |
| `wri_id` | e.g. `AUS0001234` or `-` | WRI GPPD cross-reference placeholder (power plants only) |
| Watchlist rule | `CI > sectorAvgCI` | Simple above-mean flag |

All 30 rows are **editorial synthetic assets** (fictional names — "Blackrock Coal Station", "Sahara
Solar Park"); the CI/capacity magnitudes are realistic but not tied to real registered plants.

### 7.3 Calculation walkthrough

Load the 30-asset table → apply the fuel filter → the six tabs render: geographic map (lat/lng),
CI-by-asset ranking, capacity mix pie (fuel sum, zero-capacity assets excluded), age histogram by
decade, WRI GPPD cross-reference table, and the watchlist (assets above the sector-mean CI). The
single scalar driving the watchlist and the KPI is `sectorAvgCI`.

### 7.4 Worked example

`sectorAvgCI` over the 30 assets: summing the `carbon_intensity` column (coal-heavy: 920, 1100, 950,
1010, 1080, 890, 1010… plus low-carbon renewables 4–18 and gas 380–410) gives a total ≈ 11,000
tCO₂/GWh across 30 assets, so:
```
sectorAvgCI = round(11,000 / 30) ≈ 367 tCO₂/GWh
```
The watchlist then flags every asset above ≈367 — i.e. all coal (890–1,100), oil sands (580) and gas
CCGTs at 380–410, while renewables and nuclear fall below. A single coal supercritical unit at 950
sits ~2.6× the portfolio mean, which is the intended "stranded-asset candidate" signal.

### 7.5 Companion analytics

- **WRI GPPD cross-reference:** each power plant carries a synthetic `wri_id`; non-generation assets
  (terminals, refineries, pipelines, mines) show `-`. This mirrors the real WRI **Global Power Plant
  Database** (~35,000 plants) which the guide references as the intended external join key.
- **Age & retirement:** commissioning decade and planned `retirement` year drive stranded-asset
  timing views — the retirement dates (coal 2028–2032, gas/renewables 2040–2060) encode an implicit
  transition ordering.

### 7.6 Data provenance & limitations

- **All 30 assets are synthetic/editorial**; names are fictional and the WRI IDs are placeholders,
  not live GPPD keys. No PRNG is used — the table is static and hand-curated.
- `carbon_intensity` is a **stored attribute, not computed** from emissions/output; the guide's
  `CI = AnnualEmissions/AnnualOutput` formula is not executed (and could not be for zero-output
  assets). CI magnitudes are nonetheless realistic and fuel-appropriate.
- No emissions totals, no financial stranding NPV — this is an inventory/screening layer that feeds
  downstream modules (decommissioning, revenue-split) rather than a valuation engine.

**Framework alignment:** **WRI Global Power Plant Database** — the intended cross-reference for
plant-level capacity/fuel/location (the `wri_id` join); **EPA GHGRP** and **EU ETS EUTL** — named as
the authoritative facility-emissions registries a production build would source `carbon_intensity`
from (GHGRP reports verified facility CO₂; EUTL holds installation-level verified emissions). The
module approximates these with a static realistic table.
