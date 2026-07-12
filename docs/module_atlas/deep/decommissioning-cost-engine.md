## 7 · Methodology Deep Dive

This module implements its guide faithfully — a **real deterministic ARO (asset-retirement-obligation)
cost model**: `Liability = Units × CostPerUnit`, `Gap = Liability − Provision`, plus inflation
compounding and a timeline decay curve. No PRNG drives the numbers; asset unit costs and provisions
are curated static inputs. No ⚠️ mismatch.

### 7.1 What the module computes

```js
calcCost(asset, scenario):
  unitCost = asset[scenario]            // low | mid | high $/unit
  if unit == '$/kW':  return round(unitCost × totalCapacity / 1000)   // kW→ capacity, /1000 → $M
  else:               return round(unitCost × totalCapacity)          // $M/km or $M/unit

estimated = calcCost(asset, scenario)
inflated  = round(estimated × (1 + inflation/100)^(planYear − 2026))  // real→nominal compounding
gap       = max(0, estimated − provision)
totalGap  = max(0, Σestimated − Σprovision)
```

### 7.2 Asset parameterisation

| Asset | unit | low / mid / high | count | capacity | provision ($M) | jurisdiction |
|---|---|---|---|---|---|---|
| Coal Plant | $/kW | 50 / 100 / 150 | 12 | 8,400 | 420 | Multi |
| Nuclear Plant | $/kW | 500 / 750 / 1000 | 4 | 4,200 | 2,100 | NRC/ONR |
| Oil Platform | $M/unit | 10 / 30 / 50 | 18 | 18 | 280 | BSEE/OPRED |
| Gas Pipeline | $M/km | 1 / 3 / 5 | 6 | 1,200 | 1,800 | PHMSA/HSE |
| Oil Refinery | $M/unit | 80 / 200 / 400 | 5 | 5 | 520 | EPA/EA |
| LNG Terminal | $M/unit | 50 / 120 / 250 | 3 | 3 | 180 | FERC |
| Gas Power Plant | $/kW | 20 / 40 / 70 | 15 | 12,000 | 240 | Multi |
| Cement Plant | $M/unit | 15 / 35 / 60 | 8 | 8 | 140 | EPA/EA |

Unit-cost ranges align with the guide's provenance: coal $50–150/kW, nuclear $500–1000/kW, oil
platform $10–50M, pipeline $1–5M/km — plausible industry decommissioning benchmarks. Jurisdiction
strictness scores (US 85, EU 92, UK 88, AU 78, CA 82) are curated in `JURISDICTIONS`.

### 7.3 Calculation walkthrough

For each asset, `calcCost` picks the scenario unit cost and multiplies by capacity (with `/1000` for
$/kW so the answer is $M). `inflated` compounds `estimated` forward `planYear − 2026` years at the
slider inflation rate. `gap` floors at 0. Portfolio KPIs sum across the 8 assets; the funding-gap %
is `100 × totalGap / totalEstimated`. The **timeline** curve models cumulative spend as
`totalEstimated × (1 − e^(−0.15(i+1))) × (1+inflation)^i` — an exponential-approach retirement
schedule (fastest early, asymptotes to full liability), against provisions growing linearly at 5%/yr.

### 7.4 Worked example

Coal Plant, mid scenario, 4% inflation, plan year 2030:
- `unitCost = 100 $/kW`, `capacity = 8400` → `estimated = round(100 × 8400 / 1000) = $840M`.
- `inflated = 840 × (1.04)^(2030−2026) = 840 × 1.04^4 = 840 × 1.1699 = $983M`.
- `gap = max(0, 840 − 420) = $420M` (50% unfunded).
Nuclear mid: `750 × 4200 / 1000 = $3,150M` estimated, provision 2,100 → gap $1,050M. Summing all 8
assets' estimated vs provision gives the portfolio funding gap the KPI reports (guide illustration:
~$8.2B liability, ~$3.1B gap ≈ 38% unfunded).

### 7.5 Data provenance & limitations

- Asset unit costs, counts, capacities and provisions are **curated static demo values** (no live
  balance-sheet feed); ranges are anchored to public decommissioning benchmarks but the specific
  portfolio is illustrative.
- Inflation is a single flat rate applied uniformly — real AROs use asset-specific escalation and a
  credit-adjusted risk-free discount rate (IFRS/US-GAAP ARO accounting discounts the liability to PV;
  this model compounds *forward* to nominal cost without discounting back).
- The 0.15 decay constant and 5%/yr provision growth in the timeline are illustrative shape
  parameters, not calibrated schedules.

**Framework alignment:** IAS 37 / ASC 410-20 (Asset Retirement Obligations) — the Liability = cost,
Gap = cost − provision framing mirrors ARO accounting, though a compliant model would recognise the
liability at present value using a credit-adjusted risk-free rate and accrete it over time. National
regimes (US EPA/NRC/BSEE financial-assurance bonds, UK OPRED decommissioning security agreements, EU
IED permit-surrender, OSPAR offshore obligations) drive the jurisdiction strictness overlay — these
determine the *bonding* requirement the funding gap must ultimately be secured against.
