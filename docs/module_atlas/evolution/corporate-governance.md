## 9 · Future Evolution

### 9.1 Evolution A — Feed the real weighting real governance facts (analytics ladder: rung 1 → 3)

**What.** §7's partial-mismatch flag: the weighted-sum architecture is legitimate,
but every input is fabricated — dimension scores are
`50 + 0.3·(ESG−50) + 0.25·(CPI−50) + noise`, so the composite "will correlate
mechanically with ESG score, not with board/audit facts" (§7.6), and individual flags
(board independence, CEO pay ratio, whistleblower) are `sRand` draws. There is also a
structural discrepancy: the code weights 8 dimensions (20/15/15/15/10/…) while the
guide specifies 4 buckets (30/25/25/20). Evolution A replaces proxy-plus-noise with
observed governance data and reconciles the weighting.

**How.** (1) Data first where the platform already has it: the `company-profiles`
80-company real dataset carries SEBI BRSR-sourced fields — board composition, gender
diversity, and remuneration disclosures are in BRSR Section A/C; wire those through
before hunting new sources. (2) For broader coverage, ingest proxy-statement-derived
facts progressively (annual-report extraction via the existing
`extract-from-reports` pipeline is the realistic path — governance data vendors are
licensed). (3) Sub-scores computed from facts per the guide's own rubrics
(independence ratio, <9yr tenure share, ≥40% gender target, <20% non-audit fee
ratio); the CPI country tilt stays but as a labelled overlay, not a score input.
(4) Weight reconciliation: publish one canonical weighting (document why 8-dim or
4-bucket), benchmark score distributions against the ISS QualityScore decile
convention §5 cites.

**Prerequisites (hard).** Purge the `sRand` flag and dimension generators; accept
partial coverage honestly — a company without proxy data gets null sub-scores, not
proxy-noise. **Acceptance:** a company's board sub-score reproduces from its stored
board facts; the composite no longer correlates ~1.0 with ESG score by construction;
coverage percentage is displayed per dimension.

### 9.2 Evolution B — Proxy-voting recommendation assistant (LLM tier 1 → 2)

**What.** The module's last promised tab — proxy-voting recommendations from
governance risk flags — is judgment-plus-policy work that suits an LLM grounded in
explicit voting policy. Evolution B: for an AGM agenda (or a standard resolution
set), the assistant applies a codified voting policy (ICGN-derived rules: vote
against remuneration reports lacking ESG-linked LTI, against chairs where CEO-chair
duality persists…) to the company's (post-Evolution A) computed flags, producing a
per-resolution recommendation with the triggering flag and policy rule cited — a
draft for the stewardship analyst, never an autonomous vote.

**How.** Tier 1: the voting policy as a structured rule document plus this Atlas
record and the ICGN/UK-Code references; the company's flag set passes as context.
The LLM's role is applying policy language to fact patterns and drafting rationales —
the flag computation stays deterministic upstream. Tier 2 adds engagement-history
context via `company-profiles`' engagement log tool calls, so recommendations note
prior commitments ("board pledged 40% by 2026 at last AGM").

**Prerequisites (hard).** Evolution A — voting recommendations derived from seeded
governance flags would be stewardship malpractice; a house voting policy document
(the codification itself is a one-time expert task). **Acceptance:** every
recommendation cites one computed flag and one policy rule; resolutions outside the
policy's scope return "no policy guidance" rather than improvised positions;
identical inputs yield identical recommendations.
