## 9 · Future Evolution

### 9.1 Evolution A — Multi-period amortising cash-flow waterfall with curve-derived greenium (analytics ladder: rung 1 → 2)

**What.** §7 documents that this module's `calcWaterfall` is a genuine reverse-order sequential-loss allocation, but a single-period, static-loss one — it applies one annualised loss figure in a single pass, with no multi-period amortisation and no prepayment-driven balance run-off (§8 marked "not yet implemented"); pool composition percentages are `sr()`-seeded and the tape/tranche structure and issuance series are hard-coded illustrative values, and greenium (`YTM_conventional − YTM_green`) is a stored figure not a spread differential. Evolution A builds the production waterfall: a multi-period model amortising the collateral pool over the deal life with prepayment (CPR) and default (CDR) vectors, allocating losses period-by-period through the tranche structure — plus a curve-derived greenium from matched conventional-vs-green ABS/RMBS/CLO tranches.

**How.** (1) Extend `calcWaterfall` to a multi-period engine with CPR/CDR vectors, sequential principal amortisation, and period-by-period loss allocation. (2) A real collateral tape (or user-supplied) replacing the seeded pool percentages. (3) Greenium from a matched-tranche yield differential (reusing FRED/market curves the pricing-desk sibling pulls) rather than a stored figure. (4) EU-GBS applicability checks per the use-of-proceeds waterfall.

**Prerequisites.** A collateral tape with amortisation parameters; CPR/CDR assumptions; a conventional-tranche yield source; the seeded pool percentages replaced. **Acceptance:** the waterfall amortises over multiple periods with prepayment run-off (not a single pass); tranche losses reflect period-by-period allocation; greenium derives from a matched-tranche differential; no `sr()` pool percentage feeds the structure.

### 9.2 Evolution B — Green-ABS structuring copilot (LLM tier 2)

**What.** A copilot for structured-finance desks: "run this green solar-ABS through the waterfall at 8% CDR and 15% CPR, size the mezz tranche, and estimate the greenium vs conventional" tool-calls the Evolution A waterfall and greenium endpoints, narrating tranche cash flows and EU-GBS applicability.

**How.** Tier-2 tool-calling over the multi-period waterfall and greenium endpoints; the grounding corpus is §5/§7 (green ABS/RMBS/CLO structures, use-of-proceeds waterfall, SPV structuring, greenium, EU GBS). The copilot's value is tranche structuring under prepayment/default scenarios plus greenium estimation. Guardrail, pre-Evolution-A: the waterfall is single-period and greenium stored, so it must flag those limitations and refuse multi-period cash-flow claims. Every cash-flow and bps figure validated against tool output.

**Prerequisites.** Evolution A (single-period waterfall, seeded pool today); collateral-tape data; corpus embedding. **Acceptance:** post-Evolution-A, every tranche cash-flow and greenium figure traces to a tool call; the CPR/CDR what-ifs change the amortisation; pre-Evolution-A the copilot declines multi-period and greenium claims.
