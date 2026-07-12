## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/spatial` (route-only, `spatial.py`, "PostGIS P1-8") is a **geospatial query layer** — all
"methodology" is PostGIS geometry predicates over reference hazard layers; there is no scoring or
loss modelling. Five query endpoints plus two diagnostics:

| Endpoint | Spatial predicate (exact SQL) | Output |
|---|---|---|
| `POST /assets/protected-areas` | `ST_DWithin(va.location, pa.boundary::GEOGRAPHY, radius_m)` on `valuation_assets × ref_protected_areas` | asset–PA pairs with `ST_Distance(...)/1000` km, IUCN category, WDPA id, area |
| `POST /assets/flood-zones` | `ST_Within(va.location::GEOMETRY, fz.zone_boundary)` | asset–zone pairs with return period, scenario, `max_depth_m` |
| `POST /assets/wildfire-risk` | `ST_Within(...)` on `ref_wildfire_zones` | zone id, risk level, mean Fire Weather Index (`fwi_mean`) |
| `POST /point/hazards` | 4 sub-queries for one lat/lng: PA proximity (`ST_DWithin` on a geography point), and containment in flood / wildfire / sea-level-rise zones (`ST_SetSRID(ST_MakePoint(lng,lat),4326)`), 10 rows each | consolidated `total_hazard_layers_hit` + per-layer lists |
| `POST /eudr/plot-overlap` | `ST_Intersects(eg.plot_geometry, pa.boundary)` with `ST_Area(ST_Intersection(...)::GEOGRAPHY)/10000` | EUDR plot–PA overlaps in hectares, sorted descending |
| `GET /ref/status` | `vw_postgis_status` + reference-table row counts | PostGIS versions, `data_load_required` flag |
| `GET /ref/spatial-indexes` | `pg_index`/`pg_am` catalogue join filtered to `gist` | GiST index inventory |

### 7.2 Parameterisation

| Parameter | Default / bounds | Notes |
|---|---|---|
| `radius_km` (protected areas) | 10 km, bounds 0.1–100 | proximity search radius |
| `radius_km` (point hazards) | 10 km, bounds 0.1–50 | applies only to the PA layer; other layers are containment tests |
| `limit` | 500 (≤2000) queries; 200 EUDR; 10 per point-hazard layer | result caps |
| Flood scenario vocabulary | `baseline \| rcp45_2050 \| rcp85_2050 \| rcp85_2100` | per docstring; filter is a plain equality |
| `iucn_categories` filter | e.g. `['Ia','Ib','II']` | IUCN protected-area management categories |
| CRS | EPSG:4326 / WGS 84; distances via `::GEOGRAPHY` casts (metres on the spheroid) | header comment: PostGIS 3.3.7 |

Distance and area computations are therefore geodesic (geography type), while containment tests
use planar geometry in 4326 — standard PostGIS practice for point-in-polygon at this scale.

### 7.3 Calculation walkthrough

1. Queries are assembled from a `WHERE` clause list (`asset_ids`, IUCN category, return period,
   scenario filters) and executed as parameterised raw SQL; each returns
   `{count, results[], note}`.
2. The joins are written as `CROSS JOIN` + spatial predicate — semantically an inner spatial join;
   GiST indexes (inventoried by `/ref/spatial-indexes`) make `ST_DWithin`/`ST_Within` sargable.
3. `make_point_geography(:lat, :lng)` — a platform SQL helper function — builds the geography
   point for PA proximity; the containment layers construct the point inline.
4. EUDR overlap area divides `ST_Area` (m² on geography) by 10,000 → hectares.

### 7.4 Worked example — point screening

`POST /point/hazards` with `{latitude: 51.9, longitude: 4.4, radius_km: 25}` (Rotterdam area,
assuming layers loaded): the PA query returns every WDPA polygon whose boundary lies within
25,000 m of the point with its geodesic distance (e.g. `distance_km: 12.34`); the flood query
returns any `ref_flood_zones` polygon containing the point — say a 1-in-100 `rcp85_2050` zone with
`max_depth_m: 1.8`; wildfire and SLR likewise. Response aggregates
`total_hazard_layers_hit = len(PA)+len(flood)+len(wildfire)+len(SLR)`. **With the shipped
database the honest answer is 0 hits** — see below.

### 7.5 Data provenance & limitations

- **The reference layers ship empty.** Endpoint descriptions and response notes state it
  explicitly: "Returns empty if ref_protected_areas has no rows (requires WDPA data load)",
  "requires EU FHRM data load", "All layers return empty until reference spatial data is loaded".
  `/ref/status` computes `data_load_required` from row counts. Intended sources are named in the
  code: **WDPA** (World Database on Protected Areas) for `ref_protected_areas`, **EU Floods
  Directive FHRM / Copernicus**-style products for `ref_flood_zones`, FWI-based zones for
  wildfire, and SLR scenario polygons for `ref_sea_level_zones`.
- **No synthetic data and no PRNG** — the module never fabricates hazard results; absent data
  yields empty result sets, which is the honest failure mode.
- No vulnerability or loss quantification: outputs are exposure *flags* (inside zone / within
  radius), not AAL/PML — downstream physical-risk modules must convert exposure to loss.
- `CROSS JOIN` scans can be expensive at WDPA scale (~290k polygons) despite GiST support;
  result caps mitigate response size, not query cost.
- The wildfire/flood/SLR schemas carry scenario fields (`scenario`, `slr_scenario`,
  `horizon_year`) so climate-conditioned layers are representable, but no scenario logic exists
  in the API beyond equality filtering.

### 7.6 Framework alignment

- **ESRS E4-3 (CSRD biodiversity)** — the protected-areas endpoint is explicitly tagged as
  serving the "sites in or near biodiversity-sensitive areas" disclosure; SFDR PAI 7 uses the same
  concept. WDPA + IUCN categories are the authoritative vocabulary for such screens.
- **EUDR (EU) 2023/1115 Article 10** — the plot-overlap endpoint implements the deforestation
  risk-assessment step of checking commodity-plot geolocation proofs against protected areas;
  real EUDR due diligence additionally requires forest-cover-loss (e.g. Global Forest Watch)
  analysis after the 2020-12-31 cut-off, which is out of scope here.
- **EU Floods Directive (2007/60/EC) flood hazard & risk maps** — the return-period × scenario
  zone schema mirrors FHRM products; RCP4.5/8.5 scenario tags follow IPCC AR5 pathways.
- **Copernicus EFFIS / Canadian FWI** — `fwi_mean` adopts the Fire Weather Index as the wildfire
  hazard metric, as used by EFFIS.
- **TCFD/ISSB physical-risk screening** — point- and portfolio-level hazard-layer intersection is
  the standard first step of asset-level physical-risk disclosure pipelines.
