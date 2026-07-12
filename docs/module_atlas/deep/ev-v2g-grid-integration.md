## 7 · Methodology Deep Dive

This module is **substantially model-backed** and reconciles well with the guide (EP-DT5). It implements
a genuine V2G net-revenue model with a real Newton-Raphson IRR, a battery-replacement-cost degradation
model, and V2G capacity sizing — the guide's `Net_V2G = Grid_service_revenue − Battery_degradation_cost −
Aggregation_cost` is faithfully coded (aggregation cost is folded into net revenue rather than shown
separately). Only the 24-hour dispatch profile and the country scatter are seeded; the headline economics
are real arithmetic on user-tunable inputs.

### 7.1 What the module computes

```js
v2gCapMw   = fleetSize · (v2gPct/100) · v2g_cap_kw / 1000            // fleet V2G MW

// Annual grid-service revenue (FCR capacity + energy arbitrage)
fcr = mw · fcrPrice · 8760 / 1000                                    // €/kW/h · full-year hours
arb = mw · arbSpread · 250                                           // €/MWh spread · 250 trading days
annualRev = fcr + arb

// Battery degradation cost per V2G cycle
replaceCost = batKwh · 120                                          // €120/kWh pack replacement
degradeCostPerCycle = (replaceCost / 1500) · (degradeAdder/100)     // 1,500-cycle pack life

// Net revenue after degradation
cycles = 365 · (v2gPct/100) · 2                                     // ~2 shallow cycles/day
netRevPerYear = annualRev − degradeCostPerCycle · cycles · fleetSize

