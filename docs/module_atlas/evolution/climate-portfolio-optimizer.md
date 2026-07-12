## 9 · Future Evolution

### 9.1 Evolution A — An actual QP optimiser behind the existing UI (analytics ladder: rung 1 → 5)

**What.** §7 draws the line precisely: the Climate-Adjusted Sharpe Ratio
(`CASR = (Rₚ−Rₑ)/(σₚ×(1+λ·CIₚ))`) is genuinely implemented, but the promised
Markowitz optimiser is not — the three "optimised" portfolios are filter-and-
renormalise heuristics over 200 seeded securities, and the efficient frontier is a
parametric curve drawn from a formula, not solved from a covariance matrix.
Portfolio construction is a roadmap-designated rung-5 first mover, and this module's
UI (carbon budget, sector max, ITR limit, ESG floor, liquidity sliders) already
defines the constraint set. Evolution A ships the solver: mean-variance QP with a
linear climate-penalty term (the Pedersen et al. formulation §5 cites), long-only and
sector/name caps, solved server-side with scipy — the module's first backend route —
tracing a real frontier by sweeping the climate-penalty λ.

**How.** (1) `POST /api/v1/climate-portfolio/optimize` taking universe, constraints,
λ; factor-model covariance (a few observable factors beat a full 200×200 sample
estimate and are explainable). (2) The heuristic portfolios retained as labelled
baselines — showing the optimiser's improvement over them is the honest selling
chart. (3) Universe inputs upgraded where platform data allows (carbon intensities
and ITRs from holdings data rather than seeds); return/vol assumptions labelled as
assumptions with sensitivity display, per §8 model-card convention.

**Prerequisites (hard).** Solver correctness bench (a 3-asset fixture with an
analytic optimum); the seeded universe relabelled demo pending real holdings; the
"500+ Pareto portfolios" guide claim reconciled to the shipped sweep. **Acceptance:**
the QP solution weakly dominates all three heuristics on the stated objective;
binding constraints are reported per solve; the frontier is solver output, not a
drawn curve.

### 9.2 Evolution B — Mandate-translation analyst (LLM tier 2)

**What.** The genuinely hard step in climate optimisation is translating mandate
prose into constraints — "Article 9 fund, 50% WACI reduction vs benchmark, no
thermal-coal revenue >5%, tracking error under 3%" — and that is language work. The
analyst parses mandate text into the optimiser's constraint schema, runs the solve
as a tool call, and narrates the result: achieved WACI/ITR/green-revenue vs targets,
which constraints bound, what the climate penalty cost in Sharpe terms (the CASR the
module already computes).

**How.** Tool schema over the Evolution A endpoint; a constraint-schema validator
between parse and solve (the LLM proposes, the schema gatekeeps — malformed
constraints fail loudly); the no-fabrication validator on all weights and metrics;
"show work" includes the full constraint set so compliance can audit the
translation.

**Prerequisites (hard).** Evolution A first — there is nothing to call; and
mandate-parse accuracy needs a golden set (mandate text → expected constraints) per
the bench_llm pattern before anyone trusts it. **Acceptance:** a solved portfolio
regenerates identically from the logged constraint set; the analyst reports binding
constraints truthfully; an unsatisfiable mandate returns infeasibility with the
conflicting constraints named, never a silently relaxed answer.
