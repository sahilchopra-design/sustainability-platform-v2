# Urban Mobility Transition Finance
**Module ID:** `urban-mobility-transition` · **Route:** `/urban-mobility-transition` · **Tier:** B (frontend-computed) · **EP code:** EP-DM4 · **Sprint:** DM

## 1 · Overview
Analyses the investment economics of urban transport decarbonisation — electric buses, metro/rail, cycling infrastructure, and congestion pricing. Models modal shift impacts on GHG emissions, urban air quality, and the financial sustainability of public transport operators.

> **Business value:** Directly applicable to city transport departments, transit operators issuing green bonds, and infrastructure funds investing in urban mobility. Provides social cost-benefit analysis capturing health and GHG co-benefits for public finance justification and green bond impact reporting.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CITIES`, `CITY_NAMES`, `KpiCard`, `REGIONS`, `TABS`, `TRANSITION_LEVELS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];` |
| `level` | `TRANSITION_LEVELS[Math.floor(sr(i * 7) * 4)];` |
| `evShare` | `+(5 + sr(i * 3) * 75).toFixed(1);` |
| `evFleet` | `+(2 + sr(i * 11) * 48).toFixed(1);` |
| `transitShare` | `+(10 + sr(i * 13) * 60).toFixed(1);` |
| `cycling` | `Math.round(20 + sr(i * 17) * 980);` |
| `carFree` | `+(0.5 + sr(i * 19) * 29.5).toFixed(1);` |
| `congCharge` | `sr(i * 23) > 0.6;` |
| `lez` | `sr(i * 29) > 0.4;` |
| `emissions` | `+(0.5 + sr(i * 31) * 9.5).toFixed(2);` |
| `transScore` | `Math.round(20 + sr(i * 37) * 80);` |
| `chargingPts` | `+(5 + sr(i * 41) * 145).toFixed(0);` |
| `activeScore` | `+(2 + sr(i * 43) * 8).toFixed(1);` |
| `mobInv` | `+(0.2 + sr(i * 47) * 9.8).toFixed(1);` |
| `emisRed` | `+(5 + sr(i * 53) * 55).toFixed(1);` |
| `avgEV` | `filtered.length ? (filtered.reduce((s, c) => s + c.evShareNewSales, 0) / filtered.length).toFixed(1) : '0';` |
| `avgTransit` | `filtered.length ? (filtered.reduce((s, c) => s + c.publicTransitShare, 0) / filtered.length).toFixed(1) : '0';` |
| `totalMobInv` | `filtered.reduce((s, c) => s + c.mobilityInvestment, 0).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITY_NAMES`, `REGIONS`, `TABS`, `TRANSITION_LEVELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Urban Transport Emissions Share | — | IEA Transport 2023 | Urban transport accounts for 40% of road transport emissions — buses and private cars are primary targets |
| Electric Bus Cost Premium | — | BloombergNEF EV Market 2024 | Electric bus upfront cost 20–30% more than diesel — but TCO parity in 3–5 years from fuel savings |
| Urban Cycling Investment BCR | — | WHO Cycling Evidence Brief 2023 | Urban cycling infrastructure delivers 5:1 benefit-cost ratio including health, environment, and congestion |
- **City transport mode share + vehicle fleet data** → Emissions baseline → **Transport sector GHG inventory by mode**
- **Transport investment cost databases (UITP, CODATU)** → Investment modelling → **CapEx and OpEx per passenger-km by mode**
- **Air quality and health impact data (WHO HIA)** → Co-benefit valuation → **Annual health co-benefit from air quality improvement**

## 5 · Intermediate Transformation Logic
**Methodology:** Urban Mobility Transition NPV
**Headline formula:** `MobilityNPV = Σ [(FuelSavings_t + HealthCoBenefit_t + CarbonSavings_t × CarbonPrice + CongestionRelief_t - CapEx_t - OpEx_t) / (1+r)^t]; GHGReduction = ModalShift × (ICEfactor - EVfactor) × VKT`
**Standards:** ['IEA Future of Urban Mobility 2023', 'IPCC AR6 WGIII Chapter 10 — Transport', 'C40 Electric Bus Declaration', 'SLOCAT Transport and Climate Change Global Status Report']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).