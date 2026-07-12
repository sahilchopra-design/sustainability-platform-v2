# Data Hub Ingester
**Module ID:** `data-hub-ingester` · **Route:** `/data-hub-ingester` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages multi-source ESG data ingestion pipelines with normalisation, deduplication, and quality validation for provider data from MSCI, Refinitiv, CDP, Bloomberg, and proprietary sources. Supports scheduled and event-driven ingestion with conflict resolution and provenance tracking.

> **Business value:** Enables data engineering and ESG teams to maintain a high-quality, provenance-tracked multi-source ESG data foundation, reducing manual data reconciliation effort and providing the reliable data layer on which all platform modules depend.

**How an analyst works this module:**
- Configure provider connections in the Connector Registry with API credentials
- Pipeline Monitor tab shows real-time status of all active ingestion pipelines
- Entity Resolution tab reviews and resolves entity matching decisions for new records
- Conflict Manager tab shows metrics with provider disagreements awaiting steward resolution
- Quality Gate tab applies DQ rules and blocks non-conforming records from reaching the data warehouse
- Provenance Ledger provides full audit trail of each record’s origin, transformation, and destination

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENTITIES`, `PRIORITY_COLOR`, `RUN_HISTORY`, `SCHEDULES`, `STATUS_COLOR`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SCHEDULES` | 16 | `name`, `cron`, `interval`, `source`, `priority`, `avgDur`, `lastStatus`, `records` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `suffix` | `String.fromCharCode(65 + (i % 26));` |
| `date` | `new Date('2026-04-01');` |
| `total` | `12 + Math.floor(sr(d) * 3);` |
| `failed` | `sr(d + 50) > 0.9 ? 1 : 0;` |
| `warning` | `sr(d + 100) > 0.85 ? 1 : 0;` |
| `stats` | `useMemo(() => ({ success: SCHEDULES.filter(j => j.lastStatus === 'success').length, warning: SCHEDULES.filter(j => j.lastStatus === 'warning').length, failed: SCHEDULES.filter(j => j.lastStatus === 'failed').length, totalRecords: SCHEDULES.reduce((s, j) => s + j.records, 0), }), []);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/data-hub/stats` | `get_hub_stats` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/sources` | `list_sources` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/sources/{source_id}` | `get_source` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/sources` | `create_source` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/sources/seed` | `seed_sources` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/sources/{source_id}/sync` | `sync_source` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/sync-all` | `sync_all_sources` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/sync-synthetic` | `sync_synthetic_only` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/sync-logs` | `get_sync_logs` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/scenarios` | `list_scenarios` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/scenarios/search` | `search_scenarios` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/scenarios/{scenario_id}` | `get_scenario` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/scenarios/{scenario_id}/trajectories` | `get_scenario_trajectories` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/trajectories/query` | `query_trajectories` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/comparisons` | `list_comparisons` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/comparisons` | `create_comparison` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/comparisons/{comparison_id}` | `get_comparison` | api/v1/routes/data_hub.py |
| DELETE | `/api/v1/data-hub/comparisons/{comparison_id}` | `delete_comparison` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/favorites` | `list_favorites` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/favorites` | `add_favorite` | api/v1/routes/data_hub.py |
| DELETE | `/api/v1/data-hub/favorites/{favorite_id}` | `remove_favorite` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/analytics/coverage` | `get_coverage_analytics` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/analytics/temperature-range` | `get_temperature_range` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/analytics/carbon-price-range` | `get_carbon_price_range` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/trajectories/available-variables` | `get_available_variables` | api/v1/routes/data_hub.py |

### 2.3 Engine `data_hub_service` (services/data_hub_service.py)
| Function | Args | Purpose |
|---|---|---|
| `DataHubService.list_sources` | active_only |  |
| `DataHubService.get_source` | source_id |  |
| `DataHubService.get_source_by_short_name` | short_name |  |
| `DataHubService.create_source` | data |  |
| `DataHubService.list_scenarios` | source_id, category, limit, offset |  |
| `DataHubService.search_scenarios` | params |  |
| `DataHubService.get_scenario` | scenario_id |  |
| `DataHubService.upsert_scenario` | data | Insert or update a scenario based on source_id + external_id. |
| `DataHubService.get_trajectories` | scenario_id, variable_name, region |  |
| `DataHubService.bulk_insert_trajectories` | trajectories |  |
| `DataHubService.delete_trajectories_for_scenario` | scenario_id |  |
| `DataHubService.list_comparisons` |  |  |
| `DataHubService.create_comparison` | data |  |
| `DataHubService.get_comparison` | comparison_id |  |
| `DataHubService.delete_comparison` | comparison_id |  |
| `DataHubService.create_sync_log` | source_id |  |
| `DataHubService.complete_sync_log` | log_id, status, scenarios_added, scenarios_updated, trajectories_added, error_message |  |
| `DataHubService.get_sync_logs` | source_id, limit |  |
| `DataHubService.list_favorites` | user_id |  |
| `DataHubService.add_favorite` | data |  |
| `DataHubService.remove_favorite` | favorite_id |  |
| `DataHubService.get_stats` |  |  |
| `DataHubService.refresh_source_counts` | source_id |  |
| `DataHubService.get_coverage_analytics` |  | Coverage of sources, scenarios, variables by tier and category. |
| `DataHubService.get_temperature_analytics` |  | Temperature target distribution. |
| `DataHubService.get_carbon_price_analytics` |  | Carbon price range across scenarios. |
| `DataHubService.get_available_variables` |  | Get all unique variable names with their units. |

