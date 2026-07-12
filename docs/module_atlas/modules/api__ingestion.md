# Api::Ingestion
**Module ID:** `api::ingestion` · **Route:** `/api/v1/ingestion` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/ingestion/ingesters` | `list_ingesters` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/ingesters/{source_id}` | `get_ingester_status` | api/v1/routes/ingestion.py |
| POST | `/api/v1/ingestion/trigger` | `trigger_ingestion` | api/v1/routes/ingestion.py |
| POST | `/api/v1/ingestion/trigger-all` | `trigger_all_ingestion` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/running` | `get_running_jobs` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/jobs` | `list_sync_jobs` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/jobs/{job_id}` | `get_sync_job` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/scheduler` | `get_scheduler_status` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/stats` | `get_ingestion_stats` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/sources` | `list_data_sources` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/sources/{source_id}` | `get_data_source` | api/v1/routes/ingestion.py |
| PATCH | `/api/v1/ingestion/sources/{source_id}/sync-config` | `update_sync_config` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/kpis` | `list_kpis` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/kpis/{kpi_id}` | `get_kpi_detail` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/kpi-categories` | `list_kpi_categories` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/source-fields` | `list_source_fields` | api/v1/routes/ingestion.py |
| POST | `/api/v1/ingestion/source-fields` | `create_source_field` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/mappings` | `list_mappings` | api/v1/routes/ingestion.py |
| POST | `/api/v1/ingestion/mappings` | `create_mapping` | api/v1/routes/ingestion.py |
| PUT | `/api/v1/ingestion/mappings/{mapping_id}` | `update_mapping` | api/v1/routes/ingestion.py |
| DELETE | `/api/v1/ingestion/mappings/{mapping_id}` | `delete_mapping` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/module-coverage` | `get_module_coverage` | api/v1/routes/ingestion.py |
| GET | `/api/v1/ingestion/cross-source` | `cross_source_comparison` | api/v1/routes/ingestion.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `an` *(shared)*, `api` *(shared)*, `collections` *(shared)*, `db` *(shared)*, `dh_data_sources`, `fastapi` *(shared)*, `info`, `ingestion`, `mappings`, `pydantic` *(shared)*, `registry` *(shared)*, `source` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ingestion/cross-source** — status `passed`, provenance ['db-empty'], source tables: `dh_kpi_mappings`
Output: `{'type': 'object', 'keys': ['comparisons', 'total'], 'n_keys': 2}`

**GET /api/v1/ingestion/ingesters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ingesters', 'total'], 'n_keys': 2}`

**GET /api/v1/ingestion/ingesters/{source_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/ingestion/jobs** — status `passed`, provenance ['real-db'], source tables: `dh_sync_jobs`
Output: `{'type': 'object', 'keys': ['total', 'limit', 'offset', 'jobs'], 'n_keys': 4}`

**GET /api/v1/ingestion/jobs/{job_id}** — status `failed`, provenance ['db-empty'], source tables: `dh_sync_jobs`
Output: `None`

**GET /api/v1/ingestion/kpi-categories** — status `passed`, provenance ['real-db'], source tables: `dh_application_kpis`
Output: `{'type': 'object', 'keys': ['categories'], 'n_keys': 1}`

**GET /api/v1/ingestion/kpis** — status `passed`, provenance ['real-db'], source tables: `dh_application_kpis`, `dh_kpi_mappings`
Output: `{'type': 'object', 'keys': ['total', 'kpis'], 'n_keys': 2}`

**GET /api/v1/ingestion/kpis/{kpi_id}** — status `failed`, provenance ['db-empty'], source tables: `dh_application_kpis`
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. Unlike most tier-A domains, there is **no quant engine** behind these routes — `api/v1/routes/ingestion.py` is an operational data-plumbing API, not a methodology module. This deep dive therefore documents its data-management semantics rather than formulas.)*

### 7.1 What the module does

The ingestion domain manages the platform's **external data-source pipeline**: registered ingesters (connectors to public sources such as OWID, World Bank, SBTi, Verra — see the reference-data layer), their sync jobs, and the **KPI mapping layer** that binds raw source fields to application KPIs consumed by front-end modules. Endpoint families:

