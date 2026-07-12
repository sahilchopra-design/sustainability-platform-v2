## 9 · Future Evolution

### 9.1 Evolution A — Actual Monte Carlo behind the (real) aggregation layer (analytics ladder: rung 1 → 2)

**What.** §7 splits the module precisely: the aggregation math is genuine — the
closed-form correlation combination `√(phys² + trans² + 2ρ·phys·trans)`, weighted
portfolio roll-up, Euler-style diversification, NGFS/horizon scaling — but the base
CVaR magnitudes underneath are `sr()`-seeded constants, and the advertised Monte
Carlo and copula tabs are parameter displays with no simulation behind them.
Evolution A builds the simulation the guide promises: multi-factor return draws per
asset class, climate factor shocks per NGFS scenario, expected shortfall computed
from the simulated tail (`CVaR = E[Loss | Loss > VaR_q]`), and scenario-probability
weighting π_s applied across the 6 scenarios — replacing the 192 seeded parameter
cells with distributions whose tails are actually sampled.

**How.** (1) A seeded, reproducible simulation engine (platform PRNG conventions;
percentile outputs bench-pinned so runs are regression-testable) — likely backend,
since 10⁴–10⁵ paths × 8 asset classes exceeds comfortable in-page compute; this would
be the module's first API route. (2) The copula tab made real for the two coded
families (Gaussian/t) with tail-dependence visible in the simulated joint losses.
(3) The existing closed-form aggregation retained as a validation cross-check — the
simulated and analytic CVaRs should reconcile within sampling error, which is itself
a powerful correctness test.

**Prerequisites.** Factor covariance and climate-shock parameters need documented
sources (NGFS paths for transition shocks; the twin's hazard data for physical);
seeded-constant purge per the guardrail. **Acceptance:** simulated CVaR converges to
the closed-form value on an uncorrelated fixture; bench pin on P95/P99 percentiles
passes across runs; the "Monte Carlo" tab actually runs one.

### 9.2 Evolution B — Tail-risk explainer and scenario runner (LLM tier 2)

**What.** An assistant for risk committees: "what drives our 99% climate CVaR under
Disorderly — physical or transition?" (the decomposition the module genuinely
computes), "how much diversification benefit are we claiming and why?" (Euler
attribution narration), "re-run at 99% with equal scenario weights" (a tool call into
the Evolution A simulation endpoint). CVaR is a concept committees routinely
misread — expected shortfall vs VaR — and a grounded explainer has real value here.

**How.** Tool schemas over the simulation and aggregation endpoints; every CVaR, VaR,
and contribution figure validated against tool outputs; methodology questions (why
expected shortfall, what π_s means) answered from the §5 corpus (Basel ES framework,
NGFS) with the module's actual parameter values cited, not textbook defaults.

**Prerequisites (hard).** Evolution A first — explaining tail risk computed from
seeded constants would lend false authority to noise; simulation reproducibility
(seed reporting) so any narrated number can be re-derived. **Acceptance:** a
decomposition answer reconciles to the Euler attribution output; the copilot states
simulation seed and path count when citing tail figures.
