# Ocean Health Finance Analytics
**Module ID:** `ocean-health-finance` · **Route:** `/ocean-health-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DJ4 · **Sprint:** DJ

## 1 · Overview
Analyses the financial value of ocean ecosystem services — fisheries, shipping lanes, coastal protection, carbon sequestration, tourism — and quantifies the economic cost of ocean health degradation from climate change, ocean acidification, and pollution.

> **Business value:** Essential for ocean-focused sustainable finance, blue bond issuers, fisheries finance institutions, and sovereign wealth funds of maritime nations. Provides SEEA Ocean-aligned natural capital accounting and financial quantification of ocean health risks for TNFD nature disclosure.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `KpiCard`, `MPA_COLORS`, `OCEAN_REGIONS`, `REGIONS`, `REGION_NAMES`, `RISK_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ohi` | `Math.round(20 + sr(i * 7) * 75);` |
| `mpa` | `+(2 + sr(i * 11) * 48).toFixed(1);` |
| `totalConserv` | `filtered.reduce((a, r) => a + +r.conservationInvestment, 0);` |
| `ohiByRegion` | `REGIONS.map(r => {` |
| `tempVsAcid` | `filtered.map(r => ({` |
| `mpaByRegion` | `REGIONS.map(r => {` |
| `fisheryCollapse` | `[...filtered].sort((a, b) => b.fisheryCollapseProbability - a.fisheryCollapseProbability).slice(0, 15).map(r => ({` |
| `plasticData` | `[...filtered].sort((a, b) => b.plasticPollutionIndex - a.plasticPollutionIndex).slice(0, 15).map(r => ({` |
| `conservData` | `[...filtered].sort((a, b) => b.conservationInvestment - a.conservationInvestment).slice(0, 15).map(r => ({` |
| `carbonSinkData` | `[...filtered].sort((a, b) => b.carbonSinkCapacity - a.carbonSinkCapacity).slice(0, 15).map(r => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGIONS`, `REGION_NAMES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Ocean Economy | — | OECD Ocean Economy Outlook 2016 | Direct economic value of ocean — fisheries, shipping, offshore energy, tourism combined |
| Ocean Acidification Rate | — | IPCC SROCC 2019 | Ocean pH fallen 0.1 units (26% more acidic) — projected 0.3–0.4 units by 2100 under RCP8.5 |
| Marine Biodiversity Loss | — | IPCC SROCC 2019 | Half of coral reef systems face degradation or loss at 2°C warming — 70–90% at 1.5°C |
- **Ocean ecosystem extent and condition data (UNEP-WCMC)** → Natural capital baseline → **Ocean ecosystem service value by type and geography**
- **Climate projection data (SST, pH, deoxygenation)** → Degradation scenario modelling → **Economic loss from ocean health deterioration by 2030/2050/2100**
- **Fisheries catch and aquaculture production data** → Fisheries economic value → **Revenue at risk from stock depletion and species range shifts**

## 5 · Intermediate Transformation Logic
**Methodology:** Ocean Ecosystem Service Valuation
**Headline formula:** `OceanESV = Σ [FisheriesRevenue + ShippingService + CoastalProtection + TourismRevenue + CarbonSeq × CarbonPrice]; AcidificationLoss = ΔpH × CorrosionSensitivity × BiologicalStock`
**Standards:** ['OECD Ocean Economy Outlook 2016', 'IPCC Special Report on Ocean and Cryosphere 2019', 'High Level Panel for a Sustainable Ocean Economy 2020', 'SEEA Ocean Accounting Framework (UN)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).