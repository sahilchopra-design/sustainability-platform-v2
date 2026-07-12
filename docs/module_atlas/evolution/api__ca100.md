## 9 · Future Evolution

### 9.1 Evolution A — Parse the indicator verdicts into a queryable benchmark (analytics ladder: rung 1 → 3)

**What.** A read-only pass-through domain: four thin SQL views over `dh_ca100_assessments`, serving
the Climate Action 100+ Net-Zero Company Benchmark verbatim (ingested, not house-scored) — the only
computation is counting companies per cluster/sector and the `overall_assessment` distribution.
§7.5 names the honest gaps: the 10 indicator scores are stored as **opaque text** (the benchmark's
Yes/Partial/No sub-metric verdicts) that the code never parses, so callers cannot query "indicator
1 ≥ threshold" predicates; the `avg_indicator_scores` field is declared but never populated, so no
quantitative sector benchmark is produced; and freshness depends entirely on the ingest job.
Evolution A parses the text verdicts into a structured scoring so the served data becomes queryable
and aggregatable — computing real per-sector indicator averages and enabling threshold filtering.

**How.** A migration adding parsed numeric/ordinal columns per indicator (Yes=1/Partial=0.5/No=0
per the benchmark's own rollup), populated by the ingest job; `/companies` gains indicator-threshold
filters; `/sectors` finally populates `avg_indicator_scores`. Rung 3: benchmark each sector's
average indicator alignment and add the CA100+ "Alignment Assessment" pathway-consistency strand
(against IEA NZE 1.5°C sectoral benchmarks) where the source data carries it. This connects
naturally to the platform's `am`/`attribution` Paris-alignment engines.

**Prerequisites.** Fix the lineage-harness failure — §4.2 shows `GET /companies/{id}` **failed**
(db-empty); ensure the ingest job refreshes `ingested_at`/`assessment_year` so vintage is visible.
The platform must stay a faithful pass-through — parsing verdicts is fine, but re-scoring companies
is not (any methodological limits remain CA100+'s). **Acceptance:** a caller can filter companies by
an indicator threshold; `/sectors` returns real per-indicator averages; the detail endpoint passes
the harness.

### 9.2 Evolution B — CA100+ engagement copilot over the benchmark (LLM tier 1 → 2)

**What.** A copilot for stewardship analysts answering "which oil & gas companies are Not Meeting on
capital allocation alignment?", "how does this company score across all 10 CA100+ indicators?", and
"what's the sector distribution of net-zero ambition?" — grounded in the served benchmark data.
Because the domain is a faithful pass-through, the copilot's value is navigation and synthesis over
the CA100+ verdicts, and it must attribute every assessment to CA100+ (with its vintage), never
present it as a platform score.

**How.** Tier-1 roadmap pattern initially: the 10-indicator framework (§7.2) and the benchmark
structure embedded as the module corpus; served via `POST /api/v1/copilot/ca100/ask`. After
Evolution A's parsing, graduate to tier 2 by tool-calling `/companies`, `/sectors` and `/filters` so
the copilot answers threshold queries ("companies Meeting on ≥7 indicators") from real filtered
data, with the no-fabrication validator checking every count against tool output. Composable into an
engagement-brief workflow alongside `analyst_portfolios` and `ai-engagement`.

**Prerequisites.** Evolution A's parsed columns (for tier-2 threshold queries); the detail-endpoint
harness fix; Atlas corpus embedded (roadmap D3). **Acceptance:** every verdict cited is attributed
to CA100+ with its `assessment_year`; a count in an answer matches the `/sectors` or `/companies`
tool output; the copilot never re-scores a company or presents a CA100+ verdict as a platform
computation.
