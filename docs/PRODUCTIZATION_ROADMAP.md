# Productization Roadmap — LLM-Native, Module-Level Intelligence
### From internal analyst platform → multi-tenant product with trained LLM per module, maturing DB + engines into full analytics

*Drafted 2026-07-07. Grounded in measured baseline: 853 frontend modules / 999 atlas
records / 297 engines (231k LOC) / 2,528 endpoints / 577 tables (~350k rows, 74% empty)
/ 4 critical personas (financial, energy, supply chain, manufacturing). Companion docs:
PROJECT_OVERVIEW.md, ENGINE_CATALOG.md, DATABASE_CATALOG.md, CRITICAL_REVIEW_UAT_AUDIT.md.
Per-module future evolutions live in the Module Atlas §9 (docs/module_atlas/evolution/).*

---

## 0 · The product thesis

The asset that competitors cannot copy is not the UI — it is the **triple-layer stack
already built**: (1) 297 methodology-faithful calculation engines with documented
formulas, (2) a machine-readable Module Atlas that describes every module's §7
methodology and §8 model spec in prose an LLM can consume, and (3) a lineage system
that can prove where every number came from. Productization = wrapping that stack in a
**module-level LLM intelligence layer** where the LLM never invents numbers — it
*operates the engines* and *explains their outputs*, with the Atlas as its trained
knowledge and the lineage traces as its citations. The platform's no-fabrication creed
becomes the product's differentiation: *an AI analyst that shows its work*.

## 1 · Module-level LLM enablement — the four-tier architecture

Each tier ships independently and compounds. "Trained" arrives in three escalating
senses: grounded (RAG), specialized (per-desk system prompts + curated corpora), and
literally fine-tuned (distilled sector models) — in that order, because each stage
generates the training data for the next.

### Tier 1 — Module Copilot (RAG-grounded explainer) · Phase 1
- **What**: a chat panel on every module page answering "what does this number mean /
  how is it computed / what are the limitations" from that module's own documentation.
- **Knowledge**: the module's Atlas record (`atlas.json` entry + `modules/<id>.md` +
  `deep/<id>.md` §7/§8 + `evolution/<id>.md` §9) — already written, already structured.
  Embed into **pgvector on the existing Supabase instance** (new tables:
  `llm_corpus_chunks(module_id, section, chunk, embedding vector)`), refreshed by the
  atlas builder. No new infrastructure vendor.
- **Serving**: Claude API (Haiku-tier for copilot Q&A; Sonnet-tier for methodology
  questions), per-module system prompt assembled from the atlas record; prompt-cached
  (the module context is stable → cache-friendly and cheap).
- **Guardrails**: answers must cite the atlas section or an engine response; a refusal
  path ("this module does not compute that") is REQUIRED behavior, mirroring the
  platform's honest-nulls convention.
- **Backend**: one new router `api/v1/routes/module_copilot.py`
  (`POST /api/v1/copilot/{module_id}/ask`), audit-logged like everything else.

### Tier 2 — Module Analyst (tool-calling operator) · Phase 2
- **What**: the LLM can *run* the module: it calls the module's own endpoints as tools
  ("price this asset under hot-house 2050", "re-run with 30% haircut") and narrates the
  real engine outputs.
