# Regulatory Gap Analysis
**Module ID:** `regulatory-gap` · **Route:** `/regulatory-gap` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Identifies disclosure gaps between current reporting outputs and applicable regulatory requirements across CSRD, SFDR, TCFD, SEC, and other frameworks.

> **Business value:** Provides a systematic regulatory disclosure gap assessment, enabling organisations to prioritise compliance investment and evidence readiness for CSRD, SFDR, and TCFD.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEADLINES`, `RegulatoryGapPage`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => {` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `ghgCoverage` | `totalHoldings > 0 ? (holdingsWithGHG / totalHoldings) * 100 : 0;` |
| `esgCoverage` | `totalHoldings > 0 ? (holdingsWithESG / totalHoldings) * 100 : 0;` |
| `sbtiPct` | `totalHoldings > 0 ? (sbtiCount / totalHoldings) * 100 : 0;` |
| `revenueCoverage` | `totalHoldings > 0 ? (holdingsWithRevenue / totalHoldings) * 100 : 0;` |
| `mcapCoverage` | `totalHoldings > 0 ? (holdingsWithMarketCap / totalHoldings) * 100 : 0;` |
| `evicCoverage` | `totalHoldings > 0 ? (holdingsWithEVIC / totalHoldings) * 100 : 0;` |
| `triskCoverage` | `totalHoldings > 0 ? (holdingsWithTRisk / totalHoldings) * 100 : 0;` |
| `netZeroCoverage` | `totalHoldings > 0 ? (holdingsWithNetZero / totalHoldings) * 100 : 0;` |
| `totalScope1` | `holdings.reduce((s, h) => s + (h.company?.scope1_mt \|\| 0), 0);` |
| `totalScope2` | `holdings.reduce((s, h) => s + (h.company?.scope2_mt \|\| 0), 0);` |
| `overallCompliance` | `totalReqs > 0 ? Math.round(((compliantCount + partialCount * 0.5) / totalReqs) * 100) : 0;` |
| `newHistory` | `[...complianceHistory, { date: today, score: overallCompliance, compliant: compliantCount, partial: partialCount, gap: gapCount }].slice(-30);` |
| `newHistory` | `complianceHistory.map(h => h.date === today ? { ...h, score: overallCompliance, compliant: compliantCount, partial: partialCount, gap: gapCount } : h)` |
| `fwScores` | `useMemo(() => FRAMEWORKS.map(fw => {` |
| `barData` | `useMemo(() => fwScores.map(fw => ({` |
| `weights` | `[2, 2, 2, 1, 1, 1, 1, 1, 1]; // GHG and ESG weighted higher` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DEADLINES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Required Disclosures | — | Requirement Registry | Total disclosure data points required under all applicable regulatory frameworks for entity profile. |
| Completed Disclosures | — | Disclosure Audit | Data points with confirmed supporting evidence or reported value. |
| Gap Score (%) | — | Gap Engine | Overall proportion of required disclosures not yet fulfilled across all applicable frameworks. |
- **Regulatory requirement database + existing disclosure inventory** → Requirement matching; gap identification; prioritisation scoring → **Gap analysis heatmap, prioritised remediation plan, and audit evidence log**

## 5 · Intermediate Transformation Logic
**Methodology:** Gap Score
**Headline formula:** `G = 1 – (disclosures_completed / disclosures_required)`
**Standards:** ['EFRAG ESRS Set 1 (2023)', 'TCFD Recommendations (2017)', 'SFDR Level 2 RTS']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).