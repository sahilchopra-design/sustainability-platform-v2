## 9 · Future Evolution

### 9.1 Evolution A — Resolve the identity crisis: ship the actual factor optimiser (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag is total: the guide promises a Barra-style optimiser (`max αᵀw − λ wᵀΣw`, IC-weighted ESG/value/momentum/quality/macro alphas, tracking-error constraints), but `MultiFactorIntegrationPage.jsx` (1,585 lines) actually implements a 25-commodity lifecycle sustainability scorer over seeded synthetic scores, with "ML-flavoured" routines (decision stumps, diagonal-approx PCA, quintile-sort "K-Means") on fabricated inputs. Evolution A makes the module what its name and guide claim: a real multi-factor ESG portfolio optimiser as a first backend vertical.

**How.** (1) New engine `services/multi_factor_engine.py` + route: mean-variance optimisation via scipy (`scipy.optimize.minimize` with sector/single-stock/ESG-floor constraints — the roadmap names scipy optimisation as the rung-5 toolset; here it is the rung-1-done-right core). (2) Inputs from platform assets: `portfolios_pg` holdings, ESG scores from the refdata layer, and factor exposures estimated from ingested market-data history rather than invented. (3) The commodity-lifecycle content — the genuinely interesting true-cost table (`marketPrice + env + social + health`) — should be split out or explicitly renamed, not deleted; today it squats on the wrong module ID and misleads the Atlas.

**Prerequisites.** Decision on the commodity scorer's destination (rename vs migrate); the `genScores` PRNG fabrication must not survive into any renamed module — it violates the platform's purged random-as-data rule. **Acceptance:** optimiser reproduces a hand-computable 3-asset case in `bench_quant`; ESG-floor constraint binds visibly (raising the floor changes weights).

### 9.2 Evolution B — Portfolio-construction analyst over the new optimiser (LLM tier 2)

**What.** Once Evolution A exists, a tool-calling analyst that runs constrained optimisations conversationally: "tilt max 2% tracking error toward quality and ESG, cap energy at 8%", then explains the resulting weights via the optimiser's own attribution output (which constraints bound, marginal contribution to risk per factor). Until then, no LLM layer should ship — §7 shows the current page's numbers are seeded-synthetic, and a copilot narrating fabricated factor scores would launder them into apparent authority.

**How.** Tool schema over the new `POST /optimize` endpoint with the constraint set as typed parameters; system prompt from the rewritten Atlas §5 (Grinold-Kahn/Barra references are already the named standards). The analyst's explanations must derive from returned diagnostics — binding-constraint list, factor covariance contributions — with the no-fabrication validator matching every weight and risk number to the tool response. Mutating actions (saving a rebalance to `portfolios_pg`) gate behind explicit confirmation per the roadmap's Tier-2 RBAC pattern.

**Prerequisites (hard).** Evolution A in full — this is the one module in the batch where the LLM evolution has a strict dependency, because there is currently no real analytical surface to ground on. **Acceptance:** every quoted weight/TE/alpha traceable to an optimiser response; asking "what's the expected return?" when no alpha model is configured yields a refusal, not a Barra-flavoured guess.
