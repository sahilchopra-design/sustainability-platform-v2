## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to the real LCOH engine and drop the seeded jitter (analytics ladder: rung 2 → 3)

**What.** §7 documents a wiring gap: a real backend `green_hydrogen_engine.py` implements `calculate_lcoh` (CRF + four cost components + IEA CAPEX trajectory) plus ISO GHG intensity and RFNBO additionality, but this page renders synthetic `sr()`-seeded projects and computes LCOH as a reduced-form approximation with a hard floor and seeded jitter — so on-page numbers omit real cost components and drift from the authoritative engine. §7 explicitly names the remediation: wire the page to the engine and drop the simplified `lcoh`/`lcohAdj` client formula. Evolution A does exactly that, and grounds the project panel in real electrolyser-project data so the demand-sector and technology comparisons reflect actual economics.

**How.** (1) Replace the client `lcoh`/`lcohAdj` formula and its floor/jitter with calls to the engine's `calculate_lcoh`, so every displayed LCOH is the deterministic engine output. (2) Source the `PROJECTS` panel from a real electrolyser-project database or make it user-editable, replacing the seeded rows. (3) The technology comparison (4 green electrolysers × 6 regions) uses engine-computed LCOH with regional electricity prices.

**Prerequisites.** The engine's `calculate_lcoh` exposed as an endpoint; the seeded `sr()` projects and the floor/jitter removed (§7-flagged drift). **Acceptance:** every on-page LCOH equals the engine output (no floor/jitter); the four cost components are reflected; no `sr()` value drives a displayed LCOH.

### 9.2 Evolution B — Hydrogen-economics copilot (LLM tier 2)

**What.** A copilot for hydrogen investors: "compare PEM vs alkaline LCOH across 6 regions at their local electricity prices, and which demand sectors reach cost parity first?" tool-calls the engine's LCOH endpoint across technologies/regions and narrates the cost-parity timeline and demand-sector economics.

**How.** Tier-2 tool-calling over the real engine (the module is tier-A — a strong candidate once Evolution A wires the page); the grounding corpus is §5/§7, which encode the CRF LCOH model, the IEA CAPEX trajectory, and the electricity-cost dominance. The copilot's value is cross-technology/region LCOH comparison and parity timing. Guardrail, pre-Evolution-A: the page's LCOH has seeded jitter, so the copilot must call the engine directly rather than narrate page state. Every LCOH figure validated against engine output.

**Prerequisites.** Evolution A wiring (the copilot must use engine output, not the jittered page); prompt-caching. **Acceptance:** every LCOH figure traces to an engine tool call; the region/technology comparison uses engine LCOH; the copilot never quotes the floored/jittered client value.
