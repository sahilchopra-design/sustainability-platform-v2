## 9 · Future Evolution

### 9.1 Evolution A — Compute EPR liability and compliance scores from real inputs (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide gives computed formulas (`EPR_Fee = PlasticTonnage × EPR_Rate × JurisdictionCount`, `CreditNeed = max(0, RCTarget − AchievedRC) × Volume`, `ComplianceScore = min(100, RC/RC_target×50 + Collection/Collection_target×50)`), but none are evaluated — the 24 producers' `eprFee`/`complianceScore`/`recycledContent`/`creditsPurchased` are independent `sr()` constants uncorrelated with each other. Only the credit-purchase calculator (`creditCost = qty × price`, `co2eq = qty × 0.0028`) is real. The registry and EPR-scheme reference tables are well-curated real data. Evolution A wires the documented formulas.

**How.** (1) Implement the EPR-fee formula from a producer's real plastic tonnage × the jurisdiction-specific rate (the `EPR_SCHEMES` table already has real fee rates for 8 jurisdictions — Germany VerpackG, UK EPR, CA SB 54) × jurisdiction count, so fees respond to tonnage. (2) Compute `ComplianceScore` as the documented function of achieved recycled content vs target and collection rate vs target — making a producer's score respond to its own `recycledContent` rather than being an independent draw. (3) `CreditNeed` from the recycled-content gap × volume. (4) Cite the 0.0028 tCO₂e/t credit factor to a named LCA methodology. Producer tonnage/recycled-content become analyst-entered or sourced inputs, not seeds.

**Prerequisites.** Producer-level tonnage and recycled-content data (analyst-entered or sourced); the EPR rate table is already real — connect it. Remove uncorrelated `sr()` producer fields. **Acceptance:** EPR fee reproduces from tonnage × rate × jurisdictions; compliance score responds to a producer's own recycled content; credit need derives from the RC gap.

### 9.2 Evolution B — EPR-compliance copilot for brand owners (LLM tier 1 → 2)

**What.** A copilot for the brand-owner/procurement users §1 targets: "what's my EPR liability across the EU, UK, and Germany at 50kt packaging?", "how many plastic credits do I need to hit a 30% recycled-content target?", "compare Verra PWRS and CleanHub credit prices", "which jurisdiction's penalties are highest?" — grounded in the real registry/EPR-scheme tables and the EU PPWR / UK EPR / Verra PWRS references named in §5.

**How.** Tier 1 works on the curated reference data immediately: system prompt from this Atlas page's registry and EPR-scheme tables (§7.2); the copilot compares registries and explains jurisdiction schemes with citations. Tier 2, post-Evolution-A: the liability and credit-need calculations become tool calls to the EPR-fee and compliance-score functions, with the fabrication validator matching every fee/credit figure to outputs. The copilot must flag that registry prices are curated illustrative figures, not live quotes, and that producer compliance scores (post-Evolution-A) reflect entered data.

**Prerequisites.** Tier 1 on curated data with as-of disclosure; liability computation needs Evolution A's real formulas. **Acceptance:** registry comparisons cite the reference table; EPR-fee/credit-need figures (post-Evolution-A) trace to tool calls; the copilot discloses that prices are illustrative.
