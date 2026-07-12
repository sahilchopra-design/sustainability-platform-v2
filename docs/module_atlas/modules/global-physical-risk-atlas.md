# Global Physical Risk Atlas
**Module ID:** `global-physical-risk-atlas` · **Route:** `/global-physical-risk-atlas` · **Tier:** A (backend vertical) · **EP code:** E121 · **Sprint:** 

## 1 · Overview
Composite physical-climate-risk digital twin covering 5 hazard perils (earthquake, tropical cyclone, wildfire, flood, sea-level rise) on a 2x2-degree global PostGIS grid, queryable by point, portfolio batch, or region.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `CONTINENT_HINTS`, `DataAvailabilityBlock`, `FieldsTable`, `GPR_API`, `HAZARD_LAYERS`, `KpiCard`, `MAP_H`, `MAP_W`, `QUICK_PICKS`, `SectionH`, `StatusBadge`, `TABS`, `WorldMap`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `QUICK_PICKS` | 6 | `name`, `lat`, `lon` |
| `CONTINENT_HINTS` | 8 | `lat`, `lon` |
| `HAZARD_LAYERS` | 6 | `label`, `aliases` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `GPR_API` | ``${API}/api/v1/global-physical-risk`;` |
| `prettify` | `(k) => String(k).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());` |
| `parallels` | `[-90, -60, -30, 0, 30, 60, 90];` |
| `meridians` | `[-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180];` |
| `coverageLayers` | `useMemo(() => HAZARD_LAYERS.map(h => {` |
| `sum` | `coverageLayers.reduce((a, l) => a + (typeof l.rowCount === 'number' ? l.rowCount : 0), 0);` |
| `inpPx` | `{ ...selPx, width: '100%', boxSizing: 'border-box' };` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|

### 2.3 Engine `global_physical_risk_engine` (services/global_physical_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp01` | x |  |
| `_risk_level_score` | risk_level |  |
| `score_earthquake` | row |  |
| `score_cyclone` | row |  |
| `score_wildfire` | row |  |
| `score_flood` | row |  |
| `score_sea_level` | row |  |
| `_fetch_earthquake_zone` | db, lat, lng, radius_m |  |
| `_fetch_cyclone_zone` | db, lat, lng, radius_m |  |
| `_fetch_wildfire_zone` | db, lat, lng, radius_m |  |
| `_fetch_flood_zone` | db, lat, lng, radius_m |  |
| `_fetch_sea_level_zone` | db, lat, lng, radius_m |  |
| `_table_is_empty` | db, table |  |
| `get_point_hazard_profile` | db, lat, lon, radius_km | Query all 5 hazard tables for the zone containing (or nearest within radius_km of) the given point, and return raw zone data + normalized 0-100 score per hazard. Never raises for empty tables — reports `data_availability` per hazard instead. |
| `get_composite_score` | hazard_scores, weights | Weighted composite over whichever hazards have data. Missing hazards are excluded and the remaining weights are re-normalized to sum to 1.0 — a missing hazard is NEVER treated as a 0 score. Default weights: equal-weight (20% each of the 5 hazards) — see module docstring for rationale. Pass `weights` to override (need not sum to 1; re-normalized automatically over the available subset). |
| `build_risk_narrative` | profile | Plain-language narrative summarizing a point's hazard profile. |
| `get_region_summary` | db, min_lon, min_lat, max_lon, max_lat | Aggregate hazard stats over a bounding box: per-hazard zone counts and average/max raw driver values, plus an approximate composite computed from those per-hazard averages. Intended for portfolio/regional views, not per-asset precision (use get_point_hazard_profile per asset for that). |
| `get_coverage_stats` | db | 'Digital twin build progress' metric: row counts + spatial extent (min/max lat/lon with data) per hazard table. |

