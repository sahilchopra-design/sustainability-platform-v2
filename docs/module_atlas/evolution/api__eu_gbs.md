## 9 · Future Evolution

### 9.1 Evolution A — Apply the Art 5 flexibility pocket and real reporting/DNSH inputs (analytics ladder: rung 1 → 3)

**What.** The European Green Bond Standard compliance assessor (E14, Reg. (EU) 2023/2631) — five
weighted component scores (taxonomy 0.40 / DNSH 0.20 / safeguards 0.15 / ER 0.15 / reporting 0.10)
blended to a 0–100 score with blocking-gap logic, plus factsheet and post-issuance allocation/impact
checks. Deterministic, no PRNG. §7.6 names a real **correctness gap**: the scorer requires **100%
taxonomy alignment** for non-sovereigns, but the EuGB Regulation's Art 5 "flexibility pocket" permits
up to 15% of proceeds toward activities lacking technical screening criteria (an 85% floor) — and the
engine has the `_FLEXIBILITY_POCKET_MAX_PCT = 15.0` constant *and* an `_assess_taxonomy_alignment`
method that honours it, yet the main scorer path doesn't apply it (the `STANDARDS_COMPARISON` even sets
`flexibility_provision: True`). Also: the **reporting-commitment score is an admitted proxy** (constant
80/40 keyed off ER status, no real input), DNSH/safeguards are boolean attestations with no linkage to
the `eu_taxonomy_gar` DNSH engine, and GBFS completeness §3/§5 use inflating constants. Evolution A
applies the flexibility pocket in the scorer, wires real reporting/DNSH inputs, and links to the
taxonomy engine.

**How.** `assess_issuance` routes taxonomy scoring through `_assess_taxonomy_alignment` so the Art 5
pocket is credited (core ≥ threshold − 15% + qualifying pocket); the reporting-commitment score uses
dedicated input fields instead of the ER proxy; DNSH/safeguards attestations are cross-checked against
the `eu_taxonomy_gar` domain's activity-level DNSH engine. Rung 3: the 0.40/0.20/0.15/0.15/0.10 weights
gain a documented rationale, and post-issuance checks validate the allocation breakdown against real
proceeds data.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /assess-issuance`, `/assess/batch`
**failed** and `/allocation-report` **skipped**; the flexibility-pocket omission is a correctness fix
(the constant and method already exist — wire them). **Acceptance:** the §7.4 worked example (92%
alignment → 83.3 score but non-compliant on the 100% gate) changes correctly — a 92%-aligned bond with
a qualifying 8% pocket now clears the alignment gate under Art 5; the reporting score reflects a real
input, not the ER proxy; the failing endpoints pass the harness.

### 9.2 Evolution B — Green-bond compliance copilot with tool-called assessment (LLM tier 2)

**What.** A copilot for DCM/sustainability-finance teams: "is this green bond EuGB-compliant?"
(`/assess-issuance` → component scores, blocking gaps with article citations, priority actions), "check
our allocation report" (`/allocation-report` → 95%/100% gates), "check our impact report"
(`/impact-report`), and "how does EuGB compare to ICMA GBP?" (`/standards-comparison`) — narrating real
rule output and the canonical remediation ("increase taxonomy-aligned use of proceeds to meet the
threshold").

**How.** Tool schemas over the assessment + factsheet endpoints; the reference endpoints (bond types,
ER requirements, taxonomy objectives, standards comparison, timeline) are exceptional RAG grounding for
"what does EuGB Art 22 require of external reviewers?" questions. The no-fabrication validator checks
every score, alignment % and gate against tool output; the copilot cites the article for each gap and
distinguishes blocking gaps (alignment, DNSH, safeguards, ER) from warnings. Post-Evolution A it
correctly explains the Art 5 flexibility pocket. Composable with `esma_fund_names` and `eu_taxonomy_gar`
in a regulatory-disclosure desk.

**Prerequisites.** Evolution A's harness fixes and flexibility-pocket correction (so narrated compliance
is regulation-faithful); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every
figure/citation traces to an engine tool call; the compliance verdict matches `/assess-issuance`; the
copilot correctly applies the Art 5 pocket post-Evolution A; each gap is reported with its EuGB article.
