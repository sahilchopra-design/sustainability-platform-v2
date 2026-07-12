## 7 · Methodology Deep Dive

The Carbon Calculator is one of the platform's genuinely production-grade modules: it implements the
GHG Protocol activity-based inventory faithfully, with real emission-factor libraries, a correct dual
Scope-2 (market vs location) waterfall, all 15 Scope-3 categories, and PCAF-style data-quality scoring.
It matches its guide closely; no model-specification gap is triggered, so there is no §8.

### 7.1 What the module computes

Every emission line follows the GHG Protocol master equation `emissions = activity × EF` with explicit
unit conversions:

```js
// Scope 1 — four source types (all → tCO2e)
stationary : (qty × EF_fuel.factor) / 1000          // kgCO2e → t
mobile     : (distance × fleetSize × EF_veh.factor) / 1e6   // gCO2e → t
process    : (qty × process.ef) / 1000              // kgCO2e → t
fugitive   : (charge × leakRate/100 × refrigerant.gwp) / 1000   // charge×leak×GWP

// Scope 2 — location-based
elecT = elecKwh × gridFactor(country) / 1e6
S2_loc = elecT + heatT + coolT

// Scope 2 — market-based waterfall (REC → PPA → residual)
S2_mkt = PPA_covered×supplierEf + residual_kWh×(residualEf | gridFactor) + heat + cool

grandTotal       = S1 + S2_location + S3
grandTotalMarket = S1 + S2_market   + S3
intensityRevenue = grandTotal / (revenue/1e6)      // tCO2e per $M
```

### 7.2 Parameterisation / emission-factor provenance

The module ships large **real** factor tables (`EMISSION_FACTORS`, `GRID_INTENSITY`, `INDUSTRY_PROCESSES`,
`REFRIGERANT_TYPES`, plus Scope-3 spend/activity libraries). Provenance is cited inline on each seed row
(`source` field):

| Table | Rows | Source (per inline `source`) |
|---|---|---|
| FUEL_TYPES / energy EF | 11 | IPCC AR6 / DEFRA 2023 / IEA |
| INDUSTRY_PROCESSES | 9 | process-specific `ef` with `source` cited |
| REFRIGERANT_TYPES | 9 | IPCC AR6 GWP100 (e.g. HFC-134a = 1430) |
| WASTE_TYPES | 14 | DEFRA / EPA |
| FREIGHT_MODES | 12 | DEFRA 2023 |
| COMMUTE_MODES / BIZ_TRAVEL | 9 / 10 | DEFRA 2023 |
| SPEND_SECTORS (Scope 3) | 19 | EEIO spend factors |
| CAPITAL_GOODS / PRODUCT_USE / EOL | 8 / 11 / 6 | GHG Protocol category guidance |
| GRID_INTENSITY | per-country | IEA country grid gCO₂/kWh (fallback 400) |
| PCAF_ASSET_CLASSES | 8 | PCAF method + typical DQS |

Refrigerant fugitive emissions correctly use **GWP100** (not an EF), matching IPCC AR6 values. The Scope-3
Category 6 commute/travel modes carry a `pct` share for allocation. The default `heatEf` (0.18 kgCO₂e/kWh)
and residual grid fallback (400 gCO₂/kWh) are the only heuristic constants.

### 7.3 Calculation walkthrough

Scope 1 sums four independent source lists (stationary, mobile, process, fugitive), each mapped to its
factor table with the correct unit divisor (÷1000 for kg, ÷1e6 for g). Scope 2 runs **both** methods per
facility: location-based multiplies electricity by the country grid factor; market-based runs a
contractual-instrument waterfall — RECs zero out covered kWh, PPAs apply a supplier-specific EF to the
next tranche, and the residual is charged at a residual-mix or grid factor. Scope 3 evaluates each of the
15 categories by its chosen methodology (spend × EEIO factor, or activity × custom EF, or supplier data).
A DQS-weighted average (`Σ dqs×emissions / Σ emissions`) gives inventory data quality. Intensity metrics
divide the grand total by revenue and headcount.

### 7.4 Worked example (mixed inventory)

**Scope 1 stationary** — natural gas 500,000 kWh, EF 0.18316 kgCO₂e/kWh:
`(500,000 × 0.18316)/1000 = 91.58 tCO₂e`.

**Scope 1 fugitive** — HFC-134a, charge 100 kg, leak 5%, GWP 1430:
`(100 × 0.05 × 1430)/1000 = 7.15 tCO₂e`.

**Scope 2** — facility in a 233 gCO₂/kWh grid, 1,000,000 kWh electricity, 400,000 kWh covered by RECs,
no PPA:
- Location-based: `1,000,000 × 233 / 1e6 = 233 tCO₂e`.
- Market-based: RECs cover 400k kWh → residual 600k kWh at grid factor → `600,000 × 233 / 1e6 = 139.8
  tCO₂e`. The 93.2 t gap is the contractual-instrument benefit — exactly the GHG Protocol Scope 2 dual-
  reporting mechanic.

**Scope 3 Cat 1 (spend)** — $250,000 procurement at EEIO factor 0.42 kgCO₂e/$:
`(250,000 × 0.42)/1000 = 105 tCO₂e`. If Cat 1 DQS=4 and dominates, `scope3DqsAvg → 4`.

`grandTotal (location) = 91.58 + 7.15 + 233 + 105 = 436.7 tCO₂e`; market-based swaps 233→139.8 →
`343.5 tCO₂e`.

### 7.5 Data provenance & limitations

- **Emission factors are real and cited** (DEFRA 2023, IPCC AR6 GWP100, IEA grid factors, EEIO spend
  factors) — this module is *not* synthetic; user activity data drives the numbers.
- Simplifications vs production: grid fallback of 400 gCO₂/kWh when a country isn't found; default heat EF
  0.18; no time-series of grid factors (single current value); Scope-3 spend method is EEIO-average, which
  the guide's data-quality flag correctly marks as low DQS (4–5).
- Uncertainty ranges are noted in the guide but the calculator reports point estimates plus a DQS score
  rather than IPCC uncertainty propagation.

**Framework alignment:** GHG Protocol Corporate Standard (2004/2015) — the activity×EF spine and Scope 1
four-source decomposition · GHG Protocol Scope 2 Guidance (2015) — the market/location dual reporting and
the REC→PPA→residual-mix hierarchy implemented in `calcS2Market` · GHG Protocol Scope 3 Standard (2011) —
all 15 categories with spend/activity/supplier methods · IPCC AR6 — GWP100 values for refrigerants and
fuels · PCAF — the DQS 1–5 data-quality scoring and asset-class table for the Category-15 financed-
emissions path.
