## 9 · Future Evolution

### 9.1 Evolution A — Reference-class overrun modelling and learning curves (analytics ladder: rung 1 → 4)

**What.** §7 rates this one of the platform's more carefully built engines: a proper annuitized-capital LCOE model with capital-recovery factor, interest-during-construction compounding (`idcFactor = (1+w)^(build/2)`), and annuitized decommissioning, over six real reactor archetypes and benchmarked against eight competing technologies — internally unit-consistent throughout. The limitation is that it is a single deterministic point per reactor off hand-entered capex; the guide itself flags Vogtle/Hinkley overruns and 10–15% SMR factory-learning rates that the engine does not model. Evolution A adds the empirical uncertainty and learning dynamics.

**How.** (1) Reference-class forecasting: fit an overrun distribution from real nuclear construction history (the sibling `nuclear-market-intelligence` module already carries real Hinkley $46bn / Vogtle $35bn project data) and run LCOE as a distribution — P50/P90 LCOE, not one number — the rung-4 predictive step. (2) SMR learning curve: apply Wright's-Law factory learning (10–15% per §1, the same mechanism the `negative-emissions-tech` DAC curve uses) so NOAK LCOE is derived from FOAK cost and cumulative deployment, not hand-entered. (3) Keep the IEA/WNA-benchmarked technology comparison but source the competing-tech LCOE ranges to the IEA Projected Costs 2020 dataset named in §5.

**Prerequisites.** Real construction-cost history for the overrun fit (available from the market-intelligence module and public NEA data); a `bench_quant` pin on the existing deterministic LCOE (guard the good engine before extending it). **Acceptance:** LCOE reports P50/P90 reflecting overrun risk; SMR NOAK cost derives from a learning curve, not a constant; deterministic path reproduces the current pinned value.

### 9.2 Evolution B — LCOE what-if copilot for reactor economics (LLM tier 2)

**What.** A copilot answering "what's the LCOE of an AP1000 at 7% WACC and 90% capacity factor?", "how sensitive is nuclear LCOE to build time?", "at what carbon price does nuclear beat CCGT?" — executed against the LCOE engine, decomposing the result into the capex-annuity, IDC, O&M, fuel, and decommissioning terms the engine already separates.

**How.** Tool calls to a `POST /nuclear-lcoe/compute` endpoint wrapping the existing function; system prompt from this Atlas page's §5/§7.1 including the crucial $/kWh vs $/MWh unit reconciliation (§7.1 documents the `/1000` term and the `annualMwh` misnomer — the copilot must explain units correctly or it will mislead). The carbon-price crossover is a swept comparison against the eight benchmarked technologies. Sensitivity questions (WACC, build time, CF) are recomputations; fabrication validator matches every $/MWh to a tool response. Post-Evolution-A, the copilot can quote P50/P90 ranges and explain overrun risk.

**Prerequisites.** The compute endpoint; unit-handling correctness in the system prompt (the misnomer is a real trap). Ranges/overrun narration needs Evolution A. **Acceptance:** every LCOE figure traces to a tool call and is correctly labelled $/MWh; the carbon-crossover reflects real benchmark data; sensitivity directions are monotonic and correct.
