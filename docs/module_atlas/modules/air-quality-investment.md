# Air Quality Investment Analytics
**Module ID:** `air-quality-investment` · **Route:** `/air-quality-investment` · **Tier:** B (frontend-computed) · **EP code:** EP-DP3 · **Sprint:** DP

## 1 · Overview
Analyses investment opportunities and co-benefits in air quality improvement — clean cooking, industrial filtration, transport electrification, and building energy efficiency. Models health co-benefit monetisation using WHO DALY methodology and links to climate finance instruments.

> **Business value:** Directly applicable to multilateral development banks programming health-climate nexus investments, health ministers building air quality co-benefit cases for climate finance, and corporate ESG teams quantifying health impact of clean energy investments for SDG 3 reporting.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `KpiCard`, `POLLUTANTS`, `POLLUTANT_FINANCE`, `REGIONS`, `REGION_TYPES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pm25` | `5 + sr(i * 7) * 145;` |
| `no2` | `10 + sr(i * 11) * 90;` |
| `pm10` | `pm25 * (1.2 + sr(i * 13) * 1.3);` |
| `healthCost` | `0.1 + sr(i * 17) * 14.9;` |
| `adjReturn` | `(3 + sr(i * 19) * 5) * (1 - pm25 / 200);` |
| `cleanAirInv` | `0.05 + sr(i * 23) * 2.95;` |
| `premDeaths` | `Math.round(100 + sr(i * 29) * 4900);` |
| `POLLUTANT_FINANCE` | `POLLUTANTS.map((p, i) => ({` |
| `TABS` | `['Overview', 'PM2.5 Burden', 'NO2 Analysis', 'Health-Adjusted Returns', 'Clean Air Finance', 'Pollutant Matrix', 'Investment Screener', 'Policy Alignm` |
| `avgPm25` | `filtered.length ? (filtered.reduce((a, r) => a + r.pm25, 0) / filtered.length).toFixed(1) : '0.0';` |
| `totalHealthCost` | `filtered.reduce((a, r) => a + r.healthCost, 0).toFixed(1);` |
| `totalPremDeaths` | `filtered.reduce((a, r) => a + r.premDeaths, 0).toLocaleString();` |
| `avgAdjReturn` | `filtered.length ? (filtered.reduce((a, r) => a + r.adjReturn, 0) / filtered.length).toFixed(2) : '0.00';` |
| `totalCleanAirInv` | `filtered.reduce((a, r) => a + r.cleanAirInv, 0).toFixed(2);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `POLLUTANTS`, `REGION_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PM2.5 Mortality | — | WHO 2023 | 7 million people die prematurely from air pollution annually — 91% in LMICs; PM2.5 is primary killer |
| Air Quality-Climate Synergy | — | IPCC AR6 WGIII Chapter 3 | Paris Agreement mitigation measures deliver $2.45Tn/yr in air quality health co-benefits by 2050 |
| Clean Cooking Investment Gap | — | IEA World Energy Outlook 2023 | Annual funding gap for universal clean cooking access — would eliminate 3.7M household air pollution deaths |
- **Satellite air quality data (Sentinel-5P, TROPOMI)** → Pollution exposure mapping → **Population-weighted PM2.5 and NO2 exposure by region**
- **Climate investment scenarios by sector** → Co-benefit calculation → **Health co-benefits monetised per $1M climate investment**
- **Clean cooking market data + technology costs** → Investment case → **Clean cooking NPV including health, climate, and productivity benefits**

## 5 · Intermediate Transformation Logic
**Methodology:** Air Quality Health Co-benefit
**Headline formula:** `HealthCoBenefit = ΔPM2.5 × PopulationExposed × DoseResponse × VSL; ClimateAirQualitySynergy = ClimateInvestment × PM2.5ReductionCoefficient × HealthValuePerμg`
**Standards:** ['WHO Global Air Quality Guidelines 2021', 'IPCC AR6 WGII Chapter 7 Health', 'HEI State of Global Air 2023', 'World Bank — Valuing the Health Benefits of Air Quality 2022']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).