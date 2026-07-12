## 9 · Future Evolution

### 9.1 Evolution A — Curated per-factor documentation and semantic overlay matching (analytics ladder: rung 1 → 2)

**What.** The DME Unified Factor Taxonomy — a queryable registry of 658 factor definitions (627 DME =
209 topics × 3 I/R/O dimensions, + 31 Risk-Analytics overlay factors mapped to quantified engines).
Definitions only, no measured values, no PRNG. §7.5 names the deepening targets: the 627-factor
expansion is **combinatorial** (names `"{topic} - {Dimension}"`, `sub_topic` a placeholder
`"{topic} Detail {i}"` — scaffolding, not curated documentation); the blanket `pcaf_dq = 4` for
emissions topics is an assumption; and `compare_factor`'s relevance score is a **coarse lexical/pillar
heuristic** (max 5), adequate for "is there overlay coverage?" but not a semantic ontology alignment.
Evolution A adds curated per-factor documentation (real sub-topics, materiality rationale, data source)
and upgrades the overlay cross-walk to embedding-based semantic matching.

**How.** Replace the combinatorial `sub_topic` placeholders with curated per-factor metadata (the
overlay factors already show the target quality — units, regulatory refs, source attributions);
`compare_factor` uses embedding similarity (the platform's pgvector layer, roadmap D3) instead of the
lexical +1/+1/+3 score, so DME factors map to overlay factors by meaning. Rung 2: per-factor PCAF-DQS
assumptions become topic-specific rather than a blanket 4.

**Prerequisites.** Fix the harness failures — §4.2 shows `POST /search` and `/compare` **skipped** and
`GET /factors/{id}` returning an error (lookup bug); the DME-authored alert thresholds (1.5/2/3/4σ) and
EWMA α stay documented calibrations. **Acceptance:** the §7.4 registry arithmetic (627 + 31 = 658)
holds; a factor detail returns curated documentation, not a `Detail {i}` placeholder; `compare_factor`
matches by semantic similarity (a water-risk DME factor finds a water overlay even without a lexical
match); the search/compare/detail endpoints work.

### 9.2 Evolution B — Taxonomy-grounding tool for the DME copilots (LLM tier 1 → 2)

**What.** This registry is the shared vocabulary of the DME cluster — its highest-value LLM role is as
a **grounding/lookup tool**: a DME copilot answering "which factors cover biodiversity risk?" or "does
this DME signal have a quantified overlay in the credit engines?" tool-calls `/search` and `/compare`,
and "what regulation governs this factor?" reads the overlay factors' `regulatory_refs` (ESRS E1-6,
EUDR, CBAM, SFDR Art 7…). It grounds every DME factor reference across the platform in one taxonomy.

**How.** Tier-1 explainer over the reference endpoints (pillars, DME topics, velocity methods, signal-
decay classes) graduating to tier 2 via `/search` and `/compare` tool calls; the no-fabrication
validator ensures any factor id, pillar or overlay mapping cited comes from a tool call. The
`compare_factor` coverage cross-walk directly answers the strategically useful "is this qualitative
DME signal backed by a quantified engine?" question that connects the DME layer to the credit/CBAM
engines.

**Prerequisites.** Evolution A's curated documentation and semantic matching (lexical matching is too
coarse for reliable tool answers) and harness fixes; Atlas corpus embedded (roadmap D3).
**Acceptance:** every factor/mapping cited traces to a registry tool call; a coverage question resolves
via `compare_factor` with the overlay's regulatory reference; a factor-definition lookup returns curated
metadata, not scaffolding.
