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
