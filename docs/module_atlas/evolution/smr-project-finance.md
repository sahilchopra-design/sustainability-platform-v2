## 9 · Future Evolution

### 9.1 Evolution A — Design-specific learning rates, IRA/loan-guarantee wiring, and right-skewed cost risk (analytics ladder: rung 2 → 3)

**What.** This is a genuine numerical project-finance engine — Wright's-Law learning curve, capital-recovery-factor LCOE, and a textbook Newton-Raphson IRR solver over 6 real named SMR designs with hand-curated public cost parameters. It already runs Monte Carlo (200 draws), so it sits at rung 2. Three §7.6 defects hold it back: the learning exponent is hard-coded at −0.12 (≈8% LR, below the guide's own cited 10–15% NEA range) and applied identically to every design; the IRA §45U PTC and DOE Title XVII loan guarantees are shown descriptively but never enter the cash flows; and the MC shocks are symmetric ±15% uniform, understating the documented right-skew of FOAK nuclear overruns (Sovacool et al. show median FOAK overruns >100%).

**How.** (1) Make the learning rate a per-design configurable parameter (microreactors like eVinci vs near-gigawatt Rolls-Royce SMR plausibly differ), calibrated to the cited NEA 10–15% band. (2) Wire §45U PTC (2.6¢/kWh for the credit window) as a revenue term and the Title XVII guarantee as a reduced debt-margin/WACC term in `cashflows` — the financing tabs already describe both. (3) Replace uniform MC shocks with a right-skewed distribution (lognormal or triangular with long upper tail) fit to published FOAK overrun data, so P90 capex reflects real tail risk. (4) Refine the IDC and debt-service approximations toward a drawdown-schedule and true-annuity basis.

**Prerequisites.** Sourcing the per-design LR priors and an overrun distribution from the nuclear cost literature; the §45U credit window/phase-out rules. **Acceptance:** two designs configured with different LRs produce different NOAK costs; toggling the PTC changes equity IRR; the MC capex distribution is visibly right-skewed with P90 ≫ mean.

### 9.2 Evolution B — SMR financing-desk copilot (LLM tier 1)

**What.** A copilot for the analyst workflow the module already structures: "what LR does NuScale need to hit NOAK viability?", "how much does the §45U PTC move BWRX-300's IRR?", "which design has the most debt-service headroom under a 30% capex overrun?" — answered from the engine's LCOE/IRR/Monte-Carlo outputs and the regulatory-pathway tables (NRC DC/COL, ONR GDA, CNSC), never by the LLM computing project finance itself.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/smr-project-finance/ask`, corpus = this Atlas record (§7.1 formulas, the 6-design parameter table, framework notes) plus live page state. What-if requests re-run the deterministic engine with the requested LR/PTC/overrun values and narrate the delta; regulatory-pathway answers cite the specific NRC/ONR/CNSC step. The copilot flags the model's own simplifications (single-point cost estimates, symmetric-until-Evolution-A shocks) when relevant.

**Prerequisites.** Evolution A closes the biggest honesty gaps the copilot would otherwise have to caveat heavily (hard-coded LR, unwired PTC). Shippable as explanation-only against current outputs with those caveats stated. **Acceptance:** every LCOE/IRR figure in an answer traces to an engine run reproducible from stated inputs; a question about a reactor design not in the 6-design set returns a scoped refusal.
