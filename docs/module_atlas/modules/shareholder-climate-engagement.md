# Shareholder Climate Engagement Analytics
**Module ID:** `shareholder-climate-engagement` · **Route:** `/shareholder-climate-engagement` · **Tier:** B (frontend-computed) · **EP code:** EP-DK5 · **Sprint:** DK

## 1 · Overview
Tracks and analyses institutional investor climate engagement — shareholder resolutions, private dialogue outcomes, escalation pathways, and voting patterns. Integrates CA100+ benchmark tracking, IIGCC net zero stewardship, and Climate Action 100+ focus company progress.

> **Business value:** Essential for responsible investment teams at asset managers and pension funds. Enables systematic CA100+ engagement programme management, vote decision-making, and reporting to beneficiaries on climate stewardship outcomes. Aligns with IIGCC, PRI, and UNPRI reporting expectations.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CAMPAIGNS`, `COUNTRIES`, `FILERS`, `KpiCard`, `MGMT_RECS`, `OUTCOMES`, `RES_TYPES`, `SECTORS`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `resolutionType` | `RES_TYPES[Math.floor(sr(i * 13) * RES_TYPES.length)];` |
| `year` | `2020 + Math.floor(sr(i * 17) * 5);` |
| `managementRecommendation` | `MGMT_RECS[Math.floor(sr(i * 19) * MGMT_RECS.length)];` |
| `supportPct` | `parseFloat(Math.min(99, Math.max(5, baseSupport + sr(i * 23) * 35)).toFixed(1));` |
| `outcome` | `supportPct >= 50 ? 'Passed' : sr(i * 29) > 0.6 ? 'Withdrawn' : sr(i * 29) > 0.3 ? 'Management Opposed' : 'Failed';` |
| `filingInvestor` | `FILERS[Math.floor(sr(i * 31) * FILERS.length)];` |
| `coFilers` | `Math.floor(sr(i * 37) * 12);` |
| `postEngagementCommitment` | `outcome === 'Passed' ? sr(i * 41) > 0.3 : sr(i * 41) > 0.7;` |
| `engagementDuration` | `2 + Math.floor(sr(i * 43) * 22);` |
| `issScore` | `Math.round(30 + sr(i * 47) * 65);` |
| `avgSupport` | `(filtered.reduce((a, c) => a + c.supportPct, 0) / n).toFixed(1);` |
| `pctPassed` | `((filtered.filter(c => c.outcome === 'Passed').length / n) * 100).toFixed(0);` |
| `pctCommit` | `((filtered.filter(c => c.postEngagementCommitment).length / n) * 100).toFixed(0);` |
| `byType` | `RES_TYPES.map(t => {` |
| `outcomeData` | `OUTCOMES.map(o => ({` |
| `trendData` | `YEARS.map(yr => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `FILERS`, `MGMT_RECS`, `OUTCOMES`, `RES_TYPES`, `SECTORS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CA100+ Focus Companies | — | CA100+ 2023 | 170 focus companies representing 80% of industrial GHG emissions — subject to coordinated investor engagement |
| Climate Resolutions 2023 | — | ShareAction Voting Matters 2023 | 135 climate-related shareholder resolutions filed globally in 2023 — average support 43% |
| Net Zero Commitments from Engagement | — | CA100+ Benchmark 2023 | 61% of CA100+ focus companies now have net zero commitments vs 10% pre-CA100+ launch |
- **CA100+ benchmark data by company and indicator** → Progress tracking → **Company progress score across 10 CA100+ indicators**
- **Shareholder resolution database (SEC, Companies House)** → Resolution analysis → **Filed resolutions by topic, filer, and vote outcome**
- **Private engagement records and company responses** → Dialogue effectiveness → **Commitment rates from private engagement vs public resolution**

## 5 · Intermediate Transformation Logic
**Methodology:** Engagement Effectiveness Score
**Headline formula:** `EngagementScore = Σ [CommitmentMade_i × TargetAmbition_i × ImplementationProgress_i × VerificationRigor_i] / n; EscalationRisk = 1 - EngagementProgressRate`
**Standards:** ['Climate Action 100+ Net Zero Benchmark 2023', 'IIGCC Net Zero Stewardship Toolkit 2023', 'PRI Active Ownership 2.0 Framework', 'ShareAction — Voting Matters 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).