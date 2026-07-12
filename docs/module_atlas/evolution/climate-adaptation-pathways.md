## 9 · Future Evolution

### 9.1 Evolution A — Live NPV engine under user assumptions (analytics ladder: rung 1 → 2)

**What.** §7's key nuance: the catalogue's BCR/IRR/payback figures are stored
constants — the guide's "20-year NPV at 5% discount" describes offline derivation, not
on-page computation (the only live math is sorting, an SSP lookup, and
`bcr ≈ benefit_m/cost_m`). Evolution A makes the cost-benefit engine live: each of the
8 strategies gets an explicit benefit decomposition (avoided physical losses, avoided
business interruption, health co-benefits, carbon value — the components §5 already
names), and NPV/BCR/IRR/payback are computed from user-adjustable discount rate,
horizon, and hazard-frequency assumptions rather than read from the seed. The stored
4-point SSP curves become a multiplier applied to the hazard-loss component only —
which is what SSP sensitivity physically means — instead of opaque per-strategy BCR
overrides.

**How.** (1) `evaluateStrategy(strategy, {discountRate, horizon, sspMultiplier})`
returning the full cash-flow series; IRR by bisection; the current catalogue values
become the default-assumption outputs, regression-pinned so defaults reproduce today's
BCRs within rounding. (2) Benefit components sourced: the seed's aggregate `benefit_m`
decomposed using the UNEP/GCA benchmark ratios cited in §5, with provenance displayed.
(3) The maladaptation risk score gets its documented rubric (lock-in, equity,
emissions) as visible sub-scores.

**Prerequisites.** Component decomposition must be sourced, not invented — where the
literature gives only totals, show totals. **Acceptance:** changing the discount rate
from 5% to 8% reorders the BCR ranking observably; default settings reproduce the
catalogue's published BCRs (e.g. Mangrove 8.0).

### 9.2 Evolution B — Adaptation-investment copilot (LLM tier 1 → 2)

**What.** A copilot for prioritisation questions: "why does mangrove restoration beat
sea walls on BCR but not on effectiveness?", "which strategies hold up under
SSP5-8.5?" (the stored sensitivity curves — genuinely informative, monotonically
decreasing), "what maladaptation risks does managed retreat carry?" (the 5 documented
cases). Tier-2 what-ifs re-run `evaluateStrategy` with LLM-proposed assumptions once
Evolution A lands; this module has no backend routes, so tools are client-side.

**How.** Tier 1: atlas record plus the strategy catalogue and maladaptation cases as
corpus — the cases are real documented failures and make unusually good grounding
material. Tier 2: tool schema over the evaluator; the validator ties every BCR/NPV to
an invocation. The UNEP finance-gap figures ($124B/yr) cited with report vintage.

**Prerequisites.** Evolution A for what-ifs; pre-A the copilot must state that
catalogue BCRs are derived offline under fixed assumptions. **Acceptance:** a
discount-rate what-if answer matches the evaluator's return; asked which strategy a
specific city should fund, the copilot presents ranked evidence and declines to decide.
