# DME ML Materiality
**Module ID:** `dme-ml-materiality` · **Route:** `/dme-ml-materiality` · **Tier:** B (frontend-computed) · **EP code:** EP-U9 · **Sprint:** U-extended

## 1 · Overview
NLP-driven double materiality assessment using regulatory filings, news feeds, and stakeholder data to identify financially material and impact-material ESG topics. Applies TF-IDF and BERT sentence embeddings for topic clustering, then maps clusters to ESRS/ISSB topic taxonomy. Outputs a ranked materiality heatmap and audit-ready evidence log.

> **Business value:** Used by sustainability managers and CSRD reporting officers to systematically identify and evidence material topics, replacing manual stakeholder workshop processes with auditable ML-assisted outputs.

**How an analyst works this module:**
- Upload regulatory filings, news corpus, or connect live feed
- Select ESRS or ISSB topic taxonomy for mapping
- Run ML pipeline and review materiality heatmap
- Export evidence log and materiality assessment table for CSRD filing

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CLUSTERS`, `DRIFT_LOG`, `ENTITIES`, `FEATURES`, `KpiCard`, `LDA_TOPICS`, `MODELS`, `REGIONS`, `RETRAINING_LOG`, `SECTORS`, `Section`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `LDA_TOPICS` | 9 | `id`, `name`, `coherence`, `words` |
| `CLUSTERS` | 6 | `id`, `name`, `color`, `centroid`, `esg`, `ghg`, `disclosure`, `risk` |
| `MODELS` | 5 | `name`, `accuracy`, `precision`, `recall`, `f1`, `auc`, `weight` |
| `FEATURES` | 16 | `name`, `importance`, `category`, `type` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Overview','LDA Topics','K-Means Clusters','Classification','Anomaly Detection','Feature Importance','Threshold Opt.','Double Materiality','Ensemble Voting','Risk Trajectory','Sector Benchmarks','Transfer Learning','Mod` |
| `seeds` | `[hashStr(entity.id+'cluster'), hashStr(entity.sector+'k'+k)];` |
| `filteredEntities` | `useMemo(()=>sectorFilter==='All'?ENTITIES:ENTITIES.filter(e=>e.sector===sectorFilter),[sectorFilter]);  const entityAssignments = useMemo(()=>ENTITIES.map(e=>({...e,cluster:clusterAssign(e,clusterK)})),[clusterK]);` |
| `avgMat` | `members.reduce((s,e)=>s+e.ml_materiality,0)/n;` |
| `avgEsg` | `members.reduce((s,e)=>s+e.esg_score,0)/n;` |
| `sse` | `members.reduce((s,e)=>s+(e.ml_materiality-avgMat)**2,0);` |
| `ldaDocTopics` | `useMemo(()=>ENTITIES.map(e=>{` |
| `raw` | `LDA_TOPICS.map((_,ti)=>sr(h*7+ti*13));` |
| `sum` | `raw.reduce((a,b)=>a+b,0)\|\|1;` |
| `anomalyFlagged` | `useMemo(()=>ENTITIES.filter(e=>Math.abs(e.anomaly_score)>anomalyThreshold),[anomalyThreshold]);` |
| `predClass` | `noise>0.85?(trueClass+1)%3:trueClass;` |
| `thresholdCurve` | `useMemo(()=>Array.from({length:20},(_,i)=>{ const t = i*5;` |
| `precision` | `positives>0?tp/positives:1;` |
| `recall` | `(tp+fn)>0?tp/(tp+fn):0;` |
| `doubleMatTopics` | `useMemo(()=>LDA_TOPICS.flatMap((t,ti)=>Array.from({length:4},(_,j)=>{ const h = hashStr(t.name+j);` |
| `trend` | `sr(h*7+q)*20-10;` |
| `score` | `Math.max(0,Math.min(100,base+trend));` |
| `sectorBenchmarks` | `useMemo(()=>SECTORS.map(sec=>{` |
| `scores` | `[...members.map(e=>e.ml_materiality)].sort((a,b)=>a-b);` |
| `avg` | `scores.reduce((s,v)=>s+v,0)/n;` |
| `p25` | `scores[Math.floor(n*0.25)]\|\|0;` |
| `p75` | `scores[Math.floor(n*0.75)]\|\|0;` |
| `p95` | `scores[Math.floor(n*0.95)]\|\|0;` |
| `transferData` | `useMemo(()=>SECTORS.map((sec,si)=>{` |
| `ensembleVoting` | `useMemo(()=>ENTITIES.slice(0,10).map(e=>{` |
| `majority` | `[...votes].sort((a,b)=>votes.filter(v=>v===b).length-votes.filter(v=>v===a).length)[0];` |
| `contribs` | `FEATURES.slice(0,8).map((f,fi)=>({` |
| `fullEntityTable` | `useMemo(()=> [...ENTITIES].sort((a,b)=>b.ml_materiality-a.ml_materiality) ,[]);` |
| `silhouetteScores` | `useMemo(()=>entityAssignments.map(e=>{` |
| `sil` | `(b-a)/Math.max(0.0001,Math.max(a,b));` |
| `topicWordMatrix` | `useMemo(()=>LDA_TOPICS.map(t=>{` |
| `sectorAnomalyRates` | `useMemo(()=>SECTORS.map(sec=>{` |
| `flagged` | `members.filter(e=>Math.abs(e.anomaly_score)>anomalyThreshold).length;` |
| `disagreementQueue` | `useMemo(()=>{ return ENTITIES.map(e=>{ const h = hashStr(e.id+'disagree');` |
| `velocityData` | `useMemo(()=>ENTITIES.map(e=>{` |
| `rocCurve` | `useMemo(()=>Array.from({length:21},(_,i)=>{ const t = i/20;` |
| `tpr` | `Math.min(1,t+sr(h*7)*0.2+0.1);` |
| `fpr` | `Math.max(0,t-sr(h*11)*0.3+0.05);` |
| `psiHeatmap` | `useMemo(()=>FEATURES.slice(0,8).map(f=>({` |
| `avgMlScore` | `ENTITIES.length?+(ENTITIES.reduce((s,e)=>s+e.ml_materiality,0)/ENTITIES.length).toFixed(1):0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLUSTERS`, `FEATURES`, `LDA_TOPICS`, `MODELS`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Materiality Score | `α·fin_materiality + (1-α)·impact_materiality` | TF-IDF corpus + stakeholder survey | Topics scoring >60 are considered material for ESRS/ISSB disclosure; topics >80 warrant standalone section treatment. |
| Topic Coverage Rate | `ESRS_topics_identified / ESRS_topics_total × 100` | ESRS 1 Appendix A topic list | Measures completeness of the materiality scan against all 84 ESRS sub-topics; <70% signals gaps in data inputs. |
| Evidence Confidence | `n_sources_corroborating / n_sources_total` | Document corpus metadata | Low confidence (<0.4) topics should be reviewed manually before filing; high confidence (>0.8) can be disclosed as assessed. |
- **Regulatory filings (10-K, annual report PDFs) → text corpus** → TF-IDF vectorisation → BERT clustering → ESRS topic mapping → **Materiality score per ESRS sub-topic**

