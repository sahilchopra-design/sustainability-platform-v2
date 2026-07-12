## 9 · Future Evolution

### 9.1 Evolution A — A real copula engine behind the convincing shell (analytics ladder: rung 1 → 3)

**What.** §7's flag is the bluntest in the slice: "no model behind the numbers" —
every VaR, CVaR, λ_U, correlation, and copula AIC/BIC is an independent `sr()` draw
(so CVaR < VaR coherence violations can occur), no copula density is ever evaluated,
and the seeded portfolios are hedge-fund strategies rather than the climate-loss
assets the guide describes. The UI structure, however, is the right shape for the
real thing. Evolution A builds the engine: marginal fitting, copula calibration by
maximum likelihood, tail-dependence estimation, and Monte Carlo joint-loss
simulation — server-side, since 100k paths do not belong in React.

**How.** (1) Backend engine `copula_tail_risk_engine` with scipy/statsmodels:
GPD/GEV marginal fits for physical-loss series, Gaussian/Student-t/Clayton/Gumbel
calibration on rank-transformed data, real AIC/BIC comparison, analytic λ_U per
family, and MC simulation returning the VaR/CVaR ladder — pinned in `bench_quant.py`
with a fixed-seed reference case. (2) Domain correction: the asset universe becomes
climate-loss series the platform can actually supply — per-peril EALs from the
physical-risk pricing engine across regions, sector transition losses from the
stress-test engine — restoring the guide's stated purpose (ORSA/Solvency II climate
co-dependence). (3) Coherence guaranteed by construction (CVaR from the same
simulated distribution as VaR). (4) The curated `STRESS` crisis table stays as
grounding context.

**Prerequisites (hard).** Full `sr()` purge of the metrics layer; joint loss series
with enough observations to fit — where history is thin, the engine must report
fit-quality warnings, not silently fit 4 parameters to 12 points. **Acceptance:**
fixed-seed simulation reproduces; CVaR ≥ VaR always; Gaussian copula reports λ_U = 0
and Gumbel λ_U > 0 as theory requires; AIC ordering is stable across re-runs.

### 9.2 Evolution B — Tail-risk translator for ORSA/ICAAP committees (LLM tier 1 → 2)

**What.** Copula results are notoriously hard to communicate — the difference between
correlation and tail dependence is exactly what ORSA reviewers probe. Evolution B is
a copilot that explains the (post-Evolution A) engine output in supervisory language:
why the Student-t was selected (AIC table), what λ_U = 0.35 between European flood
and Mediterranean wildfire losses means for simultaneous-extreme capital, how the
copula VaR differs from the standalone sum, and drafts the ORSA section with every
figure from the engine payload. What-ifs ("re-simulate with df = 3") execute as tool
calls, never as in-context math.

**How.** Tier 1 ships on engine payloads plus this Atlas record and the McNeil-Frey-
Embrechts framing §5 cites; tier 2 adds tool schemas over the calibrate/simulate
endpoints with the fabrication validator on every percentage (simulated risk numbers
are prime hallucination bait). The copilot's caveat set comes from the engine's own
fit-quality warnings — thin data propagates to hedged language automatically.

**Prerequisites (hard).** Evolution A in full — narrating the current seeded shell
would put fluent authority on numbers with no model behind them, the worst failure
mode this platform's guardrails exist to prevent. **Acceptance:** every numeric in a
generated ORSA section matches an engine response; the copilot correctly refuses to
compare copula families the engine hasn't fitted for the selected universe; asked
"is this correlation or tail dependence?", it answers with the engine's actual λ_U
versus ρ values.
