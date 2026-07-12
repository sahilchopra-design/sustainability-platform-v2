## 9 · Future Evolution

### 9.1 Evolution A — Kigali phase-down scenario engine (analytics ladder: rung 1 → 2)

**What.** §7 rates this module a genuinely correct CDM AM0001/AMS-III.L/VM0024
implementation — real AR6 GWP100 values, correct `ER = BE − PE` with regulatory-surplus
baseline adjustment, real destruction-tech efficiencies — with no §8 gap. The honest
next rung is therefore scenario capability, and the seed for it already sits unused in
the page: the `KIGALI_PHASES` dataset (baseline year, freeze, −10%, −85% steps).
Evolution A turns the static additionality test into a forward regulatory-surplus
trajectory: as Kigali Amendment phase-down percentages ratchet, the policy baseline
shrinks and creditable ER decays on a project-specific schedule.

**How.** (1) Extend `calcIndustrialGas` with a year axis: `policy_baseline_pct(t)`
stepped from the Kigali schedule per Article-5 vs non-Article-5 party grouping, so
`baseline_quantity(t)` and net credits are computed per vintage year to 2047.
(2) Scenario grid over destruction technology (the 5-row `DESTRUCTION_TECHS` table has
real capex/opex per tonne) producing abatement cost per tCO₂e by gas — HFC-23's 14,600
GWP versus N₂O's 273 makes this ranking the module's most decision-relevant output.
(3) Crossover chart: the year regulatory surplus reaches zero and crediting ends.

**Prerequisites.** Kigali schedule encoded from the treaty text with party-group
mapping, not approximated. **Acceptance:** an Article-5 HFC-23 project shows credits
stepping down at 2029/2035/2045 checkpoints; abatement-cost ranking reproduces the
capex/opex table arithmetic exactly.

### 9.2 Evolution B — High-GWP additionality copilot (LLM tier 1)

**What.** A copilot for the trickiest concept on this page: regulatory-surplus
additionality. It answers "why did my baseline drop 30%?" (because the policy baseline
deduction reduces `baseline_quantity` before GWP multiplication — the exact §7
mechanic), "which GWP vintage applies?" (AR6 values are hard-coded; AR4-era contracts
differ materially for HFC-23), and "is thermal oxidation suitable for SF₆?" from the
`DESTRUCTION_TECHS` suitability flags.

**How.** Tier-1 pattern: this atlas record embedded as corpus, live calculator inputs
and results injected; answers cite §5 standards (AM0001 v6, VM0024, AR6 WGI Ch.7 GWP
table) or on-screen numbers. GWP-vintage questions are answered from the reference
list, flagged clearly when the platform value (AR6) differs from a user's contract
basis (AR4/AR5) — an explanation task, not a computation.

**Prerequisites.** None — guide↔code agreement is documented, so the corpus needs no
remediation before narration. **Acceptance:** the copilot correctly decomposes a net-
credit figure into baseline, project, and surplus terms matching the calculator; a
probe about future CER prices is refused as outside module scope.
