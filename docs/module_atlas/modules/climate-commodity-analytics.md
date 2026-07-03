# Climate Commodity Analytics
**Module ID:** `climate-commodity-analytics` · **Route:** `/climate-commodity-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DG6 · **Sprint:** DG

## 1 · Overview
Analyses climate change impacts on commodity markets including supply disruption risk, price volatility amplification, and transition-driven demand destruction for fossil fuels. Models agricultural commodity yield shocks, energy commodity demand curves under decarbonisation, and commodity-linked financial risk.

> **Business value:** Essential for commodity trading houses, agricultural finance institutions, energy company CFOs, and macro hedge funds. Provides climate-adjusted commodity price forecasts, supply chain disruption probabilities, and fossil fuel demand destruction modelling under IEA transition scenarios.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CLIMATE_SCENARIOS`, `COMMODITIES`, `HEDGE_INSTRUMENTS`, `KpiCard`, `PRICE_SERIES`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `priceData` | `useMemo(() => PRICE_SERIES.slice(0, 24).map(p => ({` |
| `varData` | `useMemo(() => COMMODITIES.map(c => ({ name: c.name.split(' ')[0], var95: c.climateVaR95, yieldSens: Math.abs(c.yieldSens) })), []);` |
| `climateImpactData` | `useMemo(() => COMMODITIES.filter(c => c[c.id] !== undefined \|\| true).map(c => ({` |
| `supplyData` | `useMemo(() => YEARS.map((yr, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLIMATE_SCENARIOS`, `COMMODITIES`, `HEDGE_INSTRUMENTS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate-Driven Commodity Volatility | — | IMF World Economic Outlook 2023 | Climate change could increase agricultural commodity price volatility 30–50% under RCP4.5 |
| Fossil Fuel Stranded Assets | — | Carbon Tracker Unburnable Carbon 2023 | Fossil fuel assets stranded under Paris-aligned scenarios — concentrated in coal then oil then gas |
| Critical Mineral Demand | — | IEA Critical Minerals Report 2023 | Energy transition drives 4–6× demand increase for lithium, cobalt, copper, and rare earths by 2040 |
- **Commodity production data by region (USDA, IEA, OPEC)** → Supply shock modelling → **Production loss probability by climate scenario and commodity**
- **Historical commodity prices + climate event database** → Climate beta estimation → **Climate risk premium by commodity class**
- **IEA transition demand scenarios (STEPS/APS/NZE)** → Demand destruction modelling → **Revenue at risk for fossil fuel commodity producers**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Commodity Risk Premium
**Headline formula:** `ClimateRiskPremium = HistoricVolatility × ClimateBeta × (1 + PhysicalRisk/100); PhysicalSupplyShock = Σ [ProductionWeight_i × YieldLoss_i × P(climate_event)]`
**Standards:** ['IPCC AR6 WGII Supply Disruption Chapter', 'IMF Climate and Commodity Markets 2023', 'NGFS Scenarios Commodity Sensitivity', 'World Bank Commodity Markets Outlook']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).