## 9 · Future Evolution

### 9.1 Evolution A — Constrained CDR allocation optimiser (analytics ladder: rung 1 → 5)

**What.** §7 confirms the blending math is genuine — `portfolioStats` computes
weight-averaged LCOC/IRR/risk and a Tier-1 permanence share over the 4-type allocation
— but it only *evaluates* user-chosen weights; the "optimal portfolio" in §5 (25–30%
DAC/BECCS, 30–40% biochar…) is prose, not solved. Portfolio construction is one of the
roadmap's named rung-5 first movers, and this module is the platform's cleanest case:
minimise blended LCOC (or maximise IRR) subject to permanence-share ≥ X%, risk ≤ Y,
annual-tonnage and per-instrument volume caps from the `CDR_INSTRUMENTS` supply
fields.

**How.** (1) scipy linear/quadratic solve over the 4 weights (the objective and all
constraints are linear in weights, so this is exact, explainable optimisation — no
black box). (2) Efficient-frontier trace (LCOC vs permanence share) rendered alongside
the existing risk/return scatter. (3) Instrument economics calibrated before optimising:
LCOC/IRR seeds cross-checked against disclosed purchase prices (the sibling
`cdr-credit-markets` Evolution A purchase table is the natural source), and the `sr()`
noise §7 notes in the trajectory/cost curve removed per the platform guardrail.

**Prerequisites.** Calibrated inputs first — optimising over hand-typed IRRs produces
confident nonsense; the seeded-noise cleanup is part of this change. **Acceptance:**
the optimiser's solution dominates every `PORTFOLIO_TEMPLATES` preset on the stated
objective; a fixture with a known analytic optimum is recovered exactly.

### 9.2 Evolution B — Net-zero strategy copilot (LLM tier 2)

**What.** An assistant that runs allocation conversations: "give me the cheapest mix
with ≥40% permanent removal under $250/t blended", "how does the Oxford Principles
transition (shrinking avoidance, growing removal share) reshape my 2030 budget?" —
executed as tool calls against `portfolioStats` and, post-Evolution A, the optimiser
(client-side functions; this module has no backend routes), with the trajectory tab's
baseline/avoidance/CDR/residual decomposition narrated from page state.

**How.** Tool schemas over the blend evaluator and optimiser with typed constraint
parameters; per the tier-2 contract every $/t, %, and tonne in an answer must match a
logged tool return; framework questions (IFRS S2 CDR disclosure, SBTi neutralisation
rules) answer from the §5 standards corpus with citations, kept separate from computed
numbers.

**Prerequisites (hard).** Evolution A's optimiser and calibration — recommending
allocations from uncalibrated seed IRRs would be advice-shaped fabrication.
**Acceptance:** a recommended mix is reproducible by re-running the optimiser with the
stated constraints; the copilot declines to forecast 2030 prices beyond the labelled
scenario columns.
