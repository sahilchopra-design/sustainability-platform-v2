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
