# Client Transition Command Center
**Module ID:** `client-transition-command-center` · **Route:** `/client-transition-command-center` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated transition plan monitoring and execution dashboard for institutional clients. Tracks decarbonisation milestones, interim SBTi targets, engagement actions, and portfolio reallocation progress against Paris-aligned transition pathways.

> **Business value:** Pathway gap = actual CI minus SBTi target CI. Negative gap = ahead of pathway. Command center integrates engagement actions, portfolio reallocation, and milestone tracking in single dashboard.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CLIENTS`, `CLIENT_NAMES`, `CLIENT_TYPES`, `ENGAGEMENT_STAGES`, `REPORTING_FRAMEWORKS`, `RISK_QUADRANTS`, `SBTI_STATUSES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RISK_QUADRANTS` | `['Leaders','Transitioners','Laggards','At-Risk'];` |
| `typeIdx` | `Math.floor(sr(i * 7) * CLIENT_TYPES.length);` |
| `stageIdx` | `Math.floor(sr(i * 11) * ENGAGEMENT_STAGES.length);` |
| `aum` | `parseFloat((0.5 + sr(i * 13) * 499).toFixed(1)); // $Bn` |
| `portfolioITR` | `parseFloat((1.3 + sr(i * 17) * 3.2).toFixed(2));` |
| `climateScore` | `parseFloat((10 + sr(i * 19) * 90).toFixed(1));` |
| `transitionBudget` | `parseFloat((aum * 0.01 + sr(i * 23) * aum * 0.1).toFixed(1));` |
| `greenAllocation` | `parseFloat((sr(i * 29) * 35).toFixed(1));` |
| `regulatoryReadiness` | `parseFloat((sr(i * 31) * 100).toFixed(1));` |
| `netZeroTarget` | `2030 + Math.floor(sr(i * 37) * 20);` |
| `sbtiIdx` | `Math.floor(sr(i * 41) * SBTI_STATUSES.length);` |
| `frameworkCount` | `Math.floor(1 + sr(i * 43) * REPORTING_FRAMEWORKS.length);` |
| `daysLastEngagement` | `Math.floor(sr(i * 47) * 180);` |
| `nextReviewDays` | `Math.floor(30 + sr(i * 53) * 150);` |
| `totalAUM` | `CLIENTS.reduce((s, c) => s + c.aum, 0);` |
| `wITR` | `totalAUM > 0 ? CLIENTS.reduce((s, c) => s + c.portfolioITR * c.aum, 0) / totalAUM : 0;` |
| `atRisk` | `CLIENTS.filter(c => c.riskQuadrant === 'At-Risk').length;` |
| `avgReadiness` | `CLIENTS.reduce((s, c) => s + c.regulatoryReadiness, 0) / CLIENTS.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLIENT_NAMES`, `CLIENT_TYPES`, `ENGAGEMENT_STAGES`, `REPORTING_FRAMEWORKS`, `RISK_QUADRANTS`, `SBTI_STATUSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Pathway Gap | `Actual CI – SBTi target CI` | SBTi SDA | Deviation from science-based emission intensity pathway |
| Milestone Completion Rate | `Completed / total milestones` | Platform tracking | Progress on defined transition plan milestones |
| Engagement Score | `CA100+ benchmark weighted` | CA100+ Net Zero Benchmark | Issuer-level engagement progress on net-zero commitment and action |
| Green Asset Allocation | `Green AUM / Total AUM` | Portfolio classification | Share of portfolio in Paris-aligned or EU Taxonomy-aligned assets |
- **SBTi pathway database** → Sector targets → pathway benchmarks → **SBTi CI targets by year**
- **CA100+ benchmark data** → Engagement indicators → engagement score → **Issuer transition progress**

## 5 · Intermediate Transformation Logic
**Methodology:** Transition milestone tracking with SBTi pathway gap
**Headline formula:** `PathwayGap(t) = ActualCI(t) – SBTiTarget(t); MilestoneCompletion = CompletedMilestones / TotalMilestones`
**Standards:** ['SBTi Corporate Net-Zero Standard v1.2', 'Paris Agreement Art. 4', 'TCFD Transition Plan Guidance 2023', 'CA100+ Net Zero Benchmark']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).