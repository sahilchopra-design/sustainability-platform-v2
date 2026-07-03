# EV Vehicle-to-Grid Integration Finance
**Module ID:** `ev-v2g-grid-integration` · **Route:** `/ev-v2g-grid-integration` · **Tier:** B (frontend-computed) · **EP code:** EP-DT5 · **Sprint:** DT

## 1 · Overview
Fleet electrification and Vehicle-to-Grid integration finance covering EV fleet cost modelling, V2G grid service revenue, battery degradation cost from V2G cycling, aggregation economics and smart charging optimisation.

> **Business value:** V2G is financially positive for LFP-battery EV fleets with >5kW bidirectional capability and access to FFR/DCR markets; net annual V2G revenue of $100-200/vehicle exceeds degradation cost for LFP chemistry, creating a new fleet revenue stream per IEA EV Outlook 2023 projections.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHARGING_TYPES`, `EV_SEGMENTS`, `HOURS`, `KpiCard`, `Slider`, `TABS`, `V2G_MARKETS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `npv` | `cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + r, t), 0);` |
| `v2gCapMw` | `useMemo(() => (fleetSize * (v2gPct / 100) * EV_SEGMENTS[segment].v2g_cap_kw / 1000).toFixed(1), [fleetSize, v2gPct, segment]);` |
| `fcr` | `mw * fcrPrice * 8760 / 1000;` |
| `arb` | `mw * arbSpread * 250;` |
| `replaceCost` | `batKwh * 120;` |
| `cycles` | `365 * (v2gPct / 100) * 2;` |
| `degradeCost` | `degradeCostPerCycle * cycles * fleetSize;` |
| `capex` | `-(fleetSize * EV_SEGMENTS[segment].v2g_cap_kw * 200);` |
| `degradeData` | `useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(yr => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHARGING_TYPES`, `EV_SEGMENTS`, `TABS`, `V2G_MARKETS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Fleet Electrification TCO | `TCO_EV = CAPEX_EV + Energy + Maintenance - Residual - V2G` | IEA 2023 | EV fleet TCO achieves parity with ICE at diesel >$1.20/litre; lower maintenance cost (40% reduction) offset by |
| V2G Grid Service Revenue | `Revenue = Σ(service_hours × price × V2G_capacity)` | Nissan/National Grid Trial 2023 | UK V2G trial achieved £100-200/vehicle/yr in grid services; scales with EV battery capacity and available disc |
| V2G Battery Degradation | `Deg_cost = (CAPEX_battery × SoH_loss_per_kWh) / battery_kWh` | NREL 2022 | LFP batteries show 2-3× lower degradation per cycle than NMC; V2G with LFP adds minimal degradation at <20% Do |
- **Fleet vehicle data** → → V2G capacity model → **kWh and charge/discharge window by vehicle type**
- **Grid service price history** → → revenue model → **£/MW/hr by service type and time-of-day**

## 5 · Intermediate Transformation Logic
**Methodology:** V2G Net Revenue Model
**Headline formula:** `Net_V2G = Grid_service_revenue - Battery_degradation_cost - Aggregation_cost`
**Standards:** ['IEA EV Outlook 2023', 'National Grid ESO V2G Trials', 'Ofgem V2G Smart Charging Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`