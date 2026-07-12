# Api::Spatial_Hazard
**Module ID:** `api::spatial_hazard` · **Route:** `/api/v1/spatial-hazard` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/spatial-hazard/profile` | `get_hazard_profile` | api/v1/routes/spatial_hazard.py |
| POST | `/api/v1/spatial-hazard/auto-populate` | `auto_populate_physical_inputs` | api/v1/routes/spatial_hazard.py |
| GET | `/api/v1/spatial-hazard/ref/countries` | `ref_supported_countries` | api/v1/routes/spatial_hazard.py |
| GET | `/api/v1/spatial-hazard/ref/schema` | `ref_hazard_schema` | api/v1/routes/spatial_hazard.py |
| GET | `/api/v1/spatial-hazard/ref/profiles` | `ref_country_profiles` | api/v1/routes/spatial_hazard.py |

### 2.3 Engine `spatial_hazard_service` (services/spatial_hazard_service.py)
| Function | Args | Purpose |
|---|---|---|
| `_latitude_modifier` | lat | Adjust hazard intensities based on latitude band. |
| `_estimate_coastal_km` | lat, lng, country | Rough coastal proximity (Phase 1 heuristic, Phase 2 uses coastline raster). |
| `SpatialHazardService.get_hazard_profile` | latitude, longitude, country | Fetch hazard profile for a location. Priority: coordinate-based lookup (Phase 2) > country profile > default. |
| `SpatialHazardService.auto_populate_physical_inputs` | latitude, longitude, country, user_overrides | Return dict compatible with CLVaR PhysicalInputs, with optional user overrides. User-provided values always take precedence over auto-populated values. |
| `SpatialHazardService.query_nearby_protected_areas` | latitude, longitude, radius_km | Phase 2: ST_DWithin query against dh_wdpa_protected_areas. SQL (when hazard raster tables available): SELECT wdpa_id, name, iucn_cat, desig_type, ST_Distance(location::geography, ST_MakePoint(:lng, :lat)::geography) / 1000 AS distance_km FROM dh_wdpa_protected_areas WHERE ST_DWithin(location::geography, ST_MakePoint(:lng, :lat)::geography, :radius_m) ORDER BY distance_km; Currently returns empty l |
| `SpatialHazardService.query_flood_zone_by_location` | latitude, longitude | Phase 2: ST_Intersects query against dh_flood_risk_extent. SQL (when flood raster tables available): SELECT zone_type, depth_100yr_m, return_period_yr FROM dh_flood_risk_extent WHERE ST_Intersects(geom, ST_MakePoint(:lng, :lat)::geography); |
| `SpatialHazardService.query_wildfire_proximity` | latitude, longitude | Phase 2: Nearest-distance query to wildfire zone polygons. |
| `SpatialHazardService.get_country_profiles` |  |  |
| `SpatialHazardService.get_supported_countries` |  |  |
| `SpatialHazardService.get_hazard_schema` |  | Describe available hazard fields and units. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `location`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/spatial-hazard/ref/countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/spatial-hazard/ref/profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['country_profiles'], 'n_keys': 1}`

**GET /api/v1/spatial-hazard/ref/schema** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['hazard_schema'], 'n_keys': 1}`

**POST /api/v1/spatial-hazard/auto-populate** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/spatial-hazard/profile** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/spatial-hazard` (`spatial_hazard_service.py`) is a **hazard-profile lookup service** for a
lat/lng + country, designed as the auto-population source for the CLVaR physical-risk inputs.
Its architecture is explicitly phased (docstring): **Phase 1 (current)** = deterministic
country-level hazard profiles with latitude modifiers; Phase 2 (planned) = PostGIS raster queries;
Phase 3 (planned) = external APIs (JBA flood, WRI Aqueduct, GFED wildfire).

```
profile          = COUNTRY_HAZARD_PROFILES[country]  (else _DEFAULT_PROFILE)
heat_days'       = heat_days × latitude heat multiplier
wildfire_km'     = wildfire_km / latitude wildfire multiplier   (closer = riskier)
water_stress'    = min(5, water_stress + latitude adder)
coastal_km'      = 5 km hard override for small island states (SG, MT, CY, MV, BH)
```

### 7.2 Parameterisation

**Country profiles** — 15 countries (GB, DE, NL, FR, ES, IT, US, AU, SG, IN, CN, BR, JP, AE, CA),
each with 10 hazard fields; sources cited in the header comment: *JRC PESETA IV, EEA, EA, WRI
Aqueduct, EM-DAT*. Representative rows:

| ISO | Flood zone | 100-yr depth | Heat days > 35 °C | Wildfire km | Water stress (0–5) | SLR 2050 cm | Cyclone |
|---|---|---|---|---|---|---|---|
| NL | 3a | 1.2 m | 5 | 100 | 2.5 | 35 | none (subsidence "high" — polders) |
| ES | 2 | 0.6 m | 25 | 15 | 3.5 | 30 | none |
| IN | 3a | 1.0 m | 60 | 50 | 4.2 | 35 | high |
| AE | 1 | 0.2 m | 120 | 200 | 4.8 | 35 | low |
| US | X (FEMA) | 0.3 m | 15 | 25 | 2.5 | 30 | moderate |