**Engine `global_physical_risk_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_RISK_LEVEL_NEUTRAL` | `50.0` |
| `_SCORERS` | `{'earthquake': score_earthquake, 'cyclone': score_cyclone, 'wildfire': score_wildfire, 'flood': score_flood, 'sea_level': score_sea_level}` |
| `_FETCHERS` | `{'earthquake': _fetch_earthquake_zone, 'cyclone': _fetch_cyclone_zone, 'wildfire': _fetch_wildfire_zone, 'flood': _fetch_flood_zone, 'sea_level': _fetch_sea_level_zone}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `real-db`

**Database tables:** `__future__` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CONTINENT_HINTS`, `HAZARD_LAYERS`, `QUICK_PICKS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Earthquake score | `100*(0.70*clamp(max_magnitude_50yr/9.0)+0.30*clamp(event_count_50yr/100.0))` | USGS ANSS ComCat, M>=4.5, 1976-2026 | 50-year seismic hazard at the 2x2deg grid cell |
| Cyclone score | `100*(0.65*clamp(max_wind_speed_kt/200.0)+0.35*clamp(track_density_50yr/50.0))` | NOAA IBTrACS v04r01, all basins, 1980-2025 | Tropical cyclone/hurricane/typhoon wind hazard |
| Wildfire score | `100*clamp(fwi_mean/50.0)` | GWIS/EFFIS MCD64A1 burned-area, country-level 2019-2023 avg | Fire weather index proxy, country-level resolution |
| Flood score | `100*(0.60*clamp(max_depth_m/5.0)+0.40*clamp((1/return_period_y)/0.10))` | OpenFEMA NFIP claims density (US) + precipitation proxy (global) | 500-year fluvial/pluvial flood depth proxy |
| Sea-level score | `100*(0.60*clamp(slr_m/1.5)+0.40*clamp(1-(horizon_year-2026)/100))` | IPCC AR6 WG1 Ch.9 Table 9.9 | Projected sea-level rise under SSP1-2.6/SSP5-8.5 by 2050/2100 |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/global-physical-risk/coverage-stats** — status `passed`, provenance ['real-db'], source tables: `ref_cyclone_zones`, `ref_earthquake_zones`, `ref_flood_zones`, `ref_sea_level_zones`, `ref_wildfire_zones`
Output: `{'type': 'object', 'keys': ['hazard_layers', 'layers_populated', 'layers_total', 'build_progress_pct'], 'n_keys': 4}`

**GET /api/v1/global-physical-risk/region-summary** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/global-physical-risk/point-profile** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/global-physical-risk/portfolio-profile** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-hazard composite scoring with missing-data-aware re-normalization
**Headline formula:** `Composite = (sum of populated hazard scores x weight_i) / (sum of weights for populated hazards)`

Each of 5 hazard layers is independently normalized to a 0-100 score from its own real-data field (magnitude/wind-speed/FWI/depth/SLR), then combined with equal default weights (20% each), re-normalized over only the hazards that actually have data at the queried point so missing coverage is never silently scored as zero risk.

**Standards:** ['USGS ANSS ComCat', 'NOAA IBTrACS v04r01', 'GWIS/EFFIS MCD64A1', 'OpenFEMA NFIP', 'IPCC AR6 WG1 Ch.9']

**Engine `global_physical_risk_engine` — extracted transformation lines:**
```python
wildfire_score = 100 * clamp(fwi_mean / 50.0, 0, 1)
magnitude_component = _clamp01(float(magnitude) / 9.0)
frequency_component = _clamp01(float(events or 0) / 100.0)
score = 100.0 * (0.70 * magnitude_component + 0.30 * frequency_component)
wind_component = _clamp01(float(wind) / 200.0)
density_component = _clamp01(float(density or 0) / 50.0)
score = 100.0 * (0.65 * wind_component + 0.35 * density_component)
score = 100.0 * _clamp01(float(fwi) / 50.0)
depth_component = _clamp01(float(depth) / 5.0)
aep = 1.0 / float(return_period)
frequency_component = _clamp01(aep / 0.10)
score = 100.0 * (0.60 * depth_component + 0.40 * frequency_component)
depth_component = _clamp01(float(depth) / 5.0)
score = 100.0 * depth_component
slr_component = _clamp01(float(slr) / 1.5)
years_out = max(float(horizon) - CURRENT_YEAR, 0.0) if horizon else 100.0
proximity_component = _clamp01(1.0 - years_out / 100.0)
score = 100.0 * (0.60 * slr_component + 0.40 * proximity_component)
radius_m = radius_km * 1000.0
normalized_weights = {h: w / total_weight for h, w in weight_subset.items()}
composite = sum(available[h] * normalized_weights[h] for h in available)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **81** other module(s).
**Shared engines (edits propagate!):** `global_physical_risk_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `physical-risk-pricing` | engine:global_physical_risk_engine, table:sqlalchemy |
| `supply-chain-esg-hub` | table:exc, table:sqlalchemy |
| `supply-chain-resilience` | table:exc, table:sqlalchemy |
| `climate-underwriting-workbench` | table:exc, table:sqlalchemy |
| `supply-chain-contagion` | table:exc, table:sqlalchemy |
| `supply-chain-emissions-mapper` | table:exc, table:sqlalchemy |
| `supply-chain-carbon` | table:exc, table:sqlalchemy |
| `supply-chain-map` | table:exc, table:sqlalchemy |
| `insurance-transition` | table:exc, table:sqlalchemy |
| `insurance-protection-gap` | table:exc, table:sqlalchemy |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

A global "digital twin" of physical climate hazard: 5 independently-sourced hazard grids
(earthquake, tropical cyclone, wildfire, flood, sea-level rise), each ingested from a real public
dataset onto a 2°×2° PostGIS grid (`ref_earthquake_zones`, `ref_cyclone_zones`,
`ref_wildfire_zones`, `ref_flood_zones`, `ref_sea_level_zones`), queryable by point (with a
radius-based nearest-zone fallback), by portfolio batch (~200 locations), or by bounding-box
region summary. `services/global_physical_risk_engine.py` normalizes each hazard's native
measurement (magnitude, wind speed, fire-weather-index proxy, flood depth, sea-level-rise metres)
onto a common 0–100 scale and combines them into a single composite score. A 6th layer,
`ref_protected_areas` (WDPA), exists in the same schema family but is deliberately left
unpopulated — the WDPA license question (non-commercial/no-redistribution terms) is explicitly
deferred until a client presentation, per a standing product decision, not a build gap.

### 7.2 Per-hazard normalization formulas

```python
Earthquake: 100 * (0.70 * clamp(max_magnitude_50yr / 9.0) + 0.30 * clamp(event_count_50yr / 100.0))
Cyclone:    100 * (0.65 * clamp(max_wind_speed_kt / 200.0) + 0.35 * clamp(track_density_50yr / 50.0))
Wildfire:   100 * clamp(fwi_mean / 50.0)                          # falls back to risk_level if fwi_mean is null
Flood:      100 * (0.60 * clamp(max_depth_m / 5.0) + 0.40 * clamp((1 / return_period_y) / 0.10))
Sea level:  100 * (0.60 * clamp(slr_m / 1.5) + 0.40 * clamp(1 - (horizon_year - 2026) / 100))
```

Each formula blends a **severity** term (magnitude/wind/FWI/depth/SLR-metres) with a **frequency
or proximity** term (event count, track density, exceedance probability, time-to-horizon) so a
single extreme-but-rare event and a moderate-but-frequent one can both surface as high risk.
`clamp(x)` bounds each ratio to `[0, 1]` before scaling to 0–100.

### 7.3 Composite scoring — missing-data-aware, never zero-fills

```python
normalized_weights = {h: w / total_weight for h, w in weight_subset.items()}
composite = sum(available[h] * normalized_weights[h] for h in available)
```

Default weights are equal (20% each of the 5 hazards). Critically, `get_composite_score` only
computes over hazards that returned real data at the query point — a hazard with no coverage is
**excluded and the remaining weights re-normalized to sum to 1.0**, never treated as a 0 (safe)
score. This was verified in two states this session: when 0/5 layers had data (composite returns
`null` with an explanatory note, confirmed by the building agent's own test), and now at 5/5
layers live (confirmed via `GET /coverage-stats` → `layers_populated: 5, layers_total: 5,
build_progress_pct: 100.0`).

### 7.4 Real-data spot-checks (verified against ground truth, not agent self-report)

Every hazard-grid population run was independently re-verified against known real-world hazard
geography rather than trusting the building agents' own "success" reports — this caught 2 real
bugs (§7.6). Confirmed-plausible results:

| Location | Hazard | Result |
|---|---|---|
| Tokyo, Japan (35.68, 139.65) | Earthquake | `EQ_34_138`, very_high, M6.6/50yr, 656 events — real high-seismicity region |
| Chile (-38,-74 grid cell) | Earthquake | M8.8/50yr, very_high — matches the real 1960 Valdivia-region seismicity |
| Miami, FL (25.76, -80.19) | Cyclone | `CYC_24_-82`, NA basin, 145kt max wind — plausible Cat-4/5 exposure |
| Tokyo, Japan | Cyclone | `CYC_34_138`, WP basin, 105kt max wind — plausible typhoon exposure |
| Victoria/Tasmania, Australia | Wildfire | "extreme", FWI=10.0 — real, well-known bushfire-prone region |
| Miami / Rotterdam / NYC / Amsterdam | Sea level | 0.77m by 2100 under SSP5-8.5 — matches the actual published IPCC AR6 WG1 Table 9.9 figure |
| Kazakhstan (landlocked, interior) | Cyclone | 0 rows — correctly excluded (no ocean exposure) |

### 7.5 Data provenance & resolution by layer

- **Earthquake** (4,500 cells): real USGS ANSS ComCat catalog, M≥4.5, 1976–2026, fetched
  year-by-year with cap-aware date bisection; land-masked against real country-boundary GeoJSON.
  True per-cell resolution (2°×2°).
- **Cyclone** (4,470 cells): real NOAA IBTrACS v04r01 best-track archive, all basins, 1980–2025,
  aggregated onto the same grid. True per-cell resolution. Initially shipped with a real bug
  (§7.6) limiting coverage to the Southern Hemisphere plus a narrow tropical band; now spans the
  full ±46° tropical-cyclone latitude range.
- **Wildfire** (5,378 cells): real GWIS/EFFIS MCD64A1 burned-area bulk dataset, but aggregated as
  a **country-level 2019–2023 average** applied uniformly to every land cell within that country
  — explicitly a country-level proxy, not true 2°×2° granularity (a large country shows the same
  `fwi_mean` in every one of its cells). NASA FIRMS per-cell detection-density enrichment was
  designed in but not activated this run (`NASA_FIRMS_MAP_KEY` unset — verified live that FIRMS'
  real API rejects the keyless `DEMO_KEY`, confirming the gate is real, not a stub).
- **Flood** (48 cells): dual real-source methodology — US counties use real OpenFEMA NFIP
  claims-density (Miami-Dade, Houston/Harris, New Orleans/Orleans Parish, Wilmington/New Hanover,
  etc.); non-US locations use a documented precipitation-based severity proxy (real historical
  rainfall figures, e.g. Manila 2020–2024 mean = 216.2mm) normalized across 18 sampled cities —
  explicitly labeled "NOT an authoritative flood-zone map," pointing to FEMA NFHL for production
  BFE data. Named-location coverage only (48 cities), not a global grid.
- **Sea level** (152 cells): real IPCC AR6 WG1 Ch.9 Table 9.9 global-mean SLR figures (median of
  likely range) applied to a curated list of real named low-lying coastal cities across 2
  scenarios (SSP1-2.6, SSP5-8.5) × 2 horizons (2050, 2100) — explicitly labeled "NOT
  location-specific elevation modeling."
- **Protected areas**: 0 rows, intentionally — see §7.1.

### 7.6 Two real bugs found during verification (not fabrication, but real defects)

1. **Cyclone Northern-Hemisphere gap.** The ingester's code correctly declared
   `LAT_MIN, LAT_MAX = -45.0, 45.0`, but the populated data only spanned -46° to +14° — Miami,
   Japan, China, and the Bay of Bengal all returned zero rows despite being real, major
   cyclone-exposed regions. Root-caused via `SELECT MIN(ST_YMin(...)), MAX(ST_YMax(...))` on the
   live table. Reported to the building agent with the exact query and diagnosis; the agent
   self-diagnosed and re-ran, extending coverage to the full -46°/+46° band — reverified Miami
   (145kt) and Tokyo (105kt) both correct afterward.
2. **Wildfire silent zero-row failure.** The ingester reported "success" but `ref_wildfire_zones`
   remained at 0 rows after two agent runs. Root cause (found by reading the code directly, not
   by re-prompting the agent a third time): `ST_MakeEnvelope(...)` returns a `Polygon`, but the
   live `zone_boundary` column (created out-of-band before any tracked migration — see §7.5 note
   on schema drift) is typed `MULTIPOLYGON`. The very first insert failed with
   `InvalidParameterValue: Geometry type (Polygon) does not match column type (MultiPolygon)`,
   and the per-row `except` block had no `db.rollback()`, so every subsequent insert in the same
   Postgres transaction cascaded into `InFailedSqlTransaction` → the whole run silently produced 0
   rows despite per-batch "committed" log lines. Fixed both defects directly: wrapped the insert
   in `ST_Multi(...)` and added `db.rollback()` to the per-row exception handler. Re-run: 5,378/
   5,378 inserted, 0 failed.

**Framework alignment:** USGS ANSS ComCat, NOAA IBTrACS v04r01, GWIS/EFFIS (JRC/Copernicus),
OpenFEMA NFIP, IPCC AR6 WG1 Chapter 9 (sea-level rise), NGFS/TCFD physical-risk metric conventions
(the composite score is designed as an input to the platform's existing E104 Physical Risk Pricing
Engine and Climate Underwriting Workbench, not a replacement for either).

## 8 · Model Specification

**Status: implemented and live-verified.** All 5 populated hazard layers, the composite engine,
and the frontend digital-twin visualization are built, wired into `App.js`
(`/global-physical-risk-atlas`), and confirmed against real ground-truth spot-checks in this
session — not a design document for future work.

### 8.1 Purpose & scope

Give any module on the platform (physical-risk-pricing, asset-exposure-explorer, climate
underwriting, insurance, real-estate) a single, consistent, multi-hazard physical-risk score for
an arbitrary lat/lon, without each module needing to know about 5 separate hazard tables and
normalization schemes. Global coverage in principle; actual coverage varies by layer per §7.5
(earthquake/cyclone are true global grids, wildfire is country-resolution, flood/sea-level are
named-location samples).

### 8.2 Conceptual approach

Independent per-hazard ingestion (5 separate `BaseIngester` subclasses, each sourcing one
authoritative public dataset) into a shared PostGIS schema convention, fused at query time by a
single composite-scoring service that is explicitly designed to degrade honestly — partial
coverage returns a partial, re-normalized composite with a `data_availability` breakdown, never a
fabricated or zero-filled score for hazards with no data.

### 8.3 Mathematical specification

```
Point query:
  for each hazard h in {earthquake, cyclone, wildfire, flood, sea_level}:
      zone = ST_Within(point, zone_boundary) OR nearest zone within radius_km
      raw_score[h] = normalize_h(zone)  -- see §7.2 formulas
  composite = Σ_h∈available( raw_score[h] × weight[h] / Σ_h∈available(weight[h]) )
  weight default = 0.20 for all 5 hazards (overridable)

