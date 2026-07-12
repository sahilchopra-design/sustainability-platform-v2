# Grid Flexibility Market Analytics
**Module ID:** `grid-flexibility-markets` · **Route:** `/grid-flexibility-markets` · **Tier:** B (frontend-computed) · **EP code:** EP-DT2 · **Sprint:** DT

## 1 · Overview
Analytics platform for grid flexibility markets covering frequency response services, reserve markets, capacity market by technology, demand-side response aggregation and flexibility value quantification.

> **Business value:** Grid flexibility markets are growing rapidly with >50% BESS share in GB FFR by 2023; DSR aggregation unlocks 10-30 GW of latent flexibility in developed markets, with value of flexibility estimated at $80-200/MW/yr across stacked service streams.

**How an analyst works this module:**
- Map frequency response services by market: FFR/DCR (GB), FCAS (AU), RegUp/RegDown (ERCOT)
- Analyse reserve market procurement volumes and clearing prices by technology type
- Model capacity market participation for new-build BESS, gas peakers and demand response
- Quantify DSR aggregation economics: load shift potential, revenue per MW and aggregator cost structure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ANCILLARY_SERVICES`, `COUNTRIES`, `KpiCard`, `MARKET_PRICES_WEEKLY`, `Slider`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ANCILLARY_SERVICES` | 9 | `name`, `resp_s`, `duration_min`, `sym`, `cap_eu_mw`, `price_eur_mw_h`, `providers`, `tech_req` |
| `COUNTRIES` | 7 | `fcr_share`, `afrr_cap_mw`, `bess_cap_mw`, `dr_cap_mw`, `interchange_gw`, `re_pct` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalFlexEU` | `COUNTRIES.reduce((s, c) => s + c.afrr_cap_mw + c.bess_cap_mw + c.dr_cap_mw, 0);` |
| `annualRevCalc` | `useMemo(() => { const fcrRev  = capMw * (fcrAlloc / 100) * 18 * 8760 / 1000;` |
| `afrrRev` | `capMw * (afrrAlloc / 100) * 8 * 8760 / 1000;` |
| `arbRev` | `capMw * (arbAlloc / 100) * 35 * 250;` |
| `flexNeedData` | `useMemo(() => [2024, 2026, 2028, 2030, 2032, 2035].map((yr, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ANCILLARY_SERVICES`, `COUNTRIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| FFR Procurement Volume | `Procured via competitive tender; volume set by SO` | National Grid ESO 2023 | GB FFR market cleared at £6-12/MW/hr in 2023; technology-neutral open to BESS, demand response and hydro. |
| Capacity Market Clearing Price | `Competitive auction; T-1 and T-4 auctions annually` | BEIS/National Grid 2023 | GB T-4 auction 2023 cleared at £63/kW/yr; new build BESS required £75+/kW/yr for FID in most assessments. |
| DSR Aggregation Value | `DSR_value = Σ(load_shift × price_differential)` | Rocky Mountain Institute 2022 | Commercial and industrial DSR aggregation delivers 50-200 kW per site; aggregator margins 20-30% of gross revenue. |
- **Market clearing price history** → → revenue model → **$/MW/hr by service and market**
- **DSR potential database** → → aggregation model → **MW available by sector and region**

## 5 · Intermediate Transformation Logic
**Methodology:** Flexibility Value Model
**Headline formula:** `Value_flex = Σ(service_volume × clearing_price) - Opportunity_cost`

Flexibility value varies by market structure; FFR/DCR commands $50-150/MW/hr premium over energy-only dispatch; capacity market provides long-term revenue certainty.

**Standards:** ['National Grid ESO Electricity Market Reform', 'AEMO Integrated System Plan', 'ERCOT Ancillary Services Market Guide']
**Reference documents:** National Grid ESO Electricity Market Reform Consultation 2023; AEMO 2022 Integrated System Plan; ERCOT Ancillary Services Market Guide 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

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

## 9 · Future Evolution

### 9.1 Evolution A — Co-optimised revenue stacking under battery physics (analytics ladder: rung 1 → 3)

**What.** §7 documents that `annualRevCalc` stacks three BESS revenue streams (energy arbitrage, ancillary services like FCR/FFR/DCR at $50–150/MW/hr, capacity market) but the stacking is additive with no de-rating — a MW allocated to FCR and simultaneously earning arbitrage is double-counted — the 52-week price series is `sr()`-seeded, and the service definitions/country capacities/engine prices are hard-coded reference values (§8 marked "not yet implemented"). Evolution A builds the production model the guide names: co-optimise the revenue streams under battery physics (power/energy constraints, state-of-charge, round-trip efficiency, cycle limits), so a MW committed to frequency response cannot also be dispatched for arbitrage in the same interval, and drive it with real market prices rather than a seeded series.

**How.** (1) A co-optimisation engine (linear program, scipy per the roadmap) allocating battery power/energy across FCR/FFR/DCR, arbitrage, and capacity subject to SoC and cycle constraints — replacing additive stacking. (2) Real wholesale and ancillary-service prices from market feeds (ENTSO-E/EIA) replacing the seeded 52-week series. (3) Degradation/cycle costs netted so the flexibility value reflects battery wear.

**Prerequisites.** Wholesale and ancillary-service price feeds by market; battery-physics parameters (power/energy/efficiency/cycle life); the seeded price series and additive stacking replaced. **Acceptance:** revenue stacking respects the physics (no MW double-committed across services in an interval); the annual revenue derives from co-optimisation under real prices; degradation is netted; no `sr()` price feeds the model.

### 9.2 Evolution B — BESS revenue-stacking copilot (LLM tier 2)

**What.** A copilot for storage developers and traders: "for a 100 MW/200 MWh battery on GB markets, what's the optimal revenue stack across FFR, arbitrage, and capacity, and how does it change if FFR prices halve?" tool-calls the Evolution A co-optimisation endpoint and narrates the optimal allocation and its sensitivity.

**How.** Tier-2 tool-calling over the co-optimisation endpoint (a prescriptive tool surface per the roadmap ladder); the grounding corpus is §5/§7 (the flexibility-value model, service definitions, revenue-stack structure). The copilot's value is optimal-dispatch strategy and price-sensitivity analysis under battery constraints. Guardrail, pre-Evolution-A: stacking is additive and prices seeded, so it must refuse revenue-stack figures and flag the double-counting limitation. Every revenue and allocation figure validated against tool output.

**Prerequisites.** Evolution A (no co-optimisation today); market price feeds; corpus embedding. **Acceptance:** post-Evolution-A, every revenue and allocation figure traces to a co-optimisation tool call respecting battery physics; the price-sensitivity what-if re-optimises; pre-Evolution-A the copilot declines revenue-stack claims and notes the additive-stacking limitation.