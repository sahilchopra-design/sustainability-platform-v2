## 9 · Future Evolution

### 9.1 Evolution A — Data-driven scenario drags and portfolio-resolved stress (analytics ladder: rung 2 → 4)

**What.** The E45 engine implements six chained supervisory-climate assessments orchestrated by
`/full-assessment`: BOE BES (sector PD-uplift, LLT vs ELT legs), ECB climate stress (transition
vs physical EL), NGFS v4 CET1 drag paths (2025–2050 across 6 scenarios), an ICAAP overlay (Pillar
2a add-on + 2b buffer + SREP), Basel SRP 43.1 materiality, and a capital-overlays table. Scenario
drags use fixed coefficients (`_NGFS_TRANSITION_DRAG_COEF`, `_NGFS_PHYSICAL_DRAG_COEF`) scaled by
a linear `phase = (yr−2025)/25`, and the capital add-on is a flat `exposure × rwa_uplift × 0.08`.
Inputs are caller-supplied. Evolution A grounds the scenarios and connects real portfolios.

**How.** (1) Replace the fixed drag coefficients with the platform's canonical NGFS scenario data
(`ngfs_scenarios_extract` / `dh_ngfs_scenario_data`) so CET1 trajectories reflect actual scenario
variables, not a linear phase-in — and reconcile against the published ECB/BOE sample impacts the
engine already references. (2) Wire the stress to a real portfolio: pull exposures/sectors from
`portfolios_pg` and sector PDs from the credit engines so `/full-assessment` runs on the actual
book, not hand-entered aggregates. (3) Add the multi-year CET1-depletion trajectory with the
scenario as a proper path (rung 4). (4) Bench-pin stressed PD, EL, and the capital add-on.

**Prerequisites.** Canonical NGFS source linkage; `portfolios_pg`/credit-engine integration;
several POST endpoints trace `skipped` under the harness and must be confirmed callable.
**Acceptance:** scenario drags derive from NGFS data with provenance; `/full-assessment` runs on a
real portfolio's exposures; CET1 trajectories are multi-year paths; bench pins pass.

### 9.2 Evolution B — Supervisory-stress copilot for the CRO office (LLM tier 2)

**What.** A copilot that runs the prudential suite and explains it — "under the BOE BES
No-Action leg your climate RWA impact is X%, breaching the SRP 43.1 materiality threshold; the
ICAAP overlay adds Y bps of Pillar 2a; your worst NGFS scenario depletes CET1 by Z by 2050" —
each figure from a tool call.

**How.** Seven POST endpoints (the six assessments + full-assessment) plus reference GETs
(boe-bes, icaap-thresholds, ngfs-scenarios, sector-risk) that ground every supervisory framework.
The copilot's value is producing the ICAAP/stress narrative a CRO office assembles for the
regulator, always citing which assessment produced each number and the framework behind each
threshold. What-ifs across scenarios and legs re-run statelessly. Central node for a
prudential/regulatory desk, cross-linking to `stress_testing` and `model_validation`.

**Prerequisites.** Evolution A for defensible scenario figures — narrating fixed-coefficient
drags as supervisory results needs the honest caveat; endpoint fixes. **Acceptance:** every PD,
EL, RWA-impact, and CET1 figure traces to a tool response; the copilot names the supervisory
framework and threshold behind each verdict from the reference endpoints; it labels scenario
drags as coefficient-based until Evolution A grounds them in NGFS data, and refuses to assert
regulatory pass/fail.
