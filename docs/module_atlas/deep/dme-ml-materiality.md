## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide frames the DME as continuous ML/NLP materiality scoring.
> This page *presents* a full ML pipeline — LDA topic model, K-means clusters, a 4-model classification
> ensemble, feature-importance, PSI/concept drift, retraining log — but **none of it is trained or
> computed in the browser.** Every "model output" is an **authored constant** (accuracies, AUCs,
> coherences, importances) or a `sr()`-seeded number. The page is an ML *narrative/dashboard*, not a
> running model. Below documents what is actually there.

### 7.1 What the module computes (and what it only displays)

**Displayed as static artifacts (not computed):**

- **LDA topics** (`LDA_TOPICS`, 8) — id, name, `coherence` (0.69–0.88), and 8 top words each. Authored.
- **K-means clusters** (`CLUSTERS`, 5) — named centroids over {esg, ghg, disclosure, risk}. Authored.
- **Classification ensemble** (`MODELS`, 4) — Random Forest / Gradient Boosting / LightGBM / Logistic
  Regression with fixed accuracy/precision/recall/F1/AUC and an ensemble `weight` (0.35/0.30/0.25/0.10).
- **Feature importance** (`FEATURES`, 15) — importances summing ≈1.0, led by GHG Intensity 0.187,
  Disclosure 0.163, ESG 0.148. Authored (looks like a gradient-boosting `feature_importances_` vector).

**Actually computed at runtime (but trivially / from seeds):**

- **Entity data** (40 rows) — every field is `sr()`-seeded (esg_score 40–95, ghg_intensity 10–410,
  controversy 0–7, sentiment −1…+1, `ml_materiality` = `sr(s·59)·100`, `anomaly_score` = `sr(s·61)·2−1`).
- **Cluster assignment** — `clusterAssign(entity,k) = ⌊sr(hash·7+k)·k⌋`: a **hash-based random bucket**,
  *not* a distance-to-centroid assignment. So the K-means view is cosmetic.
- **Ensemble vote** — a weighted blend of the four `MODELS.weight` applied to seeded per-entity scores.
- **Drift** (`DRIFT_LOG`, 12 months) — PSI values `0.05 + sr·0.15` etc.; `triggered = sr>0.75`.

### 7.2 Parameterisation / scoring rubric

| Object | Value | Provenance |
|---|---|---|
| LDA coherence | 0.69–0.88 | authored (typical c_v coherence range) |
| Ensemble weights | RF .35 / GB .30 / LGBM .25 / LR .10 | authored (accuracy-ranked) |
| Model AUCs | 0.863–0.931 | authored |
| Feature importances | 0.187…0.027, Σ≈1 | authored |
| PSI thresholds | breach at ~0.2 (drift `triggered`) | standard PSI rule of thumb |
| Cluster centroids | 5 named regimes | authored |

The PSI convention displayed (0.1 minor / 0.2 major shift) is the standard **Population Stability Index**
banding, and the feature list is a plausible ESG-materiality feature set — but the numbers are demo.

### 7.3 Calculation walkthrough

1. 40 entities are seed-generated with ~18 ESG/financial fields each.
2. Tabs render the authored ML artifacts alongside seeded per-entity scores.
3. Interactive controls (`clusterK`, `anomalyThreshold`, `materialityThreshold`, `sectorFilter`) filter
   or re-bucket entities — cluster re-bucketing uses the hash-random `clusterAssign`, not real K-means.
4. Anomaly tab flags entities whose `anomaly_score` exceeds the slider; classification tab thresholds
   `ml_materiality` at the materiality slider; ensemble tab blends the four model weights.

### 7.4 Worked example (ensemble vote)

Entity E05 with seeded per-model scores {RF 72, GB 75, LGBM 78, LR 60} and weights {.35,.30,.25,.10}:
`ensemble = 72·0.35 + 75·0.30 + 78·0.25 + 60·0.10 = 25.2 + 22.5 + 19.5 + 6.0 = 73.2`.
If `materialityThreshold = 50`, 73.2 > 50 → classified **material**. (The per-model scores are seeded, so
this is illustrative, not a real prediction.)