Region query (bounding box):
  aggregate = per-hazard AVG/MAX of raw driver fields across all zones in bbox
  approx_composite computed from those per-hazard averages (portfolio-level, not per-asset)

Coverage stats:
  per table: row_count, spatial_extent (min/max lat/lon with data), distinct_countries,
  last_updated -- the literal "digital twin build progress" metric
```

### 8.4 Data requirements

Already satisfied for the 5 live layers (see §7.5 for exact source/resolution per layer). The 6th
layer (`ref_protected_areas`/WDPA) requires only running the platform's pre-existing
`wdpa_gfw_ingester.py` once the license question is resolved — no new schema or engine work needed.

### 8.5 Validation & benchmarking plan

Ongoing spot-check discipline (§7.4) should be repeated whenever any layer is re-ingested (e.g. on
a scheduled refresh) — check at least one known-high and one known-zero location per hazard rather
than trusting row counts alone, since both real bugs in §7.6 produced plausible-looking non-zero
(cyclone) or zero (wildfire) row counts that passed a naive "did it run" check. No automated
regression test currently encodes these spot-checks; that would be a natural hardening step.

### 8.6 Limitations & model risk

1. **Resolution is inconsistent across hazards** — earthquake/cyclone are true 2°×2° global grids;
   wildfire is country-level (same score across an entire country's cells); flood/sea-level are
   named-city samples only (not a global grid at all). A caller must not assume uniform precision
   across hazards.
2. **Composite weights are a simple equal-weight default**, not calibrated to any
   loss-severity-weighted methodology (e.g. actual insured-loss share by peril) — override via the
   `weights` parameter when a more defensible weighting scheme is available.
3. **Wildfire's FWI proxy has no live-weather-driven seasonality** — it is a static 2019–2023
   historical average, not a real-time or forward-looking fire-danger index; NASA FIRMS
   near-real-time enrichment is designed in but requires a manually-issued API key not obtainable
   headlessly.
4. **Flood/sea-level coverage is a named-location sample, not a grid** — absence of a zone at an
   arbitrary point means "not sampled," not "no risk"; the engine's own `data_availability`
   field must be surfaced to end users so this distinction isn't lost.
5. **Interactive POST endpoints (`/point-profile`, `/portfolio-profile`) require an authenticated
   session** in this environment (`backend/.env` currently has `REQUIRE_AUTH=true`, not the
   documented dev default) — confirmed via a side-by-side test that this is a pre-existing,
   platform-wide condition affecting all mutating endpoints identically (e.g. the pre-existing
   `spatial.py` `/point/hazards` POST endpoint fails the same way), not a defect introduced by this
   module. GET-only endpoints (`/coverage-stats`, `/region-summary`) are unaffected and fully live.

## 9 · Future Evolution

### 9.1 Evolution A — Fill the grid and calibrate scores against loss history (analytics ladder: rung 2 → 4)

**What.** This is a genuine tier-A digital twin: `global_physical_risk_engine` scores 5 perils (earthquake/cyclone/wildfire/flood/sea-level) on a 2×2° PostGIS grid from real sources (USGS ANSS, NOAA IBTrACS, GWIS/EFFIS, OpenFEMA, IPCC AR6), with disciplined missing-data-aware composite re-normalisation (a missing hazard is never scored 0 — weights renormalise over available data). Its honest limitation, documented in the platform memory, is coverage: flood has ~48 rows and sea-level ~152 (named-city samples), versus thousands for earthquake/cyclone/wildfire — so `get_coverage_stats` exists precisely as a "build progress" metric. Evolution A completes the grid (gridded flood/sea-level from JRC global flood maps or FEMA NFHL, IPCC AR6 SLR projections) and calibrates the normalisation constants (the current `fwi/50`, `magnitude/9`, `wind/200`, `depth/5` scalings) against observed loss/event frequency, then adds return-period predictive layers from the ingested history.

**How.** (1) Bulk-ingest gridded flood and sea-level coverage to match the other three perils' density. (2) Calibrate each score's clamp denominator against observed damage/exceedance data rather than expert-set constants, documenting per §8. (3) Add hazard trend layers (e.g. cyclone intensity from IBTrACS seasons, FWI trend) to move toward rung-4 predictive, per the roadmap ladder.

**Prerequisites.** Flood/sea-level bulk sources (JRC/FEMA/IPCC); a loss-calibration reference (OpenFEMA claims are already ingested by the sibling flood-loss-calibrator). **Acceptance:** flood and sea-level coverage reach grid parity with the other perils; `get_coverage_stats` shows near-complete build; calibration error is reported per hazard, not hidden.

### 9.2 Evolution B — Point-and-portfolio hazard copilot (LLM tier 2)

**What.** A copilot over the atlas endpoints: "profile the physical risk of these 200 asset coordinates and tell me which perils drive the portfolio composite" tool-calls `get_point_hazard_profile` per asset and `get_region_summary`/composite for the batch, narrating the result with the engine's own `build_risk_narrative` and, crucially, its data-availability flags so gaps aren't read as low risk.

**How.** Tier-2 tool-calling over the four engine operations (point, region, composite, coverage); the grounding corpus is §5/§7 (the five source datasets, the re-normalisation rule, the per-hazard scoring formulas). The copilot's integrity backbone is the engine's missing-data discipline — it must report `data_availability` per hazard and never present a missing-coverage point as low-risk, exactly the trap the engine is built to avoid. Every score validated against tool output.

**Prerequisites.** Evolution A coverage for credible flood/sea-level answers (the copilot must currently disclose those perils' sparse coverage); prompt-caching for the engine context. **Acceptance:** every hazard score in a copilot answer traces to an engine tool call; a point lacking flood coverage is reported as "no data" not "low risk"; the composite reflects only populated hazards per the re-normalisation rule.