### 2.3 Engine `sync_orchestrator` (services/sync_orchestrator.py)
| Function | Args | Purpose |
|---|---|---|
| `ScenarioSyncOrchestrator.seed_sources` |  | Create all source entries if they don't exist. |
| `ScenarioSyncOrchestrator.sync_source` | source_id | Sync a single source by its ID. |
| `ScenarioSyncOrchestrator.sync_all` | include_real_data | Sync all active sources. |
| `ScenarioSyncOrchestrator.sync_synthetic_only` |  | Sync only synthetic sources (fast). |

**Engine `sync_orchestrator` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `ALL_SOURCES` | `[{'name': 'NGFS Phase V', 'short_name': 'ngfs', 'organization': 'NGFS / IIASA', 'description': 'Network for Greening the Financial System Phase V scenarios. REAL DATA from IIASA Scenario Explorer.', 'url': 'https://data.ece.iiasa.ac.at/ngfs/', 'tier': 'tier_1', 'update_frequency': 'Quarterly', 'data` |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `db` *(shared)*, `fastapi` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `SCHEDULES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Data Providers | — | Platform configuration | Number of integrated data providers feeding the ESG data hub |
| Daily Records Ingested | — | Pipeline metrics | Volume of ESG data records processed per day across all active provider feeds |
| Deduplication Rate | — | Entity resolution | Proportion of incoming records identified as duplicates and merged with existing records |
| Provider Conflict Rate | — | Conflict detection | Proportion of metrics where two or more providers disagree beyond threshold, requiring review |
| Pipeline Latency (P95) | — | Pipeline monitoring | 95th percentile ingestion latency from provider publication to platform availability |
- **MSCI/Refinitiv/CDP/Bloomberg API feeds** → Extract records via API, validate schema, assign quality tier weight → **Raw provider records with quality metadata**
- **Entity resolution engine (LEI/ISIN/SEDOL)** → Match incoming entities to master registry, detect duplicates → **Deduplicated entity-linked records**
- **Conflict detection and fusion engine** → Compare provider values, fuse where agreement, flag conflicts for review → **Fused ESG data with provenance trail**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/data-hub/analytics/carbon-price-range** — status `passed`, provenance ['real-db'], source tables: `hub_trajectories`
Output: `{'type': 'object', 'keys': ['count', 'min', 'max', 'scenarios'], 'n_keys': 4}`

**GET /api/v1/data-hub/analytics/coverage** — status `passed`, provenance ['real-db'], source tables: `hub_scenarios`, `hub_sources`
Output: `{'type': 'object', 'keys': ['by_tier', 'by_category', 'total_variables', 'total_regions', 'variables', 'regions'], 'n_keys': 6}`

**GET /api/v1/data-hub/analytics/temperature-range** — status `passed`, provenance ['real-db'], source tables: `hub_scenarios`
Output: `{'type': 'object', 'keys': ['buckets', 'total_with_target', 'details'], 'n_keys': 3}`

**GET /api/v1/data-hub/comparisons** — status `passed`, provenance ['real-db'], source tables: `hub_comparisons`
Output: `{'type': 'array', 'len': 3, 'item0_keys': None}`

**GET /api/v1/data-hub/comparisons/{comparison_id}** — status `failed`, provenance ['db-empty'], source tables: `hub_comparisons`
Output: `None`

**GET /api/v1/data-hub/favorites** — status `passed`, provenance ['real-db'], source tables: `hub_favorites`
Output: `{'type': 'array', 'len': 1, 'item0_keys': None}`

**GET /api/v1/data-hub/scenarios** — status `passed`, provenance ['real-db'], source tables: `hub_scenarios`, `hub_sources`, `hub_trajectories`
Output: `{'type': 'object', 'keys': ['scenarios', 'total', 'limit', 'offset'], 'n_keys': 4}`

**GET /api/v1/data-hub/scenarios/{scenario_id}** — status `failed`, provenance ['db-empty'], source tables: `hub_scenarios`
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-Source Data Fusion
**Headline formula:** `Fused_value = Σ_p (w_p × Value_p) / Σ_p w_p`

Provider weights (w_p) are assigned based on source quality tier: primary measured data = 1.0, third-party audited = 0.85, modelled/estimated = 0.5. Conflict resolution applies: if max(Value_p) - min(Value_p) > threshold, flag for steward review rather than auto-fuse. Deduplication uses entity resolution matching on LEI, ISIN, SEDOL, and Bloomberg ID to prevent double-counting across providers.

**Standards:** ['GHG Protocol Data Quality Tiers', 'ISO 19131 Data Product Specifications', 'ESRS Data Quality Levels']
**Reference documents:** GHG Protocol Data Quality Guidance for Scope 3 Reporting; ISO 19131:2007 Geographic Information â€” Data Product Specifications; ESRS Data Quality Levels (EFRAG Implementation Guidance); GLEIF Legal Entity Identifier Database

**Engine `data_hub_service` — extracted transformation lines:**
```python
src = DataHubSource(**data)
sc = DataHubScenario(**data)
objs = [DataHubTrajectory(**t) for t in trajectories]
comp = DataHubComparison(**data)
fav = DataHubFavorite(**data)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **66** other module(s).

