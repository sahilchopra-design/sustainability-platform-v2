## 9 · Future Evolution

### 9.1 Evolution A — Wire the rigorous engine to the page and add the S-curve adoption model (analytics ladder: rung 2 → 3)

**What.** §7 documents an unusual split: a production-grade backend engine (`food_system_engine.py`) with deterministic, honest-null SBTi FLAG assessment, FAO GAEZ yield projections, TNFD LEAP, EUDR screening, farm-level GHG accounting, and LDN — but the frontend page renders its own local constants and `sr()`-seeded company scores, never calling it, and the guide's compound-adoption Protein Transition Market Model (`AltProteinShare_t = AltProteinShare_0·(1+r)^t`) is implemented by neither. Evolution A does two things: wire the page's company and FLAG views to the real engine endpoints, and implement the missing S-curve adoption model as an engine method feeding the alt-protein market and stranded-asset analytics.

**How.** (1) Replace the `sr()`-seeded `COMPANIES` scope3/transitionScore with `compute_agricultural_emissions` and `assess_sbti_flag` calls (the engine already computes required FLAG reductions deterministically — 30% crops/livestock, 72% forests). (2) Add a logistic/compound adoption method with documented adoption-rate assumptions, netting the diet+tech+waste levers so the pathway can't exceed 100% (a §7.5-flagged bug). (3) Keep the real Poore & Nemecek category intensities (a genuine strength).

**Prerequisites.** Seeded company panel replaced by engine-computed or user-entered entities; the additive-lever overlap fixed. **Acceptance:** a company's FLAG target and emissions on the page equal the engine's `assess_sbti_flag`/`compute_agricultural_emissions` output for the same inputs; the adoption pathway is bounded and reproduces the compound formula.

### 9.2 Evolution B — Protein-transition and FLAG copilot (LLM tier 2)

**What.** A copilot for food-sector equity and impact analysts: "assess this meat processor's FLAG target gap and stranded-asset exposure under a fast protein-transition scenario" tool-calls the engine's `assess_sbti_flag`, `compute_agricultural_emissions`, `assess_eudr_food`, and the Evolution A adoption model, narrating FAIRR-aligned transition risk with every figure engine-sourced.

**How.** Tier-2 tool-calling over the engine's already-rich endpoint set (the module is tier-A with a real OpenAPI surface); the grounding corpus is §5/§7, which accurately encode SBTi FLAG v1.0, FAO GAEZ, TNFD LEAP, EUDR, and Poore & Nemecek. The engine's honest-null discipline is a copilot asset — unassessed pillars return None, so the copilot naturally reports data gaps rather than inventing scores. Fabrication validator checks every tonnage and target figure.

**Prerequisites.** Evolution A wiring (so the copilot narrates engine output, not the page's local constants); RBAC-scoped entity data. **Acceptance:** every FLAG target, emission, and EUDR-compliance figure traces to an engine tool call; asked for a PCAF data-quality score the caller didn't supply, the copilot reports it as not-assessed per the engine's null contract.
