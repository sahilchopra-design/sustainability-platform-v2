# Sovereign Nature Risk
**Module ID:** `sovereign-nature-risk` · **Route:** `/sovereign-nature-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Sovereign exposure to nature loss and biodiversity risk assessing country dependence on ecosystem services, deforestation trajectories, and TNFD/IPBES-aligned biodiversity indicators.

> **Business value:** Assesses country-level nature and biodiversity risk for sovereign bond portfolios aligned with TNFD and Kunming-Montreal GBF.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `COUNTRIES_RAW`, `CustomTooltip`, `ECOSYSTEMS`, `ECOSYSTEM_SERVICES`, `ECO_COLORS`, `ECO_LABELS`, `GBF_TARGETS`, `GbfPolicyTab`, `KPI`, `NATURE_SECTORS`, `NatureDependencyTab`, `NatureRiskTab`, `PIE_COLORS`, `PortfolioNatureTab`, `ProgressBar`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `genCountries` | `()=>COUNTRIES_RAW.map((name,i)=>{` |
| `bii` | `45+sr(s)*50;` |
| `natGdp` | `3+sr(s+1)*52;` |
| `protArea` | `5+sr(s+2)*35;` |
| `speciesRich` | `800+sr(s+3)*14000;` |
| `deforest` | `sr(s+4)*4.5;` |
| `waterStress` | `10+sr(s+5)*80;` |
| `soilDeg` | `5+sr(s+6)*60;` |
| `marineHealth` | `30+sr(s+7)*65;` |
| `pollution` | `10+sr(s+8)*75;` |
| `natRisk` | `Math.round(15+sr(s+9)*70);` |
| `physRisk` | `Math.round(10+sr(s+10)*80);` |
| `transRisk` | `Math.round(10+sr(s+11)*70);` |
| `nbsapStatus` | `['Submitted','In Progress','Draft','Not Started'][Math.floor(sr(s+90)*4)];` |
| `policyStringency` | `Math.round(10+sr(s+91)*85);` |
| `natureInvest` | `+(0.1+sr(s+92)*5).toFixed(2);` |
| `annualBii` | `[2018,2019,2020,2021,2022,2023,2024,2025].map((yr,k)=>({` |
| `ecoServiceTotal` | `ECOSYSTEM_SERVICES.reduce((acc,svc)=>acc+svcValuation[svc],0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES_RAW`, `ECOSYSTEMS`, `ECOSYSTEM_SERVICES`, `GBF_TARGETS`, `NATURE_SECTORS`, `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Countries Assessed | — | IPBES/WWF | Countries with active sovereign nature risk assessment. |
| High Dependence Share | — | IPBES | Share of portfolio sovereign issuers with high GDP dependence on ecosystem services. |
| Avg Protected Area Gap | — | GBF Target 3 | Mean gap between current protected area coverage and Kunming-Montreal 30×30 target. |
- **IPBES, WWF LPI, IUCN Red List, GBF monitoring data** → Biodiversity loss scoring, dependence mapping, protection gap calculation → **Sovereign nature risk scores, portfolio biodiversity exposure, GBF target dashboards**

## 5 · Intermediate Transformation Logic
**Methodology:** Sovereign Nature Risk Score
**Headline formula:** `(Biodiversity Loss Rate × 0.35) + (Ecosystem Dependence × 0.35) + (Protection Gap × 0.30)`
**Standards:** ['IPBES', 'TNFD', 'WWF Living Planet', 'GBF Target 3']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).