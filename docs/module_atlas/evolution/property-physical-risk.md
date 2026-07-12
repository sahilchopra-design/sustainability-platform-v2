## 9 · Future Evolution

### 9.1 Evolution A — Digital-twin hazard resolution and hazard-specific damage functions (analytics ladder: rung 2 → 3)

**What.** The module is a genuine multi-peril exposure calculator (SSP × horizon scaling, adaptation reductions, composite → premium/VaR), but §7.5 lists physical wrongness it should shed: hazard scores are inherited from a synthetic upstream portfolio (no live raster), the "VaR" is a flat `hazard% × GAV × 15%` scalar, and SSP/horizon multipliers scale flood and heat identically — "physically wrong (heat rises faster)". Evolution A grounds it in the platform's own Physical Risk Digital Twin: per-coordinate lookups against the five populated `ref_*_zones` PostGIS grids (earthquake/cyclone/wildfire/flood/sea-level), and per-hazard scenario response curves replacing the flat multipliers.

**How.** (1) Property enrichment calls the existing `global_physical_risk_engine` composite-scoring endpoint with each asset's lat/lon, replacing `localStorage` hazard inheritance; `resolution_tier` reported per the GLEIF-style cascade, and the in-page `sr()` resilience fallback retired for an honest null. (2) Per-hazard SSP multiplier table (heat scaling steeper than flood, sea-level horizon-dependent) documented with IPCC AR6 basis and served via a `ref/` endpoint. (3) The 15% anchor becomes per-peril damage ratios at score bands — still deterministic, but peril-differentiated and cited; label changes from "VaR" to "expected damage proxy" until a loss distribution exists.

**Prerequisites.** Flood/sea-level grids upgraded from sparse coverage (48/152 rows today per platform state) or coarse-tier flagging where empty; CRREM-module portfolio handshake preserved. **Acceptance:** two properties in different hazard zones produce different composites from coordinates alone; heat and flood scores diverge across SSPs per the documented curves.

### 9.2 Evolution B — Portfolio risk-review copilot with adaptation what-ifs (LLM tier 2)

**What.** A copilot for RE managers and lenders working the capex-prioritisation question this module already frames: "which five assets drive our climate-adjusted premium, and what's the cheapest adaptation package that moves them out of the high tier?" — answered by reading the enriched portfolio and running the module's own adaptation mechanics (9 `ADAPTATION_MEASURES` with cost and risk-reduction %, payback = cost / annual premium saving) as tool-called what-ifs rather than narrative guesses.

**How.** After Evolution A moves computation server-side, expose `POST /portfolio-risk` and `POST /adaptation-scenario`; tier-2 tool schemas from those operations. System prompt embeds §7.5's caveats — the copilot must distinguish the expected-damage proxy from a percentile VaR when lenders ask, and must not answer CRREM/stranding questions (the §7 flag notes that methodology lives in `/crrem`; the copilot routes there instead, using the atlas interconnection data). Adaptation recommendations ranked strictly by computed payback, each citing its measure row.

**Prerequisites.** Evolution A endpoints; digital-twin coverage tiers surfaced so the copilot can caveat coarse-resolution assets. **Acceptance:** every premium and payback figure traces to a tool call; a stranding-year question receives a redirect to the CRREM module, not an invented year.
