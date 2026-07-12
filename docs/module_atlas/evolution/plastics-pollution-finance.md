## 9 · Future Evolution

### 9.1 Evolution A — Build the composite risk score and recycling NPV (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide promises `PlasticRisk = RegRisk + DemandDestructionRisk + LitigationRisk + ReputationRisk` and a discounted `RecyclingNPV` with Verra PWRP credit revenue, but neither exists — 80 synthetic companies carry independent seeded attributes, and the dashboard shows only filtered means/counts. The one real expression is `taxExposure = Σ(plasticTax × plasticProduction)`. There is no litigation term, no demand-destruction curve, no discounting. Evolution A builds the two documented models.

**How.** (1) Implement the composite `PlasticRisk` as the sum of four real sub-scores: regulatory risk from country-specific single-use-plastic bans (the `COUNTRIES` table + UN Plastics Treaty INC scenarios named in §5), demand-destruction from petrochemical-feedstock exposure by product type, litigation risk from a controversy/legal-exposure indicator, and reputation risk — each grounded, not seeded. (2) Implement `RecyclingNPV` as a real discounted cash flow: `Σ (RecyclateRevenue + PlasticCredit − CollectionCost − ProcessingCost)/(1+r)^t` with Verra PWRP credit revenue (the sibling `plastic-credits-epr-finance` module has the credit-price data — share it). (3) Company plastics exposure by product/sector (§1) from real disclosure or sector-average data.

**Prerequisites.** Company plastics-exposure data (sourced or analyst-entered); UN Plastics Treaty scenario definitions; shared plastic-credit pricing with the EPR-finance module. Remove `sr()` from the risk attributes. **Acceptance:** `PlasticRisk` decomposes into four named sub-scores; `RecyclingNPV` discounts real cash flows; a company's risk responds to its actual product mix and jurisdiction.

### 9.2 Evolution B — Plastics-transition-risk copilot (LLM tier 1 → 2, scoped honestly)

**What.** Near-term, a guidance copilot grounded in the OECD Global Plastics Outlook, UN Plastics Treaty INC process, and WWF references named in §5: "how will the UN Plastics Treaty affect single-use producers?", "what's the demand-destruction outlook for virgin petrochemicals?", "how does recycling NPV work with plastic credits?" It must not quantify a company's plastic risk until Evolution A exists, since the current 80-company table is seeded.

**How.** Tier 1 over the standards corpus (roadmap `llm_corpus_chunks`): the copilot explains treaty scenarios, demand-destruction dynamics, and recycling economics with citations. System prompt encodes the honest current state so it refuses "score this company's plastic transition risk" with a pointer to the (post-Evolution-A) risk engine. Tier 2 with Evolution A: tool calls to the `PlasticRisk` composite and `RecyclingNPV` engines, with the fabrication validator matching every score/NPV to outputs and the four risk sub-scores surfaced for auditability. The WWF/OECD-aligned disclosure (§1) drafts from the computed risk decomposition.

**Prerequisites.** Standards ingestion; explicit current-state statement. Company scoring gated on Evolution A. **Acceptance:** framework answers cite named references; risk scores/NPVs (post-Evolution-A) trace to tool calls with the four-term decomposition; the copilot refuses to score companies from the current seeded data.
