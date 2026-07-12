## 9 · Future Evolution

### 9.1 Evolution A — Points-based EPC modelling, measure interactions, and calibrated penalties (analytics ladder: rung 2 → 3)

**What.** Two paired real-estate engines: an EPC Transition Risk scorer (composite risk vs country MEPS
timelines, stranding probability) and a Retrofit CapEx Planner (NPV/payback over an 8-measure catalogue,
greedy ROI selection to a target EPC) — pure calculators, no PRNG, already rung 2 (country-scenario
MEPS timelines). §7.5 names the deepening targets: **EPC steps are treated as additive and fungible**
across measures (real EPC/SAP scoring is points-based per building physics, so "2 steps from a heat
pump" is a stylisation); **measure interactions are ignored** (insulation reducing heat-pump savings —
savings sum linearly); energy vs carbon reduction metrics are **not reconciled** (kWh basis vs catalogue
%); and penalties/certainty/uplift are synthetic calibrations (real MEES fines are per-property caps,
not per-m²). Evolution A implements points-based EPC modelling with measure interactions and calibrates
the penalties.

**How.** The retrofit planner models EPC via a points/SAP-style building-physics calculation (measure
effects on the actual rating, not fixed additive steps) with interaction terms (insulation before heat
pump); energy and carbon reductions are reconciled from one kWh-saved basis; penalties are re-based to
the real regime structure (per-property caps for MEES, per-m² where actually applicable). Rung 3:
calibrate the green-premium uplift (3.5%/step) against RICS/JLL hedonic studies and the certainty
weights against enacted-vs-proposed policy status; wire live energy/grid factors from the ENTSO-E/EIA
ingesters (currently static per-country constants).

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /transition-risk` **failed** and
`/retrofit-plan` **skipped**; the FR DPE letters/years differ slightly from the actual Loi Climat
(§7.6) — reconcile. Preserve the honest "synthetic calibration" labelling on penalties/uplift.
**Acceptance:** the §7.4 GB office worked example (heat pump NPV +€670,081, projected EPC B, composite
57.3 High) reproduces at legacy calibrations; adding insulation before a heat pump reduces the heat
pump's marginal savings (interaction); energy and carbon reductions reconcile; the failing endpoints
pass the harness.

### 9.2 Evolution B — Real-estate retrofit-advisory copilot (LLM tier 2)

**What.** A tool-calling analyst for real-estate/lending teams: "what's this office's EPC transition
risk under UK MEES?" (`/transition-risk` → composite score, stranding probability, penalty exposure,
worst deadline), and "plan a retrofit to reach EPC B with the best ROI" (`/retrofit-plan` → ROI-ranked
measure selection, NPV/payback, projected EPC, green value uplift) — narrating the engines' real
outputs and the MACC-style measure ordering.

**How.** Tool schemas over the 2 POST + 3 GET operations; the reference endpoints (measure catalogue,
MEPS timelines, energy prices/grid factors) are ideal RAG grounding for "what's the UK MEES 2030
requirement?" or "what's the CapEx for a heat pump?" questions. The no-fabrication validator checks
every €, NPV, EPC step and stranding probability against tool output; the copilot must flag that
penalties, certainty weights and the green-premium uplift are synthetic calibrations until Evolution A.
Composable with the physical-risk and CRREM stranded-asset modules in a real-estate desk.

**Prerequisites.** Evolution A's harness fixes and points-based EPC model (so narrated projected-EPC and
NPV are physically credible); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every
figure cited traces to an engine tool call; the retrofit plan's projected EPC and NPV match
`/retrofit-plan`; the copilot names the worst MEPS deadline driving the transition-risk score and flags
the synthetic penalty/uplift calibrations.
