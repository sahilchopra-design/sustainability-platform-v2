## 9 · Future Evolution

### 9.1 Evolution A — Fix the severity-string bug, wire the real engine, and fix the failing routes (analytics ladder: rung 1 → 3)

**What.** The §7 flag records a confirmed defect plus a disconnect: the frontend's sector- and holding-impact draws multiply by `s.severity.length` — the **character count of the severity label** — so `'Medium'.length=6 > 'High'.length=4`, meaning Medium-labelled scenarios can produce *larger* impacts than High ones, inverting the intended ordering. Meanwhile a real backend engine (`stress_test_orchestrator_engine`) implements a genuine PD-migration formula (`stressed_PD = baseline_PD × (1 + pd_uplift/100)` with carbon-intensity and physical-damage drivers and horizon scaling), but `POST /run`, `/scenario-comparison`, and `/pd-migration` are all recorded as **failed**, and the frontend fabricates sector/holding impacts rather than calling it. Evolution A fixes the bug, repairs the routes, and wires the page.

**How.** (1) Replace `s.severity.length` with a proper ordinal map (`{Low:1, Medium:2, High:3, Critical:4}`) — the single highest-priority fix. (2) Triage the three failing POST routes. (3) Wire the page to `POST /pd-migration` and `/run` so impacts come from the real PD-migration engine (carbon-intensity × price-multiplier + physical-damage × physical-multiplier, horizon-scaled) rather than `sr()` draws. (4) Implement the multi-framework `Combined = Σ(test_i × weight_i)` aggregation across ECB/BoE/Fed/APRA the guide promises via `/scenario-comparison`. (5) Fix the "Climate Stress" chart's arbitrary ×5 `gdpImpact` scalar to a methodologically comparable figure.

**Prerequisites.** The severity bug and the three route failures are the gates; the engine already exists. **Acceptance:** High-severity scenarios always produce larger impacts than Medium; sector/holding impacts come from `/pd-migration`; all three POST routes pass the sweep.

### 9.2 Evolution B — Multi-framework stress-orchestration analyst (LLM tier 2)

**What.** A tool-calling analyst for the regulatory-submission workflow: "run the ECB and BoE scenarios and compare capital depletion", "what's the stressed PD for the energy sector under NGFS Delayed Transition?", "generate the ECB SREP submission package" — calling `POST /run`, `/pd-migration`, and `/scenario-comparison`, narrating the real PD migration and the cross-framework comparison, never inventing capital numbers.

**How.** Tool schemas from the module's OpenAPI operations plus the `GET /ref/*` endpoints (NGFS Phase 4 scenarios, regulatory frameworks, sector-risk profiles, transmission channels) as the citation corpus; grounding = this Atlas record. Submission-package drafts route to the report-studio layer; the no-fabrication validator checks every PD/capital figure against tool output; provenance shows the engine version and scenario parameters.

**Prerequisites (hard).** Evolution A — the compute endpoints fail, the frontend impacts are fabricated, and the severity bug inverts ordering, so an analyst would narrate wrong-signed stress results. **Acceptance:** every PD/capital figure traces to an engine call; cross-framework comparisons use `/scenario-comparison`; a scenario or sector outside the reference set returns "not in scenario library," not an estimate.
