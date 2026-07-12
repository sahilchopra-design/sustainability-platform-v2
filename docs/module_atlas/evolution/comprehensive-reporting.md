## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its real engine, then feed it real datapoints (analytics ladder: rung 1 → 3)

**What.** §7 documents the platform's starkest wiring gap: the backend engine (E119)
genuinely implements the guide — 74-row cross-framework DP mapping, 62-DP ESRS IG3
checklist, 50 EFRAG XBRL concepts, 20 consistency rules, readiness scoring — while the
React page fabricates every displayed number with `sr()` (coverage 30–90%, random
alignment at `sr > 0.4`, a fabricated audit trail) and never calls any of the 9
endpoints. Evolution A deletes the synthetic layer and connects the two, then deepens
the engine's checklist toward the full standard.

**How.** (1) Frontend rewiring: dashboard KPIs from `POST /compile`; the Datapoint
Mapper from `GET /ref/framework-mapping` (a real 74-row table exists — the page rolls
dice instead); consistency heatmap from `POST /consistency-check`'s 20 rules, ending
the §7.1 situation where two views of overlap use unrelated seeds. (2) Fix
`POST /readiness-score` (harness status `failed`) and add fixtures for the three
skipped POSTs. (3) Data feed: populate DP values from platform modules that already
compute them (Scope 1 from the PCAF/emissions engines feeding CR-001's cross-framework
agreement rule) rather than manual entry alone. (4) Checklist depth: extend the 62-DP
IG3 sample toward the ≈330 quantitative mandatory DPs its own docstring acknowledges,
versioned against EFRAG releases — the rung-3 benchmark discipline.

**Prerequisites (hard).** Full `sr()` purge from the page; the readiness-score fix;
DP-value sourcing map (which module owns each metric). **Acceptance:** every on-screen
number reproduces via a listed endpoint; the CR-001 Scope 1 consistency rule evaluates
real platform values; coverage changes only when underlying data changes.

### 9.2 Evolution B — Narrative-section drafter inside the report builder (LLM tier 2)

**What.** The engine produces structure (completeness, gaps, XBRL facts) but the
guide's "Report Builder generates narrative sections" needs prose — the classic LLM
slot. Evolution B drafts each ESRS narrative section from the compiled data: E1
transition-plan narrative referencing the quantitative DPs the engine has validated,
gap disclosures for phase-in relief items (the engine knows each DP's `phase_in`
year), and omission justifications gated by materiality flags. Each draft paragraph
carries inline DP references that the XBRL tagger can anchor.

**How.** Tool-calling over the module's own endpoints: the drafter first runs
`POST /esrs-report` to get the authoritative gap/readiness state, then writes
sections only for topics the data supports, quoting values verbatim from the compile
payload. The 20 consistency rules become pre-publication linting: a draft that quotes
Scope 1 inconsistently with the engine's CR-001 evaluation is rejected before human
review. Output renders through the report-studio layer; iXBRL assembly stays
deterministic code (`generate_xbrl_tagging`), never LLM-generated markup.

**Prerequisites (hard).** Evolution A — drafting narratives over the current
`sr()`-fabricated page state would automate fiction; DMA gating requires the
double-materiality assessment import the guide describes. **Acceptance:** every
numeric in a drafted section matches the compile payload; sections for immaterial
topics produce omission justifications, not content; the consistency linter blocks a
deliberately inconsistent test draft.
