## 9 · Future Evolution

### 9.1 Evolution A — Stochastic DSCR stress and calibrated crowding-in (analytics ladder: rung 2 → 4)

**What.** The `InfrastructureFinanceEngine` ("pure computation — no DB calls") runs eight
project-finance sub-modules: Equator Principles IV, IFC PS1–8, OECD Common Approaches,
Paris alignment, DSCR climate stress, blended finance, climate-label eligibility, and a
full assessment. The DSCR stress is deterministic single-shot —
`dscr_combined = baseline × (1 − phys_haircut − 0.5·transition_capex − 0.5·revenue_reduction)`
against a 1.20× covenant — and the blended-finance crowding-in
(`private_finance_mobilised = mdb_amount × crowding_in`) uses a caller-supplied
multiplier. Evolution A makes the DSCR stress probabilistic and calibrates mobilisation.

**How.** (1) Turn `/dscr-stress` into a Monte Carlo / scenario-grid over the physical and
transition haircut inputs (NGFS/CRREM-linked), returning a DSCR distribution and
probability of covenant breach across the debt tenor, not one number — this is the
rung-4 move the QMC/scenario-matrix pattern from Financial Modeling Studio templates.
(2) Calibrate the `crowding_in` multiplier against observed blended-finance leverage
ratios (OECD/Convergence data) by structure type, replacing the free input with a
prior-plus-override. (3) Bench-pin EP categorisation, IFC composite, and DSCR against
worked examples.

**Prerequisites.** NGFS/CRREM linkage for physical/transition haircuts (available via
the glidepath/scenario modules); a blended-finance leverage reference set. **Acceptance:**
`/dscr-stress` returns a breach probability and DSCR percentiles; crowding-in defaults to
a calibrated per-structure value with provenance; bench pins pass for the compliance
scorers.

### 9.2 Evolution B — Project-finance E&S structuring analyst (LLM tier 2)

**What.** A copilot that runs a project through the eight sub-modules and narrates the
integrated verdict — "this is EP Category A; IFC PS composite 78; Paris-aligned on
mitigation but weak on adaptation governance; DSCR survives the physical stress but
breaches under combined" — each figure from a tool call, and structures a blended-finance
proposal via `/blended-finance`.

**How.** Eight POST endpoints plus `/ref/*` tables (EP principles, IFC PS, Paris
alignment, blended structures) that ground every framework definition. The full
assessment endpoint gives the copilot a one-call cross-module verdict; individual
endpoints let it drill down. What-ifs ("re-run DSCR with a 20% revenue haircut", "raise
MDB share to 40%") are stateless re-calls. This module is a strong tier-3 Desk
Orchestrator node for an infrastructure/energy desk.

**Prerequisites.** Several POST endpoints trace as `skipped` in §4.2 under the harness —
confirm they're callable with valid payloads before wiring as tools. **Acceptance:**
every score, category, and DSCR figure traces to a tool response; blended-finance
proposals cite only structures from `/ref/blended-structures`; the copilot flags the
DSCR result as deterministic-only until Evolution A's probabilistic version ships.
