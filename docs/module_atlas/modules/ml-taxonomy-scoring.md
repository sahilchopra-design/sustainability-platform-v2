# ML Taxonomy Scoring Engine
**Module ID:** `ml-taxonomy-scoring` · **Route:** `/ml-taxonomy-scoring` · **Tier:** B (frontend-computed) · **EP code:** EP-CS4 · **Sprint:** CS

## 1 · Overview
XGBoost ML model using 316 taxonomy features for 12-month forward transition score prediction with SHAP explainability and conformal intervals.

**How an analyst works this module:**
- Model Config adjusts hyperparameters
- Training Dashboard shows loss curves
- SHAP Explainer shows top 15 features per entity
- Calibration Plot validates prediction quality

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CALIBRATION_DATA`, `Card`, `ENTITIES`, `FEATURE_COUNT`, `PREDICTIONS`, `SHAP_WATERFALL`, `TABS`, `TOP_FEATURES`, `TRAINING_EPOCHS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PREDICTIONS` | `ENTITIES.map((name, i) => ({` |
| `TOP_FEATURES` | `leaves.slice(0, 15).map((l, i) => ({` |
| `SHAP_WATERFALL` | `TOP_FEATURES.slice(0, 15).map((f, i) => ({` |
| `err` | `Math.abs(p.predicted - p.actual);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Features | — | Taxonomy leaves | One feature per L4 node |
| R² | — | Cross-validation | Model explanatory power |
| Coverage | — | Conformal | Prediction interval coverage rate |

## 5 · Intermediate Transformation Logic
**Methodology:** XGBoost ensemble with conformal prediction
**Headline formula:** `y_hat = XGBoost(features_316); CI = [y_hat - q_α, y_hat + q_α]`

316 leaf-node scores as features. XGBoost: n_estimators=500, max_depth=6, lr=0.05. Conformal prediction: 90% coverage intervals from calibration set. SHAP values for per-prediction interpretability.

**Standards:** ['SHAP (Lundberg 2017)', 'Conformal Prediction (Vovk 2005)']
**Reference documents:** Lundberg & Lee (2017) SHAP; Vovk et al. (2005) Conformal Prediction; Chen & Guestrin (2016) XGBoost

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states `R² = 0.78` (cross-validation) and describes a
> real conformal-calibrated XGBoost model. The code instead hard-codes **`R-Squared: '0.847'`** and
> **`Coverage: '94.2%'`** as static KPI-strip literals — neither is computed from the page's own
> `PREDICTIONS`/`CALIBRATION_DATA` arrays, and the two numbers don't even match the guide's cited
> R². Training curves, feature importances, SHAP waterfall, and calibration scatter are all `sr()`
> PRNG output. The one genuinely real element is `FEATURE_COUNT = getLeafNodes().length`, sourced
> from the platform's actual `taxonomyTree.js` hierarchy (shared with the DME and other taxonomy
> modules) — everything downstream of that count is synthetic. Sections below document the code.

### 7.1 What the module computes

```js
leaves = getLeafNodes()                    // REAL: Level-4 leaf nodes from TAXONOMY_TREE
FEATURE_COUNT = leaves.length               // REAL count, feeds every "N features" label on the page

TRAINING_EPOCHS[i] (50 rows) = {
  train_rmse: 0.42 − 0.35(1−e^(−i/12)) + sr(i)*0.01,      // smooth exponential learning-curve shape
  val_rmse:   0.44 − 0.30(1−e^(−i/15)) + sr(i*3)*0.015,
  train_mae, val_mae: analogous exponential decay curves
}

PREDICTIONS (10 named entities: Shell, BP, TotalEnergies, Enel, NextEra, Rio Tinto, ArcelorMittal,
  HeidelbergCement, Maersk, Deutsche Bank) = {
  predicted: 30 + sr(i*8)*55, actual: 28 + sr(i*11)*58, lower/upper: independent sr() draws,
  rating: scoreToRating(predicted).label                 // REAL A–E banding function
}

TOP_FEATURES = leaves.slice(0,15).map((l,i) => ({
  importance: 0.08 − i*0.004 + sr(i*5)*0.01               // linear decay by leaf order, not real gain
})).sort(desc)

SHAP_WATERFALL = TOP_FEATURES.slice(0,15).map((f,i) => ({ contribution: (sr(i*7)−0.45)*12 }))
CALIBRATION_DATA (20 points) = { predicted: 5+i*4.8, actual: predicted + (sr(i*7)−0.5)*8 }
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `FEATURE_COUNT` | `leaves.length` from `taxonomyTree.js` | **Real** — the only genuinely computed quantity on the page, shared with the platform's taxonomy engine (also feeds the DME and `ml-feature-engineering`'s 316-leaf claim) |
| XGBoost architecture table | n_estimators/max_depth/lr sliders (default 200/6/0.1), 80/20 split, 5-fold CV, L1=0.1/L2=1.0, conformal split (Romano et al.), Platt calibration | Realistic, textbook-correct XGBoost configuration — but purely descriptive; sliders don't retrain anything |
| Header KPI "R-Squared" | hard-coded `'0.847'` | Static string, does not match guide's `0.78`, not computed from `CALIBRATION_DATA` |
| Header KPI "Coverage" | hard-coded `'94.2%'` | Static string, not computed from `PREDICTIONS`' `lower`/`upper` bounds (unlike the sister module `ml-risk-scorer`, which *does* compute `coverageRate` genuinely) |
| Calibration footer | "Brier score: 0.082. ECE: 3.2%." | Static text, not derived from `CALIBRATION_DATA` |

### 7.3 Calculation walkthrough

1. **Model Config tab** — hyperparameter sliders (`nEstimators`, `maxDepth`, `learningRate`,
   `conformal` toggle) are pure UI state; no training call is wired to them.
2. **Training Dashboard tab** — plots the 50-epoch exponential-decay `TRAINING_EPOCHS` series (fixed
   at module load, independent of the slider values above).
3. **Prediction Results tab** — table of the 10 named entities with `err = |predicted − actual|`,
   colour-coded ≤5 green / ≤10 amber / >10 red — a real per-row computation over synthetic inputs.
4. **Feature Importance tab** — bar chart of `TOP_FEATURES`, ordered by a decay formula keyed to each
   leaf's *position in the taxonomy array*, not by any measured contribution to prediction error.
5. **SHAP Explainer tab** — per-selected-entity waterfall of `SHAP_WATERFALL` contributions; the same
   15-feature contribution set is shown for every entity selected via the dropdown — SHAP values do
   not actually vary by entity in this implementation, defeating the purpose of per-instance
   explainability.
6. **Calibration tab** — scatter of `CALIBRATION_DATA` against the 45° "Perfect" reference line.

### 7.4 Worked example

`TOP_FEATURES[0]` (first taxonomy leaf, `i=0`): `importance = 0.08 − 0×0.004 + sr(0×5)×0.01`.
`sr(0) = frac(sin(1)×10⁴) ≈ 0.7096` → `importance ≈ 0.08 + 0.0071 = 0.0871`. For `i=14` (15th leaf):
`importance = 0.08 − 14×0.004 + sr(70)×0.01 = 0.08 − 0.056 + (0–0.01) ≈ 0.024–0.034`. After the
`.sort((a,b)=>b.importance−a.importance)` step, the *displayed* order need not match taxonomy order —
the top slot is whichever leaf's jitter term happened to push it highest, illustrating that "top
feature" here is an artefact of PRNG jitter on a linear decay, not a measured driver of any target
variable.

### 7.5 Companion analytics

- **Model Architecture Summary table** — accurate, realistic XGBoost configuration documentation
  (algorithm, features, target definition "Transition Risk Score (0–100)", train/val split,
  cross-validation, regularization, conformal method, calibration) — a legitimate model-card template
  even though no such model has actually been trained.
- **`scoreToRating`** — the real A(≥80)/B(≥60)/C(≥40)/D(≥20)/E(<20) banding function from
  `taxonomyTree.js`, applied consistently to the synthetic `predicted` scores.

### 7.6 Data provenance & limitations

- **FEATURE_COUNT is the only real quantity**; everything derived from it (training curves,
  predictions, importances, SHAP, calibration) is `sr()`-seeded.
- **Header KPIs contradict each other and the guide**: `0.847` (page) vs `0.78` (guide) for R²,
  neither computed from the page's own data.
- **SHAP values do not vary by entity** despite an entity-selector UI implying they would — the
  waterfall chart is identical regardless of which of the 10 companies is selected.
- The realistic Model Architecture Summary table is a strong template for what a real model card
  should contain once an actual model exists (see §8).

**Framework alignment:** XGBoost regressor (named, not run) · Split conformal prediction (Romano,
Patterson & Candès 2019 — named methodology, not calibrated) · Platt scaling (Platt 1999, named) ·
SHAP (Lundberg & Lee 2017, named, not entity-varying) · the platform's own real taxonomy hierarchy
(`TAXONOMY_TREE`) genuinely anchors the feature count and rating bands.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Train a genuine XGBoost transition-risk-score model over the platform's real taxonomy leaf features,
with entity-varying SHAP explanations and properly calibrated conformal prediction intervals, to
support the 12-month forward transition score predictions the guide describes for corporate entities.

### 8.2 Conceptual approach
Identical conceptual architecture to `ml-risk-scorer`'s §8 (XGBoost + split conformal + TreeSHAP), but
scoped specifically to the platform's `FEATURE_COUNT`-dimensional taxonomy leaf-score feature space —
mirroring how MSCI and Sustainalytics derive composite transition scores from dozens of granular
sub-indicators via a trained (not hand-weighted) model, an evolution beyond the platform's existing
`aggregateScores()` weighted bottom-up rollup in `taxonomyTree.js`.

### 8.3 Mathematical specification

```
y_hat = XGBoost_regressor(x ∈ R^FEATURE_COUNT)     // target: 12-month-forward transition score, 0-100
Train via 5-fold CV, early stopping on val_rmse; select champion by lowest CV RMSE

Conformal interval (90%): [ŷ − q̂_lo, ŷ + q̂_hi]  per Romano et al. 2019 split-conformal procedure
SHAP_j(x): TreeSHAP exact Shapley decomposition, computed PER PREDICTION (must vary by entity x)

R² = 1 − Σ(y_i − ŷ_i)² / Σ(y_i − ȳ)²            // computed on held-out test fold, not a fixed literal
Coverage = (1/n) Σ 1[y_i ∈ [lower_i, upper_i]]    // computed on held-out test fold
```

| Parameter | Calibration source |
|---|---|
| Feature space | `FEATURE_COUNT` real taxonomy leaves (already correctly wired) |
| Target variable | historical 12-month-forward realized transition score (requires a point-in-time score history — see §8.4) |
| Conformal α | 0.10 (90% target, consistent with page's stated intent) |
| Regularization | L1=0.1, L2=1.0 (already specified in the UI's architecture table — reasonable XGBoost defaults) |

### 8.4 Data requirements
Point-in-time historical taxonomy leaf scores for a training panel of entities (needed to construct
both the feature matrix and the forward-looking target) — the platform's `aggregateScores()` function
already computes current scores from `nodeScores`; a time-series snapshot table would be needed to
build the 12-month-forward training target.

### 8.5 Validation & benchmarking plan
Compare trained-model R²/RMSE against the existing rule-based `aggregateScores()` weighted rollup as a
baseline (the model should outperform simple weighted averaging to justify its complexity); verify
SHAP values differ meaningfully across entities and reconstruct each entity's actual prediction via
the additivity property.

### 8.6 Limitations & model risk
A learned model risks losing the transparency of the current hand-weighted `aggregateScores()`
rollup (which the platform already surfaces to users as an auditable weight table) — any production
deployment should keep the rule-based rollup as a fallback/challenger and require the ML model to
demonstrably outperform it before promotion, consistent with the champion/challenger pattern already
described (but not populated with real data) in `ml-risk-scorer`.

## 9 · Future Evolution

### 9.1 Evolution A — A real forward-score model on the real taxonomy features (analytics ladder: rung 1 → 4)

**What.** §7 identifies exactly one real element — `FEATURE_COUNT = getLeafNodes().length` from the platform's actual `taxonomyTree.js` (shared with the DME) — surrounded by simulation: hard-coded KPI strings (`R² '0.847'`, `Coverage '94.2%'`) that contradict both the guide's cited 0.78 and the page's own arrays; static Brier/ECE footer text; hyperparameter sliders wired to nothing; per-entity SHAP that *doesn't vary by entity* (defeating instance explainability); and ten real company names (Shell, BP, Maersk) carrying fabricated predictions. Evolution A trains the model the module describes: 316 taxonomy-leaf scores as features (the DME computes these — the feature pipeline partially exists), a 12-month-forward transition-score target from stored score history, XGBoost with real conformal calibration (the described Romano-et-al split is textbook-correct — implement it), and per-entity SHAP that actually conditions on the entity's feature vector.

**How.** (1) The binding question is target history: 12-month-forward prediction needs ≥2 years of stored leaf scores — audit the DME's score persistence first and scope the horizon to what the data supports (a 3-month target on a shallow panel, honestly labeled, beats a fabricated 12-month one). (2) Training/serving via the same run-registry infrastructure as ml-risk-scorer — one governed ML substrate, two consumer modules. (3) All static metric strings deleted; header KPIs computed from stored evaluation (`coverageRate` from actual interval hits — the sister module's genuine computation is the pattern). (4) Real-name predictions gated on real runs: until then, anonymised or clearly-labeled demo entities.

**Prerequisites (hard).** DME leaf-score history audit; shared ML infrastructure; the real-names/fabricated-predictions combination purged. **Acceptance:** R² and coverage reproduce from stored evaluations and update per run; SHAP waterfalls differ across entities; the prediction horizon matches the audited data depth; sliders affect real runs.

### 9.2 Evolution B — Transition-score explainer for taxonomy navigators (LLM tier 2)

**What.** The module's unique asset is the taxonomy join: predictions decompose into named L4 leaf contributions, which makes explanations *structurally* interpretable — "why does the model expect ArcelorMittal's transition score to deteriorate?" answers as "these leaf scores (process-emissions intensity, capex alignment…) carry negative SHAP contributions of X". Evolution B builds that explainer: per-entity SHAP narration grounded in leaf definitions from the taxonomy tree, interval honesty ("90% interval spans 12 points — the model is uncertain here because…"), and cross-links into the DME modules that own each leaf's underlying assessment.

**How.** Tier 2 over the prediction/SHAP/calibration routes: every contribution quoted is the entity's actual SHAP value with the leaf's taxonomy path cited; uncertainty framing uses the computed conformal interval and calibration diagnostics (real Brier/ECE once computed); "what would move this score" questions answer with the leaf-level sensitivities and route to the owning module for the underlying lever — the copilot connects prediction to action through the taxonomy graph, which is this module's distinctive value over the generic risk-scorer. Prediction claims about real companies carry the model-vintage and data-coverage caveats; out-of-sample entities get a refusal with the coverage explanation.

**Prerequisites (hard).** Evolution A's real model with entity-conditioned SHAP (narrating the current entity-invariant waterfall would be explainability theatre); Phase 2 tooling. **Acceptance:** SHAP narrations match stored per-entity values; every leaf reference resolves to the taxonomy tree; interval and vintage caveats present in every prediction answer.