# Api::Scenario_Data
**Module ID:** `api::scenario_data` · **Route:** `/api/v1/scenario-data` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/scenario-data/ngfs` | `search_ngfs` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/ngfs/scenarios` | `ngfs_scenarios` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/ngfs/variables` | `ngfs_variables` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/ngfs/models` | `ngfs_models` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/ngfs/compare` | `ngfs_compare` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/sbti` | `search_sbti` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/sbti/sectors` | `sbti_sectors` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/sbti/countries` | `sbti_countries` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/sbti/stats` | `sbti_stats` | api/v1/routes/scenario_data.py |
| GET | `/api/v1/scenario-data/stats` | `combined_stats` | api/v1/routes/scenario_data.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/scenario-data/ngfs** — status `passed`, provenance ['real-db'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['total', 'offset', 'limit', 'records'], 'n_keys': 4}`

**GET /api/v1/scenario-data/ngfs/compare** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['variable', 'region', 'scenarios'], 'n_keys': 3}`

**GET /api/v1/scenario-data/ngfs/models** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['models'], 'n_keys': 1}`

**GET /api/v1/scenario-data/ngfs/scenarios** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['scenarios'], 'n_keys': 1}`

**GET /api/v1/scenario-data/ngfs/variables** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['variables'], 'n_keys': 1}`

**GET /api/v1/scenario-data/sbti** — status `passed`, provenance ['real-db'], source tables: `dh_sbti_companies`
Output: `{'type': 'object', 'keys': ['total', 'offset', 'limit', 'records'], 'n_keys': 4}`

**GET /api/v1/scenario-data/sbti/countries** — status `passed`, provenance ['real-db'], source tables: `dh_sbti_companies`
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/scenario-data/sbti/sectors** — status `passed`, provenance ['real-db'], source tables: `dh_sbti_companies`
Output: `{'type': 'object', 'keys': ['sectors'], 'n_keys': 1}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/scenario-data` is a **reference-data access layer**, not a modelling engine. It exposes two
ingested datasets stored in Postgres and serves them with filtering, grouping and counting — there
are no formulas beyond SQL aggregation:

| Dataset | Table (ORM) | Row grain | Content |
|---|---|---|---|
| NGFS scenario time-series | `dh_ngfs_scenario_data` (`NgfsScenarioData`) | one (model, scenario, variable, region, year) point | Carbon price, CO₂ emissions, temperature, GDP impact, energy mix … per the IIASA NGFS Scenario Explorer |
| SBTi target registry | `dh_sbti_companies` (`SbtiCompany`) | one company | Commitment status, near-/long-term targets, scope coverage, ambition (1.5C / well_below_2C / 2C), net-zero flag |

Every endpoint requires at least the `viewer` role (`require_min_role("viewer")`).

### 7.2 Endpoint parameterisation

| Endpoint | Query logic (exactly as coded) |
|---|---|
| `GET /ngfs` | `ilike '%…%'` partial match on `scenario`, `variable`, `model`; exact match on `region` and lower-cased `category`; `year >= year_min`, `year <= year_max`; paginated (`limit ≤ 1000`, default 100), ordered by scenario → variable → year |
| `GET /ngfs/scenarios` | `GROUP BY scenario, category` with `count(id)`, `min(year)`, `max(year)` |
| `GET /ngfs/variables` / `/ngfs/models` | `GROUP BY variable` (resp. `model`) with data-point counts |
| `GET /ngfs/compare` | Required `variable`, `region` (default `"World"`), optional model filter; results re-grouped in Python into one `{scenario, category, model, unit, data:[{year, value}]}` series per scenario |
| `GET /sbti` | Partial match on company/country/sector; exact match on `target_status` and `near_term_ambition`; boolean `net_zero_committed`; paginated (`limit ≤ 500`, default 50) |
| `GET /sbti/sectors` | `GROUP BY sector`: company count, `SUM(CASE ambition ILIKE '1.5%')` → `aligned_1_5c`, `SUM(CASE net_zero_committed)` → `net_zero_committed`; ordered by company count desc |
| `GET /sbti/countries` | Same pattern grouped by country (count + net-zero count) |
| `GET /sbti/stats` | Scalar counts: total, `lower(target_status)='committed'`, `='targets set'`, net-zero committed, `ambition ILIKE '1.5%'`, distinct sectors, distinct countries |
| `GET /stats` | Combined NGFS (data points, distinct scenarios, distinct variables) + SBTi (companies, distinct sectors) counts |

