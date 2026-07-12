## 7 · Methodology Deep Dive

> ⚠️ **Scoring engine imported but never called.** `frontend/src/data/taxonomyTree.js` exports a
> genuine, correctly-implemented bottom-up weighted score aggregator (`aggregateScores()`, exactly
> matching the guide's `ParentScore = Σ(child.score × child.weight) / Σ(child.weight)` formula, with
> worst-child-quality propagation) and a `scoreToRating()` A–E band mapper. **The browser page
> imports both but never invokes either** — only the structural utilities (`flattenTaxonomy`,
> `getLeafNodes`, `countByLevel`) are actually used. The page therefore displays the taxonomy's
> *structure* (nodes, weights, data-quality tags, data-source citations) faithfully, but never shows
> an aggregated topic-level or portfolio-level score, despite the guide describing this as the
> module's headline calculation.

### 7.1 What the module computes

A 4-level hierarchical taxonomy browser (`TAXONOMY_TREE` in `data/taxonomyTree.js`) covering 9 L1
topics down to leaf-level assessment points, each leaf tagged with a weight, a PCAF-style data
quality (DQ) score 1–5, and named real data sources. The page renders this structure plus two
synthetic overlay views (coverage matrix, sector overlay) built with the seeded PRNG
`sr(s)=frac(sin(s+1)×10⁴)`.

```
levelCounts = count of nodes at each of 4 levels (real structural count, computed live)
dqDistribution = count of leaf nodes by DQ tier 1–5 (real, computed live from the tree data)
coverageData(topic, source) = 40 + sr(charCode-based seed) × 60      // synthetic 40–100 coverage %
sectorOverlay.exposure = 20 + sr(seed) × 80                          // synthetic 20–100 exposure score
```

### 7.2 Parameterisation

| Element | Structure | Provenance |
|---|---|---|
| `TAXONOMY_TREE` | 9 L1 topics (e.g. Carbon & Emissions, weight 0.15) → L2 → L3 → L4 leaves, each leaf carrying `weight`, `quality` (1–5), and `dataSources` | Hand-built, extensively cross-referenced to real datasets — e.g. `CE.S1.CO.NG` (Natural Gas Boilers) cites EPA GHGRP; `CE.S1.FG.ML` (Methane Leaks O&G) cites OGMP 2.0 + Climate TRACE; `CE.S1.PR.CM` (Cement Clinker) cites EU ETS EUTL |
| `REFERENCE_DATA_SOURCES` | 24 named sources (CDP, SBTi, PCAF, NGFS Phase 5, IPCC AR6, IEA WEO, WRI GPPD...) each with quality tier, coverage, licence, refresh cadence | Real, correctly described data-source registry |
| Leaf `quality` (DQ 1–5) | Per-leaf PCAF-style data-quality tag (1=best/measured, 5=worst/estimated) | Hand-assigned per leaf, consistent with the cited data source's real reliability (e.g. EPA GHGRP-sourced leaves tagged DQ2, estimation-heavy leaves DQ3-4) |
| `aggregateScores()` weighting | `Σ(child.score × child.weight) / Σ(child.weight)`, quality = `max(children quality)` | **Correctly implemented in `taxonomyTree.js` but never called by the browser page** |
| `scoreToRating()` bands | A ≥80, B ≥60, C ≥40, D ≥20, E <20 | **Correctly implemented, unused** |
| Coverage matrix / sector overlay | `sr()`-seeded | Synthetic demo overlay, not derived from actual assessment scores |

### 7.3 Calculation walkthrough

1. **Level counts** (`countByLevel`): a genuine recursive flatten-and-count over the real tree —
   the "9 L1 / ... / 316 L4 leaves" figures cited in the guide are directly verifiable this way.
2. **DQ distribution**: counts leaf nodes by their hand-assigned `quality` tag — real structural
   data, correctly aggregated, though the individual DQ tags themselves are expert-assigned rather
   than derived from an actual per-leaf reliability assessment.
