# Api::Wildfire_Risk_Status
**Module ID:** `api::wildfire_risk_status` · **Route:** `/api/v1/wildfire-risk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/wildfire-risk/status` | `wildfire_risk_status` | api/v1/routes/wildfire_risk_status.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `ref_wildfire_zones` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/wildfire-risk/point** — status `failed`, provenance ['db-empty'], source tables: `ref_wildfire_zones`
Output: `None`

**GET /api/v1/wildfire-risk/status** — status `passed`, provenance ['real-db'], source tables: `ref_wildfire_zones`
Output: `{'type': 'object', 'keys': ['row_count', 'coverage', 'global_mean_fwi_proxy', 'max_fwi_proxy', 'risk_level_counts', 'scenario', 'data_source', 'note'], 'n_keys': 8}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 9 · Future Evolution

### 9.1 Evolution A — Scenario-conditional FWI point service (analytics ladder: rung 1 → 2)

**What.** This is a thin two-endpoint hazard service over `ref_wildfire_zones` (the digital-twin grid built from real GWIS FWI data): `GET /status` reports grid-wide stats (row_count, global_mean_fwi_proxy, max_fwi_proxy, risk_level_counts, a `scenario` key) and `GET /point` does a coordinate lookup — which the lineage trace shows **failing with db-empty provenance** at trace time. Evolution A hardens the point lookup and makes the `scenario` dimension already present in the status payload actually queryable per point.

**How.** (1) `/point` gains nearest-cell fallback with reported `distance_km` and `resolution_tier` instead of returning None between cells (the geometry-type transaction-poisoning bug found during grid population shows this ingest path needs regression coverage too). (2) `/point` accepts a `scenario` parameter returning the FWI proxy under each stored scenario vintage, enabling what-if comparisons ("current vs 2050 FWI at this coordinate") — rung-2 scenario capability using data the grid already carries. (3) `/status` exposes ingest snapshot date alongside `data_source`.

**Prerequisites.** Confirm `ref_wildfire_zones` population in the target environment (memory: ~5,378 rows ingested 2026-07-05, post-dating the failing trace); verify which scenario vintages the ingest actually stored — do not expose scenario parameters the data cannot honour. **Acceptance:** `/point` for California chaparral vs coastal Norway returns different non-null FWI proxies; requesting an unstored scenario returns an explicit error listing available scenarios, not a silent default.

### 9.2 Evolution B — Wildfire exposure tool in the physical-risk tool belt (LLM tier 2)

**What.** A single-peril lookup service earns its LLM value as a *tool*, not a chat panel. Evolution B registers `/point` (with scenario parameter) in the platform tool registry so the Tier-2 physical-risk analyst and Tier-3 counterparty orchestrator can answer "which of these facilities sit in high-FWI zones, and how does that shift under the hot-house scenario?" by batch tool calls against the real grid — alongside the sibling earthquake, cyclone, flood, and sea-level services that share the digital-twin pattern.

**How.** Tool schema auto-generated from OpenAPI (read-only GETs, no confirmation gating); the tool description embeds the `/status` coverage note, `data_source`, and available scenarios so the LLM states coverage limits verbatim rather than interpolating. Answers tabulate per-asset FWI proxy and risk level with the `resolution_tier` from Evolution A's fallback, so "nearest cell 40 km away" is disclosed. The no-fabrication validator checks every FWI value and risk label against in-conversation tool outputs.

**Prerequisites.** Evolution A (nearest-cell fallback and scenario parameter) — without it the tool returns None for most coordinates and invites gap-filling; consistent response shape with the other four hazard point services so the orchestrator can treat them as one family. **Acceptance:** a multi-asset answer traces every FWI figure to a `/point` response; a no-coverage coordinate yields a disclosed gap, never an estimated risk level.