Constants worth noting: the only hard-coded values are pagination caps (1000 / 500), the
`region="World"` default in `/ngfs/compare`, and the two case-insensitive status strings
`"committed"` and `"targets set"` in `/sbti/stats` — the code comment states these match the
*actual data values* as ingested.

### 7.3 Calculation walkthrough

1. **NGFS category taxonomy.** Each row carries `category ∈ {orderly, disorderly, hot_house_world}`
   and `phase ∈ {1,2,3,4}` (NGFS vintage). The `/ngfs` filter lower-cases the caller's category so
   `Orderly` and `orderly` are equivalent.
2. **Scenario comparison.** `/ngfs/compare` is the analytical workhorse: given one variable
   (e.g. `Price\|Carbon`) it returns aligned time-series for every scenario in the table, which the
   frontend can chart directly. The unit is taken from whichever row is first seen per scenario —
   the code assumes unit homogeneity within a (scenario, variable) pair, which the ingest's unique
   constraint `uq_ngfs_data_composite (model, scenario, variable, region, year)` supports but does
   not strictly guarantee across models.
3. **SBTi alignment shares.** `aligned_1_5c` is computed with `ILIKE '1.5%'` on
   `near_term_ambition`, so both `1.5C` and any `1.5°C`-style variants count; `net_zero_committed`
   is a stored boolean, not derived.

### 7.4 Worked example — sector alignment share

Suppose `dh_sbti_companies` holds 12 `Software and Services` companies of which 9 have
`near_term_ambition = '1.5C'` and 7 have `net_zero_committed = TRUE`. `GET /sbti/sectors` executes

```
SUM(CASE WHEN near_term_ambition ILIKE '1.5%' THEN 1 ELSE 0 END) = 9
SUM(CASE WHEN net_zero_committed = TRUE       THEN 1 ELSE 0 END) = 7
```

and returns `{"sector": "Software and Services", "companies": 12, "aligned_1_5c": 9,
"net_zero_committed": 7}`. Any *percentage* (9/12 = 75 % aligned) is left to the consumer — the API
deliberately returns raw counts only.

### 7.5 Interconnections

- The `source_id` column links rows back to `dh_data_sources` (data-hub provenance registry); the
  FK is documented in the ORM comment but **not enforced**.
- This domain is the read-side companion to the ingest pipeline behind `api::scenarios`
  (`ngfs_sync_service.py`), which writes `NgfsScenarioData` rows; platform scenario-analysis
  modules consume `/ngfs/compare` for scenario chart overlays.
- `SbtiCompany` also feeds SBTi-alignment displays (per project memory, the SBTi registry is one of
  the Tier-1 public reference-data sources ingested to the platform).

### 7.6 Data provenance & limitations

- **Provenance:** rows are ingested from the **IIASA NGFS Scenario Explorer** and the **SBTi Target
  Registry** (stated in the ORM module docstring). The raw upstream record is retained per row in
  `raw_record JSONB`, and `ingested_at`/`updated_at` timestamps give vintage. No synthetic
  `sr(seed)` PRNG data appears anywhere in this domain — it is real ingested public data, subject
  to ingest freshness.
- **Limitations:**
  - No interpolation between NGFS 5-year time-steps; consumers get raw points only.
  - `/ngfs/compare` mixes models unless the caller passes `model`; NGFS values for the same
    scenario differ materially across GCAM/MESSAGE/REMIND, so unfiltered comparisons can blend
    model families.
  - `/sbti/stats` recognises only two status strings (`committed`, `targets set`); other statuses
    (e.g. removed/expired commitments) are counted in `total_companies` but in neither bucket.
  - No unit conversion or currency deflation is applied to NGFS values.

### 7.7 Framework alignment

