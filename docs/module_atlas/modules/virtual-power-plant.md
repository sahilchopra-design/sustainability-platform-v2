# Virtual Power Plant Economics
**Module ID:** `virtual-power-plant` · **Route:** `/virtual-power-plant` · **Tier:** B (frontend-computed) · **EP code:** EP-DT6 · **Sprint:** DT

## 1 · Overview
Virtual Power Plant economics covering aggregated DER dispatch (rooftop solar, BESS, EV, DSR), multi-stream revenue from energy and ancillary markets, aggregation cost modelling and comparison versus gas peaker plants.

> **Business value:** VPPs are cost-competitive with gas peakers in markets with high renewable penetration and flexible ancillary service markets; aggregated DER portfolios of 100MW+ achieve $3-5/MWh aggregation cost and $80-120/MWh LCOE, 20-40% below new-build gas peaker cost per Rocky Mountain Institute analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `DISPATCH_HOURS`, `KpiCard`, `MARKETS`, `Slider`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fcr` | `a.market.includes("FCR")   ? (MARKETS.FCR.price_mw_month   * mw * fcrPct   / 100) / 12 : 0;` |
| `afrr` | `a.market.includes("aFRR")  ? (MARKETS.aFRR.price_mw_month  * mw * afrrPct  / 100) / 12 : 0;` |
| `mfrr` | `a.market.includes("mFRR")  ? (MARKETS.mFRR.price_mw_month  * mw * mfrrPct  / 100) / 12 : 0;` |
| `arb` | `a.market.includes("Arbitrage") ? mw * arbitragePct * 180 / 12 : 0;` |
| `totalCapMw` | `ASSETS.reduce((s, a) => s + a.cap_mw, 0);` |
| `totalEMwh` | `ASSETS.reduce((s, a) => s + a.e_mwh, 0);` |
| `totalFlexUp` | `ASSETS.reduce((s, a) => s + a.flex_up, 0);` |
| `totalFlexDn` | `ASSETS.reduce((s, a) => s + a.flex_down, 0);` |
| `revenueByAsset` | `useMemo(() => ASSETS.map(a => {` |
| `fcr` | `a.market.includes("FCR")   ? MARKETS.FCR.price_mw_month   * mw * fcrPct   / 100 * 12 : 0;` |
| `afrr` | `a.market.includes("aFRR")  ? MARKETS.aFRR.price_mw_month  * mw * afrrPct  / 100 * 12 : 0;` |
| `mfrr` | `a.market.includes("mFRR")  ? MARKETS.mFRR.price_mw_month  * mw * mfrrPct  / 100 * 12 : 0;` |
| `arb` | `a.market.includes("Arbitrage") ? mw * arbPct * 180 * 12 : 0;` |
| `bess` | `t > 5 ? -disturbance * 0.8 : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Aggregated DER Capacity | `C_VPP = Σ(C_solar + C_BESS + C_EV + C_DSR) × availability` | NREL 2023 | Typical residential VPP: 5kW solar + 10kWh BESS per home; 10,000 homes = 50MW/100MWh aggregate capacity. |
| VPP vs Peaker LCOE | `LCOE_VPP = Aggregation_cost + Incentive_payments / Energy_dispatched` | Rocky Mountain Institute 2022 | VPP cost advantage over gas peakers is confirmed in US, AU and GB markets; 2-hour capacity value critical to c |
| Aggregation Platform Cost | `Platform_cost = Software + Comms + Metering + Staff / Annual_MWh` | AEMC 2023 | Aggregation cost declining with scale; >100MW portfolios achieve $3-5/MWh; key margin lever for VPP operators. |
- **DER asset registry** → → VPP capacity model → **kW and availability by asset type and location**
- **Spot and ancillary price history** → → dispatch optimiser → **$/MWh by market and 30-min interval**

## 5 · Intermediate Transformation Logic
**Methodology:** VPP Revenue Optimisation
**Headline formula:** `VPP_profit = Σ_t(dispatch_decision_t × (price_t - marginal_cost_t)) - Aggregation_OPEX`
**Standards:** ['NREL Virtual Power Plants 2023', 'Rocky Mountain Institute VPP Report 2022', 'AEMC VPP Demonstration Program']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`