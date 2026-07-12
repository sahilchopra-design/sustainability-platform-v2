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
