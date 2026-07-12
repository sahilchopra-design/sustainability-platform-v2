## 9 · Future Evolution

### 9.1 Evolution A — Satellite-grounded super-emitter detection and prescriptive MACC (analytics ladder: rung 2 → 5)

**What.** The E58 engine implements seven methane sub-modules: GWP-100 vs GWP-20 impact,
EU Methane Regulation 2024/1787 compliance (€250/t excess penalty), OGMP 2.0 level gaps,
super-emitter detection vs UNEP IMEO thresholds (`satellite_detectable = ch4_kg_hr >
25 t/hr`), a sector-filtered abatement curve with commodity-recovery economics, and LDAR
inspection cadence. It's strong scenario/economic work but the super-emitter detection is
a threshold rule on self-reported tonnage, and the MACC ranks abatement without
optimising a budget. Evolution A grounds detection in observations and makes the curve
prescriptive.

**How.** (1) Wire super-emitter detection to real satellite observation feeds (UNEP IMEO
/ TROPOMI plume data) so `satellite_detectable` reflects actual detections against a
facility, not just a computed probability from reported emissions. (2) Turn the abatement
curve into a prescriptive optimiser (rung 5): given a capex budget and the
`methane_commodity_value` recovery credit, select the abatement portfolio maximising
tonnes-abated subject to budget — scipy optimisation, the roadmap's named first-mover
pattern for MACC engines. (3) Bench-pin GWP impact, EU penalty, and the MACC selection.

**Prerequisites.** Satellite plume feed integration (external data — the IMEO threshold
logic exists but no live feed is wired); a facility-to-observation matching key.
**Acceptance:** super-emitter flags cite an observation source when available (falling
back to the computed probability with a tier label); `/abatement-curve` returns an
optimal budget-constrained portfolio, not just a sorted list; bench pins pass.

### 9.2 Evolution B — Methane compliance and abatement copilot (LLM tier 2)

**What.** A copilot for oil-and-gas operators: "are we OGMP L3-compliant by the 2026 EU
minimum, and what's our penalty exposure?" (calling `/ogmp-level` and `/eu-regulation`),
and "what's the cheapest way to cut our methane intensity to the 0.2% target?" (calling
`/abatement-curve` and narrating the zero-cost vs paid measures).

**How.** Five computational POST endpoints plus three reference GETs (GWP values, OGMP
levels, EU methane timeline) that ground every regulatory threshold and date. The engine's
rich economic outputs (capex, commodity revenue, zero-cost %) let the copilot build a
credible abatement narrative. What-ifs ("if gas price rises, how much abatement turns
cash-positive?") re-run statelessly. Natural node for an energy-desk emissions review.

**Prerequisites.** Several POST endpoints trace `skipped` in §4.2 under the harness —
confirm callable before wiring. **Acceptance:** every tonnage, penalty, and abatement
figure traces to a tool response; compliance-date claims cite the `/ref/eu-methane-timeline`
endpoint; the copilot labels abatement recommendations as pre-optimisation ranked (not
budget-optimal) until Evolution A ships the optimiser, and refuses to assert regulatory
compliance beyond the computed score.
