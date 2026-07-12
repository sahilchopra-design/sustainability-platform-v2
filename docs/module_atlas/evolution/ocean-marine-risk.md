## 9 · Future Evolution

### 9.1 Evolution A — Build the MCRI composite over real hazard layers (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide describes a Marine Climate Risk Index (`MCRI = Σ(Hazardᵢ × Exposureᵢ × Sensitivityᵢ) / AdaptiveCapacity`) aligned to IPCC SROCC and ORRAA, but the code draws five *independent* `sr()` indicators per ocean zone (health index, SST, acidification, dissolved O₂, fish-stock) with no hazard/exposure/sensitivity/adaptive-capacity structure connecting them; the 6-year trend is a crude linear warming overlay. §8 already specifies the MCRI model. Evolution A implements it over real IPCC-aligned data.

**How.** (1) `POST /api/v1/ocean-marine-risk/mcri` computing the documented composite: hazard layers from IPCC AR6/SROCC sea-level and SST projections at the 0.5° resolution §1 describes (SSP2-4.5 and SSP5-8.5), joined to asset coordinates via the platform's geographic layer; exposure from asset value; sensitivity from species/asset-class curves; adaptive capacity from a coastal-defence/adaptation-investment indicator. (2) Fisheries exposure scoring (§1) from real species-sensitivity-to-warming/acidification curves rather than a seeded `fishStockPct`. (3) Reuse the Physical Risk Digital Twin's cyclone/sea-level grids for the storm-surge and SLR hazard terms rather than a parallel data path.

**Prerequisites.** This is greenfield MCRI — the current page has no real structure; IPCC projection data ingestion; the digital-twin sea-level grid is thin (152 rows, named-city samples) so coverage needs a resolution caveat per zone. **Acceptance:** MCRI decomposes into named hazard/exposure/sensitivity/adaptive-capacity terms from real data; two assets at different coordinates score differently via actual SLR/SST exposure; no `sr()` remains.

### 9.2 Evolution B — Coastal-asset risk copilot (LLM tier 1 → 2, gated on the model)

**What.** A copilot for the coastal-asset-owner/marine-insurer users §1 targets: "what's the marine climate risk for a port at these coordinates under SSP5-8.5?", "how does acidification threaten this aquaculture operation?", "which of my coastal assets face the highest MCRI?" — grounded, post-Evolution-A, in the real MCRI decomposition and the IPCC SROCC / ORRAA references named in §5.

**How.** Tier 1 near-term is framework-only: the copilot explains marine climate hazards, the MCRI structure, and IPCC SROCC findings from the standards corpus, but must refuse to score the user's assets because today's zone metrics are fabricated — a hard refusal path, since a marine insurer acting on seeded risk numbers would be a real liability. Tier 2 with Evolution A: tool calls to the MCRI endpoint per asset, decomposing scores into hazard/exposure/sensitivity terms with the fabrication validator matching every index to outputs; SSP-scenario what-ifs become recomputations. Provenance expander cites the IPCC projection vintage and resolution tier per asset.

**Prerequisites.** Tier 1 needs standards corpus + explicit current-state disclosure; asset scoring is gated on Evolution A. **Acceptance:** framework answers cite SROCC/ORRAA; asset MCRI (post-Evolution-A) traces to tool calls with hazard decomposition; the copilot refuses to score assets against the current placeholder metrics.
