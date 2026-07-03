# Renewable Project Pipeline Analytics
**Module ID:** `renewable-project-pipeline` · **Route:** `/renewable-project-pipeline` · **Tier:** B (frontend-computed) · **EP code:** EP-DO3 · **Sprint:** DO

## 1 · Overview
Tracks and analyses the global pipeline of renewable energy projects from development through construction to operation. Models permitting timelines, development risk, auction outcomes, and portfolio construction for renewable energy investors targeting diversified geographic and technology exposure.

> **Business value:** Essential for renewable energy funds building development pipelines, investment banks advising on RE M&A, and corporate RE procurement teams planning PPA strategy. Provides portfolio construction analytics optimising geographic and technology diversification.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `GRID_RISKS`, `KpiCard`, `MiniBar`, `PROJECTS`, `REGIONS`, `STAGES`, `TABS`, `TECHNOLOGIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `STAGES` | `['Concept','Scoping','ESIA','Planning Application','Consent Granted','Shovel-Ready','Construction','Operational'];` |
| `tech` | `TECHNOLOGIES[Math.floor(sr(i*7+1)*TECHNOLOGIES.length)];` |
| `stage` | `STAGES[Math.floor(sr(i*11+2)*STAGES.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*13+3)*REGIONS.length)];` |
| `gridRisk` | `GRID_RISKS[Math.floor(sr(i*17+4)*GRID_RISKS.length)];` |
| `capacityMw` | `Math.round(10 + sr(i*19+5)*990);` |
| `permitMonths` | `Math.round(6 + sr(i*23+6)*42);` |
| `gridConnMonths` | `Math.round(3 + sr(i*29+7)*36);` |
| `codYear` | `2025 + Math.floor(sr(i*31+8)*6);` |
| `capex` | `parseFloat((0.5 + sr(i*37+9)*4.5).toFixed(2));` |
| `permittingRisk` | `parseFloat((10 + sr(i*41+1)*85).toFixed(0));` |
| `gridCapacity` | `parseFloat((60 + sr(i*43+2)*40).toFixed(0));` |
| `envScore` | `parseFloat((40 + sr(i*47+3)*55).toFixed(0));` |
| `probability` | `parseFloat((20 + sr(i*53+4)*75).toFixed(0));` |
| `developerExp` | `Math.round(1 + sr(i*59+5)*9);` |
| `totalMw` | `filtered.reduce((s, p) => s + p.capacityMw, 0);` |
| `avgPermit` | `filtered.reduce((s, p) => s + p.permitMonths, 0) / n;` |
| `avgGrid` | `filtered.reduce((s, p) => s + p.gridConnMonths, 0) / n;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GRID_RISKS`, `REGIONS`, `STAGES`, `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global RE Pipeline | — | BloombergNEF H1 2024 | Total renewable energy projects under development globally — solar 60%, wind 30%, storage 10% |
| Permitting Timeline | — | WindEurope/SolarPower Europe 2023 | Average permitting timeline for large renewable projects in Europe — key bottleneck vs demand |
| Development Success Rate | — | BloombergNEF Project Finance 2023 | Only 30–50% of projects that enter development pipeline reach Final Investment Decision |
- **Project pipeline databases (BloombergNEF, Wood Mac)** → Pipeline analysis → **Pipeline by stage, technology, capacity, and geography**
- **Auction results and PPA price data** → Market pricing → **Cleared auction prices and PPA terms by jurisdiction**
- **Permitting timeline data by jurisdiction** → Development risk → **Stage probabilities and expected timeline by country and technology**

## 5 · Intermediate Transformation Logic
**Methodology:** Pipeline Risk-Adjusted Return
**Headline formula:** `PipelineEV = Σ [ProjectNPV_i × P(success_i) × DevelopmentDiscount_i]; P(success) = f(permitting_stage, jurisdiction, technology, developer_track_record)`
**Standards:** ['BloombergNEF Renewable Pipeline Database', 'IEA Renewable Energy Progress Tracker', 'IRENA World Energy Transitions Outlook 2024', 'Wood Mackenzie Power & Renewables Pipeline']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`