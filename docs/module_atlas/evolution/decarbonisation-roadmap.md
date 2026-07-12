## 9 · Future Evolution

### 9.1 Evolution A — Portfolio-specific MAC with learning curves and constraints (analytics ladder: rung 2 → 3)

**What.** §7 rates this one of the healthier modules: real corporate disclosures
(Shell 1620→810, Ørsted 10.5→0.84), a 30-lever library whose MAC signs and
magnitudes mirror published McKinsey/IEA curves (Solar+Storage −$35/t through
DACCS +$420/t), real ETS prints and a real policy calendar — with only a small
`sr()` noise term on three trend series. The documented ceilings: lever MACs are
static point estimates (no learning-curve time dependence), `potentialMtY` is
portfolio-agnostic, and the scenario planner's `price × adoption` factor is a
linear scalar, not a supply-curve model. Evolution A makes the MAC stack
entity-specific and dynamic.

**How.** (1) Portfolio-specific potentials: intersect each lever with the entity's
actual emission profile (sector, scope split, geography) so the MAC waterfall
shows *addressable* abatement, not global constants — the baseline-profile input
the workflow already describes. (2) Learning curves: per-lever cost decline via
Wright's-law rates from published sources (solar/wind/electrolyzer learning rates
are well-documented), making the accelerated-vs-delayed comparison honest about
cost timing — delay is cheaper per ton for immature levers, the real trade-off.
(3) Constraint layer: capacity ceilings and deployment ramp limits per lever
replacing the linear what-if factor. (4) Remove the residual `sr()` noise; pin
the MAC-stack ordering in a regression test. (5) Serve as the lever library for
`decarbonisation-hub` per that module's evolution.

**Prerequisites.** Learning-rate curation with citations; entity emission
profiles (from the hub's programme registry or BRSR data). **Acceptance:** the
same lever shows different addressable potential for a steel company vs a bank;
delaying a high-learning-rate lever visibly reduces its 2035 MAC; the waterfall
still orders ascending by cost.

### 9.2 Evolution B — Costed transition-plan drafter (LLM tier 1 → 2)

**What.** The module's pitch — "translates a net-zero commitment into a costed,
technology-specific action plan finance and operations can execute" — ends in a
document: the transition plan. Evolution B drafts it from computed state: the
selected MAC stack with per-lever costs and timing, the pathway-vs-SBTi-4.2%/yr
alignment arithmetic, the policy-calendar dependencies (CBAM, Fit-for-55 dates
from the real milestone table), and the residual-emissions statement per the SBTi
Net-Zero Standard annex §5 cites — every number from the lever library and
scenario planner, every policy date from the curated calendar.

**How.** Tier 1 over page state plus this Atlas record and the SBTi/IEA reference
texts; tier 2 when the MAC engine is served, so "re-plan with DACCS excluded and a
2040 target" executes as a scenario call the drafter then documents. CSRD E1-1
transition-plan disclosure structure is the natural output template (linking to
the CSRD family's report machinery). Fabrication validation on all $/t, MtCO₂e,
and dates.

**Prerequisites.** Evolution A's entity-specific potentials (a generic global MAC
stack drafted into a company's plan would be strategy-by-template); corpus
embedding. **Acceptance:** every lever figure in a draft matches the library;
pathway-alignment claims reproduce from the 4.2%/yr arithmetic; policy dates
match the milestone table exactly.
