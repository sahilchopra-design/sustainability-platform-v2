## 9 · Future Evolution

### 9.1 Evolution A — Per-period LLCR/PLCR series and calibrated NGFS/market inputs (analytics ladder: rung 3 → 4)

**What.** This is the platform's flagship tier-A vertical — a 2,425-line PRNG-free engine with 8 endpoints (`/run`, `/scenario-matrix`, `/consolidate`, `/sensitivity`, Halton-QMC `/simulate`, `/solve`, `/solve-frontier`), real MACRS tables and an NGFS Phase 5 extract. Evolution A closes its own documented gaps and moves it toward predictive inputs: (1) implement the per-period `LLCR_t`/`PLCR_t` series the route's docstring promises but the code reduces to a single COD-vintage scalar (§7's flagged docstring↔code mismatch); (2) refresh the NGFS extract from the IIASA Scenario Explorer, whose header itself says "approximate/illustrative — refresh for production precision," replacing linear 5-year interpolation with the published annual paths; (3) replace the diversification proxy (explicitly "NOT an estimated covariance") in `/consolidate` with a covariance estimated from the ingested market/merchant price history, making portfolio DSCR distribution-aware.

**How.** `_evaluate` gains an `llcr_t[]`/`plcr_t[]` array per period (PV of remaining CFADS over debt balance, discounted at tranche blended rate); NGFS refresh becomes a 20th-ingester job writing a versioned scenario table the engine reads; `/consolidate` accepts a correlation matrix estimated server-side with an honest fallback to the labeled proxy.

**Prerequisites.** IIASA download access and vintage pinning; merchant price history in the DB deep enough to estimate correlations (else the proxy stays, labeled). **Acceptance:** bench_quant extended with an LLCR-series reference case; scenario-matrix outputs change (and say why) when the NGFS vintage field changes; docstring and code now agree.

### 9.2 Evolution B — Structuring analyst that drives the solver conversationally (LLM tier 2)

**What.** The module is the ideal tier-2 flagship because every capability is already an endpoint: "size senior debt so DSCR stays above 1.30 under Net Zero 2050, then show me the equity-IRR cost of that headroom" becomes `/solve` (bisection on 6 instruments × 4 metrics), `/scenario-matrix`, and `/solve-frontier` tool calls, narrated with the engine's own covenant and waterfall outputs. The copilot also explains model mechanics from the atlas record — the deepest §7 in the atlas (19 subsections) is the grounding corpus.

**How.** Tool schemas from the 8 existing OpenAPI operations, all read-only POSTs computing transient models (no mutation gating needed); per-module system prompt carries §7.19's limitations verbatim (illustrative templates, approximate NGFS extract, scalar-IRR approximations) so the copilot qualifies bankability claims. Multi-step chains (run → solve → frontier) log every call for the "show work" expander; the fabrication validator checks each IRR/DSCR figure against tool outputs.

**Prerequisites.** None hard — the backend exists and is CI-guarded; prompt-caching for the large module context (roadmap Tier-1 economics). **Acceptance:** a three-step structuring dialogue produces only tool-traceable numerics; asked for a P50 construction-delay probability (not modeled), the copilot refuses and points to the QMC uncertain-input table as the supported alternative.
