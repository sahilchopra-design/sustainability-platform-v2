## 7 · Methodology Deep Dive

The `peer_benchmark` domain (`/api/v1/peer-benchmark`) is a **climate-disclosure gap
assessment** (`peer_benchmark_engine.py`) that benchmarks 12 leading financial institutions
across 18 framework categories (TCFD, ISSB S1/S2, ESRS/CSRD, PCAF, TNFD, Paris alignment). It
is a knowledge-base, not a live scraper: each institution carries an analyst-curated 0-100
score per category.

### 7.1 What the module computes

A weighted-average disclosure score per institution, RAG-classified, plus category heatmaps,
regional averages, framework-group roll-ups and top-gap lists:

```
weighted_score = Σ(score_k · weight_k) / Σ weight_k        (over categories k)
RAG = GREEN ≥75 · AMBER ≥50 · RED <50
group_avg = mean(scores in a framework group)
```

### 7.2 Parameterisation / scoring rubric

**Framework categories & weights** (`FRAMEWORK_CATEGORIES`, 18 entries) — weight reflects
materiality for a financial institution:

| Category | Group | Weight |
|---|---|---|
| ESRS E1 — Climate | ESRS/CSRD | 2.0 |
| PCAF Financed Emissions | Financed Emissions | 2.0 |
| Paris Alignment — Sectors | Net Zero | 2.0 |
| TCFD Strategy / Metrics | TCFD | 1.5 each |
| ISSB S2 — Climate | ISSB | 1.5 |
| Scope 3 Cat 15 · Transition Plan | — | 1.5 |
| Physical Risk · Scenario Analysis | Climate Risk | 1.5 |
| TCFD Governance/Risk · ISSB S1 · ESRS other | — | 1.0 |
| TNFD Nature | Nature | 1.0 |

**RAG thresholds:** GREEN ≥75, AMBER ≥50, RED <50.

**Institution profiles** (`_INSTITUTIONS`, 12) carry AUM, NZBA/PCAF/TNFD membership, net-zero
target year, NZBA sectors reported, mandatory/voluntary frameworks, a per-category score dict,
key strengths, priority gaps and an analyst note. Example (JPMorgan): TCFD governance 85, ESRS
E1 25, PCAF 62, Paris 72, TNFD 22.

**Provenance:** scores are **analyst assessments** from public 2023/2024 sustainability/annual
reports, CDP responses, NZBA templates and PCAF disclosures — explicitly stated in the module
docstring.

### 7.3 Calculation walkthrough

`_weighted_score` computes the category-weighted mean over whichever categories an institution
has scored; `_group_scores` averages within framework groups (TCFD, ISSB, ESRS/CSRD, …).
`get_heatmap` builds a per-category `{score, rag}` grid, appends the weighted average, and
sorts institutions descending. `get_regional_averages` averages each category across
institutions in a region. `get_top_gaps(slug, n)` returns the lowest-scoring categories
(weighted by materiality) as improvement priorities. `get_comparison_table` filters by slug,
region or type and returns comparison rows.

### 7.4 Worked example

A hypothetical institution scored on four categories: ESRS E1 = 25 (w 2.0), PCAF = 62 (w 2.0),
Paris = 72 (w 2.0), TNFD = 22 (w 1.0).

- **Weighted sum:** `25·2 + 62·2 + 72·2 + 22·1 = 50 + 124 + 144 + 22 = 340`.
- **Total weight:** `2 + 2 + 2 + 1 = 7`.
- **Weighted score:** `340 / 7 = 48.6` → **RED** (<50).
- **Top gap:** TNFD (22) and ESRS E1 (25) surface as the lowest scores; weighted by materiality
  the ESRS E1 gap (weight 2.0) ranks as the higher-priority remediation than TNFD (weight 1.0).

### 7.5 Data provenance & limitations

- **All scores are static analyst assessments** as of the 2023/2024 reporting cycle — not a
  live disclosure feed and not seeded-PRNG values. They will drift out of date as institutions
  publish new reports.
- Scoring is subjective (0-100 per category by the analyst), so cross-institution comparisons
  reflect the analyst's rubric, not an audited third-party rating.
- Coverage is limited to 12 named institutions plus a `processed-reports` endpoint for
  uploaded documents; it is a benchmark panel, not the full market.
- Weights are fixed platform judgements about FI materiality, not derived from a regulatory
  weighting scheme.

**Framework alignment:** the categories map one-to-one to the real disclosure standards —
**TCFD** (four pillars: governance, strategy, risk management, metrics & targets), **ISSB
S1/S2** (general + climate), **ESRS/CSRD** (E1 climate, E2-E5, S1-S4, G1, double materiality),
**PCAF** (financed emissions + Scope 3 Cat 15), **Paris alignment** (sector decarbonisation
pathways), **NZBA** (sectors reported), and **TNFD** (nature/biodiversity). The RAG banding
communicates disclosure maturity against these frameworks' expectations.
