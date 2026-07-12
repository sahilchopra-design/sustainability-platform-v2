## 9 · Future Evolution

### 9.1 Evolution A — Observed-shape calibration of the 96-point engine (analytics ladder: rung 2 → 3)

**What.** The desk is already a genuine tier-A vertical: `ppa_structuring.py` (1,426 lines, no PRNG) computes capture rate as an output of the 24h×4-season shape engine, and the term-sheet scorer re-runs exact `_build_case` math for ±10% sensitivities — solid rung 2. Its documented modelling defaults, however, are hand-authored archetypes: Hirth/Millstein-derived capture-rate tiers, a mid-latitude half-sine solar shape, a stylized `PRICE_HOUR_MULT` ladder. Evolution A calibrates these against observed hourly data: replace archetype price shapes with realized hourly price profiles per bidding zone (the platform's ENTSO-E and EIA ingesters already exist for wave-1 sources) and benchmark the engine's derived capture rates against published LBNL/market value-factor series.

**How.** (1) New `ref_hourly_price_shapes` table (zone × season × hour, built from ingested day-ahead history) served through the existing `GET /ref/shape-archetypes` pattern with a `basis: observed` flag alongside the archetype fallback. (2) Calibration report endpoint comparing engine capture rate vs realized value factors at matching penetration levels; error published, not hidden. (3) bench_quant pins the §7.4 toy-day identity (capture rate 85.7%) and the flat-shape settlement identity the QA already asserts.

**Prerequisites.** Fix the two lineage-harness failures first (`POST /shape-analysis` and `/term-sheet-score` recorded `failed` in §4.2); ENTSO-E/EIA hourly history retained, not just latest snapshots. **Acceptance:** for a DE solar case, engine capture rate is within a documented tolerance of the observed value factor, and the response names which basis (observed vs archetype) produced it.

### 9.2 Evolution B — Term-sheet negotiation analyst (LLM tier 2)

**What.** This module is one of the best tier-2 candidates on the platform because all seven endpoints are deterministic, Pydantic-typed, and self-documenting (every default is served with its literature basis via `GET /ref/*`). The analyst runs structuring conversations: "compare pay-as-produced vs baseload at 80% contracted for this wind asset, show me the firming-cost difference and how the deal score moves" — executed as paired `POST /structure` calls plus `/term-sheet-score`, narrated with the capture-rate decomposition (seasonal × diurnal) from `/shape-analysis`.

**How.** Tool schemas from the module's OpenAPI operations filtered via the Atlas endpoint map; system prompt grounded in §7.2's parameter tables so the analyst can explain *why* a capture rate fell (penetration tier crossed) with the Hirth/Millstein citation the backend itself carries. Mutating nothing, all endpoints are read-only calculators — no RBAC gating needed beyond session inheritance. Output composes into the Tab-7 score narrative and a drafted term-sheet memo whose every number the no-fabrication validator can trace to a tool call.

**Prerequisites.** The two failed POST endpoints repaired (an analyst that tool-calls a 500 is worse than none); golden Q&A written from the §7.4 hand-traced examples. **Acceptance:** the analyst reproduces the §7.4 capture-rate walkthrough via a live `/shape-analysis` call and refuses to quote market PPA prices, which the desk deliberately does not source.
