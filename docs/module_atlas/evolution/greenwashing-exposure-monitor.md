## 9 · Future Evolution

### 9.1 Evolution A — Portfolio-weighted greenwashing VaR with calibrated enforcement base rates (analytics ladder: rung 1 → 3)

**What.** §7 flags that the guide's `GW_VaR = Σ_i (w_i × P_enforcement_i × FinancialImpact_i)` cannot be computed as built — all 150 entities are `sr()`-seeded (green-revenue claimed/actual, enforcement probability, fines, controversies), there are no portfolio weights (the page sums raw figures rather than weighting), only the 5 regulators' names/jurisdictions/fine ranges are real, and the backend `greenwashing_engine.py` is not called (§8 marked "not yet implemented"). Evolution A builds the real VaR: portfolio holdings with weights, per-holding enforcement probability calibrated from actual enforcement base rates (regulator activity by jurisdiction/sector), and financial impact (fine + reputational loss, the cited 3–8% market-cap hit from precedents) — producing a genuine probability-weighted expected loss.

**How.** (1) Portfolio holdings with weights from `portfolios_pg`. (2) Enforcement probability per holding from the claim-vs-reality gap (via the shared greenwashing engine) scaled by calibrated jurisdiction/sector base rates from the real regulator table. (3) Financial impact from precedent-based fine ranges plus a reputational market-cap component. (4) `GW_VaR = Σ w_i·P_i·Impact_i` per §5, replacing the raw sum.

**Prerequisites.** Portfolio weights (shared portfolio store); enforcement base rates calibrated from regulator precedents; the shared engine wired; the 150 seeded entities replaced. **Acceptance:** GW_VaR computes as a weight × probability × impact sum reproducing §5; enforcement probabilities are calibrated to real base rates, not seeded; no `sr()` entity drives the VaR.

### 9.2 Evolution B — Greenwashing-exposure copilot (LLM tier 2)

**What.** A copilot for portfolio risk teams: "what's our portfolio greenwashing VaR, which holdings drive it, and how would divesting the top-3 change it?" tool-calls the Evolution A VaR endpoint, decomposes the expected loss by holding, and runs divestment what-ifs.

**How.** Tier-2 tool-calling over the GW-VaR endpoint (with holding overrides for what-ifs); the grounding corpus is §5/§7 (the portfolio-VaR formula, enforcement-precedent impact ranges, the real regulator table). The copilot's value is portfolio-level enforcement-risk quantification and mitigation. Guardrail, pre-Evolution-A: entities are synthetic and there are no portfolio weights, so it must refuse VaR figures and answer only on the real regulator/fine-range facts. Every VaR and contribution figure validated against tool output.

**Prerequisites.** Evolution A (no weighted VaR today); portfolio weights; calibrated base rates; corpus embedding. **Acceptance:** post-Evolution-A, every VaR and holding-contribution figure traces to a tool call reproducing the §5 sum; the divestment what-if recomputes the VaR; pre-Evolution-A the copilot declines VaR claims and cites only the real regulator data.
