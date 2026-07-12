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
