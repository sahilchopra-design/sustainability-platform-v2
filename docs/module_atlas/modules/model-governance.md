# Model Governance Hub
**Module ID:** `model-governance` · **Route:** `/model-governance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralised ESG model risk management platform covering model inventory, validation workflows, documentation standards, approval gating, and ongoing performance monitoring across all quantitative ESG and climate risk models. Implements SR 11-7, ECB, and PRA model risk management supervisory expectations with role-based access control, version management, and independent validation assignment. Supports both in-house and vendor model governance.

> **Business value:** Provides model risk officers and quantitative teams with a centralised, auditable governance hub that satisfies SR 11-7, ECB, and PRA supervisory expectations for ESG model risk management while reducing compliance burden through workflow automation.

**How an analyst works this module:**
- Register a new model by completing the model intake form including purpose, scope, data inputs, and output metrics
- Assign model risk rating using the materiality, complexity, and concentration scoring rubric
- Initiate validation workflow and assign to independent validator; track documentation completeness checklist
- Review validation findings, model limitations documentation, and approve or request remediation
- Monitor ongoing model performance using the PSI and outcome analysis dashboard; trigger revalidation when thresholds are breached

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CHANGELOG_KEY`, `KpiCard`, `MODEL_DEPENDENCIES`, `MODEL_REGISTRY`, `REGULATORY_FRAMEWORKS`, `REVIEW_ITEMS`, `RISK_TIERS`, `Section`, `StatusBadge`, `TierBadge`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `RISK_TIERS` | 4 | `description`, `validation_frequency`, `governance`, `examples`, `color` |
| `REGULATORY_FRAMEWORKS` | 7 | `name`, `scope`, `models` |
| `MODEL_DEPENDENCIES` | 9 | `to`, `label` |
| `TABS` | 11 | `id`, `l` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtDate` | `d => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : 'N/A';` |
| `daysDiff` | `(a,b) => Math.floor((new Date(b)-new Date(a))/86400000);` |
| `monthsDiff` | `(a,b) => Math.round(daysDiff(a,b)/30.44);` |
| `companies` | `useMemo(()=>(GLOBAL_COMPANY_MASTER\|\|[]).slice(0,80),[]);  // Portfolio (wrapped format) const portfolio = useMemo(()=>{ try { const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1')\|\|'{}');` |
| `ages` | `modelsWithStatus.filter(m=>m.validation_age!=null).map(m=>m.validation_age);` |
| `avgAge` | `ages.length ? (ages.reduce((a,b)=>a+b,0)/ages.length).toFixed(1) : 'N/A';` |
| `nextDue` | `modelsWithStatus.filter(m=>m.next_validation).sort((a,b)=>new Date(a.next_validation)-new Date(b.next_validation))[0];` |
| `categories` | `new Set(modelsWithStatus.map(m=>m.category));` |
| `entry` | `{ id:`CL-${Date.now()}`, modelId:clModelId, change:clChange, reason:clReason, timestamp:new Date().toISOString(), user:'Quant Team' };` |
| `rows` | `MODEL_REGISTRY.map(m=>[m.id,m.name,m.engine,m.category,m.risk_tier,m.validation_status,m.last_validated\|\|'',m.next_validation\|\|'',(m.regulatory_use\|\|[]).join('; '),m.backtested?'Yes':'No',m.backtest_accuracy\|\|'']);` |
| `csv` | `[headers.join(','),...rows.map(r=>r.join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `pkg` | `{ exported:new Date().toISOString(), platform:'Risk Analytics v6.0', type:'Model Validation Report', models:MODEL_REGISTRY.map(m=>({...m,computed_status:modelsWithStatus.find(x=>x.id===m.id)?.computed_status})), changelo` |
| `pct` | `Math.round(completed/REVIEW_ITEMS.length*100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MODEL_DEPENDENCIES`, `MODEL_REGISTRY`, `REGULATORY_FRAMEWORKS`, `REVIEW_ITEMS`, `RISK_TIERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Models in Inventory | — | Platform model registry | Total number of quantitative ESG and climate risk models registered and governed in the platform |
| Models Awaiting Validation (%) | — | Validation queue status | Proportion of registered models past their scheduled validation date without approved revalidation |
| Mean Validation Cycle Time (days) | — | Validation workflow logs | Average elapsed time from model validation initiation to independent validation committee approval |
| Critical Model (High MRR) Count | — | Model risk rating distribution | Number of models rated High MRR requiring annual full validation and senior sign-off |
- **Model intake forms and technical documentation** → Classify by model type, risk rating, and validation status; register in inventory → **Structured model registry with metadata, ownership, and governance status**
- **Validation workflow engine** → Route documents to assigned validators; track checklist completion and findings → **Validation report with finding severity classification and remediation requirements**
- **Performance monitoring data pipeline** → Compute PSI and outcome analysis metrics monthly; compare to risk appetite thresholds → **Ongoing monitoring dashboard with revalidation trigger alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** Model Risk Rating
**Headline formula:** `MRR = Materiality × Complexity × (1 + Concentration)`

Model Risk Rating is the product of materiality score (business impact), complexity score (technical sophistication), and a concentration uplift reflecting the model’s role as a critical single point of failure. High MRR models (above 75th percentile) require annual full validation and independent model risk committee approval. Low MRR models qualify for ongoing monitoring without full revalidation.

**Standards:** ['Federal Reserve SR 11-7 Supervisory Guidance on Model Risk Management', 'ECB Guide on Internal Models 2019', 'PRA SS1/23 Model Risk Management Principles 2023', 'ISO/IEC 42001 AI Management System 2023']
**Reference documents:** Federal Reserve SR 11-7 Supervisory Guidance on Model Risk Management 2011; ECB Guide on Internal Models 2019 â€” Chapter on Model Risk Management; PRA Supervisory Statement SS1/23 â€” Model Risk Management Principles for Banks 2023; Basel Committee on Banking Supervision BCBS 239 â€” Risk Data Aggregation 2013; ISO/IEC 42001:2023 â€” Artificial Intelligence Management System

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states a Model Risk Rating formula
> `MRR = Materiality × Complexity × (1 + Concentration)`. **No such score is computed anywhere in
> the code** — there is no `materiality`/`complexity`/`concentration` field on any of the 15
> registered models. What the page actually implements is something more useful in practice: a
> **real, hand-curated inventory of 15 of the platform's own quant models** (PD engines, Monte
> Carlo VaR, WACC, DMI, ITR regression, copula tail risk, CRREM stranding, etc.) with genuine
> cross-references to their actual source files, honest per-model assumptions/limitations text, and
> a live overdue-validation calculator. Sections below document what the code does.

### 7.1 What the module computes

`MODEL_REGISTRY` is a hand-authored, **accurate** catalog of 15 models actually present elsewhere in
this codebase (e.g. `M001` "PD Exponential" → `dme_pd_engine.py`, `PD = PD_base × exp(α×v_transition)`;
`M005` "Monte Carlo Climate VaR" → `MonteCarloVarPage.jsx`, Cholesky-decomposed shocks; `M015` "CRREM
Stranding Model" → `CRREMPage.jsx`). Each entry carries real `methodology`, `assumptions`,
`limitations`, `inputs`, `outputs`, `backtest_accuracy` fields written specifically for that model.

```js
// Overdue-validation logic — the one genuine computation on the page
computed_status = (next_validation < now && validation_status !== 'validated') ? 'overdue' : validation_status
validation_age  = monthsDiff(last_validated, now)   // round(daysDiff/30.44)

kpis.avgAge = mean(validation_age across models with a value)
kpis.overdue/validated/pending = counts by computed_status
kpis.t1/t2 = counts by risk_tier
```

### 7.2 Parameterisation

| Structure | Content | Provenance |
|---|---|---|
| `MODEL_REGISTRY` (15 models) | id/name/engine/category/methodology/assumptions/limitations/backtest_accuracy | **Hand-authored and cross-referenced to real platform files** — the most reliable content in this batch of modules |
| `RISK_TIERS` (3 tiers) | Tier 1 (semi-annual, board approval) / Tier 2 (annual, quant team) / Tier 3 (biennial, self-assessment) | Standard SR 11-7-style tiering, reasonably calibrated to each model's actual regulatory use |
| `REGULATORY_FRAMEWORKS` (6) | ECB Internal Models Guide, PRA SS1/13, MAS Circular, Basel III/IV, IFRS 9, TCFD/ISSB S2 — each mapped to specific model IDs | Hand-curated mapping; e.g. `ifrs9` correctly lists M001–M004 (the PD engines) and M013 (Scenario PD) |
| `MODEL_DEPENDENCIES` (8 edges) | e.g. "M001→M013: PD feeds Scenario PD", "M008↔M011: DMI↔Sentiment" | Genuine data-flow documentation matching how these models are actually wired in the platform |
| `backtest_accuracy` | 0.79–0.94 across models | Hand-typed per model; plausible values but not derived from an actual backtest harness run inside this page |

### 7.3 Calculation walkthrough

1. **Registry tab** — sortable table over `modelsWithStatus`, computed once via `useMemo` applying the
   overdue-detection rule above to every model.
2. **KPI strip** — genuine `filter`/`length` counts over `modelsWithStatus` (validated/pending/overdue,
   Tier 1/2 counts, `avgAge` mean).
3. **Kanban board** — `kanbanStatus` state seeded from `validation_status`, user-draggable (client-side
   only, not persisted to any backend).
4. **Annual review checklist** — 10-item `REVIEW_ITEMS` checklist per model, `pct = round(completed /
   REVIEW_ITEMS.length × 100)` — a genuine completion-percentage calculation over user-entered
   checkbox state.
5. **Change log** — user-submitted entries (`modelId`, `change`, `reason`, timestamp) persisted to
   `localStorage` — a real (if client-only) audit trail mechanism.
6. **Export** — CSV/JSON export of `MODEL_REGISTRY` with `computed_status` merged in — genuine
   client-side serialization.

### 7.4 Worked example

Model `M006` ("VaR Additive (Reputational)"): `last_validated = '2024-08-15'`,
`next_validation = '2025-02-15'`, `validation_status = 'pending'`. If evaluated on 2026-07-02 (this
session's date), `new Date('2025-02-15') < now` is true and `status !== 'validated'` → recomputed
`computed_status = 'overdue'`. `validation_age = monthsDiff('2024-08-15', now) = round(daysDiff/30.44)`
— roughly 23 months since last validation, well past the semi-annual (Tier 2) cadence its own
`RISK_TIERS` entry specifies — the page's own overdue logic correctly flags this internally
inconsistent state (a Tier 2 model that hasn't been touched in ~2 years).

### 7.5 Companion analytics

- **Model dependency map** — renders `MODEL_DEPENDENCIES` as a directed list; genuinely useful for
  understanding blast radius if e.g. `M011` (Sentiment Pipeline) changes and downstream `M008` (DMI)
  needs re-validation.
- **Regulatory framework cross-reference** — lets a user select e.g. "IFRS 9" and see exactly which
  4–5 models feed that regulatory obligation.

### 7.6 Data provenance & limitations

- **The MRR formula in the guide does not exist in code** — risk tiering is a static, hand-assigned
  field per model (`risk_tier: 'Tier 1'`), not a computed composite of materiality/complexity/
  concentration.
- `backtest_accuracy` values are asserted, not computed live — this page does not itself run any
  backtest; it displays a number someone recorded.
- The overdue-detection logic (§7.3) is the one piece of genuine, auditable business logic on the
  page and is correctly implemented (date comparison, not a placeholder).
- Portfolio integration (`GLOBAL_COMPANY_MASTER`, `localStorage` portfolio read) is present in the
  imports but not visibly used to filter or weight the model registry in the code reviewed.

**Framework alignment:** Fed SR 11-7 (three-tier risk classification genuinely mirrors SR 11-7's
model-risk-tiering guidance) · ECB Guide on Internal Models 2019, PRA SS1/13, MAS Circular, Basel
III/IV, IFRS 9, TCFD/ISSB S2 (all six correctly named and mapped to the actual models that would fall
under each) · ISO/IEC 42001 (named in guide, not implemented as a certification workflow).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Implement the Model Risk Rating (MRR) composite score the guide already specifies, so the existing
(accurate) 15-model registry can be objectively risk-ranked rather than relying on the current
hand-assigned `risk_tier` field, supporting the platform's model risk committee in prioritising
validation resources.

### 8.2 Conceptual approach
Standard SR 11-7 / PRA SS1/23 **materiality × complexity risk-scoring matrix**, the same structure
banks use to triage their model inventories (JPMorgan's Model Risk Management function and most
Basel-regulated banks use a comparable 2×2-plus-concentration scoring grid) — quantifying what is
currently only qualitatively captured in the `risk_tier` field.

### 8.3 Mathematical specification

```
Materiality_m  = f(regulatory_use_count, portfolio_$_exposure, decision_criticality)   // 1-5 scale
Complexity_m   = f(model_type_complexity, #_inputs, #_assumptions, backtest_maturity)   // 1-5 scale
Concentration_m = fraction of platform models/decisions depending on model m (from MODEL_DEPENDENCIES graph)

MRR_m = Materiality_m × Complexity_m × (1 + Concentration_m)
   High MRR (>75th percentile) ⇒ Tier 1, semi-annual full validation, committee approval
   Low MRR ⇒ Tier 3, ongoing monitoring only
```

| Parameter | Calibration source |
|---|---|
| Materiality scale | Regulatory-use count already captured in `regulatory_use` field (e.g. M001 has 2 uses → higher materiality) |
| Complexity scale | Model type heuristic: Merton/copula/multi-factor > single-factor tabular (already implicit in the existing methodology descriptions) |
| Concentration | Directly computable from the existing `MODEL_DEPENDENCIES` graph — count of downstream dependents per model |

### 8.4 Data requirements
No new data needed — every input (`regulatory_use`, `methodology` complexity class, `MODEL_DEPENDENCIES`
edges) already exists in the current `MODEL_REGISTRY` and `MODEL_DEPENDENCIES` arrays; this is purely
a derivation, not a data-sourcing problem.

### 8.5 Validation & benchmarking plan
Sanity-check computed `risk_tier` (derived from MRR percentile) against the currently hand-assigned
`risk_tier` field for all 15 models — large disagreements should be investigated (e.g. is M012
"Greenium M5 Ensemble", currently Tier 1 with `backtested: false`, actually high-concentration enough
to warrant that tier, or was it hand-assigned conservatively?).

### 8.6 Limitations & model risk
A purely formulaic MRR risks under-weighting qualitative factors (e.g. regulatory sensitivity,
reputational exposure) that expert judgment currently captures in the hand-assigned tiers — the
production version should treat the formula as a *recommendation* subject to model-risk-committee
override, with the override reason logged in the existing changelog mechanism.

## 9 · Future Evolution

### 9.1 Evolution A — Computed Model Risk Rating over the live registry (analytics ladder: rung 1 → 3)

**What.** Implement the MRR composite the guide promises but the code never computes — §7's mismatch flag confirms `risk_tier` is a hand-assigned string on each of the 15 `MODEL_REGISTRY` entries, and the only genuine logic today is the overdue-validation date check. §8 already specifies the formula (`MRR = Materiality × Complexity × (1 + Concentration)`); this evolution builds it, plus a first backend vertical so the registry stops living in one JSX file and `localStorage`.

**How.** (1) Derive Materiality from the existing `regulatory_use` counts, Complexity from a model-type heuristic over the `methodology` field, and Concentration directly from the `MODEL_DEPENDENCIES` graph (count of downstream dependents) — §8.4 confirms no new data is needed. (2) Move `MODEL_REGISTRY` into a `model_inventory` table via Alembic, replacing the `localStorage` changelog with an audited write endpoint so validation history survives browser resets. (3) Wire the registry to the platform's real engine catalog (the AST scan behind ENGINE_CATALOG.md) so new engines auto-appear as "unregistered" rather than requiring hand entry.

**Prerequisites.** §8.5's sanity check: computed tiers must be reconciled against the current hand-assigned tiers for all 15 models, with committee-override reasons logged. `backtest_accuracy` values remain asserted-not-computed and must be labelled as such. **Acceptance:** every model shows a computed MRR with its three factor inputs visible; a change to `MODEL_DEPENDENCIES` measurably moves the dependent model's Concentration score.

### 9.2 Evolution B — Validation-workflow copilot grounded in the model inventory (LLM tier 1)

**What.** A copilot on the `/model-governance` page that answers "why is M006 overdue?", "which models feed IFRS 9?", or "draft the SR 11-7 validation memo for M005" strictly from the page's own state: the 15-model registry with its hand-written `methodology`/`assumptions`/`limitations` text, the `computed_status` overdue logic, `MODEL_DEPENDENCIES` edges, and the `REGULATORY_FRAMEWORKS` mapping. This registry is unusually good grounding — §7.2 notes it is hand-authored and cross-referenced to real platform files — so a tier-1 explainer needs no new data.

**How.** Per-module system prompt assembled from this Atlas page plus the serialized `MODEL_REGISTRY` (already exported as JSON by the page's export function); serve via the roadmap's `POST /api/v1/copilot/{module_id}/ask` router with prompt caching. Drafted validation memos must template from the model's own `limitations` and `backtest_accuracy` fields, never invent test results. Refusal path required for questions about models not in the registry or metrics the page does not compute (e.g. live PSI — §4 lists PSI monitoring as a described pipeline, not an implemented one).

**Prerequisites.** None hard for read-only Q&A; memo drafting should wait for Evolution A's DB-backed registry so citations reference stable row IDs rather than JSX constants. **Acceptance:** every claim in a copilot answer traceable to a registry field or Atlas section; asking "what is M003's current PSI?" yields a refusal, not a number.