## 9 · Future Evolution

### 9.1 Evolution A — Build the compliance-cost and retrofit-ROI models (analytics ladder: rung 1 → 2)

**What.** §7 flags that both headline formulae are absent: the guide's `ComplianceCost = Σ[UpgradeRequired_i × CostPerUpgrade_i × BuildingStock_i]` and `RetrofitROI = (EnergySavings + CarbonSavings × CarbonPrice + ValueUplift)/RetrofitCost` are not implemented — each jurisdiction's data is `sr()`-seeded and only two lightweight interactive transforms are applied, with the §8 model spec marked "not yet implemented in code." Evolution A builds both models over real building-code data: compliance cost from the mandatory EPC-minimum-rating escalation (EPBD 2025–2030, ASHRAE 90.1) applied to real building stock by upgrade type, and retrofit ROI aggregating energy savings, carbon-credit value, and green-premium value uplift against retrofit cost — grounding the building stock in the platform's EPC dataset (wave-1) rather than seeded jurisdiction rows.

**How.** (1) A backend route computing compliance cost per the §5 sum over building-stock segments and required upgrades, with EPC-minimum escalation schedules per jurisdiction. (2) Retrofit ROI from energy savings (EUI reduction × energy price), carbon savings × a carbon-price input, and value uplift, over retrofit cost. (3) Building stock and EPC distributions from the EPC feed by jurisdiction/type.

**Prerequisites.** Building-stock and EPC-distribution data by jurisdiction (wave-1 EPC source); upgrade-cost and escalation-schedule references. The seeded jurisdiction data (§7-flagged) replaced. **Acceptance:** compliance cost recomputes from the §5 stock sum; retrofit ROI reproduces its formula from energy/carbon/uplift inputs; changing the carbon price moves ROI; no `sr()` jurisdiction figure remains.

### 9.2 Evolution B — Building-code compliance copilot (LLM tier 2)

**What.** A copilot for real-estate and policy analysts: "what will EPBD minimum-rating escalation cost our EU portfolio by 2030, and which retrofits clear a positive ROI at €80/t carbon?" tool-calls the Evolution A compliance-cost and retrofit-ROI endpoints, narrating the cost trajectory and prioritised retrofits.

**How.** Tier-2 tool-calling over the compliance/ROI endpoints; the grounding corpus is §5/§7 (EU EPBD, US ASHRAE 90.1, national net-zero codes, the retrofit-ROI components). The copilot's value is translating regulatory escalation into a costed retrofit programme with carbon-price sensitivity. Guardrail, pre-Evolution-A: the guide's models are unbuilt and data seeded, so it must refuse compliance-cost and ROI figures. Every figure validated against tool output.

**Prerequisites.** Evolution A (no models today); EPC/stock data; corpus embedding. **Acceptance:** post-Evolution-A, every compliance-cost and ROI figure traces to a tool call; the carbon-price what-if reproduces the ROI formula; pre-Evolution-A the copilot declines quantitative asks and answers only on regulatory facts.
