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
