## 7 · Methodology Deep Dive

The guide describes a *Multi-Source Data Fusion* engine — `Fused_value = Σ w_p·Value_p / Σ w_p` with
quality-tier provider weights, LEI/ISIN entity resolution and conflict detection. **The React page
implements none of that fusion logic.** `DataHubIngesterPage.jsx` is an **ingestion-pipeline monitoring
dashboard**: 16 scheduled jobs with cron/interval/status/record-count, and simple status aggregations.
The real fusion methodology lives (if anywhere) in the listed backend services (`data_hub_service.py`,
`sync_orchestrator.py`), which the page does not surface. Job statuses and daily record counts are
seeded/static. Flag mismatch.

### 7.1 What the module computes

```js
suffix  = String.fromCharCode(65 + (i % 26))          // schedule labelling
total   = 12 + floor(sr(d)·3)                          // seeded per-day job total
failed  = sr(d+50) > 0.9 ? 1 : 0                        // seeded ~10% failure flag
warning = sr(d+100) > 0.85 ? 1 : 0                      // seeded ~15% warning flag
stats   = { success/warning/failed = count SCHEDULES by lastStatus,
            totalRecords = Σ SCHEDULES.records }        // real aggregation of static data
```
The only genuine computation is counting the 16 `SCHEDULES` by status and summing their record counts;
everything driving those counts is authored or seeded.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| SCHEDULES | 16 jobs (name, cron, interval, source, priority, avgDur, lastStatus, records) | curated demo registry |
| Daily job total | `12 + sr(d)·3` | synthetic seeded |
| Failure/warning flags | `sr(d+50)>0.9` / `sr(d+100)>0.85` | synthetic seeded |
| Status aggregation | count by `lastStatus`; Σ records | **real** (over static data) |
| Fusion weights (guide) | primary 1.0 / audited 0.85 / modelled 0.5 | **not implemented** |
| Trace endpoints | `/data-hub/analytics/*`, `/comparisons`, `/scenarios` | real API surface |

### 7.3 Calculation walkthrough

`SCHEDULES` (16 static jobs) → `stats` counts success/warning/failed and sums `records`. A per-day
synthetic series flags occasional failures/warnings via seed thresholds. The page also exposes trace
endpoints for scenario/comparison analytics, but the default view is the job monitor. No fusion,
deduplication or conflict resolution runs client-side.

### 7.4 Worked example (pipeline stats)

Of 16 jobs, suppose 13 `success`, 2 `warning`, 1 `failed`, with record counts summing to 4.2M:
```
stats.success = 13 ; stats.warning = 2 ; stats.failed = 1
stats.totalRecords = Σ SCHEDULES.records = 4,200,000
```
For a synthetic day `d`: `total = 12 + floor(sr(d)·3)` ∈ {12,13,14}; `failed = sr(d+50)>0.9 ? 1:0` —
so roughly 1 in 10 days shows a failure. These are the module's only "computations."

### 7.5 Data provenance & limitations

- **The page is a monitoring shell**: 16 static jobs + status counts. Daily totals and failure/warning
  flags are `sr()`-seeded.
- **The guide's multi-source fusion, entity resolution and conflict detection are not implemented** on
  the page; they belong to the backend services which are not surfaced here.
- No live pipeline telemetry — statuses and record counts are authored.

**Framework alignment:** GHG Protocol data-quality tiers (fusion weights, per guide) · ISO 19131 data
product specs · ESRS data-quality levels · GLEIF LEI (entity resolution, per guide). The page references
these but implements only status aggregation; the fusion methodology is specified below.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The page monitors jobs; the fusion/dedup/
conflict engine is not present.

**8.1 Purpose & scope.** Ingest multi-provider ESG data (MSCI, Refinitiv, CDP, Bloomberg, proprietary),
resolve entities, fuse conflicting values by quality, and log provenance — the reliable data layer under
all platform modules.

**8.2 Conceptual approach.** **Entity-resolution + quality-weighted fusion + conflict gating** — the
master-data-management pattern in Reltio/Tamr and the multi-source approach of Bloomberg/MSCI data ops;
GHG fields tiered per PCAF/GHG-Protocol.

**8.3 Mathematical specification.**
```
Resolve: match records by LEI ∪ ISIN ∪ SEDOL ∪ Bloomberg-ID → entity_id
Weight:  w_p = {primary-measured 1.0, third-party-audited 0.85, modelled/estimate 0.5}
Fuse:    Fused = Σ_p w_p·Value_p / Σ_p w_p
Conflict: if (max_p Value_p − min_p Value_p) > θ_metric → flag for steward (no auto-fuse)
Dedup rate = merged_records / incoming ; Conflict rate = flagged / metrics
```

| Parameter | Source |
|---|---|
| Identifiers | GLEIF LEI, ISIN/SEDOL registries |
| Quality tier `w_p` | provider metadata / PCAF DQ |
| Conflict threshold `θ` | per-metric tolerance policy |
| Provider values | MSCI/Refinitiv/CDP/Bloomberg feeds |

**8.4 Data requirements.** Provider records with identifiers + quality tags; entity master; conflict
thresholds. Vendors: the named providers; free: GLEIF. Backend services (`data_hub_service`,
`sync_orchestrator`) are the intended home.

**8.5 Validation & benchmarking.** Measure dedup precision/recall against a labelled entity set;
reconcile fused values to provider inputs; verify conflict flags catch known divergences; benchmark
latency (P95 target <2h).

**8.6 Limitations & model risk.** Entity resolution errors double-count or wrongly merge; quality tiers
are provider-asserted; fusion can mask real disagreement. Fallback: never auto-fuse beyond θ — route to
steward — and retain all provider values for audit.
