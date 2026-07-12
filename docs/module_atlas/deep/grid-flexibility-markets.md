## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide (EP-DT2) gives `Value_flex = Σ(service_volume×clearing_price) −
> Opportunity_cost`. The page's live engine is a **battery revenue-stacking model**: it sizes annual
> revenue across FCR / aFRR / energy-arbitrage streams from a user capacity and allocation split, using
> fixed per-service price/availability assumptions. There is no explicit opportunity-cost subtraction —
> the revenue-stacking is additive across the allocation shares (which sum to ≤100%).

### 7.1 What the module computes

The core interactive engine (`annualRevCalc`) stacks three revenue streams for a BESS asset:

```js
fcrRev  = capMw × (fcrAlloc/100)  × 18 × 8760 / 1000    // FCR: €18/MW/h × 8760h → €000s
afrrRev = capMw × (afrrAlloc/100) × 8  × 8760 / 1000    // aFRR: €8/MW/h availability
arbRev  = capMw × (arbAlloc/100)  × 35 × 250            // arbitrage: €35/MWh spread × 250 cycles
```

FCR and aFRR are priced as **availability** payments (€/MW/h × full 8,760 h/yr); arbitrage is an
**energy** payment (€/MWh spread × ~250 profitable cycles/yr). The allocation sliders split the
asset's capacity across streams.

### 7.2 Parameterisation

**`ANCILLARY_SERVICES`** (8 rows) — real service definitions with response times and EU price/capacity:

| Service | Response | Duration | EU cap (MW) | €/MW/h |
|---|---|---|---|---|
| FCR | 30 s | 30 min | 1,500 | 18 |
| aFRR | 300 s | 15 min | 3,000 | 8 |
| mFRR | 900 s | 60 min | 5,000 | 4 |
| RR | 900 s | 240 min | 8,000 | 2 |
| DC-L/H (UK) | 1 s | 30 min | 200 | 20 |

Response times and the ±200 mHz FCR deadband / 0.5 Hz DC trigger are technically accurate. **`COUNTRIES`**
(6) carry real-ish flexibility capacities (Germany aFRR 6,000 MW, RE 58%; UK BESS 4,200 MW). Revenue
engine constants: FCR €18, aFRR €8/MW/h, arbitrage €35/MWh × 250 cycles.

### 7.3 Calculation walkthrough

`capMw` (asset size) and the three allocation shares feed `annualRevCalc`. `MARKET_PRICES_WEEKLY`
(52-week price series for FCR/aFRR/mFRR/DA) is seeded (`sr()`), driving the price-dynamics chart.
`totalFlexEU = Σ(afrr + bess + dr capacity)` across countries sizes the market. `flexNeedData`
projects flexibility need to 2035.

### 7.4 Worked example (50 MW BESS, 40/30/30 split)

`capMw = 50`, `fcrAlloc = 40%`, `afrrAlloc = 30%`, `arbAlloc = 30%`:

| Stream | Computation | Revenue |
|---|---|---|
| FCR | 50 × 0.40 × 18 × 8760 / 1000 | €3,154k |
| aFRR | 50 × 0.30 × 8 × 8760 / 1000 | €1,051k |
| Arbitrage | 50 × 0.30 × 35 × 250 | €131k |
| **Total** | sum | **€4,336k/yr** |

FCR dominates (~73% of revenue) because of its high €18/MW/h availability payment over the full year —
consistent with BESS crowding into GB/EU frequency markets (the guide's ">50% BESS share in GB FFR").
Note arbitrage is small here because it is priced per-cycle (250×), not per-hour.

### 7.5 Data provenance & limitations

- The 52-week price series is **seeded** (`sr()` PRNG). The service definitions, country capacities and
  revenue-engine prices are hard-coded reference values (realistic, not live market data).
- Revenue-stacking is **additive with no de-rating**: a MW allocated to FCR and simultaneously earning
  full arbitrage would be double-counted if allocations overlapped; the model relies on shares summing
  to ≤100% and assumes perfect availability (8,760 h), ignoring cycling/degradation and
  simultaneity constraints.
- No opportunity-cost term (guide) and no round-trip efficiency or SoC constraint on arbitrage cycles.

### 8 · Model Specification

**Status: specification — not yet implemented in code** (the page uses fixed price assumptions and
additive stacking; a production model co-optimises streams under battery physics).

**8.1 Purpose & scope.** Estimate stacked annual revenue and NPV for a BESS/flex asset across
frequency, reserve and arbitrage markets, net of opportunity cost and degradation, for FID.

**8.2 Conceptual approach.** A co-optimisation dispatch model over hourly (or sub-hourly) prices with
SoC and cycling constraints, mirroring Modo Energy / Aurora BESS revenue-stacking and AEMO/National
Grid ESO ancillary-market frameworks; opportunity cost is endogenous (a MW committed to FCR cannot
also arbitrage that hour).

**8.3 Mathematical specification.**
```
maximise Σ_t [ p_FCR·x_FCR,t + p_aFRR·x_aFRR,t + (p_sell,t − p_buy,t)·d_arb,t ]
subject to  x_FCR,t + x_aFRR,t + |d_arb,t| ≤ P_max          (power constraint, no double-commit)
            SoC_{t+1} = SoC_t + η_c·charge_t − discharge_t/η_d
            SoC_min ≤ SoC_t ≤ SoC_max ;  Σ cycles ≤ cycle_budget
Annual revenue = optimum objective;  NPV = Σ_y revenue_y/(1+r)^y − CAPEX
```

| Parameter | Source |
|---|---|
| Service prices | National Grid ESO / AEMO / ENTSO-E clearing data |
| Round-trip efficiency η | 85–92% (BESS spec) |
| Cycle budget | warranty (e.g. 5,000–8,000 cycles) |
| Arbitrage spreads | day-ahead + intraday forwards |
| WACC r | 7–9% |

**8.4 Data requirements.** Hourly ancillary + energy prices, battery power/energy/efficiency/cycle
specs, market accreditation rules. The page holds service definitions and price priors.

**8.5 Validation.** Reconcile modelled revenue against Modo Energy BESS benchmark indices; back-test
dispatch against historical price shapes; sensitivity on cycle budget and price volatility.

**8.6 Limitations & model risk.** Ancillary prices are volatile and saturating as BESS enters;
degradation and warranty limits bind; foresight assumption (perfect vs rolling) matters. Conservative
fallback: report per-stream availability revenue with de-rating factors rather than full co-optimised
upside.

**Framework alignment:** National Grid ESO EMR / Dynamic Containment — GB frequency products (DC-L/H,
DM, DR encoded); ENTSO-E FCR/aFRR/mFRR/RR — the EU balancing hierarchy with correct response times;
AEMO Integrated System Plan / FCAS — Australian NEM; ERCOT Ancillary Services — RegUp/RegDown analogue.
