## 9 · Future Evolution

### 9.1 Evolution A — Real taxonomy data and a working mapping session (analytics ladder: rung 1 → 2)

**What.** Every count on this page is a hand-authored constant: §7.4 documents that
there is no semantic-matching engine, no taxonomy file parsing, and no per-user
tagging state — the Validation Engine's pass/fail counts never change, and the Tag
Mapping Tool searches only 8 sample rows while the KPIs claim 202 ISSB S2 + 122 ESRS
E1 tags. §7.4 also names the fix: the sibling `xbrl-export-wizard` already has a
functional backend engine (`xbrl_export_engine.py`) with a real `ESRS_XBRL_TAXONOMY`
dictionary and genuine ESEF validation rules (LEI format, period ordering,
taxonomy-membership, duplicate-fact detection). Evolution A wires this module to that
engine rather than building a second one: a `GET /api/v1/xbrl/taxonomy` route serving
the full tag dictionary (extended with the ISSB S2 concept list from the published
IFRS taxonomy file), a persisted `xbrl_tag_mappings` table so a user's
platform-metric → tag mappings survive reload, and mapping/validation counts computed
from that table instead of asserted.

**How.** Backend additions live in the sibling's route file (shared engine, per the
platform's edits-propagate convention); the Taxonomy Browser paginates the real
dictionary; `MAPPED_STATUS` and `VALIDATION_RESULTS` become live aggregations of the
session's mappings run through the engine's validators.

**Prerequisites.** The static-counts illusion acknowledged; ISSB S2 taxonomy concepts
sourced from the actual IFRS Foundation file (the current 8 `TAG_SAMPLES` are
plausible-looking but unverified per §7.1). **Acceptance:** mapping a metric changes
the coverage pie; the browser lists hundreds of real tags, searchable; validation
failures cite the specific engine rule that fired.

### 9.2 Evolution B — Semantic tag-mapping copilot (LLM tier 2)

**What.** The guide's own methodology line — "Match = PlatformMetric → XBRL_Tag using
semantic matching" — is inherently an LLM task, and this module is one of the
platform's most natural tier-2 fits. The copilot takes a platform metric (name, unit,
definition — e.g. "Scope 1 gross emissions, tCO2e, market-based excluded") and
proposes the correct tag (`ifrs-s2:AbsoluteGrossScope1`) with a confidence rationale,
by retrieving candidates from the Evolution A taxonomy endpoint and reasoning over
their official definitions — never inventing tag names. Accepted mappings are written
via the mappings endpoint after user confirmation; rejected proposals are logged to
`llm_traces` as training signal. Bulk mode maps a whole disclosure dataset and routes
low-confidence matches to a human review queue.

**How.** Tier-2 stack: `GET /taxonomy` (candidate retrieval, embedding-based over
pgvector — the tag definitions are the corpus) plus the confirm-gated mapping write;
the validator checks every proposed tag string exists verbatim in the taxonomy
dictionary, which makes fabrication structurally impossible here — an invented tag
simply fails the existence check.

**Prerequisites (hard).** Evolution A's real taxonomy endpoint (semantic matching
over 8 sample rows would be theatre); tag-definition embeddings in
`llm_corpus_chunks`. **Acceptance:** every proposed tag exists in the dictionary; a
metric with no reasonable tag yields "no match" with the nearest candidates listed,
not a forced mapping; bulk-mode accuracy measured against a hand-mapped fixture set
before default-on.