- **Tooling**: tool schemas auto-generated from the FastAPI OpenAPI spec, filtered per
  module via the Atlas endpoint map (§2.2) — the registry already knows which endpoints
  belong to which module. Read-only endpoints first; mutating endpoints gated behind
  explicit user confirmation + RBAC (the middleware already enforces per-module access —
  the copilot inherits the user's session, never a service account).
- **No-fabrication contract**: every numeric in a Tier-2 answer must be traceable to a
  tool call in the same conversation; a post-response validator greps the answer's
  numbers against tool outputs (same spirit as `check_no_fabricated_random.py`, applied
  to LLM output). Failures are logged, not silently shipped.
- **Provenance UX**: each answer carries a "show work" expander: tool calls made, engine
  versions, lineage source tables (from `lineage_output/traces/`).

### Tier 3 — Desk Orchestrator (cross-module) · Phase 2–3
- **What**: persona-level assistant (Financial / Energy / Supply-chain / Manufacturing
  desk) that routes across modules: "assess this counterparty" → GLEIF resolve →
  sanctions screen → physical-risk point profile → financed-emissions estimate →
  synthesized memo.
- **Routing knowledge**: `module_tags.json` (sector taxonomy) + the Atlas
  interconnection graph (§6 blast-radius edges) + `module-nav` connections — all
  existing artifacts.
- **Output**: composable into `3-outputs`-style artifacts — the report studio and
  advanced-report modules become the render layer for LLM-drafted, engine-sourced memos.

### Tier 4 — Trained sector models (fine-tune/distill) · Phase 3
- **Data flywheel**: Tiers 1–3 log `(question, retrieved context, tool calls, answer,
  user rating)` into `llm_traces` tables. After ~3–6 months of desk usage, curate per
  sector.
- **Training corpus per desk** = curated traces + the sector's Atlas deep-dives +
  regulatory reference texts already in the refdata layer (ESRS/GRI catalogs are IN the
  DB) + bench_quant-style golden Q&A written from §7 worked examples.
- **Form**: distilled/fine-tuned small models for high-volume copilot Q&A (cost/latency),
  with frontier-model fallback for hard reasoning; per-desk LoRA before per-module
  (999 fine-tunes is a trap — module specialization comes from RAG context, desk
  specialization from weights).
- **Evaluation harness (build BEFORE training)**: `bench_llm.py` — per-module golden
  Q&A (3–5 questions each, answerable strictly from the deep-dive), plus adversarial
  no-fabrication probes ("what's the exact default rate of X?" where X isn't computed →
  must refuse). Gate every model/prompt change on it, exactly as bench_quant gates
  engine changes.

## 2 · Database maturation path (577 tables → product-grade data layer)

| Stage | What changes | Concrete work |
|---|---|---|
| **D0 · Seed the credibility gaps** (now) | The measured thin spots become demo-ready | Run GLEIF bulk ingest at scale (`entity_lei` 3 → ≥100k rows); seed a realistic 200–500-holding demo portfolio; seed a demo carbon book; widen `dh_data_sources.cost` varchar(10) |
| **D1 · Write-side activation** | The 425 empty tables that are write-side verticals get exercised | Lineage harness `--allow-writes` sweep against a Supabase branch DB (create_branch → sweep → diff → discard); fixes the 635-endpoint blind spot and populates realistic fixtures simultaneously |
| **D2 · Multi-tenancy hardening** | From org-scoped app logic → enforced isolation | `org_id` audit across all 577 tables (P0-2 scoping exists in routes; make it schema-complete); Supabase **RLS policies** on tenant tables as defense-in-depth under the app-layer RBAC; per-org row quotas |
| **D3 · LLM substrate** | The DB becomes the model's memory | `pgvector` extension; `llm_corpus_chunks`, `llm_traces`, `llm_feedback`, `golden_qa` tables; nightly embed-refresh job as a 20th ingester (the ingestion framework is the right scaffold) |
| **D4 · Analytics warehouse posture** | From OLTP-only → usage + outcome analytics | Materialized views over `audit_*` (18 tables already capturing everything) for product analytics (module DAU, calc volumes, copilot deflection); scheduled aggregation jobs; retention policies |
| **D5 · Governance** | Audit-ready data layer | Alembic two-head merge + baseline autogen stamp (the deferred debt — becomes mandatory the day a second environment exists); documented data dictionary generated from DATABASE_CATALOG.md + column comments |

## 3 · Calculation-engine expansion → analytics maturity ladder

Every engine climbs the same five rungs; the Atlas §9 evolution entries assign each
module its next rung. Rung definitions:

1. **Deterministic calc** (all 297 today) — correct formula, honest nulls.
2. **Scenario/what-if** — parameter sweeps, NGFS/SSP grids, sensitivity tables
  (~60 engines already; the QMC/scenario-matrix pattern from Financial Modeling Studio
  is the template to generalize).
3. **Calibrated/benchmarked** — bench-pinned numerics + calibration to observed data
  (12/297 pinned today → target: every tier-A flagship; the B3 inventory orders them).
4. **Predictive** — forecasting layered on ingested history (the 19 ingesters provide
  the time series: IBTrACS seasons, NGFS vintages, market data, claims history);
  standard tooling (statsmodels/sklearn already in the environment), never black-box
  where a regulator will ask questions — model cards per Atlas §8 convention.
5. **Prescriptive/optimizing** — portfolio construction, abatement sequencing, hedge
  sizing (scipy optimization; MACC and BESS-stacking engines are natural first movers).

**Engine-platform work enabling the ladder**: a formal engine registry (name → version
→ input/output schema → tier → bench status) generated from the AST scan that already
powers ENGINE_CATALOG.md; version stamps in every engine response (needed for LLM
provenance and for reproducing any historical answer); deprecation of the ~98
"Other/cross-cutting" engines into named domains during their first evolution touch.

## 4 · Productization workstreams (non-LLM prerequisites)

- **Tenancy & identity**: org onboarding flow (invite system exists), SSO (OIDC),
  per-desk module presets as the packaging unit (RBAC presets already model this).
- **Packaging/pricing**: the 4 personas are the SKUs — Financial Risk Desk, Energy &
  Infrastructure Desk, Supply Chain & Trade Desk, Industrial Decarbonization Desk; each
  bundles its sector modules + copilot; cross-desk = enterprise tier. Usage-metered
  LLM add-on (traces table doubles as the billing meter).
- **Scale-out**: Redis-backed rate limiter + session store (in-memory today, documented
  single-instance constraint); worker split for ingesters/long calcs (the scheduler
  exists; move it off the web process); CDN for the static bundle.
- **Reliability**: the 5 open bugs in CRITICAL_REVIEW B1 cleared; error budget +
  `/api/health` deepened (DB, engine-import, vector-store probes); staging environment
  (forces the Alembic merge — D5).
- **Compliance posture**: SOC 2 readiness leaning on existing audit middleware; model
  risk documentation IS the Atlas (§7/§8 per module — a genuine differentiator in
  regulated sales); DPA/data-residency answers (Supabase us-east-2 today; EU project
  when first EU client requires).
- **Docs & onboarding**: user-facing docs generated from module_guides + Atlas (the
  Notion wiki push proved the pipeline); guided mode → interactive onboarding tours.

## 5 · Phased roadmap with gates

| Phase | Duration | Ships | Gate to next |
|---|---|---|---|
| **P0 · Foundation** | 4–6 wks | Commit/push + deploy (DEPLOYMENT.md blockers); D0 seeds; B1 bug clears; pgvector + corpus tables; bench_llm harness skeleton; engine registry | Platform live at a URL, demo data credible, eval harness runs |
| **P1 · Copilot GA** | 6–8 wks | Tier-1 copilot on the 4 desk-flagship module sets (~40 modules); atlas-embed refresh job; llm_traces capture; usage analytics views (D4) | Copilot answer-quality ≥ target on bench_llm; zero fabrication failures in eval; <$X/query cost |
| **P2 · Analyst + Analytics** | 8–12 wks | Tier-2 tool-calling on read-only endpoints desk-by-desk; D1 write-sweep + D2 tenancy hardening; 20 more engines bench-pinned; first rung-4 predictive engines (physical-risk trends, price forecasts) | Tool-call traceability validator green; multi-org pilot running isolated |
| **P3 · Desk intelligence** | 12+ wks | Tier-3 orchestrators per desk; Tier-4 first distilled desk model (highest-volume desk by traces); prescriptive engines (MACC sequencing, portfolio optimizer); marketplace of desk SKUs | Distilled model ≥ frontier baseline on that desk's bench_llm at ≤30% cost |

**KPIs across phases**: fabrication-eval failure rate (must stay 0), copilot deflection
rate, engine bench coverage (12 → 35 → 60+), % endpoints tool-exposed, empty-table
count in *suspicious* category (B2c → 0), tenant count, trace volume (the flywheel).

## 6 · Risks specific to this plan

| Risk | Mitigation |
|---|---|
| LLM answers subtly contradict engine docs as engines evolve | Embeddings regenerate from the atlas in the same pipeline that documents the change; answer citations pin atlas version |
| Tool-calling against 2,528 endpoints = huge attack/error surface | Per-module tool allowlists from the Atlas endpoint map; read-only first; RBAC inherited from user session; mutating tools behind confirmations |
| Fine-tuning bakes in errors from unaudited engines | Tier-4 only trains on desks whose flagship engines are bench-pinned (ladder rung 3 is a prerequisite) |
| Cost blow-up on copilot chat | Haiku-tier default + prompt caching (static module context), distillation in P3; per-org metering from day one |
| 999-module evolution backlog becomes shelf-ware | Each module's §9 evolutions are scoped as its next TWO increments only, tied to the ladder — not open-ended vision |

---

*Per-module detail: every module's two future evolutions are in
`docs/module_atlas/evolution/<module-id>.md`, merged into its atlas page as §9 —
Evolution A is the analytics/engine/data deepening (ladder-aligned), Evolution B is the
LLM-native/workflow evolution (tier-aligned). See §1/§3 above for the shared
architecture they assume.*
