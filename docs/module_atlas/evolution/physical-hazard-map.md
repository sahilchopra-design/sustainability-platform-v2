## 9 · Future Evolution

### 9.1 Evolution A — Wire the unused backend engine into the map (analytics ladder: rung 2 → 4)

**What.** §7 documents a "correct engine, unused" pattern: a real, well-built `physical_hazard_engine.py` exists at `/api/v1/physical-hazard/*` (`score-hazard`, `composite-risk`, `financial-impact`, `crrem-check`, `full-assessment`) implementing IPCC AR6 WG2 + JRC Climate Hazard Atlas base scores, RCP multipliers, honest-null handling, weighted-composite renormalisation over available hazards, and CRREM stranding-year checks — but `PhysicalHazardMapPage.jsx` calls none of them, instead generating its own synthetic dataset with a *different* peril taxonomy (8 vs 7) and a *different* scenario-multiplier table, using a plain unweighted mean instead of the engine's `Σ(score×weight)/Σweight`. §8 explicitly recommends wiring, not rebuilding.

**How.** (1) Replace the frontend's synthetic generation with calls to `POST /full-assessment` (and the granular `score-hazard`/`composite-risk`/`financial-impact`/`crrem-check` for the per-tab drill-downs), so the map renders the engine's real weighted composite and CRREM checks; the three reference GETs (`hazard-profiles`, `country-hazard`, `adaptation-measures`, all `passed`) drive the pickers and the Adaptation Options content. (2) Reconcile the peril taxonomy — adopt the engine's 7-hazard design (the frontend's flood-split is cosmetic). (3) Rung-4: upgrade the engine's country-level base scores to the Physical Risk Digital Twin's per-coordinate `ref_*_zones` grids so two assets in the same country differ by micro-location — the same asset-resolution ladder the flagship `physical-risk-pricing` module follows.

**Prerequisites.** `POST /composite-risk` is `skipped` in the lineage sweep (needs a request fixture) and REQUIRE_AUTH gates POSTs — exercise under auth first. **Acceptance:** the map renders engine output (weighted composite, not the frontend mean); same-country assets at different coordinates differ; no `sr()` in hazard scores.

### 9.2 Evolution B — Asset-hazard assessment copilot (LLM tier 2)

**What.** A copilot for the workflow §1 describes: "score these asset coordinates for flood and heat under SSP5-8.5", "what's the financial impact and is this real-estate asset CRREM-stranded?", "which adaptation measures reduce the composite most?" — executed against the real hazard engine's five endpoints, decomposing the composite into per-peril contributions.

**How.** Tool schemas from the module's OpenAPI operations; system prompt from this Atlas page's §5 (the weighted-composite formula, `H = Σwᵢperilᵢ/Σwᵢ`) and the IPCC AR6 / JRC references named in §5. The CRREM-stranding and financial-impact answers are tool calls to `crrem-check`/`financial-impact`; adaptation recommendations cite `/ref/adaptation-measures`. The engine's honest-null handling must surface as "no reference data for this hazard/location" rather than an invented score, and the fabrication validator matches every hazard/loss figure to a tool response.

**Prerequisites (hard).** Evolution A — the copilot must call the real engine, not narrate the frontend's current synthetic scores; the POST-auth blocker must be resolved. **Acceptance:** every hazard/composite/loss figure traces to an endpoint call; CRREM verdicts come from `crrem-check`; the copilot returns honest-null where reference data is missing.
