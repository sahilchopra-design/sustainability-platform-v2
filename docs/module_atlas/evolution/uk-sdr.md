## 9 · Future Evolution

### 9.1 Evolution A — Wire the real eligibility engine to the page and repair /assess (analytics ladder: rung 1 → 2)

**What.** This module has an unusual inversion: a genuine backend engine exists
(`UKSDREngine.assess` with `_assess_labels`, `_recommend_label`, `_assess_agr`,
`_assess_naming`, `_calculate_icis`) but the frontend never uses it — §7 flags that
the page's 30 products get labels by round-robin `i%4`, no eligibility test runs, and
the `SDR_LABELS` aggregates and `PRODUCTS` portfolio are unreconciled. Worse, the
lineage harness shows `POST /assess` and `POST /assess/batch` currently **failed**
while the five `GET /ref/*` routes pass. Evolution A repairs the two failing POST
routes, then rebuilds the Product Portfolio tab to call `POST /assess/batch` so every
displayed label is the engine's `_recommend_label` output (Impact > Focus > Improvers
> Mixed precedence) and greenwash risk comes from `_assess_agr`, deleting the
round-robin assignment and the §7 mismatch flag.

**How.** (1) Diagnose the POST failures (likely request-schema mismatch — the GET refs
pass, so the router loads). (2) Persist assessments to a new `uk_sdr_assessments`
table so the Disclosure Tracker reflects real assessment history. (3) Derive the
Overview KPIs from assessed products instead of the hand-set `SDR_LABELS` constants.

**Prerequisites.** Acknowledge the documented frontend/backend disconnect and the two
failing endpoints; a fixture product payload for regression. **Acceptance:** lineage
harness shows `/assess` and `/assess/batch` passing; a product failing the 70%
sustainability-focus test renders as unlabelled regardless of its position in the list.

### 9.2 Evolution B — Anti-greenwashing marketing-copy reviewer (LLM tier 2)

**What.** The FCA anti-greenwashing rule is about language — substantiating claims in
fund names and marketing materials — which makes this the platform's most natural LLM
fit. Evolution B adds a reviewer that takes pasted fund marketing copy or a fund name,
calls `GET /ref/naming-rules` (which already returns `prohibited_without_label`,
`key_rules`, `example_compliant`, `example_non_compliant`) and `POST /assess` as
tools, and returns rule-by-rule findings mapped to the module's 6 real greenwash flag
categories (vague claims, misleading names, inconsistent disclosure, missing KPIs,
outdated benchmarks, Scope 3 omissions), each citing the specific PS23/16 naming rule
breached and the engine's ICIS sub-score it affects.

**How.** Tier-2 tool-calling over the existing uk_sdr routes; the grounding corpus is
this Atlas page plus the ref endpoints' own payloads (they carry `reference` fields to
FCA documents). Findings are advisory drafts, never auto-filed: output feeds a human
compliance queue. Log `(copy, findings, reviewer accept/reject)` into `llm_traces` as
tier-4 training data.

**Prerequisites (hard).** Evolution A's `/assess` repair — a reviewer citing a broken
assessment endpoint would be untrustworthy; RBAC-gated since marketing copy is
client-confidential. **Acceptance:** for the ref endpoint's own `example_non_compliant`
fund name, the reviewer flags the correct rule; for `example_compliant`, it raises no
finding; every cited rule string matches the `/ref/naming-rules` payload verbatim.
