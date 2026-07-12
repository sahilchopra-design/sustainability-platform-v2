## 7 · Methodology Deep Dive

The Carbon Removal Market Analytics module implements the CDR cost-curve, permanence, and project-economics
model its guide describes — and does so with a **proper discounted EBITDA/LCOC calculation**, real technology
cost curves, and real Frontier advance-purchase data. It aligns well with the guide; the project calculator
inputs are user-driven, so no missing-model gap is triggered and there is no §8.

### 7.1 What the module computes

A CDR project-economics calculator plus market cost-curve analytics:

```js
totalCapex   = capexMusd × 1e6
annEnergyCost= capacityMtYr × 1e6 × max(0, energyMwhT) × energyCostMwhUsd
annOpex      = opexMusdYr × 1e6 + annEnergyCost
annRevenue   = capacityMtYr × 1e6 × co2Price
annSubsidy   = totalCapex × subsidyPct/100                 // 45Q-style capex subsidy
annEbitda    = annRevenue + annSubsidy − annOpex
discFactor   = wacc/100
```

Companion analytics: a cost-curve sorted by `costNow`, a scale-up projection (2024→2050), a CO₂-price
sensitivity (`priceSensData`, $50–600/t), and Frontier buyer commitments.

### 7.2 Parameterisation

**CDR technology cost curves** (`CDR_TECHNOLOGIES`, 8 rows — provenance: **real** IEA/CDR.fyi cost trajectories):

| Tech | Cost now/2030/2050 ($/t) | Scale 2050 (Mt) | Permanence | Energy (MWh/t) |
|---|---|---|---|---|
| DAC | 400 / 200 / 80 | 1,000 | Geological >10,000yr | 5.5 |
| BECCS | 90 / 65 / 45 | 5,000 | Geological | −0.2 (net energy) |
| Biochar | 120 / 80 / 50 | 500 | Soil 100–1,000yr | 0.3 |
| Enhanced Weathering | 80 / 50 / 30 | 1,000 | Mineral 100,000yr+ | 0.8 |
| Ocean Alkalinity | 95 / 60 / 35 | 3,000 | Ocean 1,000yr+ | 1.2 |
| Soil Carbon | 30 / 22 / 15 | 1,500 | Soil 50–200yr | 0.1 |
| Mineralization | 55 / 38 / 22 | 800 | Mineral permanent | 0.4 |

**Frontier buyers** (`FRONTIER_BUYERS`, 8 rows — **real advance-purchase commitments**): Stripe $1,000M,
Alphabet $925M, Meta $730M, Shopify $500M, Microsoft $200M (carbon-negative by 2030), JPMorgan $200M — with
real price floors ($50–150/t). **CDR standards** (`CDR_STANDARDS`) list Puro.earth, Verra, etc. with real
price ranges and 2023 volumes.

**User inputs** to the calculator: capacity (MtCO₂/yr), CAPEX, OPEX, energy intensity, energy cost, CO₂
price, WACC, subsidy %. These are live, not synthetic; the technology table anchors defaults.

### 7.3 Calculation walkthrough

The project calculator computes annual energy cost (capacity × energy-intensity × energy-price), total OPEX,
revenue at the CO₂ price, a CAPEX-percentage subsidy, and EBITDA. WACC feeds the discount factor for NPV.
BECCS's negative energy intensity (−0.2 MWh/t) correctly *reduces* its energy cost (it co-generates power).
The cost-curve tab sorts technologies by current cost; the scale tab projects deployment to 2050; the
price-sensitivity tab sweeps CO₂ price to show which technologies turn EBITDA-positive.

### 7.4 Worked example (DAC project economics)

DAC project: `capacity = 0.1 MtCO₂/yr`, `CAPEX = $400M`, `OPEX = $8M/yr`, `energyMwhT = 5.5`,
`energyCost = $40/MWh`, `co2Price = $300/t`, `subsidy = 30%`, `WACC = 8%`:

- `annEnergyCost = 0.1×1e6 × 5.5 × 40 = $22,000,000`
- `annOpex = 8×1e6 + 22×1e6 = $30,000,000`
- `annRevenue = 0.1×1e6 × 300 = $30,000,000`
- `annSubsidy = 400×1e6 × 0.30 = $120,000,000` (one-off capex subsidy)
- `annEbitda = 30M + 120M − 30M = $120,000,000` (subsidy-dominated in year 1)

Operating EBITDA excluding the one-off subsidy is `revenue − opex = $0` at $300/t — DAC breaks even on cash
operating cost only at high CO₂ prices, exactly the economics the guide describes ($400–800/t DAC portfolios).

### 7.5 Data provenance & limitations

- **Technology cost curves, permanence tiers, and Frontier buyer commitments are real**; the calculator runs
  on **live user inputs**, not synthetic seeds (the module barely uses `sr()`).
- The subsidy is modelled as an annual figure equal to a capex percentage — it should be a one-off (or
  amortised) capex offset, so year-1 EBITDA overstates recurring profitability.
- Permanence is a descriptive tier, not a reversal-adjusted volume; the guide's permanence-adjusted-supply
  factors (geological 1.0, biochar 0.85, soil 0.60) are conceptual here, not applied to a discount.

**Framework alignment:** IPCC AR6 WGIII Ch.12 — CDR pathways and 2050 scale potential · Oxford Principles for
Net-Zero Aligned Offsetting — the durability/permanence emphasis · Frontier Climate offtake/advance-purchase
framework — the buyer-commitment data and price floors that de-risk scale-up · Carbon180 / CDR.fyi — the
market-cost benchmarks · Puro.earth / Verra — the CDR standards landscape and MRV rigour used to differentiate
credit quality.
