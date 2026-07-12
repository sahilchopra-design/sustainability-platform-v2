## 9 · Future Evolution

### 9.1 Evolution A — Computed Model Risk Rating over the live registry (analytics ladder: rung 1 → 3)

**What.** Implement the MRR composite the guide promises but the code never computes — §7's mismatch flag confirms `risk_tier` is a hand-assigned string on each of the 15 `MODEL_REGISTRY` entries, and the only genuine logic today is the overdue-validation date check. §8 already specifies the formula (`MRR = Materiality × Complexity × (1 + Concentration)`); this evolution builds it, plus a first backend vertical so the registry stops living in one JSX file and `localStorage`.

**How.** (1) Derive Materiality from the existing `regulatory_use` counts, Complexity from a model-type heuristic over the `methodology` field, and Concentration directly from the `MODEL_DEPENDENCIES` graph (count of downstream dependents) — §8.4 confirms no new data is needed. (2) Move `MODEL_REGISTRY` into a `model_inventory` table via Alembic, replacing the `localStorage` changelog with an audited write endpoint so validation history survives browser resets. (3) Wire the registry to the platform's real engine catalog (the AST scan behind ENGINE_CATALOG.md) so new engines auto-appear as "unregistered" rather than requiring hand entry.

**Prerequisites.** §8.5's sanity check: computed tiers must be reconciled against the current hand-assigned tiers for all 15 models, with committee-override reasons logged. `backtest_accuracy` values remain asserted-not-computed and must be labelled as such. **Acceptance:** every model shows a computed MRR with its three factor inputs visible; a change to `MODEL_DEPENDENCIES` measurably moves the dependent model's Concentration score.

### 9.2 Evolution B — Validation-workflow copilot grounded in the model inventory (LLM tier 1)

**What.** A copilot on the `/model-governance` page that answers "why is M006 overdue?", "which models feed IFRS 9?", or "draft the SR 11-7 validation memo for M005" strictly from the page's own state: the 15-model registry with its hand-written `methodology`/`assumptions`/`limitations` text, the `computed_status` overdue logic, `MODEL_DEPENDENCIES` edges, and the `REGULATORY_FRAMEWORKS` mapping. This registry is unusually good grounding — §7.2 notes it is hand-authored and cross-referenced to real platform files — so a tier-1 explainer needs no new data.

**How.** Per-module system prompt assembled from this Atlas page plus the serialized `MODEL_REGISTRY` (already exported as JSON by the page's export function); serve via the roadmap's `POST /api/v1/copilot/{module_id}/ask` router with prompt caching. Drafted validation memos must template from the model's own `limitations` and `backtest_accuracy` fields, never invent test results. Refusal path required for questions about models not in the registry or metrics the page does not compute (e.g. live PSI — §4 lists PSI monitoring as a described pipeline, not an implemented one).

**Prerequisites.** None hard for read-only Q&A; memo drafting should wait for Evolution A's DB-backed registry so citations reference stable row IDs rather than JSX constants. **Acceptance:** every claim in a copilot answer traceable to a registry field or Atlas section; asking "what is M003's current PSI?" yields a refusal, not a number.
