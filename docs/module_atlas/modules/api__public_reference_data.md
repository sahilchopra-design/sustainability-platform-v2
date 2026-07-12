# Api::Public_Reference_Data
**Module ID:** `api::public_reference_data` · **Route:** `/api/v1/refdata` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/refdata/sources` | `list_sources` | api/v1/routes/public_reference_data.py |
| GET | `/api/v1/refdata/{source_key}/metrics` | `list_metrics` | api/v1/routes/public_reference_data.py |
| GET | `/api/v1/refdata/{source_key}/points` | `get_points` | api/v1/routes/public_reference_data.py |
| GET | `/api/v1/refdata/{source_key}/records` | `get_records` | api/v1/routes/public_reference_data.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`, `reference-data`

**Database tables:** `db` *(shared)*, `fastapi` *(shared)*, `free`, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/refdata/sources** — status `passed`, provenance ['reference-data', 'real-db'], source tables: `reference_data_sources`
Output: `{'type': 'array', 'len': 31, 'item0_keys': ['source_key', 'name', 'provider', 'license', 'url', 'shape', 'cadence', 'row_count', 'last_ingested_at', 'status', 'meta']}`

**GET /api/v1/refdata/{source_key}/metrics** — status `passed`, provenance ['reference-data', 'db-empty'], source tables: `reference_data_points`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/refdata/{source_key}/points** — status `passed`, provenance ['reference-data', 'db-empty'], source tables: `reference_data_points`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/refdata/{source_key}/records** — status `passed`, provenance ['reference-data', 'db-empty'], source tables: `reference_data_records`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`api/v1/routes/public_reference_data.py` is deliberately **computation-free**: it is the query
layer over the platform's generic Tier-1 public-data store (migration 153). There is no engine —
the four `GET /api/v1/refdata/...` endpoints translate directly into filtered SQLAlchemy queries
against three tables populated offline by the ingesters in `backend/scripts/ingest/`:

| Endpoint | Table | Semantics |
|---|---|---|
| `/sources` | `reference_data_sources` | Registry: which authoritative datasets are loaded, provider, license, row counts, `last_ingested_at` |
| `/{source_key}/metrics` | `reference_data_points` | `SELECT DISTINCT metric` for a points-shaped source, sorted |
| `/{source_key}/points` | `reference_data_points` | Long-format observations, filterable by `metric`, `entity` (ISO3 code), `year`, `year_from` |
| `/{source_key}/records` | `reference_data_records` | Entity catalogues (companies/projects), filterable by `category`, `country` |

### 7.2 Schema & guard rails

`backend/db/models/reference_data.py` defines two data shapes plus the registry:

- **Points** (`shape='points'`): `(source_key, entity_code[32], entity_name, year, metric[80],
  value: Float, unit[40], meta JSON)` — the classic OWID/World Bank long format.
- **Records** (`shape='records'`): `(source_key, ref[120], name[400], category, country,
  payload JSON)` — catalogue rows (e.g. SBTi companies, Verra projects); `as_dict()` splats the
  JSON `payload` into the response alongside the fixed columns.
- **Sources registry**: provider, license, URL, cadence, `row_count`, `status`
  (`registered → loaded`).

Query guard rails in the route: `points` is ordered by `(entity_code, year)` and capped at
`min(limit, 50,000)` (default 5,000); `records` capped at `min(limit, 20,000)` (default 2,000).
There is no aggregation, interpolation or unit conversion anywhere in this layer — consumers
receive raw ingested values.

### 7.3 Ingestion pipeline (how data gets here)

`backend/scripts/ingest/_base.py` provides the shared machinery every per-source ingester uses:

- **Idempotent replace-by-source**: `_bulk()` deletes all rows for the `source_key`, then
  bulk-inserts in 2,000-row batches — re-running an ingester fully refreshes the source.
- **String clipping** (`_clip`) truncates values to column limits so one long string cannot
  abort a batch.
- **Stdlib-only** by design (csv/json/urllib; in-code note: "no pandas — the local numpy/scipy
  is broken").
- `_register()` upserts the registry row with the new count and `last_ingested_at`.
- A DME PostgREST helper (`rest_fetch_all`) pages through the external DME Supabase project;
  its key is env-only (`DME_SUPABASE_KEY`) — the code comments explicitly forbid hardcoding.

Per-source ingesters present in the repo: `owid_co2.py`, `owid_energy.py`, `worldbank.py`,
`sbti.py`, `verra.py`, `cbam.py`, `ceda.py`, `csrd.py`, `brsr.py`, `brsr_dme.py`, `dme_pull.py`,
with `run_all.py` as the orchestrator. Source CSVs are resolved from
`frontend/src/data` (or `REF_DATA_DIR`).

### 7.4 Worked example — one request traced

`GET /api/v1/refdata/owid_co2/points?metric=co2&entity=USA&year_from=2015`

1. Route filters `reference_data_points` on `source_key='owid_co2'`, `metric='co2'`,
   `entity_code='USA'`, `year >= 2015`.
2. Rows return ordered by `(entity_code, year)`, e.g.
   `{"entity_code":"USA","entity_name":"United States","year":2015,"metric":"co2",
   "value":5262.4,"unit":"MtCO2"}` … one dict per year, at most 5,000.
3. No transformation occurs: the value is exactly what the OWID CSV carried at ingest time.
   A consumer wanting a delta or per-capita figure computes it client-side (see the
   `useReferenceData` frontend hook and the paris-alignment wiring noted in project memory).

### 7.5 Distinction from the curated reference layer

The module docstring draws the boundary explicitly: this is the *source-agnostic* store, distinct
from the curated `reference_data.py` route (IRENA capacity costs / CRREM pathways / grid emission
factors), which serves hand-picked constants. New public datasets should land here via a new
ingester rather than as hard-coded frontend seeds.

### 7.6 Data provenance & limitations

- **All data is real public-domain reference data** — this is one of the few API domains with
  **no synthetic seeded values and no PRNG**; provenance (provider, license, URL, ingest
  timestamp) is machine-readable via `/sources`.
- Freshness is bounded by the last manual ingest run (`cadence` is descriptive metadata, not a
  scheduler); there is no automated refresh job in the repo.
- No server-side validation of unit consistency across sources; `value` is a bare float.
- Full-table replace during ingest means a mid-ingest failure can leave a source temporarily
  empty (mitigated by per-batch commits but not transactional end-to-end).
- No pagination cursors — consumers needing >50k points must slice by `year_from`/`entity`.

### 7.7 Framework alignment

- **OWID CO₂ & Energy datasets** — CC-BY country-year emissions/energy series; the platform's
  anchor for national CO₂ trajectories (e.g. Paris-alignment module).
- **World Bank Open Data** — CC-BY 4.0 development indicators via live API pulls.
- **SBTi target dashboard** — company net-zero/near-term target catalogue (records shape);
  SBTi validates targets against 1.5°C-aligned sectoral decarbonisation pathways.
- **Verra VCS registry** — carbon-project catalogue (records shape) underpinning carbon-credit
  modules.
- **EU CBAM & CEDA** — embodied-carbon/default-factor reference sets for border-adjustment and
  supply-chain modules.
- The layer itself is framework-neutral plumbing; alignment obligations (e.g. PCAF data-quality
  scoring of inputs) sit with the consuming modules.

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