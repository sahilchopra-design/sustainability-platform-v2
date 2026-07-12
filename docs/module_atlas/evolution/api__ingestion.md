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
