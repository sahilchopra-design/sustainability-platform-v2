## 9 · Future Evolution

### 9.1 Evolution A — Location-grounded valuation and uncertainty on benefit transfer (analytics ladder: rung 1 → 3)

**What.** The E77 engine spans SEEA-EA natural-capital accounting, TEEB benefit-transfer
valuation, ENCORE dependency scoring, multi-framework disclosure assessment, and a nature
balance sheet. Monetary value is `biome_unit_value × condition × extent`, with service
valuation using *equal intra-category allocation* — a documented simplification — and the
biome-values reference already carries a `caveat` and `price_year`, acknowledging that
benefit-transfer values are point estimates. Evolution A adds spatial grounding and
uncertainty.

**How.** (1) Resolve biome/ecosystem type and condition from the platform's spatial nature
data (`nature_data` module's WDPA/GFW layers, the digital-twin land grids) rather than
caller-asserted category, reporting an `evidence_tier`. (2) Replace equal intra-category
service allocation with a weighted allocation where evidence supports it, and attach a
value range (low/central/high) to every benefit-transfer figure — TEEB values have wide
confidence intervals that the caveat currently only mentions in prose. (3) Inflation-adjust
`biome_unit_value` from `price_year` to the assessment year. (4) Bench-pin the balance-sheet
opening/closing reconciliation.

**Prerequisites.** Spatial nature-data linkage (module exists but see its own db-empty
gaps); an inflation index for value updating. **Acceptance:** two assets in different
biomes get location-resolved values with an `evidence_tier`; every monetary figure carries
a range, not a point; balance-sheet net change reconciles and is bench-pinned.

### 9.2 Evolution B — Natural-capital accounting copilot (LLM tier 2)

**What.** A copilot that runs `/assess`, `/dependency-score`, and `/balance-sheet` for an
entity and narrates the account — "your wetland asset is valued at $X/yr (central; range
Y–Z); ENCORE flags high dependency on water provisioning; your TNFD disclosure composite
is 62% with GBF Target-15 the weakest" — each figure tool-sourced.

**How.** Three POST endpoints plus five `/ref/*` taxonomies (biome-values with methodology
and caveat, ecosystem types, ENCORE services, SEEA accounts, TNFD disclosures) that fully
ground the frameworks. The disclosure-scoring endpoint drives a gap narrative; the
balance-sheet endpoint supports period-over-period stories. The `biome-values` caveat is
exactly what the copilot must surface — it should lead valuation answers with the
benefit-transfer uncertainty, not bury it.

**Prerequisites.** None hard — engine is honest and reference-complete; stronger with
Evolution A's value ranges. **Acceptance:** every value, dependency, and disclosure score
traces to a tool response; the copilot states the benefit-transfer caveat and price-year
on every monetary figure; it refuses to present ecosystem values as market prices and
frames them as the accounting estimates the engine computes.
