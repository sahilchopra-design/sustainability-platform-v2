## 9 · Future Evolution

### 9.1 Evolution A — Wire the real engine to the page and repair the POST routes (analytics ladder: rung 1 (UI) / 2 (engine) → 3)

**What.** The hard part is already built: a 1,431-line `vcm_integrity_engine` with
correctly weighted/gated ICVCM CCP scoring (10 criteria, blocking set {C4–C7}),
SBTi-gated VCMI tiers, and banded Oxford Principles — but §7's flag documents that
`runAssess()` posts to `/assess` and **discards the response**, re-rendering a
disconnected frontend `seededRandom()` generator whose criteria mapping doesn't even
match the backend's (frontend "C3 Additionality" vs backend C4). Two users assessing
the same project via API vs UI get different CCP eligibility. The lineage harness also
shows all three POSTs (`/assess`, `/batch-assess`, `/registry-screen`) currently
**failed** while the five `/ref/*` routes pass. Evolution A: fix the POST failures,
bind `runAssess()`'s response into component state, delete
`getICVCMData`/`getVCMIData`/`getOxfordData`/`getIntegrityData`, and then take the
engine to rung 3 by pinning worked cases in `bench_quant` (the §7.4 REDD+ blocking-
failure example is the natural first pin) and benchmarking `ADDITIONALITY_PROFILES`
against ICVCM's published 2023–24 category assessment decisions.

**How.** Diagnose POST failures (ref routes pass, so likely request-schema mismatch);
frontend refactor is removal, not construction; add `engine_version` to the response
for provenance.

**Prerequisites.** The documented false-impression defect (§7.6: the assess button
"calls the real backend... and throws it away") is the blocker and must be named in
the changelog. **Acceptance:** lineage harness passes all 8 routes; UI and API return
identical CCP eligibility for the same inputs; bench pin reproduces the REDD+ C4
blocking failure.

### 9.2 Evolution B — Credit due-diligence analyst with portfolio batch screening (LLM tier 2)

**What.** Pre-purchase due diligence is this module's stated job, and the engine's
outputs are decision-shaped: CCP eligibility with named blocking criteria, VCMI claim
ceiling, quality tier, price benchmarks. Evolution B is a tool-calling analyst:
"screen this book of 40 credits (registry, methodology, vintage, volume) and tell me
which support a VCMI Silver claim" runs `POST /batch-assess`, cross-references
`GET /ref/vcmi-claims` and `/ref/price-benchmarks`, and returns a ranked table with
per-credit rationale — e.g. "fails C4 Additionality (0.65 < 0.70 threshold), a
blocking criterion; consistent with ICVCM's exclusion of legacy REDD+ methodologies."
The engine's `_generate_recommendations` output becomes the copilot's raw material,
never its own invention.

**How.** Tier-2 stack: tool schemas from the 8 existing OpenAPI operations; grounding
corpus is this Atlas page (§7.2's criteria/weights table gives exact vocabulary) plus
the `/ref/*` payloads. The no-fabrication validator checks every score and threshold
against tool outputs; provenance caveats from §7.6 (registry_base and profiles are
expert-calibrated point estimates, not a published dataset) are surfaced when users
ask "where does 0.82 for Verra come from?".

**Prerequisites (hard).** Evolution A's POST repair and UI rewiring — an analyst
citing the engine while the page shows different seeded numbers would be incoherent;
RBAC on batch endpoints (portfolio books are client-confidential). **Acceptance:**
every criterion score in an answer matches the batch-assess payload; a credit failing
a blocking criterion is never described as CCP-eligible; asked to predict next year's
CCP decisions, the analyst refuses and distinguishes assessment from forecast.
