## 9 · Future Evolution

### 9.1 Evolution A — Wire the upload UI to the real parser and persist extracted facts (analytics ladder: rung 1 (UI) / 2 (engine) → 3)

**What.** §7's flag is unambiguous: a genuinely working regex-based iXBRL parser
exists (`xbrl_ingestion_engine.py`, 514 lines — real extraction of entity/LEI/periods
and `<ix:nonFraction>` facts with a `CONCEPT_TO_DP` mapping table), while the page
renders `genFilings()` PRNG output — a filing's Clean/Warnings/Errors status is fixed
by its array index, and "a user cannot make this filing dirty by uploading a real
problematic document". Evolution A wires the existing upload path (the sibling route
file already exposes `POST /ingest`, `/ingest/ixbrl`, `/ingest/xbrl-xml`) into the
page: uploaded documents parse server-side, extracted facts persist to
`xbrl_ingested_facts`, and the dashboard's history/status/taxonomy distributions
aggregate real ingestion records instead of the synthetic array. Two engine upgrades
promote it toward rung 3: replace the unfounded `contexts = facts×0.15` heuristic
with an actual count of distinct `<xbrli:context>` elements (§7.5's prescription),
and reconcile extracted facts against the sibling export engine's `ESRS_XBRL_TAXONOMY`
dictionary so the parse-rate metric (§5's IPR) is computed against a real concept
universe. Validate with a fixture set of genuine published ESEF filings.

**How.** Frontend: file-upload component + history table backed by the new table;
backend: persistence layer around the existing `ingest_auto()`; CI test parses the
fixture filings and pins expected fact counts.

**Prerequisites.** The synthetic filing generator deleted, not kept as default;
fixture filings collected (ESMA's filings portal is public). **Acceptance:**
uploading a malformed document produces an Errors status derived from actual
warnings; the same document uploaded twice yields identical fact counts; IPR computes
from mapped/total concepts, not a random draw.

### 9.2 Evolution B — Peer-benchmarking analyst over ingested filings (LLM tier 2 → 3)

**What.** The module's stated purpose is turning 50,000+ CSRD filings into analytics —
the payoff is cross-company questions no single-module copilot can answer: "compare
the Scope 3 intensity of the five utilities we've ingested", "which filings tag
E1-9 transition-risk amounts, and how do their values distribute?" Evolution B is a
tool-calling analyst over the ingested-facts store: `GET /facts` with concept/entity/
period filters, plus the concept-mappings reference route, composing benchmark tables
and narrative where every value cites its source filing (registrant, LEI, period,
concept). This is also the natural bridge to tier-3 desk orchestration: ingested
peer data becomes an input other desks (financed emissions, disclosure modules) can
query through the same tools.

**How.** Tier-2 stack: read-only tool schemas over the new facts endpoints; grounding
corpus is this Atlas page plus `CONCEPT_TO_DP` definitions. Answers carry per-fact
provenance (filing + concept + context) in the "show work" expander; the validator
rejects any value not present in a tool payload.

**Prerequisites (hard).** Evolution A — there are no real ingested facts to analyse
today, and benchmarking synthetic filings would be fabricated peer intelligence;
enough ingested filings (≥10) for comparisons to be meaningful. **Acceptance:** every
benchmarked figure traces to a stored fact with its source filing named; companies
without the queried concept are reported as not-disclosed rather than imputed; asked
about a company never ingested, the analyst says so.
