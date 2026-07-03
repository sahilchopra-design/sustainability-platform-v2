# Board Climate Oversight Analytics
**Module ID:** `board-climate-oversight` · **Route:** `/board-climate-oversight` · **Tier:** B (frontend-computed) · **EP code:** EP-DK1 · **Sprint:** DK

## 1 · Overview
Evaluates board-level climate governance structures, director expertise, oversight mechanisms, and accountability frameworks. Scores companies against TCFD Governance pillar, SEC Climate Disclosure Rule board requirements, and emerging ISSB S2 governance indicators.

> **Business value:** Essential for active ownership teams conducting climate stewardship, ESG analysts rating governance quality, and companies preparing TCFD/ISSB S2 governance disclosures. Benchmarks against S&P 500/FTSE 100 peers on board climate expertise and executive accountability metrics.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `KpiCard`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 13) * COUNTRIES.length)];` |
| `boardSize` | `8 + Math.floor(sr(i * 3) * 8);` |
| `climateExpertsOnBoard` | `Math.floor(sr(i * 11) * 4);` |
| `boardClimateCommittee` | `sr(i * 17) > 0.45;` |
| `ceoClimateKpi` | `sr(i * 19) > 0.4;` |
| `climateInExecutiveComp` | `sr(i * 23) > 0.35;` |
| `boardMeetingsOnClimate` | `1 + Math.floor(sr(i * 29) * 6);` |
| `climateExpertisePct` | `parseFloat(((climateExpertsOnBoard / boardSize) * 100).toFixed(1));` |
| `carbonNetworkScore` | `parseFloat((1 + sr(i * 41) * 9).toFixed(1));` |
| `thirdPartyAudit` | `sr(i * 43) > 0.5;` |
| `climateSkillsGap` | `parseFloat((10 - climateExpertisePct * 0.08 - sr(i * 47) * 3).toFixed(1));` |
| `avgGov` | `(filtered.reduce((a, c) => a + c.governanceScore, 0) / n).toFixed(1);` |
| `pctCommittee` | `((filtered.filter(c => c.boardClimateCommittee).length / n) * 100).toFixed(0);` |
| `avgExperts` | `(filtered.reduce((a, c) => a + c.climateExpertsOnBoard, 0) / n).toFixed(1);` |
| `pctCeoKpi` | `((filtered.filter(c => c.ceoClimateKpi).length / n) * 100).toFixed(0);` |
| `bySector` | `SECTORS.map(s => {` |
| `byCountry` | `COUNTRIES.map(cn => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Boards with Climate Expertise | — | Spencer Stuart Board Index 2023 | Only 43% of S&P 500 boards have at least one director with climate/sustainability expertise |
| Climate in Executive Pay | — | Willis Towers Watson 2023 | Climate/ESG metrics in executive remuneration at 51% of FTSE 100 companies |
| TCFD Governance Adoption | — | TCFD Status Report 2023 | 83% of large-cap companies now report on TCFD Governance pillar — but quality varies widely |
- **Board composition data (director bios, committees)** → Climate expertise scoring → **Director-level climate competency and board coverage**
- **Executive remuneration reports (LTIPs, STIPs)** → Climate pay linkage → **Climate KPI weight in total CEO compensation**
- **TCFD governance section disclosures** → Disclosure quality assessment → **ISSB S2 paragraph-by-paragraph compliance gap**

## 5 · Intermediate Transformation Logic
**Methodology:** Board Climate Governance Score
**Headline formula:** `BoardClimateScore = w_E × ExpertiseScore + w_O × OversightScore + w_A × AccountabilityScore + w_D × DisclosureScore; ExpertiseScore = ClimateDirectors / TotalBoardSeats × CompetencyDepth`
**Standards:** ['TCFD Recommendations — Governance Pillar 2017', 'ISSB IFRS S2 — Governance Disclosure Requirements 2023', 'SEC Climate Disclosure Rule — Board Expertise 2024', 'WEF Board Governance for Climate Resilience 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).