## 9 · Future Evolution

### 9.1 Evolution A — Evidence-graded scoring and cross-framework gap propagation (analytics ladder: rung 1 → 2)

**What.** The E18 `IFRSS1Engine` scores an entity against IFRS S1's 13 paragraph-keyed
requirements across the four TCFD-inherited pillars:
`quality = full 100 / partial 50 / none 0`, `weight = 1.5 if blocking else 1.0`,
`overall = 0.25·Gov + 0.35·Strategy + 0.20·RiskMgmt + 0.20·Metrics`, compliant at ≥70
with no blocking gap. It is a clean deterministic self-assessment whose weakness is that
quality is a caller-asserted 3-level flag — there's no evidence linkage and no
reuse of what the entity already disclosed under adjacent frameworks. Evolution A adds
cross-framework propagation and a what-if layer.

**How.** (1) Use the existing `/ref/cross-framework` and `/ref/industry-sasb-mapping`
tables to pre-populate S1 quality scores from the entity's IFRS S2, ESRS, TCFD, GRI, or
SASB assessments already computed elsewhere on the platform — so an entity graded on
ESRS governance inherits a defensible S1 governance draft rather than re-keying. (2) Add
a scenario sweep over the `blocking` weighting and the 70 threshold to show sensitivity
of the compliant/non-compliant verdict (rung 2). (3) Preserve the honest "missing =
none" rule and bench-pin the pillar and overall aggregation.

**Prerequisites.** A shared entity-disclosure store the sibling framework engines write
to (so cross-framework inheritance has a source); mapping confidence per inherited field.
**Acceptance:** an entity with an existing ESRS assessment gets non-null S1 governance
scores tagged `inherited` with a confidence; the compliance verdict's sensitivity to the
threshold is reported; bench pin reproduces `overall_score`.

### 9.2 Evolution B — ISSB disclosure-readiness copilot (LLM tier 2)

**What.** A copilot that runs `/assess` and explains the verdict in regulator-facing
terms — "you're non-compliant because S1.25 (a blocking requirement) is undisclosed;
your Strategy pillar is 62" — citing the requirement registry and the exact undisclosed
blocking items, then drafting the remediation order and re-scoring via `/assess/pillar`.

**How.** Three POST endpoints (`/assess`, `/assess/pillar`, `/assess/batch`) plus five
reference GETs that fully describe IFRS S1 paragraphs, reliefs, and cross-framework
mappings — a complete, self-contained grounding corpus, so the copilot never needs
outside knowledge of the standard. Batch assessment supports "score all our subsidiaries
and rank by readiness". The `/ref/reliefs` endpoint lets the copilot correctly apply
transition reliefs rather than over-flagging first-year gaps.

**Prerequisites.** None hard — engine is honest and reference-complete. **Acceptance:**
every score, pillar, and named gap in an answer maps to an `/assess` response field; the
copilot cites real S1 paragraph IDs (S1.15, S1.25…) from the registry, not invented
ones; asking for a quantitative disclosure quality the engine doesn't grade (it only
scores full/partial/none) yields an explicit refusal.
