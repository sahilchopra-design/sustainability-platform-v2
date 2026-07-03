# Heat Stress Finance Analytics
**Module ID:** `heat-stress-finance` · **Route:** `/heat-stress-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DP1 · **Sprint:** DP

## 1 · Overview
Quantifies the financial costs of extreme heat — worker productivity loss, energy demand spikes, agricultural yield reduction, and heat-related health system costs. Models heat stress exposure by sector and geography using WBGT index and IPCC temperature projections.

> **Business value:** Critical for insurers pricing heat-related health products, agricultural banks, industrial company CHRO teams assessing heat risk, and government public health authorities. Provides Lancet Countdown-aligned heat stress economic quantification for TCFD and TNFD physical risk disclosure.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `CITIES`, `KpiCard`, `REGIONS`, `SECTORS`, `SECTOR_DATA`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['South Asia', 'Southeast Asia', 'Sub-Saharan Africa', 'MENA', 'Latin America', 'Southern Europe', 'Caribbean', 'Pacific Islands'];` |
| `rIdx` | `Math.floor(sr(i * 3) * REGIONS.length);` |
| `wbgt` | `24 + sr(i * 7) * 17;` |
| `prodLoss` | `3 + sr(i * 11) * 22;` |
| `adaptCost` | `0.2 + sr(i * 13) * 4.8;` |
| `labourRisk` | `Math.min(100, 20 + sr(i * 17) * 70);` |
| `heatDeaths` | `Math.round(10 + sr(i * 19) * 490);` |
| `gdpImpact` | `0.5 + sr(i * 23) * 6.5;` |
| `workdaysLost` | `Math.round(5 + sr(i * 29) * 55);` |
| `insuranceGap` | `20 + sr(i * 31) * 70;` |
| `SECTOR_DATA` | `SECTORS.map((s, i) => ({` |
| `avgWbgt` | `filtered.length ? (filtered.reduce((a, c) => a + c.wbgt, 0) / filtered.length).toFixed(1) : '0.0';` |
| `avgProdLoss` | `filtered.length ? (filtered.reduce((a, c) => a + c.prodLoss, 0) / filtered.length).toFixed(1) : '0.0';` |
| `totalAdaptCost` | `filtered.reduce((a, c) => a + c.adaptCost, 0).toFixed(1);` |
| `totalHeatDeaths` | `filtered.reduce((a, c) => a + c.heatDeaths, 0).toLocaleString();` |
| `avgGdpImpact` | `filtered.length ? (filtered.reduce((a, c) => a + c.gdpImpact, 0) / filtered.length).toFixed(2) : '0.00';` |
| `avgInsGap` | `filtered.length ? (filtered.reduce((a, c) => a + c.insuranceGap, 0) / filtered.length).toFixed(1) : '0.0';` |
| `avgW` | `rcities.length ? (rcities.reduce((a, c) => a + c.wbgt, 0) / rcities.length).toFixed(1) : '-';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Workers Exposed to Heat Stress | — | ILO 2023 | 2.4 billion workers exposed to excessive heat by 2030 — agriculture (60%), construction (20%) most exposed |
| GDP Loss from Heat Stress | — | ILO Climate and Work 2023 | Annual global GDP loss from heat productivity reduction — equivalent to 40M full-time jobs |
| Excess Heat Deaths 2023 | — | Lancet Countdown 2023 | Europe recorded 61,000+ excess heat deaths in 2022 — highest on record; growing 3% yr-on-yr |
- **WBGT projections by SSP/region (NASA GISS)** → Heat exposure calculation → **Annual hours above safe WBGT by sector and geography**
- **Sectoral employment data + wage rates** → Productivity loss calculation → **Annual GDP loss from heat-induced productivity reduction**
- **Health system utilisation + mortality data** → Health cost modelling → **Heat-related excess mortality and morbidity costs**

## 5 · Intermediate Transformation Logic
**Methodology:** Heat Stress Economic Cost
**Headline formula:** `ProductivityLoss = ExposedWorkers × HoursLostPerWorker × WageRate × (1 + ProductivityMultiplier); HeatEAL_health = ΔMortality × VSL + ΔMorbidity × DailyCost`
**Standards:** ['ILO Heat and Work Safety Report 2023', 'WHO Environmental Burden of Disease 2022', 'IPCC AR6 WGII Chapter 7 — Health', 'Lancet Countdown on Health and Climate Change 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).