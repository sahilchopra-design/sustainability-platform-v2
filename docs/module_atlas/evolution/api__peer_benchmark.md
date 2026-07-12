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