// 10-year project IRR (real Newton-Raphson solve)
capex = −(fleetSize · v2g_cap_kw · 200)                             // €200/kW bidirectional infra
irr(cfs = [capex, netRevPerYear ×10])
```

The `irr()` function is a genuine iterative solver (200 iterations, NPV derivative, 1e-8 tolerance) — not
a seeded number.

### 7.2 Parameterisation & provenance

| Parameter | Value | Provenance |
|---|---|---|
| `EV_SEGMENTS` | Passenger 7.4 kW/65 kWh; LCV 11 kW/75; Bus 50 kW/400; HGV 80 kW/600 | **Realistic** — with correct ISO 15118-2/-20, CCS2, CHAdeMO standards |
| FCR price | €18/kW default (tunable) | Realistic FCR capacity price |
| Arbitrage spread | €40/MWh × 250 days | Realistic day-ahead spread |
| Pack replacement | €120/kWh | Realistic 2024 pack cost |
| Cycle life | 1,500 cycles | Conservative NMC; LFP is higher (guide notes LFP 2–3× lower degradation) |
| Bidirectional infra | €200/kW | Realistic V2G-capable charger premium |
| `V2G_MARKETS` | 6 countries, real policies (UK SEG, NL SDE++/FCR, DE §14a EnWG, CA CPUC/CAISO, JP CHAdeMO) with €140–250/kW/yr | **Real regulatory landscape** |
| `CHARGING_TYPES` | 6, real IEC/ISO standards + infra costs €800–120k | Real |
| 24h profile, scatter | `sr()` | **Synthetic** (illustrative dispatch curve) |

### 7.3 Calculation walkthrough

1. `v2gCapMw` sizes fleet V2G capacity from segment kW × eligible %.
2. `annualRev` = FCR capacity revenue (full-year availability) + arbitrage revenue (250 days).
3. `degradeCostPerCycle` amortises the pack replacement cost over 1,500 cycles, scaled by the V2G
   degradation adder %.
4. `netRevPerYear` subtracts total annual degradation (cycles × fleet) from revenue.
5. `irrCalc` builds a 10-year cashflow `[−capex, netRev×10]` and solves for IRR.

### 7.4 Worked example (Passenger Cars, defaults)

`fleetSize=10,000`, `v2gPct=60`, `v2g_cap_kw=7.4`, `fcrPrice=18`, `arbSpread=40`, `batKwh=75`,
`degradeAdder=1.5`:

| Step | Computation | Result |
|---|---|---|
| v2gCapMw | 10000·0.6·7.4/1000 | 44.4 MW |
| fcr | 44.4·18·8760/1000 | €7,001k |
| arb | 44.4·40·250 | €444k |
| annualRev | fcr + arb | **€7,445k** |
| degradeCostPerCycle | (75·120/1500)·(1.5/100) | €0.09/cycle |
| cycles/yr | 365·0.6·2 | 438 |
| degrade cost (fleet) | 0.09·438·10000 | €394k |
| netRevPerYear | 7,445 − 394 | **€7,051k** |
| capex | −(10000·7.4·200) | −€14,800k |
| IRR (−14.8M, 7.05M×10) | Newton solve | **≈ 47%** |

The strongly positive IRR reflects the FCR revenue dominating a modest degradation cost — consistent with
the guide's thesis that V2G is net-positive for high-availability fleets with grid-service market access.
(FCR full-year availability may be optimistic; see limitations.)

### 7.5 Data provenance & limitations

- **Core economics are real** (IRR solver, degradation amortisation, V2G sizing) on tunable inputs — not
  seeded.
- **FCR revenue assumes full-year (8760 h) availability** at the capacity price, which overstates
  achievable revenue (vehicles are not always plugged/available); a production model would apply an
  availability factor.
- **Degradation uses a fixed 1,500-cycle life** regardless of chemistry; LFP packs cycle far longer, so
  the model is conservative for LFP fleets and roughly right for NMC.
- **Aggregation/platform cost** (in the guide's Net_V2G formula) is not separately modelled.
- 24h dispatch profile and country scatter are synthetic (`sr()`).

**Framework alignment:** Grid-service revenue reflects real **FCR (Frequency Containment Reserve)** and
day-ahead **arbitrage** markets; the market table maps real policies (UK Smart Export Guarantee, German
§14a EnWG controllable-assets, CAISO demand response). Standards are correct **ISO 15118-2/-20**, CCS2,
CHAdeMO. Degradation economics follow **NREL** cycle-life framing. Aligns with **IEA Global EV Outlook**
and **National Grid ESO / Ofgem** V2G work cited in the guide.

## 8 · Model Specification

**Status: specification — core model exists; refinements below are not yet implemented.** The IRR/
degradation/revenue model is real; the production upgrade adds an availability factor, chemistry-specific
degradation, and stochastic price paths.

**8.1 Purpose & scope.** Value a fleet V2G programme's net annual revenue and project IRR under realistic
availability and market-price uncertainty, for fleet operators and aggregators.

**8.2 Conceptual approach.** Extend the existing net-revenue model with (a) a plug-in availability factor,
(b) chemistry-conditioned rain-flow cycle counting for degradation (NREL/Xu et al.), and (c) stochastic
FCR/arbitrage price simulation — as used in Kaluza/Nuvve and National Grid ESO V2G valuations.

**8.3 Mathematical specification.**

```
V2G_avail_MW_t = fleet · v2gPct · cap_kw · availability_t / 1000     availability from parked-hour profile
FCR_rev = Σ_t V2G_avail_MW_t · price_FCR_t · Δt          (only when available & market-clearing)
Arb_rev = Σ_d MW · (P_high,d − P_low,d) · cycle_energy_d
Degradation (rain-flow): ΔSoH = Σ_cycles k(DoD, C-rate, T) ;  cost = ΔSoH · replaceCost
Net = FCR_rev + Arb_rev − DegradationCost − AggregationFee
IRR: solve Σ_t (Net_t)/(1+IRR)^t = Capex_0
```

| Parameter | Source |
|---|---|
| Availability factor | Fleet parked-hour telematics |
| FCR/arbitrage price paths | ENTSO-E / market operator historicals + simulation |
| Degradation k(·) | NREL life models; chemistry-specific (NMC vs LFP) |
| Pack cost | BNEF battery price survey |
| Aggregation fee | Aggregator contract |

**8.4 Data requirements.** Fleet telematics (parked hours, SoC), market price series (FCR, day-ahead),
chemistry/pack spec, aggregator terms. Platform holds energy reference series; needs market-price feeds.

**8.5 Validation & benchmarking plan.** Reconcile net revenue against published V2G trial results (UK
€100–200/vehicle/yr); backtest degradation against NREL cycle-life data; sensitivity to availability and
price volatility.

**8.6 Limitations & model risk.** FCR market saturation caps scalable revenue; model market-depth limits.
Availability is the dominant driver — telematics-calibrate it. Conservative fallback: apply a haircut to
full-year FCR revenue when availability data is missing.
