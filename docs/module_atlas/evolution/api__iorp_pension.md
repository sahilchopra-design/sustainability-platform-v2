## 9 · Future Evolution

### 9.1 Evolution A — Stochastic funding-ratio projection and calibrated shocks (analytics ladder: rung 2 → 4)

**What.** The E8 `IORPPensionEngine` runs an EIOPA-2022-style IORP II climate stress
test: per NGFS-flavoured scenario it applies asset-class losses and a
duration/longevity/inflation liability shock, yielding
`funding_ratio_post = stressed_assets / stressed_liabilities`, plus recovery-plan (<100%)
and supervisory (<90%) triggers, the 12-item Art 28 ORA checklist, and an SFDR summary.
It is solid scenario work (4 NGFS scenarios), but single-path and single-horizon — one
funding ratio per scenario, no distribution and no glidepath over time. Evolution A adds
stochastic and multi-period projection.

**How.** (1) Project the funding ratio across the recovery-plan horizon (typically
multi-year) rather than a single post-stress snapshot, so the recovery/supervisory
triggers apply to a trajectory. (2) Monte Carlo the asset-class shocks and discount-rate
shift (the engine already parameterises `discount_shift_bps`, `longevity_shock`,
`inflation_uplift`) to return a funding-ratio distribution and probability of breaching
100%/90% — the rung-4 predictive move. (3) Calibrate the per-asset-class stress
magnitudes against NGFS market-risk factors rather than fixed scenario constants. (4)
Persist runs to `iorp_stress_runs` (currently db-empty in the `/history` trace) so
history works, and bench-pin the funding-ratio math.

**Prerequisites.** `iorp_stress_runs`/`iorp_scenario_results` write path activated (the
tables exist but `/history` traces db-empty); NGFS market-risk factor linkage.
**Acceptance:** `/assess/scenario` returns a funding-ratio distribution with breach
probabilities; `/history` returns real persisted runs; bench pin reproduces
pre/post funding ratios.

### 9.2 Evolution B — Trustee-facing pension stress copilot (LLM tier 2)

**What.** A copilot that runs `/assess/scenario` for a fund and explains the result to a
trustee — "under disorderly transition your funding ratio falls from 108% to 94%,
triggering supervisory review; the biggest driver is your 30% equity sleeve; here are
the ORA items still open" — every number from a tool call, with what-ifs on asset
allocation.

**How.** Two POST endpoints (`/assess/scenario`, `/assess/batch`) plus reference GETs
(scenarios, sfdr-classes, frameworks, fund-types, ora-checklist) that ground the IORP II
regime. The ORA checklist endpoint drives a compliance-gap narrative; batch supports
multi-scheme sponsors. What-ifs ("what if we cut equity to 20%?") re-run the engine
statelessly. Guardrail: present funding-ratio outputs as regulatory-stress indicative,
not actuarial valuation.

**Prerequisites.** None hard for tier-1 narration; for the "show my run history" feature,
Evolution A's persistence fix. **Acceptance:** every funding ratio, trigger, and ORA
item cited traces to a tool response; asset-allocation what-ifs reflect fresh engine
calls; the copilot refuses to state a scheme's statutory funding position (which this
stress test does not compute) and says so.
