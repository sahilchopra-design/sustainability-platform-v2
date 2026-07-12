# Api::Nature_Data
**Module ID:** `api::nature_data` · **Route:** `/api/v1/nature-data` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/nature-data/wdpa` | `search_wdpa` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/wdpa/countries` | `wdpa_countries` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/wdpa/nearby` | `wdpa_nearby` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/wdpa/{wdpa_id}` | `get_wdpa_by_id` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/gfw` | `search_gfw` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/gfw/countries` | `gfw_countries` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/gfw/{iso3}` | `gfw_country_timeseries` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/overlaps` | `nature_overlaps` | api/v1/routes/nature_data.py |
| GET | `/api/v1/nature-data/stats` | `nature_data_stats` | api/v1/routes/nature_data.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `dh_gfw_tree_cover_loss`, `dh_nature_spatial_overlaps`, `dh_wdpa_protected_areas`, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/nature-data/gfw** — status `passed`, provenance ['real-db'], source tables: `dh_gfw_tree_cover_loss`
Output: `{'type': 'object', 'keys': ['records', 'total'], 'n_keys': 2}`

**GET /api/v1/nature-data/gfw/countries** — status `passed`, provenance ['db-empty'], source tables: `dh_gfw_tree_cover_loss`
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/nature-data/gfw/{iso3}** — status `failed`, provenance ['db-empty'], source tables: `dh_gfw_tree_cover_loss`
Output: `None`

**GET /api/v1/nature-data/overlaps** — status `passed`, provenance ['db-empty'], source tables: `dh_nature_spatial_overlaps`
Output: `{'type': 'object', 'keys': ['overlaps', 'total'], 'n_keys': 2}`

**GET /api/v1/nature-data/stats** — status `passed`, provenance ['real-db'], source tables: `dh_gfw_tree_cover_loss`, `dh_nature_spatial_overlaps`, `dh_wdpa_protected_areas`
Output: `{'type': 'object', 'keys': ['wdpa', 'gfw', 'overlaps'], 'n_keys': 3}`

**GET /api/v1/nature-data/wdpa** — status `passed`, provenance ['real-db'], source tables: `dh_wdpa_protected_areas`
Output: `{'type': 'object', 'keys': ['records', 'total'], 'n_keys': 2}`

**GET /api/v1/nature-data/wdpa/countries** — status `passed`, provenance ['db-empty'], source tables: `dh_wdpa_protected_areas`
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/nature-data/wdpa/nearby** — status `failed`, provenance ['db-empty'], source tables: `dh_wdpa_protected_areas`
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. There is **no quant engine** — `api/v1/routes/nature_data.py` is a read-only spatial-data query API over three ingested reference tables. This deep dive documents its data semantics and the one geometric computation it performs.)*

### 7.1 What the module serves

A location-and-biodiversity data layer backing nature-risk screening, over three database tables (all `viewer`-role gated, read-only):

| Table | Content | Endpoints |
|---|---|---|
| `dh_wdpa_protected_areas` | WDPA protected-area registry (name, country, IUCN category, designation, marine flag, reported/GIS area km², status, lat/lng) | `GET /wdpa`, `/wdpa/{wdpa_id}`, `/wdpa/countries`, `/wdpa/nearby` |
| `dh_gfw_tree_cover_loss` | Global Forest Watch annual tree-cover loss (loss ha, extent ha, primary-forest loss, CO₂ emissions Mt, driver category, canopy threshold %) | `GET /gfw`, `/gfw/{iso3}`, `/gfw/countries` |
| `dh_nature_spatial_overlaps` | Precomputed asset↔protected-area overlaps (overlap km²/%, distance km, GFW loss, method) | `GET /overlaps` |
| — | Summary counts across all three | `GET /stats` |

### 7.2 Data model / parameterisation

No scoring weights, thresholds or model constants exist in this module. The only "parameters" are query filters (country ISO3, IUCN category, designation status, name search, year range, radius) and pagination bounds (WDPA limit ≤ 500, GFW limit ≤ 1000, nearby radius 1–500 km). All served fields are stored attributes of the ingested public datasets, not computed by this API.

### 7.3 Calculation walkthrough — the one computed quantity

`GET /wdpa/nearby` performs a **haversine great-circle distance** in raw SQL (the file comment notes "No PostGIS required"):

```sql
distance_km = 6371 × acos( LEAST(1.0,
    cos(lat)·cos(pa_lat)·cos(pa_lng − lng) + sin(lat)·sin(pa_lat) ))
```

with all angles in radians and 6371 km as the Earth radius. The `LEAST(1.0, …)` guard clamps the cosine argument to prevent `acos` domain errors from floating-point rounding when the point coincides with a protected area. Results are filtered to `distance_km ≤ radius` and ordered ascending. Every other endpoint is a filtered SELECT with COUNT for pagination totals; `/wdpa/countries` and `/gfw/countries` aggregate counts and summed areas/losses by country; `/stats` returns five COUNT/COUNT-DISTINCT scalars.

### 7.4 Worked example — nearby protected areas

A facility at (lat 0.0, lng 37.0) — central Kenya — queried with radius 50 km. For a protected area at (0.3, 37.1):

