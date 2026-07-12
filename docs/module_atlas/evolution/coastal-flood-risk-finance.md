## 9 · Future Evolution

### 9.1 Evolution A — Build the coastal EAL engine from the platform's own SLR grid (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag is comprehensive: no probability, no damage function, no
premium model — 65 cities with real names carry fully synthetic attributes ("Jakarta
and Rotterdam draw from the same uniform distributions"), the adaptation-investment
slider is display-only, `residualRisk` *rises* with adaptation cost (backwards), and
the risk classifier's second argument is a near-duplicate seed rather than the flood
field. Evolution A replaces the generator with the guide's stated engine:
`EAL = Σ P(SLR_t + Surge_i) × DamageFunction(depth) × AssetValue × ExposureShare` plus
the insurability-cliff year.

**How.** (1) Ground SLR in the digital twin: the `ref_sea_level_zones` grid (152 rows,
IPCC AR6-sourced) provides per-city SLR projections, replacing the seeded
`seaLevelRise2050`; storm-surge return periods come from IBTrACS-derived cyclone
intensities where coverage exists, with `resolution_tier` fallback elsewhere.
(2) Hazus-style depth-damage curves as a curated reference table (public USACE
coefficients); EAL integrates over the 6-return-period convention used by the
physical-risk pricing engine. (3) Insurability cliff: premium ≈ EAL × loading; cliff
year where premium > 1% of property value under each SSP. (4) Make the adaptation
slider real: protection standard raises the effective return-period threshold, and fix
the inverted residual-risk coupling.

**Prerequisites (hard).** Purge the `sr()` city attributes (guardrail conventions);
the sea-level grid's 152 rows must cover or interpolate the 65 named cities — report
honest nulls where they don't. **Acceptance:** Rotterdam and Jakarta produce different
EALs traceable to grid values; the cliff year moves when the SSP changes; the
adaptation slider changes a computed number.

### 9.2 Evolution B — Coastal lending-book copilot (LLM tier 1)

**What.** The module's stated users are mortgage lenders under FDIC climate guidance
and muni investors — audiences that need explanation more than dashboards. Evolution B
is a copilot that reads the (post-Evolution A) city EAL panel and answers: "why does
this market's insurability cliff arrive in 2041?", "what share of exposure sits past
the 1% premium threshold under SSP5-8.5?", grounded in §5's formula, the IPCC
AR6/NOAA/First Street anchors the guide cites, and current filter state — with a hard
disclosure rule while any pre-Evolution-A synthetic field remains on screen.

**How.** Tier-1 RAG (this module has zero endpoints, so tool-calling is out of scope
until Evolution A's backend exists): Atlas record + reference documents into
`llm_corpus_chunks`, page state serialized into the prompt. The copilot's caveat
repertoire comes straight from §7.5 — no elevation/bathymetry physics, linear what-if
slope — so its confidence language matches the engine's actual fidelity. After
Evolution A, the same panel upgrades to tier 2 with EAL-recompute tool calls.

**Prerequisites (hard).** Evolution A for any numeric city-level claims — a copilot
narrating seeded exposures as if real would be fabrication-by-proxy; corpus embedding
(D3). **Acceptance:** every city figure cited to grid data or declared unavailable;
asked about a city outside the dataset, the copilot says so rather than interpolating
silently.
