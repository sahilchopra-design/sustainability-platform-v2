# Api::Usgs_Earthquake
**Module ID:** `api::usgs_earthquake` · **Route:** `/api/v1/usgs-earthquake` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/usgs-earthquake/status` | `usgs_earthquake_status` | api/v1/routes/usgs_earthquake.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `ref_earthquake_zones`, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/usgs-earthquake/point** — status `failed`, provenance ['db-empty'], source tables: `ref_earthquake_zones`
Output: `None`

**GET /api/v1/usgs-earthquake/status** — status `passed`, provenance ['real-db'], source tables: `ref_earthquake_zones`
Output: `{'type': 'object', 'keys': ['row_count', 'coverage', 'total_events_aggregated', 'global_max_magnitude', 'risk_level_counts', 'data_source', 'note'], 'n_keys': 7}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 9 · Future Evolution

### 9.1 Evolution A — Point exceedance analytics over the seismic grid (analytics ladder: rung 1 → 2)

**What.** This is a thin two-endpoint hazard service over `ref_earthquake_zones` (the digital-twin grid aggregated from real USGS event data): `GET /status` returns grid-wide coverage stats (row_count, global_max_magnitude, risk_level_counts) and `GET /point` does a coordinate lookup — which the lineage trace shows **failing with db-empty provenance** at trace time. Evolution A first hardens `/point` (verify the grid is populated in the target environment; the harness caught it returning None), then adds the module's first real analytics: per-point magnitude-exceedance summaries derived from the aggregated event counts and max magnitudes already stored per cell, plus a radius query ("strongest recorded event within 100 km").

**How.** (1) `/point` gains nearest-cell fallback with a reported `distance_km` and `resolution_tier`, mirroring the GLEIF resolution-cascade pattern, instead of returning nothing between cells. (2) A new `GET /exceedance` computes empirical annual exceedance rates per magnitude band from the cell's `total_events_aggregated` and the ingest's observation window. (3) `/status` exposes ingest vintage (`data_source` exists; add snapshot date) so consumers know data currency.

**Prerequisites.** Confirm `ref_earthquake_zones` population (memory: ~4,500 rows ingested 2026-07-05, post-dating the failing trace); the ingest must persist its observation window or exceedance rates cannot be annualised honestly. **Acceptance:** `/point` for Tokyo and rural Kansas returns different non-null risk levels; exceedance response states its observation window and reports null (not a guess) where event counts are too thin.

### 9.2 Evolution B — Coordinate-resolving screening tool for desk workflows (LLM tier 2)

**What.** A single-lookup hazard endpoint is not worth its own chat panel; its LLM-native value is as a *tool* other assistants call. Evolution B registers `/point` and the new `/exceedance` in the platform tool registry so a Tier-2 analyst (or the Tier-3 counterparty-assessment orchestrator) can answer "what's the seismic exposure of these 12 plant locations?" by geocoding the addresses, batch-calling `/point`, and tabulating real grid values — never estimating magnitudes itself.

**How.** Tool schema auto-generated from the FastAPI spec (both routes are read-only GETs, so no confirmation gating needed); the tool description embeds the `/status` payload's coverage note and data_source so the LLM can state limitations ("grid covers X cells aggregated from USGS; no coverage at this coordinate" when `/point` misses). The no-fabrication validator checks any magnitude or risk level in the answer against the tool outputs in-conversation.

**Prerequisites.** Evolution A's nearest-cell fallback (otherwise the tool returns None for most coordinates and the LLM is tempted to fill gaps); a geocoding capability upstream in the orchestrator, not in this module. **Acceptance:** an assistant answer citing seismic risk for an address traces every number to a `/point` or `/exceedance` response; for an ocean coordinate it reports no-coverage rather than a fabricated risk level.