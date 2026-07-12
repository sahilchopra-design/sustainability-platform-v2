## 9 · Future Evolution

### 9.1 Evolution A — A real concentration statistic and supply-cost curves (analytics ladder: rung 1 → 2)

**What.** The 7-feedstock reference layer (prices, global supply, CI, EU RED double-counting eligibility) is plausible and roughly sourced (§7.5), but the module's flagged defect is conceptual: the per-supplier `hhi` field is a seeded random number mislabelled as a Herfindahl-Hirschman Index — a real HHI is a market-level statistic (Σ share² across suppliers per feedstock) that the code never computes, and cannot exist per-supplier at all. Price forecasts are flat linear interpolations, and the 18 suppliers are synthetic perturbations. Evolution A computes concentration correctly and upgrades the price layer.

**How.** (1) Compute the actual HHI once per feedstock over its suppliers' volume shares, rendered at the feedstock level; the per-supplier field is renamed to what it can honestly be (a composite supply-risk score with documented components: certification status, geography, volume reliability) or dropped. (2) The supplier register becomes user-editable (procurement teams enter actual counterparties) so concentration and risk reflect a real book; the 18 seeded rows become demo fixtures. (3) Price forecasts gain scenario structure: UCO/tallow price paths linked to SAF-mandate demand volumes from `saf-policy-mandate` rather than straight lines, elasticity assumption documented. (4) A small backend route serves feedstock reference data and computed concentration so sibling SAF modules consume one feedstock fact base.

**Prerequisites.** Volume fields on supplier rows; scenario-linkage convention with the policy module. **Acceptance:** the feedstock-level HHI reproduces from supplier shares by hand; no field named `hhi` exists per supplier; mandate-scenario changes move the price forecast visibly and documentedly.

### 9.2 Evolution B — Procurement-risk copilot for feedstock desks (LLM tier 2)

**What.** Feedstock procurement questions are portfolio-shaped: "our UCO book is 68% two suppliers — what's the concentration read and which certified alternatives exist in-region?", "which feedstocks keep EU RED double-counting if the Annex IX review tightens?", "draft the supply-risk section of our SAF project DD". The copilot combines computed concentration, the certification register, and regulatory reference content.

**How.** Tier-2 tool calls over the register/concentration/forecast endpoints; alternative-supplier suggestions are filtered register queries (certification, feedstock, region), never invented counterparties. Regulatory answers (RED II Annex IX status, double-counting) ground in chunked directive text with review-risk framed as scenario, not prediction. DD sections compose computed metrics through report studio with the assumptions-box pattern. Price-outlook statements carry the scenario name and elasticity assumption from the tool payload.

**Prerequisites (hard).** Evolution A — concentration advice from a mislabelled random field would be analytically wrong at the concept level, not just the data level; directive texts chunked. **Acceptance:** every concentration figure reproduces from register shares; suggested alternatives exist in the register with the claimed certifications; regulatory claims cite directive clauses.
