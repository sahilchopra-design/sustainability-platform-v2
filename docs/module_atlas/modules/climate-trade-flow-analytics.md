# Climate Trade Flow Analytics
**Module ID:** `climate-trade-flow-analytics` · **Route:** `/climate-trade-flow-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DN5 · **Sprint:** DN

## 1 · Overview
Analyses the impact of climate policies, carbon pricing, and physical climate risks on global trade flows. Models CBAM-driven trade pattern shifts, carbon leakage dynamics, supply chain reshoring economics, and emerging trade corridor opportunities in clean energy goods.

> **Business value:** Essential for multinational companies with CBAM-exposed import supply chains, trade finance banks, and export-oriented manufacturers in CBAM-affected industries. Provides CBAM cost modelling and clean energy trade opportunity sizing for supply chain strategy.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `CBAM_SECTORS`, `COMMODITIES`, `CORRIDORS`, `KpiCard`, `REGIONS_FROM`, `REGIONS_TO`, `RISK_LEVELS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COMMODITIES` | `['Steel', 'Aluminium', 'Cement', 'Chemicals', 'Fertilisers', 'Electricity', 'Hydrogen', 'Petroleum', 'Plastics', 'Paper/Pulp'];` |
| `totalTradeValue` | `useMemo(() => CORRIDORS.reduce((a, c) => a + c.tradValueBn, 0), []);` |
| `totalCbamCost` | `useMemo(() => CORRIDORS.filter(c => c.cbamExposure).reduce((a, c) => a + c.cbamCostMn, 0), []);` |
| `totalCarbonContent` | `useMemo(() => CORRIDORS.reduce((a, c) => a + c.carbonContentMtco2e, 0), []);` |
| `avgCarbonPrice` | `useMemo(() => CORRIDORS.reduce((a, c) => a + c.carbonPrice, 0) / Math.max(1, CORRIDORS.length), []);` |
| `commodityBreakdown` | `useMemo(() => COMMODITIES.map(com => {` |
| `fromRegionBreakdown` | `useMemo(() => REGIONS_FROM.map(r => {` |
| `cost` | `cors.reduce((a, c) => a + c.cbamCostMn, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CBAM_SECTORS`, `COMMODITIES`, `REGIONS_FROM`, `REGIONS_TO`, `RISK_LEVELS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CBAM Coverage | — | European Commission CBAM Assessment 2023 | CBAM covers €35Bn of annual EU imports across 5 sectors — expanding to all ETS sectors by 2034 |
| Clean Energy Trade Growth | — | IEA Renewable Supply Chain 2023 | Global trade in clean energy goods growing 30% annually — solar panels, EVs, batteries, heat pumps |
| Carbon Leakage Risk | — | IPCC AR6 WGIII Chapter 13 | Without CBAM, unilateral carbon pricing causes 5–20% carbon leakage to non-priced jurisdictions |
- **EU Customs trade data (COMEXT) by product and origin** → CBAM exposure calculation → **Import-level CBAM cost by sector and origin country**
- **IEA clean energy technology demand by sector** → Clean trade opportunity → **Export opportunity sizing for clean energy goods by country**
- **Carbon price data by jurisdiction (ICAP)** → CBAM net cost calculation → **Net CBAM cost after domestic carbon price credit by origin**

## 5 · Intermediate Transformation Logic
**Methodology:** CBAM Trade Flow Impact
**Headline formula:** `CBAMcost_import = Scope1_tCO2e × (EU_ETS_price - CarbonPricePaid_origin); TradePatternShift = f(CBAMcost, TradeElasticity, Alternatives)`
**Standards:** ['EU CBAM Regulation 2023/956', 'WTO Climate Trade Nexus Report 2022', 'IMF World Economic Outlook — Trade and Climate 2023', 'UNCTAD Trade and Climate Change Report 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).