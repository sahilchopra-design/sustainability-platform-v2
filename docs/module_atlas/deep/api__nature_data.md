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
