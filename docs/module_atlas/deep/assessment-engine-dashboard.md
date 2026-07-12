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
