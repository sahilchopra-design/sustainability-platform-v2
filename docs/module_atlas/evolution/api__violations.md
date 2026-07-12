## 9 · Future Evolution

### 9.1 Evolution A — Entity-resolved misconduct scoring (analytics ladder: rung 1 → 3)

**What.** Today this is a pure SQL query/aggregation domain over `dh_violation_tracker` (seven read endpoints, no engine file, ordering by penalty is the only "scoring"). §7.5 names the gaps: ILIKE substring matching over-matches ("Shell" → "Shellpoint"), no LEI linkage, no ingest vintage metadata, and nominal dollars mixed across decades. Evolution A turns the evidence layer into a calibrated counterparty-misconduct score usable by SFDR PAI 10/11 and CSDDD screening modules.

**How.** (1) Entity resolution: batch-match `parent_company` against `entity_lei` (GLEIF) via the platform's entity-resolution route, storing `lei` on each row so `/company/{name}` can become `/entity/{lei}` with exact joins. (2) A `misconduct_score` endpoint aggregating per-parent: penalty totals CPI-deflated to a common year, recency-weighted violation counts, severity mix, and the stored `repeat_offender` flag — weights documented per Atlas §8 model-card convention. (3) Benchmark: rank-correlate scores against an external controversy rating sample for the overlapping names; publish the correlation rather than asserting validity. (4) `GET /stats` gains `source_snapshot_date` and coverage counts (the missing `last_updated` metadata route).

**Prerequisites.** Populated `entity_lei` (GLEIF bulk ingest verified); the ingestion pipeline must expose its snapshot date; the `repeat_offender` definition documented at ingest (it is opaque to this code today). **Acceptance:** searching "Shell" no longer returns Shellpoint under LEI-exact mode; two parents with identical nominal penalties in 1995 vs 2024 score differently; score components sum reproducibly to the published total.

### 9.2 Evolution B — Counterparty adverse-media screen for the due-diligence desk (LLM tier 2)

**What.** The endpoint set is a natural tool belt for a screening analyst: given a counterparty name, the LLM calls `/search`, `/company/{name}`, and `/stats`, then drafts the adverse-track-record paragraph a CSDDD/UNGC due-diligence memo requires — every count and dollar figure from the SQL results, with the ILIKE over-match caveat surfaced rather than hidden.

**How.** All seven routes are read-only, viewer-role GETs — auto-generate tool schemas from OpenAPI with no confirmation gating. The per-module system prompt embeds §7.3's NULL semantics (pending cases counted but excluded from sums) so the copilot explains why totals and counts diverge instead of "correcting" them. When name matching is ambiguous, the copilot must enumerate the distinct `parent_company` values returned and ask the user to pick, not silently merge. Output composes into the Tier-3 counterparty-assessment chain (GLEIF resolve → sanctions → violations → physical risk) already sketched in the roadmap.

**Prerequisites.** None hard for a first slice — the read surface works today (six of seven traces passed; `/company/{name}` 404s only on empty match). Evolution A's LEI linkage upgrades match precision later. **Acceptance:** a generated screening paragraph cites only figures present in tool outputs; for "Shell" it discloses the multiple distinct parents matched; a name with zero rows yields "no enforcement records found in dh_violation_tracker", never an invented history.
