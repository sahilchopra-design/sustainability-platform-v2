## 9 · Future Evolution

### 9.1 Evolution A — Live BCR engine from the ILO exposure-response function (analytics ladder: rung 1 → 2)

**What.** The page is a well-anchored reference tool (8 real cities with hard-coded heat-days/UHI/labour-loss, 7 costed cooling solutions) but computes almost nothing: live math is sorting, `totalGdpRisk` summation and `avgHeatDays2050` — and the guide's headline `BCR = (Labour_gain + Health_saving + Energy_saving)/(CapEx + PV OpEx)` is never calculated; solutions are compared on raw cost/°C only. Evolution A builds the §8 benefit-cost engine: WBGT-driven work-hours lost per the ILO 2019 exposure-response, health savings from °C reduction × mortality baselines, energy savings from displaced cooling demand, producing a per-city, per-solution BCR the budget slider can actually optimise against.

**How.** (1) New `heat_adaptation` route: inputs city, solution mix (from the existing `SOLUTIONS` cost/°C/lifetime columns), deployment hectares from `budgetM`; outputs Labour_gain, Health_saving, Energy_saving, BCR and payback. (2) City WBGT/wage/workforce parameters seeded from ILO country tables and the page's own `CITIES` fields (e.g. Dubai 28% labour loss). (3) The two semi-synthetic chart series (`PRODUCTIVITY_IMPACT`, `HEAT_HEALTH_COST`) drop their `sr()` noise terms and render the deterministic ILO-shaped trends. (4) Validate BCRs against Global Commission on Adaptation heat-adaptation return benchmarks per §8.5.

**Prerequisites.** The seeded-noise terms removed (documented in §7.5); city wage/workforce reference data added — the page currently has heat and cost priors but no monetisation inputs. **Acceptance:** the §7.4 tree-canopy vs district-cooling trade-off reproduces as a BCR ranking with stated VSL/discount assumptions; changing the budget slider changes BCR-optimal allocation deterministically.

### 9.2 Evolution B — City-issuer copilot for cooling-bond structuring (LLM tier 1 → 2)

**What.** A copilot for city bond issuers and infra investors on the EP-EK2 page: "why does Dubai carry 8.4% GDP at risk?", "which solutions are EU Taxonomy Art 7.4 eligible and why?", "at a $50M budget, what's the best cooling per dollar?" Answers ground in this page's unusually strong static corpus — the 8-city table, the 7-solution eligibility tags (EU Taxonomy/CBI ARC/GCF), and the §7.4 worked cost-effectiveness example.

**How.** Tier 1 first: atlas record into `llm_corpus_chunks`; page state (current sort column, `budgetM`) passed as context so the copilot narrates the visible ranking, including the honest caveat that city figures are illustrative values aligned to ILO/Lancet ranges (§7.5), not live climate-model output. After Evolution A, tier 2 tool-calling: natural-language what-ifs ("rerun Karachi with tree canopy only at $20M") execute against the new BCR endpoint, with the no-fabrication validator checking every $ and °C figure against tool output.

**Prerequisites.** Copilot router + corpus (Phase 1); tier 2 gated on Evolution A since the module has no backend endpoints today. **Acceptance:** finance-eligibility answers cite the correct framework tag per solution; tier-2 what-if answers contain no numerics absent from the logged tool call.
