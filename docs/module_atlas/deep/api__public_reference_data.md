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
