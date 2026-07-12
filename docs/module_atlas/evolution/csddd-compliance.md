## 9 · Future Evolution

### 9.1 Evolution A — Implement the UNGP prioritisation matrix on the solid register (analytics ladder: rung 1 → 2)

**What.** The module's core is genuinely useful: a real 20-requirement CSDDD register
correctly mapped to Directive 2024/1760 Articles 6–15, user-set statuses, real Art. 2
phasing thresholds and the real Art. 27 5%-turnover fine cap. §7's partial-mismatch
flag scopes the gaps: the guide's
`Priority = Severity × Likelihood × Breadth / RemediationCapacity` matrix is absent
(no UNGP severity scoring, no ITUC/WBI country weighting), and the companion metrics
(peer averages, supply-chain tier coverage, SBTi flags, employee/turnover proxies)
are `seed()`-generated. Evolution A builds the prioritisation engine and de-seeds
the companions.

**How.** (1) Adverse-impact register: impacts entered per CSDDD Annex category with
UNGP severity sub-dimensions (gravity, reversibility, breadth) each scored on a
documented ordinal scale — the sibling `csrd-dma` module's severity×likelihood
pattern is the proven in-house template to follow. (2) Likelihood term: country risk
from published indices the guide names — ITUC Global Rights Index ratings and WGI
governance percentiles as curated refdata — weighted by supplier-country footprint.
(3) The priority score computes per the formula with `RemediationCapacity` as a
documented user assessment; the prioritisation matrix ranks the register, feeding
the existing prevention/action-plan workflow. (4) Companions: employees/turnover
from real portfolio fields only (honest nulls otherwise — delete the charCode-seeded
proxies); peer averages from actual scored register data or removed.

**Prerequisites (hard).** Seed purge on all companion metrics; ITUC/WGI table
curation; the severity rubric documented before scoring starts. **Acceptance:** a
high-gravity/irreversible/wide-breadth impact outranks a moderate one via
arithmetic; the phasing classifier and penalty math still reproduce (regression);
zero `seed()` calls feed displayed values.

### 9.2 Evolution B — Annual-report builder over the compliance register (LLM tier 1 → 2)

**What.** The overview's endpoint — "Annual Report Builder generates CSDDD-compliant
disclosure content for board approval" — is undelivered drafting work atop delivered
tracking. Evolution B writes the Article 11 communication: the due-diligence policy
description (from the register's Art. 6–10 statuses), identified and prioritised
impacts (post-Evolution A matrix output), prevention/remediation measures with their
tracked completion states, and grievance-mechanism outcomes — each statement backed
by a register entry or matrix score, with gaps disclosed as gaps rather than papered
over, since the register's whole value is defensibility under regulatory inspection.

**How.** Tier 1: RAG over the CSDDD directive text (refdata addition), this Atlas
record, and the register/matrix state as structured context; the drafter maps each
Article 11 content expectation to evidencing register items. Tier 2 (if the register
moves server-side): drafts versioned against register snapshots so the board sees
what changed year-over-year. The compliance-status honesty rule is absolute: a
"Partial" status must never read as compliant in prose.

**Prerequisites.** Evolution A's impact register (the report's core content);
directive text embedded; register persistence for versioning. **Acceptance:** every
compliance claim in a draft cites a register item with its actual status; the
prioritisation rationale quotes matrix scores; requirements marked Gap appear in the
report's improvement-plan section, not silently omitted.
