## 9 · Future Evolution

### 9.1 Evolution A — Continuous country risk and the missing verification factor (analytics ladder: rung 2 → 3)

**What.** §7 assesses this as "mostly a genuine analytic": curated real EUDR
commodity/country tables, real FAO FRA 2020 forest metrics overlaid, an
article-mapped 10-item EUDR checklist, and a deterministic exposure score — with
two documented simplifications: country risk enters as a binary ×1.1/×0.8
multiplier keyed only to {BR, ID, CG} rather than the continuous
`SourceCountry_risk` factor, and `ProducerVerification` is absent (no supplier
NDPE/certification input reaches the score despite the guide's three-factor
formula). Sector→commodity mapping is coarse. Evolution A completes the formula.

**How.** (1) Continuous country factor: score each origin country from its own
curated row (deforestation rate, governance, EUDR benchmark tier — the data is
already on the page) instead of the three-country binary, so Paraguay-soy and
Ghana-cocoa risk differentiate properly. (2) Verification factor: supplier-level
NDPE commitment and RSPO/RTRS certification inputs (entered or imported) discount
the score per a documented rubric — the guide's third factor, and the input §7.5
explicitly says a production version should ingest. (3) Mapping refinement:
holdings carry commodity-exposure weights (revenue share where disclosed) rather
than flat sector baskets. (4) Benchmark: the EUDR country-benchmark tiers the EU
publishes become the calibration check for the computed country factor — rung 3's
external anchor. (5) Coordinate with `commodity-deforestation`'s GFW-ingest
evolution: one forest-loss data layer, two scoring consumers.

**Prerequisites.** Supplier certification data entry/import; the shared GFW/FAO
layer; rubric documentation. **Acceptance:** two same-commodity holdings with
different origin countries score differently via the continuous factor; adding a
verified RSPO supplier visibly discounts the score per the rubric; computed
country tiers correlate with the EU's published benchmarks.

### 9.2 Evolution B — EUDR due-diligence checklist walker (LLM tier 1)

**What.** The module's article-mapped checklist (Art. 3 cutoff, Art. 9
geolocation, Art. 10 risk assessment) is the right skeleton for the guided
workflow operators need: "walk me through EUDR readiness for our cocoa line."
Evolution B does the walk: item by item, what the article requires, what evidence
the operator has (from the checklist state and, post-Evolution A, the supplier
verification records), what's missing, and the risk-classification consequence —
producing the gap summary a compliance officer takes to procurement, with every
requirement quoted from Regulation 2023/1115.

**How.** Tier-1 RAG: the regulation text (shared corpus with
`commodity-deforestation` and `conflict-minerals` — the supply-chain DD family),
the checklist state, and the computed exposure scores as context. Division of
labor with the sibling module is explicit: `commodity-deforestation` evolves the
statement drafter; this module owns the readiness walk — the copilots should
cross-reference, not duplicate.

**Prerequisites.** Regulation text embedded; Evolution A for
verification-evidence answers. **Acceptance:** each walk item quotes its article;
gap findings match the checklist's actual unmet state; commodity-scope questions
(is rubber derivative X covered?) answer from Annex I text, not recall.
