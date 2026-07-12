## 9 · Future Evolution

### 9.1 Evolution A — Obligor-level granularity, discounted lifetime ECL, and FRTB (analytics ladder: rung 1 → 3)

**What.** A strong tier-A domain: one engine, six Basel-pillar sub-models (IFRS 9 ECL with climate
overlay, LCR/NSFR, parametric VaR, BIA/TSA operational, FATF AML, capital adequacy) with genuine
Basel/FATF reference constants from the shared reference-data layer and no PRNG. §7.5 names precise
methodology gaps: Stage 2 "lifetime" ECL is a single undiscounted maturity-point PD (not a
discounted marginal-PD sum under macro scenarios); the engine applies one rating/LGD/RW to the whole
book and **RWA ignores the rating input entirely (always 100%)**; market risk is Basel 2.5
(VaR+sVaR×3) with an ES ×1.4 normal approximation rather than FRTB ES-by-liquidity-horizon; and
BIA/TSA are the legacy approaches superseded by SMA. Evolution A adds obligor-level granularity
(per-name rating/LGD/RW), a discounted marginal-PD lifetime ECL, and an FRTB ES-based market charge.

**How.** `assess_credit_risk` accepts a holdings list so RWA respects each obligor's rating-mapped
risk weight and ECL sums discounted marginal PD×LGD×EAD per period under the climate scenario
(multiple macro paths for rung 2); `assess_market_risk` adds an FRTB standardised/IMA ES option
alongside the legacy VaR. Rung 3: calibrate the stylised PD term structures against rating-agency
default studies and validate LCR/NSFR outputs against published bank disclosures.

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `/credit-risk`,
`/capital-adequacy`, `/comprehensive`, `/aml-risk` all **failed**; the whole-book 100% RWA
(ignoring `avg_rating`) is a correctness bug to fix during granularity work. **Acceptance:** the
§7.4 ECL worked example (€98.667M, Stage 3 dominating) reproduces at single-obligor defaults; RWA
now varies with obligor rating; a two-name book with different ratings produces different capital;
the failing POST endpoints pass the harness.

### 9.2 Evolution B — Bank-risk analyst with tool-called Basel assessment (LLM tier 2)

**What.** A tool-calling analyst for bank risk teams: "compute our IFRS 9 ECL with a 2°C climate
overlay" (calls `/comprehensive` or `/credit-risk`), "what's our LCR and NSFR?" (`/liquidity-risk`),
"run VaR and stressed VaR on the trading book" (`/market-risk`), "check capital adequacy vs the MDA
trigger" (`/capital-adequacy`) — narrating the engine's exact Basel outputs, including the
surplus-to-MDA calculation and the climate PD-multiplier overlay.

**How.** Tool schemas from the domain's endpoints; the four GET reference endpoints (PD term
structures, LGD by collateral, Basel risk weights, TSA betas) are ideal RAG grounding for "what's
the Basel-IV IG corporate risk weight?" questions. The no-fabrication validator checks every ratio,
ECL and capital figure against tool output; because defaults are a fixed demo balance sheet (§7.5),
the copilot must state when it is using demo defaults versus caller-supplied balance-sheet data.
Composable into a Financial-desk orchestrator alongside `basel3_liquidity`.

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); Atlas +
reference corpus embedded (roadmap D3). **Acceptance:** every figure in an answer traces to an
engine tool call; the ECL and coverage ratio cited match `/credit-risk` output; a capital-adequacy
answer names the exact buffer stack (CET1 4.5% + CCB 2.5% + G-SIB + CCyB) driving the MDA trigger.
