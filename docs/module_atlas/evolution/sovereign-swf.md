## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its own well-built engine and fix the failing endpoints (analytics ladder: rung 1 → 3)

**What.** This is the sovereign family's starkest frontend/backend disconnect: a genuinely excellent 1,279-line backend engine (`sovereign_swf_engine`, blast radius 48) implements real 24-principle GAPP/Santiago scoring, a faithful Norwegian GPFG exclusion screen, a PACTA-style portfolio-temperature calculator, and a Hartwick-Rule intergenerational-equity assessment over 25 real hand-curated SWF profiles — and **the frontend never calls it** (`SovereignSWFPage.jsx` has no fetch/axios anywhere), instead regenerating a 75-fund `sr()`-synthetic universe where even the 5 real-named funds (GPFG, ADIA, CIC) get fabricated Santiago/ESG/climate scores. On top of that, the lineage sweep records `POST /assess` and `/exclusion-screen` as **failed**. So the good model sits unused and partly broken while users see fabricated numbers. Evolution A is pure remediation: fix the endpoints, wire the page.

**How.** (1) Triage the failing `/assess` and `/exclusion-screen` routes (deployment-prep methodology). (2) Replace `buildData()`/the 75-fund synthetic array with calls to the 8 real `/api/v1/sovereign-swf/*` routes — the page's Santiago, ESG, climate, fossil-exposure, and portfolio-temperature displays all come from the engine that already computes them properly. (3) Surface the backend's unique assets the UI currently hides: the GPFG exclusion screen, the divestment-pathway calculator, and the Hartwick intergenerational-equity view. (4) Add source vintages to the 25 hand-curated SWF profiles (currently untagged).

**Prerequisites.** The `/assess` and `/exclusion-screen` failures are the gate; because blast radius is 48, engine-touching fixes need the shared-engine regression check. **Acceptance:** the page's SWF scores come from `/assess`, not `sr()`; GPFG's exclusion screen and portfolio temperature render from the engine; both failing routes pass the sweep.

### 9.2 Evolution B — SWF ESG-mandate analyst (LLM tier 2)

**What.** A tool-calling analyst over the (repaired) engine: "score this fund against the Santiago Principles", "run the GPFG exclusion screen on this holding", "assess intergenerational equity under the Hartwick Rule", "what's this SWF's portfolio temperature?" — each a call to a real endpoint, narrating the 24-principle GAPP breakdown, the exclusion verdict, or the PACTA-style temperature, never inventing scores.

**How.** Tool schemas from the module's OpenAPI operations (the POST assess/exclusion/intergenerational/divestment routes plus the GET reference endpoints for GPFG criteria and Santiago principles); grounding corpus = this Atlas record plus the reference payloads. The exclusion-screen narrative cites the specific GPFG criterion triggered; the no-fabrication validator checks every score against tool output.

**Prerequisites (hard).** Evolution A — the compute endpoints currently fail and the page shows synthetic scores, so there is no consistent, working surface to narrate. **Acceptance:** every Santiago/ESG/temperature figure traces to an engine call; exclusion verdicts cite the GPFG criterion; a fund outside the 25 profiles returns "not covered," not a fabricated score.
