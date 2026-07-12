## 9 · Future Evolution

### 9.1 Evolution A — Wire the margin-ratchet modeler to a real calculation (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's `Margin_adj = Margin_base − RatchetBps × KPI_met_flag` and the interactive `ratchetBps` slider are disconnected from the displayed ratchet path — `RATCHET_SIM` is hard-coded, so the modeler is a mock-up; the 20 loans are static literals (named borrowers real, terms illustrative), and the sole live computation is summing total volume. Evolution A makes the ratchet modeler real: compute the margin path from base margin, ratchet bps, and per-period KPI-met flags per §5, so moving the slider or changing a KPI outcome actually re-derives the margin trajectory and the interest-cost impact over the loan life — turning a display into a working GLP/SLLP structuring tool.

**How.** (1) A real ratchet function computing `Margin_adj` per testing period from the base margin, ratchet size, and KPI achievement, driving `RATCHET_SIM` from inputs rather than a hard-coded array. (2) The interest-cost saving/penalty aggregated over the loan tenor. (3) Loans user-supplied or sourced, with GLP/SLLP compliance checks (use-of-proceeds for green loans, KPI/SPT calibration for SLLs). (4) Covenant-design fields (KPI, threshold, testing frequency) feeding the ratchet.

**Prerequisites.** Editable/sourced loan terms; the hard-coded `RATCHET_SIM` replaced by the computed path. **Acceptance:** the ratchet path recomputes from base margin, bps, and KPI flags reproducing §5; the slider moves the margin trajectory; interest-cost impact aggregates over tenor; no hard-coded ratchet array remains.

### 9.2 Evolution B — Green-loan structuring copilot (LLM tier 2)

**What.** A copilot for lending and treasury teams: "structure an SLL with a 15bps ratchet on a Scope-1 intensity KPI — what's the borrower's interest saving if they hit the target every year, and does this meet SLLP?" tool-calls the Evolution A ratchet and compliance endpoints, narrating the margin path and GLP/SLLP alignment.

**How.** Tier-2 tool-calling over the ratchet/compliance endpoints; the grounding corpus is §5/§7 (ICMA GLP/SLLP, margin-ratchet mechanics, covenant design). The copilot's value is ratchet calibration and framework-compliance checking — whether the KPI/SPT structure meets SLLP and what the ratchet is worth to the borrower. Guardrail, pre-Evolution-A: `RATCHET_SIM` is hard-coded, so it must refuse margin-path figures until wired. Every bps and cost figure validated against tool output.

**Prerequisites.** Evolution A (the modeler is a mock-up today); corpus embedding. **Acceptance:** post-Evolution-A, every margin and interest-cost figure traces to a tool call reproducing the ratchet formula; the SLLP-compliance verdict cites the framework; pre-Evolution-A the copilot declines margin-path claims.
