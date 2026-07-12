## 9 · Future Evolution

### 9.1 Evolution A — Fit the EP curve to the platform's hazard grids; resolve the identity split (analytics ladder: rung 2 → 3)

**What.** §7's flag is a wrong-domain finding with a twist: the guide promises IAM
macro-damage functions (DICE/PAGE/FUND, SCC), while the code implements *asset-level
physical* damage functions — and implements them well: real JRC PESETA IV
depth-damage, HAZUS-MH, FEMA P-58 lognormal fragility, and ISO 7933 WBGT curves
with cited parameters. The weak link is the exceedance-probability curve: a
synthetic power law (`0.02·rp^0.55`) with seeded ±15% jitter and curated SSP
multipliers — so PML/AAL read-points rest on a placeholder loss-frequency model.
Evolution A keeps the physical identity (the code is right; the guide entry should
be corrected) and replaces the EP placeholder.

**How.** (1) EP curve from data: for a geolocated asset, build return-period hazard
intensities from the digital-twin grids (flood depths, cyclone wind, FWI) and pass
them through the module's own genuine damage functions — intensity → DR → loss —
instead of asserting a loss power law; this mirrors the physical-risk-pricing
exemplar's resolution cascade and should share its 6-return-period convention.
(2) Remove the `sr()` jitter (guardrail conventions); uncertainty comes from
parameter bands on the damage functions (JRC publishes α/β ranges), which is
honest and explainable. (3) Calibration check: AAL for a benchmark asset against
OpenFEMA NFIP claims density where coverage allows — the rung-3 test. (4) Guide
correction: either re-title toward physical damage functions or add the IAM layer
as a separate, clearly-scoped tab if the platform wants SCC analytics (the sibling
scc modules are the better home).

**Prerequisites.** Grid coverage for the asset's perils (honest `resolution_tier`
fallback); the guide-entry correction so documentation stops promising IAMs.
**Acceptance:** the EP curve derives from grid intensities through the cited
damage functions; zero PRNG in the loss path; the benchmark AAL comparison is
published in the output payload.

### 9.2 Evolution B — Damage-curve explainer for underwriting and engineering users (LLM tier 1)

**What.** The module's real asset is its curated library of engineering standards —
exactly the material practitioners half-remember. Evolution B is a copilot that
explains curve choices and outputs: "why does FEMA P-58 give a lower damage ratio
than HAZUS at 40 m/s for commercial?" (different functional forms — lognormal
fragility vs exponential — with the actual parameters quoted), "which standard
applies to my asset?" (mapping asset class and peril to the right curve family),
and "what does the 1-in-250 PML mean under Solvency II?" — grounded in §7.2's
parameter table with its inline citations and the page's computed curves.

**How.** Tier-1 RAG: this Atlas record plus the standards' citation metadata;
current curve state (standard, asset class, scenario multiplier) passes as context.
Every parameter quoted must match the table; the copilot flags the EP curve's
provenance honestly (placeholder pre-Evolution A, grid-derived after). No
endpoints exist, so tool-calling waits on a backend port of the curve engine —
which Evolution A's grid integration will force anyway.

**Prerequisites.** Corpus embedding (D3); Evolution A for EP-curve claims beyond
the disclosure. **Acceptance:** parameter quotes match the cited standards; curve
recommendations are consistent with the asset-class mapping table; SSP multiplier
questions get the curated-value answer with its IPCC framing, not invented
precision.
