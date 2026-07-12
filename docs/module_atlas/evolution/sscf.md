## 9 · Future Evolution

### 9.1 Evolution A — Consume the response instead of discarding it, and fix the failing routes (analytics ladder: rung 1 → 3)

**What.** Like `sovereign-swf`, this is a fire-and-forget disconnect: a real 1,560-line backend engine (`sscf_engine`) implements OECD DDG 5-step due-diligence scoring, CSDDD adverse-impact cascade detection, an SPT-linked margin-ratchet step schedule, and a GSCFF-standard dynamic-discounting formula — and the frontend **calls `POST /assess` but throws the response away** (`await axios.post(...)` with no assignment; the catch block only comments "API fallback to seed data"). Every number comes from `buildData()`, a hash-seeded client-side generator. The lineage sweep records `/assess`, `/dynamic-discount`, and `/margin-ratchet` as **failed**. And `MOCK_SUPPLIERS.risk` (Low/Medium/High) is never used to compute the ESG score, so a "High" risk supplier can draw a high synthetic score. Evolution A wires the response and fixes the routes.

**How.** (1) Triage the three failing POST routes. (2) Assign and render the `/assess`, `/supplier-score`, `/margin-ratchet`, and `/dynamic-discount` responses into component state, replacing `buildData()` — the backend's discrete margin-ratchet step function and log-curve KPI scoring are materially more defensible than the frontend's continuous linear approximations and already exist in production Python. (3) Wire `MOCK_SUPPLIERS.risk` into the supplier scoring so risk labels are consistent with ESG scores. (4) Surface the OECD DDG 5-step and CSDDD adverse-impact cascade the engine computes but the UI hides.

**Prerequisites.** The three route failures are the gate; the fix is wiring plus rendering, not a new model. **Acceptance:** the page's scores come from the engine responses, not `buildData()`; all three POST routes pass the sweep; a High-risk supplier can no longer show a top ESG score.

### 9.2 Evolution B — Supply-chain-finance structuring analyst (LLM tier 2)

**What.** A tool-calling analyst over the repaired engine: "score this supplier's ESG for a rate adjustment", "compute the margin ratchet for these SPTs", "run OECD due-diligence on this programme", "what's the dynamic discount at this ESG score?" — each a call to a real endpoint, narrating the margin-ratchet step schedule, the OECD DDG 5-step verdict, and the CSDDD adverse-impact flags, never inventing spreads.

**How.** Tool schemas from the module's OpenAPI operations (4 POST compute + 3 GET ref for frameworks, sector-risk, OECD-DDG); grounding corpus = this Atlas record plus the reference payloads. The due-diligence narrative cites the specific OECD DDG step and any CSDDD adverse impact; the no-fabrication validator checks every bps against tool output. IFC SSCF / LMA SLLP framework grounding.

**Prerequisites (hard).** Evolution A — the compute endpoints currently fail and the page discards responses, so there is no working surface to narrate. **Acceptance:** every rate/discount/score traces to an engine call; due-diligence findings cite the OECD DDG step; a supplier lacking KPI data returns "insufficient data to score," not a fabricated rate.
