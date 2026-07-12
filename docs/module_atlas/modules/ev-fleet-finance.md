# EV Fleet Finance
**Module ID:** `ev-fleet-finance` · **Route:** `/ev-fleet-finance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Models the financial case for electric vehicle fleet transition, computing total cost of ownership, financing structures, residual value projections, and charging infrastructure capex requirements for corporate and public sector fleet operators. Integrates government incentive programmes, carbon price forecasts, and energy price scenarios to produce investment-grade EV transition business cases. Supports green loan frameworks and sustainability-linked financing for fleet electrification.

> **Business value:** Provides fleet managers, CFOs, and sustainability teams with the financial rigour needed to approve EV transition investment decisions, structure green or sustainability-linked financing, and set credible Scope 1 decarbonisation targets aligned with SBTi corporate pathway requirements.

**How an analyst works this module:**
- Enter fleet composition (vehicle types, duty cycles, annual mileage) and current ICE total cost data.
- Select electrification scenario (full/partial), vehicle OEM options, and charging strategy (depot/destination/public).
- Review TCO comparison, NPV sensitivity to energy prices and carbon prices, and fleet decarbonisation trajectory.
- Generate EV transition business case and green loan eligibility report with ICMA Green Bond Principles alignment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `BatteryEconomicsTab`, `CHARGER_TYPES`, `CHEMISTRIES`, `COUNTRIES`, `Card`, `ChargingInfraTab`, `ChartTip`, `FLEET_NAMES`, `FLEET_TYPES`, `FleetTransitionTab`, `Stat`, `TABS`, `TcoCalculatorTab`, `VEHICLE_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FLEET_TYPES` | `['Logistics','Delivery','Ride-hail','Municipal','Corporate','Rental'];` |
| `VEHICLE_TYPES` | `['Sedan','SUV','Van','Light Truck','Heavy Truck','Bus','2-Wheeler','3-Wheeler','Compact','Minibus','Cargo Van','Pickup'];` |
| `CHEMISTRIES` | `['NMC','LFP','Solid-State','Sodium-Ion'];` |
| `CHARGER_TYPES` | `['L2 AC','DC Fast 50kW','DC Fast 150kW','Ultra-Fast 350kW'];` |
| `type` | `FLEET_TYPES[Math.floor(s*6)];` |
| `country` | `COUNTRIES[Math.floor(s2*20)];` |
| `fleetSize` | `Math.floor(50+s3*4950);` |
| `evPct` | `Math.floor(5+s4*55);` |
| `targetPct` | `Math.min(100,Math.floor(evPct+20+sr(i*19+5)*40));` |
| `annualKm` | `Math.floor(15000+sr(i*23+11)*85000);` |
| `fuelCost` | `Math.floor(500000+sr(i*29+13)*4500000);` |
| `evCost` | `Math.floor(fuelCost*(0.35+sr(i*31+17)*0.3));` |
| `tcoSavings` | `fuelCost-evCost+Math.floor(sr(i*37+19)*500000);` |
| `ice` | `Math.floor((100-evPct)*(0.5+sr(i*41+3)*0.4));` |
| `hybrid` | `100-evPct-ice>0?100-evPct-ice:0;` |
| `bev` | `Math.floor(evPct*(0.7+sr(i*43+7)*0.25));` |
| `vType` | `VEHICLE_TYPES[Math.floor(s*12)];` |
| `bevCapex` | `Math.floor(25000+s3*75000);` |
| `iceCapex` | `Math.floor(bevCapex*(0.5+sr(i*17+109)*0.3));` |
| `bevFuel` | `Math.floor(annualKm*0.04*(0.08+sr(i*19+111)*0.12));` |
| `iceFuel` | `Math.floor(annualKm*0.08*(1.2+sr(i*23+113)*0.8));` |
| `bevMaint` | `Math.floor(annualKm*0.02*(0.03+sr(i*29+117)*0.04));` |
| `iceMaint` | `Math.floor(annualKm*0.02*(0.06+sr(i*31+119)*0.06));` |
| `incentive` | `Math.floor(sr(i*37+121)*15000);` |
| `breakeven` | `Math.max(1,Math.min(10,Math.round(1+(bevCapex-iceCapex-incentive)/(iceFuel-bevFuel+iceMaint-bevMaint+1))));` |
| `co2Saved` | `Math.floor(annualKm*0.15*(0.8+sr(i*41+123)*0.4));` |
| `abateCost` | `Math.floor((bevCapex-iceCapex-incentive)/(co2Saved/1000+1));` |
| `cType` | `CHARGER_TYPES[Math.floor(s*4)];` |
| `chargerCount` | `Math.floor(4+s2*46);` |
| `util` | `Math.floor(25+s3*60);` |
| `uptime` | `Math.floor(88+sr(i*17+209)*11);` |
| `revenue` | `Math.floor(chargerCount*util*365*(0.3+sr(i*19+211)*0.5));` |
| `capex` | `Math.floor(chargerCount*(15000+sr(i*23+213)*85000));` |
| `opex` | `Math.floor(capex*0.08*(0.8+sr(i*29+217)*0.4));` |
| `irr` | `Math.floor(5+sr(i*31+219)*20);` |
| `payback` | `Math.max(2,Math.min(12,Math.round(capex/(revenue-opex+1))));` |
| `peakLoad` | `Math.floor(chargerCount*(20+sr(i*37+221)*130));` |
| `v2gRev` | `Math.floor(revenue*(0.05+sr(i*41+223)*0.15));` |
| `region` | `['North America','Europe','Asia Pacific','Middle East','Latin America','Africa'][Math.floor(sr(i*43+227)*6)];` |
| `fmt` | `v=>{if(v>=1e9)return `$${(v/1e9).toFixed(1)}B`;if(v>=1e6)return `$${(v/1e6).toFixed(1)}M`;if(v>=1e3)return `$${(v/1e3).toFixed(0)}K`;return `$${v}`;};` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHARGER_TYPES`, `CHEMISTRIES`, `COUNTRIES`, `FLEET_NAMES`, `FLEET_TYPES`, `TABS`, `VEHICLE_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EV vs. ICE TCO Gap (Â£/vehicle/year) | — | BloombergNEF/ICCT | Annual TCO difference between EV and ICE equivalent; typically EV TCO parity achieved by 2024â€“2026 for most segments. |
| Fleet Decarbonisation Rate (tCO2e saved/year) | — | DEFRA EV Emission Factors | Annual GHG savings from electrification vs. ICE baseline; primary metric for sustainability-linked loan target setting. |
| Charging Infrastructure Capex (Â£/vehicle) | — | OZEV Infrastructure Assessment | Capital cost of AC/DC charging infrastructure per fleet vehicle; varies from Â£500 (AC7kW) to Â£15,000+ (DC150kW). |
| Payback Period (years) | — | NPV Model | Number of years for cumulative EV TCO savings to recover incremental capex vs. ICE fleet continuation. |
- **Fleet management system (vehicle specs, mileage, fuel data)** → Map each vehicle to EV equivalent; compute current ICE total running cost per vehicle type → **ICE baseline TCO by vehicle segment (Â£/vehicle/year)**
- **OEM EV pricing and charging infrastructure quotes** → Input capex, battery warranty, OBC power, and charge time; compute depreciation and financing cost → **EV capex and depreciation schedule per vehicle type**
- **DEFRA emission factors and energy price forecasts** → Apply electricity grid carbon factor trajectory; compute annual GHG savings at vehicle level → **Fleet decarbonisation trajectory (tCO2e) and carbon savings value at forward carbon price**

## 5 · Intermediate Transformation Logic
**Methodology:** EV Fleet TCO Model
**Headline formula:** `TCO_EV = Capex + PV(Energy) + PV(Maintenance) − PV(Incentives) − PV(CarbonSavings) − RV`

Lifetime total cost of ownership computed as vehicle acquisition capex plus present values of energy and maintenance costs, less government grants, capital allowances, and carbon cost savings (at forward carbon price), less estimated residual value at disposal. Compared against ICE fleet TCO to determine crossover year and NPV of electrification decision.

**Standards:** ['IEA Global EV Outlook 2024', 'BloombergNEF EV Market Outlook 2024', 'ICCT EV Ownership Cost Analysis 2023']
**Reference documents:** IEA Global EV Outlook 2024; BloombergNEF Electric Vehicle Outlook 2024; ICCT EV Ownership Cost Comparison 2023; OZEV EV Infrastructure Strategy 2022; ICMA Green Bond Principles 2021 â€” Eligible Green Project Categories

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — A real fleet-input workflow with a discounted TCO engine (analytics ladder: rung 1 → 2)

**What.** The workflow says "enter fleet composition… current ICE total cost data," but nothing is entered: the fleet table, per-vehicle capex/fuel/maintenance, incentives, charger economics, IRRs, and V2G revenues are all `sr()` draws. The derived formulas on top (breakeven from cost differentials, abatement cost per tonne) are structurally sensible but run on fabricated inputs, and the guide's TCO — with present-value terms and residual value (`TCO = Capex + PV(Energy) + PV(Maint) − PV(Incentives) − PV(CarbonSavings) − RV`) — is not implemented; the page's arithmetic is undiscounted. Evolution A builds the business-case engine the CFO audience requires.

**How.** (1) `ev_fleets`/`ev_fleet_vehicles` tables with an actual input workflow (vehicle types, duty cycles, mileage, current costs) — this module's value is *your fleet*, not a synthetic one. (2) `services/ev_tco_engine.py`: the guide's PV formula properly discounted, with residual-value curves per segment and the sibling `ev-transition-finance`'s parameter tables as the shared base (one TCO parameter set, two modules — fleet lens here, lender/OEM lens there). (3) Sourced parameters: DEFRA/grid emission factors for the decarbonisation trajectory, published incentive schedules per country, charger capex bands from the OZEV-style sources §4 cites — each with provenance. (4) Rung 2: the scenario sweeps the overview promises — energy price × carbon price × electrification pace — as engine re-runs producing the NPV sensitivity chart from computation.

**Prerequisites.** Parameter-table curation with as-of dates (EV prices move quarterly); incentive-schedule maintenance plan. **Acceptance:** a fixture 100-vehicle fleet's TCO reproduces the discounted formula by hand; breakeven changes correctly when the discount rate moves (the undiscounted version can't); zero `sr()` in fleet data.

### 9.2 Evolution B — Business-case and green-loan eligibility drafter (LLM tier 2)

**What.** The workflow's deliverable — "EV transition business case and green loan eligibility report with ICMA GBP alignment" — is a structured financing document. A tool-calling drafter that pulls the fleet's computed TCO comparison, NPV sensitivities, and decarbonisation trajectory from Evolution A's engine, maps the investment against the ICMA Green Bond Principles categories (clean transportation) and sustainability-linked KPI conventions (fleet emissions intensity targets from the computed trajectory), and drafts the board paper plus the lender-facing eligibility annex — every financial figure from engine output, every framework claim cited to the GBP/SLL principles text.

**How.** Tools: `compute_fleet_tco(fleet, scenario)`, `get_sensitivity(fleet, dimensions)`, `get_decarb_trajectory(fleet)`, `check_green_criteria(investment)`. Grounding corpus = this Atlas record's §5 formula and the ICMA framework texts. SLL target proposals are grounded in the computed trajectory with headroom stated ("trajectory delivers −42% by 2029; proposing −35% as target leaves buffer") — the drafter shows the arithmetic behind target ambition, the negotiation's real substance. Renders through report-studio.

**Prerequisites (hard).** Evolution A — a green-loan eligibility report on seeded fleet economics would carry fabricated NPVs into credit committees and lender ESG teams. **Acceptance:** a golden fleet's business case matches engine outputs throughout; proposed SLL targets reproduce from the trajectory with stated headroom; GBP category claims quote the principles verbatim.