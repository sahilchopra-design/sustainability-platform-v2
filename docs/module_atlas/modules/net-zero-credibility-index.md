# Net Zero Credibility Index
**Module ID:** `net-zero-credibility-index` · **Route:** `/net-zero-credibility-index` · **Tier:** B (frontend-computed) · **EP code:** EP-CM3 · **Sprint:** CM

## 1 · Overview
15-KPI net zero credibility framework scoring 0-150 with A-E rating (A≥120, E<40).

**How an analyst works this module:**
- Credibility Index Dashboard shows composite with radar chart
- CapEx Alignment shows green vs brown investment ratio
- Lobbying Consistency cross-checks policy advocacy vs targets

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `KPIS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COMPANIES` | 16 | `sector`, `scores` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Credibility Index Dashboard','15-KPI Scorecard','CapEx Alignment','Lobbying Consistency','Executive Compensation','Peer Ranking'];` |
| `radarData` | `KPIS.map((k, i) => ({ kpi: k.length > 12 ? k.slice(0, 12) + '..' : k, score: selData.scores[i], max: 10 }));` |
| `ratingDist` | `['A', 'B', 'C', 'D', 'E'].map(r => ({ rating: r, count: COMPANIES.filter(c => nzRating(c.total) === r).length }));` |
| `capexData` | `COMPANIES.map(c => ({ name: c.name, capex: c.scores[1], total: c.total })).sort((a, b) => b.capex - a.capex);` |
| `lobbyData` | `COMPANIES.map(c => ({ name: c.name, lobby: c.scores[3], total: c.total })).sort((a, b) => b.lobby - a.lobby);` |
| `execData` | `COMPANIES.map(c => ({ name: c.name, exec: c.scores[4], board: c.scores[5] })).sort((a, b) => (b.exec + b.board) - (a.exec + a.board));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `KPIS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| KPIs | — | Multi-source | Each scored 0-10 |
| Max Score | — | Composite | A≥120, B≥100, C≥70, D≥40, E<40 |

## 5 · Intermediate Transformation Logic
**Methodology:** 15-KPI composite credibility
**Headline formula:** `Score = Σ(KPI_i), each 0-10, total 0-150`

15 KPIs: SBTi validation, CapEx green ratio, R&D clean %, lobbying alignment, exec comp linkage, board climate expertise, Scope 3 coverage, offset dependency, just transition, TCFD quality, CDP score, RE procurement, methane management, supply chain engagement, physical risk disclosure.

**Standards:** ['SBTi', 'CDP', 'InfluenceMap', 'RE100']
**Reference documents:** SBTi; CDP; InfluenceMap; RE100

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module matches its MODULE_GUIDES entry exactly: a **15-KPI net-zero credibility index** scoring 15
companies 0–150 with an A–E rating. Uniquely among the net-zero family, it is **entirely hand-authored
expert scoring** — no PRNG at all. Each company's 15 KPI scores (0–10) are analyst judgements; the
composite and rating are honest arithmetic over them.

### 7.1 What the module computes

```js
total  = Σ_{i=1}^{15} scores_i          // 0–150
nzRating(total) = total≥120 A / ≥100 B / ≥70 C / ≥40 D / else E
```

The 15 KPIs are the exact set the guide lists: SBTi Validation, CapEx Green Ratio, R&D Clean Tech %,
Lobbying Alignment, Exec Comp Climate, Board Climate Expertise, Scope 3 Coverage, Offset Dependency, Just
Transition, TCFD Quality, CDP Score, RE Procurement %, Methane Management, Supply Chain Engagement,
Physical Risk Disclosure. Per-KPI drill-downs (CapEx `scores[1]`, Lobbying `scores[3]`, Exec/Board
`scores[4]`/`scores[5]`) power the thematic tabs.

### 7.2 Parameterisation / scoring rubric

| Company | Sector | Total (0–150) | Rating | Provenance |
|---|---|---|---|---|
| Orsted | Utilities | 135 | A | Hand-authored expert scores |
| Iberdrola | Utilities | 126 | A | Hand-authored |
| Microsoft | Tech | 128 | A | Hand-authored |
| Schneider | Industrial | 123 | A | Hand-authored |
| Unilever | Consumer | 115 | B | Hand-authored |
| BNP Paribas | Finance | 101 | B | Hand-authored |
| HSBC | Finance | 88 | C | Hand-authored |
| Shell | Energy | ~71 | C | Hand-authored |
| BP / TotalEnergies | Energy | ~64 / ~54 | D | Hand-authored |
| ExxonMobil | Energy | ~32 | E | Hand-authored |
| Glencore | Mining | ~40 | E/D | Hand-authored |

