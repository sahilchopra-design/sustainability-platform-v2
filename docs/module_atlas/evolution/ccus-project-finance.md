## 9 · Future Evolution

### 9.1 Evolution A — First implementation: incentive-driven CCUS deal model (analytics ladder: rung 0 → 1)

**What.** §7 records **no implementation found** — empty feature directory, route not
wired in App.js, no engines, null guide. The atlas function map preserves the intended
shape: a 9-row `DEALS` seed (co2Mtpa, capex/opex, energy penalty, incentive type/price,
offtake price, T&S tariff, tenor, cost of debt, DSCR target) and an NPV reducer.
Evolution A builds that module for real: a project-finance cash-flow model per deal —
revenue from incentives (45Q at $85/t stored, EU ETS allowance avoidance, CfD strike)
plus offtake, costs from opex + energy penalty + T&S tariff, debt sized to the DSCR
target, equity IRR and NPV computed from the resulting waterfall.

**How.** (1) Wire the route; implement `sizeDebt(cashflows, dscr, rate, tenor)` and a
standard annual waterfall as pure, unit-tested functions — the platform's DE/DD-sprint
project-finance pages provide the established pattern. (2) Deal roster seeded from
publicly announced CCUS FIDs (Porthos, Northern Lights phase economics are published)
with per-field provenance notes, never `sr()` synthesis. (3) Sensitivity table
(rung-2-ready): IRR vs incentive price × capture rate.

**Prerequisites.** Coordinate with the also-empty `ccus-market-intelligence` sibling so
facility economics and deal economics share one reference roster; honest labelling of
estimated fields. **Acceptance:** route renders; a fixture deal reproduces a
hand-computed DSCR-constrained debt capacity and equity IRR; guardrail-clean (no
fabricated random).

### 9.2 Evolution B — Deal-screening copilot (LLM tier 1)

**What.** Post-build, a tier-1 copilot for structuring questions: "why does the energy
penalty dominate opex for amine capture?", "at what 45Q price does this deal clear a
1.4x DSCR?", "how does T&S tariff pass-through change equity returns?" — grounded in
the new deal model's inputs and outputs plus this atlas record. The DSCR-threshold
question is answerable by narrating the model's existing sensitivity table, not by the
LLM solving for it.

**How.** Tier-1 pattern: atlas record and deal roster in `llm_corpus_chunks`; live
model state injected; every $/t, IRR, and DSCR figure must trace to the rendered model
or a cited seed field. Refusal path covers geology, permitting timelines, and credit
ratings — none computed here.

**Prerequisites (hard).** Evolution A shipped and atlas regenerated; until then the
module has no content to explain and a copilot would be pure fabrication.
**Acceptance:** a breakeven-45Q answer matches the sensitivity table cell it cites;
questions outside the waterfall's computed surface are refused.
