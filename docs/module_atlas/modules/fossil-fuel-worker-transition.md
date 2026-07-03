# Fossil Fuel Worker Transition Finance
**Module ID:** `fossil-fuel-worker-transition` · **Route:** `/fossil-fuel-worker-transition` · **Tier:** B (frontend-computed) · **EP code:** EP-DI1 · **Sprint:** DI

## 1 · Overview
Analyses the financial requirements and investment opportunities in workforce transition from fossil fuel industries. Models retraining costs, pension liability gaps, regional economic multipliers, and just transition fund structures using ILO guidelines and JETP social co-benefit frameworks.

> **Business value:** Essential for coal-region development banks, EU Structural Funds managers, corporate HR directors at fossil fuel companies, and sovereign just transition policy advisors. Provides quantitative cost basis for JTF applications and ILO just transition financing plans.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BLUE`, `COUNTRY_TRANSITION_DATA`, `FOSSIL_EMPLOYMENT_GLOBAL`, `FOSSIL_REGIONS`, `FUEL_TYPES`, `IEA_CTY`, `IEA_FOSSIL`, `INDIGO`, `PURPLE`, `REGIONS`, `REGION_NAMES`, `RISK_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Asia-Pacific', 'Europe', 'North America', 'Latin America', 'Middle East', 'Africa'];` |
| `workersEmployed` | `+(5 + sr(i * 7) * 120).toFixed(1);` |
| `projectedJobLoss2030` | `+(workersEmployed * (0.1 + sr(i * 11) * 0.4)).toFixed(1);` |
| `projectedJobLoss2040` | `+(projectedJobLoss2030 * (1.2 + sr(i * 13) * 0.8)).toFixed(1);` |
| `retrainingEligible` | `+(projectedJobLoss2030 * (0.4 + sr(i * 17) * 0.5)).toFixed(1);` |
| `alternativeJobsAvailable` | `+(retrainingEligible * (0.3 + sr(i * 19) * 0.9)).toFixed(1);` |
| `timelineRisk` | `+(1 + sr(i * 23) * 9).toFixed(1);` |
| `retrainingBoost` | `retrainingInvestment / 50;` |
| `totalWorkers` | `filtered.reduce((s, r) => s + r.workersEmployed, 0);` |
| `totalJobLoss2030` | `filtered.reduce((s, r) => s + r.projectedJobLoss2030 * speedMultiplier, 0);` |
| `avgFund` | `filtered.length ? filtered.reduce((s, r) => s + r.transitionFundAllocated, 0) / filtered.length : 0;` |
| `totalAltJobs` | `filtered.reduce((s, r) => s + r.alternativeJobsAvailable * retrainingBoost, 0);` |
| `scatterData` | `filtered.map(r => ({` |
| `altJobsData` | `filtered.slice(0, 15).map(r => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_TRANSITION_DATA`, `FUEL_TYPES`, `REGIONS`, `REGION_NAMES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Fossil Fuel Workers | — | IEA World Energy Employment 2023 | Direct fossil fuel sector employment globally — coal 10M, oil&gas 12M, fossil power 43M |
| Average Retraining Cost | — | OECD Skills Outlook 2023 | Per-worker retraining cost for green economy transition varies by prior skill level and target sector |
| EU Just Transition Fund | — | EU JTM Regulation 2021/1056 | EU Just Transition Mechanism total allocation — targeting 100+ coal-dependent regions |
- **Regional employment data by fossil fuel sector** → Transition cost modelling → **Per-worker and total transition finance requirement**
- **Green job creation scenarios by sector/region** → Net employment impact → **Net job creation/loss under 1.5°C/2°C transition scenarios**
- **EU JTF allocation data + Territorial Transition Plans** → Grant eligibility analysis → **Available JTF funding per region and eligible expenditure categories**

## 5 · Intermediate Transformation Logic
**Methodology:** Worker Transition Cost Model
**Headline formula:** `TransitionCost_worker = RetrainingCost + IncomeSupportDuration × AvgWage + PensionLiabilityGap; RegionalMultiplier = DirectJobs × InputOutputMultiplier`
**Standards:** ['ILO Guidelines for a Just Transition 2015', 'IPCC AR6 WGIII Chapter 17 — Just Transitions', 'EU Just Transition Mechanism 2021', 'IEA World Energy Employment 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).