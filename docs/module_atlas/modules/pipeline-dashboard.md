# Pipeline Dashboard
**Module ID:** `pipeline-dashboard` · **Route:** `/pipeline-dashboard` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Monitors data ingestion pipeline status, throughput, latency, and error rates across all ESG and climate data feeds.

> **Business value:** Provides operations-level visibility into all data ingestion workflows, enabling rapid fault detection and data freshness assurance.

**How an analyst works this module:**
- View pipeline registry and current run statuses.
- Drill into individual pipeline logs and error traces.
- Set latency and error-rate alert thresholds.
- Trigger manual pipeline re-run or rollback.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `BADGE`, `DEFAULT_PIPELINES`, `DEMO_HISTORY`, `DEMO_STATS`, `MANUAL_FIELDS`, `STATUS_COLOR`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEFAULT_PIPELINES` | 7 | `label`, `schedule`, `domain`, `expectedMs` |
| `MANUAL_FIELDS` | 6 | `label`, `type`, `defaultValue` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `fakeStatus` | `sr(_sc++) > 0.15 ? 'success' : 'failed';` |
| `ids` | `new Set(prev.map(p => p.id));` |
| `sortedDurations` | `[...filtHistBase].filter(r=>r.duration_ms).map(r=>r.duration_ms).sort((a,b)=>a-b);` |
| `trendData` | `Object.values(dayBuckets).sort((a,b) => a.day.localeCompare(b.day)).slice(-14);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DEFAULT_PIPELINES`, `MANUAL_FIELDS`
**Shared context buses:** `TestDataContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Pipelines | — | Platform Telemetry | Count of data pipelines currently scheduled and operational. |
| Avg Latency (min) | — | Pipeline Logs | Mean time from data source update to platform availability. |
| Error Rate (%) | — | Error Tracking | Percentage of pipeline runs terminating in a fault state over rolling 24 hours. |
- **Source API / file drop / CDC events** → Extraction; validation; transformation; load; reconciliation → **Processed dataset in platform data warehouse with lineage metadata**

## 5 · Intermediate Transformation Logic
**Methodology:** Pipeline Health Score
**Headline formula:** `H = (successful_runs / total_runs) × (1 – error_rate)`

Composite pipeline reliability metric combining run success ratio and weighted error frequency.

**Standards:** ['Internal Platform Telemetry']
**Reference documents:** Apache Airflow Documentation; Internal Data Engineering Runbook

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide names a "Pipeline Health Score" formula
> `H = (successful_runs/total_runs) × (1 − error_rate)`. **The code does not compute `H`.** It
> computes a plain success rate (`successCount/total×100`) with no error-rate multiplier, and
> displays it directly as "Live Success %". The rest of the guide's operational framing (data
> pipeline monitoring) matches the code closely.

### 7.1 What the module computes

This is an operations/observability tool, not a climate-risk quant module — it monitors 6 named
ETL pipelines (BRSR enrichment, IEA pathways sync, NGFS scenario seed, nature-risk loader, PCAF
WACI calc, regulatory monitor) feeding the rest of the platform.

