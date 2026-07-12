## 9 · Future Evolution

### 9.1 Evolution A — Materiality-weighted completeness over real disclosure data (analytics ladder: rung 1 → 2)

**What.** §7 credits the GRI taxonomy as real and correct (GRI 1/2/3 universal + 26 topic standards, with disclosure counts and cross-framework maps), but flags two gaps: per-company applicability and data availability are `sr()`/`hashStr`-seeded, and there is no materiality-tier weighting (`w_k`) in the completeness computation despite the guide's `DCS = Σ(Complete_k·w_k)/Σ w_k × 100`. Evolution A implements the weighted DCS over real disclosure data: assess each GRI disclosure's completeness (mandatory content elements: governance, management approach, metrics, targets) from actual company reports, weight by materiality tier, and compute the DCS per §5 — so the 85% 'with reference' and 100% 'in accordance' thresholds mean something real.

**How.** (1) Replace seeded applicability/availability with a materiality assessment (which topic standards are material to the company/sector) and a completeness check per disclosure against real report content. (2) Apply the materiality-tier weights `w_k` in the DCS, per §5 (currently absent). (3) The cross-framework maps (already real) support mapping GRI disclosures to ESRS/ISSB for interoperability.

**Prerequisites.** Real company disclosure documents to assess completeness; a materiality-tier assignment per topic standard; the seeded availability replaced. **Acceptance:** DCS computes as a materiality-weighted completeness reproducing §5 (weights applied, not a flat count); the 'with reference'/'in accordance' thresholds derive from real completeness; no `sr()` availability feeds the score.

### 9.2 Evolution B — GRI reporting-readiness copilot (LLM tier 2)

**What.** A copilot for sustainability reporting teams: "what's our GRI disclosure completeness, which material topic standards have gaps, and what do we need for 'in accordance'?" tool-calls the Evolution A completeness endpoint, decomposes the DCS by topic standard, and lists the outstanding mandatory content elements.

**How.** Tier-2 tool-calling over the completeness/materiality endpoints; the grounding corpus is §5/§7, which correctly encode the GRI taxonomy, the DCS formula, and the cross-framework maps. The LLM's assessment of disclosure completeness against report text is part of the analytical layer, grounded by the mandatory-content-element checklist. Guardrail, pre-Evolution-A: availability is seeded and weighting absent, so it must refuse company-specific completeness claims. Every DCS and gap figure validated against tool output.

**Prerequisites.** Evolution A (weighted DCS and real assessment); document access; corpus embedding. **Acceptance:** post-Evolution-A, every DCS and gap figure traces to a tool call and cites the disclosure's missing content elements; pre-Evolution-A the copilot answers only on the real GRI taxonomy and declines company-specific completeness.
