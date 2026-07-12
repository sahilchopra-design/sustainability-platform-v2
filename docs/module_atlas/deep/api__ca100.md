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
