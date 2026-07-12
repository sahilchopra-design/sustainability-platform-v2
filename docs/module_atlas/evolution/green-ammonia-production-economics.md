## 9 · Future Evolution

### 9.1 Evolution A — Reconcile static LCOA with the live calc and add electrolyser learning (analytics ladder: rung 2 → 3)

**What.** §7 confirms this is the analytical core of the ammonia cluster: 20 named real projects (NEOM, Murchison, HyDeal Ambition) with hand-entered parameters, and a genuine LCOA decomposition (`LCOA = (CAPEX·CRF + OPEX + E_price·10 MWh/t)/NH3_output_t`, CRF the standard capital-recovery factor). Its flagged defect is a consistency gap: each project's static `lcoa_usd_t` and the live cost-breakdown calculation can diverge — two numbers for the same quantity. Evolution A resolves this by making the live calc authoritative (deriving `lcoa_usd_t` from the components rather than storing it separately), and adds a benchmarked electrolyser-cost learning curve so the pathway-to-$300/t-by-2030 projection is computed from a learning rate rather than asserted.

**How.** (1) Delete the stored `lcoa_usd_t`; compute it from CAPEX/CRF/OPEX/electricity per project so the two can't diverge. (2) An electrolyser CAPEX learning curve (`cost(cum) = cost₀·(cum/cum₀)^(−b)`) driving the 2024→2030 cost decline, replacing a hard-coded trajectory. (3) Sensitivity of LCOA to electricity price (the dominant 60–70% term) and electrolyser efficiency, with the 10 MWh/t and 178 kg H₂/t stoichiometry documented per §8.

**Prerequisites.** Electrolyser deployment/cost reference series; the stored-vs-computed LCOA reconciled. **Acceptance:** every project's LCOA equals its component build-up (no divergent stored value); the cost-decline pathway responds to the learning rate; electricity-price sensitivity reproduces the §5 formula.

### 9.2 Evolution B — LCOA structuring copilot (LLM tier 1 → 2)

**What.** A copilot for developers and investors: "what's the LCOA for a 2 GW project at $30/MWh renewable power, and what electricity price gets us to $300/t?" narrates the LCOA decomposition and green-vs-grey premium from the atlas corpus, with tier-2 running the Evolution A LCOA and sensitivity endpoints so cost what-ifs are computed.

**How.** Tier 1 grounds on §5/§7 (the LCOA formula, cost-component shares, the $300/t 2030 target are documented), and since the LCOA calc is already genuine, an explainer over rendered page state ships first. Tier 2 tool-calls the LCOA endpoint with electricity-price/CAPEX/efficiency parameters, so the "what price hits $300/t" goal-seek is engine-computed. Every $/t figure validated against tool output; the copilot foregrounds the electricity-cost dominance.

**Prerequisites.** Evolution A's reconciled LCOA for consistent answers; corpus embedding. **Acceptance:** every LCOA and premium figure traces to a tool call or rendered state; the goal-seek returns an electricity price reproducing the $300/t target from the formula; the copilot never quotes a stored LCOA that conflicts with the computed one.
