# GRESB Scoring Engine
**Module ID:** `gresb-scoring` · **Route:** `/gresb-scoring` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
GRESB Real Estate and Infrastructure ESG assessment scoring. Covers Management, Performance, and Development components with peer benchmarking and report card generation.

> **Business value:** GRESB is requested by 170+ institutional investors representing $46T+ AUM as part of their manager selection and monitoring process. A low GRESB score directly impacts investor relations, capital raising, and asset valuation. This module provides the full assessment workflow and improvement planning.

**How an analyst works this module:**
- Assessment Builder walks through Management and Performance sections
- Evidence Library manages documentation for each question
- Peer Comparison shows score vs sector peer group
- Improvement Roadmap prioritises actions for next cycle
- GRESB Report Card generates investor-ready summary

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASPECT_RECOMMENDATIONS`, `GRESB_ASPECTS`, `KpiCard`, `PEER_BENCHMARKS`, `Section`, `TCFD_COLORS`, `TCFD_PILLARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GRESB_ASPECTS` | 8 | `name`, `maxScore`, `description`, `tcfd` |
| `SUBMISSION_CHECKLIST` | 11 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `clamped` | `Math.min(20, Math.max(0, Number(value) \|\| 0));` |
| `score` | `overrides[a.id] !== undefined ? overrides[a.id] : (gs[a.id] !== undefined ? gs[a.id] : Math.round(8 + sr(idx * 70 + GRESB_ASPECTS.indexOf(a) * 30) * 12));` |
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
| `distData` | `useMemo(() => { const bands = ['40-50','50-60','60-70','70-80','80-90','90-100'];` |
| `scorePct` | `(selected.aspects[a.id] \|\| 0) / a.maxScore * 100;` |
| `gapToMedian` | `peer.median - scorePct;` |
| `sorted3` | `[...enriched].sort((a, b) => a.totalScore - b.totalScore);` |
| `currentAvg` | `enriched.reduce((s, p) => s + p.totalScore, 0) / enriched.length;` |
| `improved` | `enriched.map(p => {` |
| `newAvg` | `improved.reduce((s, p) => s + p.totalScore, 0) / improved.length;` |
| `hdr` | `['Property','Type','Peer Group','Total Score','Star Rating',...GRESB_ASPECTS.map(a=>a.name),'YoY Change','Peer Percentile','Verified'].join(',');` |
| `rows` | `enriched.map(p => [` |
| `blob` | `new Blob([hdr+'\n'+rows.join('\n')], { type:'text/csv' });` |
| `pctVal` | `val / a.maxScore * 100;` |
| `groupAvg` | `propsInGroup.length > 0 ? propsInGroup.reduce((s, p) => s + p.totalScore, 0) / propsInGroup.length : null;` |
| `delta` | `groupAvg !== null ? groupAvg - bench.median : null;` |
| `label` | `key === 'p25' ? 'P25 (1-2 stars)' : key === 'median' ? 'Median (2-3 stars)' : key === 'p75' ? 'P75 (3-4 stars)' : 'P90 (4-5 stars)';` |
| `pct` | `completedCount / SUBMISSION_CHECKLIST.length * 100;` |
| `gapA` | `peer.median - (selected?.aspects?.[a.id] \|\| 0) / a.maxScore * 100;` |
| `gapB` | `peer.median - (selected?.aspects?.[b.id] \|\| 0) / b.maxScore * 100;` |
| `gap` | `peer.median - scorePct;` |
| `priority` | `gap * pts / (cost / 50000);` |
| `currentMinStars` | `enriched.length > 0 ? Math.min(...enriched.map(p => p.starRating)) : 0;` |
| `certPct` | `enriched.length > 0 ? certCount / enriched.length * 100 : 0;` |
| `checkPct` | `checkDone / SUBMISSION_CHECKLIST.length * 100;` |
| `progress` | `Math.min(100, item.current / item.target * 100);` |

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

Management: policies, reporting, risk management, stakeholder engagement. Performance: energy, water, waste, GHG, certifications. Development: new builds sustainability. Scores 0-100; GRESB rated 1-5 stars based on peer ranking.

**Standards:** ['GRESB Real Estate Assessment', 'GRESB Infrastructure Assessment']
**Reference documents:** GRESB Real Estate Assessment Reference Guide; GRESB Infrastructure Assessment Reference Guide; GRESB Foundation Standards

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ✅ **Guide↔code: broadly faithful.** Unlike its sibling `gresb-real-assets-esg`, this module actually
> *computes* GRESB scores from aspect-level inputs against **real peer benchmark tables**, derives star
> ratings by peer quintile, and supports user overrides (persisted to localStorage). The one caveat:
> the guide's headline `0.30×Management + 0.70×Performance` split is not the scoring path used here —
> the page averages 7 equally-weighted aspects (each scored /20) into a 0–100 total, then maps to stars
> via peer percentiles. So the aspect model is real; the 30/70 Management/Performance weighting is
> descriptive, not the computation.

### 7.1 What the module computes

**Total score** — mean of 7 aspect scores (each 0–20), rescaled to 0–100:

```js
score_aspect = override ?? seeded(round(8 + sr(idx×70 + aspectIdx×30)×12))   // 8–20 default
totalScore   = round( Σ aspect / GRESB_ASPECTS.length / 20 × 100 )           // 7 aspects, /20, ×100
```

**Star rating** — peer-quintile placement against `PEER_BENCHMARKS[peerGroup]`:

```js
star = score ≥ p90 ? 5 : score ≥ p75 ? 4 : score ≥ median ? 3 : score ≥ p25 ? 2 : 1
```

**Peer percentile** — piecewise-linear interpolation *within* the benchmark bands:

```js
if score ≥ p90:   90 + (score−p90)/(100−p90)×10
elif score ≥ p75: 75 + (score−p75)/(p90−p75)×15
elif score ≥ med: 50 + (score−median)/(p75−median)×25
elif score ≥ p25: 25 + (score−p25)/(median−p25)×25
else:             max(1, score/p25 × 25)
```

### 7.2 Parameterisation — aspects & peer benchmarks

**7 GRESB aspects** (each maxScore 20), mapped to TCFD pillars:

| Aspect | TCFD pillar |
|---|---|
| Leadership | Governance |
| Policies | Strategy |
| Risk Management | Risk Management |
| Monitoring & EMS | Metrics & Targets |
| Stakeholder Engagement | Strategy |
| Performance Indicators | Metrics & Targets |
| Building Certifications | Metrics & Targets |

**`PEER_BENCHMARKS`** — 19 real GRESB peer groups with median/p25/p75/p90/avgStars (GRESB 2024
distribution). Examples: Residential Europe median 78 / p90 94; Retail LATAM median 52 / p90 72;
Office Europe median 76 / p90 92. These percentiles are the externally-anchored core of the scorer —
they place a fund in its correct sector-region cohort, exactly as GRESB does.

### 7.3 Calculation walkthrough

Each property's 7 aspect scores (seeded default, or user override 0–20) → `totalScore` (0–100) →
`getStarRating(score, peerGroup)` → `getPeerPercentile`. Users can edit aspect scores, historical
scores, and peer group (all persisted). The submission checklist (10 items) and aspect-level
improvement recommendations drive the roadmap; a what-if raises `integrity`/score by improving chosen
aspects. Distribution charts bin totals into 40–100 bands.

### 7.4 Worked example (an Office Europe fund)

Aspect scores {Leadership 16, Policies 14, Risk 12, Monitoring 15, Stakeholder 13, Performance 17,
Certifications 15}, peer group Office Europe (median 76, p25 66, p75 85, p90 92):

| Step | Computation | Result |
|---|---|---|
| Σ aspects | 16+14+12+15+13+17+15 | 102 |
| totalScore | 102 / 7 / 20 × 100 | round(72.86) = **73** |
| star rating | 73 in [p25 66, median 76) | **2 stars** |
| percentile | 25 + (73−66)/(76−66)×25 | 25 + 17.5 = **42.5th pct** |

A raw 73 looks decent, but against the strong Office Europe cohort (median 76) it lands at 2 stars /
43rd percentile — the peer-relative logic correctly penalises a fund below its demanding benchmark.

### 7.5 Data provenance & limitations

- **Default aspect scores are seeded** (`sr()` PRNG, 8–20 range) but are **user-overridable** — real
  data can replace the demo scores, and overrides persist to localStorage.
- The 19 peer-benchmark distributions are realistic GRESB 2024 figures and drive genuine peer-relative
  star ratings — the substantive methodology here is sound.
- Scoring uses a 7-aspect equal-weight average, not the official 30/70 Management/Performance
  aggregation; official GRESB also applies question-level weights within each component that this
  simplification omits.

### 7.6 Framework alignment

**GRESB Real Estate Assessment (2024)** — the module reproduces GRESB's core mechanics: aspect scoring,
peer-benchmark placement, and 5-star quintile rating (5-star = top 20% of peer group). **TCFD** — each
aspect is tagged to a TCFD pillar (Governance/Strategy/Risk/Metrics), supporting dual GRESB-TCFD
reporting. **CRREM** — the Performance/Certification aspects underpin building decarbonisation
pathways. GRESB itself derives the star rating by ranking an entity's total score within its GRESB
peer group and assigning quintiles — precisely the `p25/median/p75/p90` cutoffs this page uses.

*(No §8 model spec: GRESB is a defined third-party assessment methodology and this module implements it
faithfully — aspect scoring against real peer-benchmark quintiles — rather than inventing a proprietary
risk model. The only simplification (equal-weight aspects vs 30/70) is documented in §7.5.)*

## 9 · Future Evolution

### 9.1 Evolution A — Real aspect data and the GRESB 30/70 weighting (analytics ladder: rung 1 → 2)

**What.** §7 documents a genuinely usable module: the total score is a real mean of 7 aspect scores (each 0–20, rescaled to 0–100), the default aspect scores are `sr()`-seeded but **user-overridable** with overrides persisting to localStorage, and the 19 peer-benchmark distributions are realistic GRESB 2024 figures driving genuine peer-relative ranking. The gap versus the guide is that the headline uses a flat mean of 7 aspects rather than the GRESB `0.3×Management + 0.7×Performance` weighting (Real Estate) or the Infrastructure custom weights. Evolution A implements the correct weighting and grounds the aspects: aggregate the 7 aspects into Management and Performance components weighted 30/70, and support importing real aspect scores from GRESB submissions rather than relying on seeded defaults.

**How.** (1) Map the 7 aspects into Management (policies/reporting/risk/stakeholder) and Performance (energy/water/waste/GHG/certifications) and compute `0.3·Mgmt + 0.7·Perf` for Real Estate, with the Infrastructure custom-weight variant. (2) An import path for real aspect scores (extending the existing override mechanism). (3) Keep the real 19-distribution peer benchmark for star rating and quartile rank.

**Prerequisites.** The aspect→component mapping; real aspect data (the override mechanism already supports it); the flat-mean replaced by the weighted formula. **Acceptance:** the total reproduces `0.3·Mgmt + 0.7·Perf` (not a flat 7-aspect mean); Infrastructure uses its custom weights; peer ranking uses the real distributions; user overrides flow into the weighted score.

### 9.2 Evolution B — GRESB submission-prep copilot (LLM tier 1 → 2)

**What.** A copilot for real-asset ESG teams: "given our aspect scores, what GRESB total and star rating do we get, and which aspect would most improve our peer ranking?" narrates the aspect structure and peer benchmarks from the atlas corpus, with tier-2 computing the weighted score and improvement levers via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (GRESB component structure, the 30/70 split, peer-relative star rating). Because the module supports real overrides and carries real benchmark distributions, a tier-1 explainer over user-entered scores ships early; the tier-2 upgrade adds the weighted computation and the "which aspect moves our quintile most" analysis. Every score and rank figure validated against tool output.

**Prerequisites.** Corpus embedding; Evolution A for the weighted formula. **Acceptance:** post-Evolution-A, every total/star/quartile figure traces to a tool call reproducing the GRESB weighting against the real peer distributions; the improvement-lever answer recomputes the ranking under the aspect change.