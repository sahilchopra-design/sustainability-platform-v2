## 9 · Future Evolution

### 9.1 Evolution A — Fully-loaded hazard layers and severity-aware overlays (analytics ladder: rung 1 → 2)

**What.** A geospatial query layer ("PostGIS P1-8", route-only): five query endpoints run PostGIS
predicates (`ST_DWithin`, `ST_Within`, `ST_Intersects`) over reference layers — protected areas,
flood zones (return period, `max_depth_m`), wildfire zones (`fwi_mean`), sea-level zones, and EUDR
plot overlap — against `valuation_assets`, plus two diagnostics (`/ref/status` honestly reports
`data_load_required` per table, `/ref/spatial-indexes` lists GiST indexes). There is deliberately no
scoring — pure geometry. The known platform context: the digital-twin grids are partially loaded
(flood 48 rows, sea-level 152 vs thousands for wildfire/earthquake), so containment queries miss
most of the world. Evolution A completes the layers and enriches the overlays.

**How.** (1) Load the thin layers — flood (FEMA NFHL bulk or JRC global flood maps) and sea-level
(gridded IPCC AR6 projections) — so `ST_Within` hits are meaningful outside the sampled cities;
`/ref/status`'s `data_load_required` flag then clears honestly. (2) Extend `/point/hazards` to
return distance-to-nearest-zone when a point is *not* contained (a near-miss is information, not a
null). (3) Add batch asset screening (all `valuation_assets` × all layers in one call) writing to
the overlap tables `nature_data` serves. (4) Verify the GiST indexes cover the new volumes.

**Prerequisites.** Bulk flood/sea-level data ingestion (named in the physical-risk digital-twin
follow-ups); PostGIS capacity for larger layers. **Acceptance:** `/ref/status` shows all reference
tables loaded with `data_load_required: false`; a point query outside any zone returns
nearest-zone distances; batch screening populates the overlap store; query latency acceptable on
the GiST indexes.

### 9.2 Evolution B — Spatial-overlay tool for asset-screening copilots (LLM tier 1 → 2)

**What.** As pure geometry with no scoring, this module's LLM role is the *spatial-truth tool*
other copilots call: "is this asset in a flood zone?", "which of our sites are within 5km of a
protected area?", "does this EUDR plot overlap a deforestation area?" — each answered by a PostGIS
predicate, never by LLM geography.

**How.** Tier 1 narrates `/ref/status` (which layers are loaded, row counts, PostGIS health).
Tier 2 registers the five query POSTs as read-only tools; answers carry the exact predicate
semantics (within vs near, radius used) so consumers can't over-read a containment result. This is
the geometric backbone for the `nature_risk`, `physical_risk_pricing`, EUDR, and valuation copilots
in the tier-3 chain — they interpret; this module locates.

**Prerequisites.** Evolution A's layer loading — a copilot answering "not in a flood zone" from a
48-row flood table would be dangerously wrong; until loaded, the honest answer is "flood layer
covers N zones only, no conclusion for this location". **Acceptance:** every containment/proximity
claim a consuming copilot makes traces to a query response; sparse-layer results carry the coverage
caveat from `/ref/status`; the copilot distinguishes "not in any loaded zone" from "no hazard".
