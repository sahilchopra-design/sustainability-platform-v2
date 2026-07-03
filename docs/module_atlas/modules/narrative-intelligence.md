# ESG Narrative Intelligence Engine
**Module ID:** `narrative-intelligence` · **Route:** `/narrative-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
NLP analysis engine for sustainability reports, earnings calls, and regulatory filings. Scores topic coherence for greenwashing risk detection, identifies commitment-vs-action gaps, assesses net-zero pledge credibility, and checks alignment between controversy events and corporate disclosures.

> **Business value:** Used by ESG analysts, sustainable finance regulators, and responsible investment teams to automate greenwashing detection and provide evidence-based credibility assessments of corporate sustainability claims.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPONENT_MIX`, `EQUIVALENTS`, `HEROS_JOURNEY`, `KpiCard`, `MSG_LEVELS`, `REPORT_EXCERPTS`, `STAKEHOLDER_JOURNEYS`, `TABS`, `TONE_SECTIONS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `toneChartData` | `useMemo(() => TONE_SECTIONS.map(t => ({` |
| `avg` | `TONE_SECTIONS.length > 0 ? Math.round(TONE_SECTIONS.reduce((s, t) => s + (t.weight[tone] \|\| 0), 0) / TONE_SECTIONS.length) : 0;` |
| `gap` | `Math.abs(c.data - c.bestData) + Math.abs(c.narrative - c.bestNarrative) + Math.abs(c.visual - c.bestVisual);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPONENT_MIX`, `HEROS_JOURNEY`, `MSG_LEVELS`, `REPORT_EXCERPTS`, `STAKEHOLDER_JOURNEYS`, `TABS`, `TONE_SECTIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Greenwashing Risk Score | `w1·coherence_gap + w2·commitment_gap + w3·controversy_gap` | NLP pipeline output | Scores >70 warrant disclosure review; used in ESG controversy screening and regulatory compliance monitoring. |
| Net-Zero Pledge Credibility Score | `Oxford Net Zero criteria: coverage + interim + offsets + verification` | Corporate net-zero pledges + SBTi registry | Scores <40 indicate high pledge credibility risk; correlates with future SBTi validation success probability. |
| Commitment-Action Gap Index | `(actual_progress − pledged_progress) / pledged_progress` | Corporate disclosure time series | Negative values indicate under-delivery vs pledges; <-0.3 triggers regulatory notification risk flag under EU  |
- **Sustainability reports + earnings call transcripts + news feeds → text corpus** → LDA topic modelling → commitment extraction → controversy matching → greenwashing score → **Greenwashing risk scores and net-zero credibility assessments for investor and regulatory use**

## 5 · Intermediate Transformation Logic
**Methodology:** Greenwashing Risk Scoring via NLP Coherence Analysis
**Headline formula:** `greenwashing_risk = w1·topic_coherence_gap + w2·commitment_action_gap + w3·controversy_disclosure_gap`
**Standards:** ['EU Green Claims Directive (2023/0085)', 'TCFD Recommendations – Strategy Disclosures', 'InfluenceMap Climate Accountability Report']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).