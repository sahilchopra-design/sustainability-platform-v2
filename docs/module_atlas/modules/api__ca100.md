# Api::Ca100
**Module ID:** `api::ca100` · **Route:** `/api/v1/ca100` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/ca100/companies` | `list_ca100_companies` | api/v1/routes/ca100.py |
| GET | `/api/v1/ca100/companies/{company_id}` | `get_ca100_company` | api/v1/routes/ca100.py |
| GET | `/api/v1/ca100/sectors` | `ca100_sector_summary` | api/v1/routes/ca100.py |
| GET | `/api/v1/ca100/filters` | `ca100_filter_options` | api/v1/routes/ca100.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `db` *(shared)*, `dh_ca100_assessments` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sector_cluster`, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ca100/companies** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`
Output: `{'type': 'object', 'keys': ['total', 'limit', 'offset', 'companies'], 'n_keys': 4}`

**GET /api/v1/ca100/companies/{company_id}** — status `failed`, provenance ['db-empty'], source tables: `dh_ca100_assessments`
Output: `None`

**GET /api/v1/ca100/filters** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`
Output: `{'type': 'object', 'keys': ['sector_clusters', 'sectors', 'hq_regions', 'overall_assessments'], 'n_keys': 4}`

**GET /api/v1/ca100/sectors** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`
Output: `{'type': 'object', 'keys': ['total_companies', 'sector_clusters'], 'n_keys': 2}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> **Scope note.** This is a **read-only data-serving domain** over the Climate Action 100+
> Net-Zero Company Benchmark, not a computational engine. There is no scoring model in the code —
> the CA100+ indicator scores are *ingested* from the published benchmark into the
> `dh_ca100_assessments` table and served verbatim. Grounded in `api/v1/routes/ca100.py`.

### 7.1 What the domain computes

Four endpoints, all thin SQL views over one table:

| Endpoint | Computation |
|---|---|
| `GET /companies` | Filtered/paginated list; dynamic `WHERE` from up to 5 filters (name/ISIN `LIKE`, sector_cluster, sector, hq_region, overall_assessment) + parallel `COUNT(*)`, ordered by company name |
| `GET /companies/{id}` | Single company: all 10 indicator scores wrapped with human-readable labels, plus overall assessment, sector metadata, `raw_record` and `ingested_at` |
| `GET /sectors` | Aggregation: `GROUP BY sector_cluster, sector, overall_assessment` then rolled up in Python into per-cluster company counts, sector breakdown, and assessment distribution |
| `GET /filters` | Four `SELECT DISTINCT` lists for populating filter dropdowns |

The only computation is **counting** — company counts per cluster/sector and the distribution of
`overall_assessment` values. There is no averaging of indicator scores in code (the
`avg_indicator_scores` field on the `CA100SectorSummary` Pydantic model is declared but the
`/sectors` endpoint does not populate it — it returns `assessment_distribution` instead).

### 7.2 The CA100+ benchmark structure (what the served data represents)

The 10 indicators are the CA100+ Net-Zero Company Benchmark disclosure framework, labelled in
`INDICATOR_LABELS`:

| # | Indicator |
|---|---|
| 1 | Net Zero GHG Emissions by 2050 Ambition |
| 2 | Long-term GHG Reduction Target |
| 3 | Medium-term GHG Reduction Target |
| 4 | Short-term GHG Reduction Target |
| 5 | Decarbonisation Strategy |
| 6 | Capital Allocation Alignment |
| 7 | Climate Policy Engagement |
| 8 | Climate Governance |
| 9 | Just Transition |
| 10 | TCFD Disclosure |

Each score is stored as text (the benchmark uses metric-level Yes/No/Partial sub-metric
assessments rolled to an indicator verdict) — the code treats every `indicator_N_score` as an
opaque string, never parsing or aggregating it numerically. `sector_cluster`, `sector`,
`secondary_sector`, `scope3_category`, `hq_region`, `assessment_year` are dimensional attributes;
`raw_record` (JSON) preserves the full ingested source row for provenance.

### 7.3 Calculation walkthrough (`/sectors` rollup)

1. SQL groups the table by `(sector_cluster, sector, overall_assessment)` returning count rows.
2. Python folds these into a `clusters` dict keyed by `sector_cluster`: each row adds its count to
   the cluster total, to the per-sector sub-count, and to the `assessment_distribution` bucket for
   its `overall_assessment` value (NULLs coalesced to "Unknown"/"General"/"Not Assessed").
3. The response returns `total_companies = Σ cluster counts` and the list of cluster objects.

No weighting, no normalisation — pure additive aggregation of pre-computed benchmark verdicts.

### 7.4 Worked example (`/sectors`)

Suppose the table holds, for cluster "Oil & Gas": 12 companies "Meeting", 20 "Partial", 8 "Not
Meeting", split across sectors "Integrated" and "E&P". The endpoint returns for that cluster:
`company_count = 40`, `sectors = {Integrated: 25, E&P: 15}` (example split),
`assessment_distribution = {Meeting: 12, Partial: 20, "Not Meeting": 8}`. `total_companies` sums
across all clusters. A caller filtering `GET /companies?sector_cluster=Oil %26 Gas&overall_assessment=Meeting`
gets exactly those 12 rows plus `total = 12`.

### 7.5 Data provenance & limitations

- **All data is externally sourced**, ingested from the published Climate Action 100+ Net-Zero
  Company Benchmark into `dh_ca100_assessments` — this domain contains **no synthetic/PRNG data**
  and no house-built scoring. Freshness depends on the ingest job (`ingested_at` column;
  `assessment_year` marks the benchmark vintage).
- The platform is a faithful pass-through: it neither re-scores companies nor validates the
  benchmark's assessments; any methodological limitations are CA100+'s, not the platform's.
- `avg_indicator_scores` is a declared-but-unused response field — indicator scores are text
  verdicts and are not averaged, so no quantitative sector benchmark is produced here.
- Filtering is exact-match (except the name/ISIN `LIKE`); scores are opaque strings so callers
  cannot query "indicator 1 ≥ threshold" style predicates.

### 7.6 Framework alignment

- **Climate Action 100+ Net-Zero Company Benchmark** — the served 10 indicators are CA100+'s own
  disclosure framework. In the real benchmark each indicator is assessed via multiple sub-metrics
  scored Yes / Partial / No against alignment criteria (e.g. Indicator 2 checks whether a company
  has a 2036–2050 GHG target covering the most material scopes with ≥95% coverage); an "Alignment
  Assessment" strand additionally tests quantitative pathway consistency (e.g. against IEA NZE /
  1.5 °C sectoral benchmarks). This platform stores and serves the resulting verdicts.
- **TCFD** — Indicator 10 maps to TCFD disclosure quality (governance/strategy/risk
  management/metrics & targets), consistent with the platform's broader TCFD/ISSB modules.
- **Just Transition** — Indicator 9 aligns with the ILO Just Transition guidelines that
  CA100+ incorporated into its benchmark.

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