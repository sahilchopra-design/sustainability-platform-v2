## 9 · Future Evolution

### 9.1 Evolution A — From static mock-up to live status tracker (analytics ladder: rung 1 → 2)

**What.** §7 is clear about what this is: a faithful ESRS structural shell (correct
DR taxonomy — the code's 9 E1 DRs are *more* correct than the guide's claimed 6 —
correct dual-materiality principle, real standards breakdown) whose every
completion score and status is a hard-coded constant. No PRNG, but also no
computation: "no connection to the DMA module, no user-editable status, no
data-collection tally — completeness is illustrative only" (§7.5). Evolution A
makes the shell live, deliberately as a *view* over the platform's other CSRD
machinery rather than a fourth parallel implementation.

**How.** (1) Materiality flags from `csrd-dma`'s persisted assessments (real
scoring exists there) — the double-materiality matrix plots actual entity scores,
and the static `financial`/`impact` fields disappear. (2) DR-level completeness
from `csrd-esrs-automation`'s collection ledger (its Evolution A) aggregated to
this module's DR bars — one tally, two granularities. (3) User-editable status and
the IRO register persist server-side; the audit-trail tab documents materiality
determinations with evidence links, which is this module's distinctive promise.
(4) Rationalize the CSRD family: this suite becomes the navigator/status view,
`csrd-dma` the assessment engine, `csrd-esrs-automation` the collection workflow,
`comprehensive-reporting` the compiler, `csrd-ixbrl` the tagger — the Atlas
interconnection map should reflect the pipeline instead of five islands.

**Prerequisites (hard).** The sibling modules' Evolutions A (this module is
downstream by design); agreement on the family division of labor to avoid four
competing completeness numbers. **Acceptance:** the overview's `avgComplete`
reproduces from the shared ledger; changing a DMA materiality flips a topical
standard's required state here; zero hard-coded scores remain.

### 9.2 Evolution B — ESRS navigator copilot for reporting teams (LLM tier 1)

**What.** The suite's breadth — all 12 standards, DR-level detail, the IRO
register — makes it the natural home for orientation questions reporting teams
actually ask: "what does E1-3 require and where are we on it?", "which DRs does our
S2 materiality trigger?", "what's the difference between MDR-P and MDR-A
disclosures?" Evolution B answers from the module's structural data and (post-
Evolution A) live status: requirement explanations grounded in the real DR
taxonomy and ESRS paragraph citations, status answers from the ledger, always
distinguishing the two.

**How.** Tier-1 RAG: the ESRS reference layer (this module's genuine asset) plus
the EFRAG guidance texts in refdata; live status passes as context. The navigator
explicitly does not draft disclosures — that's `comprehensive-reporting`'s
Evolution B — it orients and routes, linking each answer to the module tab or
sibling module where the work happens; the roadmap's module-copilot pattern with a
routing flavor.

**Prerequisites.** Corpus embedding (D3); Evolution A for status questions (until
then the copilot must state that completion figures are illustrative).
**Acceptance:** requirement explanations cite ESRS paragraphs; status answers match
the ledger exactly; drafting requests are routed to the correct sibling module
rather than attempted.
