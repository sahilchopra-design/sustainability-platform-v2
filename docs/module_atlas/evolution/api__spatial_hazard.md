## 9 · Future Evolution

### 9.1 Evolution A — Execute the module's own Phase 2: grid-resolved hazard profiles (analytics ladder: rung 1 → 3)

**What.** A hazard-profile lookup service (`spatial_hazard_service.py`) for lat/lng + country,
built as the auto-population source for CLVaR physical-risk inputs. Its docstring is explicitly
phased: **Phase 1 (current)** = 15 hand-curated country profiles (sources cited: JRC PESETA IV,
EEA, WRI Aqueduct, EM-DAT) with latitude modifiers (`heat_days × lat multiplier`,
`wildfire_km / lat multiplier`, a 5km coastal override for small island states); Phase 2 (planned)
= PostGIS raster queries; Phase 3 = external APIs. Both POST endpoints trace `skipped` under the
harness. Evolution A is simply: ship the module's own Phase 2, which the platform can now support.

**How.** (1) Route `/profile` through the digital-twin PostGIS layers via the sibling `spatial`
module (`ref_flood_zones`, `ref_wildfire_zones`, `ref_sea_level_zones`) so a coordinate returns
zone-resolved flood depth, FWI, and SLR instead of a country constant with a latitude tweak —
reporting `resolution_tier` (grid vs country-profile fallback), mirroring the GLEIF pattern. (2)
Extend beyond the 15 profiled countries with a documented default and honest tier label. (3) Keep
`auto-populate` as the CLVaR bridge but pass the resolution tier through so downstream CLVaR
outputs disclose their input fidelity. (4) Bench-pin the profile lookup and modifiers.

**Prerequisites.** The `spatial` module's layers loaded (its Evolution A — flood/sea-level are
thin); the two POST endpoints confirmed callable. **Acceptance:** two coordinates in the same
country return different hazard values where grids differ, each tagged `resolution_tier`;
non-profiled countries return the documented default with an honest tier; CLVaR receives the tier;
POSTs return `passed`.

### 9.2 Evolution B — Hazard auto-population explained in the CLVaR workflow (LLM tier 1 → 2)

**What.** This module's LLM role is inside the physical-risk workflow: when the CLVaR copilot
auto-populates inputs, this service is the tool that answers "where did these flood-depth and
heat-day numbers come from?" — the copilot narrates the profile source (country table + latitude
modifier, or grid cell post-Evolution-A) and its citations (JRC PESETA IV, WRI Aqueduct).

**How.** Tier 1 grounds on the three reference GETs (`/ref/countries`, `/ref/schema`,
`/ref/profiles`) — the copilot explains coverage and the hazard schema without new backend. Tier 2
registers `/profile` and `/auto-populate` as tools so the CLVaR and valuation copilots resolve
hazard inputs through it, with the `resolution_tier` always surfaced in the narration. A supporting
leaf-tool in the tier-3 physical-risk chain rather than a standalone copilot.

**Prerequisites.** POST endpoints callable; Evolution A for grid-resolved answers — until then the
copilot must present profiles as country-level estimates with latitude adjustments, exactly as the
Phase-1 docstring frames them. **Acceptance:** every hazard value a consuming copilot cites traces
to a `/profile` response with its resolution tier and source citation; coordinates in non-profiled
countries are narrated as default-profile estimates, never as measured hazard.
