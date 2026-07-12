# ML Governance Dashboard
**Module ID:** `ml-governance-dashboard` · **Route:** `/ml-governance-dashboard` · **Tier:** B (frontend-computed) · **EP code:** EP-CX6 · **Sprint:** CX

## 1 · Overview
Model inventory with PSI drift detection, SHAP explainability, Fed SR 11-7 compliance, and EU AI Act alignment.

**How an analyst works this module:**
- Model Inventory shows all deployed models
- Drift Detection monitors PSI weekly
- SHAP Explainability shows feature importance
- Compliance Status shows SR 11-7 and EU AI Act alignment

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COMPLIANCE_CHECKLIST`, `Card`, `EU_AI_ACT`, `KPI`, `MODELS`, `PERF_TREND`, `SHAP_FEATURES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MODELS` | 7 | `name`, `version`, `status`, `rmse`, `r2`, `auc`, `lastTrained`, `owner`, `riskTier`, `psi`, `featurePsi` |
| `SHAP_FEATURES` | 11 | `importance` |
| `COMPLIANCE_CHECKLIST` | 21 | `items`, `name`, `status` |
| `EU_AI_ACT` | 9 | `status`, `detail`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PERF_TREND` | `['2025-Q1','2025-Q2','2025-Q3','2025-Q4','2026-Q1'].map((q,i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPLIANCE_CHECKLIST`, `EU_AI_ACT`, `MODELS`, `PERF_TREND`, `SHAP_FEATURES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Models Deployed | — | Registry | Active production models |
| PSI Threshold | — | Industry standard | Drift detection trigger |
| SR 11-7 Compliance | — | Self-assessment | 87.5% checklist complete |
| EU AI Act | — | Assessment | 87.5% requirement alignment |

## 5 · Intermediate Transformation Logic
**Methodology:** Model risk governance
**Headline formula:** `PSI = Σ((Actual_i - Expected_i) × ln(Actual_i / Expected_i))`

PSI > 0.25 triggers retraining alert. Fed SR 11-7: 16-item MRM checklist. EU AI Act: 8-requirement high-risk AI alignment. SHAP: global feature importance + per-entity waterfall.

**Standards:** ['Fed SR 11-7', 'EU AI Act', 'Lundberg (2017)']
**Reference documents:** Fed SR 11-7 Model Risk Management; EU AI Act (2024); Lundberg & Lee (2017) SHAP

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry gives the PSI formula
> `PSI = Σ((Actual_i − Expected_i) × ln(Actual_i / Expected_i))` as the drift-detection methodology.
> **It is never computed.** Every model's `psi` and `featurePsi` value in the `MODELS` array is a
> **hand-typed constant** (e.g. M1: 0.08/0.12, M4: 0.18/0.22) — there is no actual vs. expected
> distribution binning anywhere in the file. Likewise the SHAP importances, EU AI Act compliance
> percentages, and SR 11-7 checklist statuses are all static reference tables, not derived from any
> live model artefact. Sections below document the governance-dashboard UI as actually implemented.

### 7.1 What the module computes

Six static "deployed models" (`MODELS`, hand-authored) carry pre-set `rmse`/`r2`/`auc`/`psi`/
`featurePsi` fields. The only *generated* series is a 5-quarter performance trend:

```js
PERF_TREND[i] = {
  rmse: round((4.2 − i×0.1 + (sr(i*10)*2−1)×0.15) × 100) / 100,   // 4.2 → 3.8 decay + ±0.15 jitter
  r2:   round((0.88 + i×0.01 + (sr(i*510)*2−1)×0.005) × 100) / 100,
}
```

`SHAP_FEATURES` (10 rows, importances 0.04–0.18 summing to 0.93), `COMPLIANCE_CHECKLIST` (4
categories × 4 items = 16 SR 11-7 items, 14 marked Complete), and `EU_AI_ACT` (8 requirements, 5
Compliant/2 Partial/1 Pending) are all fully hard-coded arrays.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `MODELS[i].psi` / `featurePsi` | 0.03–0.18 / 0.04–0.22 | Hand-typed; consistent with the guide's stated thresholds (>0.25 retrain, 0.10–0.25 monitor, <0.10 stable) but not computed from any actual/expected binned distribution |
| `PERF_TREND` decay/jitter | linear −0.1/quarter RMSE improvement | Illustrative trend shape, not fit to real model logs |
| SR 11-7 checklist | 14/16 Complete | Hand-set; the 16-item structure genuinely mirrors SR 11-7's documentation/validation/monitoring/risk-management categories |
| EU AI Act requirements | 8 items, 5/2/1 split | Hand-set; the 8 requirement categories genuinely mirror Articles 9–15 (risk management, data governance, technical documentation, transparency, human oversight, accuracy/robustness, record-keeping, registration) |

### 7.3 Calculation walkthrough

1. **Model Inventory (Tab 0)** — static table lookup, click-to-select row.
2. **Performance Monitoring (Tab 1)** — plots `PERF_TREND`'s generated RMSE/R² series with a
   hard-coded "RMSE Alert" reference line at 4.5; footer text asserts "No degradation alerts
   triggered" regardless of the actual plotted values (the assertion is static prose, not conditional
   on the data).
3. **Drift Detection (Tab 2)** — bar chart of the static `psi`/`featurePsi` fields with colour bands
   at the guide's 0.10/0.25 thresholds; the "Moderate Drift" card list filters
   `MODELS.filter(m => m.featurePsi > 0.10)` — a real filter operation, but over hand-typed inputs.
4. **Explainability Report (Tab 3)** — bar chart of the static `SHAP_FEATURES` table; footer text
   claims "TreeSHAP for gradient-boosted models and KernelSHAP for neural network" — no SHAP
   computation exists in this file.
5. **Compliance Status (Tab 4)** / **EU AI Act Alignment (Tab 5)** — static checklists rendered
   as-is; the "75% compliant" KPI in the header (`5/8` from `EU_AI_ACT`) is the one number on the page
   genuinely derived by counting a static array.

### 7.4 Worked example

The one real computation on the page: header KPI "Drift Alerts" =
`MODELS.filter(m => m.featurePsi > 0.10).length`. Checking the 6 models' `featurePsi` values
(0.12, 0.09, 0.15, 0.22, 0.08, 0.04): three exceed 0.10 (M1 climate transition ensemble at 0.12,
M3 cluster segmentation at 0.15, M4 NLP disclosure parser at 0.22) → **Drift Alerts = 3**, matching
what the page displays.

### 7.5 Companion analytics

- **Three-lines-of-defense narrative** — footer text describes the standard model-risk governance
  structure (developers / independent validation / internal audit) accurately as a *framework
  description*, not as something the page enforces or tracks per-model.

### 7.6 Data provenance & limitations

- **No real PSI computation exists.** A genuine PSI requires binning actual vs. expected (training)
  feature distributions into deciles and summing `(Actual_i − Expected_i) × ln(Actual_i/Expected_i)`
  per bin — this page skips straight to a pre-set scalar per model.
- **No real SHAP computation exists** — the "Explainability Report" is a static importance table with
  SHAP terminology attached to it.
- **Compliance/EU AI Act statuses are self-declared, not machine-verified** — a genuine compliance
  system would need audit-trail evidence per checklist item, which this page does not capture (the
  KPI Definition Builder pattern in `metrics-data-architecture` is closer to what would be needed).

**Framework alignment:** Fed SR 11-7 (checklist structure genuinely mirrors the four SR 11-7
governance pillars — documentation, validation, monitoring, risk management) · EU AI Act Annex III
Category 5(b) (high-risk financial-services AI classification correctly cited; 8-requirement
structure mirrors Articles 9–15) · Population Stability Index (formula named, not computed) · SHAP
(Lundberg & Lee 2017, named, not computed).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Implement genuine PSI drift monitoring and SHAP explainability computation so the governance
dashboard reflects actual production model behaviour rather than static placeholder values, for the
6+ models the platform runs in production (transition scoring, anomaly detection, clustering, NLP
parsing, scenario prediction, feature pipeline).

### 8.2 Conceptual approach
Use the standard **decile-binned PSI** methodology (identical to how banks monitor IFRS 9/Basel PD
model stability, and how the platform's own `model-governance` module already frames MRM practice)
and **TreeSHAP** (Lundberg et al. 2020) for tree-ensemble models — the exact combination Aladdin
Climate and most bank MRM platforms use for ongoing model monitoring.

### 8.3 Mathematical specification

```
PSI = Σ_{i=1}^{10} (Actual_i − Expected_i) × ln(Actual_i / Expected_i)
   where bins are deciles of the training (expected) score distribution,
   Actual_i = production-period proportion in bin i, Expected_i = training-period proportion in bin i

