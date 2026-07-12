## 9 · Future Evolution

### 9.1 Evolution A — Populate the points/records stores and add derived reference analytics (analytics ladder: rung 1 → 2)

**What.** Deliberately computation-free: the four `GET /api/v1/refdata/...` endpoints are the
query layer over the platform's generic Tier-1 public-data store (migration 153), translating
directly into filtered SQLAlchemy queries over `reference_data_sources` (registry — 31 sources
traced real-db), `reference_data_points` (long-format observations by source/entity/year/metric),
and `reference_data_records` (entity catalogues). The atlas shows the honest gap: `/metrics`,
`/points`, and `/records` all trace **db-empty** — the registry lists 31 sources but the actual
observation tables aren't populated. Evolution A fills them and adds light derived queries.

**How.** (1) Run the offline ingesters in `backend/scripts/ingest/` at scale so
`reference_data_points`/`reference_data_records` hold real observations for the 31 registered
sources — the registry advertises coverage the data tables don't yet back. (2) Add derived query
support the current pass-through lacks: year-over-year change, latest-value-per-entity, and
cross-source alignment on ISO3 entity codes (the schema keys on `entity_code`), so consumers get
comparable series without client-side stitching. (3) Surface `last_ingested_at` and `row_count`
staleness prominently so consumers know a source's currency. (4) Keep the honest-null design.

**Prerequisites.** Ingesters run against the target DB (D0/D1 seeding — this is the shared
credibility-gap the roadmap names); ISO3 entity-code normalisation across sources.
**Acceptance:** `/metrics`, `/points`, `/records` return real-db data with nonzero rows for the
registered sources; a cross-source aligned query returns comparable series; staleness surfaced per
source.

### 9.2 Evolution B — Reference-data lookup as a shared grounding tool (LLM tier 1 → 2)

**What.** As a pure data layer, this module's LLM value is as the *canonical public-reference
tool* other copilots call: "what's this country's renewable-energy share?" or "give me the World
Bank GDP series for these ISO3 codes" resolves through `/points` here rather than any copilot
recalling figures — the platform's single source of authoritative public data.

**How.** Tier 1 explains `/sources` (which datasets are loaded, provider, license, currency).
Tier 2 registers the four read endpoints as tools; because the registry carries license and
`last_ingested_at`, the copilot can always cite the source and its currency. This is a foundational
leaf-tool for the tier-3 Desk Orchestrator — country-risk, sector, and benchmarking narratives
across the platform ground their reference numbers here.

**Prerequisites.** Evolution A's population is mandatory — a copilot serving reference figures from
db-empty points tables would return nothing or, worse, be tempted to fill gaps; the honest interim
is to report which sources are registered-but-unpopulated. **Acceptance:** every reference value a
consuming copilot cites traces to a `/points` or `/records` response with its source and
`last_ingested_at`; queries against registered-but-empty sources return an explicit
"registered, not yet ingested" rather than silence or a fabricated value.
