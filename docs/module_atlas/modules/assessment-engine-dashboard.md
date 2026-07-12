# Assessment Engine Dashboard
**Module ID:** `assessment-engine-dashboard` · **Route:** `/assessment-engine-dashboard` · **Tier:** B (frontend-computed) · **EP code:** EP-CS2 · **Sprint:** CS

## 1 · Overview
Score aggregation dashboard with sunburst visualization, entity heatmap, scenario comparison, and quarterly trend analysis.

**How an analyst works this module:**
- Portfolio Overview shows aggregate score
- Sunburst visualizes L1/L2 hierarchy
- Entity heatmap shows entities × topics
- Scenario Comparison toggles NGFS scenarios

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Card`, `ENTITIES`, `L1_COLORS`, `QUARTERS`, `RATING_COLORS`, `RatingBadge`, `SCENARIOS`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Portfolio Overview', 'Entity Deep-Dive', 'Score Distribution', 'Scenario Comparison', 'Trend Analysis', 'Heatmap'];` |
| `overall` | `Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Math.max(1, TAXONOMY_TREE.length));` |
| `portfolioAvg` | `useMemo(() => Math.round(ENTITIES.reduce((s, e) => s + e.overall, 0) / Math.max(1, ENTITIES.length)), []);` |
| `portfolioRating` | `useMemo(() => { const r = scoreToRating(portfolioAvg); return r.label; }, [portfolioAvg]);  const sunburstData = useMemo(() => TAXONOMY_TREE.map((l1, i) => ({ name: l1.code, fullName: l1.name, value: Math.round(l1.weight * 100), fill: L1_COLORS[i % L1_COLORS.length], children: (l1.children \|\| []).slice(0, 5).map((l2, j) => ({ name: l2.cod` |
| `radarData` | `useMemo(() => TAXONOMY_TREE.map(t => ({` |
| `distributionData` | `useMemo(() => { const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${(i + 1) * 10}`, count: 0 }));` |
| `scenarioData` | `useMemo(() => SCENARIOS.map((sc, i) => ({` |
| `trendData` | `useMemo(() => QUARTERS.map((q, i) => ({` |
| `heatmapData` | `useMemo(() => ENTITIES.map(e => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `L1_COLORS`, `QUARTERS`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Score | `AUM-weighted` | Aggregation | Exposure-weighted average across entities |
| Rating | `scoreToRating()` | Model | Moderate transition position |

## 5 · Intermediate Transformation Logic
**Methodology:** Bottom-up aggregation + scenario sensitivity
**Headline formula:** `CompositeScore = Σ(L1_i × weight_i) / Σ(weight_i)`

Rating: A(≥80), B(≥60), C(≥40), D(≥20), E(<20). Scenario sensitivity applies NGFS multipliers.

**Standards:** ['NGFS Phase 5', 'PCAF']
**Reference documents:** NGFS Phase 5; PCAF Standard

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry states the composite score is a
> *weighted* aggregation — `CompositeScore = Σ(L1_i × weight_i) / Σ(weight_i)` — with an
> "AUM-weighted" portfolio score and NGFS-multiplier scenario sensitivity. The code does none of
> this: entity scores are the **unweighted arithmetic mean of 9 L1 topic scores** (taxonomy weights
> are loaded but never applied to scoring), the portfolio score is a **simple mean over 10
> entities** (no AUM weighting — entities carry no AUM field at all), and the Scenario Comparison
> tab applies **seeded random jitter, not NGFS multipliers** (§7.5). The A–E rating rubric in the
> guide *is* faithfully implemented via `scoreToRating()`. Sections below document the code.

### 7.1 What the module computes

The page (EP-CS2, Sprint CS) aggregates transition-assessment scores for 10 named entities
(Shell plc, BP plc, TotalEnergies, Enel SpA, NextEra Energy, Rio Tinto, ArcelorMittal,
HeidelbergCement, Maersk, Deutsche Bank) across the platform's shared `TAXONOMY_TREE`
(`frontend/src/data/taxonomyTree.js`) — 9 Level-1 topics, each with an L2/L3/L4 hierarchy down to
indicator level. The core formulas, quoted from code:

```js
scores[t.code] = Math.round(25 + sr(i*8 + j*3) * 65)                       // per L1 topic, 25–90
overall        = Math.round(Σ scores / Math.max(1, TAXONOMY_TREE.length))  // unweighted mean of 9
portfolioAvg   = Math.round(Σ ENTITIES.overall / Math.max(1, ENTITIES.length))  // mean of 10
```

`sr(s) = frac(sin(s+1)×10⁴)` is the platform's seeded PRNG, so every score is synthetic but
render-stable.

### 7.2 Parameterisation — taxonomy weights and rating rubric

L1 topic weights (from `taxonomyTree.js`; **displayed in the sunburst but not used in scoring**):

| Code | L1 topic | Weight | Code | L1 topic | Weight |
|---|---|---|---|---|---|
| CE | Carbon & Emissions | 0.15 | NB | Nature & Biodiversity | 0.10 |
| ET | Energy Transition | 0.15 | SJ | Social & Just Transition | 0.10 |
| PR | Policy & Regulatory | 0.15 | GS | Governance & Strategy | 0.12 |
| TD | Technology Disruption | 0.12 | GP | Geopolitical Risk | 0.13 |
| PC | Physical Climate Risk | 0.13 | | **Σ** | **1.15** |

Note the weights sum to **1.15, not 1.00** — harmless today because they are only used for
sunburst segment sizing (`value = round(weight × 100)`; L2 ring `round(l2.weight × l1.weight × 1000)/10`),
but they would need renormalising before being used in the guide's weighted formula.

Rating rubric — `scoreToRating()` (matches the guide exactly):

| Score | Rating | Band |
|---|---|---|
| ≥ 80 | A | Excellent |
| ≥ 60 | B | Good |
| ≥ 40 | C | Moderate |
| ≥ 20 | D | Poor |
| < 20 | E | Critical |

The `25 + sr(·)×65` seed range (25–90) means synthetic entities can never score E (<20) and only
rarely A. All constants here are synthetic demo values; only the rating bands are a design rubric.

### 7.3 Calculation walkthrough

1. **Entity generation** — for entity `i` and L1 topic `j`, seed `i*8 + j*3` produces a topic score
   in [25, 90]. `overall` is the plain mean of the 9 topic scores.
2. **Portfolio KPIs** — `portfolioAvg` (mean of 10 overalls), `portfolioRating`
   (`scoreToRating(portfolioAvg)`), best/worst performer via `reduce` max/min, and a hard-coded
   "Data Coverage 87% of L4 nodes" label (synthetic).
3. **Radar (Entity Deep-Dive)** — per topic, the selected entity's score vs the cross-entity mean
   `round(Σ e.scores[t.code] / 10)`.
4. **Distribution** — 10 fixed-width buckets (0–10 … 90–100); `idx = min(floor(overall/10), 9)`.
5. **Heatmap** — the raw 10 × 9 entity-by-topic score matrix, colour-graded in JSX.

### 7.4 Worked example — Shell plc (entity i = 0)

Topic scores from `round(25 + sr(3j)×65)`, j = 0…8:

| j | seed | sr(seed) | Score | j | seed | sr(seed) | Score |
|---|---|---|---|---|---|---|---|
| 0 (CE) | 0 | 0.7098 | 71 | 5 (NB) | 15 | 0.9668 | 88 |
| 1 (ET) | 3 | 0.9750 | 88 | 6 (SJ) | 18 | 0.7721 | 75 |
| 2 (PR) | 6 | 0.8660 | 81 | 7 (GS) | 21 | 0.4869 | 57 |
| 3 (TD) | 9 | 0.7889 | 76 | 8 (GP) | 24 | 0.4825 | 56 |
| 4 (PC) | 12 | 0.6704 | 69 | | | | |

`overall = round((71+88+81+76+69+88+75+57+56)/9) = round(661/9) = round(73.4) = 73` →
`scoreToRating(73)` = **B (Good)**. Had the taxonomy weights been applied (renormalised by 1.15),
the same inputs give ≈73.9 — close here only because scores are uniform-random; a weighted and
unweighted mean would diverge materially for real, topic-skewed entities.

### 7.5 Scenario Comparison & Trend tabs — presentational, not modelled

```js
portfolioScore = round(portfolioAvg + (sr(i*7) − 0.5) × 30)   // per scenario i
bestCase       = round(portfolioAvg + sr(i*11) × 20)
worstCase      = round(portfolioAvg − sr(i*13) × 25)
trend_q        = round(portfolioAvg + i×1.5 + (sr(i*5) − 0.5) × 8)   // per quarter i
```

The six scenario labels (Current Policies, NGFS Below 2°C, NGFS Net Zero 2050, Delayed Transition,
Fragmented World, Low Demand) are cosmetic: each gets a random ±15-point offset unrelated to any
NGFS variable, and `bestCase` is not guaranteed to exceed `worstCase`'s scenario ordering logic.
The quarterly trend embeds a fixed +1.5 pts/quarter drift plus noise. Neither tab consumes scenario
data, carbon prices, or entity fundamentals.

### 7.6 Data provenance & limitations

- **Every number is synthetic**, generated by `sr(seed) = frac(sin(seed+1)×10⁴)`. Entity names are
  real companies but their scores are not derived from any disclosed data. The taxonomy's per-node
  `dataSources` tags (EPA GHGRP, EU ETS EUTL, CDP, IEA/Ember, etc.) describe *intended* provenance
  for a production build, not live feeds.
- Scoring ignores the L2–L4 hierarchy entirely: the exported helpers `aggregateScores`,
  `getLeafNodes`, `flattenTaxonomy` are imported but only `getLeafNodes().length` is used (header
  indicator count). A production version would score leaves and roll up through the weight tree.
- No AUM/exposure weighting, no data-quality weighting (the taxonomy's per-leaf `quality` 1–5 field
  is unused), and the "87% data coverage" KPI is a literal string.
- Scenario/trend analytics are noise around the mean (§7.5) — do not read them as stress results.

### 7.7 Framework alignment

- **NGFS Phase 5 (guide reference)** — only the *scenario names* appear; no NGFS variables
  (carbon price, GDP shock, temperature pathway) are consumed. Real NGFS scenario conditioning on
  this platform lives in the climate-credit and stress-testing modules.
- **PCAF (guide reference)** — not implemented here; there is no financed-emissions attribution or
  EVIC/exposure math on this page. The PCAF machinery lives in `pcaf-financed-emissions`.
- **A–E rating scale** — an internal rubric (20-point bands) analogous in spirit to CDP's A–D− or
  ratings-agency letter grades, but the thresholds (80/60/40/20) are platform-defined, not drawn
  from a named external standard.

## 9 · Future Evolution

### 9.1 Evolution A — Weighted bottom-up scoring with real scenario conditioning (analytics ladder: rung 1 → 2)

**What.** The dashboard has a documented triple mismatch: entity scores are seeded-PRNG draws (`round(25 + sr(i*8+j*3)×65)`) averaged **unweighted** over 9 L1 topics despite the guide's weighted formula; the portfolio score is a simple mean with no AUM field anywhere; and the Scenario Comparison tab applies random ±15-point jitter under NGFS labels — §7.5 warns "do not read them as stress results." Evolution A replaces fabrication with the aggregation the module already imports but never uses: `aggregateScores`, the L2–L4 hierarchy, per-leaf `quality` fields, and the taxonomy weights.

**How.** (1) Score at leaf level and roll up through `TAXONOMY_TREE` weights — after renormalising them (§7.2 documents they sum to 1.15, not 1.00; harmless for sunburst sizing, wrong for scoring). (2) Add exposure weighting: entities gain an AUM/exposure field sourced from `portfolios_pg` holdings so "AUM-weighted" becomes true. (3) Scenario tab consumes the NGFS multipliers from the assessment-configuration console (its `NGFS_SCENARIOS` are the intended source) applied to scenario-sensitive topics only, replacing jitter — honest rung 2. (4) Leaf scores initially seeded from the taxonomy's named `dataSources` (EPA GHGRP, EU ETS EUTL, CDP) where the platform already ingests them; leaves without data render as honest nulls with the coverage KPI computed, not the current hard-coded "87%" string.

**Prerequisites.** Weight renormalisation decision (rescale vs re-author); assessment-configuration's Evolution A (persisted config) so multipliers have a source of truth; purge the PRNG generator. **Acceptance:** a topic-skewed test entity produces materially different weighted vs unweighted scores (§7.4 predicts divergence); scenario ordering is monotonic in multiplier; coverage KPI equals the computed fraction of populated leaves.

### 9.2 Evolution B — Methodology copilot, upgrading to scoring analyst (LLM tier 1 → 2)

**What.** First slice: a tier-1 copilot answering "how is the B rating derived?", "what does the CE topic weight mean?", and "why can't any entity score E?" — the last from §7.2's genuinely interesting artefact (the 25–90 seed range makes E unreachable), which the copilot must disclose as a synthetic-data property, not a finding about the companies. Grounded strictly in this Atlas record (§7.2 rubric, §7.4 worked example) with the mismatch flag embedded so the copilot never presents the scenario tab as stress analysis.

**How.** Standard Tier-1 pattern (pgvector corpus from this record, Haiku serving, prompt-cached context, refusal path required). After Evolution A, upgrade to tier 2: tool calls against the new scoring endpoints let it answer "re-rank the portfolio under Delayed Transition" or "which L3 nodes drag Shell's ET score?" from real aggregation output, with every figure validated against tool responses per the no-fabrication contract. The 10 entities are real companies (Shell, BP, Enel…), so the system prompt must forbid blending model scores with the LLM's background knowledge of those firms — scores come from the engine or not at all.

**Prerequisites.** Copilot router for tier 1 (grounding corpus already exists); Evolution A for tier 2. **Acceptance:** tier-1 answers cite Atlas sections and refuse per-entity "why did BP score 61?" questions while scores are synthetic; tier-2 answers trace every score and delta to a scoring-endpoint response.