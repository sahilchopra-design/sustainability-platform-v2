## 9 · Future Evolution

### 9.1 Evolution A — Fix the interaction-term defect, then estimate instead of assert (analytics ladder: rung 2 → 3)

**What.** EP-CE1 has genuine scenario mechanics (5 NGFS scenarios × slider-driven
closed-form VaR, correct one-sided normal quantiles) but §7 documents a live
dimensional bug: `climateCVaR` computes the interaction as `ρ × transVaR × physVaR`
without dividing by AUM — a $M² product that at default settings is 15.8× the two main
terms and pushes total VaR to ~135% of AUM. The in-code comment even prescribes the fix
("/ aum keeps units"). Evolution A repairs that, connects the engine to real portfolio
weights, and replaces the two asserted panels — synthetic scenario loss rates and the
hard-coded 6-row ΔCoVaR table — with estimated quantities.

**How.** (1) One-line fix in `frontend/src/engines/climateRisk.js` plus the
horizon-sensitivity chart's dropped confidence argument (§7.3); regression-pin the
corrected default case. (2) Portfolio mode: load sector weights from `portfolios_pg`
and compute sector-conditional VaR with the shared NGFS carbon-price paths, so
`trans_s`/`phys_s` become weighted sector rates with documented sources rather than the
uncited "95% baseline calibration" — and revisit the ordering §7.2 questions (Net Zero
2050 as worst-loss scenario, opposite to NGFS credit-loss orderings). (3) ΔCoVaR per
Adrian & Brunnermeier: quantile regression (statsmodels) over sector return series from
the platform's market-data seed, replacing the six illustrative constants.

**Prerequisites (hard).** The interaction bug blocks everything — no output above ~$3B
AUM is credible until fixed (§7.6); a sector return history source for the CoVaR
estimation. **Acceptance:** total VaR ≤ AUM across the full 5×7 stress matrix;
interaction term reported in $M with correct dimension; ΔCoVaR values carry estimation
standard errors, not hard-coded decimals.

### 9.2 Evolution B — VaR decomposition explainer with what-if execution (LLM tier 1 → 2)

**What.** A copilot answering the questions this page's decomposition invites: "why
does Divergent Net Zero carry the highest coupling?", "what does the interaction term
mean economically?", "how much of my VaR is horizon scaling?" — grounded in §5's
formula, §7.2's scenario parameter table, and the current slider state. What-ifs
("show me 2040 at 99% under Delayed Transition") execute by driving the same
`computeCVaR` parameters the sliders drive — deterministic, replayable, no numeric
generation by the model.

**How.** Tier 1 ships against page state alone (the module has zero endpoints — a
documented fact, so tier 2 tool-calling waits for Evolution A's portfolio-mode
backend). The grounding corpus must include §7's mismatch flag history so the copilot
can answer "was this number always right?" honestly — a rare case where documenting a
fixed defect builds user trust. Once Evolution A lands, tool schemas cover the
portfolio VaR and ΔCoVaR endpoints, and the fabrication validator checks each
percentage in the answer against computed output.

**Prerequisites (hard).** Evolution A's interaction fix — an LLM fluently explaining a
dimensionally wrong 135%-of-AUM number would compound the harm; §7.6's limitations
(normal tails, √T i.i.d. assumption) must appear in the copilot's caveat repertoire.
**Acceptance:** every numeric traces to page state or a tool call; asked for
tail-dependence or fat-tail VaR, the copilot states the engine assumes normality and
declines to extrapolate.