```js
liveSuccessRate = filtHistBase.length
  ? (successCount / filtHistBase.length) × 100
  : stats.success_rate_pct                                    // fallback to seeded 94.6%
liveP95 = sortedDurations[floor(sortedDurations.length × 0.95)]  // empirical 95th percentile
slowRuns = filtHistBase.filter(r => r.duration_ms > durationThreshold).length
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `DEMO_STATS.success_rate_pct` | 94.6% | Synthetic seed, `data_source: 'memory_fallback'` |
| `DEMO_STATS.total_runs_30d` | 186 | Synthetic seed |
| Default success threshold | 90% | UI default, user-adjustable 80–100% |
| Default duration alert | 10,000ms | UI default, user-adjustable 1–30s |

### 7.3 Calculation walkthrough

1. On load, the page attempts `GET /api/v1/data-pipeline/dashboard` and `/history` — if the backend
   responds with `total_runs_30d`, it overwrites the `DEMO_STATS` seed; on failure it silently keeps
   the seed values (`catch {}`).
2. When a pipeline is manually triggered, outcome is decided by
   `sr(_sc++) > 0.15 ? 'success' : 'failed'` — an **85% simulated success rate**, independent of the
   pipeline's actual backend state, purely for UI demo purposes. A fabricated log stream
   (`genLogLines`) is typed out with `350+sr()×200`ms delays between lines.
3. `liveP95` is a genuine empirical percentile computed from whatever run-history rows are currently
   in state (real formula, applied to either live or seeded data).
4. `dayBuckets`/`trendData` group history rows by calendar day for the 14-day success/failure area
   chart — real aggregation logic over whatever `history` array is populated.

### 7.4 Worked example

20 seeded history rows, 2 marked `'failed'` at indices 2 and 9, 1 `'partial'` at index 5 → with no
filters, `filtHistBase.length=20`, `successCount=17` (indices not 2/5/9), `liveSuccessRate =
(17/20)×100 = 85.0%`. If `successThreshold=90`, the KPI renders red ("⚠ Below threshold") since
85.0 < 90.

### 7.5 Companion analytics
Regulatory-basis bar cites 3 real frameworks (RBI Data Governance Guidelines 2021, SEBI BRSR Filing
SLA, PCAF WACI Data Lineage) purely as descriptive context — no calculation ties pipeline health to
these frameworks' specific requirements.

### 7.6 Data provenance & limitations

- **Trigger outcomes and log streams are entirely fabricated** (`sr()`-seeded 85% success rate,
  scripted log lines) — clicking "Trigger" does not reflect real pipeline execution unless the
  backend `/trigger` POST succeeds and the page is later refreshed from `/history`.
- `DEMO_STATS`/`DEMO_HISTORY` fall back silently on any API error, so a broken backend connection is
  indistinguishable from a healthy one showing demo data — no error banner is shown to the user.
- P95 latency and success-rate KPIs use correct statistical formulas; the risk is entirely in the
  *inputs* (seeded vs. real), not the aggregation logic itself.

## Framework alignment

This module does not implement a climate-risk or financial-risk framework — it is an internal data
platform reliability tool. Its regulatory citations (RBI 2021, SEBI BRSR, PCAF) describe *why*
pipeline freshness matters for downstream disclosures, not a modelled requirement the page checks
against.

## 9 · Future Evolution

### 9.1 Evolution A — Real pipeline telemetry and the correct health score (analytics ladder: rung 1 → 3)

**What.** This is an operations/observability tool, not a climate-quant module — it monitors 6 named ETL pipelines (BRSR enrichment, IEA pathways sync, NGFS scenario seed, nature-risk loader, PCAF WACI calc, regulatory monitor) that feed the rest of the platform. §7 flags a small but real defect: the guide's Pipeline Health Score (`H = (successful_runs/total_runs) × (1 − error_rate)`) is *not* computed — the code shows a plain success rate (`successCount/total×100`) with no error-rate multiplier, and falls back to a seeded 94.6% when no live data is present (`data_source: 'memory_fallback'`). The page does attempt real endpoints (`GET /api/v1/data-pipeline/dashboard` and `/history`) but relies on demo stats when they're absent. Evolution A makes the telemetry real and fixes the formula.

**How.** (1) Implement the documented health score with the error-rate term (`H = success_ratio × (1 − error_rate)`) rather than bare success %, and remove the seeded 94.6% fallback in favor of an honest "no data" state. (2) Back the `/data-pipeline/dashboard` and `/history` endpoints with real run records from the platform's 19 ingesters — the ingestion framework already runs these jobs; capture their run status, duration, and error counts in a `pipeline_runs` table (the roadmap's D4 warehouse posture over `audit_*` tables is the natural home). (3) The empirical p95 latency and slow-run detection (already correctly computed from real durations when present) then operate on live data. This is genuine observability once the run data is real.

**Prerequisites.** A `pipeline_runs` telemetry table populated by the ingesters (they exist; they need to log runs); the `/data-pipeline` endpoints wired to it. Remove the seeded fallback per platform honesty convention. **Acceptance:** the health score includes the error-rate term per the guide; success rate and p95 compute from real run records, not demo stats; a failed ingester run appears in the dashboard.

### 9.2 Evolution B — DataOps copilot for pipeline monitoring (LLM tier 1 → 2)

**What.** A copilot for the ops workflow §1 describes: "which pipelines failed in the last 24 hours?", "what's the p95 latency for the PCAF WACI calc?", "why is the nature-risk loader slow?", "trigger a re-run of the NGFS seed" — grounded in real pipeline telemetry (post-Evolution-A) and the platform's data-engineering runbook.

**How.** Tier 1 explains pipeline status and the health-score methodology from the (post-Evolution-A) real telemetry: system prompt from this Atlas page's §5 formula and the dashboard data; the copilot summarises run health, identifies failing/slow pipelines, and cites the health-score decomposition. Tier 2 adds tool-called operations: the manual re-run/rollback actions §1 mentions become confirmed, RBAC-gated tool calls (mutating operations — explicit confirmation required per the roadmap's Tier-2 pattern), and diagnostic queries against `/history`. The fabrication validator matches every success-rate/latency figure to the telemetry; the copilot must not report health from the seeded fallback (pre-Evolution-A) as if it were live.

**Prerequisites.** Evolution A's real telemetry (a monitoring copilot on demo stats is useless); RBAC gating on re-run/rollback actions. **Acceptance:** every status/latency figure traces to real run records; re-run actions require confirmation and respect RBAC; the copilot flags when it is showing fallback rather than live data.