```
Δ = acos( cos(0)·cos(0.3°)·cos(37.1°−37.0°) + sin(0)·sin(0.3°) )
  = acos( cos(0.3°)·cos(0.1°) )  ≈ acos(0.99998) ≈ 0.00497 rad
distance = 6371 × 0.00497 ≈ 31.6 km   →  within 50 km, returned
```

A protected area at (1.0, 38.0) resolves to ≈ 157 km and is excluded. The endpoint returns matching areas sorted nearest-first with their WDPA id, IUCN category and reported area — the spatial primitive behind "is this asset near a protected area?" nature-risk questions.

### 7.5 Data provenance & limitations

- **No PRNG, no synthetic data** — everything is real ingested public data (WDPA from Protected Planet, GFW/Global Forest Watch tree-cover-loss, and a precomputed overlaps table); this module never fabricates.
- Distance is **point-to-point** using stored centroid lat/lng, not polygon-boundary distance — a large protected area whose centroid is 60 km away may still physically abut the facility; true containment/edge distance requires the geometry the precomputed `dh_nature_spatial_overlaps` table supplies (via whatever offline PostGIS/GIS process populated it, outside this API).
- Haversine assumes a spherical Earth (≈ 0.3% error vs ellipsoidal), immaterial at screening radii.
- `overlap_pct`, `overlap_km2` and `calculation_method` are trusted as computed upstream; this API only reads them.
- Data currency depends on the ingestion pipeline (WDPA and GFW are versioned annually); no freshness metadata is exposed here.

### 7.6 Framework alignment

- **WDPA / Protected Planet (IUCN & UNEP-WCMC):** the World Database on Protected Areas is the authoritative global protected-area inventory; the IUCN management categories (Ia strict reserve → VI sustainable use) and designation types served here are its standard schema. This underpins TNFD "Locate" and SBTN sensitive-location screening.
- **Global Forest Watch (WRI):** tree-cover-loss, primary-forest-loss and associated CO₂-emission time series by country and canopy-cover threshold — the standard deforestation-exposure dataset for EUDR and nature-related disclosure.
- **TNFD LEAP (Locate):** the nearby/overlaps queries operationalise the "Locate" step — identifying where operations interface with nature and whether they touch protected or ecologically sensitive areas — feeding the nature-capital and biodiversity engines elsewhere on the platform.

## 9 · Future Evolution

### 9.1 Evolution A — Complete the spatial coverage and activate on-demand overlap computation (analytics ladder: rung 1 → 3)

**What.** This is a read-only spatial-data query API — no quant engine — over three
ingested tables: `dh_wdpa_protected_areas` (WDPA registry), `dh_gfw_tree_cover_loss`
(Global Forest Watch annual loss), and `dh_nature_spatial_overlaps` (precomputed asset↔
protected-area overlaps). The one computation it performs is a Haversine `/wdpa/nearby`
proximity search. The atlas shows real coverage gaps: `/gfw/countries` and `/gfw/{iso3}`
trace **db-empty/failed** and `/overlaps` is db-empty, so the deforestation time-series
and asset-overlap layers are thin. Evolution A completes the data and adds on-demand
overlap.

**How.** (1) Backfill `dh_gfw_tree_cover_loss` so the country roll-up and per-ISO3
time-series endpoints (`/gfw/countries`, `/gfw/{iso3}`) return `passed` with real-db
provenance — the annual loss series is the analytical payload consumers need. (2) Move
`dh_nature_spatial_overlaps` from purely precomputed to also supporting on-demand overlap:
given an asset geometry, compute intersection with WDPA polygons live (PostGIS is on the
platform per the digital-twin work) rather than only returning stored rows. (3) Add a
distance-to-nearest-protected-area and driver-attributed deforestation-exposure metric per
asset. (4) Validate WDPA coverage completeness by country.

**Prerequisites.** GFW and overlap tables backfilled (D0/D1 seeding); PostGIS polygon
geometry for WDPA (the registry currently stores area + lat/lng, may need boundary
geometry). **Acceptance:** `/gfw/countries`, `/gfw/{iso3}`, and `/overlaps` return
`passed` with real-db provenance; an on-demand overlap request returns intersection
km²/% for a supplied asset; `/stats` reports nonzero across all three tables.

### 9.2 Evolution B — Location-screening tool for nature copilots (LLM tier 1 → 2)

**What.** As a pure data layer, this module's LLM value is as a *grounding tool* for the
nature-risk, nature-capital, and TNFD copilots: "is this asset inside or near a protected
area?" resolves through `/wdpa/nearby`; "what's the deforestation trend in this sourcing
country?" through `/gfw/{iso3}` — real WDPA/GFW rows, never recalled.

**How.** Nine read-only, viewer-gated GET endpoints make a clean tier-2 tool surface.
Tier 1 explains `/stats` coverage. Because there's no scoring here, the copilot's job is
retrieval + framing, deferring interpretation to the nature-risk engine. This is a
canonical leaf-tool in the tier-3 Desk Orchestrator's supply-chain and counterparty
nature-screening chains (GLEIF → asset coords → WDPA proximity + GFW exposure).

**Prerequisites.** Evolution A's backfill — a copilot answering "deforestation trend"
from a db-empty GFW table would fabricate or return nothing useful; the honest interim
behaviour is to report the coverage gap. **Acceptance:** every protected-area name,
distance, and loss figure a consuming copilot cites traces to a WDPA/GFW tool response;
queries against db-empty layers return an explicit coverage disclaimer rather than a
fabricated trend.