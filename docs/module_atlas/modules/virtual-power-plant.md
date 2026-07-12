# Virtual Power Plant Economics
**Module ID:** `virtual-power-plant` · **Route:** `/virtual-power-plant` · **Tier:** B (frontend-computed) · **EP code:** EP-DT6 · **Sprint:** DT

## 1 · Overview
Virtual Power Plant economics covering aggregated DER dispatch (rooftop solar, BESS, EV, DSR), multi-stream revenue from energy and ancillary markets, aggregation cost modelling and comparison versus gas peaker plants.

> **Business value:** VPPs are cost-competitive with gas peakers in markets with high renewable penetration and flexible ancillary service markets; aggregated DER portfolios of 100MW+ achieve $3-5/MWh aggregation cost and $80-120/MWh LCOE, 20-40% below new-build gas peaker cost per Rocky Mountain Institute analysis.

**How an analyst works this module:**
- Define VPP portfolio composition: rooftop solar, residential/commercial BESS, EV fleet, industrial DSR
- Model dispatch optimisation across energy, FFR, reserve and capacity market revenue streams
- Calculate aggregation platform cost (software, communications, metering, customer incentives)
- Compare VPP economics versus equivalent gas peaker on LCOE, emissions and response time

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `DISPATCH_HOURS`, `KpiCard`, `MARKETS`, `Slider`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ASSETS` | 7 | `type`, `name`, `cap_mw`, `e_mwh`, `rte`, `flex_up`, `flex_down`, `resp_ms`, `market`, `region` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fcr` | `a.market.includes("FCR")   ? (MARKETS.FCR.price_mw_month   * mw * fcrPct   / 100) * 12 : 0;` |
| `afrr` | `a.market.includes("aFRR")  ? (MARKETS.aFRR.price_mw_month  * mw * afrrPct  / 100) * 12 : 0;` |
| `mfrr` | `a.market.includes("mFRR")  ? (MARKETS.mFRR.price_mw_month  * mw * mfrrPct  / 100) * 12 : 0;` |
| `arb` | `a.market.includes("Arbitrage") ? mw * arbitragePct * 180 * 12 : 0;` |
| `totalCapMw` | `ASSETS.reduce((s, a) => s + a.cap_mw, 0);` |
| `totalEMwh` | `ASSETS.reduce((s, a) => s + a.e_mwh, 0);` |
| `totalFlexUp` | `ASSETS.reduce((s, a) => s + a.flex_up, 0);` |
| `totalFlexDn` | `ASSETS.reduce((s, a) => s + a.flex_down, 0);` |
| `annualRevenue` | `useMemo(() => calcDispatchRevenue({ assets: ASSETS, fcrPct, afrrPct, arbitragePct: arbPct, mfrrPct }), [fcrPct, afrrPct, arbPct, mfrrPct]);  const revenueByAsset = useMemo(() => ASSETS.map(a => { const mw = a.cap_mw;` |
| `freqRespData` | `useMemo(() => Array.from({ length: 60 }, (_, i) => { const t = i * 0.5;` |
| `bess` | `t > 5 ? -disturbance * 0.8 : 0;` |
| `marginalCostCurve` | `useMemo(() => [ { cap_mw: 0, price: 0 }, { cap_mw: 40, price: 5 }, { cap_mw: 80, price: 12 }, { cap_mw: 120, price: 18 }, { cap_mw: 160, price: 28 }, { cap_mw: 220, price: 42 }, { cap_mw: 280, price: 65 }, { cap_mw: 320, price: margRate }, { cap_mw: 380, price: margRate + 20 }, ], [margRate]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Aggregated DER Capacity | `C_VPP = Σ(C_solar + C_BESS + C_EV + C_DSR) × availability` | NREL 2023 | Typical residential VPP: 5kW solar + 10kWh BESS per home; 10,000 homes = 50MW/100MWh aggregate capacity. |
| VPP vs Peaker LCOE | `LCOE_VPP = Aggregation_cost + Incentive_payments / Energy_dispatched` | Rocky Mountain Institute 2022 | VPP cost advantage over gas peakers is confirmed in US, AU and GB markets; 2-hour capacity value critical to comparison. |
| Aggregation Platform Cost | `Platform_cost = Software + Comms + Metering + Staff / Annual_MWh` | AEMC 2023 | Aggregation cost declining with scale; >100MW portfolios achieve $3-5/MWh; key margin lever for VPP operators. |
- **DER asset registry** → → VPP capacity model → **kW and availability by asset type and location**
- **Spot and ancillary price history** → → dispatch optimiser → **$/MWh by market and 30-min interval**

## 5 · Intermediate Transformation Logic
**Methodology:** VPP Revenue Optimisation
**Headline formula:** `VPP_profit = Σ_t(dispatch_decision_t × (price_t - marginal_cost_t)) - Aggregation_OPEX`

VPP optimises dispatch across energy arbitrage, FFR, reserve and capacity markets simultaneously; ML-based dispatch improves revenue 15-25% over rule-based dispatch per NREL analysis.

**Standards:** ['NREL Virtual Power Plants 2023', 'Rocky Mountain Institute VPP Report 2022', 'AEMC VPP Demonstration Program']
**Reference documents:** NREL Virtual Power Plants: Opportunities and Challenges 2023; Rocky Mountain Institute The Economics of Virtual Power Plants 2022; AEMC VPP Demonstration Final Report 2022

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

## 7 · Methodology Deep Dive

This module implements a genuine multi-market revenue-stacking calculation for a 6-asset VPP
portfolio (BESS, EV fleet V2G, industrial demand response, solar+BESS, wind+BESS) — closer to the
guide's stated methodology than most modules in this batch. However, the headline "Annual Revenue"
KPI contains an **annualisation bug** that materially understates the true figure relative to the
module's own per-asset revenue-stack chart, documented in §7.4.

### 7.1 What the module computes

```js
// calcDispatchRevenue() — drives the headline "Annual Revenue" KPI
fcr  = asset.market.includes('FCR')  ? MARKETS.FCR.price_mw_month  × mw × fcrPct/100  / 12 : 0
afrr = asset.market.includes('aFRR') ? MARKETS.aFRR.price_mw_month × mw × afrrPct/100 / 12 : 0
mfrr = asset.market.includes('mFRR') ? MARKETS.mFRR.price_mw_month × mw × mfrrPct/100 / 12 : 0
arb  = asset.market.includes('Arbitrage') ? mw × arbitragePct × 180 / 12 : 0
total = Σ_asset (fcr + afrr + mfrr + arb)

