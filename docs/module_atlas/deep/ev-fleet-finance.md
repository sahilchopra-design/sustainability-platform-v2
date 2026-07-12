## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a discounted **TCO NPV model**
> `TCO_EV = Capex + PV(Energy) + PV(Maintenance) − PV(Incentives) − PV(CarbonSavings) − RV` with forward
> carbon prices and residual-value projections. **The code implements no present-value discounting and no
> carbon-price forecast.** It computes a simple undiscounted breakeven year, an abatement cost, and a
> charging-infrastructure IRR/payback — all over **fully seeded** fleet and vehicle data. Documented below.

### 7.1 What the module computes

Three calculation clusters, all on `sr()`-generated entities:

**(a) Fleet TCO comparison** (per vehicle segment):
```js
bevFuel  = floor(annualKm·0.04·(0.08 + sr()·0.12))    // energy cost proxy
iceFuel  = floor(annualKm·0.08·(1.2 + sr()·0.8))
bevMaint = floor(annualKm·0.02·(0.03 + sr()·0.04))
iceMaint = floor(annualKm·0.02·(0.06 + sr()·0.06))
breakeven = clip(1 + (bevCapex − iceCapex − incentive) /
                     (iceFuel − bevFuel + iceMaint − bevMaint + 1), 1, 10)   // undiscounted years
```

**(b) Abatement cost** (marginal $/tCO₂):
```js
co2Saved  = floor(annualKm·0.15·(0.8 + sr()·0.4))     // kg/yr proxy
abateCost = floor((bevCapex − iceCapex − incentive) / (co2Saved/1000 + 1))   // $ per tCO₂
```

**(c) Charging-infrastructure economics**:
```js
revenue = floor(chargerCount·util·365·(0.3 + sr()·0.5))
opex    = floor(capex·0.08·(0.8 + sr()·0.4))
irr     = floor(5 + sr()·20)                          // seeded, NOT a cashflow IRR
payback = clip(round(capex/(revenue − opex + 1)), 2, 12)
v2gRev  = floor(revenue·(0.05 + sr()·0.15))
```

### 7.2 Parameterisation & provenance

| Element | Value | Provenance |
|---|---|---|
| `FLEET_TYPES` / `VEHICLE_TYPES` | 6 / 12 | Real categories (Logistics, Delivery, Ride-hail…; Sedan…Bus) |
| `CHEMISTRIES` | NMC, LFP, Solid-State, Sodium-Ion | Real battery chemistries |
| `CHARGER_TYPES` | L2 AC, DC 50/150 kW, Ultra-Fast 350 kW | Real charger classes |
| Fuel/maint multipliers | 0.04/0.08 kWh & fuel per km; 0.02 maint | Order-of-magnitude proxies, seeded ±range |
| CO₂ factor | `annualKm·0.15` kg/km | Rough ICE tailpipe intensity (~150 gCO₂/km) proxy |
| IRR | `5 + sr()·20` (5–25%) | **Synthetic** — not computed from cashflows |
| Incentive | `sr()·15000` | Seeded grant |
| All fleet entities (size, evPct, capex…) | seeded | **Synthetic** `sr()` |

### 7.3 Calculation walkthrough

1. Fleets are generated with seeded size, EV%, annual km, fuel spend, TCO savings.
2. Per-vehicle TCO: seeded capex/fuel/maint for BEV vs ICE → undiscounted `breakeven` year.
3. Abatement: incremental capex over annual CO₂ saved → `$/tCO₂`.
4. Charging: seeded revenue/opex/capex → `payback` and a **seeded** `irr`.
5. Portfolio KPIs weight `total_mineral_exposure`-style fields (n/a here) — fleet KPIs aggregate savings.

### 7.4 Worked example (one vehicle segment)

`annualKm = 50,000`, `bevCapex = 60,000`, `iceCapex = 35,000`, `incentive = 7,500`, seeds mid-range:

| Step | Computation | Result |
|---|---|---|
| bevFuel | 50000·0.04·(0.08+0.5·0.12=0.14) | 2,800 |
| iceFuel | 50000·0.08·(1.2+0.5·0.8=1.6) | 6,400 |
| bevMaint | 50000·0.02·(0.03+0.5·0.04=0.05) | 50 |
| iceMaint | 50000·0.02·(0.06+0.5·0.06=0.09) | 90 |
| annual savings | (6400−2800)+(90−50) | 3,640 |
| breakeven | 1 + (60000−35000−7500)/3641 | 1 + 4.8 = **~6 years** |
| co2Saved | 50000·0.15·(0.8+0.5·0.4=1.0) | 7,500 kg = 7.5 t |
| abateCost | (60000−35000−7500)/(7.5+1) | **~$2,059/tCO₂** |

A ~6-year breakeven and ~$2,000/tCO₂ abatement — plausible in *shape* but driven entirely by seeded
inputs, so the numbers are illustrative, not vehicle-specific.

### 7.5 Data provenance & limitations

- **All fleet/vehicle/charger data is synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`).
- **No discounting**: breakeven and abatement are undiscounted, contradicting the guide's PV-based TCO.
- **IRR is seeded**, not derived from a cashflow series — a real IRR requires solving NPV = 0.
- **No forward carbon price**; carbon savings are a kg-CO₂ proxy, not monetised at a price path.
- Residual value enters only as a seeded `tcoSavings` bump, not a projected disposal curve.

**Framework alignment:** References the right sources in the guide (**IEA Global EV Outlook**,
**BloombergNEF EV Outlook**, **ICCT** ownership-cost analysis) and structures a TCO/abatement/charging
view consistent with them — but implements a simplified, undiscounted, synthetic version. Green-loan
eligibility (**ICMA Green Bond Principles** clean-transport category) and **SBTi** Scope-1 alignment are
stated use cases, not computed outputs.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's discounted TCO NPV, forward-carbon
monetisation, and cashflow IRR are absent; inputs are seeded. Below is the production fleet-electrification
model.

**8.1 Purpose & scope.** Produce an investment-grade EV-vs-ICE TCO NPV, decarbonisation trajectory, and
charging-infrastructure return for a defined fleet, to support green/SLL financing decisions.

**8.2 Conceptual approach.** A discounted lifecycle TCO model per **ICCT** and **BloombergNEF** ownership-
cost methodology, with grid-emission-factor decarbonisation (DEFRA/IEA) and a proper project IRR for
charging capex — the standard fleet-advisory and green-loan appraisal approach.

**8.3 Mathematical specification.**

```
TCO_v = Capex_v + Σ_t [ (Energy_{v,t} + Maint_{v,t} + Insurance_{v,t}) / (1+r)^t ]
        − Σ_t Incentive_t/(1+r)^t − Σ_t CarbonSaving_t·CP_t/(1+r)^t − RV_v/(1+r)^T
Energy_BEV,t = km_t · kWh/km · price_elec,t ;  Energy_ICE,t = km_t · L/km · price_fuel,t
CO2Saved_t = km_t · (EF_ICE − EF_grid,t · kWh/km)     EF_grid,t declines per DEFRA/IEA path
Crossover year = min t : cumTCO_EV(t) ≤ cumTCO_ICE(t)
Charging IRR: solve Σ_t CF_t/(1+IRR)^t = 0 ,  CF_t = Rev_t − Opex_t − Capex_0
```

| Parameter | Source |
|---|---|
| Discount rate r | Fleet WACC / green-loan rate |
| Energy prices, kWh/km, L/km | IEA / OEM spec / ICCT |
| Grid EF path | DEFRA / IEA WEO grid intensity |
| Carbon price CP_t | NGFS Phase IV shadow price |
| Residual value RV | BloombergNEF residual curves |

**8.4 Data requirements.** Fleet composition (segment, duty cycle, annual km), OEM capex/energy specs,
charging quotes, incentive schedules, grid EF path, carbon-price path. Platform holds NGFS scenario
tables and reference-data energy series.

**8.5 Validation & benchmarking plan.** Reconcile crossover years against ICCT/BNEF published TCO-parity
years by segment/market; sensitivity to energy price, discount rate, residual value; charging IRR vs a
DCF built independently.

**8.6 Limitations & model risk.** Residual values for BEVs are highly uncertain — scenario-band them.
Grid EF path materially drives carbon savings; use the disclosed IEA/DEFRA trajectory and flag
sensitivity. Conservative fallback: exclude carbon-savings monetisation if no credible price path.
