## 9 · Future Evolution

### 9.1 Evolution A — Compute credit-stacking economics per project (analytics ladder: rung 1 → 2)

**What.** §7 confirms this catalogues 16 real-named policy instruments (IRA §45V, EU H2Global, EU CBAM, UK CfD, Japan GIF, Korea CCF, Australia Headstart, India NGHM) with per-tonne-NH₃ values attributed to real programme rules (IRS Notice 2023-29 for §45V, EU Reg 2023/956 for CBAM), though individual `valueUsdPerT` figures are 2024-vintage estimates. The headline `§45V_credit = f(lifecycle_GHG_tier)` and `H2Global_DCC = (LCOA_green − market_price) × volume` are real formulas. Evolution A makes them project-executable: compute a project's actual §45V tier from its lifecycle carbon intensity (the four-tier ladder: <0.45 kgCO₂e/kgH₂ → $3.00/kg down to $0.60), the H2Global differential-cost from the project's own LCOA (from the production-economics sibling), and the stacked credit value net of eligibility conflicts — so a developer sees their real subsidy stack, not a generic table.

**How.** (1) A backend route taking a project's lifecycle GHG intensity and LCOA, returning the §45V tier credit, H2Global DCC, and CBAM-avoided-cost, with stacking rules (which credits combine). (2) Wire LCOA from `green-ammonia-production-economics` so the DCC uses a real cost. (3) Keep the 16-policy table as reference, versioned as programme rules amend.

**Prerequisites.** Lifecycle-GHG and LCOA inputs (from the production-economics module); the policy table under version control for rule changes. **Acceptance:** a project's §45V tier and credit recompute from its carbon intensity reproducing the tier ladder; the H2Global DCC uses the project's real LCOA; stacking conflicts are flagged.

### 9.2 Evolution B — Subsidy-optimisation copilot (LLM tier 2)

**What.** A copilot for developers and policy analysts: "for a NEOM-scale project at 0.4 kgCO₂e/kgH₂, what §45V tier applies, and does H2Global or CBAM add more value for an EU offtake?" tool-calls the Evolution A credit-stacking endpoint and narrates the optimal subsidy strategy across jurisdictions.

**How.** Tier-2 tool-calling over the credit endpoints; the grounding corpus is §5/§7, which accurately encode §45V tiers, H2Global DCC mechanics, and CBAM fertiliser rules with real statutory references. The copilot's value is credit-stacking optimisation — which combination of instruments maximises net support for a given project/offtake geography, respecting eligibility conflicts. Every credit figure validated against tool output.

**Prerequisites.** Evolution A (the current table is static per-tonne values, not project-computed); corpus embedding; the policy table kept current. **Acceptance:** every credit and DCC figure in a copilot answer traces to a tool call citing the programme rule; the copilot flags when two credits cannot be stacked, rather than summing them naively.