- **NGFS (Network for Greening the Financial System) scenarios** — the canonical central-bank
  climate scenario set (Orderly / Disorderly / Hot House World taxonomy, phases 1–4). The module
  stores and serves the official IIASA-published variable time-series rather than re-deriving them.
- **SBTi (Science Based Targets initiative)** — SBTi validates corporate targets against
  sector-specific decarbonisation pathways; a "1.5°C-aligned" label means the near-term target's
  annual reduction rate meets the cross-sector absolute-contraction benchmark (≈4.2 %/yr linear
  reduction) or a sector pathway. The module mirrors the registry's published statuses and ambition
  labels; it does not re-validate targets.
- **TCFD / ISSB IFRS S2** — scenario analysis disclosures require exactly the kind of
  multi-scenario variable comparison `/ngfs/compare` provides; this domain is the data substrate,
  not the disclosure logic.

## 9 · Future Evolution

### 9.1 Evolution A — Complete NGFS coverage and unify the platform's scenario sources (analytics ladder: rung 1 → 2)

**What.** A reference-data access layer (no modelling engine) serving two ingested datasets with
SQL filtering: the NGFS scenario time-series (`dh_ngfs_scenario_data` — carbon price, CO₂,
temperature, GDP by model/scenario/variable/region/year, from the IIASA Explorer) and the SBTi
target registry (`dh_sbti_companies`). All endpoints are `viewer`-gated. The `/ngfs` search traces
**real-db** (good), but `/ngfs/compare`, `/scenarios`, `/models`, and `/variables` trace
**db-empty** — the grouping/distinct endpoints return nothing, suggesting partial ingestion.
Critically, this is one of *three* NGFS surfaces on the platform (alongside
`ngfs_scenarios_extract`'s JSON and `glidepath_serve`'s reads). Evolution A completes coverage and
consolidates.

**How.** (1) Fully populate `dh_ngfs_scenario_data` so the distinct/compare endpoints return real
scenario, model, and variable lists — the grouping endpoints are how consumers discover what's
available. (2) Make this the platform's single NGFS source of truth: retire or back the
`ngfs_scenarios_extract` JSON seed and `glidepath_serve`'s reads onto this table so every module
draws the same numbers. (3) Add vintage tagging (Phase 4 vs 5) for reproducibility. (4) Similarly
verify SBTi registry coverage. (5) No formulas to bench-pin, but validate row counts and
distinct-value completeness.

**Prerequisites.** Full IIASA NGFS ingestion into `dh_ngfs_scenario_data`; a consolidation plan
across the three NGFS surfaces. **Acceptance:** `/ngfs/compare`, `/scenarios`, `/models`,
`/variables` return `passed` with real-db data; other NGFS-consuming modules read this table;
vintages tagged; SBTi endpoints return real coverage.

### 9.2 Evolution B — Scenario and target-registry lookup tool (LLM tier 1 → 2)

**What.** As a reference layer, this module's LLM value is as the canonical *NGFS + SBTi lookup
tool* other copilots call: "what's the NGFS Net Zero carbon-price path for the EU?" via
`/ngfs/compare`, or "has this company set a validated 1.5°C SBTi target?" via `/sbti` — real rows,
never recalled.

**How.** Tier 1 explains the discovery endpoints (`/ngfs/scenarios`, `/variables`, `/models`,
`/sbti/sectors`). Tier 2 registers the filterable search/compare endpoints as read-only tools;
because both datasets cite their source (IIASA Explorer, SBTi registry), the copilot always
attributes. This is a foundational leaf-tool for the tier-3 Desk Orchestrator — transition-risk,
net-zero-target, and stress-test copilots ground their scenario and target lookups here.

**Prerequisites.** Evolution A's population — a copilot serving scenario comparisons from db-empty
grouping endpoints would return nothing useful; the honest interim is to report the coverage gap.
**Acceptance:** every scenario value and SBTi status a consuming copilot cites traces to a tool
response with its source; the copilot discloses which NGFS vintage; queries against unpopulated
scenario/variable combinations return an explicit "not in dataset" rather than a guess.