| Family | Endpoints | Backing store |
|---|---|---|
| Ingester registry | `GET /ingesters`, `GET /ingesters/{source_id}`, `GET /running` | in-process `ingestion.manager.ingestion_manager` |
| Trigger runs | `POST /trigger` (admin/data_engineer), `POST /trigger-all` (admin) | manager, async or sync |
| Job history | `GET /jobs`, `GET /jobs/{job_id}` | `dh_sync_jobs` table |
| Scheduler | `GET /scheduler` | `ingestion.scheduler` (APScheduler-style: `is_available`, `next_runs`) |
| Source registry | `GET /sources`, `GET /sources/{id}`, `PATCH /sources/{id}/sync-config`, `GET /stats` | `dh_data_sources` |
| KPI catalogue | `GET /kpis`, `GET /kpis/{kpi_id}`, `GET /kpi-categories` | `dh_application_kpis` |
| Source fields | `GET /source-fields`, `POST /source-fields` | `dh_source_fields` |
| Mappings CRUD | `GET/POST /mappings`, `PUT/DELETE /mappings/{id}` | `dh_kpi_mappings` |
| Analytics | `GET /module-coverage`, `GET /cross-source` | joins across the above |

### 7.2 Data model / parameterisation

There are no numeric constants or scoring weights. The governance-relevant schema fields are:

- **`DhDataSource`** — `category`, `access_type`, `quality_rating`, `assessment_score`, `priority`, `sync_enabled`, `sync_schedule`, `last_sync_status/error`, `rate_limit`, `cost`. Quality/assessment scores are *stored attributes* of the registry rows (populated at source-onboarding time), not computed by this API.
- **`DhSyncJob`** — full run telemetry: `rows_fetched / inserted / updated / skipped / failed`, `duration_seconds`, `validation_errors`, `log_output`, `triggered_by` (`manual_api`, `manual_api_batch`, scheduler).
- **`DhKpiMapping`** — the methodological heart: `transform_formula` (free-text transformation), `unit_from`/`unit_to`, `approximation_method` + `approximation_assumption`, `confidence_score` (0–1, caller-supplied), `priority_order` (source-preference ranking when multiple sources feed one KPI), and an **auto-versioning** scheme: on `POST /mappings` the new row gets `version = max(existing version for kpi+source) + 1` and `is_current = True`, with `change_note` and `created_by` (user email) for audit.

Role gates: reads require any authenticated user; writes require `admin` or `data_engineer`; `POST /trigger-all` requires `admin`.

### 7.3 Calculation walkthrough — the only computed quantities

Two endpoints derive numbers rather than echoing rows:

1. **Module coverage** (`GET /module-coverage`). For each module slug found in any KPI's `target_modules` JSON array:

```
coverage_pct = mapped_kpis / total_kpis × 100      (0 when total_kpis = 0)
mapped_kpis  = |{KPI ids of module} ∩ {KPI ids with ≥1 mapping where is_active}|
source_count = distinct active source_ids mapped to the module's KPIs
```

2. **Cross-source comparison** (`GET /cross-source?kpi_id=…` or `?category=…`) — lists every mapping for the KPI(s) ordered by `priority_order`, exposing each candidate source's `confidence_score`, `transform_formula` and unit conversion so a data engineer can pick the preferred source. No aggregation is performed; it is a decision-support listing.

`GET /kpis` additionally annotates each KPI with `mapping_count` (count of active mappings, one grouped query).

### 7.4 Worked example — coverage arithmetic

Suppose the KPI catalogue holds 8 KPIs tagged `target_modules ⊇ ["paris-alignment"]`, of which 5 have at least one `is_active` mapping, drawing on 3 distinct sources (e.g. OWID CO₂, World Bank, SBTi):

| Field | Value |
|---|---|
| `total_kpis` | 8 |
| `mapped_kpis` | 5 |
| `coverage_pct` | 5 / 8 × 100 = **62.5** |
| `source_count` | 3 |

If a data engineer then creates a second mapping for an already-mapped KPI (say a Verra fallback at `priority_order=2`, `confidence_score=0.7`), `coverage_pct` is unchanged (set intersection, not mapping count) but the KPI's `mapping_count` becomes 2 and `cross-source` now shows both candidates ranked by priority. Re-mapping the same kpi+source pair yields `version=2` on the new row.

### 7.5 Interconnections

- Downstream of this domain sits the **public reference-data layer** (`/api/v1/refdata` + the `useReferenceData` React hook): ingesters populate generic `reference_data` tables (~221k rows from 7 Tier-1 sources per platform records), which module pages then read.
- The Data Mapping UI (front-end) is the primary consumer of the KPI/source-field/mapping CRUD; `module-coverage` powers its coverage dashboard.
- `dh_sync_jobs` telemetry underpins the operational lineage story used by the platform's E2E data-lineage harness.

### 7.6 Data provenance & limitations

