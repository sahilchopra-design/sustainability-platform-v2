## 9 · Future Evolution

### 9.1 Evolution A — A real tagging engine behind the real crosswalk (analytics ladder: rung 1 → 2)

**What.** §7's partial-mismatch: the module's cross-framework crosswalk
(ESRS↔GRI↔IFRS S2↔EU Taxonomy↔BRSR per indicator) is "real and correct — genuinely
useful", and the GHG-intensity arithmetic is sound; but the tagging itself is
illustrative — `mapped/total` counts are hard-coded, `factCount` is the linear proxy
`1111 × filled/5`, and no semantic matching, schema validation, or iXBRL generation
happens client-side. The platform already has the missing half:
`comprehensive_reporting_engine.generate_xbrl_tagging` maps DP ids to 50 EFRAG
`ESRS-XBRL-2024` concepts and emits an XBRL 2.1 instance structure. Evolution A
connects and extends.

**How.** (1) Wire the tagger to the comprehensive-reporting engine's
`POST /xbrl-tag` so coverage counts and fact lists are engine outputs, not
constants; untagged datapoints surface as the engine's validation warnings.
(2) Extend the concept table from the 50-concept sample toward the full EFRAG ESRS
XBRL taxonomy (published, versioned) — coverage percentages then mean something.
(3) iXBRL assembly: server-side generation of the Inline XBRL 1.1 document from
tagged facts (deterministic templating — the ESEF toolchain patterns are public),
with schema validation against the taxonomy and actionable errors per the guide's
description. (4) Keep the crosswalk as the multi-framework view and the intensity
calc as-is; both are already honest.

**Prerequisites.** EFRAG taxonomy ingestion (public download, versioned in
refdata); coordination with `comprehensive-reporting` (its engine is the tagging
source of truth; this module is the workbench UI). **Acceptance:** `factCount`
equals the engine's emitted fact list length; an intentionally malformed fact fails
schema validation with a cited rule; coverage recomputes when the taxonomy version
changes.

### 9.2 Evolution B — Semantic tag-suggestion reviewer (LLM tier 2)

**What.** The guide's "three-layer matching" names the layer only an LLM supplies
well: semantic matching of *narrative* disclosures to taxonomy elements, where
exact datapoint-ID matches fail. Evolution B implements the auto-tagger the UI
already sketches: report passages get proposed taxonomy elements with confidence
and rationale ("this paragraph describes transition-plan resourcing → E1-1
concept X"), the analyst confirms or overrides in the existing Manual Review tab,
and confirmed pairs accumulate into a platform-owned matching memory that improves
suggestions — the roadmap's data-flywheel pattern in miniature.

**How.** Tier-2 with gated writes: suggestion prompts ground on the taxonomy
element definitions and the ESRS paragraph citations from the reference layer;
output is constrained to valid element IDs (no invented concepts — the schema is
the guardrail). Low-confidence suggestions queue rather than auto-apply; the
deterministic engine handles exact-ID matches first so the LLM only sees the
residual. Confirmed mappings log to `llm_traces` per the roadmap's Tier-4
data-collection design.

**Prerequisites (hard).** Evolution A's engine wiring and taxonomy table (semantic
suggestions against 50 sample concepts would be a toy); document import path for
report drafts. **Acceptance:** on a public CSRD report excerpt, ≥80% of suggestions
for quantitative facts confirmed unchanged; every suggestion names a real taxonomy
element; unmatched passages are reported unmatched rather than force-tagged.