*(Totals shown are the sum of each company's 15 stored scores.)* The scoring ordering is defensible expert
judgement — renewables-pivot leaders (Orsted, Iberdrola) top the index; fossil majors (Exxon, BP, Total)
and Glencore sit at the bottom, consistent with **InfluenceMap** and **NewClimate CCRM** findings.

| Rating band | Threshold | Basis |
|---|---|---|
| A | ≥120 | Author (guide: A≥120) |
| B | ≥100 | matches guide |
| C | ≥70 | matches guide |
| D | ≥40 | matches guide |
| E | <40 | matches guide |

### 7.3 Calculation walkthrough

`COMPANIES` (15 records × 15 scores) → `total` per company via `.reduce` → `nzRating` bands → dashboard
KPIs (A-rated count, index average, E-rated count). Selecting a company builds a 15-axis radar of its KPI
scores. Thematic tabs slice individual KPIs (CapEx alignment, lobbying consistency, exec-comp linkage) and
rank companies on them. `ratingDist` counts companies per rating band.

### 7.4 Worked example (Orsted vs ExxonMobil)

Orsted `scores = [10,9,9,9,10,8,10,9,8,9,9,10,8,8,9]`:

```
total = 10+9+9+9+10+8+10+9+8+9+9+10+8+8+9 = 135  → nzRating(135) = 'A'
```

ExxonMobil `scores = [2,2,2,1,1,2,3,3,2,3,2,1,3,2,2]`:

```
total = 2+2+2+1+1+2+3+3+2+3+2+1+3+2+2 = 31  → nzRating(31) = 'E'
```

The 104-point spread cleanly separates a transition leader (A) from a laggard (E) — the index's core
purpose.

### 7.5 Data provenance & limitations

- **All scores are hand-authored expert judgements** — no PRNG, but also not traceable to a specific
  disclosure-parsing pipeline. Each of the 15 KPIs is assigned a single 0–10 integer per company.
- **Static and small** (15 companies): no automated ingestion from SBTi/CDP/InfluenceMap, so scores do not
  update with new disclosures and are not reproducible from primary evidence.
- Equal weighting (each KPI 0–10, no KPI weights) implies, e.g., that "Methane Management" and "SBTi
  Validation" carry identical index weight — a simplification vs a materiality-weighted composite.

**Framework alignment:** The 15 KPIs map to real credibility signals: **SBTi** (target validation, offset
cap), **CDP** (disclosure score), **InfluenceMap** (lobbying alignment), **RE100** (RE procurement),
**TCFD** (disclosure quality), and **NewClimate CCRM** (CapEx/R&D, just transition, Scope 3). The scoring
approach mirrors the **NewClimate Corporate Climate Responsibility Monitor** and **InfluenceMap** integrity
assessments. Because the scores are hand-set rather than computed from primary data, §8 specifies the
production scoring model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The 15×15 scores are hand-authored. Below is the
production net-zero credibility scoring model.

### 8.1 Purpose & scope
Compute a reproducible 15-KPI net-zero credibility score per company from primary disclosures, with
materiality weighting and evidence traceability, for ESG rating, stewardship, and portfolio screening.

### 8.2 Conceptual approach
A weighted multi-KPI composite scored from primary sources, benchmarked against **NewClimate CCRM**
(dimension design), **InfluenceMap** (lobbying), and **SBTi/CDP** (validated targets, disclosure). Each KPI
scored by an explicit rubric with cited evidence.

### 8.3 Mathematical specification
`Credibility = Σ_{i=1}^{15} w_i·s_i / Σ w_i · scale`, `s_i ∈ [0,10]` from a per-KPI rubric (e.g. SBTi:
0 none → 10 validated 1.5 °C near+long term; Offset Dependency: 10 = ≤10 % residual, 0 = offset-heavy).
Materiality weights `w_i` sector-specific (methane weighted higher for energy). Rating bands as coded
(A≥120…E<40 on a 0–150 scale, or the weighted equivalent). Confidence `= f(evidence completeness)`; scores
abstain below a threshold.

| Parameter | Source |
|---|---|
| KPI rubrics s_i | SBTi, CDP, InfluenceMap, RE100, TCFD |
| Weights w_i | NewClimate CCRM + sector materiality (SASB) |
| Lobbying data | InfluenceMap scores |
| CapEx/R&D green ratio | Company reports / EU Taxonomy alignment |

### 8.4 Data requirements
SBTi registry, CDP responses, InfluenceMap, TCFD/CSRD reports, capex breakdowns, RE100 data. Platform has
adjacent modules (`net-zero-commitment-tracker`, `narrative-intelligence`) but no primary-data ingestion.

### 8.5 Validation & benchmarking plan
Correlate composite against NewClimate CCRM integrity ratings and InfluenceMap organisation scores (target
rank correlation >0.7); inter-rater reliability on KPI rubrics (κ); backtest against subsequent SBTi
validations/withdrawals.

### 8.6 Limitations & model risk
Self-reported data is gameable; rubric subjectivity persists; equal vs materiality weighting changes
rankings. Conservative fallback: require evidence citations per KPI, weight by sector materiality, and
abstain when disclosure is incomplete.

## 9 · Future Evolution

### 9.1 Evolution A — Ground the 15 hand-scored KPIs in source data (analytics ladder: rung 1 → 3)

**What.** This is the cleanest module in the net-zero family: §7 confirms it is entirely hand-authored expert scoring with no PRNG — 15 companies each get 15 KPI scores (0–10) from analyst judgment, and the composite (`Σ scores, 0–150`) with A–E rating (A≥120…E<40) is honest arithmetic. The scores are credible (Orsted 135/A, Shell ~71/C). The limitation is that each KPI is a bare number with no traceable evidence, and the universe is only 15 companies. Evolution A anchors the KPIs to their real sources and widens coverage.

**How.** (1) Wire the KPIs that have public sources to those feeds: SBTi Validation (SBTi registry — a binary/status lookup), CDP Score (CDP public scores), RE Procurement (RE100 disclosures), Lobbying Alignment (InfluenceMap scores) — all four named as standards in §5. Each KPI cell becomes `value + source + as_of` instead of a naked 0–10, so an analyst can audit it. (2) Keep genuinely judgment-based KPIs (board climate expertise, just transition) as expert scores but tag them as such — an honest hybrid. (3) Add companies by templating the same 15-KPI structure, with a validation gate that flags KPIs left unsourced. Backend-optional; can remain tier-B if the sourcing is a build-time data join.

**Prerequisites.** Source-feed access (SBTi/CDP/RE100/InfluenceMap — mostly public); a mapping from each KPI's 0–10 scale to the underlying source metric, documented per Atlas §8. **Acceptance:** at least the four externally-sourced KPIs display their provenance and reconcile to the source; the composite still reproduces `Σ scores`; unsourced KPIs are visibly flagged as expert judgment.

### 9.2 Evolution B — Credibility-index copilot with KPI-level explanation (LLM tier 1)

**What.** A copilot answering "why is Shell rated C?", "which KPIs drag HSBC down?", "compare Microsoft and Iberdrola on CapEx alignment and lobbying" — grounded in the 15 hand-scored (post-Evolution-A, partly sourced) KPIs and the SBTi/CDP/InfluenceMap/RE100 references named in §5. Because the scoring is transparent and additive, this is an ideal tier-1 pilot: every rating decomposes cleanly into 15 visible components.

**How.** System prompt from this Atlas page (§5 KPI list, §7.1 composite/rating logic) plus the serialized `COMPANIES`×`KPIS` score matrix; the copilot explains a rating by naming the specific KPIs above/below the company's average and citing each KPI's source (post-Evolution-A) or flagging it as expert judgment. Served via the roadmap's shared copilot router with prompt caching (static corpus). Refusal path for companies outside the 15-name set and for forward-looking predictions ("will Shell reach A?") the static index does not model.

**Prerequisites.** None hard — the additive scoring is already transparent; Evolution A improves citation quality but tier-1 explanation is safe today provided the copilot labels scores as expert judgment where unsourced. **Acceptance:** every rating explanation reproduces the exact composite and names the driving KPIs; asking about a 16th company refuses rather than extrapolates.