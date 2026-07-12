## 9 · Future Evolution

### 9.1 Evolution A — Framework-bound assertions and batch ingestion (analytics ladder: rung 2 → 3)

**What.** §7 rates this "a genuine rule engine, not a synthetic display": 50 real
boolean predicates across 8 categories run deterministically over real company
data, with user-overridable severities, auto-fix strategies, and a correct
`VPR = (Records − Errors)/Records` — no PRNG in scoring. The scoped gaps: the
`esg_sector_consistency` predicate is a stub returning `true` unconditionally
(V024 never fires), thresholds are engineering heuristics unbound to the
XBRL/ESRS assertions the guide intends, there is no batch/real-time ingestion
split (it validates the in-memory master snapshot), and the guide's "1,240 rules"
headline oversells the 50. Evolution A hardens and binds.

**How.** (1) Fix or remove the V024 stub (a rule that always passes is worse than
none — it inflates pass rates). (2) Framework binding: annotate each predicate
with the assertion it operationalizes (e.g. `evic_decomposition` ↔ an XBRL
calculation link; range checks ↔ ESRS datapoint types from the taxonomy the
`csrd-ixbrl` evolution ingests), so error reports cite the regulatory basis — the
rung-3 benchmark discipline for a validation engine. (3) Batch mode: validate
uploaded submissions and captured records server-side (sharing
`data-capture-hub`'s `validateRecord` service so the platform has one validation
layer, not three), persisting per-batch VPR and certifications. (4) Correct the
guide's rule count; grow the library where framework binding reveals gaps rather
than to hit a number.

**Prerequisites.** The shared validation service decision (this module's engine
is the strongest candidate to become it); taxonomy ingestion for binding.
**Acceptance:** V024 fires on a constructed violation or is gone; every rule's
error message cites its bound assertion; a batch re-run after corrections shows
the VPR delta and produces a certification record.

### 9.2 Evolution B — Remediation-guidance copilot on the error report (LLM tier 1)

**What.** The workflow promises "dispatch failed records to data owners with
embedded remediation guidance" — the guidance being the human-labor part.
Evolution B generates it per violation: what the rule checks and why (from the
Evolution A framework binding), what the offending value looks like against
peers (sector median context the auto-fix machinery already computes), the
recommended fix with its auto-fix strategy where one exists, and the confidence
caveat when the "violation" may be a scope/unit mismatch rather than an error —
the most common false positive in ESG data QA.

**How.** Tier-1 over the deterministic engine's violation rows plus the rule
metadata; no new backend needed until dispatch persistence exists. The copilot
never applies fixes — auto-fix application stays a human-confirmed deterministic
action; the copilot's product is the explanation and triage ordering. Grounding
includes each rule's framework citation so guidance reads as regulatory
requirement, not house opinion.

**Prerequisites.** Evolution A's framework binding (guidance quoting "sanity
bound" is weaker than guidance quoting an ESRS datapoint type); dispatch
persistence for delivery. **Acceptance:** guidance for each violation category
cites the bound assertion; suspected scope/unit mismatches are flagged as such
rather than commanded fixed; triage ordering matches severity × downstream-usage
arithmetic.
