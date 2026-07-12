## 7 · Methodology Deep Dive

The Carbon Reduction Projects module manages an internal abatement portfolio on a MAC-curve + NPV basis,
matching its guide conceptually. The distinctive feature is that the 25-project dataset is **hand-curated
and internally coherent** (not `sr()`-seeded), but the NPV and MAC figures are *stored*, not computed from
a DCF — so the guide's `Project_NPV = −CapEx + Σ(Savings−OpEx)/(1+r)^t` formula is not actually executed.
§8 specifies the production MAC/NPV engine.

### 7.1 What the module computes

Portfolio aggregates and carbon-price NPV scaling over a curated project list:

```js
totalCo2e   = Σ project.co2e                          // ktCO2e/yr abated
totalCapex  = Σ project.capex                         // $M
totalNpv75  = Σ project.npv75                         // NPV at $75/tCO2 (stored per project)
totalNpv100 = totalNpv75 × 1.31                       // scaling to $100/t
totalNpv150 = totalNpv75 × 1.68                       // scaling to $150/t
totalCobenefitValue = energySav×8.4 + waterSav×1.2 + wasteSav×0.18   // $M co-benefit
```

Each project carries `abatement` (its **marginal abatement cost, $/tCO₂**), `irr`, `payback`, and a
Gantt schedule (`startM`, `dur`). The MAC curve orders projects cheapest-to-most-expensive by `abatement`.

### 7.2 Parameterisation

**Project dataset** (`PROJECTS`, 25 rows — provenance: **hand-curated illustrative portfolio**, realistic
and internally consistent, e.g. LED retrofit MAC −29 $/t through Kiln CCS MAC +114 $/t):

| Field | Meaning | Example |
|---|---|---|
| capex | $M capital | LED retrofit 2.4; Kiln CCS 212.4 |
| co2e | ktCO₂e/yr abated | Offshore wind PPA 112.4 |
| abatement | MAC $/tCO₂ (neg = cost-saving) | Business travel −10; Green H₂ 205 |
| irr / payback | project returns | LED 28.5% / 3.1yr |
| npv75 | NPV at $75/t carbon price | Kiln CCS −18.4 (uneconomic) |
| energy/water/wasteSav | co-benefit quantities | for cobenefit valuation |

**Carbon-price NPV scaling factors** (1.31 for $100, 1.68 for $150 — provenance: fixed heuristic, not
re-derived per project): these assume every project's NPV scales identically with carbon price, which is
only true if carbon revenue is a constant share of each project's cash flow — a simplification.

**Co-benefit prices** (`8.4 $/MWh energy, 1.2 $/m³ water, 0.18 $/t waste` — heuristic shadow values).

**Cumulative pathway** (`CUMULATIVE_DATA`): cumulative abatement 2024→2032 with SBTi milestone flags,
hand-set to level off near 847 ktCO₂e.

### 7.3 Calculation walkthrough

The MAC scatter plots each project at (cumulative abatement volume, MAC) — negative-MAC projects (energy
efficiency, behaviour change) sit left/below, high-MAC removals (green H₂, kiln CCS) sit right/above. The
Gantt lays projects on a month timeline from `startM` for `dur` months. Portfolio KPIs sum co2e, capex,
and NPV, then scale NPV to two higher carbon prices via the fixed factors. Cobenefit value monetises
energy/water/waste savings at flat shadow prices.

### 7.4 Worked example (portfolio NPV + one MAC point)

Suppose the 25 projects sum to `totalNpv75 = $520M`:
- `totalNpv100 = 520 × 1.31 = $681.2M`; `totalNpv150 = 520 × 1.68 = $873.6M`.

MAC point — "Business Travel Carbon Budget" project: `capex = 1.2`, `co2e = 12.4 kt`, `abatement = 10`
(this row's MAC is a positive small number in the data, though behaviour-change measures are often
cost-negative). "LED Lighting Retrofit": `abatement = 29` cost… note the sign convention in this dataset
uses `abatement` as an ordering magnitude; the guide's negative-MAC-first logic is applied by sorting.

