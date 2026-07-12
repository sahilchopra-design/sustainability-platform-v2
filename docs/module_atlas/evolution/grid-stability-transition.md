## 9 · Future Evolution

### 9.1 Evolution A — Swing-equation frequency engine replacing the slider heuristics (analytics ladder: rung 2 → 3)

**What.** Today the page is honest what-if (rung 2) but physically hollow: everything derives from one `rePct` slider via stylised curves — `inertia = max(5, 100−rePct×0.9)`, `storageGWh = rePct²×0.02` — and the documented guide↔code mismatch says the swing equation is claimed but never solved. Evolution A implements the §8 specification as this module's first backend vertical: `H_sys = Σ(Hᵢ·Sᵢ·onlineᵢ)/S_base`, `RoCoF = f₀·ΔP/(2·H_sys·S_base)`, and a nadir estimate from FFR volume and droop, calibrated against published EirGrid/NG-ESO system-inertia studies.

**How.** (1) New `grid_stability` engine + route with a generator-fleet table per system (H constants 2–9s, MVA, must-run flags) seeded for the 6 real `GRIDS` systems (ERCOT, CAISO, Germany, India…). (2) The RE-penetration slider dispatches the fleet (thermal displaced in merit order) and recomputes H_sys and RoCoF from actual online machines, not a linear proxy. (3) Curtailment from hourly load-shape variance rather than the `(rePct−50)×0.3` kink. (4) Publish a §8 model card and pin one reference case in bench_quant.

**Prerequisites.** Generator inertia/MVA reference data per system (NREL/ENTSO-E public datasets); the existing frontend heuristics retired, not layered under the engine. **Acceptance:** ERCOT at its actual 38% RE reproduces a RoCoF within the band of published TSO studies; the guide↔code mismatch flag in §7 can be removed.

### 9.2 Evolution B — Grid-transition copilot for frequency-risk narration (LLM tier 1)

**What.** A copilot on the EP-CL2 page that answers "why does frequency risk go Critical above 80% RE?", "what does 1.15 Hz/s RoCoF mean against the ~0.5–1 Hz/s TSO limit?", and "which of the 6 seeded grids is closest to the storage inflection?" — grounded strictly in this Atlas page (§5 inertia-decline model, §7 heuristic parameterisation, §8 spec) and the live slider state.

**How.** Tier 1 RAG per the roadmap: this module's atlas record embedded into `llm_corpus_chunks`; the page passes current `rePct` and the derived state (`inertia`, `storageGWh`, `curtailmentPct`, `freqRisk`) as conversation context so answers narrate the numbers actually on screen. The system prompt must carry the §7 mismatch flag verbatim: the copilot says "stylised heuristic, not solved grid physics" whenever asked about model fidelity, and cites the §8 spec as the planned upgrade. No tool-calling is possible yet — the module has zero backend endpoints — so tier 2 is gated on Evolution A shipping.

**Prerequisites.** Module copilot router (`POST /api/v1/copilot/{module_id}/ask`) and pgvector corpus from the roadmap Phase 1; page-state serialization into the prompt. **Acceptance:** asked "is this real swing-equation physics?", the copilot answers no and cites §7; every numeric it quotes matches the on-screen derived state.
