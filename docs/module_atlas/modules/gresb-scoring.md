# GRESB Scoring Engine
**Module ID:** `gresb-scoring` · **Route:** `/gresb-scoring` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
GRESB Real Estate and Infrastructure ESG assessment scoring. Covers Management, Performance, and Development components with peer benchmarking and report card generation.

> **Business value:** GRESB is requested by 170+ institutional investors representing $46T+ AUM as part of their manager selection and monitoring process. A low GRESB score directly impacts investor relations, capital raising, and asset valuation. This module provides the full assessment workflow and improvement planning.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASPECT_RECOMMENDATIONS`, `GRESB_ASPECTS`, `KpiCard`, `PEER_BENCHMARKS`, `Section`, `TCFD_COLORS`, `TCFD_PILLARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `clamped` | `Math.min(20, Math.max(0, Number(value) \|\| 0));` |
| `clamped` | `Math.min(100, Math.max(0, Number(value) \|\| 0));` |
| `score` | `overrides[a.id] !== undefined ? overrides[a.id] : (gs[a.id] !== undefined ? gs[a.id] : Math.round(8 + sr(idx * 70 + GRESB_ASPECTS.indexOf(a) * 30) * 1` |
| `totalScore` | `Math.round(total / GRESB_ASPECTS.length / 20 * 100);` |
| `history` | `baseHistory.map(h => ({` |
| `yoyChange` | `history.length >= 2 ? history[history.length - 1].score - history[history.length - 2].score : 0;` |
| `scores` | `enriched.map(p => p.totalScore);` |
| `avgScore` | `scores.reduce((a, b) => a + b, 0) / scores.length;` |
| `avgStars` | `enriched.reduce((s, p) => s + p.starRating, 0) / enriched.length;` |
| `best` | `enriched.reduce((a, b) => a.totalScore > b.totalScore ? a : b);` |
| `yoyAvg` | `enriched.reduce((s, p) => s + p.yoyChange, 0) / enriched.length;` |
| `topAspect` | `GRESB_ASPECTS.reduce((a, b) => (aspectAvgs[a.id] \|\| 0) > (aspectAvgs[b.id] \|\| 0) ? a : b);` |
| `yearScores` | `enriched.map(p => {` |
| `avg` | `yearScores.reduce((a, b) => a + b, 0) / yearScores.length;` |
| `bands` | `['40-50','50-60','60-70','70-80','80-90','90-100'];` |
| `scorePct` | `(selected.aspects[a.id] \|\| 0) / a.maxScore * 100;` |
| `gapToMedian` | `peer.median - scorePct;` |
| `sorted3` | `[...enriched].sort((a, b) => a.totalScore - b.totalScore);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GRESB_ASPECTS`, `STAR_COLORS`, `SUBMISSION_CHECKLIST`, `TCFD_PILLARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Assessment Components | — | GRESB | Two main components for real estate |
| Star Rating | — | GRESB peer ranking | Based on decile position in peer group |
| Global Average | — | GRESB 2024 | Average GRESB score for real estate funds |
- **Property/fund sustainability data** → GRESB question mapping → **Scored assessment**
- **GRESB score** → Peer ranking → **Star rating**
- **Improvement analysis** → Priority roadmap → **Next cycle action plan**

## 5 · Intermediate Transformation Logic
**Methodology:** GRESB component scoring
**Headline formula:** `GRESB_score = 0.3×Management + 0.7×Performance (Real Estate); custom weights for Infrastructure`
**Standards:** ['GRESB Real Estate Assessment', 'GRESB Infrastructure Assessment']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).