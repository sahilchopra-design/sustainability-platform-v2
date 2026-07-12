## 9 · Future Evolution

### 9.1 Evolution A — Evidence-linked materiality and double-materiality calibration (analytics ladder: rung 1 → 2)

**What.** `GRIStandardsEngine` scores sustainability reports against GRI Standards 2021
deterministically and honestly (docstrings promise honest-null over fabrication):
`completeness = 0.6×gri2 + 0.4×gri300`, `overall = 0.3×gov + 0.3×env + 0.4×completeness`,
service level from submitted GRI-2 count. The materiality screen is the thin part —
`impact_materiality = min(1, base_weight + stakeholder_boost)` and
`financial_materiality = base_weight × 0.8` are coarse heuristics with no scenario or
evidence linkage. Evolution A deepens materiality into a defensible double-materiality
assessment.

**How.** (1) Replace the `×0.8` financial-materiality shortcut with a topic-to-financial
mapping (which GRI 300 topics map to which financial exposures) parameterised by sector,
so screens differ by industry rather than scaling uniformly. (2) Add a stakeholder-input
sweep: vary `stakeholder_boost` across scenarios to show which topics are robustly
material vs boundary cases (rung 2 what-if). (3) Cross-wire to the platform's Dynamic
Materiality Engine so GRI topics inherit its sector priors rather than flat base weights.
(4) Keep and bench-pin the honest-null design — an absent inventory must still yield
`insufficient_data`, not a fabricated score.

**Prerequisites.** A sector→financial-topic mapping table; DME integration point.
**Acceptance:** two entities in different sectors with identical topic evidence get
different financial-materiality scores; a stakeholder-input sweep flags boundary-material
topics; `insufficient_data` still returned for empty inventories.

### 9.2 Evolution B — GRI reporting copilot with gap-closure guidance (LLM tier 2)

**What.** A copilot that runs `/assess` on a draft report and explains the score — "you
scored `core` not `with_reference` because only 22 of the 28 required GRI-2 disclosures
are present; here are the 6 missing" — citing the completeness formula and the specific
gaps the engine returns, then re-scores after the user marks disclosures addressed.

**How.** Three POST services (`/assess`, `/generate-content-index`,
`/materiality-screen`) plus five reference GETs (`/ref/gri-2-disclosures`,
`/ref/gri-300-standards`, `/ref/material-topic-process`, etc.) — the reference endpoints
are a complete GRI-2021 grounding corpus, so definitional questions never leave the
module. The gap list from `/assess` drives an action loop; `/generate-content-index`
becomes a tier-2 action that drafts the GRI content index from the assessed evidence.
Guardrail: the copilot reports completeness scores as GRI *self-declaration* readiness,
not assurance, matching the engine's "assurance always reported none" behaviour.

**Prerequisites.** None hard — the engine is honest and reference-complete today.
**Acceptance:** every gap and score component the copilot cites appears in the `/assess`
response; a re-score after marking disclosures present reflects a real re-call, not
prompt arithmetic; the copilot refuses to claim "in accordance with GRI" beyond what the
service-level rule computes.
