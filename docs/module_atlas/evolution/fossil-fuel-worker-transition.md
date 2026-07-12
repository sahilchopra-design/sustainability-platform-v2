## 9 · Future Evolution

### 9.1 Evolution A — Build the per-worker transition-cost and I/O multiplier model (analytics ladder: rung 1 → 2)

**What.** §7 flags the mismatch precisely: the guide's Worker Transition Cost Model (`TransitionCost = RetrainingCost + IncomeSupportDuration·AvgWage + PensionLiabilityGap`) and `RegionalMultiplier = DirectJobs·InputOutputMultiplier` are not computed — the module blends real IEA World Energy Employment 2023 aggregates (correctly wired: coal 11.2M, oil&gas 11.4M, 26.9M at-risk, clean 35.4M) with 50 `sr()`-seeded fossil regions whose job-loss, retraining, wages, and union rates are random. Evolution A builds the two named models: a per-worker cost build-up from retraining duration, income-support bridge, and pension gap, and a regional employment multiplier applying input-output ripple factors to direct job losses — grounding the regional layer in real employment data instead of PRNG.

**How.** (1) A cost function `TransitionCost = retrain_months·retrain_cost + support_months·avg_wage + pension_gap`, parameterised per fuel type and region. (2) I/O multipliers from published regional input-output tables (or documented sectoral defaults) applied to IEA/national direct-job figures. (3) Bound `retrainingBoost` so retraining % can't exceed 100% (a §7.5-flagged bug), and seed regional job figures from national labour statistics rather than `sr()`.

**Prerequisites.** Regional employment data to replace the 50 seeded regions (all §7-flagged synthetic); I/O multiplier reference table. **Acceptance:** two regions with different wage/pension profiles produce different per-worker transition costs reproducing the §5 formula; the regional multiplier applies to real direct-job counts; retraining % is bounded.

### 9.2 Evolution B — Just-transition planning copilot (LLM tier 1 → 2)

**What.** A copilot for policymakers and transition-finance teams: "what's the transition cost and community employment impact of closing this coal basin by 2030, and how big should the just-transition fund be?" Tier-1 narrates the real IEA global/country employment aggregates and ILO Just Transition framing from the atlas corpus; tier-2 runs the Evolution A cost and multiplier models so the fund-sizing is computed.

**How.** Tier 1 grounds on §5/§7 (ILO Just Transition Guidelines, IEA WEE 2023, EU Just Transition Mechanism, IPCC AR6 Ch17 are cited), with a guardrail disclosing that regional figures are seeded until Evolution A lands — so pre-Evolution-A the copilot uses only the real IEA aggregates and refuses region-specific cost claims. Tier 2 tool-calls the cost/multiplier endpoints; every worker count, cost, and fund figure validated against tool output.

**Prerequisites.** Evolution A for regional cost claims; corpus embedding. **Acceptance:** post-Evolution-A, every transition-cost and employment-impact figure traces to a tool call; pre-Evolution-A, region-specific quantitative asks are refused while IEA-aggregate questions are answered from the wired real data.
