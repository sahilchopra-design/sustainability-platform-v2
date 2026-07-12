## 9 · Future Evolution

### 9.1 Evolution A — Apply the Wright's-Law curve the page only narrates, with live NREL refresh (analytics ladder: rung 1 → 2)

**What.** This is a well-grounded tier-B module: `TECHNOLOGIES` (8 cell types) and `EFFICIENCY_ROADMAP` (2010–2025) are entirely hand-curated from cited real sources (NREL Best Research-Cell Efficiency Chart, IEA Solar PV Roadmap 2023), and the `sr()` PRNG is defined but never called — every efficiency, cost, and market-share figure is a real constant. Its honest gap (§7.6) is that the Wright's-Law 24% learning rate in the file header is **descriptive context, not applied in any calculation**, and the cost/market-share data is a frozen snapshot. Evolution A activates the learning curve as a real projection engine and makes the reference data refreshable.

**How.** (1) Implement the cost-trajectory tab as an actual Wright's-Law projection: `C(Q) = C₀ × (Q/Q₀)^b` with `b = log₂(1−LR)`, per-technology LR configurable (the sibling `solar-module-manufacturing-economics` already does this — share the helper rather than fork). (2) Turn the PERC→TOPCon market-share narrative into a forecast: a logistic adoption curve fit to the 2022→2024 transition data the page already carries, projected to 2030. (3) A light refresh path — NREL updates the efficiency chart periodically; a small ingester keeps `efficiencyRecord` and `EFFICIENCY_ROADMAP` current with cited vintages rather than a hardcoded 2024 snapshot. (4) Attach BNEF-edition citations to `costPerWp` (currently plausible but uncited).

**Prerequisites.** LR priors per technology; a decision on NREL data cadence (annual). **Acceptance:** the cost tab projects future $/Wp from the learning-rate formula, not a static table; changing LR moves the projection; every efficiency value carries its NREL vintage.

### 9.2 Evolution B — Technology-selection copilot for developers and buyers (LLM tier 1)

**What.** A copilot for the EPC/equipment-buyer/investor users the module targets: "TOPCon or HJT for a hot-climate utility project?", "when does perovskite-Si tandem reach bankable maturity?", "which technology has the best temperature coefficient and lowest degradation?" — answered from the real `TECHNOLOGIES` fields (efficiency, tempCoeff, degradation, TRL/maturity, bifaciality) and the NREL/IEA framework context, never inventing datasheet numbers.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-cell-technology-analyzer/ask`, corpus = this Atlas record (§7.2 parameter table and the radar-axis rescalings) plus live page state. Comparison answers narrate deterministic sorts/filters over the technology table; the bankability/maturity discussion cites the TRL and maturity fields explicitly, with the honest caveat that TRL here is a qualitative judgment, not a formal assessment. Refusal for technologies outside the 8 covered.

**Prerequisites.** None hard — the data is already real and cited; Evolution A's live projections let the copilot answer forward-looking cost questions with computed values instead of caveated estimates. **Acceptance:** every efficiency/cost/tempCoeff figure in an answer matches the `TECHNOLOGIES` table; a roadmap question about a cell type not in the set returns a scoped refusal.
