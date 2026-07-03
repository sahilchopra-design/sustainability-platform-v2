# Smart City Climate Finance
**Module ID:** `smart-city-climate-finance` · **Route:** `/smart-city-climate-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DM2 · **Sprint:** DM

## 1 · Overview
Analyses investment in smart city technologies — IoT sensors, AI energy management, smart grids, intelligent transport, and digital water systems — for climate resilience and decarbonisation. Models smart city ROI, energy savings, and GHG reduction co-benefits.

> **Business value:** Directly applicable to smart city technology investors, city CFOs evaluating digital infrastructure, and project finance teams for smart energy or transport. Provides quantitative ROI and GHG co-benefit for smart city investments under EU Mission Cities and IEA Smart City frameworks.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CITIES`, `CITY_NAMES`, `FeatureBadge`, `KpiCard`, `REGIONS`, `TABS`, `TIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];` |
| `tier` | `TIERS[Math.floor(sr(i * 7) * 4)];` |
| `pop` | `+(0.5 + sr(i * 3) * 19.5).toFixed(1);` |
| `score` | `Math.round(40 + sr(i * 11) * 60);` |
| `iot` | `Math.round(10 + sr(i * 13) * 490);` |
| `techInv` | `+(0.2 + sr(i * 17) * 9.8).toFixed(1);` |
| `carbonRed` | `+(5 + sr(i * 19) * 45).toFixed(1);` |
| `energySav` | `Math.round(100 + sr(i * 23) * 4900);` |
| `ppv` | `+(0.1 + sr(i * 29) * 4.9).toFixed(1);` |
| `resil` | `Math.round(30 + sr(i * 31) * 70);` |
| `avgScore` | `filtered.length ? (filtered.reduce((s, c) => s + c.smartCityScore, 0) / filtered.length).toFixed(0) : '0';` |
| `totalTech` | `filtered.reduce((s, c) => s + c.techInvestment, 0).toFixed(1);` |
| `avgCarbon` | `filtered.length ? (filtered.reduce((s, c) => s + c.carbonReduction, 0) / filtered.length).toFixed(1) : '0';` |
| `totalEnergy` | `filtered.reduce((s, c) => s + c.energySavings, 0);` |
| `regionScores` | `REGIONS.map(r => {` |
| `scatterData` | `filtered.map(c => ({ x: c.techInvestment, y: c.carbonReduction, name: c.name }));` |
| `topEnergy` | `[...filtered].sort((a, b) => b.energySavings - a.energySavings).slice(0, 15)` |
| `gridPct` | `arr.length ? Math.round(arr.filter(c => c.energySmartGrid).length / arr.length * 100) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITY_NAMES`, `REGIONS`, `TABS`, `TIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Smart City Investment 2023 | — | IDC Smart Cities Spending Guide 2024 | Global smart city technology investment $120Bn in 2023 — growing 15% yr-on-yr driven by climate goals |
| Smart Building Energy Savings | — | IEA Smart City Buildings 2023 | Smart building management systems reduce energy consumption 15–30% vs conventional buildings |
| EU Smart City Mission | — | EU Mission Cities 2023 | EU Smart City Mission targets 100 climate-neutral, smart cities by 2030 — €360M innovation funding |
- **City energy consumption data by sector + IoT sensor feeds** → Smart energy savings modelling → **Energy reduction and GHG savings from smart systems**
- **Transport data (mode share, congestion, VMT)** → Mobility optimisation → **Smart transport GHG and cost savings**
- **EU Mission Cities funding database** → Grant eligibility analysis → **Available smart city climate funding by technology category**

## 5 · Intermediate Transformation Logic
**Methodology:** Smart City Climate ROI
**Headline formula:** `SmartROI = Σ [(EnergySavings_t + MobilitySavings_t + WaterSavings_t + DisasterAvoidance_t - TechInvestment_t) / (1+r)^t]; GHGReduction = EnergySavings × GridEmissionFactor + MobilityShift × TravelEmissionFactor`
**Standards:** ['IEA Smart City Energy Systems 2023', 'C40 Digital Innovation for Climate 2023', 'World Bank Smart Cities for Climate Resilience 2022', 'EU Smart City Mission — 100 Climate Neutral Cities']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).