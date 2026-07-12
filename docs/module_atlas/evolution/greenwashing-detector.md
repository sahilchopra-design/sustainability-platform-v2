## 9 · Future Evolution

### 9.1 Evolution A — Compute the four-component GWS via the shared engine (analytics ladder: rung 1 → 3)

**What.** §7 flags that the guide's composite `GWS = w1·ClaimEvidenceGap + w2·SelectivityIndex + w3·VaguenessScore + w4·RegulatoryGapScore` is not implemented — the page generates 30 `sr()`-seeded companies and derives an "Integrity" score (not GWS) from three seeded inputs (self-reported, third-party, disclosure quality), while the backend `greenwashing_engine.py` (shared with the `greenwashing-detection` route) does real term-screening but is not called (§8 marked "not yet implemented"). Evolution A builds the four-component GWS: claim-evidence gap from the engine's screening plus evidence matching, a selectivity index (cherry-picked metrics omitting negatives), a vagueness score (proportion of non-specific language), and a regulatory-gap score against minimum disclosure standards — weighted per §5, replacing the seeded Integrity heuristic.

**How.** (1) Call the shared `greenwashing_engine.py` for term-screening (vagueness, claim detection). (2) Compute the selectivity index from metric coverage (which negative KPIs are omitted) and the regulatory-gap score against a disclosure-requirement checklist. (3) Combine into the weighted GWS per §5, with the weights documented. Companies sourced from real filings, replacing the seeded panel.

**Prerequisites.** Real disclosure documents; the shared engine wired; the seeded 30-company panel replaced. This module should coordinate with the sibling `greenwashing-detection` (they share the engine) to avoid duplicated verticals. **Acceptance:** GWS computes as the four-component weighted composite reproducing §5; the engine is called for screening; vagueness/selectivity/regulatory-gap are real sub-scores, not seeded; Integrity is superseded by GWS.

### 9.2 Evolution B — Issuer greenwashing-risk copilot (LLM tier 2)

**What.** A copilot for ESG-integrity and credit analysts: "score this issuer's greenwashing risk, break down the four GWS components, and show which claims lack substantiation" tool-calls the Evolution A GWS endpoints and narrates the component decomposition with flagged claims.

**How.** Tier-2 tool-calling over the GWS and engine endpoints; the grounding corpus is §5/§7 (the four-component GWS, claim-evidence gap, selectivity, vagueness, regulatory gap). Like its sibling, the LLM's language classification is part of the analytical layer, grounded by the rule-based engine. Guardrail, pre-Evolution-A: companies and scores are synthetic and the page computes Integrity not GWS, so it must refuse issuer-specific greenwashing claims and disclose the mismatch. Every component score validated against tool output.

**Prerequisites.** Evolution A (GWS unbuilt today); document access; corpus embedding; coordination with `greenwashing-detection`. **Acceptance:** post-Evolution-A, every GWS component traces to a tool call and flagged claims cite source passages; pre-Evolution-A the copilot declines issuer-specific scoring and notes the page computes Integrity, not GWS.
