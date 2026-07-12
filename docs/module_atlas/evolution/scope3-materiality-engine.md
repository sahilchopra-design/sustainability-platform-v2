## 9 · Future Evolution

### 9.1 Evolution A — Portfolio-specific materiality with a threshold-honest roadmap (analytics ladder: rung 1 → 2)

**What.** §7 describes a static lookup: 6 sectors × 15 categories of hand-authored materiality/DQ constants, no per-company computation at all (a tier-A label the page doesn't earn), a roadmap whose cost ($0.4M/DQ-point) and benefit (12%/DQ-point) multipliers are uncited synthetic values, and a "Top 5" that ignores the platform's own 5%-of-total materiality threshold — a sector with 3 material categories still shows 5. Evolution A computes materiality from the user's actual footprint.

**How.** (1) Materiality per category from `scope3-engine`'s per-company estimates aggregated over the user's portfolio or entity: `materiality_c = emissions_c / Σ emissions` — real shares replacing sector constants, with the hand-authored sector table retained as a benchmark overlay (its legitimate role). (2) The threshold implemented: roadmap membership by the documented 5% rule (plus SBTi's 67%-coverage requirement as a second lens), however many categories qualify. (3) DQ from the method→band mapping the Scope 3 cluster standardises on, per category per entity. (4) Roadmap economics re-based: cost per DQ-point parameterised by category supplier count and data-collection mode with cited ranges, or presented as user inputs — §7.6 notes real program costs vary by orders of magnitude, so a single multiplier is unrescuable. (5) Small backend route so the ranking is pinnable.

**Prerequisites.** Scope 3 cluster's shared estimate output (sibling dependency); threshold rules documented. **Acceptance:** materiality ranks change when the portfolio changes; roadmap length varies with how many categories clear 5%; every roadmap cost figure is either cited or user-entered — no orphan multipliers.

### 9.2 Evolution B — Materiality-assessment copilot for CSRD/SBTi scoping (LLM tier 1 → 2)

**What.** Materiality assessment is a documented judgment process (CSRD double-materiality, SBTi boundary setting) where users need both computation and justification text: "which Scope 3 categories must be in our SBTi boundary, and draft the exclusion justification for the ones below threshold", "compare our computed materiality profile against the sector benchmark and explain the divergences".

**How.** Tier 1: RAG over GHG Protocol category descriptions and SBTi/ESRS boundary rules (chunked with clause anchors) for the process questions. Tier 2: boundary determinations combine computed shares (tool calls) with the cited threshold rules — "Cat 9 at 2.1% of total, below the 5% threshold; cumulative coverage without it 94%, above SBTi's 67% floor" — and exclusion justifications are drafted from exactly those computed facts, the format assurance reviewers expect. Benchmark-divergence explanations use the sector overlay with its hand-authored provenance stated. Guardrails: boundary advice cites the rule applied; the copilot never asserts a category is immaterial without the computed share in hand.

**Prerequisites.** Evolution A's computed shares; rule corpus. **Acceptance:** every boundary determination quotes the share and the rule; exclusion drafts contain only computed facts; benchmark comparisons label the overlay's provenance.