Unknown countries take `_DEFAULT_PROFILE` (flood zone 2, 0.5 m, 10 heat days, stress 2.0,
SLR 30 cm). Inline comments anchor several values to real events/geography ("post-2022/2023
heatwaves" FR, "Var, Gironde fires", "Venice, Po Delta" subsidence, "southern Spain severe
stress").

**Latitude modifiers** (`_latitude_modifier`): tropical <23.5° → heat ×1.5, cyclone ×1.3,
wildfire ×0.8; subtropical <35° → heat ×1.2, wildfire ×1.3, water-stress +0.5; temperate <55° →
neutral; sub-polar/polar → heat ×0.3, permafrost ×2.0, wildfire ×0.5. (The cyclone and permafrost
multipliers are computed but never applied — those fields are categorical strings.)

**Flood-zone vocabulary** mixes UK Environment Agency zones (1/2/3a/3b) and FEMA NFIP zones
(A/AE/V/X) per `get_hazard_schema()`; water stress uses the WRI Aqueduct 0–5 scale.

### 7.3 Calculation walkthrough

1. `POST /profile` → `get_hazard_profile(lat, lng, country)`: country lookup, then latitude
   modifiers if a latitude is supplied; when both coordinates are present, precision is upgraded
   from `country`/confidence `low` to `coordinate_adjusted`/`medium`, and the small-island coastal
   override may apply.
2. `POST /auto-populate` → `auto_populate_physical_inputs`: returns the CLVaR `PhysicalInputs`-
   compatible dict with `_meta {data_source, spatial_precision, confidence_band}`; caller
   overrides always win and flip `data_source` to `user_override`.
3. **Phase-2 stubs**: `query_nearby_protected_areas`, `query_flood_zone_by_location`,
   `query_wildfire_proximity` contain the intended PostGIS SQL in their docstrings but *return
   empty/None* — the live spatial joins are served by the separate `api::spatial` domain.
4. `GET /ref/countries`, `/ref/profiles`, `/ref/schema` expose the reference tables verbatim.

### 7.4 Worked example — Chennai, India (13.08 N, 80.27 E)

| Step | Computation | Result |
|---|---|---|
| Base profile (IN) | flood 3a / 1.0 m; heat 60 d; wildfire 50 km; stress 4.2; SLR 35 cm; cyclone high | — |
| Latitude band | \|13.08\| < 23.5 → tropical | heat ×1.5, wildfire ×0.8 |
| Heat days | int(60 × 1.5) | **90 days/yr** |
| Wildfire proximity | 50 / 0.8 | **62.5 km** (division moves it *farther*, i.e. lower tropical wildfire risk) |
| Water stress | 4.2 + 0 (no tropical adder) | 4.2 |
| Metadata | both coordinates present | `coordinate_adjusted`, confidence `medium`, source `country_profile_v1` |

Note the tropical `cyclone_multiplier 1.3` has no effect — `cyclone_exposure` stays the
categorical "high".

### 7.5 Data provenance & limitations

- **Deterministic reference data, no PRNG** — the header for the profile block says "Phase 1:
  deterministic reference data, upgradeable to spatial rasters". But the profiles are
  **country-average syntheses**, hand-authored to be directionally consistent with the cited
  sources (PESETA IV, WRI Aqueduct, EM-DAT) rather than extracted from them; every location in a
  country shares one profile. The service is honest about this via `spatial_precision: "country"`
  and `confidence_band: "low"`.
- Latitude adjustment is a coarse climate-band heuristic; longitude is unused except for the
  5-country island override. Two computed modifiers (cyclone, permafrost) are dead parameters.
- Phase-2/3 integrations (JBA, Aqueduct, GFED, `dh_wdpa_protected_areas`,
  `dh_flood_risk_extent`) are documented stubs returning empty results.
- Values have a fixed vintage (e.g. SLR-2050 centimetres, post-2023 heat-day counts) with no
  scenario dimension — a single implicit central pathway.

### 7.6 Framework alignment

- **IPCC AR6 WG2 Ch.4 Hazard–Exposure–Vulnerability framing** — cited as the conceptual model;
  this service supplies the *hazard* leg only, for downstream CLVaR exposure/vulnerability maths.
- **UK EA flood zones** (1/2/3a/3b: <0.1 %, 0.1–1 %, >1 % annual fluvial probability, functional
  floodplain) and **FEMA NFIP zones** (A/AE 1 % zones, V coastal wave action, X minimal) — both
  vocabularies are supported in the schema; profiles assign a single national modal zone.
- **WRI Aqueduct** — the 0–5 baseline water-stress scale is adopted directly (e.g. AE 4.8
  "extremely high" matches Aqueduct's Gulf classification).
- **JRC PESETA IV / EEA / EM-DAT** — named as calibration sources for European flood depths,
  heat-day counts and disaster exposure.
- **TCFD / ISSB IFRS S2 physical-risk disclosure** — auto-populated, provenance-tagged hazard
  inputs (with user-override precedence) support the auditability expected of disclosure-grade
  physical-risk inputs.

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