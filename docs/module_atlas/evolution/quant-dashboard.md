## 9 · Future Evolution

### 9.1 Evolution A — Correlated VaR, honest ITR, and engine reconciliation (analytics ladder: rung 2 → 3)

**What.** This page is unusually rigorous for tier B — real portfolio + `GLOBAL_COMPANY_MASTER` fundamentals, a correct Clayton-copula tail-dependence derivation (§7.4 verifies λ_L and joint-crash math by hand), seeded reproducible PRNGs. §7.5 pins its three defects precisely: the MC VaR draws independent normals (no correlation matrix) so diversification is overstated relative to the copula tab's own ρ, the ITR "R²" is fabricated (compared to a constant then clamped into 0.55–0.92), and the two risk engines are unreconciled. Evolution A fixes all three and moves the engines server-side for pinning.

**How.** (1) VaR gains a single-factor Gaussian correlation structure using the same ρ the copula tab derives — one consistent dependence assumption across both engines, with the reconciliation stated in the payload. (2) The ITR block is relabelled what it is (a transparent linear scorecard) and the fabricated R² deleted immediately (this is a Wave-style honesty fix, cheap and urgent); the §8 carbon-budget ITR spec (MSCI/TCFD-PAT over-/under-shoot method) is then implemented behind `POST /itr` with the scorecard kept as documented fallback. (3) Port `runMCVaR`/`runCopulaTailRisk` to `api/v1/routes/quant_dashboard.py` and pin the §7.4 worked example (ρ=0.25 → λ_L=16.4%, jointCrashP=1.28%) in bench_quant.

**Prerequisites.** None hard for the R²/label fix; carbon-budget data (sector budgets, company projections) for the real ITR. **Acceptance:** correlated VaR95 exceeds today's independent-normal VaR95 for the same book; no clamped R² anywhere; bench reproduces the copula example exactly.

### 9.2 Evolution B — Quant-risk explainer with method-aware what-ifs (LLM tier 2)

**What.** The dashboard's outputs (CVaR, λ_L, ITR) are exactly the numbers a PM must defend in risk committee. The copilot explains them mechanically from the engines' own decompositions — "tail dependence is 16.4% because portfolio ESG of 72 lowered ρ to 0.25; here's the τ→θ→λ_L chain" — and runs what-ifs ("drop the two Energy names, rerun VaR and tail risk") as paired tool calls against the Evolution-A endpoints, diffing before/after.

**How.** Tier-2 tool schemas from `/var`, `/copula-tail`, `/itr`; the system prompt is grounded in §7.1–7.4 (the formulas and worked example are the corpus) plus §7.5's caveats, so the copilot always distinguishes the scorecard ITR from a carbon-budget ITR and notes the Gaussian single-period nature of the VaR when asked about regulatory comparability (FRTB uses expected shortfall over liquidity horizons — a distinction the copilot must make rather than blur). Every numeric validated against tool outputs; questions about the guide's ESG long-short factor alpha are refused, since §7 documents that factor model was never this module's content.

**Prerequisites.** Evolution A endpoints; golden Q&A from the §7.4 example. **Acceptance:** the copilot reproduces the τ→θ→λ_L chain with live numbers, and correctly declines to quote a "factor Sharpe" the module does not compute.