SHAP_j(x) = Σ_{S ⊆ F\{j}} [|S|!(|F|−|S|−1)!]/|F|! × [f(S∪{j}) − f(S)]     (Shapley value, exact form;
   TreeSHAP computes this in polynomial time for tree ensembles per Lundberg et al. 2020)
```

| Parameter | Calibration source |
|---|---|
| PSI bin count | 10 deciles (industry standard, matches guide's own threshold table) |
| PSI thresholds | <0.10 stable / 0.10–0.25 monitor / >0.25 retrain (already correctly stated in the guide and UI) |
| SHAP algorithm | TreeSHAP for XGBoost/LightGBM models; KernelSHAP for the NLP parser (model-agnostic) |

### 8.4 Data requirements
Training-period and rolling production-period score distributions per model (requires a scoring-log
table capturing model outputs over time — not currently present in the platform schema); feature
matrices at prediction time to compute live SHAP values (the models already producing predictions
elsewhere on the platform would need to persist their input feature vectors alongside outputs).

### 8.5 Validation & benchmarking plan
Unit-test the PSI calculation against known reference cases (e.g. identical distributions → PSI=0);
cross-check TreeSHAP outputs against the `shap` Python library's reference implementation for a
sample of predictions; validate that Σ SHAP values + base value reconstructs the model's raw
prediction (the additivity property SHAP guarantees).

### 8.6 Limitations & model risk
PSI is sensitive to bin definition (decile boundaries fixed at training time can become stale as the
population shifts); the production system should log both PSI and a secondary drift metric (e.g.
KL-divergence) and should never present governance compliance percentages without an underlying,
independently-verifiable evidence trail per checklist item.

## 9 · Future Evolution

### 9.1 Evolution A — A real model registry with computed PSI, governing the platform's own models (analytics ladder: rung 1 → 2)

**What.** §7 documents a governance dashboard with nothing to govern: the six "deployed models" are hand-authored rows with typed PSI values (the guide's `PSI = Σ(A−E)·ln(A/E)` never computed), static SHAP tables, and — most tellingly — footer prose asserting "No degradation alerts triggered" *unconditionally*, regardless of plotted values. The genuinely good parts are the frameworks: the SR 11-7 checklist structure and EU AI Act requirement categories accurately mirror the real regimes. Evolution A gives the dashboard real subjects: the platform itself is accumulating governable model assets — the engine registry the productization roadmap specifies (name → version → schema → bench status, generated from the AST scan behind ENGINE_CATALOG.md), any models the sibling `ml-risk-scorer`/`ml-feature-engineering` evolutions train, and the LLM deployments the roadmap's tiers introduce (which the EU AI Act tab is *actually relevant to*). PSI becomes computed: actual-vs-expected binned distributions over stored scoring outputs, evaluated on schedule.

**How.** (1) A `model_registry` table populated from the engine-registry scan plus explicit registrations for trained models and LLM configurations (model id, version, prompt/corpus vintage for LLM entries). (2) `POST /ml-governance/psi` computing the §5 formula over stored score distributions; alert rows generated by rule, and the unconditional "no alerts" prose deleted — status text must be conditional on data. (3) SR 11-7 / EU AI Act checklists become per-model assessment records with owner/date/evidence links, using the accurate category structures already built. (4) LLM governance wired to the roadmap's `llm_traces`/`bench_llm` artifacts: eval-score trends and no-fabrication-validator failure rates are this dashboard's native LLM metrics.

**Prerequisites.** Engine-registry generation (roadmap workstream); scoring-output persistence for PSI inputs; the hand-typed model rows deleted. **Acceptance:** PSI values recompute from binned stored distributions; alerts appear iff thresholds breach; every registry row corresponds to a real platform artifact with version; checklist statuses carry assessor and evidence.

### 9.2 Evolution B — Model-risk-management copilot, including for the platform's LLMs (LLM tier 2)

**What.** MRM is evidence-assembly work: "prepare the SR 11-7 validation summary for the risk-scorer v2", "which models breached PSI monitoring thresholds this quarter and what changed in their input mix?", "assess our copilot deployment against EU AI Act Article 13 transparency requirements" — the last being reflexive governance: the platform's own tier-1/2 copilots are the AI systems this module should assess, with `llm_traces` and validator logs as the evidence base.

**How.** Tier 2 over the registry/PSI/assessment routes: validation summaries assemble stored evidence (bench results, PSI history, checklist records) with every claim linked; drift explanations decompose the PSI computation by bin so "which segment drifted" is answerable mechanically; AI-Act assessments map registry facts to the requirement categories with gaps stated as findings. Governance discipline squared: this copilot documents model risk, so its own outputs are registry-logged and validator-checked — a copilot asserting "no alerts" without a query behind it would recreate the exact static-prose defect §7 flagged, now with more authority. Regulatory citations quote the curated framework structures with article references.

**Prerequisites (hard).** Evolution A's registry and computed monitoring (governance narration over typed constants would be compliance theatre); Phase 2 tooling; LLM-trace logging live. **Acceptance:** every status claim traces to a stored record or computation; validation summaries link their evidence; the copilot's own runs appear in the registry's LLM section.