// revenueByAsset — drives the Revenue Stack chart (a DIFFERENT formula, annualised correctly)
fcr' = MARKETS.FCR.price_mw_month × mw × fcrPct/100 × 12   // note: ×12, not ÷12
arb' = mw × arbPct × 180 × 12
```

Each asset carries `cap_mw`, `e_mwh`, round-trip efficiency `rte`, `flex_up`/`flex_down` (MW),
response time `resp_ms`, and a list of eligible markets (FCR/aFRR/mFRR/DSR/Arbitrage/CfD).

### 7.2 Parameterisation

| Market | `price_mw_month` | Response | Regulator |
|---|---|---|---|
| FCR (Frequency Containment) | £12,000/MW/mo | 30 sec | ENTSO-E |
| aFRR (Automatic Restoration) | £8,000/MW/mo | 300 sec | ENTSO-E |
| mFRR (Manual Restoration) | £4,000/MW/mo | 900 sec | ENTSO-E |
| DSR (Demand-Side Response) | £3,500/MW/mo | 120 sec | National Grid ESO |
| Arbitrage (Day-Ahead) | — (priced via `180`/MW-day constant) | 3,600 sec | EPEX/N2EX |
| CfD (Balancing) | £2,000/MW/mo | 60 sec | LCCC |

These are plausible UK balancing-market price levels (author-calibrated, not pulled from a live
National Grid ESO/EPEX feed) and are internally consistent with the guide's cited NREL/RMI/AEMC
sources in *character* (revenue stacking across energy + ancillary markets) if not in exact figures.

### 7.3 Calculation walkthrough

1. Six sliders (`fcrPct`, `afrrPct`, `mfrrPct`, `arbPct`, `margRate`) represent the % of each asset's
   capacity committed to each market, defaulting to 60/40/30/70/15.
2. `annualRevenue` (VPP Overview KPI) calls `calcDispatchRevenue()`, summing across all 6 assets.
3. `revenueByAsset` (Revenue Stack tab) recomputes the *same* four revenue streams per asset with a
   **different annualisation factor** for the chart view.
4. `freqRespData` (Frequency Response tab) simulates a 30-second frequency-nadir event
   (`disturbance = −0.35·(1−e^{−0.8(t−5)})` for 5s<t<10s) and a BESS response
   (`bess = −disturbance × 0.8 × 50`) — an illustrative first-order response curve, not read from
   real grid telemetry.
5. `marginalCostCurve` (Market Stacking tab) is a fixed 9-point merit-order curve with the last two
   points parameterised by the `margRate` slider (`price = margRate` at 320MW, `margRate+20` at
   380MW) — a simplified merit-order illustration, not solved from actual asset marginal costs.

### 7.4 Worked example — the annualisation bug

Take BESS-2 (Pillswood, 196MW), eligible for FCR/aFRR/mFRR/Arbitrage, at default slider values
(fcrPct=60, afrrPct=40, mfrrPct=30, arbPct=70):

| Stream | `calcDispatchRevenue` (KPI) | `revenueByAsset` (chart) | Ratio |
|---|---|---|---|
| FCR | `12,000×196×0.60/12 = £117,600` | `12,000×196×0.60×12 = £16,934,400` | **144×** |
| aFRR | `8,000×196×0.40/12 = £52,267` | `8,000×196×0.40×12 = £7,526,400` | **144×** |
| Arbitrage | `196×70×180/12 = £205,800` | `196×70×180×12 = £29,635,200` | **144×** |

The KPI-driving formula divides an already-monthly price by 12 (giving a *daily-scale* figure) while
the chart-driving formula correctly multiplies by 12 to annualise — a **144× (12²) discrepancy**
between the headline "Annual Revenue" KPI and the sum of the Revenue Stack chart for the same asset
and the same slider settings. A user comparing the Overview tab's KPI to the Revenue Stack tab's
totals would see wildly inconsistent numbers for what should be the identical calculation.

Separately, the **`Arbitrage` term never divides `arbitragePct` by 100** in either formula (unlike
`fcrPct/100`, `afrrPct/100`, `mfrrPct/100`), so arbitrage revenue is scaled ~100× larger relative to
its intended "% of time" meaning — at `arbPct=70` the code effectively treats it as 7,000%, not 70%.

### 7.5 Data provenance & limitations

- **The 6 VPP assets are named after real UK projects** (Minety, Pillswood, TfL bus fleet, Sunnica,
  Hornsea 3) with plausible capacity figures, but the market prices, dispatch schedule
  (`DISPATCH_HOURS`), and frequency-response curve are synthetic/illustrative.
- **The annualisation and percentage-normalisation bugs in §7.4 should be fixed before this module's
  headline KPI is used for any investment or planning decision** — currently the Overview tab's
  "Annual Revenue" is not a reliable figure.
- No optimiser exists — the sliders are static allocation inputs, not the output of a genuine
  dispatch-optimisation solve (the guide's `VPP_profit = Σ(dispatch_decision × (price−marginal_cost))`
  formula implies a per-interval optimisation that isn't present).

**Framework alignment:** NREL Virtual Power Plants (2023) and Rocky Mountain Institute VPP Economics
(2022) are named as the guide's sources for the revenue-stacking *concept*, which the module does
structurally implement (multiple simultaneous market streams per asset) — but not for the specific
price levels or the buggy annualisation, which are implementation defects rather than methodology
gaps.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production VPP dispatch-optimisation model determines, for each settlement period, how much of
each DER asset's flexible capacity to commit to each market to maximise portfolio revenue net of
degradation and aggregation cost — informing bid strategy and asset-sizing decisions for VPP
operators and DER aggregators.

### 8.2 Conceptual approach
Formulate as a mixed-integer linear program (MILP) per settlement period, the standard approach used
in commercial VPP dispatch platforms (AutoGrid, Fluence IQ, GE's DERMS) and academically documented in
NREL's VPP optimisation literature: maximise Σ(price × dispatch) subject to state-of-charge,
ramp-rate, and market-exclusivity constraints, with a degradation cost penalty on BESS cycling.

### 8.3 Mathematical specification

```
maximise  Σ_t Σ_m ( Price_m,t × Dispatch_a,m,t ) − DegradationCost_a × Σ_t |ΔSoC_a,t|
subject to:
  Σ_m Dispatch_a,m,t ≤ FlexUp_a  (or FlexDown_a)         // capacity constraint per asset per period
  SoC_a,t = SoC_a,t-1 + (Dispatch_a,t × η_rte) / E_mwh_a  // state-of-charge evolution
  0 ≤ SoC_a,t ≤ 1                                          // physical SoC bounds
  ResponseTime_m ≥ resp_ms_a                                // market eligibility gate
