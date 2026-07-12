## 9 · Future Evolution

### 9.1 Evolution A — Compute coverage from a real collection tally (analytics ladder: rung 1 → 2)

**What.** §7's partial-mismatch verdict: the ESRS reference layer is "real and
excellent" (12 standards with genuine paragraph citations, the correct 643-datapoint
total, DR-level subtopics) and real ISAE 3000 evidence-export helpers are already
wired — but every readiness, coverage, automation, and materiality *score* is
`sr()`-seeded, and the guide's quality-weighted formula
(`Coverage = Σ(collected × quality_weight)/Σ(required)` with 1.0/0.6/0.3 weights) is
unimplemented. Evolution A builds the tally the formula needs.

**How.** (1) Requirement gating: import the material-topic set from the sibling
`csrd-dma` module's persisted assessments (its scoring is real) — ESRS 2 always
required, topical standards gated by materiality, exactly as the guide describes;
delete the seeded `dmaScores`. (2) Collection ledger: a `csrd_datapoint_status`
table tracking each required datapoint's state (collected/estimated/proxy/missing)
with the guide's quality weights applied — populated manually first, then
increasingly by the platform modules that compute the values (Scope 1 from the
emissions engines, workforce from S1 sources). (3) Coverage, readiness, and
automation-rate KPIs become arithmetic over the ledger; the assurance-readiness
figure feeds the existing evidence-export helpers instead of a seed. (4) Coordinate
with `comprehensive-reporting`'s engine (its 62-DP IG3 checklist and consistency
rules are the adjacent, real machinery — this module is the collection workflow,
that one the compilation).

**Prerequisites (hard).** Seed purge; `csrd-dma` persistence (its own Evolution A);
the datapoint-ownership map across platform modules. **Acceptance:** coverage
reproduces as the weighted ledger sum; downgrading one datapoint from audited to
proxy moves coverage by exactly (1.0−0.3)/required; immaterial topics' datapoints
drop out of the denominator when the DMA changes.

### 9.2 Evolution B — Datapoint-extraction assistant for system onboarding (LLM tier 2)

**What.** The overview promises "AI-assisted data extraction" and "connect internal
systems… to minimise manual data entry" — unbuilt, and precisely the tier-2 shape.
Evolution B: uploaded evidence (utility bills, HR exports, policy PDFs) gets mapped
to ESRS datapoints — the assistant proposes `(datapoint_id, value, unit, quality
tier, source passage)` tuples against the real 643-datapoint register, with the
quality tier honestly proposed (a PDF policy statement is narrative evidence;
an audited GHG statement earns 1.0) — each proposal queued for preparer
confirmation before entering the Evolution A ledger.

**How.** Extraction prompts constrained to the datapoint register's schema
(paragraph citations from the reference layer make requirement disambiguation
tractable); confirmation workflow per the roadmap's gated-mutation contract, with
the ISAE 3000 evidence-package helpers storing the source linkage — the extraction
is only defensible if the assurer can walk from datapoint to source. Validation:
unit checks and the cross-consistency rules from `comprehensive-reporting`'s engine
run on proposals before they're even shown.

**Prerequisites (hard).** Evolution A's ledger; document upload path; the
consistency-rule integration. **Acceptance:** on a test evidence pack, ≥85% of
proposed mappings confirmed unchanged by a human reviewer; every accepted value
carries its source passage; no proposal auto-enters the ledger.
