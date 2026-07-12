## 9 · Future Evolution

### 9.1 Evolution A — Loan-tape-fed limits with Tier-1-relative Basel LEX view (analytics ladder: rung 1 → 2)

**What.** §7 gives this module a clean bill on method — the HHI (Σ share², 0–10,000 scale) and 80%/95% traffic-light logic are correct — and names the single gap precisely: limits and exposures are `sr()`-seeded, and the single-name list is 10 illustrative issuers. Evolution A feeds the real machinery real data: persist the limit framework and read current exposures from a portfolio table, then add the regulatory dimension §7.5 explicitly notes is missing — a Basel Large Exposures view measuring single-name exposure against Tier-1 capital (≤25% LEX gate) alongside the internal utilisation view.

**How.** (1) New `fi_limits` table (scope: sector/country/single-name, limit amount, review date) plus exposure aggregation from the shared borrower book built for `fi-client-portfolio-analyzer` (same CT-sprint data spine — one loan tape serving all five FI modules). (2) A `/concentration` route returning utilisation, traffic lights, both HHIs, and LEX ratios given an org's Tier-1 capital input. (3) Breach events written to a real `fi_breach_log` table on threshold crossing instead of the seeded 12-row register, giving the Breach History tab an actual audit trail.

**Prerequisites.** The shared FI borrower/loan-tape table (D0 demo seed acceptable initially); Tier-1 capital as an org-level setting. **Acceptance:** editing an exposure in the loan tape flips the corresponding traffic light and moves the HHI by the hand-computable amount; a >95% crossing appends a breach-log row.

### 9.2 Evolution B — Limit-breach explainer and what-if de-risking copilot (LLM tier 1 → 2)

**What.** A copilot on the Limit Dashboard that answers "why is Metals & Mining red, and what would fix it?" First slice is tier-1 explanation-only over already-rendered page state (utilisation arithmetic, HHI contribution of each sector — pure narration of computed numbers, viable pre-backend). The tier-2 slice runs what-ifs as tool calls against the Evolution A `/concentration` route: "if we sell down $400M of Shell, does the single-name light clear and where does sector HHI land?"

**How.** Tool schema wraps `/concentration` with an overrides parameter (exposure deltas), so counterfactuals are engine-computed, never LLM-arithmetic. System prompt grounded in this page's §7 (correct HHI convention, DOJ/FTC 2,500/1,500 thresholds, Basel LEX 25% rule already documented there). Answers must state that limits derive from the internal risk-appetite framework, not regulation, except where the LEX view applies.

**Prerequisites.** Tier-2 what-ifs require Evolution A (there is no endpoint today — the module is frontend-computed); tier-1 explainer requires only corpus embedding. **Acceptance:** a de-risking recommendation's before/after HHI and utilisation figures each match a logged tool call; the copilot refuses to estimate breach probability (nothing in the module computes it).
