## 9 · Future Evolution

### 9.1 Evolution A — Build the Markowitz optimizer the guide claims (analytics ladder: rung 1 → 5)

**What.** §7 flags this as one of the emptier tier-A claims: the guide (EP-CQ1) describes a Markowitz mean-variance optimizer ("minimize σ²(w) subject to return ≥ target, taxonomy_aligned ≥ 80%, duration ±0.5 yr" over 50 green bonds), but no optimizer, covariance matrix, quadratic solver, or 50-bond universe exists — the efficient frontier, greenium table, and weights are static literals (named issuers real, quantities illustrative), and the taxonomy filter can even produce a sub-100% displayed portfolio. The §8 model spec explicitly documents the optimiser as "not yet implemented." Evolution A builds it: a real quadratic-programming optimizer (scipy, per the roadmap's rung-5 prescriptive tooling) minimising portfolio variance from an estimated covariance matrix, subject to the taxonomy-alignment, return, and duration constraints — the module jumps from static display straight to a prescriptive engine.

**How.** (1) A bond universe with returns/durations/alignment and an estimated return-covariance matrix (from price history or a factor model). (2) A scipy quadratic solver producing the efficient frontier and the constrained optimal weights, with the greenium modelled as a return drag so the frontier shift is real. (3) Duration-matching and taxonomy-≥80% as hard constraints; turnover/transaction costs as options.

**Prerequisites.** A real bond universe with a covariance estimate (price history or factor model); scipy optimisation (in-environment). Because §8 documents this as unimplemented, Evolution A is genuinely first-build, not enhancement. **Acceptance:** the optimizer returns weights that minimise variance subject to the three constraints (verifiable against the QP KKT conditions); the frontier shifts with the greenium drag; the taxonomy filter never yields a sub-100% portfolio.

### 9.2 Evolution B — Portfolio-construction copilot (LLM tier 2)

**What.** A copilot for green-bond PMs: "build me a minimum-variance green portfolio yielding ≥4% with 85% taxonomy alignment and duration near 6 years, then show the greenium cost of the alignment constraint" tool-calls the Evolution A optimizer and narrates the frontier and constraint trade-offs.

**How.** Tier-2 tool-calling over the optimizer endpoint with target return, alignment floor, and duration band as tool parameters — a natural prescriptive tool surface. The grounding corpus is §5/§7 (mean-variance theory, the greenium-as-return-drag effect, taxonomy constraints). The copilot's value is explaining the cost of green constraints (how much return/variance the 80% alignment floor costs). Every weight, return, and variance figure validated against tool output.

**Prerequisites.** Evolution A (there is no optimizer today — this is the hardest prerequisite in the batch); RBAC-scoped universe; corpus embedding. **Acceptance:** every weight and frontier point in a copilot answer traces to an optimizer tool call; the "cost of the alignment constraint" answer reproduces the frontier shift between constrained and unconstrained runs; pre-Evolution-A, optimisation requests are refused.