DegradationCost_a = CapexReplacement_a / (2 × CycleLife_a × E_mwh_a)   // $/MWh cycled
```

| Parameter | Calibration source |
|---|---|
| `Price_m,t` | Live ENTSO-E/National Grid ESO/EPEX/N2EX market feeds (public APIs) |
| `η_rte` | Manufacturer BESS round-trip efficiency spec (already in `ASSETS.rte`) |
| `CycleLife_a` | Cell manufacturer datasheet (e.g. LFP ~6,000 cycles at 80% DoD) |
| `DegradationCost_a` | NREL/BNEF BESS degradation-cost methodology |

### 8.4 Data requirements
Real-time and day-ahead price feeds for FCR/aFRR/mFRR/DSR/Arbitrage/CfD (National Grid ESO Balancing
Mechanism Reporting Service, EPEX SPOT — both have public/subscription APIs), asset telemetry
(actual SoC, dispatch history), and BESS degradation/warranty data. The platform's existing `ASSETS`
schema already carries the physical parameters (`rte`, `flex_up/down`, `resp_ms`) an optimiser needs.

### 8.5 Validation & benchmarking plan
Backtest optimiser-recommended dispatch against realised National Grid ESO settlement prices for the
same historical period (revenue backtest); reconcile against NREL's cited 15–25% ML-dispatch-vs-
rule-based-dispatch uplift benchmark; unit-test the annualisation and percentage-normalisation logic
explicitly (the bugs in §7.4 would have been caught by a simple "does chart total equal KPI" test).

### 8.6 Limitations & model risk
A per-period MILP re-solved naively at scale is computationally expensive for large portfolios;
production systems typically use a rolling-horizon heuristic or Lagrangian relaxation. Market price
forecasts (especially for day-ahead arbitrage) carry material uncertainty — a deterministic MILP
should be paired with a stochastic/robust variant or at minimum a sensitivity band around the point
forecast before being used to size aggregation-fee contracts.

## 9 · Future Evolution

### 9.1 Evolution A — Fix the 144× annualisation defect, then a real dispatch optimiser (analytics ladder: rung 2 → 3)

**What.** The revenue-stacking structure is genuinely implemented (per-asset
FCR/aFRR/mFRR/Arbitrage streams with market-eligibility gates and live sliders — real
what-if capability), but §7.4 documents two arithmetic defects that make the headline
KPI unusable: `calcDispatchRevenue` divides an already-monthly price by 12 while
`revenueByAsset` multiplies by 12 — a 144× (12²) discrepancy between the Overview KPI
and the Revenue Stack chart for identical inputs — and the Arbitrage term never
divides `arbitragePct` by 100, inflating it ~100×. Evolution A fixes both with the §8.5
prescribed "chart total equals KPI" unit test, then implements the §8 spec's MILP
slice: per-settlement-period dispatch maximising `Σ Price × Dispatch` subject to
state-of-charge (the `ASSETS` schema already carries `rte`, `e_mwh`, `flex_up/down`,
`resp_ms`), with BESS degradation cost from cycle-life data, replacing the static
slider allocation with an optimised one users can still override.

**How.** Backend `vpp_dispatch_engine` (module is Tier B, EP-DT6) with
`POST /optimise` (scipy linprog / PuLP — standard tooling per the roadmap's rung-5
guidance); market prices stay author-calibrated UK levels initially, provenance-
labelled, with an ENTSO-E/Elexon feed as the calibration upgrade (the platform's
ENTSO-E ingestion from data-sources wave 1 is the natural source).

**Prerequisites.** The two §7.4 bugs fixed and regression-pinned in `bench_quant`
before any optimisation work — optimising on broken revenue math would be worse than
useless. **Acceptance:** Overview KPI equals the Revenue Stack chart total to the
pound; `arbPct=70` means 70%; the optimiser's allocation beats the default sliders'
revenue on the same price inputs.

### 9.2 Evolution B — Bid-strategy analyst over the dispatch engine (LLM tier 2)

**What.** VPP operators iterate bid strategy questions all day: "if FCR clears 20%
lower next quarter, where should Pillswood's 196MW go?", "what's the revenue cost of
reserving 30MW for the TfL fleet's charging window?". Evolution B is a tool-calling
analyst over Evolution A's `POST /optimise` plus a `GET /markets` reference route: it
runs counterfactual optimisations, compares revenue stacks, and narrates the binding
constraints from the solver output (SoC limits, response-time eligibility, market
exclusivity) — the explanation layer a MILP badly needs, since raw shadow prices mean
nothing to most users.

**How.** Tier-2 stack: tool schemas from the new OpenAPI operations; grounding corpus
is this Atlas page including §7.2's market table and §7.5's provenance caveats (asset
names are real UK projects, Minety/Pillswood/Hornsea 3, but prices are author-
calibrated). Every £ figure in an answer must appear in a tool response; the "show
work" expander lists the optimiser run parameters and engine version.

**Prerequisites (hard).** Evolution A complete — the copilot must never narrate the
current KPI, which is off by 144× from the module's own chart; solver runs bounded
(timeout + asset-count cap) so conversational what-ifs stay interactive.
**Acceptance:** counterfactual answers cite two optimiser runs (base + shocked) with
the delta computed from their payloads; asked for real current FCR clearing prices,
the analyst states the calibration provenance and refuses to present platform
constants as live market data.