## 9 · Future Evolution

### 9.1 Evolution A — Populate the empty regime tables and calibrate the stress cubes (analytics ladder: rung 2 → 3)

**What.** A five-regime Asian regulatory engine (SEBI BRSR, HKMA GS-1, BoJ scenarios, ASEAN
Taxonomy v3, PBoC green finance) built on the honest principle in its own header: "all computation
is deterministic against real DB rows; falls back to curated reference data when rows are absent."
BRSR runs on 1,323 real Indian companies (migration 009). But §4.2 shows most routes returning
`db-empty` — the ASEAN, BoJ and HKMA tables are seeded thin, so the engine serves its hand-encoded
reference cubes (labelled `source: "reference_table"`, honestly) rather than entity data. §7.5 also
notes the HKMA/BoJ stress tables are curated approximations of the 2023 exercises, and HKMA derived
impacts use flat scalars (NII = 15% of credit loss, CAR = 8.5 bps/loss-%). Evolution A populates
the empty regime tables with real entity data and calibrates the stress-loss cells against the
published supervisory findings.

**How.** Ingesters/seeders for `asean_entities`/`asean_taxonomy_activities`, `boj_scenario_results`
and `hkma_stress_scenarios` (roadmap D1 write-side activation against a Supabase branch); the
reference cubes remain as the labelled fallback. Rung 3: replace the flat NII/CAR scalars with a
balance-sheet-structure-aware calculation, and cite each HKMA/BoJ stress cell to its published
source magnitude.

**Prerequisites.** The `db-empty` provenance across ASEAN/BoJ/BRSR-detail routes (§4.2) is the
headline gap — seed real rows so `/{entity_id}` paths stop returning `{error, entity_id}`; the BRSR
principle weights (P6 environment 0.18) and readiness bands are platform conventions to document as
such (SEBI publishes no composite). **Acceptance:** an ASEAN entity taxonomy query returns real
activities not an error; the §7.4 BRSR worked example (76.2 → Advanced) reproduces; HKMA impacts
respond to balance-sheet structure, not two flat scalars.

### 9.2 Evolution B — Asian-regulatory analyst copilot across the five regimes (LLM tier 2)

**What.** A tool-calling analyst answering "what's this Indian company's BRSR readiness?" (calls
`/brsr/{id}/scorecard`), "run the HKMA climate stress test" (`/hkma/{id}/stress-test`), "how does
this activity classify under ASEAN Taxonomy?" (`/asean/{id}/taxonomy`), and "what green-bond
criteria apply?" (CBI endpoints) — narrating real DB rows where present and clearly flagging when
the engine falls back to reference tables (the `source` field makes this explicit).

**How.** Tool schemas over the ~20 endpoints; the reference data (BRSR P1–P9 weights, ASEAN
traffic-light tiers, BoJ scenario cube, HKMA maturity bands) is ideal RAG grounding for "what does
BRSR Core assurance require?" questions — a tier-1 explainer over a tier-2 operator. The
no-fabrication validator checks every score and loss-% against tool output; because fallbacks are
labelled `source: "reference_table"`, the copilot must state when a figure is a regime reference
value versus a real entity disclosure.

**Prerequisites.** Evolution A's seeded tables (so more answers are real-entity, not reference
fallback); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every figure cited
carries its `source` (db vs reference) provenance; a BRSR query for a real company returns its
actual P6/readiness; asking about an unpopulated regime returns the labelled reference output, not a
fabricated entity value.
