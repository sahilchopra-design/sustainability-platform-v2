## 9 · Future Evolution

### 9.1 Evolution A — Live ND-GAIN/IMF inputs and reconciled composite weights (analytics ladder: rung 1 → 3)

**What.** This tier-B module runs a genuine, reproducible composite computed live in-browser over 25 hand-typed but directionally-realistic sovereign inputs (Norway best, Nigeria worst across all 5 dimensions), with no `sr()`. Two issues limit it: the §7 flag documents that the code's 5-term weighting (`(10−physRisk)×0.30 + transReady×0.25 + fiscRes×0.20 + ndcAmb×0.15 + ndGain/10×0.10`) differs from the guide's 4-term formula and inverts the transition sign, and all inputs are a static snapshot rather than live ND-GAIN/IMF/NGFS feeds. Evolution A grounds the inputs in real data and settles the formula.

**How.** (1) Reconcile guide↔code: pick one weighting (the code's 5-term version is defensible), update the other, and document the transition-sign convention explicitly. (2) Ingest the real source indices the module names: ND-GAIN publishes country scores and readiness/vulnerability sub-indices (free); IMF WEO provides GDP/debt; recompute `physRisk`/`fiscRes` from these rather than hand-typing. (3) Apply NGFS scenario adjustments (the `NGFS_SCENARIOS` table's physAdj/transAdj/spreadBps) to produce scenario-conditioned composites and implied spread deltas, moving from a static score to a scenario tool. (4) Expand coverage beyond 25 countries as ND-GAIN covers ~190.

**Prerequisites.** ND-GAIN and IMF WEO ingestion (both free); the composite reconciliation is a documentation-plus-one-edit task. **Acceptance:** `ndGain` and macro inputs trace to a dated source vintage; the composite formula matches between guide and code; scenario selection changes the composite and spread delta.

### 9.2 Evolution B — Sovereign climate-intelligence copilot (LLM tier 1)

**What.** A copilot for the sovereign-fixed-income analyst: "why does Norway outscore Nigeria on climate intelligence?", "how does the hot-house scenario change this country's score?", "rank my sovereign universe by fiscal resilience" — answered from the live composite and the NGFS scenario adjustments, decomposing the score into its 5 weighted dimensions.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sovereign-climate-intelligence/ask`, corpus = this Atlas record (the composite formula, the 5-dimension structure, ND-GAIN/NGFS framework notes) plus live page state. Score explanations attribute the composite to physical/transition/fiscal/NDC/ND-GAIN contributions; scenario answers narrate the applied NGFS adjustments; rankings narrate deterministic sorts. Refusal for countries outside the covered set.

**Prerequisites.** Evolution A's reconciled formula so the copilot's decomposition matches what the page computes; live inputs so it isn't narrating a frozen snapshot. **Acceptance:** every dimension contribution in a score explanation sums to the displayed composite; scenario answers cite the NGFS adjustment applied; a country outside coverage returns a scoped refusal.
