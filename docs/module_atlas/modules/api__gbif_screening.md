# Api::Gbif_Screening
**Module ID:** `api::gbif_screening` · **Route:** `/api/v1/gbif` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/gbif/site-screen` | `site_screen` | api/v1/routes/gbif_screening.py |
| GET | `/api/v1/gbif/health` | `gbif_health` | api/v1/routes/gbif_screening.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `GBIF`, `__future__` *(shared)*, `fastapi` *(shared)*, `infrequently`, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/gbif/health** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ok', 'upstream_status'], 'n_keys': 2}`

**GET /api/v1/gbif/site-screen** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 9 · Future Evolution

### 9.1 Evolution A — Portfolio-scale biodiversity screening with baseline calibration (analytics ladder: rung 1 → 3)

**What.** `GET /site-screen` is a deterministic live proxy over the free/keyless GBIF
occurrence API: for a lat/lon + radius it returns species richness, taxonomic-class
breakdown, IUCN threatened counts, and a documented TNFD-style sensitivity score
(IUCN_WEIGHT: CR 1.0 → NT 0.35). It's honest single-site work with two structural
limits — the sensitivity weights are platform-chosen (uncited), and species richness
saturates at the 1000-facet cap (`richness_capped` flag). Evolution A turns a
single-point tool into a portfolio screener with contextualised scores.

**How.** (1) Add `POST /site-screen/batch` accepting an asset list (or resolving
coordinates from the physical-risk digital twin's asset tables) so a whole portfolio
screens in one call, reusing the existing 6h TTL cache. (2) Calibrate the raw
sensitivity score into a percentile against a biome/ecoregion baseline — a site with 3
threatened species means little without knowing the regional norm; precompute baselines
by sampling GBIF per ecoregion. (3) Handle the `richness_capped` limitation explicitly
by paginating beyond 1000 facets or reporting a lower bound rather than a truncated
count.

**Prerequisites.** GBIF API availability and rate-limit headroom (the cache mitigates
but batch amplifies load); an ecoregion reference layer for baselines. **Acceptance:**
two sites with identical raw threatened counts in different biomes produce different
percentile scores; `richness_capped` sites report a documented lower bound, never a
silently truncated number.

### 9.2 Evolution B — Site-sensitivity copilot for TNFD narratives (LLM tier 1 → 2)

**What.** A copilot that runs `/site-screen` for a named asset and drafts the
locate/evaluate narrative TNFD assessors need — "this facility sits within 10km of
observations of N IUCN-threatened species including [real scientific names]; site
sensitivity scores X" — every species name and count sourced from a live GBIF tool
call, never invented.

**How.** Tier 2 from the start because the value is *running* the screen: one tool
(`GET /site-screen` with lat/lon/radius), plus `/health` for availability. The
copilot's grounding is thin by design (this Atlas page + the docstring's weight table),
which is correct — the numbers must come from the tool, and the LLM only composes them
into prose and cross-links to the `tnfd_assessment` module. This module is a natural
leaf-tool for the tier-3 Desk Orchestrator's "assess this counterparty" chain
(GLEIF → site coords → biodiversity screen).

**Prerequisites.** Coordinate resolution for named assets (the copilot needs lat/lon
before it can screen — depends on entity/asset geocoding); explicit disclosure that
GBIF is observation-density data, not a designated-area overlay, so absence ≠ absence of
sensitivity. **Acceptance:** every scientific name and threatened count in a drafted
narrative appears in the same conversation's `/site-screen` response; the copilot
refuses to assert protected-area status (which the module does not compute) and says so.