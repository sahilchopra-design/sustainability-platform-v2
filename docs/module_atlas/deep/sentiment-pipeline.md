## 7 · Methodology Deep Dive

### 7.1 What the module computes

This page documents an **NLP pipeline architecture** (8 tabs: Ingestion → Preprocessing/Vectorization →
Classification → Credibility Weighting & Decay → EWMA Aggregation → Velocity Alerts → Model Performance/
MLOps) rather than a financial-risk calculator. 60 synthetic signals (`SIGNALS`, seeded
`sr(s)=frac(sin(s+1)×10⁴)`) reference 8 fictional entities, 10 real source-type categories, and a fixed
20-headline pool; a static 5-model comparison table (`MODELS`) presents FinBERT/RoBERTa-ESG/VADER+Rules/
TextBlob/Custom LSTM with accuracy/precision/recall/F1/latency and a full 3×3 confusion matrix each.

```js
raw_score = (sr()×2) − 1                                     // −1..+1 raw sentiment
tier      = floor(sr()×5) + 1                                // 1–5 source credibility tier
daysAgo   = floor(sr()×61)                                    // 0–60 day recency window
```

### 7.2 Parameterisation — model performance table

| Model | Accuracy | Precision | Recall | F1 | Latency (ms) |
|---|---|---|---|---|---|
| FinBERT | 0.936 | 0.928 | 0.921 | 0.924 | 42 |
| RoBERTa-ESG | 0.918 | 0.911 | 0.903 | 0.907 | 67 |
| Custom LSTM | 0.891 | 0.884 | 0.876 | 0.880 | 178 |
| VADER+Rules | 0.814 | 0.798 | 0.823 | 0.810 | 4 |
| TextBlob | 0.762 | 0.741 | 0.755 | 0.748 | 2 |

**Cross-check against the FinBERT confusion matrix** `[[412,18,5],[22,387,14],[8,11,423]]`: summing all 9
cells gives N=1,300 classified items; the diagonal (correct classifications) sums to 412+387+423=1,222 →
**implied accuracy = 1,222/1,300 = 0.9400**, vs. the declared `accuracy: 0.936` — a ~0.4-point discrepancy
between the stated headline metric and the metric implied by the matrix shown beside it. This is a minor
internal-consistency gap worth flagging (the two numbers were evidently authored independently rather than
one derived from the other), though both are directionally in the same "very high accuracy" range typical
of published FinBERT benchmarks (~92–97% on financial-text sentiment tasks).

The relative ranking (FinBERT > RoBERTa-ESG > Custom LSTM > VADER+Rules > TextBlob, with latency inversely
related to accuracy) is a realistic reflection of the actual trade-off in NLP sentiment tooling: transformer
models (FinBERT/RoBERTa) are slower but more accurate than lexicon-based tools (VADER, TextBlob), and a
custom LSTM sits in between — directionally correct even though the specific decimal figures are
platform-authored illustrative constants, not measured on a real held-out test set in this codebase.

### 7.3 Calculation walkthrough

1. **Signal Ingestion** — 60 raw signals, each with a `raw_score` in [−1,+1], a `tier` (1–5), and
   `daysAgo` recency.
2. **Credibility Weighting & Decay tab**: combines `tier` into a credibility weight and applies a
   recency-decay function over `daysAgo` — consistent with the platform-standard "tier × decay" pattern used
   in the backend `sentiment_analysis_engine.py`'s documented pipeline (`WEIGHT` then `DECAY` stages).
3. **EWMA Aggregation tab**: computes an exponentially-weighted moving average of scores over time —
   `compositeByEntity` (per the JSON `computed` inventory) does
   `weighted = sigs.length ? sigs.reduce((acc,s) => ..., 0)/... : 0` — an entity-level weighted composite
   guarded for the empty-signal case.
4. **Model Performance & MLOps tab**: renders the static `MODELS` table plus calibration curves
   (`calibData`, predicted-vs-actual bucket pairs) and a misclassification sample table — all illustrative
   pre-computed constants, not live model-serving telemetry.
5. **TF-IDF terms** (`tfidfTerms`): a fixed 20-term list (emission, target, carbon, net_zero, climate,
   governance, disclosure, scope3, renewable, diversity, biodiversity, water, supply_chain, taxonomy, tcfd,
   sbti, board, audit, compliance, transition) with descending synthetic weights
   `0.95 − i×0.03 + sr()×0.05` — an illustrative term-importance ranking, not computed from an actual TF-IDF
   fit over a corpus.

### 7.4 Worked example

FinBERT confusion matrix accuracy check (from §7.2): `N=1,300`, correct=1,222, **implied accuracy = 94.0%**
vs. the table's declared 93.6% — a useful sanity check demonstrating that the confusion matrix and the
summary metrics in this module are independently authored constants rather than one being derived from the
other.

TF-IDF term "emission" (i=0): `weight = 0.95 − 0×0.03 + sr(0)×0.05` ≈ 0.95–1.00 (top-ranked term);
"compliance" (i=18): `weight = 0.95 − 0.54 + sr(18×7)×0.05` ≈ 0.41–0.46 (near bottom of the fixed
importance ordering).

### 7.5 Companion analytics on the page

- **Velocity Alerts tab** — flags entities/topics with rapidly changing sentiment velocity, consistent with
  the backend engine's documented `VELOCITY` pipeline stage (EWMA-smoothed velocity + acceleration).
- **Scatter/PCA-style visualisation** (`scatterData`, 100 synthetic points across pillar categories) —
  illustrative embedding-space visualisation, not an actual dimensionality-reduction output.
- **Feature importance** (`featureImportance`, 15 named ESG-relevant features: emission_reduction,
  net_zero_commit, board_independence, scope3_disclosure, greenwashing_flag, etc.) — a plausible feature
  list for an ESG-sentiment classifier, presented as static illustrative weights.

### 7.6 Data provenance & limitations

- **All 60 signals, entity names, and article headlines are synthetic**; the 8 entity names
  ("EnergyMega Corp," "TechVerde Ltd," etc.) are fictional, unlike sibling modules that use real company
  names.
- **The 5-model performance comparison is a static illustrative table**, not the result of an actual model
  training/evaluation run in this codebase — no training data, no held-out test set, and no inference code
  path exists here; the confusion-matrix/accuracy discrepancy noted in §7.2 is direct evidence the numbers
  were hand-set rather than computed from one source of truth.
- TF-IDF term weights and feature importances are hand-set descending sequences, not fit from an actual
  corpus or trained classifier.
- This module is best read as an **architecture and MLOps-dashboard demonstration** (what a production
  sentiment pipeline's monitoring surface would look like) rather than a live analytics engine — it is the
  most "meta" of the three sentiment modules (alongside `sentiment-analysis` and `sentiment-alpha-engine`),
  documenting pipeline stages and model governance rather than computing entity-level investment signals.

**Framework alignment:** FinBERT / RoBERTa / VADER / TextBlob are all real, standard NLP sentiment tools —
their relative accuracy/latency trade-off is realistically represented · the pipeline stage taxonomy
(Ingest → Classify → Weight → Decay → Aggregate → Velocity → Alert) matches verbatim the documented
architecture in `backend/services/sentiment_analysis_engine.py`'s docstring, indicating this frontend page
was designed as the intended UI for that backend pipeline even though no live API calls are wired
(`trace_labels` for this module should be checked against the route file to confirm wiring status).
