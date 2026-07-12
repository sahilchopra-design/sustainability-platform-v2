# Api::Ibtracs_Cyclone
**Module ID:** `api::ibtracs_cyclone` · **Route:** `/api/v1/cyclone-risk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/cyclone-risk/status` | `cyclone_status` | api/v1/routes/ibtracs_cyclone.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `any` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `ref_cyclone_zones`, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/cyclone-risk/point** — status `failed`, provenance ['db-empty'], source tables: `ref_cyclone_zones`
Output: `None`

**GET /api/v1/cyclone-risk/status** — status `passed`, provenance ['real-db'], source tables: `ref_cyclone_zones`
Output: `{'type': 'object', 'keys': ['row_count', 'coverage', 'total_track_points_aggregated', 'global_max_wind_speed_kt', 'risk_level_counts', 'basin_counts', 'data_source', 'note'], 'n_keys': 8}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 9 · Future Evolution

### 9.1 Evolution A — From gridded status to calibrated point cyclone hazard (analytics ladder: rung 2 → 3)

**What.** This is a thin cyclone-hazard service over `ref_cyclone_zones` (the IBTrACS
track-point grid populated by the platform's cyclone ingester). Only
`/cyclone-risk/status` is routed and passing — it returns aggregate coverage
(`row_count`, `total_track_points_aggregated`, `global_max_wind_speed_kt`,
`risk_level_counts`, `basin_counts`). The atlas shows `/cyclone-risk/point` traces as
**failed / db-empty**, so the actual per-location lookup — the thing an underwriter
needs — is not working end-to-end. Evolution A makes point queries work and calibrates
the risk-level bands.

**How.** (1) Fix and harden `/cyclone-risk/point` to return, for a lat/lon, the nearest
gridded track-point statistics (max wind, passage frequency, basin) with a resolution
tier when the point falls outside dense-track basins. (2) Calibrate the `risk_level`
bands against a return-period model fitted to the IBTrACS track history the grid already
aggregates, rather than fixed wind-speed thresholds — so a "High" in the Bay of Bengal
and off Florida mean comparable annual exceedance. (3) Expose a return-period wind
lookup (e.g. 1-in-100-yr gust) consumable by `physical_risk_pricing` and the digital
twin. (4) Confirm the N-hemisphere coverage gap noted in project memory is closed.

**Prerequisites.** `ref_cyclone_zones` coverage validated globally (the memory notes a
prior N-hemisphere gap fix); the failed `/point` handler repaired. **Acceptance:**
`/cyclone-risk/point` returns `passed` with real-db provenance for test coordinates in
each basin; risk-level bands map to documented return periods; a 1-in-100 wind value is
returned per point.

### 9.2 Evolution B — Cyclone exposure as a shared point-hazard tool (LLM tier 1 → 2)

**What.** With only aggregate status live today, the honest near-term LLM role is a
tier-1 explainer over `/status` ("the cyclone grid covers N track points across these
basins; global max recorded wind is X kt") plus a leaf-tool for the physical-risk and
digital-twin copilots once `/point` works.

**How.** Tier 1 narrates the `/status` payload — no new backend. Tier 2 registers
`/point` (post-Evolution-A) so a copilot answering "what's the cyclone exposure of this
asset?" resolves the real gridded wind/frequency rather than recalling storm history;
this module then becomes a canonical peril tool in the tier-3 Desk Orchestrator's
counterparty-hazard chain alongside the flood/wildfire/earthquake grids. Grounding is
deliberately minimal (this Atlas page + the `/status` schema) because the numbers must
come from the grid.

**Prerequisites.** Evolution A's `/point` fix is mandatory before any per-location
copilot use — narrating point exposure from a failing endpoint would fabricate. Until
then the copilot must answer only coverage/aggregate questions and refuse
point queries. **Acceptance:** every wind/frequency figure a consuming copilot cites
traces to a `/point` or `/status` response; per-location questions are refused with an
explicit "point lookup not yet available" until the endpoint passes.