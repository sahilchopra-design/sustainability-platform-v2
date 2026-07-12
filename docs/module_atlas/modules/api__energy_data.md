# Api::Energy_Data
**Module ID:** `api::energy_data` · **Route:** `/api/v1/energy-data` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/energy-data/coal-plants` | `search_coal_plants` | api/v1/routes/energy_data.py |
| GET | `/api/v1/energy-data/coal-plants/countries` | `coal_plant_countries` | api/v1/routes/energy_data.py |
| GET | `/api/v1/energy-data/coal-plants/owners` | `coal_plant_owners` | api/v1/routes/energy_data.py |
| GET | `/api/v1/energy-data/coal-plants/nearby` | `coal_plants_nearby` | api/v1/routes/energy_data.py |
| GET | `/api/v1/energy-data/coal-plants/pipeline` | `coal_plant_pipeline` | api/v1/routes/energy_data.py |
| GET | `/api/v1/energy-data/coal-plants/{gem_id}` | `get_coal_plant` | api/v1/routes/energy_data.py |
| GET | `/api/v1/energy-data/coal-units/{plant_id}` | `coal_plant_units` | api/v1/routes/energy_data.py |
| GET | `/api/v1/energy-data/stats` | `energy_data_stats` | api/v1/routes/energy_data.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `dh_gem_coal_plant_units`, `dh_gem_coal_plants`, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/energy-data/coal-plants** — status `passed`, provenance ['real-db'], source tables: `dh_gem_coal_plants`
Output: `{'type': 'object', 'keys': ['records', 'total'], 'n_keys': 2}`

**GET /api/v1/energy-data/coal-plants/countries** — status `passed`, provenance ['db-empty'], source tables: `dh_gem_coal_plants`
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/energy-data/coal-plants/nearby** — status `failed`, provenance ['db-empty'], source tables: `dh_gem_coal_plants`
Output: `None`

**GET /api/v1/energy-data/coal-plants/owners** — status `passed`, provenance ['db-empty'], source tables: `dh_gem_coal_plants`
Output: `{'type': 'object', 'keys': ['owners'], 'n_keys': 1}`

**GET /api/v1/energy-data/coal-plants/pipeline** — status `passed`, provenance ['db-empty'], source tables: `dh_gem_coal_plants`
Output: `{'type': 'object', 'keys': ['pipeline', 'total'], 'n_keys': 2}`

**GET /api/v1/energy-data/coal-plants/{gem_id}** — status `failed`, provenance ['db-empty'], source tables: `dh_gem_coal_plants`
Output: `None`

**GET /api/v1/energy-data/coal-units/{plant_id}** — status `passed`, provenance ['db-empty'], source tables: `dh_gem_coal_plant_units`
Output: `{'type': 'object', 'keys': ['units', 'total'], 'n_keys': 2}`

**GET /api/v1/energy-data/stats** — status `passed`, provenance ['real-db'], source tables: `dh_gem_coal_plant_units`, `dh_gem_coal_plants`
Output: `{'type': 'object', 'keys': ['coal_plants', 'coal_units'], 'n_keys': 2}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/energy-data` is a **reference-data access domain** over the ingested **Global Energy
Monitor (GEM) Global Coal Plant Tracker**, stored in two Postgres tables: `dh_gem_coal_plants`
(plant-level) and `dh_gem_coal_plant_units` (unit-level). There is no engine file — all logic is
raw SQL in the route module (`backend/api/v1/routes/energy_data.py`), gated at the `viewer` role.
The only mathematics in the domain is a **haversine great-circle distance** used by the `/nearby`
endpoint, executed in SQL:

```
distance_km = 6371 × acos( LEAST(1.0,
                 cos(φ₁)·cos(φ₂)·cos(λ₂−λ₁) + sin(φ₁)·sin(φ₂) ) )