### 7.5 Data provenance & limitations

- **No model is trained or evaluated in code.** LDA coherences, K-means centroids, model
  accuracy/precision/recall/F1/AUC, and feature importances are **hard-coded**; PSI/drift and every
  entity field are `sr(seed)=frac(sin(seed+1)×10⁴)` synthetic values.
- The K-means view is misleading: `clusterAssign` is a hash-random bucket, so cluster membership does
  not reflect the displayed centroids or any real distance metric.
- Metrics are internally consistent and framework-shaped (PSI banding, importance vector summing to 1),
  which makes them convincing but non-real.

**Framework alignment:** the page mirrors a real **supervised ML materiality pipeline** — topic modelling
(**LDA**, evaluated by c_v topic coherence), unsupervised segmentation (**K-means** on standardised ESG
features), a **tree-ensemble classifier** (Random Forest / Gradient Boosting / LightGBM, blended by
inverse-error weight) with **SHAP/gain feature importance**, and **PSI + concept-drift** monitoring for
MLOps. It faithfully depicts the *shape* of such a system without executing it.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A trained ML system that predicts topic-level materiality/anomaly for each covered entity from ESG,
financial and text features, with monitored drift and scheduled retraining. Scope: the coverage universe,
all ESG topics.

### 8.2 Conceptual approach
Two-stage: (a) **unsupervised** LDA over disclosure/news text for topic discovery and K-means/GMM
segmentation on standardised features; (b) **supervised** gradient-boosted ensemble predicting a
materiality label (analyst-labelled ground truth), with **SHAP** attributions. Benchmarks: MSCI/
Sustainalytics ML-augmented ESG scoring, Truvalue Labs (SASB-tagged NLP materiality), standard
scikit-learn/LightGBM MLOps.

### 8.3 Mathematical specification
```
LDA: p(topic|doc) via variational Bayes; coherence c_v per topic
Features x_i standardised: z = (x − μ_sector)/σ_sector
K-means: argmin_k ||z_i − μ_k||²  (k chosen by silhouette/elbow)
Classifier: ŷ_i = Σ_m w_m · f_m(x_i), w_m ∝ 1/logloss_m (softmax over CV logloss)
Materiality label: ŷ_i > τ (τ chosen to maximise F1 on validation)
Drift: PSI_j = Σ_b (a_b − e_b)·ln(a_b/e_b) ; retrain if PSI > 0.2 or concept drift AUC-drop > δ
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| LDA topics K | — | coherence maximisation over grid |
| Ensemble weights | w_m | CV log-loss on labelled set |
| Threshold τ | — | F1-optimal on validation |
| PSI trigger | 0.2 | industry MLOps standard |
| Labels | y | analyst materiality determinations / SASB tags |

### 8.4 Data requirements
Labelled materiality outcomes (analyst/SASB), disclosure and news text corpus, the ~18 ESG/financial
features already synthesised here (as real fields), and a feature store with lineage. Free: CDP, SBTi,
EU Taxonomy; vendor: Truvalue/RepRisk text feeds. Platform holds the feature schema and `reference_data`.

### 8.5 Validation & benchmarking plan
Nested CV for the ensemble (report real AUC/F1 with confidence intervals); topic-coherence and human
topic-labelling for LDA; silhouette for K; SHAP stability across folds; PSI/AUC-drop monitoring with a
champion-challenger retraining loop. Reconcile predicted materiality against analyst labels and against a
vendor ML-ESG score.

### 8.6 Limitations & model risk
ESG labels are scarce and subjective; models risk learning disclosure quantity, not real materiality.
Feature importances are unstable with correlated inputs. Conservative fallback: surface predictions with
calibrated probabilities and abstain (route to analyst) below a confidence floor rather than emitting a
hard label.