Co-benefit: if `totalEnergy = 120 MWh`, `totalWater = 15 m³`, `totalWaste = 6,000 t`:
`totalCobenefitValue = 120×8.4 + 15×1.2 + 6000×0.18 = 1008 + 18 + 1080 = $2,106 → $2.1M`.

### 7.5 Data provenance & limitations

- The project portfolio is **hand-curated illustrative data** (not PRNG-seeded), internally consistent and
  realistic, but not real company projects.
- **NPV is stored, not computed** — the guide's DCF formula is not run; the module cannot re-price a
  project if its cash-flow schedule changes.
- **Carbon-price NPV scaling uses two fixed factors** (1.31, 1.68) applied uniformly, ignoring that carbon
  revenue is a different share of NPV for each project.
- MAC is the stored `abatement` field, not recomputed as `net cost / GHG reduction`.

**Framework alignment:** GHG Protocol Project Protocol (2005) — the baseline/additionality framing behind
each project's abatement claim · McKinsey-style MAC curve — the cheapest-first abatement ordering, cost-
negative projects (efficiency) implemented before cost-positive (removals) · SBTi Corporate Manual — the
cumulative-abatement-vs-target pathway with SBTi milestone flags · IEA Energy Efficiency — the energy-
efficiency category economics. See §8 for the production MAC/NPV engine.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** NPV/MAC are stored, not modelled; this specifies
the engine that should compute them.

### 8.1 Purpose & scope
Compute per-project NPV, IRR, payback, and MAC from a modelled cash-flow schedule under a chosen carbon-
price path, and assemble a portfolio MAC curve and cumulative-abatement trajectory vs an SBTi target, for
corporate decarbonisation capital allocation.

### 8.2 Conceptual approach
Discounted-cash-flow project economics plus a MAC-curve constructor, benchmarked against the GHG Protocol
Project Protocol and McKinsey global-abatement-cost-curve methodology. Each project's cash flow is built
from avoided energy cost, avoided carbon cost (at the price path), OPEX, and CAPEX; MAC is the levelised
net cost per tonne.

### 8.3 Mathematical specification

```
Savings_t = EnergySaved·P_energy,t + CO2Abated·P_carbon,t + Cobenefit_t
FCF_t     = Savings_t − OPEX_t
NPV       = −CAPEX + Σ_{t=1}^{L} FCF_t/(1+r)^t
IRR       : Σ FCF_t/(1+IRR)^t = CAPEX
MAC       = [CRF·CAPEX + OPEX_annual − NonCarbonSavings_annual] / CO2Abated_annual
CRF       = r(1+r)^L/((1+r)^L − 1)
```

| Parameter | Symbol | Source |
|---|---|---|
| Carbon price path | P_carbon | NGFS Phase IV / IEA NZE |
| Energy price | P_energy | IEA / regional tariffs |
| Discount rate | r | corporate WACC |
| Project life | L | technology-specific |
| Co-benefit shadow prices | — | internal / social-cost tables |

### 8.4 Data requirements
Per project: CAPEX, annual OPEX, energy/water/waste savings quantities, abatement tCO₂/yr, life. Platform
holds the curated schedule fields; missing: a DCF routine tied to a live carbon-price path and per-project
energy prices.

### 8.5 Validation & benchmarking plan
Reconcile computed NPV/IRR against the curated values for the existing portfolio (should match when the
cash-flow assumptions are back-filled). Verify MAC-curve monotonicity and that negative-MAC projects rank
first. Sensitivity of portfolio NPV to carbon and energy prices (replacing the fixed 1.31/1.68 factors).

### 8.6 Limitations & model risk
Energy-price and carbon-price paths dominate NPV — conservative fallback uses current spot prices flat.
Abatement additionality (baseline choice) is the largest measurement risk; document baselines per GHG
Protocol Project Protocol. Co-benefit shadow prices are contestable and should be shown as a separate,
clearly-labelled value stream.
