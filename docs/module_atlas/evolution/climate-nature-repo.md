## 9 · Future Evolution

### 9.1 Evolution A — Sourced LCA factors for the explorer that actually exists (analytics ladder: rung 1 → 2)

**What.** §7 finds the guide describing a spatial data repository (0.1° grid, IRI
composite, asset linkage, APIs) that has zero code behind it — the actual page is a
commodity LCA explorer: 25 commodities × 6 stages × 8 nature-impact categories of
*seeded* intensities, plus a hard-coded planetary-boundaries dashboard, water-stress
and deforestation tables, and a toy GHG regression. Evolution A commits to the
explorer identity and grounds it: stage-level environmental intensities exist in
published LCA databases and meta-analyses (Poore & Nemecek's food-commodity dataset
is public; USGS/mining studies cover extractives; ENCORE — already in the §5
references — maps sector pressure intensities), replacing `genImpacts()`'s seeded
vectors with cited factors; the water-stress table re-based on actual WRI Aqueduct 4.0
country/basin scores (public download); the guide rewritten to describe an LCA/nature-
pressure explorer, with the spatial-repository ambition moved to an explicit §8
future-work note (the platform's digital twin is the natural home for gridded work,
not this page).

**How.** (1) `ref_commodity_impacts(commodity, stage, impact_category, intensity,
unit, source)` — curated from published LCA sources with per-cell citations;
coverage gaps rendered honestly rather than filled. (2) Aqueduct and deforestation
(Hansen/GFW country stats) tables sourced with vintages. (3) The toy ML predictor
deleted or clearly labelled as a demonstration.

**Prerequisites (hard).** PRNG purge on impact intensities; LCA source licensing
review (Poore & Nemecek data is open; ecoinvent is not — use open sources only).
**Acceptance:** every impact cell cites a source; beef vs wheat land-use intensities
reproduce the published ratios; the guide matches the page; zero seeded intensities
remain.

### 9.2 Evolution B — Nature-dependency copilot (LLM tier 1)

**What.** A copilot for TNFD-curious analysts: "which supply-chain stage drives
cotton's water footprint?" (stage-vector decomposition with citations), "how do our
Scope-3 commodity exposures map to planetary boundaries?" (the cross-reference view
the page already structures), "what does the LEAP framework ask at the Evaluate
step?" (§5 TNFD corpus). Tier 1 — the module is a reference explorer, and its
copilot is a literate index over sourced factors plus framework text.

**How.** Atlas record + the sourced impact tables + TNFD/IPBES corpus as grounding;
every intensity in an answer carries commodity-stage-source; boundary-status claims
cite the planetary-boundaries source vintage (these assessments update and dating
them matters); refusal on asset-level spatial questions (that is the digital twin's
surface, and the copilot should route there).

**Prerequisites (hard).** Evolution A first — seeded intensities narrated as LCA
factors would corrupt exactly the supply-chain decisions this module exists to
inform. **Acceptance:** every factor cited resolves to a reference row; a spatial
screening request is redirected to the physical-risk modules; framework answers quote
TNFD v1.0 sections.
