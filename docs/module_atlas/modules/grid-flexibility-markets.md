# Grid Flexibility Market Analytics
**Module ID:** `grid-flexibility-markets` · **Route:** `/grid-flexibility-markets` · **Tier:** B (frontend-computed) · **EP code:** EP-DT2 · **Sprint:** DT

## 1 · Overview
Analytics platform for grid flexibility markets covering frequency response services, reserve markets, capacity market by technology, demand-side response aggregation and flexibility value quantification.

> **Business value:** Grid flexibility markets are growing rapidly with >50% BESS share in GB FFR by 2023; DSR aggregation unlocks 10-30 GW of latent flexibility in developed markets, with value of flexibility estimated at $80-200/MW/yr across stacked service streams.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ANCILLARY_SERVICES`, `COUNTRIES`, `KpiCard`, `MARKET_PRICES_WEEKLY`, `Slider`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalFlexEU` | `COUNTRIES.reduce((s, c) => s + c.afrr_cap_mw + c.bess_cap_mw + c.dr_cap_mw, 0);` |
| `fcrRev` | `capMw * (fcrAlloc / 100) * 18 * 8760 / 1000;` |
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
| DSR Aggregation Value | `DSR_value = Σ(load_shift × price_differential)` | Rocky Mountain Institute 2022 | Commercial and industrial DSR aggregation delivers 50-200 kW per site; aggregator margins 20-30% of gross reve |
- **Market clearing price history** → → revenue model → **$/MW/hr by service and market**
- **DSR potential database** → → aggregation model → **MW available by sector and region**

## 5 · Intermediate Transformation Logic
**Methodology:** Flexibility Value Model
**Headline formula:** `Value_flex = Σ(service_volume × clearing_price) - Opportunity_cost`
**Standards:** ['National Grid ESO Electricity Market Reform', 'AEMO Integrated System Plan', 'ERCOT Ancillary Services Market Guide']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`