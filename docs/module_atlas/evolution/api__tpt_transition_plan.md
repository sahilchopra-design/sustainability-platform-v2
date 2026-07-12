## 9 · Future Evolution

### 9.1 Evolution A — Evidence-linked scoring and honest cross-framework mapping (analytics ladder: rung 1 → 2)

**What.** The engine assesses transition plans against the UK TPT Disclosure Framework (Oct 2023),
restructured as 6 elements / 20 sub-elements with documented weights (Implementation Strategy 0.25,
Foundations and Metrics & Targets 0.20 each, Engagement 0.15, Governance and Finance 0.10), rolling
to a quality tier with gap analysis. One §5 detail needs fixing: the cross-framework alignment is
computed as flat scalings of the overall score — `tcfd_pct = overall × 0.9`, `s2_pct = × 0.85`,
`esrs_pct = × 0.88` — synthetic constants presented as framework alignment, exactly the pattern the
platform's fabrication discipline targets. Sub-element scores are caller-asserted. Evolution A
grounds both.

**How.** (1) Replace the ×0.9/×0.85/×0.88 scalings with a real element-to-requirement mapping:
TPT sub-elements map to specific TCFD recommendations, ISSB S2 paragraphs, and ESRS E1 datapoints —
compute alignment from which mapped items are actually covered, or return honest nulls. (2)
Verify the metric-bearing sub-elements (4.1 GHG targets, 4.3 progress, 6.1 CapEx) against the
platform's `net_zero_targets`, glidepath, and emissions engines with an evidence tier. (3) Persist
assessments for plan-quality trajectories. (4) Bench-pin the 6-element weighting and tier mapping.

**Prerequisites.** A TPT→TCFD/S2/ESRS mapping table (the `/ref/cross-framework` scaffold exists);
engine linkages for metric verification. **Acceptance:** cross-framework percentages derive from
mapped-item coverage, never a scalar on overall; metric sub-elements carry evidence tiers;
weighting and tiers bench-pinned; assessments persist.

### 9.2 Evolution B — Transition-plan review copilot (LLM tier 2)

**What.** A copilot that reviews a transition plan — "your plan scores 61 (tier: emerging):
Implementation Strategy is weakest because 2.2 Dependencies and 2.4 Operations are undisclosed;
your interim targets don't meet the guidance cadence; here's the gap-closure order" — every score
and gap from `/assess` and `/gap-analysis` tool calls.

**How.** Three POST endpoints (`/assess`, `/score-element`, `/gap-analysis`) plus five reference
GETs (the 20 sub-elements, entity types, quality tiers, cross-framework, interim-targets guidance)
— a complete TPT grounding corpus, so the copilot cites the exact sub-element (e.g. "6.3 Transition
Finance Mobilised") behind each gap. The entity-type endpoint tailors the review for corporates vs
FIs. Chains naturally with `net_zero_targets` (target validation) and `tcfd_metrics`/`issb_s2`
(disclosure migration). Node for a transition-finance or stewardship desk.

**Prerequisites.** Evolution A's cross-framework fix before the copilot cites TCFD/S2/ESRS
alignment percentages — narrating the ×0.9 scalar as framework alignment would launder a synthetic
number. **Acceptance:** every element score, tier, and gap traces to a tool response; cross-
framework claims are mapping-derived or explicitly refused; the copilot discloses that sub-element
statuses are self-asserted and refuses to endorse a plan as "TPT-aligned" beyond the computed tier.
