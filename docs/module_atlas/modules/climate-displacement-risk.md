# Climate Displacement Risk Analytics
**Module ID:** `climate-displacement-risk` · **Route:** `/climate-displacement-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DI4 · **Sprint:** DI

## 1 · Overview
Quantifies financial exposure to climate-driven population displacement including migration flows, stranded real estate, sovereign fiscal stress, and remittance disruption. Models climate migration scenarios using IPCC SSP pathways and World Bank GROUNDSWELL projections.

> **Business value:** Essential for sovereign debt analysts modelling social cohesion risk, EM equity investors in real estate and financial services, and development finance institutions programming climate adaptation. Directly linked to V20 agenda and UNHCR climate displacement finance mechanisms.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BLUE`, `COUNTRY_NAMES`, `DISPLACEMENT_COUNTRIES`, `DRIVERS`, `HIST_YEARS`, `INDIGO`, `PURPLE`, `REGIONS`, `RISK_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Sub-Saharan Africa', 'South Asia', 'Southeast Asia', 'MENA', 'Latin America', 'Pacific Islands', 'East Africa', 'Central America'];` |
| `DRIVERS` | `['Sea Level', 'Drought', 'Flood', 'Heat', 'Conflict-Climate'];` |
| `currentDisplacedM` | `+(0.1 + sr(i * 7) * 9.9).toFixed(2);` |
| `displacementRiskScore` | `Math.round(10 + sr(i * 11) * 85);` |
| `tempMultiplier` | `1 + (tempScenario - 1.5) * 0.15;` |
| `financeBoost` | `financeTarget / 100;` |
| `totalDisplaced` | `filtered.reduce((s, c) => s + c.currentDisplacedM, 0);` |
| `totalProjected2040` | `filtered.reduce((s, c) => s + c.projected2040M * tempMultiplier, 0);` |
| `avgAdaptFunding` | `filtered.length ? filtered.reduce((s, c) => s + c.adaptationFunding * financeBoost, 0) / filtered.length : 0;` |
| `refugeePct` | `filtered.length ? (filtered.filter(c => c.climateRefugeeRecognition).length / filtered.length) * 100 : 0;` |
| `scatterData` | `filtered.map(c => ({` |
| `driverBreakdown` | `DRIVERS.map(d => ({` |
| `globalTrend` | `HIST_YEARS.map((yr, idx) => {` |
| `baseFactor` | `0.4 + idx * 0.1;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_NAMES`, `DRIVERS`, `HIST_YEARS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Internal Climate Migrants by 2050 | — | World Bank GROUNDSWELL 2021 | 216M internal climate migrants projected by 2050 under moderate scenario — up to 1.2Bn under high scenario |
| Climate Displacement 2022 | — | IDMC Global Report 2023 | New internal displacements from climate/weather disasters in 2022 — 8× conflict-related |
| Remittance-Climate Risk | — | World Bank Migration and Development 2023 | 45 developing countries depend on remittances >5% of GDP — climate migration disrupts sending-country income |
- **IDMC displacement event database by country/hazard** → Displacement probability calculation → **Annual displacement events and affected population by scenario**
- **World Bank GROUNDSWELL migration scenarios** → Long-term migration projections → **Internal migration flows by corridor and decade to 2050**
- **Real estate and remittance data by sending country** → Financial impact modelling → **Stranded asset value + remittance disruption cost by climate scenario**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Migration Financial Risk
**Headline formula:** `DisplacementRisk = P(climate_event) × PopulationExposed × MigrationPropensity × FinancialImpact; RemittanceDisruption = RemittanceFlow × DisplacementShare × IncomeShock`
**Standards:** ['World Bank GROUNDSWELL 2021', 'IPCC AR6 WGII Chapter 7 — Health, Wellbeing and Changing Disease Dynamics', 'UNHCR Climate Displacement Report 2023', 'IOM World Migration Report 2024']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).