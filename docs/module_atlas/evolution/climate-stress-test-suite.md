## 9 · Future Evolution

### 9.1 Evolution A — True reverse stress test via loss-surface optimization (analytics ladder: rung 2 → 3)

**What.** EP-CH3's most distinctive feature — the reverse stress test — is currently a
linear inversion with fixed slopes (`carbonPrice = targetFrac·1800 + 50`,
`gdpShock = −(targetFrac·12 + 1)`), which §7.5 concedes "returns *a* consistent shock
triple, not the minimum-distance or most-plausible breaking scenario." Evolution A
replaces it with a real solver: minimize the distance from baseline in
(ΔCarbonPrice, ΔGDP, physical-loss) space subject to portfolio loss ≥ target, evaluated
against the module's own forward model
`ECL_stressed = PD_base·(1 + β_sector·ΔGDP + γ·ΔCarbonPrice)·LGD·EAD`.

**How.** (1) New engine method in the shared `climate_stress_test_engine` (edits
propagate to `climate-stress-test` — coordinate) exposing the forward loss surface as a
callable; scipy SLSQP finds the nearest breaking point, with a scenario-plausibility
prior weighting the axes by NGFS-published ranges so the answer is "most plausible",
not just nearest. (2) Calibrate sector β/γ multipliers to the ECB CST 2024 published
shock parameters rather than curated approximations; keep the `sr()` idiosyncratic
pd/lgd noise out of the solver path. (3) Expose via
`POST /api/v1/climate-stress-test/reverse` and pin a reference case in `bench_quant.py`
(target 20% loss → documented shock triple).

**Prerequisites.** The five POST endpoints on this route family currently fail the
lineage harness — fix before adding a sixth; the seeded `pdNoise`/`lgdNoise` must be
excluded or seeded deterministically for solver reproducibility. **Acceptance:** the
solver's shock triple, pushed back through the forward model, reproduces the target
loss within 0.5%; monotonicity holds (higher target → weakly larger shocks).

### 9.2 Evolution B — Multi-regulator submission orchestrator (LLM tier 2 → 3)

**What.** This module already spans three regulators plus a `SUBMISSION_TIMELINE`
tracker — the natural seed of a desk-level workflow. Evolution B: an analyst that runs
the same book through `POST /ecb-cst`, `/boe-cbes`, and `/apra-clt`, calls
`/cross-framework` to reconcile, and produces a divergence memo ("BoE late-action PD
impact exceeds ECB disorderly because of the physical overlay") with each regulator's
figures traced to its tool call. Timeline questions ("what's due before the CBES
window?") answer from the `SUBMISSION_TIMELINE` data, and the orchestrator can draft
the per-regulator narrative sections in one pass.

**How.** Tier-2 tool schemas from the module's 9 endpoints; the tier-3 step is routing
to sibling modules — `climate-stress-test` for the IFRS-9/CET1 detail and
`regulatory-calendar` for deadline cross-checks — using the Atlas interconnection graph
as the routing map. Grounding corpus: §5's per-regulator methodology summary and §7.2's
parameter tables, so the model explains *why* frameworks diverge (shock design, not
arithmetic error).

**Prerequisites (hard).** All four regulator POST endpoints must pass the harness;
Evolution A's calibration so cross-framework divergences reflect published parameters
rather than curation artifacts. **Acceptance:** a cross-framework memo where every
number matches a tool response and each divergence explanation cites the specific
parameter difference (e.g. BoE physOverlay vs ECB lgdShock); refusal when asked about
regulators the module does not model (e.g. Fed pilot CA).
