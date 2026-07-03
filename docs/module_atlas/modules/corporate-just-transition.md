# Corporate Just Transition Analytics
**Module ID:** `corporate-just-transition` · **Route:** `/corporate-just-transition` · **Tier:** B (frontend-computed) · **EP code:** EP-DI3 · **Sprint:** DI

## 1 · Overview
Evaluates corporate just transition plans — how companies manage the social impacts of their climate strategies on workers, communities, and supply chains. Provides JUST Transition Finance Task Force scoring, ILO-aligned assessment, and integration with Science Based Targets.

> **Business value:** Directly applicable to responsible investment teams conducting company engagement, active owners voting on climate + social resolutions, and investment funds integrating ILO just transition criteria into ESG research. Aligned with CA100+ benchmark and emerging EU CS3D supply chain due diligence.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BLUE`, `CORP_NAMES`, `COUNTRIES`, `INDIGO`, `JT_COLORS`, `JT_CORPORATES`, `PURPLE`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `revenue` | `+(10 + sr(i * 7) * 190).toFixed(1);` |
| `justTransitionScore` | `Math.round(20 + sr(i * 11) * 75);` |
| `workforceReduction` | `+(1 + sr(i * 13) * 29).toFixed(1);` |
| `newGreenJobs` | `+(workforceReduction * (0.2 + sr(i * 17) * 1.5)).toFixed(1);` |
| `carbonBoost` | `carbonPrice / 80;` |
| `totalCapex` | `filtered.reduce((s, c) => s + c.transitionCapex * carbonBoost, 0);` |
| `avgJTScore` | `filtered.length ? filtered.reduce((s, c) => s + c.justTransitionScore, 0) / filtered.length : 0;` |
| `totalRetraining` | `filtered.reduce((s, c) => s + c.workerRetrainingBudget * retrainingMultiplier, 0);` |
| `netJobsImpact` | `filtered.reduce((s, c) => s + c.newGreenJobs - c.workforceReduction, 0);` |
| `scatterData` | `filtered.map(c => ({ x: c.transitionCapex * carbonBoost, y: c.justTransitionScore, name: c.name }));` |
| `retrainingBySector` | `SECTORS.map(sec => {` |
| `communityByCountry` | `COUNTRIES.map(country => {` |
| `netJobsData` | `filtered.slice(0, 15).map(c => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CORP_NAMES`, `COUNTRIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CA100+ Just Transition Coverage | — | CA100+ Just Transition Assessment 2023 | Climate Action 100+ assesses just transition plans for its 170+ focus companies — 70 have public plans |
| Corporate JT Spending | — | JTFF Research 2023 | Average corporate just transition spending as % of climate CapEx — vastly underfunded vs ILO recommendations |
| Supply Chain Social Risk | — | CA100+ Supply Chain Analysis 2023 | 73% of listed company Scope 3 emissions originate in countries with high social/labour risk |
- **Company climate transition plans + annual reports** → Just transition scoring → **Corporate JT score by pillar (workers/community/supply chain/governance)**
- **CA100+ benchmark assessments** → Peer comparison → **Company JT score vs sector peers and CA100+ averages**
- **Supply chain mapping data (tier 1-3)** → Supply chain social risk → **Scope 3 social risk exposure by geography and sector**

## 5 · Intermediate Transformation Logic
**Methodology:** Corporate Just Transition Score
**Headline formula:** `JTScore = w_W × WorkerScore + w_C × CommunityScore + w_SC × SupplyChainScore + w_G × GovernanceScore; WorkerScore = Σ [ReskillCommitment + IncomeProtection + PensionSecurity + CollectiveBargaining] / 4`
**Standards:** ['JUST Transition Finance Task Force Principles 2023', 'ILO 2015 Just Transition Guidelines', 'CA100+ Just Transition Assessment Framework', 'SBTi Just Transition Guidance 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).