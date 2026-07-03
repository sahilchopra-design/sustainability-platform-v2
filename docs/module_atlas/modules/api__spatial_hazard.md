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
| `SpatialHazardService.get_hazard_profile` | latitude, longitude, country | Fetch hazard profile for a location. |
| `SpatialHazardService.auto_populate_physical_inputs` | latitude, longitude, country, user_overrides | Return dict compatible with CLVaR PhysicalInputs, with optional user overrides. |
| `SpatialHazardService.query_nearby_protected_areas` | latitude, longitude, radius_km | Phase 2: ST_DWithin query against dh_wdpa_protected_areas. |
| `SpatialHazardService.query_flood_zone_by_location` | latitude, longitude | Phase 2: ST_Intersects query against dh_flood_risk_extent. |
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