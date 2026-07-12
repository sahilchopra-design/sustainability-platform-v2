## 9 · Future Evolution

### 9.1 Evolution A — Cell-level requirement taxonomy with derived overlap ratios (analytics ladder: rung 1 → 2)

**What.** §7 describes a regulatory cross-walk reference tool over 12 jurisdictions (EU CSRD, UK TPT/SDR, US SEC, HK, SG, AU, JP, KR, BR, IN, CA, ZA) that is curated real regulatory fact with no PRNG — but whose only "engine" is a single overlap ratio that is asserted, not derived: the `overlap`, `uniqueReqs`, and `costEstKUsd` figures are estimates/judgements rather than computed from a normalised requirement taxonomy, and the CROSSWALK boolean grid covers only 7 of the 12 jurisdictions. Evolution A builds the normalised taxonomy so `Overlap = SharedRequirements/UnionOfRequirements` is computed cell-by-cell: decompose each jurisdiction's disclosure regime into atomic requirements mapped to a common ISSB-anchored datapoint spine (shared with the `framework-interop` sibling's crosswalk), then derive overlaps and unique-requirement counts from set operations rather than typing them in.

**How.** (1) A requirement taxonomy table (datapoint ID × jurisdiction applicability) covering all 12 jurisdictions, not 7. (2) Overlap and uniqueReqs computed from the set intersection/union per jurisdiction pair. (3) The compliance-cost estimator driven by a per-requirement effort model (requirement count × effort factor) rather than an order-of-magnitude judgement, cross-referencing the `framework-interop` effort logic.

**Prerequisites.** The atomic requirement taxonomy digitised into refdata (the ESRS/ISSB catalogs are already in the DB); alignment with `framework-interop` so the two modules share one datapoint spine. **Acceptance:** overlap ratios recompute from the requirement sets and match the displayed figures within tolerance; all 12 jurisdictions appear in the crosswalk grid; cost estimates scale with requirement counts.

### 9.2 Evolution B — Multi-jurisdiction compliance-planning copilot (LLM tier 1 → 2)

**What.** A copilot for group sustainability teams: "we list in the EU, US, and Singapore — what's our combined disclosure obligation, where do requirements overlap, and what's the sequencing by deadline?" narrates the jurisdiction map, crosswalk, and timeline from the atlas corpus, and tier-2 tool-calls the Evolution A overlap/cost endpoints to compute the unified requirement set and effort estimate.

**How.** Tier 1 is credible because §7 confirms the data is accurate regulatory fact; the copilot cites specific effective dates and framework names, flagging that they drift as rules finalise. The distinctive value is mapping the ISSB-vs-ESRS interoperability gap the tracker exists to surface, and sequencing data collection against the deadline timeline. Tier 2 computes the exact overlap and cost for the user's jurisdiction mix. Guardrail: cost figures flagged as illustrative until Evolution A derives them.

**Prerequisites.** Corpus embedding; Evolution A for computed overlap/cost. **Acceptance:** every jurisdiction requirement or deadline cited traces to the curated data; post-Evolution-A the unified-requirement and cost answers match the endpoint output for the selected jurisdictions.
