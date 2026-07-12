# Api::Peer_Benchmark
**Module ID:** `api::peer_benchmark` · **Route:** `/api/v1/peer-benchmark` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/peer-benchmark/institutions` | `list_institutions` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/institution/{slug}` | `get_institution` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/institution/{slug}/top-gaps` | `get_top_gaps` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/comparison` | `get_comparison` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/regional-averages` | `get_regional_averages` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/framework-coverage` | `get_framework_coverage` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/categories` | `get_categories` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/processed-reports` | `get_processed_reports` | api/v1/routes/peer_benchmark.py |
| POST | `/api/v1/peer-benchmark/compute` | `compute_benchmarks` | api/v1/routes/peer_benchmark.py |
| GET | `/api/v1/peer-benchmark/saved-benchmarks` | `get_saved_benchmarks` | api/v1/routes/peer_benchmark.py |

### 2.3 Engine `peer_benchmark_engine` (services/peer_benchmark_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `score_to_rag` | score |  |
| `PeerBenchmarkEngine._weighted_score` | scores |  |
| `PeerBenchmarkEngine._group_scores` | scores |  |
| `PeerBenchmarkEngine.get_all_institutions` |  |  |
| `PeerBenchmarkEngine.get_institution` | slug |  |
| `PeerBenchmarkEngine.get_comparison_table` | slugs, region, institution_type |  |
| `PeerBenchmarkEngine.get_heatmap` | slugs |  |
| `PeerBenchmarkEngine.get_regional_averages` |  |  |
| `PeerBenchmarkEngine.get_framework_coverage` |  | Which institutions have which mandatory / voluntary frameworks. |
| `PeerBenchmarkEngine.get_top_gaps` | slug, top_n |  |
| `PeerBenchmarkEngine._to_summary` | inst |  |
| `PeerBenchmarkEngine._to_comparison_row` | inst |  |
| `PeerBenchmarkEngine._to_detail` | inst |  |

**Engine `peer_benchmark_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `RAG_GREEN` | `75` |
| `RAG_AMBER` | `50` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `DB` *(shared)*, `SET` *(shared)*, `__future__` *(shared)*, `csrd_entity_registry` *(shared)*, `csrd_kpi_values` *(shared)*, `csrd_peer_benchmarks`, `csrd_report_uploads`, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `processed` *(shared)*, `reports`, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/peer-benchmark/categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['categories'], 'n_keys': 1}`

**GET /api/v1/peer-benchmark/comparison** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['comparison'], 'n_keys': 1}`

**GET /api/v1/peer-benchmark/framework-coverage** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework_coverage'], 'n_keys': 1}`

**GET /api/v1/peer-benchmark/heatmap** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['rows', 'categories'], 'n_keys': 2}`

**GET /api/v1/peer-benchmark/institution/{slug}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/peer-benchmark/institution/{slug}/top-gaps** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/peer-benchmark/institutions** — status `passed`, provenance ['db-empty'], source tables: `csrd_entity_registry`
Output: `{'type': 'object', 'keys': ['institutions', 'count'], 'n_keys': 2}`

**GET /api/v1/peer-benchmark/processed-reports** — status `passed`, provenance ['real-db'], source tables: `csrd_entity_registry`, `csrd_report_uploads`
Output: `{'type': 'object', 'keys': ['reports', 'total'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic

**Engine `peer_benchmark_engine` — extracted transformation lines:**
```python
avg_scores[cat_key] = round(sum(vals) / len(vals), 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `peer_benchmark_engine` (used by 1 modules)

| Connected module | Shared via |
|---|---|
| `api::company_profiles` | engine:peer_benchmark_engine |

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

## 9 · Future Evolution

### 9.1 Evolution A — From curated knowledge-base to report-extracted live scoring (analytics ladder: rung 1 → 3)

**What.** A climate-disclosure gap assessment benchmarking 12 leading financial institutions
across 18 framework categories (TCFD, ISSB S1/S2, ESRS/CSRD, PCAF, TNFD, Paris). The core is
`weighted_score = Σ(score_k·weight_k)/Σweight_k` with materiality weights (ESRS E1, PCAF, Paris
= 2.0; TCFD/ISSB = 1.5) and RAG bands (≥75 green, ≥50 amber). The honest limit, stated in §7:
it is "a knowledge-base, not a live scraper" — each institution's per-category score is
**analyst-curated**, and §4.2 shows `/institution/{slug}` traces **failed** with the
`csrd_report_uploads`/`csrd_kpi_values` tables partly db-empty. Evolution A moves from static
curation to extracted, current scores.

**How.** (1) Wire the benchmark to the platform's own report-processing pipeline
(`csrd_report_uploads` → `csrd_kpi_values`) so category scores derive from actual uploaded
disclosures rather than manual curation, with a curation-vs-extracted `evidence_tier` and an
as-of date. (2) Expand the peer set beyond 12 hardcoded institutions by ingesting more reports.
(3) Add gap-trajectory tracking (is an institution closing gaps year-over-year?) using the
report-year history (rung 3). (4) Fix the `/institution/{slug}` endpoint and bench-pin the
weighted-score aggregation.

**Prerequisites.** Report-processing pipeline populated (`csrd_report_uploads`/`csrd_kpi_values`
db-empty today); an extraction mapping from report content to the 18 categories. **Acceptance:**
category scores carry an `evidence_tier` and as-of date; `/institution/{slug}` returns `passed`;
new institutions appear from ingested reports; year-over-year gap trends computed; aggregation
bench-pinned.

### 9.2 Evolution B — Disclosure-benchmarking copilot for competitive positioning (LLM tier 2)

**What.** A copilot that answers "how does our disclosure compare to peers on PCAF and TNFD?"
(calling `/comparison` and `/framework-coverage` and citing category scores and RAG), and "what
are our top gaps versus the leaders?" (calling `/institution/{slug}/top-gaps`) — each figure
tool-sourced.

**How.** Read endpoints (institutions, comparison, regional-averages, framework-coverage,
top-gaps, categories, heatmap) form the tool set; the 18-category weighting scheme lets the
copilot explain why a gap in a 2.0-weighted category (ESRS E1) matters more than a 1.0-weighted
one. It grounds every claim in curated/extracted scores and always discloses the analyst-curated
basis until Evolution A makes them extracted. Cross-links to the framework copilots (ISSB S2,
GRI, TNFD) for closing identified gaps.

**Prerequisites.** Evolution A's extraction for currency claims — a copilot presenting
analyst-curated scores as live disclosure would mislead on recency; the honest interim is to
state the curation date. **Acceptance:** every score, RAG, and gap traces to a tool response;
the copilot discloses whether a score is analyst-curated or report-extracted with its as-of
date; it refuses to assert a peer's current position beyond the curated/extracted knowledge base.