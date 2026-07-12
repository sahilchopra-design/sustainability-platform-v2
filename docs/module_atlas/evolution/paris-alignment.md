## 9 · Future Evolution

### 9.1 Evolution A — Compute PACTA-style ITR, not just SBTi lookup + fallback (analytics ladder: rung 2 → 3)

**What.** §7's partial mismatch: the guide states a PACTA budget-share ITR (`ITR = GlobalBudget_remaining × (PortfolioEmissions/GlobalEmissions) / PortfolioShare_globalGDP`), but the code assigns ITR per holding from a real SBTi commitment-tier lookup (`sbti-companies.json`: 1.5C→1.5, WB2C→1.7, Committed→1.8) with a sector-benchmark-bounded synthetic fallback where no SBTi match exists. Notably, two previously-logged P0/P1 bugs are already fixed (`onTrack15 = itr <= 1.5` correct, `wtdITR` zero-guarded). The budget-share numbers the guide's formula needs *are* computed for the Carbon Budget visual — just not combined into a per-holding ITR. Evolution A closes that gap.

**How.** (1) Implement the documented budget-share ITR as an alternative/complementary method to the SBTi lookup: for holdings without an SBTi commitment, compute ITR from the company's emissions trajectory against its sector carbon budget (the SBTi Temperature Scoring methodology and PACTA 2.0 named in §5) rather than the `1.4 + seed×2.6` synthetic fallback — removing the seeded component. (2) Reconcile the two methods, reporting which holdings use SBTi-lookup vs computed ITR (a provenance field). (3) Ground portfolio emissions in real PCAF/reported data (shared with the financed-emissions modules) so the Carbon Budget trajectory reflects real holdings.

**Prerequisites.** Sector carbon budgets and company emission trajectories (SBTi/PACTA inputs); the SBTi lookup already works — extend, don't replace it. **Acceptance:** holdings without SBTi commitments get a computed budget-share ITR, not a seeded fallback; the method (lookup vs computed) is visible per holding; portfolio ITR reproduces from real emissions.

### 9.2 Evolution B — Portfolio-alignment & stewardship copilot (LLM tier 2)

**What.** A copilot for the institutional-investor users §1 targets: "what's my portfolio ITR and is it Paris-aligned?", "which sectors contribute most to overshoot?", "rank my top-10 engagement targets by ITR", "how does dropping the worst holding change portfolio ITR?" — executed against the ITR engine, decomposing the AUM-weighted portfolio ITR into per-holding and per-sector contributions.

**How.** Tool calls to endpoints wrapping the ITR assignment, sector decomposition, and weighted-portfolio-ITR functions; system prompt from this Atlas page's §5/§7.1 and the PACTA 2.0 / CA100+ / Paris Article 2.1(a) references named in §5. The engagement list (highest-ITR holdings for stewardship, §1) is a tool call returning ranked holdings; the "drop the worst holding" what-if is a recomputation. Fabrication validator matches every temperature figure to a tool response; the copilot must distinguish SBTi-lookup ITRs (real commitment data) from computed/fallback ITRs in provenance, and convey that ITR is model-dependent and not comparable across methodologies.

**Prerequisites.** Compute endpoints; Evolution A for computed ITR (the SBTi-lookup path works today). **Acceptance:** every ITR figure traces to a tool call with method provenance; sector contributions sum to portfolio ITR; the engagement ranking reflects real ITRs; the copilot flags method-dependence.