| Connected module | Shared via |
|---|---|
| `carbon-market-intelligence` | table:schemas, table:sqlalchemy |
| `carbon-integrity-mrv-analytics` | table:schemas, table:sqlalchemy |
| `carbon-institutions-taxonomy` | table:schemas, table:sqlalchemy |
| `carbon-footprint-intelligence` | table:schemas, table:sqlalchemy |
| `carbon-reduction-projects` | table:schemas, table:sqlalchemy |
| `carbon-aware-allocation` | table:schemas, table:sqlalchemy |
| `carbon-forward-curve` | table:schemas, table:sqlalchemy |
| `carbon-project-lifecycle` | table:schemas, table:sqlalchemy |
| `carbon-removal-markets` | table:schemas, table:sqlalchemy |
| `carbon-adjusted-valuation` | table:schemas, table:sqlalchemy |

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

## 9 · Future Evolution

### 9.1 Evolution A — Real pipeline telemetry on the page, real fusion in the service (analytics ladder: rung 1 → 2)

**What.** §7's mismatch: the page is a monitoring shell — 16 authored `SCHEDULES`
with seeded daily failure flags — while the real API surface (25 endpoints,
`data_hub_service`/`sync_orchestrator`, including `GET /sync-logs` and
`POST /sources/{id}/sync`) goes unsurfaced, and the guide's fusion engine
(`Fused = Σ w_p·Value_p/Σ w_p` with 1.0/0.85/0.5 quality tiers, LEI/ISIN dedup,
threshold-gated conflict flags) is implemented nowhere. With blast radius 66, this
hub's honesty matters disproportionately. Two harness failures
(`GET /comparisons/{id}`, `/scenarios/{id}`) need triage too.

**How.** (1) Telemetry wiring: the Pipeline Monitor reads `GET /sync-logs` and
`GET /sources` — the platform runs 19 real ingesters whose runs produce actual
statuses and record counts; the seeded daily series and static job registry get
deleted. (2) Fusion engine in `data_hub_service`: implement the guide's weighted
fusion with the quality-tier weights, entity resolution through the GLEIF spine
(the platform's `entity_lei` table and OpenFIGI mapping already exist — reuse, not
rebuild), and the conflict rule (spread > threshold → steward queue, never
auto-fuse). (3) Provenance ledger rows per fused value (source, weight, tier) —
the audit-trail promise made real via AuditMiddleware. (4) Fix the two failed GETs
(likely the platform's known NULL-field/500 class).

**Prerequisites (hard).** Seed purge on the monitor; a second provider source to
fuse against (single-provider fusion is a no-op — start where the platform has
overlap, e.g. emissions from BRSR vs CDP-style disclosures); steward-queue UI.
**Acceptance:** the monitor shows a real ingester run within minutes of triggering
`POST /sync-all`; a constructed two-provider conflict above threshold lands in the
steward queue un-fused; every fused value's weights reproduce its tier assignment.

### 9.2 Evolution B — Conflict-resolution steward assistant (LLM tier 2)

**What.** The Conflict Manager tab's core task — "provider disagreements awaiting
steward resolution" — is judgment work an assistant can prepare: for each flagged
conflict, summarize the disagreement (values, providers, tiers, vintage),
investigate context via tool calls (the entity's history in the hub, the providers'
track records on this metric, unit/scope mismatches — the most common real cause),
and propose a resolution with rationale ("Provider A reports location-based Scope 2,
Provider B market-based — not a true conflict; recommend storing both with scope
tags") for the steward to accept or override.

**How.** Tier-2 read tools over the fused store, sync logs, and entity history;
resolution proposals are gated writes requiring steward confirmation, logged with
the proposal rationale — building the platform's conflict-resolution corpus (the
roadmap's flywheel). The scope/unit-mismatch taxonomy comes from the GHG Protocol
data-quality guidance already cited in §5. The assistant never auto-resolves:
its value is triage speed, not authority.

**Prerequisites (hard).** Evolution A's fusion engine and steward queue (there are
no real conflicts to triage today); provider metadata (tier, methodology) stored
per source. **Acceptance:** on a constructed conflict set, ≥80% of proposals match
expert resolutions; every proposal cites the specific values and tiers involved;
unresolved-by-design cases (true disagreements) are recommended for both-stored,
not forced to a winner.