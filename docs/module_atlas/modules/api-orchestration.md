# API Orchestration
**Module ID:** `api-orchestration` · **Route:** `/api-orchestration` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG data pipeline orchestration layer managing multi-provider API workflows, data transformation, normalisation, and routing to downstream platform modules. Supports DAG-based workflow definition, retry logic, data lineage capture, and provider failover. Enables operations teams to configure data feeds from Bloomberg, MSCI, Sustainalytics, and proprietary sources without code changes.

> **Business value:** Robust API orchestration is the invisible backbone of ESG data quality: without lineage capture and failover logic, data gaps from provider outages silently degrade disclosure accuracy. The orchestration layer ensures that every data point in the platform can be traced to its source, transformation, and ingestion timestamp.

**How an analyst works this module:**
- Pipeline Library lists all configured ESG data DAGs with run history
- DAG Visualiser shows node-by-node execution status and latency
- Data Lineage tab traces any platform data point back to its source API call
- Failover Config tab manages priority-ordered provider chains per data type
- Coverage Report shows field-level completeness by company and provider
- Alert Rules configure failure notifications per pipeline

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COVERAGE_FIELDS`, `DATA_SOURCES`, `FIELD_SOURCE_MAP`, `KPICard`, `LS_CONFIG`, `LS_KEYS`, `LS_LOG`, `LS_PORT`, `PIPELINES_INIT`, `STATUS_COLORS`, `TIER_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DATA_SOURCES` | 11 | `name`, `type`, `status`, `tier`, `url`, `endpoints`, `coverage`, `refresh_rate`, `cache_ttl_hrs`, `rate_limit`, `auth`, `data_fields`, `companies_covered`, `last_call`, `errors_24h`, `avg_latency_ms` |
| `PIPELINES_INIT` | 7 | `name`, `source`, `target`, `frequency`, `last_run`, `next_run`, `status`, `records_processed`, `errors`, `duration_ms` |
| `TABS` | 6 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v => v == null ? '--' : typeof v === 'number' ? v.toLocaleString() : String(v);` |
| `fmtPct` | `v => v == null ? '--' : `${v.toFixed(1)}%`;` |
| `totalCalls24` | `sources.reduce((s, d) => s + (d.calls_24h \|\| Math.round(sr(_sc++) * 20)), 0);` |
| `totalErrors24` | `sources.reduce((s, d) => s + d.errors_24h, 0);` |
| `avgLatency` | `Math.round(sources.filter(s => s.avg_latency_ms > 0).reduce((a, s) => a + s.avg_latency_ms, 0) / Math.max(1, sources.filter(s => s.avg_latency_ms > 0).length));` |
| `companiesCov` | `sources.filter(s => typeof s.companies_covered === 'number').reduce((a, s) => a + s.companies_covered, 0);` |
| `bondsCov` | `50 + 0; // CBI certified` |
| `countriesCov` | `190; // IMF` |
| `pipelineSuccessRate` | `pipelineLog.length > 0 ? (pipelineLog.filter(e => e.status === 'success').length / pipelineLog.length * 100) : 100;` |
| `rateLimits` | `useMemo(() => sources.filter(s => s.status !== 'planned').map(s => {` |
| `used` | `Math.round(sr(_sc++) * max * 0.6);` |
| `cacheInfo` | `useMemo(() => sources.filter(s => s.cache_ttl_hrs > 0).map(s => {` |
| `size` | `Math.round(sr(_sc++) * 500 + 50);` |
| `dur` | `1500 + Math.round(sr(_sc++) * 3000);` |
| `records` | `50 + Math.round(sr(_sc++) * 500);` |
| `csv` | `[headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `hoursAgo` | `s.last_call ? Math.round((Date.now() - new Date(s.last_call).getTime()) / 3600000) : null;` |
| `refreshPct` | `hoursAgo !== null && s.cache_ttl_hrs > 0 ? Math.max(0, Math.min(100, 100 - (hoursAgo / s.cache_ttl_hrs * 100))) : 50;` |
| `totalCalls` | `s.calls_24h \|\| Math.round(sr(_sc++) * 20 + 2);` |
| `errPct` | `totalCalls > 0 ? (errorRate / totalCalls * 100).toFixed(1) : '0.0';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COVERAGE_FIELDS`, `DATA_SOURCES`, `PIPELINES_INIT`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Pipeline Success Rate | — | Orchestration log | Percentage of scheduled pipeline runs completing without error |
| Data Freshness | `now() – last_run` | Orchestration scheduler | Time elapsed since each data feed was last successfully refreshed |
| Field Coverage | `Populated / Total × 100` | Data quality monitor | Proportion of required data fields populated across all portfolio companies |
- **Bloomberg / MSCI / Sustainalytics APIs** → Extract ESG fields; transform to platform schema; capture lineage metadata per field → **Normalised ESG records in platform database with full source lineage**
- **Orchestration scheduler** → Execute DAGs on cron schedule; apply retry logic on failure; trigger failover chain → **Pipeline run logs, freshness metrics, and coverage reports**

## 5 · Intermediate Transformation Logic
**Methodology:** DAG-based pipeline orchestration with lineage
**Headline formula:** `Pipeline_latency = Σ(node_processing_time_i); Data_freshness = now() – last_successful_run; Coverage = Populated_fields / Total_fields × 100`

Each pipeline is modelled as a directed acyclic graph (DAG) of transformation nodes. Lineage metadata is captured at each node to enable full audit trails. Provider failover uses priority-ordered fallback chains: primary provider failure triggers secondary source substitution with data quality flag.

**Standards:** ['Apache Airflow DAG pattern', 'DAMA DMBOK Data Lineage', 'ISO 8000 Data Quality']
**Reference documents:** Apache Airflow DAG Documentation; DAMA DMBOK v2 Data Lineage Chapter; ISO 8000-8 Data Quality Characteristics

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes *DAG-based pipeline
> orchestration* over Bloomberg / MSCI / Sustainalytics feeds with retry logic, provider failover
> chains and per-field lineage capture. **The code contains no DAGs, no retries, no failover and
> no Bloomberg/MSCI/Sustainalytics integrations.** What it actually implements is an *operations
> console over a hand-curated registry of 10 real (mostly free-tier) data sources* — EODHD,
> Alpha Vantage, OpenFIGI, IMF Climate Data, FINRA TRACE, KAPSARC, Climate Bonds Initiative, an
> internal Supabase BRSR database, plus planned Cbonds and LSEG — with *simulated* pipeline runs
> persisted to localStorage. The registry metadata is genuine documentation of the platform's
> intended data supply chain; the runtime telemetry is synthetic.

### 7.1 What the module computes

- **`DATA_SOURCES` (10 rows, hand-curated and real)** — each source records type, status
  (active/fallback/planned), tier (free/internal/paid/enterprise), base URL, endpoint names,
  coverage, refresh cadence, cache TTL, rate limit, auth mode, data fields and companies covered
  (e.g. EODHD: 656 companies, 24 h TTL, "20 req/day (free)"; Supabase BRSR: 1,323 Indian
  companies; LSEG: planned, cost $22k/yr). These match the sources named in the platform's
  reference-data layer.
- **`PIPELINES_INIT` (6 pipelines)** — named source→target flows (Equity Fundamentals Refresh,
  Technical Indicators, Bond Universe Update, Sovereign ESG Refresh, BRSR Data Sync, Identifier
  Resolution) with frequency labels; all start `idle` with zero counters.
- **Simulated run engine** — `runPipeline(id)` sets status `running`, waits
  `dur = 1500 + sr(·)·3000` ms via `setTimeout`, then records
  `records = 50 + round(sr(·)·500)` processed and an error with probability
  `sr(·) < 0.1`; the run is appended to `pipelineLog` and persisted to
  `localStorage['ra_pipeline_log_v1']`, so run history *does* accumulate across sessions.
- **`FIELD_SOURCE_MAP`** — a 10-field coverage matrix mapping platform fields (revenue,
  market_cap, esg_score, figi, rsi, macd, green_bonds, bond_pricing …) to their supplying
  sources, including ordered fallbacks for `bond_pricing: [cbonds, lseg, finra_trace]` — the
  closest thing to the guide's failover chain, but purely declarative.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Rate-limit maxima | EODHD 20/day · Alpha Vantage 500/day · OpenFIGI 1,200 · others 9,999 | Real free-tier quotas for the first three; 9,999 is a placeholder |
| Simulated utilisation | `used = round(sr(·)·max·0.6)` (0–60 % of quota) | Synthetic |
| Run duration / records / failure | 1.5–4.5 s · 50–550 records · 10 % error probability | Synthetic simulation constants |
| Cache hit rate KPI | 78.4 % | Hardcoded literal |
| Freshness score KPI | 82 | Hardcoded literal |
| Coverage KPIs | bonds = 50 (CBI certified), countries = 190 (IMF) | Hardcoded with source comments in code |
| Alert config defaults | 5 errors, 2,000 ms latency, 24 h TTL | `LS_CONFIG` defaults, user-editable, persisted |
| Cache refresh % | `100 − hoursAgo/cache_ttl_hrs·100`, clamped 0–100; 50 if unknown | Genuine staleness formula over (mostly null) `last_call` timestamps |

### 7.3 Calculation walkthrough

1. **Dashboard KPIs** — `activeSources` (status filter), `totalCalls24` (real `calls_24h` if set,
   else a small random fill), `totalErrors24` (sums the registry's zeros), `avgLatency` (mean of
   positive `avg_latency_ms`, guarded by `Math.max(1, n)`), `companiesCov = Σ companies_covered`
   (656 + 200 + 1,323 + 50 = 2,229), and
   `pipelineSuccessRate = successes / totalRuns × 100` — this last one is **genuinely computed
   from the user's accumulated run log** (100 % when empty).
2. **24-hour timeline** — `genTimeline()` draws hourly latency (≈ 50–750 ms), sparse errors
   (15 % of hours) and call counts; regenerated per mount.
3. **Rate limits & cache panels** — per-source utilisation bars from the simulated `used/max`,
   and cache cards with random size (50–550 KB) and hit rate (60–95 %); `clearCache` stamps a
   timestamp only.
4. **API key vault** — keys entered by the user are stored (plaintext) in
   `localStorage['ra_api_keys_v1']`; no calls are made with them from this page.
5. **Coverage tab** — renders `FIELD_SOURCE_MAP` against `GLOBAL_COMPANY_MASTER` size.
6. **CSV exports** — source registry and run log serialisers.

### 7.4 Worked example (one simulated pipeline run)

User clicks *Run* on `pipe_equity_fundamentals` (EODHD → companyMaster). Suppose the three
`sr(_sc++)` draws are 0.42, 0.66, 0.93:

| Step | Computation | Result |
|---|---|---|
| Duration | `1500 + 0.42·3000` | 2,760 ms |
| Records | `50 + round(0.66·500)` | 380 |
| Error? | 0.93 < 0.1 ? | no → status **success** |
| Pipeline row update | `records_processed += 380; duration_ms = 2760` | cumulative counter grows |
| Log entry | `{pipeline, timestamp, status:'success', records:380, duration_ms:2760}` | appended + persisted |
| Success-rate KPI | e.g. 9 successes / 10 runs | 90.0 % |

(`_sc` is a module-level monotonically increasing seed counter starting at 1000, so successive
draws differ but replay identically per page load sequence.)

### 7.5 Data provenance & limitations

- **The source registry is real, hand-maintained metadata** (URLs, quotas, TTLs, coverage match
  the public offerings of EODHD/Alpha Vantage/OpenFIGI/IMF/KAPSARC/CBI and the platform's
  internal Supabase BRSR store). It is documentation, not live discovery — `last_call`,
  `errors_24h` and `calls_24h` are static nulls/zeros.
- **All runtime telemetry is simulated**: pipeline runs never touch a network; latency/error
  timelines, rate-limit usage and cache stats are `sr()` draws; cache hit rate and freshness are
  literals.
- Run history and API keys persist only in browser localStorage (keys in plaintext — a real
  deployment would keep secrets server-side).
- No DAG structure, retry/backoff, or automatic failover; the fallback ordering exists only as an
  array in `FIELD_SOURCE_MAP`.

### 7.6 Framework alignment

- **Apache Airflow DAG pattern** — cited by the guide as the orchestration model (tasks as nodes,
  dependencies as edges, cron scheduling, retries). The module's flat pipeline list with manual
  triggers is a single-node degenerate case of it.
- **DAMA DMBOK data lineage** — the field→source coverage map is a coarse, field-level lineage
  record (which provider supplies which attribute); true DMBOK lineage would capture per-value
  transformation steps and timestamps.
- **ISO 8000 data quality** — freshness (TTL-based staleness %) and coverage KPIs approximate two
  ISO 8000 characteristics; accuracy/consistency checks live in the separate anomaly-detection
  module.
- **Data freshness SLO** — `Data_freshness = now − last_successful_run` from the guide is
  implemented as the cache `refreshPct` formula, the module's one genuine time computation.

## 9 · Future Evolution

### 9.1 Evolution A — Real DAG execution over the live source registry (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag, the guide's DAG orchestration with retry logic, provider
failover and per-field lineage is **not implemented**: the code is an operations console over a
hand-curated registry of 10 real (mostly free-tier) sources — EODHD, Alpha Vantage, OpenFIGI, IMF,
FINRA TRACE, KAPSARC, Climate Bonds, internal Supabase BRSR — with *simulated* pipeline runs
(`runPipeline` sets status, waits `1500 + sr·3000` ms, records `50 + sr·500` and a 10%-probability
error). The registry metadata is genuine documentation of the platform's data supply chain; the
runtime telemetry is synthetic, and `last_call`/`errors_24h`/`calls_24h` are static nulls. The
platform actually *has* 19 real ingesters — Evolution A connects this console to them, turning
simulated runs into real orchestration with retry/backoff and the declared `FIELD_SOURCE_MAP`
failover chains (`bond_pricing: [cbonds, lseg, finra_trace]`) actually executing.

**How.** A backend orchestration service where `runPipeline` triggers a real ingester and records
true records-processed, latency and errors to a `pipeline_runs` table; per-field lineage captured
per DAMA DMBOK against the platform's existing `lineage_output/traces/` artifacts. The cache-refresh
formula (`100 − hoursAgo/cache_ttl·100`) — already the module's one genuine time computation —
operates on real `last_call` timestamps. Rung 3: real freshness/coverage SLOs replacing the
hardcoded 78.4% cache-hit and 82 freshness literals.

**Prerequisites (hard).** Move API keys server-side (currently plaintext in localStorage, §7.5);
purge the simulated run/latency/utilisation `sr()` draws per the no-fabricated-random guardrail;
wire retry/failover, which today exist only as a declarative array. **Acceptance:** a pipeline run
makes a real network call and records genuine records/latency/errors; a primary-source failure
triggers the declared fallback; freshness reflects actual last-call timestamps.

### 9.2 Evolution B — Data-ops copilot over pipeline health and lineage (LLM tier 2)

**What.** A copilot for operations teams answering "which feeds are stale?", "trace where the
`green_bonds` field comes from" (walking `FIELD_SOURCE_MAP` and its fallback chain), "what's my
pipeline success rate this week?" (the one genuinely computed KPI from the accumulated run log),
and "re-run the BRSR sync" — tool-calling the orchestration endpoints and narrating real telemetry
instead of the simulated runs.

**How.** Tool schemas over Evolution A's run/status/lineage endpoints; read-only queries (status,
lineage trace, coverage) auto-execute, while mutating actions (trigger run, edit failover config,
rotate keys) render a confirmation first. The no-fabrication validator checks every latency,
success-rate and coverage figure against tool output. The registry's real source metadata (quotas,
TTLs, coverage counts — 656 EODHD, 1,323 BRSR companies) is ideal RAG grounding for "which source
covers Indian companies?" questions.

**Prerequisites.** Evolution A (real telemetry to narrate — today runs never touch a network);
server-side key storage before a copilot can trigger authenticated calls; Atlas corpus embedded
(roadmap D3). **Acceptance:** every figure in an answer traces to a pipeline-run or registry tool
output; a "re-run" action requires confirmation and produces a real run log entry; a lineage trace
resolves a field to its actual supplying source and fallbacks.