```

with 6,371 km as the mean Earth radius and the `LEAST(1.0, ·)` clamp guarding `acos` domain
errors from floating-point drift (this is the spherical-law-of-cosines form of haversine).

### 7.2 Data schema / parameterisation

Plant records carry GEM's tracker fields: `gem_id`, plant name, country (+ISO3, subnational),
owner and `parent_company`, lat/lon, `status`, `capacity_mw`, `num_units`, `year_opened`,
`year_retired`, `planned_retire_year`, `coal_type`, `combustion_technology`, and `annual_co2_mt`
(GEM's modelled annual emissions estimate). Status vocabulary follows GEM's lifecycle labels;
the routes hardcode two groupings:

| Grouping | Statuses | Used by |
|---|---|---|
| Operating | `Operating` | `/countries`, `/owners`, `/stats` |
| Pipeline ("stranded asset pipeline") | `Announced`, `Pre-permit`, `Permitted` (+ `Construction` in `/pipeline` and `/stats`) | `/countries` (3 statuses), `/pipeline` & `/stats` (4) |

Note the mild inconsistency: `/coal-plants/countries` counts pipeline as Announced/Pre-permit/
Permitted only, while `/pipeline` and `/stats` also include Construction.

### 7.3 Calculation walkthrough / API surface

| Endpoint | Behaviour |
|---|---|
| `GET /coal-plants` | Filterable search (ISO3, status, parent ILIKE, coal_type ILIKE, min capacity, name ILIKE), ordered `capacity_mw DESC NULLS LAST`, limit ≤ 500 + offset, with total count. |
| `GET /coal-plants/{gem_id}` | Single plant, 404 if unknown GEM ID. |
| `GET /coal-plants/countries` | GROUP BY country: plant count, Σ capacity MW, Σ annual CO₂ Mt, operating and pipeline counts (`COUNT(*) FILTER`). |
| `GET /coal-plants/owners` | Top parent companies by Σ capacity (limit ≤ 100): plants, capacity, CO₂, operating count, and `with_retire_date` (plants having `planned_retire_year`) — a quick transition-commitment signal. |
| `GET /coal-plants/nearby` | Haversine subquery filtered to `distance_km ≤ radius` (1–1,000 km, default 100), ordered nearest-first — the geospatial join for asset-level physical/transition analysis. |
| `GET /coal-plants/pipeline` | All Announced/Pre-permit/Permitted/Construction plants, capacity-ordered — the carbon-lock-in watchlist. |
| `GET /coal-units/{plant_id}` | Units for one plant (UUID FK), capacity-ordered. |
| `GET /stats` | Totals: plants, distinct countries, Σ capacity MW, operating and pipeline counts, unit count. |

### 7.4 Worked example (nearby query)

`GET /coal-plants/nearby?lat=51.5&lng=7.2&radius_km=50` (Ruhr area). For a plant at
(51.28, 6.71): φ₁ = 0.8988 rad, φ₂ = 0.8951 rad, Δλ = −0.00855 rad.

| Step | Computation | Result |
|---|---|---|
| cos-term | cos(51.5°)·cos(51.28°)·cos(0.49°) + sin(51.5°)·sin(51.28°) | 0.99993 |
| acos | acos(0.99993) | 0.011947 rad |
| distance | 6371 × 0.011947 | **≈ 40.9 km** |

40.9 ≤ 50 → the plant is returned, sorted by distance among all matches. A caller can then join
`annual_co2_mt` and `planned_retire_year` into site-level stranded-asset or financed-emissions
analyses.

### 7.5 Data provenance & limitations

- **Real public data, no PRNG/synthetic content**: the GEM Global Coal Plant Tracker is an openly
  published dataset (plant-by-plant, updated ~biannually) ingested by the platform's
  reference-data layer; this module is read-only over that snapshot.
- `annual_co2_mt` is **GEM's modelled estimate** (derived from capacity, technology heat rate,
  capacity factor and emission factor assumptions), not measured stack emissions — appropriate
  for screening, not for inventory reporting.
- Freshness is bound to the ingestion vintage; there is no as-of/version column surfaced.
- The spherical-law-of-cosines distance is accurate to ~0.3% (spherical Earth assumption) and
  numerically weaker than true haversine at sub-km separations — immaterial at the 1–1,000 km
  radii allowed here. The subquery computes distance for **every** georeferenced plant per call
  (no spatial index/PostGIS usage), acceptable at GEM's ~14k-record scale.
- Pipeline definitions differ across endpoints (see §7.2); consumers comparing counts should
  use one endpoint consistently.

### 7.6 Framework alignment

- **GEM Global Coal Plant Tracker:** the source taxonomy (status lifecycle Announced →
  Pre-permit → Permitted → Construction → Operating → Retired, unit-level capacity records,
  ownership chains) is preserved verbatim — the tracker underpins most academic and NGO
  coal-phase-out analyses (e.g. PPCA, Climate Analytics).
- **Stranded-asset / transition-risk practice:** the pipeline endpoint operationalises the
  "carbon lock-in" concept (new coal capacity at risk of stranding under Paris-consistent
  pathways); `planned_retire_year` supports CRREM/NZBA-style phase-out alignment checks.
- **PCAF / financed emissions adjacency:** parent-company aggregation of capacity and modelled
  CO₂ provides the asset-level layer that PCAF's power-generation asset-class methodology
  expects (emissions attributed via ownership).
- **TCFD/ISSB physical-transition disclosure:** the nearby-coordinates query supports asset
  geolocation requirements for concentration and scenario analyses.

## 9 · Future Evolution

### 9.1 Evolution A — PostGIS spatial indexing, unified pipeline definitions, and parent roll-ups (analytics ladder: rung 1 → 2)

**What.** A read-only reference-data domain over the ingested GEM Global Coal Plant Tracker (plant +
unit tables) — real public data, no PRNG. The only math is a haversine great-circle distance for the
`/nearby` geospatial join. §7.5 names the deepening targets: the distance subquery computes distance
for **every georeferenced plant per call** (no spatial index/PostGIS), acceptable at GEM's ~14k scale
but not indexed; the **pipeline status definition differs across endpoints** (`/countries` counts
Announced/Pre-permit/Permitted; `/pipeline` and `/stats` also include Construction); `annual_co2_mt`
is GEM's modelled estimate; and there's no as-of/version column surfaced. Evolution A adds PostGIS
spatial indexing (the platform already runs PostGIS for the physical-risk digital twin), unifies the
pipeline definition, and adds parent-company emissions roll-ups for PCAF.

**How.** A PostGIS geometry column + GiST index on the plant table so `/nearby` uses a spatial index
(`ST_DWithin`) instead of a full-scan haversine; a single canonical pipeline-status set shared across
endpoints; a parent-company aggregation endpoint summing capacity and modelled CO₂ by ownership chain
(the PCAF power-generation asset-class layer). Rung 2: join `planned_retire_year` against Paris-
consistent phase-out pathways for a stranded-asset/carbon-lock-in score per plant.

**Prerequisites.** Fix the harness failures — §4.2 shows `GET /coal-plants/nearby` and
`/coal-plants/{gem_id}` both **failed** (db-empty / lookup); surface the ingestion vintage. Document
that `annual_co2_mt` is modelled, not measured. **Acceptance:** the §7.4 nearby query (~40.9 km)
reproduces via the spatial index; pipeline counts reconcile across all endpoints; a parent-company
roll-up returns owned capacity and modelled CO₂; the nearby and detail endpoints pass the harness.

### 9.2 Evolution B — Coal-asset grounding tool for the transition-risk copilots (LLM tier 2)

**What.** This domain's value to the LLM layer is as a **coal-asset ground-truth tool**: a transition-
risk or financed-emissions copilot answering "how much coal capacity does this parent company own and
what's its retirement pipeline?" tool-calls `/coal-plants` and `/owners`, "what coal plants are near
this asset?" calls `/nearby`, and "what's the global stranded-asset pipeline?" calls `/pipeline` —
grounding stranded-asset and carbon-lock-in analysis in the real GEM census.

**How.** Register the 8 endpoints as tools; the no-fabrication validator ensures any coal-capacity,
plant-count or modelled-CO₂ figure in a copilot answer traces to a GEM tool call with its ingestion
vintage. The `with_retire_date` signal on `/owners` (a quick transition-commitment proxy) and the
`/pipeline` carbon-lock-in watchlist directly support stranded-asset narratives. Composable with the
physical-risk digital twin (asset geolocation) and PCAF financed-emissions in a transition-risk desk.

**Prerequisites.** Evolution A's spatial indexing and harness fixes (a failing `/nearby` can't back
reliable tool-calling); Atlas corpus embedded (roadmap D3). **Acceptance:** every coal-asset figure in
a copilot answer traces to a GEM tool call with its vintage; a parent-company roll-up matches the
`/owners` output; `annual_co2_mt` is presented as GEM's modelled estimate, not measured stack
emissions.