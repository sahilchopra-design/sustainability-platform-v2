## 9 · Future Evolution

### 9.1 Evolution A — Add the climate overlay to a genuinely sound credit core (analytics ladder: rung 1 → 2)

**What.** §7's flag is unusual: the code is a *correct* conventional credit toolkit —
real S&P-style migration matrix, rating-PD map, PD term structures, IFRS 9
ECL = PD×LGD×EAD with staging, Basel capital ladder — but the guide's climate
conditioning is absent: `carbonInt` and `esgScore` are stored on each obligor and
never touch PD, LGD, or ECL. §7.6 adds two conventional gaps: Stage-2 assets get
1-year ECL despite the lifetime term tables being present, and nothing is
discounted. Evolution A adds the promised overlay without rebuilding what works.

**How.** (1) Climate PD conditioning per the guide's own form:
`PD_adj = PD_base × exp(β_t·TransitionShock + β_p·PhysicalShock)`, with the
transition shock = carbon cost / EBITDA computed from the obligor's stored
`carbonInt` via the NGFS price paths in `climate_transition_risk_engine`, and β
anchored to the ECB 2022 sectoral analysis the guide cites — reusing the platform's
existing engines rather than duplicating them (the sibling
`climate-credit-integration` module already models this pattern; share, don't
fork). (2) LGD haircut: collateral physical-risk discount from the digital-twin
composite score where collateral is geolocated. (3) Lifetime ECL: apply the
existing `PD_TERM` cumulative structures to Stage-2 obligors with discounting —
the tables are already on the page, unconnected. (4) Real obligors from
`portfolios_pg` replace the 45 seeded assignments; the real reference constants
stay untouched and get pinned in `bench_quant.py`.

**Prerequisites.** Coordination with `climate-credit-integration` to avoid engine
duplication; obligor emissions/EBITDA data for the transition shock (honest nulls
where missing). **Acceptance:** an obligor's climate-adjusted PD exceeds its base
PD by the exp-factor arithmetic exactly; Stage-2 ECL uses the cumulative term
structure; toggling NGFS scenario changes ECL monotonically for carbon-intensive
sectors.

### 9.2 Evolution B — ICAAP climate-credit narrative assistant (LLM tier 1 → 2)

**What.** The module's stated regulatory uses — ICAAP climate stress testing,
Pillar 2 add-on support, TCFD credit disclosure — all end in written submissions.
Evolution B drafts them from computed state: portfolio ECL under base vs
climate-adjusted parameters, the sector RWA concentration story, stage-migration
under scenario, and the capital implication (the module's own Basel ladder), with
each figure traced to the calculation and each methodological choice (β source,
pass-through assumption) disclosed — the ECB/BCBS references §5 cites structure the
narrative sections.

**How.** Tier 1 grounds on page state plus this Atlas record; tier 2 arrives when
Evolution A lands server-side, making "re-run under Delayed Transition with 50%
pass-through" a tool call whose output feeds the draft directly. The fabrication
validator matters doubly here: capital figures in a regulatory narrative must match
computed values to the basis point, and the assistant must not smooth over the
model's stated limitations (single-period jitter on PD assignment, β vintage).

**Prerequisites (hard).** Evolution A — an ICAAP narrative describing a model with
no climate conditioning as "climate-adjusted" would be a supervisory
misrepresentation; backend endpoints for tier 2. **Acceptance:** every number in a
draft matches computed output; the methodology annex lists the β source and
scenario vintage; obligors lacking emissions data are reported as
unconditioned, not silently base-PD.
