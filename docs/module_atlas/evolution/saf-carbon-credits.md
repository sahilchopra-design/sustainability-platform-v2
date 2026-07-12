## 9 · Future Evolution

### 9.1 Evolution A — Cited conversion factors and cross-module credit consistency (analytics ladder: rung 2 → 3)

**What.** The revenue-stacking chain is genuinely grounded — `baselineCI = 89 gCO₂eq/MJ` is the real ICAO CORSIA fossil baseline, and the stack ($SAF + IRA §40B + ISCC+ + CORSIA + EU ETS) computes from stated constants — but §7.5 flags three issues: the `ciByPathway` values and the `0.0025` CORSIA-credit scaling constant are uncited (illustrative, not audited conversion factors), the 20-project market universe is seeded price/volume over realistic bases, and the IRA §40B credit is hard-coded flat at $1.50/gal — inconsistent with the CI-scaled formula the platform's own `saf-policy-mandate` module implements for the same credit, an explicitly flagged cross-module gap. Evolution A sources the constants and unifies the credit logic.

**How.** (1) Adopt one shared §40B implementation: the CI-reduction-scaled statutory formula as a shared service both SAF modules call — the atlas interconnection principle applied to a documented divergence. (2) Cite or derive the CORSIA factors: `ciByPathway` mapped to ICAO CORSIA default life-cycle values per approved pathway (published tables), and the 0.0025 scaling replaced by the explicit unit chain (gallons → MJ → tCO₂e) so the credit quantity is auditable arithmetic. (3) Credit-market prices become dated reference rows (registry/market publications) instead of seeded variation. (4) `POST /api/v1/saf-credits/stack` serves the full stack per project with per-leg citations.

**Prerequisites.** ICAO default-CI table transcription; coordination with `saf-policy-mandate` on the shared credit service. **Acceptance:** both SAF modules return identical §40B values for identical inputs; the CORSIA credit reproduces from the explicit unit chain; every stack leg carries a source.

### 9.2 Evolution B — Revenue-stack advisor for producers (LLM tier 2)

**What.** SAF producers face a genuinely confusing multi-registry landscape (CORSIA CEF vs ISCC+ vs Verra vs EU ETS interaction, double-counting restrictions). The copilot advises: "we produce 40kt HEFA-UCO in Rotterdam — which credits stack legally, what's the combined $/gal, and where does EU RED double-counting bite?", running the stack endpoint and grounding eligibility answers in registry-rule reference content.

**How.** Tier-2 tool calls to `POST /stack` for the numbers; eligibility/mutual-exclusivity reasoning grounded in chunked registry rules (CORSIA eligibility criteria, ISCC+ system documents — public) with clause citations, because stacking legality is exactly where hallucinated confidence causes damage. The copilot separates computed economics from regulatory interpretation, tagging the latter with a verify-with-counsel note. Scenario sweeps (credit prices, CI improvements) are parameterised tool calls.

**Prerequisites (hard).** Evolution A's cited factors and unified credit logic — advising on a stack whose legs disagree across platform modules would be incoherent; registry texts chunked. **Acceptance:** stack figures match endpoint output with citations per leg; eligibility claims quote registry clauses; double-counting warnings appear whenever mutually exclusive legs are combined.
