# EV Vehicle-to-Grid Integration Finance
**Module ID:** `ev-v2g-grid-integration` · **Route:** `/ev-v2g-grid-integration` · **Tier:** B (frontend-computed) · **EP code:** EP-DT5 · **Sprint:** DT

## 1 · Overview
Fleet electrification and Vehicle-to-Grid integration finance covering EV fleet cost modelling, V2G grid service revenue, battery degradation cost from V2G cycling, aggregation economics and smart charging optimisation.

> **Business value:** V2G is financially positive for LFP-battery EV fleets with >5kW bidirectional capability and access to FFR/DCR markets; net annual V2G revenue of $100-200/vehicle exceeds degradation cost for LFP chemistry, creating a new fleet revenue stream per IEA EV Outlook 2023 projections.

**How an analyst works this module:**
- Model fleet electrification CAPEX, charging infrastructure and TCO versus ICE baseline
- Estimate V2G capacity available (kW per vehicle × fleet size × availability factor)
- Calculate grid service revenue from FFR, DCR and energy arbitrage using V2G capacity
- Net V2G revenue against battery degradation cost and aggregation platform cost to determine net benefit

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHARGING_TYPES`, `EV_SEGMENTS`, `HOURS`, `KpiCard`, `Slider`, `TABS`, `V2G_MARKETS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `EV_SEGMENTS` | 6 | `fleet2025_m`, `v2g_cap_kw`, `bat_kwh`, `avg_parked_hr`, `v2g_eligible_pct`, `std`, `region` |
| `V2G_MARKETS` | 7 | `policy`, `flex_cap_mw`, `revenue_eur_kw_yr`, `status`, `lead` |
| `CHARGING_TYPES` | 7 | `power_kw`, `v2g`, `bi`, `std`, `infra_cost` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `npv` | `cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + r, t), 0);` |
| `v2gCapMw` | `useMemo(() => (fleetSize * (v2gPct / 100) * EV_SEGMENTS[segment].v2g_cap_kw / 1000).toFixed(1), [fleetSize, v2gPct, segment]);` |
| `fcr` | `mw * fcrPrice * 8760 / 1000;` |
| `arb` | `mw * arbSpread * 250;` |
| `degradeCostPerCycle` | `useMemo(() => { const replaceCost = batKwh * 120;` |
| `netRevPerYear` | `useMemo(() => { const cycles = 365 * (v2gPct / 100) * 2;` |
| `degradeCost` | `degradeCostPerCycle * cycles * fleetSize;` |
| `irrCalc` | `useMemo(() => { const capex = -(fleetSize * EV_SEGMENTS[segment].v2g_cap_kw * 200);` |
| `degradeData` | `useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(yr => ({` |
| `scatterData` | `useMemo(() => Array.from({ length: 30 }, (_, i) => ({ x: 10 + sr(i * 7) * 490, y: sr(i * 13) * 4 + 0.5, country: ["UK","DE","NL","DK","US","JP","FR","ES","IT","NO"][i % 10], })), []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHARGING_TYPES`, `EV_SEGMENTS`, `TABS`, `V2G_MARKETS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Fleet Electrification TCO | `TCO_EV = CAPEX_EV + Energy + Maintenance - Residual - V2G` | IEA 2023 | EV fleet TCO achieves parity with ICE at diesel >$1.20/litre; lower maintenance cost (40% reduction) offset by higher vehicle CAPEX. |
| V2G Grid Service Revenue | `Revenue = Σ(service_hours × price × V2G_capacity)` | Nissan/National Grid Trial 2023 | UK V2G trial achieved £100-200/vehicle/yr in grid services; scales with EV battery capacity and available discharge hours. |
| V2G Battery Degradation | `Deg_cost = (CAPEX_battery × SoH_loss_per_kWh) / battery_kWh` | NREL 2022 | LFP batteries show 2-3× lower degradation per cycle than NMC; V2G with LFP adds minimal degradation at <20% DoD discharge. |
- **Fleet vehicle data** → → V2G capacity model → **kWh and charge/discharge window by vehicle type**
- **Grid service price history** → → revenue model → **£/MW/hr by service type and time-of-day**

## 5 · Intermediate Transformation Logic
**Methodology:** V2G Net Revenue Model
**Headline formula:** `Net_V2G = Grid_service_revenue - Battery_degradation_cost - Aggregation_cost`

V2G battery degradation cost ($0.02-0.08/kWh discharged) must be exceeded by grid service revenue; FFR/DCR service revenue $0.05-0.15/kWh makes V2G marginally positive for high-cycle-life LFP batteries.

**Standards:** ['IEA EV Outlook 2023', 'National Grid ESO V2G Trials', 'Ofgem V2G Smart Charging Framework']
**Reference documents:** IEA Global EV Outlook 2023; National Grid ESO Vehicle-to-Grid Technology Overview 2022; Ofgem Smart and Flexible Grids Call for Input 2022

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

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

## 9 · Future Evolution

### 9.1 Evolution A — Real market prices under an already-sound V2G model (analytics ladder: rung 2 → 3)

**What.** §7 rates the module "substantially model-backed": a genuine V2G net-revenue model faithful to the guide's `Net_V2G = Revenue − Degradation − Aggregation`, with real Newton-Raphson IRR, a battery-replacement degradation cost model, capacity sizing (`fleet × v2g_kW × availability`), and user-tunable inputs — only the 24-hour dispatch profile and the country scatter are seeded. The remaining maturity gap is price grounding: FCR prices and arbitrage spreads are slider assumptions, the degradation model uses a flat $120/kWh replacement cost, and the `V2G_MARKETS` revenue benchmarks are authored.

**How.** (1) Real service prices: ENTSO-E balancing/FCR data (already a wave-1 platform source) and day-ahead spreads for the arbitrage leg, per market — sliders become "override the market default" rather than the only source. (2) Degradation calibration: replace the flat $120/kWh with the chemistry-differentiated cycle-degradation parameters the §4 row cites (NREL 2022: LFP 2–3× lower per-cycle loss than NMC; the page already carries chemistry context via its sibling modules) — making the LFP-vs-NMC verdict in the business-value claim a computed result. (3) The seeded 24-hour dispatch becomes an actual smart-charging profile: parked-hours windows from `EV_SEGMENTS` × price series → dispatch schedule (a small optimization — natural shared code with `energy-storage-analytics`'s rung-5 dispatch work). (4) Server-side engine + bench pins for the IRR and degradation arithmetic; `V2G_MARKETS` rows gain sources and dates.

**Prerequisites.** ENTSO-E FCR data coverage per market (non-EU markets need alternatives, disclosed); degradation parameter citations. **Acceptance:** the UK fixture's net revenue per vehicle lands in the National Grid trial's £100–200 band using real FCR prices (a stated validation check); chemistry toggle changes degradation per the cited ratios; the dispatch chart derives from price data, not seeds.

### 9.2 Evolution B — Fleet V2G feasibility advisor (LLM tier 2)

**What.** A tool-calling advisor for the fleet operator's threshold question: "is V2G worth it for our 400-van LFP fleet in Germany?" It runs Evolution A's engine with the fleet's parameters and the German market's real FCR/arbitrage prices, decomposes the verdict (gross service revenue vs degradation vs aggregation cost), tests the sensitivity that matters (parked-hours availability is usually the binding constraint), and drafts the feasibility note including the market-readiness context from the sourced `V2G_MARKETS` table (policy status, market lead).

**How.** Tools: `compute_v2g_economics(fleet, market, chemistry)`, `run_sensitivity(param, range)`, `get_market_profile(market)`, `optimize_dispatch(fleet, market)`. Grounding corpus = this Atlas record's §5/§7 formula chain and the IEA/NREL/National Grid references. The advisor's verdicts quote the net-revenue decomposition; marginal cases ("net +$23/vehicle/yr") are labeled marginal with the sensitivity that flips them, not rounded up to a recommendation. Markets without price coverage refuse the revenue leg honestly.

**Prerequisites.** Evolution A's price grounding — the model is already sound, so this copilot is unusually close to shippable; only assumption-quality blocks it today. **Acceptance:** a golden Germany-LFP case reproduces from scripted calls; the decomposition sums to the net figure; an uncovered market (e.g. India) yields the honest coverage refusal with the authored-benchmark caveat.