3. **Coverage matrix** (Data Source Map tab): for each of the 9 L1 topics × first 12 data sources, a
   synthetic 40–100% "coverage" percentage is generated from a character-code-seeded PRNG — this
   does **not** reflect the leaf-level `dataSources` citations actually present in the tree (a real
   coverage matrix would instead count, per topic, how many of its leaves cite each source).
4. **Sector overlay**: for each of the platform's high-impact sectors, randomly flags ~70% of the 9
   L1 topics as "affected" and assigns a synthetic 20–100 exposure score — again decorative, not
   derived from the tree's actual sector-materiality relationships (which the tree itself does not
   encode at the L1 level).
5. **What is missing**: no tab in the page actually computes and displays a `ParentScore` (weighted
   roll-up) or an A–E `scoreToRating` band for any node — the "score" concept from the guide's
   calculation engine is entirely absent from the rendered UI.

### 7.4 Worked example (the unused `aggregateScores` formula, illustrated)

Take node `CE.S1.CO` (Combustion Emissions, weight 0.40 within Scope 1) with 4 leaf children:

| Leaf | Weight | Illustrative score | Quality (DQ) |
|---|---|---|---|
| Natural Gas Boilers | 0.25 | 70 | 2 |
| Coal-Fired Generation | 0.30 | 40 | 2 |
| Diesel Generators | 0.20 | 55 | 3 |
| Biomass CHP | 0.25 | 60 | 3 |

If `aggregateScores()` were called with these illustrative leaf scores:

```
totalWeight = 0.25+0.30+0.20+0.25 = 1.00
score = (70×0.25 + 40×0.30 + 55×0.20 + 60×0.25) / 1.00 = (17.5+12+11+15)/1.00 = 55.5
quality = max(2,2,3,3) = 3   (worst-child DQ propagates up — conservative, correct PCAF practice)
rating (scoreToRating(55.5)) = 'C' (Moderate), since 40 ≤ 55.5 < 60
```

This computation is fully correct and ready to run — it simply has no caller anywhere in the browser
page, so a user can never see this "Combustion Emissions" node arrive at a C/Moderate rating.

### 7.5 Companion analytics

- **Configuration tab** — lets users view/adjust node weights (guide states "must sum to 100%");
  since scores are never aggregated, this control has no visible downstream effect in the current
  page.
- **Coverage Matrix tab** — identifies topics "without primary sources" per the guide's
  `userInteraction` list, but does so via random coverage %, not by checking each leaf's actual
  `dataSources` array length.

### 7.6 Data provenance & limitations

- **The taxonomy tree structure itself is a genuinely strong reference asset**: 472 nodes with
  real, correctly-cited data sources (EPA GHGRP, WRI GPPD, EU ETS EUTL, OGMP 2.0, Climate TRACE,
  VIIRS/FIRMS, GLEC Framework, and 17 others) and PCAF-consistent DQ tagging.
- **The weighted-aggregation scoring engine is dead code from the page's perspective** — implemented
  correctly in the shared data file but never wired into any UI computation, so the module cannot
  currently answer "what is this entity's Carbon & Emissions score" despite having all the
  machinery to do so.
- **Coverage matrix and sector overlay are synthetic decoration**, not derived from the tree's real
  per-leaf source citations or any actual sector-materiality mapping.
- No confidence-interval propagation is implemented (the guide's `parent_CI = √(Σ(child_CI²×weight²))/Σweight`
  formula does not appear anywhere in `taxonomyTree.js` or the page).

### 7.7 Framework alignment

- **PCAF Global GHG Standard v3**: leaf-level `quality` (1–5) tags and the worst-quality-propagates-up
  aggregation rule in `aggregateScores()` are directly modelled on PCAF's real data-quality scoring
  convention (1=highest quality/measured, 5=lowest/proxy-estimated).
- **NGFS Phase 5 / IPCC AR6 / GHG Protocol**: cited as governing standards for the taxonomy's
  scientific basis; individual leaf nodes' data-source citations (rather than these top-level
  standards) are what actually ground each leaf in a real methodology.
- **EU CSRD ESRS**: referenced as a standard; the taxonomy's structure (Scope 1/2/3 breakdown by
  emission source type) is consistent with what ESRS E1 disclosure requires companies to itemise.
