## 9 · Future Evolution

### 9.1 Evolution A — Executable parametric-payout and debt-swap models over the curated data (analytics ladder: rung 1 → 2)

**What.** §7 credits this as a curated real-data reference dashboard — 39 SIDS with real HDI/debt/GDP, real parametric pools (CCRIF/ARC/PCRIC/SEADRIF), real debt-for-nature swaps (Belize/Ecuador/Seychelles), real hurricane loss data — but with no PRNG and no computed model: the "engine" is sort and filter, and the guide's binary parametric-payout formula (`Payout = Trigger_exceeded × Coverage`) plus the debt-swap fiscal-space calculator are named but unbuilt (loss/payout figures are stored inputs, sea-level-risk scores are hand-authored index values). Evolution A makes the two headline models executable: a parametric trigger simulator that computes payouts from a hazard index against coverage and attachment, and a debt-swap modeler that computes fiscal space freed (`debt_restructured × (old_rate − new_rate)` and conservation-pledge sizing) rather than displaying stored deal outcomes.

**How.** (1) A payout function over the CCRIF/ARC index structure: given a modelled hazard index and the pool's trigger/exhaustion points, compute the binary/graduated payout. (2) A debt-swap calculator taking haircut, tenor, and coupon reduction to output annual fiscal space and NPV of savings. (3) Optionally ground sea-level-risk scores in an elevation/SLR dataset rather than the hand-authored index.

**Prerequisites.** The curated reference data stays authoritative (a strength, not to be discarded); a hazard-index input source for payout simulation. **Acceptance:** changing the trigger threshold or coverage changes the computed payout; the debt-swap modeler's fiscal-space output reproduces its formula from inspectable inputs — not a stored deal figure.

### 9.2 Evolution B — SIDS climate-finance advisory copilot (LLM tier 1 → 2)

**What.** A copilot for DFI and sovereign-risk users: "for this Pacific SIDS, what parametric coverage and debt-swap structure would close its adaptation-finance gap?" Tier-1 narrates the real SIDS vulnerability, pool membership, and precedent swaps from the atlas corpus; tier-2 runs the Evolution A payout and debt-swap models to size instruments.

**How.** Tier 1 is unusually credible here because §7 confirms the underlying data is accurate authoritative reference content (UNDP/IMF/CCRIF/actual deals) — the copilot cites real pools and precedent transactions. Its guardrail: pre-Evolution-A it must present loss/payout figures as stored reference values, not model outputs, and refuse "what would our payout be" as a computation. Tier 2 tool-calls the payout/debt-swap endpoints so instrument sizing is engine-computed.

**Prerequisites.** Evolution A for quantitative sizing; corpus embedding. **Acceptance:** every SIDS statistic cited traces to the curated reference data; post-Evolution-A, payout and fiscal-space figures trace to tool calls; pre-Evolution-A the copilot declines to compute payouts and points to precedent deals instead.
