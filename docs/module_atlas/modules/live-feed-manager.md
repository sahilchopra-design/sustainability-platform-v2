# Live Feed Manager
**Module ID:** `live-feed-manager` · **Route:** `/live-feed-manager` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Central management console for financial and ESG data feed ingestion, covering WebSocket real-time streams, REST API polling, SFTP batch delivery, and third-party vendor feed configurations. Monitors feed health, data latency, field completeness, and schema drift with automated alerting. Supports feed prioritisation, fallback routing, and audit logging for platform data governance.

> **Business value:** Gives data engineering and governance teams full visibility and control over ESG and financial data feed quality, ensuring platform analytics are built on complete, timely, and accurate inputs with a defensible audit trail.

**How an analyst works this module:**
- Review the feed health dashboard to identify feeds with degraded FQS, high latency, or completeness gaps
- Drill into a specific feed to view latency distribution, field-level completeness heatmap, and recent schema changes
- Configure fallback routing rules to switch to backup vendors when primary feed quality drops below threshold
- Set up alerting rules for latency SLA breach, record volume drop, and schema drift events
- Access full audit log of ingestion events, quality scores, and manual overrides for data governance reporting

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AV_ENDPOINTS`, `Badge`, `Btn`, `COVERAGE_FIELDS`, `Card`, `EODHD_ENDPOINTS`, `EXCHANGE_FEEDS`, `FIELD_MAPPING`, `LS_FEED_CFG`, `LS_FEED_KEYS`, `LS_FEED_LOG`, `LS_PORTFOLIO`, `SortIcon`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `EXCHANGE_FEEDS` | 15 | `country`, `eodhd_code`, `av_suffix`, `companies`, `status`, `last_update`, `update_frequency`, `data_source`, `fields_covered`, `fields_total`, `coverage_pct`, `brsr_integrated` |
| `FIELD_MAPPING` | 25 | `eodhd_field`, `source`, `transform`, `availability` |
| `BRSR_TABLES` | 7 | `rows`, `last_sync`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `defaultCfg` | `useMemo(() => EXCHANGE_FEEDS.reduce((a, f) => { a[f.exchange] = { enabled:true, frequency:'daily', time:'06:00' }; return a; }, {}), []);` |
| `maskKey` | `(k) => k ? k.slice(0,4) + '****' + k.slice(-4) : '';` |
| `heatmapData` | `useMemo(() => { const fieldCoverage = { 'NSE/BSE':[95,90,85,92,95,98,75,60,80,70], 'NYSE/NASDAQ':[60,45,40,95,98,99,55,50,65,50], 'LSE':[55,40,35,90,95,98,50,45,60,45], 'XETRA':[50,38,32,88,92,95,48,42,55,40], 'Euronext':[48,35,30,85,90,93,45,40,50,38], 'TSE':[45,30,25,90,92,95,40,35,45,35], 'HKEX':[45,32,28,88,90,93,38,32,42,32], 'ASX':[` |
| `sortedExchanges` | `useMemo(() => { const data = EXCHANGE_FEEDS.map(f => ({ ...f, coverage_pct:f.coverage_pct \|\| Math.round((f.fields_covered\|\|15)/(f.fields_total\|\|35)*100) }));` |
| `totalCompanies` | `EXCHANGE_FEEDS.reduce((s,f) => s + f.companies, 0);` |
| `avgCoverage` | `Math.round(EXCHANGE_FEEDS.reduce((s,f) => s + (f.coverage_pct\|\|50), 0) / EXCHANGE_FEEDS.length);` |
| `lastGlobalUpdate` | `'2025-03-25 06:00 UTC';` |
| `freshness` | `useMemo(() => { const now = new Date('2025-03-25T18:00:00Z');` |
| `avgFreshness` | `Math.round(freshness.reduce((s,f) => s + f.hours, 0) / freshness.length);` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k]??''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `pct` | `(api.used / api.limit) * 100;` |
| `totalCo` | `exData.reduce((s,f) => s + f.companies, 0);` |
| `avgCov` | `Math.round(exData.reduce((s,f) => s + (f.coverage_pct\|\|50), 0) / exData.length);` |
| `days` | `Array(7).fill(0).map(() => sr(_sc++) > 0.08 ? 'ok' : sr(_sc++) > 0.5 ? 'slow' : 'fail');` |
| `successPct` | `Math.round(days.filter(d => d === 'ok').length / 7 * 100);` |
| `exchanges` | `EXCHANGE_FEEDS.map(f => f.exchange);` |
| `baseDate` | `new Date('2025-03-25T06:00:00Z');` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BRSR_TABLES`, `COVERAGE_FIELDS`, `EXCHANGE_FEEDS`, `FIELD_MAPPING`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Feed Latency (ms) | — | Platform ingestion timestamp vs. vendor publish timestamp | End-to-end delay from data source to platform availability; >500ms triggers SLA alert |
| Field Completeness (%) | — | Schema conformance checker | Proportion of expected fields populated per inbound record |
| Daily Record Volume | — | Platform ingestion counter | Total records ingested per feed per day; drops >20% trigger volume anomaly alert |
| Schema Drift Events (30d) | — | Automated schema comparator | Number of unexpected field additions, removals, or type changes detected in the past 30 days |
- **WebSocket / REST API vendor connections** → Ingest real-time or polled records; timestamp on receipt; validate against schema → **Raw inbound record stream with ingestion metadata**
- **Schema registry** → Compare inbound field set to registered schema version; detect drift; log changes → **Schema conformance report and drift event log**
- **Feed quality metrics aggregator** → Compute FQS components per feed per hour; persist to time-series store → **Feed health dashboard and SLA breach alert queue**

## 5 · Intermediate Transformation Logic
**Methodology:** Feed Quality Score
**Headline formula:** `FQS = w₁×Completeness + w₂×Timeliness + w₃×Accuracy`

Completeness measures field population rate against schema. Timeliness measures median delivery latency versus contractual SLA. Accuracy scores anomaly detection flag rate using z-score outlier detection on numeric fields. Weighted composite FQS drives automated feed health traffic-light dashboard and vendor SLA breach alerting.

**Standards:** ['DAMA Data Management Body of Knowledge v2', 'ISO/IEC 25012 Data Quality Model', 'IOSCO Principles for Financial Benchmarks 2013', 'EDMC FIBO Financial Data Standards']
**Reference documents:** DAMA International Data Management Body of Knowledge v2 2017; ISO/IEC 25012:2008 â€” Software Engineering Data Quality Model; IOSCO Principles for Financial Benchmarks Final Report 2013; GLEIF LEI Data Quality Management Framework 2021

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states a weighted Feed Quality Score
> `FQS = w₁×Completeness + w₂×Timeliness + w₃×Accuracy` with z-score anomaly detection driving a
> "feed health traffic-light dashboard." **No such score, weighting scheme, or anomaly detector
> exists in the code.** There is also no live WebSocket/REST ingestion — every "refresh" and "test
> connection" action is a `setTimeout`-based simulation that writes a synthetic log row. Sections
> below document the code as it actually behaves.

### 7.1 What the module computes

An admin console for configuring (not actually executing) data-feed ingestion across 14 real stock
exchanges, backed by two real, correctly-documented external APIs — **EODHD** and **Alpha Vantage**
— plus India's BRSR (Business Responsibility & Sustainability Report) reference tables. The page's
"coverage," "freshness," and "field mapping" data are static/hand-entered; the "refresh," "bulk
refresh," and "test connection" actions are **simulated**, not real HTTP calls:

```js
simulateRefresh(exch) {
  setTimeout(() => {
    log = { records: floor(sr(_sc++)*50)+10, duration: `${(sr(_sc++)*3+0.5).toFixed(1)}s`, status:'success' }
  }, 2000);   // fixed 2s delay regardless of exchange
}
testConnection(type) {
  setTimeout(() => setter(apiKeys[type] ? 'connected' : 'error'), 1200);   // only checks key non-empty, no real API call
}
```

### 7.2 Parameterisation

| Construct | Detail | Provenance |
|---|---|---|
| `EXCHANGE_FEEDS` (14 exchanges) | NSE/BSE, NYSE/NASDAQ, LSE, XETRA, Euronext, TSE, HKEX, ASX, SGX, KRX, SSE/SZSE, B3, JSE, TSX — company counts, coverage %, field counts | Real exchange identity/codes; company counts and coverage percentages are plausible static figures, not live-measured |
| `EODHD_ENDPOINTS` / `AV_ENDPOINTS` | Real EODHD (fundamentals, EOD prices, bulk, live) and Alpha Vantage (daily, SMA, overview) API URL templates and rate limits | **Real, correctly documented** third-party API contracts |
| `FIELD_MAPPING` (24 rows) | Platform field → EODHD field → transform → availability % | Real EODHD schema field names (`Highlights.MarketCapitalization`, `ESGScores.totalEsg`, etc.) with plausible coverage percentages |
| `heatmapData` field-coverage matrix | 14 exchanges × 10 fields, hand-entered 0–100 values | Static demo values, directionally sensible (NSE/BSE highest at 95-98% reflecting BRSR mandate; JSE lowest at 10-30%) but not measured |
| `BRSR_TABLES` (6 tables) | Row counts, last sync date, status (synced/stale/sparse) | Static demo values |
| `eodhdCallsToday=47 / Max=100000`, `avCallsToday=12 / Max=500` | Hard-coded rate-limit gauge values | Static demo values, not a live API-usage counter |
| Simulated feed-log entries | `records = floor(sr(_sc++)×50)+10`, `duration = (sr(_sc++)×3+0.5)s` | Synthetic — `_sc` is a module-level auto-incrementing counter feeding the seeded PRNG, so successive simulated refreshes produce different-looking but still fabricated values |

### 7.3 Calculation walkthrough

- **Coverage %**: `coverage_pct = fields_covered / fields_total × 100`, pre-computed per exchange
  (fallback formula applied only if `coverage_pct` is missing from the static row).
- **Freshness**: `hours = (now − last_update) / 3,600,000` against a hard-coded reference time
  `2025-03-25T18:00:00Z` — meaning the "freshness" KPI is frozen relative to that fixed timestamp,
  not the browser's actual current time; `pendingUpdates = count(hours > 24)`.
- **KPI aggregates**: `totalCompanies = Σ companies`, `avgCoverage = mean(coverage_pct)`,
  `brsrCount = count(brsr_integrated)`, `avgFreshness = mean(hours)` — straightforward means/sums
  over the static 14-exchange array.
- **Simulated bulk refresh**: a `setInterval` ticks once per exchange every 400ms, updating a
  progress bar to 100% after 14×400ms=5.6s, then appends one synthetic "ALL (Bulk)" log entry with a
  hard-coded `duration:'18.4s'` regardless of how long the animation actually took.
- **API key masking**: `maskKey(k) = k.slice(0,4) + '****' + k.slice(-4)` — a real, simple masking
  utility; keys are persisted to `localStorage` (client-side only, not sent anywhere, and not
  encrypted at rest).

### 7.4 Worked example

Clicking "Refresh" on `NSE/BSE`: `simulateRefresh('NSE/BSE')` sets a 2-second loading state, then
appends `{ exchange:'NSE/BSE', records: floor(sr(1000)*50)+10, duration: (sr(1001)*3+0.5).toFixed(1)+'s', status:'success' }`.
`sr(1000) = frac(sin(1001)×10000)`; `sin(1001 rad) ≈ 0.8391` → `frac(8391.4) = 0.394` →
`records = floor(0.394×50)+10 = floor(19.7)+10 = 29`. This number has no relationship to how many
records NSE/BSE would actually return from a real EODHD bulk call.

### 7.5 Companion analytics

- **Field Mapping tab** — renders `FIELD_MAPPING` as a reference table; genuinely useful as
  documentation of the intended EODHD→platform schema crosswalk, even though no live sync uses it.
- **Error/Retry panel** — 2 hard-coded static error rows (JSE timeout, B3 rate limit); `retryFeed`
  clears the error and calls the same `simulateRefresh`, so "retrying" always succeeds after 2s
  regardless of the original (fictitious) error cause.
- **BRSR sync status table** — static reference rows with `synced`/`stale`/`sparse` status labels,
  not driven by any actual database row-count query.

### 7.6 Data provenance & limitations

- **No live data ingestion occurs anywhere in this module.** All "connection tests," "refreshes,"
  and "bulk refreshes" are client-side `setTimeout` simulations that fabricate plausible-looking
  success logs regardless of whether a real, valid API key is configured (the connection test does
  check for a non-empty key string, but never calls the actual EODHD/Alpha Vantage endpoint to
  validate it).
- Coverage percentages, field-mapping availability %, and the field-coverage heatmap are all static
  estimates, not measured from real ingested data.
- The freshness calculation anchors to a fixed historical timestamp (`2025-03-25T18:00:00Z`) rather
  than `Date.now()`, so the "freshness" KPI will silently become increasingly stale/meaningless as
  real time moves further from that fixed reference point.
- Guide-claimed anomaly detection (z-score outlier flagging) and the FQS composite score are entirely
  unimplemented.

**Framework alignment:** This module documents genuine, correctly-specified real-world API contracts
(EODHD, Alpha Vantage) and a real regulatory reporting standard (India's BRSR), which gives it
legitimate reference value as **API/schema documentation**. But it should not be read as a live data
governance or feed-quality monitoring tool — it is a UI mock-up of what such a console would look
like once real ingestion, quality scoring, and anomaly detection are wired in.

## 9 · Future Evolution

### 9.1 Evolution A — Real feed execution and a computed FQS over the platform's own ingesters (analytics ladder: rung 1 → 2)

**What.** §7 documents an admin console that configures but never executes: "refresh" and "test connection" are `setTimeout` simulations writing synthetic log rows (test-connection only checks the key is non-empty), the guide's `FQS = w₁·Completeness + w₂·Timeliness + w₃·Accuracy` and z-score anomaly detection don't exist, and coverage/freshness figures are static (frozen at a hard-coded 2025-03-25 baseDate). Yet the module's raw material is real: correctly-documented EODHD and Alpha Vantage API contracts, real EODHD schema field names in `FIELD_MAPPING`, and — crucially — the platform already runs a 19-ingester framework (GLEIF, EIA, ENTSO-E, hazard grids…) whose health this console should be showing. Evolution A repositions the module as the *real* feed-operations console: (1) surface actual ingester run history (timestamps, row counts, errors) from the ingestion framework's logs; (2) implement the FQS server-side per §5 — completeness from schema conformance, timeliness vs configured cadence, accuracy from z-score outliers on numeric fields; (3) make test-connection issue a real authenticated HEAD/light request per vendor.

**How.** (1) An `ingestion_runs` table (if the framework doesn't already persist runs, this is the forcing function) + `GET /feeds/health` computing FQS per feed. (2) The EODHD/AV configurations become genuinely executable ingesters registered in the framework, with rate-limit tracking real rather than displayed. (3) Alert rules (volume drop >20%, SLA breach, schema drift) evaluated on stored runs; the schema comparator diffing actual payloads against the registered `FIELD_MAPPING`. (4) The hard-coded date/freshness constants deleted.

**Prerequisites.** Ingestion-framework run logging; vendor API keys in proper secret storage (masked keys in localStorage is a security smell to fix in passing). **Acceptance:** the dashboard shows real last-run timestamps that advance; FQS decomposes into measured components; test-connection fails on a bad key against the real endpoint.

### 9.2 Evolution B — Data-ops copilot for feed triage (LLM tier 2)

**What.** Feed operations is alert triage plus root-cause narrative — a strong tier-2 fit once telemetry is real: "why did the ENTSO-E feed's FQS drop this week?" (answer from completeness/timeliness component movement), "which analytics modules are downstream of the stale GLEIF feed?" (the Atlas interconnection map knows), "draft the data-governance summary for this month's ingestion incidents."

**How.** Tool schemas over `/feeds/health`, run-history queries and the alert log; downstream-impact answers join feed → table → module via the Atlas lineage data — this copilot is uniquely positioned to use the platform's own provenance artifacts. Root-cause suggestions rank hypotheses from the evidence (schema-drift event vs vendor outage vs rate-limit exhaustion) and are labeled suggestions; governance summaries enumerate incidents with their resolution state, no smoothing. Discipline: SLA/quality claims quote computed FQS components with the measurement window; the copilot never asserts a feed is healthy from configuration alone — only from run evidence, the exact confusion the current simulated console embodies.

**Prerequisites (hard).** Evolution A — triage over simulated logs would be theatre; the console must observe real runs first. Phase 2 tooling. **Acceptance:** every health claim traces to stored run records; downstream-impact lists match the Atlas interconnection data; incident summaries reconcile to the alert log.