- **No synthetic PRNG data** — everything served is real database state (source registry, job logs, mappings). Conversely, nothing here validates that a `transform_formula` is correct or even parseable: formulas, unit pairs, approximation assumptions and confidence scores are stored as free-form metadata, trusted as entered.
- `confidence_score` has no defined rubric in code — it is whatever the mapping author supplied; cross-source "comparison" is therefore only as reliable as manual data entry.
- N+1 query patterns (per-mapping lookups of KPI/source/field in loops) are acceptable at registry scale but would be a production concern at volume.
- `DELETE /mappings/{id}` is a hard delete, which sits awkwardly beside the auto-versioning/`is_current` audit design — historical versions can be destroyed.
- Trigger endpoints delegate entirely to `ingestion.manager`; retry semantics, rate-limit handling and validation rules live in the individual ingesters, outside this API's scope.

### 7.7 Framework alignment

This is a data-governance module rather than a standards-implementation module, but its design maps onto recognised practice:

- **BCBS 239 (risk-data aggregation)** — approximated by the lineage chain source → field → transform → KPI → module, with versioning, change notes and author attribution on every mapping.
- **Data-quality management (ISO 8000 spirit)** — `quality_rating`/`assessment_score` on sources and `confidence_score`/`approximation_method` on mappings give the vocabulary, though no automated quality measurement is computed.
- **RBAC segregation of duties** — read-for-all, mutate-for-`data_engineer`/`admin`, bulk-trigger-for-`admin` mirrors typical supervisory expectations for production data pipelines.

## 9 · Future Evolution

### 9.1 Evolution A — Observability and data-freshness SLAs for the ingester fleet (analytics ladder: rung 1 → 3)

**What.** This domain is operational data-plumbing, not a quant engine: it manages the
platform's external-source pipeline — the ingester registry
(`ingestion.manager.ingestion_manager`), sync-job history (`dh_sync_jobs`), the
APScheduler-style scheduler, and the KPI mapping layer (`dh_kpi_mappings`) binding raw
source fields to app KPIs. The atlas shows several endpoints trace `db-empty` or `failed`
(`/ingesters/{source_id}` failed, `/jobs/{job_id}` db-empty, `/cross-source` db-empty),
meaning job-history and mapping coverage are thin. Evolution A turns plumbing into a
monitored, SLA-bearing data layer.

**How.** (1) Add per-source freshness metrics — last successful sync, staleness vs
expected cadence, row-delta per run — computed over `dh_sync_jobs`, surfaced through a
new `/health` roll-up so downstream modules can query "is my source current?". (2) Add
anomaly detection on ingest volumes (a source that suddenly returns 0 rows, like the
GLEIF bulk-ingester regression project memory records) fires an alert rather than
silently emptying a table — this is the D1 write-side blind spot the roadmap names. (3)
Populate the failing `/ingesters/{source_id}` detail and `/jobs/{job_id}` paths so
per-source and per-job introspection works.

**Prerequisites.** `dh_sync_jobs` retaining run history (D1 activation); expected-cadence
metadata per ingester in `dh_data_sources`. **Acceptance:** `/ingesters/{source_id}` and
`/jobs/{job_id}` return `passed`; a deliberately-zeroed ingest run raises a staleness/
anomaly flag; freshness is queryable per source.

### 9.2 Evolution B — Data-operations copilot for the pipeline (LLM tier 2)

**What.** An ops copilot that answers "which sources are stale?", "did the GLEIF sync run
last night and how many rows?", and — for privileged users — "re-trigger the OWID
ingester" by calling `/jobs`, `/ingesters`, `/scheduler`, and the RBAC-gated
`/trigger` / `/trigger-all` mutating endpoints under explicit confirmation.

**How.** This is the roadmap's canonical example of tier-2 *mutating* tool use: read
endpoints (registry, jobs, scheduler, stats) are freely callable, but `/trigger`
(admin/data_engineer) and `/trigger-all` (admin) are gated behind user confirmation and
inherit the caller's RBAC session — never a service account. The copilot narrates real
job status and never claims a sync "succeeded" without a `dh_sync_jobs` row proving it.
It's an internal-platform desk tool rather than a customer-facing analytics copilot.

**Prerequisites.** Evolution A's freshness metrics for meaningful status answers; RBAC
confirmation UX for the mutating triggers (the middleware already enforces roles).
**Acceptance:** every sync-status claim traces to a `dh_sync_jobs` record; a trigger
action requires explicit confirmation and logs to the audit trail; a non-privileged user
asking to trigger a sync is refused by the inherited RBAC, and the copilot explains why.