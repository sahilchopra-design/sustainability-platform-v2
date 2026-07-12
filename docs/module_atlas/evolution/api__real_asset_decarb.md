## 9 · Future Evolution

### 9.1 Evolution A — Budget-optimal decarbonisation sequencing (analytics ladder: rung 2 → 5)

**What.** The E74 engine is a five-function real-asset decarbonisation toolkit: lock-in risk
scoring, capex-transition planning (a *greedy* abatement-technology stack), retrofit NPV
(@5/7/10% with payback and CRREM alignment), brown-to-green portfolio modelling, and a
budget-constrained decarb roadmap ranked by cost-effectiveness. The core loop is already
scenario-aware (SBTi trajectory `base×(1−sbti_rate)^t`, carbon-price risk), but the roadmap uses
greedy cost-effectiveness ordering (`cost_eff = tCO2e_red / capex`) rather than true optimisation,
and CRREM pathways/abatement costs are static reference tables. Evolution A makes sequencing
optimal and grounds the costs.

**How.** (1) Replace the greedy abatement stack and roadmap ordering with a proper
budget-constrained optimiser (rung 5 prescriptive): maximise cumulative tCO2e abated (or
stranding-risk reduction) subject to the annual capex budget and CRREM-alignment constraints —
scipy optimisation, the roadmap's named pattern for MACC-style engines. (2) Calibrate abatement
costs and CRREM pathways from the platform's real data (shared with `re_clvar`/`glidepath`) rather
than static tables. (3) Add uncertainty on retrofit savings (the `energy_saving × 0.7` realisation
factor is a fixed haircut — make it a range). (4) Bench-pin lock-in score, retrofit NPV, and the
optimised roadmap.

**Prerequisites.** CRREM/abatement-cost data sources; a savings-realisation distribution.
**Acceptance:** the decarb roadmap returns a budget-optimal (not merely greedy) action sequence
with a documented objective; abatement costs carry provenance; retrofit NPV includes a savings
range; bench pins pass.

### 9.2 Evolution B — Decarbonisation-planning copilot for asset owners (LLM tier 2)

**What.** A copilot that runs the suite for an asset or portfolio — "this building is at high
lock-in risk with stranding in 2031; here's the cheapest retrofit path to CRREM alignment within
a €2M budget, NPV-positive at 7%" — each figure from a tool call, with brown-to-green portfolio
planning.

**How.** Five POST endpoints plus rich reference GETs (asset-types, retrofit-measures,
crrem-pathways, sbti-sectors, abatement-costs, carbon-price-scenarios) that ground every constant.
The roadmap endpoint is the natural tier-2 action; the retrofit-NPV and cost-effectiveness outputs
let the copilot rank measures transparently. What-ifs ("raise the budget", "assume a higher carbon
price") re-run statelessly. Core node for a real-estate/infrastructure decarbonisation desk,
cross-linking to `re_clvar` and `real_estate` valuation.

**Prerequisites.** None hard — engine is honest; a fully budget-optimal narrative needs Evolution
A's optimiser (until then the copilot presents the greedy ranking as such). **Acceptance:** every
lock-in score, NPV, and abatement figure traces to a tool response; the copilot labels the roadmap
as greedy-ranked until Evolution A ships optimisation; it cites carbon-price scenario and abatement
source from the reference endpoints and refuses to guarantee stranding avoidance.
