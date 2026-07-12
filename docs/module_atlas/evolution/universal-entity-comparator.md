## 9 · Future Evolution

### 9.1 Evolution A — Live entity scores from platform engines with real L2 assessment (analytics ladder: rung 1 → 2)

**What.** The comparator's mechanics are sound (radar overlay, pairwise gap math) but
its substance is hand-set: §7.6 notes the 15 named companies' scores come from no data
feed — not MSCI/CDP inputs, not even the platform's own DME engine — the L2 drill-down
is ±12-point jitter around the parent L1 score (so within-topic strengths can never
diverge), and all 15 entities improve monotonically over the 5-quarter history.
Evolution A replaces the hand-set `ENTITIES` scores with entity records resolved
through the platform's entity layer (GLEIF `entity_lei` for identity; DME materiality
scores and disclosure-module outputs where they exist for the 15 issuers), and makes
L2 sub-topics independently scored fields rather than jitter, so "Taxonomy Comparison"
becomes a real diagnostic.

**How.** (1) A backend `GET /api/v1/entity-comparator/entities` route joining the
refdata/DME tables, with per-field provenance (`source`, `as_of`) so hand-set fallback
values are labelled. (2) Fix the documented Gap Analysis limitation — it silently
compares only the first 2 of up to 4 selected entities; compute pairwise or
vs-selection-mean gaps. (3) Allow score histories to decline, sourcing quarterly
snapshots from stored assessment runs.

**Prerequisites.** The seeded-jitter L2 rendering (a documented decorative-data
instance) must be removed, not papered over; DME coverage check for the 15 issuers.
**Acceptance:** an entity can show a strong Water Stewardship and weak Pollution
Prevention sub-score simultaneously; every displayed score carries a provenance label;
4-entity Gap Analysis reports all pairs.

### 9.2 Evolution B — Comparison-memo copilot (LLM tier 1 → 2)

**What.** The module's output is inherently narrative — analysts compare 4 entities
and then write up why profiles differ. Evolution B adds a copilot that turns the
current selection state into a sourced comparison memo: "JPMorgan leads Shell by 27 on
Climate but only 9 on Governance" with the interpretation grounded in the Atlas page's
own framework mapping (§7.7: Climate ← TCFD/ISSB, Biodiversity ← TNFD, Human Rights ←
UNGPs), and honest caveats that scores are illustrative until Evolution A lands. The
tier-2 step lets it call the comparator route to pull entities not currently selected
("add TotalEnergies to this comparison and re-rank").

**How.** Tier-1 first: no new backend — the memo is generated from the page's selected
entities and score state plus the embedded Atlas record in `llm_corpus_chunks`, per
the standard copilot stack (`POST /api/v1/copilot/universal-entity-comparator/ask`).
Tier-2 adds Evolution A's `GET /entities` as the single read-only tool. Every numeric
in the memo must match the selection state; the validator enforces it.

**Prerequisites.** pgvector corpus (roadmap D3); the system prompt must state the
current hand-set provenance explicitly so memos carry the caveat verbatim.
**Acceptance:** generated memo contains no score not present in the selection state;
asked "what's Shell's current MSCI rating?", the copilot refuses and names what the
module actually holds.
