## 9 · Future Evolution

### 9.1 Evolution A — The guide's four-factor score, without the random term (analytics ladder: rung 1 → 2)

**What.** §7 flags two defects in one formula: the code's climate-pay score is
additive where the guide specifies a multiplicative four-factor product
(`PayAlignScore = MetricQuality × TargetAmbition × WeightMateriality ×
VerificationRigor`), and it includes a literal `sr(i·47)×15` random term — a score
that changes with the seed, not the facts. There are no MetricQuality or
VerificationRigor inputs at all, and the 65 executives are seeded. Evolution A
implements the guide's rubric properly: four sub-scores with defined anchors
(MetricQuality: scope coverage 1/1+2/1+2+3; TargetAmbition: SBTi-validated vs
self-set; WeightMateriality: vs the PRI 20% LTIP benchmark the page already
references; VerificationRigor: independent assurance vs self-reported), combined
multiplicatively so a zero on any factor zeroes the score — the design intent of a
multiplicative form, which the additive version silently loses.

**How.** (1) Pure scoring function, unit-tested, random term deleted (guardrail
class). (2) The executive universe rebuilt from disclosed data — climate-linked pay
terms are public in proxy statements/remuneration reports, and a starter set of 20–30
real disclosures (hand-curated with citations) beats 65 seeded rows. (3) The
greenwashing-risk view derived from the score's factor pattern (high weight × low
verification = the classic red flag) rather than asserted.

**Prerequisites (hard).** Random-term removal; disclosed-data curation effort scoped
(one-time, then annual refresh per proxy season). **Acceptance:** an executive with
unverified self-set targets scores near zero regardless of KPI weight
(multiplicativity test); every scored row cites its disclosure document; the mismatch
flag clears.

### 9.2 Evolution B — Stewardship-engagement copilot (LLM tier 2)

**What.** The module's stated output is a "PRI/IIGCC climate pay engagement letter" —
a natural LLM deliverable. An assistant that takes a scored company, decomposes the
weak factors ("verification is the binding gap: targets are self-assessed"), and
drafts the engagement letter with the score evidence and the PRI/IIGCC framework
citations from §5 — every claim about the company traceable to its disclosed pay
terms, every benchmark to the framework text.

**How.** Tool call to the Evolution A scoring function for the decomposition;
letter templates per the IIGCC stewardship-toolkit structure; the no-fabrication
validator on all percentages and comp figures (drafting to a board is exactly where
invented numbers would be most damaging); human review before any external use.

**Prerequisites (hard).** Evolution A first — an engagement letter citing a score
with a random component would be indefensible in a stewardship dialogue.
**Acceptance:** a generated letter contains only disclosed figures and computed
sub-scores with citations; regenerating produces identical numbers (determinism
test); the assistant refuses to score companies lacking disclosed pay terms.
