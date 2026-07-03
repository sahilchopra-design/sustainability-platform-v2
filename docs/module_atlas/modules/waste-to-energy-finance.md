# Waste-to-Energy Finance Analytics
**Module ID:** `waste-to-energy-finance` · **Route:** `/waste-to-energy-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DL2 · **Sprint:** DL

## 1 · Overview
Models the economics of waste-to-energy (WtE) projects including incineration-with-energy-recovery, anaerobic digestion, gasification, and landfill gas. Calculates gate fees, tipping revenue, electricity/heat sales, carbon credits, and regulatory compliance under EU ETS.

> **Business value:** Applicable to WtE project developers and lenders, municipal waste authorities procurement teams, and infrastructure funds. Provides bankable project financial model incorporating EU ETS inclusion impact and biomethane RED III value for anaerobic digestion projects.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `KpiCard`, `PROJECTS`, `REGIONS`, `STATUSES`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `type` | `TYPES[Math.floor(sr(i * 7) * TYPES.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `region` | `REGIONS[Math.floor(sr(i * 13) * REGIONS.length)];` |
| `status` | `STATUSES[Math.floor(sr(i * 17) * STATUSES.length)];` |
| `capacityMW` | `Math.round(5 + sr(i * 3) * 295);` |
| `wasteProcessed` | `Math.round(50 + sr(i * 5) * 950);` |
| `energyOutput` | `Math.round(capacityMW * (2000 + sr(i * 19) * 3000) / 1000);` |
| `totalCapacity` | `filtered.reduce((s, p) => s + p.capacityMW, 0);` |
| `totalWaste` | `filtered.reduce((s, p) => s + p.wasteProcessed, 0);` |
| `totalEnergy` | `filtered.reduce((s, p) => s + p.energyOutput, 0);` |
| `avgLcoe` | `(filtered.reduce((s, p) => s + p.lcoe, 0) / n).toFixed(0);` |
| `totalCredits` | `filtered.reduce((s, p) => s + p.carbonCredits, 0);` |
| `creditValue` | `((totalCredits * carbonPrice) / 1000).toFixed(1);` |
| `gateRevenue` | `((totalWaste * gateFee) / 1000).toFixed(0);` |
| `typeCapData` | `TYPES.map(t => {` |
| `typeLcoeData` | `TYPES.map(t => {` |
| `typeCreditData` | `TYPES.map(t => {` |
| `scatterData` | `filtered.map(p => ({ x: p.wasteProcessed, y: p.energyOutput, name: p.name }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `REGIONS`, `STATUSES`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU WtE Capacity | — | ISWA WtE Stats 2023 | 500 WtE facilities in EU processing 97 Mt municipal waste/yr — with energy recovery rate 83% |
| Typical WtE Gate Fee | — | Eunomia WtE Market Analysis 2023 | Municipal solid waste gate fee for large WtE — varies by country, waste quality, and alternative tipping costs |
| EU ETS WtE Impact | — | European Commission ETS Review 2023 | WtE inclusion in EU ETS from 2026 adds €50–80/tonne carbon cost based on current EUA price |
- **Waste characterisation studies + tonnage data** → Revenue and energy yield calculation → **Gate fee sensitivity and energy production forecast**
- **Carbon market price projections + EU ETS rules** → Carbon cost/revenue modelling → **Net carbon position under ETS inclusion from 2026**
- **Competing waste treatment costs (landfill, recycling)** → Market positioning analysis → **Gate fee competitiveness vs alternative disposal options**

## 5 · Intermediate Transformation Logic
**Methodology:** WtE Project Economics
**Headline formula:** `WtE_NPV = Σ [(GateFee + EnergyRevenue + CarbonCredit - CapEx/n - OpEx - CarbonCost) / (1+r)^t]; BiogasYield = OrganicFraction × VS × BMP × ConversionEfficiency`
**Standards:** ['EU ETS WtE Inclusion 2026 Rules', 'IEA Bioenergy WtE Task 36', 'ISWA Guidelines on Waste-to-Energy 2022', 'EU Renewable Energy Directive (RED III) Biomethane']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).