## 5 · Intermediate Transformation Logic
**Methodology:** TF-IDF + BERT Double Materiality
**Headline formula:** `score = α·financial_materiality + (1-α)·impact_materiality`

Financial materiality scores are derived from regulatory filing keyword frequency weighted by investor sentiment signals; impact materiality scores aggregate stakeholder survey responses and NGO/media controversy intensity. BERT sentence embeddings cluster semantically similar disclosures to resolve synonym fragmentation. The dual-axis heatmap plots each topic on financial significance (y) vs impact significance (x).

**Standards:** ['CSRD Article 29a', 'ESRS 1 IRO Assessment', 'ISSB S1 Materiality']
**Reference documents:** CSRD Article 29a – Double Materiality; ESRS 1 – General Requirements IRO Assessment; ISSB S1 – General Requirements for Sustainability-related Financial Disclosures

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Train the pipeline the page narrates (analytics ladder: rung 1 → 4, staged through 3)

**What.** The §7 flag is unambiguous: the page *presents* a full ML stack — LDA topics with coherences, K-means clusters, a 4-model ensemble with fixed AUCs, feature importances, PSI drift, retraining logs — but "none of it is trained or computed in the browser"; every model artifact is an authored constant or `sr()` draw. Evolution A replaces the ML narrative with a minimal *real* pipeline, run server-side, whose displayed metrics come from actual training runs.

**How.** Stage 1 (rung 3): `services/dme_ml_pipeline.py` running scikit-learn (already in the environment) — TF-IDF + LDA over a real filings corpus (public 10-K/sustainability-report set; the `esg-report-parser` ingestion path is the feeder), with *computed* coherence scores replacing the authored 0.69–0.88 values, and K-means with computed silhouettes replacing the seeded ones. Stage 2 (rung 4): train the classification ensemble on labeled materiality outcomes (SASB sector-material topics as weak labels to start), persist `ml_model_runs` (metrics, feature importances, version) and `ml_predictions` tables; the page's Model-Ops tabs (PSI, drift, retraining log) then display genuine run history. Every §8-convention model card ships with the run.

**Prerequisites (hard).** A real document corpus ingested first — no corpus, no model; labeled data strategy agreed (weak labels vs analyst annotations); honest deletion of the authored `MODELS`/`FEATURES` constants the moment real runs exist. **Acceptance:** the accuracy/AUC shown on the page equals the persisted metrics of a reproducible training run (seeded, versioned); retraining with new documents visibly changes coherences and importances.

### 9.2 Evolution B — LLM as the topic-mapping layer, model as the scorer (LLM tier 2)

**What.** The hardest part of the guide's pipeline — mapping discovered clusters to the ESRS/ISSB taxonomy and producing an "audit-ready evidence log" — is better served by an LLM than by the promised BERT mapping: a tool-calling assistant that takes Evolution A's real LDA topics (top words + exemplar passages), assigns each to ESRS sub-topics (the 84-topic list from ESRS 1 Appendix A, already in the refdata layer), and writes the evidence log entry citing the exemplar documents.

**How.** Tools: `get_lda_topics` and `get_cluster_exemplars` from Evolution A's pipeline endpoints, `lookup_esrs_topic` from refdata. The LLM's assignments are stored as *proposals* with confidence and quoted evidence, confirmed by an analyst before entering the materiality heatmap — the deterministic pipeline scores, the LLM labels, the human approves. The disagreement queue (currently a seeded UI mock) becomes real: cases where LLM taxonomy assignment conflicts with the classifier's cluster get flagged for review.

**Prerequisites (hard).** Evolution A stage 1 — mapping authored fake topics to ESRS would produce an evidence log citing documents nobody ingested, indefensible under CSRD assurance. **Acceptance:** every heatmap topic traces to a real cluster with ≥1 verbatim exemplar quote; on a golden corpus, LLM-assigned ESRS codes match a hand-labeled reference ≥90%, with mismatches queued rather than silently accepted.