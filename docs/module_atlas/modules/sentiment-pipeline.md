# Sentiment Pipeline
**Module ID:** `sentiment-pipeline` · **Route:** `/sentiment-pipeline` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
NLP pipeline for ESG sentiment extraction encompassing ingestion, entity recognition, topic classification, polarity scoring and structured output for downstream consumption.

> **Business value:** Provides the NLP backbone for ESG sentiment extraction, converting unstructured text into structured sentiment signals at scale.

**How an analyst works this module:**
- Ingest raw text from RSS feeds, APIs and web scrapers into document queue.
- Run named entity recognition (NER) to identify and resolve company mentions to LEI.
- Classify document topics against ESG taxonomy (E/S/G sub-themes).
- Score polarity per topic-entity pair and persist structured output to analytics layer.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `ALERT_ACTIONS`, `Badge`, `COPULA_PAIRS`, `DECAY_TYPES`, `ENTITY_NAMES`, `FM_COMPANIES`, `FM_FACTORS`, `FM_FACTOR_COLORS`, `FM_FACTOR_DESCS`, `FM_MONTHS`, `GRANGER_PAIRS`, `HEADLINES`, `KpiCard`, `LAGS`, `MODELS`, `MODELS_RAW`, `PILLARS`, `PIPELINE_STEPS`, `RETRAINING_LOG`, `SIGNALS`, `SOURCES`, `STRESS_SCENARIOS`, `SectionTitle`, `TABS`, `TIER_WEIGHTS`, `TabAlerts`, `TabClassification`, `TabEWMA`, `TabFactorAttribution`, `TabGrangerVAR`, `TabMLOps`, `TabPipelineArchitecture`, `TabPreprocessing`, `TabSignalIngestion`, `TabTailRiskCopula`, `TabWeightingDecay`, `Tag`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MODELS_RAW` | 5 | `latency`, `training_date`, `confusionMatrix` |
| `DECAY_TYPES` | 6 | `halfLife` |
| `RETRAINING_LOG` | 10 | `model`, `version`, `trigger`, `before_acc`, `after_acc`, `delta` |
| `PIPELINE_STEPS` | 8 | `desc`, `latency`, `throughput`, `errorRate`, `health`, `config`, `sampleIn`, `sampleOut` |
| `STAKEHOLDERS` | 8 | `weight` |
| `GRANGER_PAIRS` | 8 | `hypothesis_fwd`, `hypothesis_rev` |
| `STRESS_SCENARIOS` | 3 | `tag`, `color` |
| `TABS` | 11 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `total` | `cm.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0);` |
| `rowSum` | `cm[i].reduce((a, b) => a + b, 0);` |
| `colSum` | `cm.reduce((a, row) => a + row[i], 0);` |
| `accuracy` | `total > 0 ? correct / total : 0;` |
| `precision` | `precisions.reduce((a, b) => a + b, 0) / n;` |
| `recall` | `recalls.reduce((a, b) => a + b, 0) / n;` |
| `MODELS` | `MODELS_RAW.map(m => ({ ...m, ...computeMetricsFromCM(m.confusionMatrix) }));` |
| `score` | `-(0.3 + sr(i * 7) * 0.7);` |
| `avgLatency` | `parseFloat((PIPELINE_STEPS.reduce((a, s) => a + s.latency, 0) / PIPELINE_STEPS.length).toFixed(1));` |
| `avgError` | `parseFloat((PIPELINE_STEPS.reduce((a, s) => a + s.errorRate, 0) / PIPELINE_STEPS.length).toFixed(2));` |
| `sourceStats` | `useMemo(() => SOURCES.map(src => ({` |
| `tierDist` | `useMemo(() => [1,2,3,4,5].map(t => ({` |
| `lagHist` | `useMemo(() => Array.from({ length: 10 }, (_, i) => ({ lag: `${i*6}–${(i+1)*6}d`,` |
| `tfidfTerms` | `useMemo(() => [ 'emission', 'target', 'carbon', 'net_zero', 'climate', 'governance', 'disclosure', 'scope3', 'renewable', 'diversity', 'biodiversity', 'water', 'supply_chain', 'taxonomy', 'tcfd', 'sbti', 'board', 'audit', 'compliance', 'transition' ].map((t, i) => ({ term: t, weight: parseFloat((0.95 - i * 0.03 + sr(i * 7) * 0.05).toFixed` |
| `scatterData` | `useMemo(() => Array.from({ length: 100 }, (_, i) => ({ x: parseFloat(((sr(i * 7) * 8) - 4).toFixed(2)), y: parseFloat(((sr(i * 11) * 6) - 3).toFixed(2)), pillar: PILLARS[Math.floor(sr(i * 13) * 3)], entity: ENTITY_NAMES[Math.floor(sr(i * 17) * 8)] })), []);` |
| `featureImportance` | `useMemo(() => [ 'emission_reduction', 'net_zero_commit', 'board_independence', 'scope3_disclosure', 'greenwashing_flag', 'diversity_target', 'taxonomy_align', 'water_intensity', 'supply_chain_audit', 'carbon_price', 'renewable_pct', 'sbti_validated', 'controversy_flag', 'tcfd_align', 'gri_report' ].map((f, i) => ({ feature: f, importance:` |
| `calibData` | `useMemo(() => Array.from({ length: 10 }, (_, i) => ({ predicted: parseFloat(((i + 1) * 0.1 - 0.05).toFixed(2)), actual: parseFloat(((i + 1) * 0.1 - 0.05 + (sr(i * 7 + selectedModel * 11) - 0.5) * 0.08).toFixed(3)) })), [selectedModel]);` |
| `misclassified` | `useMemo(() => Array.from({ length: 20 }, (_, i) => { const trueIdx = Math.floor(sr(i * 7) * 3);` |
| `predIdx` | `Math.floor(sr(i * 11) * 3);` |
| `compositeByEntity` | `useMemo(() => ENTITY_NAMES.map(e => {` |
| `weighted` | `sigs.length ? sigs.reduce((acc, s) => {` |
| `row` | `{ day: d + 1 };` |
| `seed` | `entityIdx * 10000 + pi * 1000 + d;` |
| `rawScore` | `parseFloat(((sr(seed) * 2) - 1).toFixed(3));` |
| `prev` | `i > 0 ? acc[i - 1] : null;` |
| `stakeholderContrib` | `useMemo(() => STAKEHOLDERS.map((sk, i) => {` |
| `sigCount` | `Math.round(4 + sr(entityIdx * 100 + i) * 12);` |
| `last` | `ewmaData[ewmaData.length - 1];` |
| `alertCounts` | `['Watch', 'Elevated', 'Critical', 'Extreme'].map(l => ({` |
| `timelineData` | `useMemo(() => Array.from({ length: 90 }, (_, d) => ({ day: d + 1, Watch: Math.round(2 + sr(d * 7) * 4), Elevated: Math.round(1 + sr(d * 11) * 3), Critical: Math.round(sr(d * 13) * 2), Extreme: Math.round(sr(d * 17) * 1.2) })), []);` |
| `entityAlertFreq` | `useMemo(() => ENTITY_NAMES.map(e => ({` |
| `sorted` | `useMemo(() => [...ALERTS].sort((a, b) => { if (sortCol === 'score') return a.score - b.score;` |
| `MONTHS` | `['Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25'];` |
| `accuracyDrift` | `useMemo(() => MONTHS.map((m, mi) => {` |
| `dataQuality` | `useMemo(() => Array.from({ length: 90 }, (_, d) => ({ day: d + 1, schema_violations: Math.round(sr(d * 7) * 8), oov_rate: parseFloat((2.5 + sr(d * 11) * 2).toFixed(2)), pos_ratio: parseFloat((0.32 + sr(d * 13) * 0.1).toFixed(3)), neu_ratio: parseFloat((0.45 + sr(d * 17) * 0.08).toFixed(3)), neg_ratio: parseFloat((0.23 + sr(d * 19) * 0.1).` |
| `latencyData` | `useMemo(() => Array.from({ length: 90 }, (_, d) => ({ day: d + 1, p50: Math.round(35 + sr(d * 7) * 10), p95: Math.round(85 + sr(d * 11) * 25), p99: Math.round(140 + sr(d * 13) * 40) })), []);` |
| `ksDrift` | `useMemo(() => Array.from({ length: 90 }, (_, d) => ({ day: d + 1, score_drift: parseFloat((0.04 + sr(d * 7) * 0.12).toFixed(4)), vocab_drift: parseFloat((0.02 + sr(d * 11) * 0.08).toFixed(4)), label_drift: parseFloat((0.03 + sr(d * 13) * 0.10).toFixed(4)) })), []);` |
| `fStat` | `parseFloat((1.2 + sr(seed) * 8.5).toFixed(3));` |
| `pVal` | `parseFloat(Math.max(0.001, Math.min(0.50, 1 - fStat / 20)).toFixed(4));` |
| `varCoeffs` | `useMemo(() => { const base = entityIdx * 200;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sentiment/process-signal` | `process_signal` | api/v1/routes/sentiment_analysis.py |
| POST | `/api/v1/sentiment/process-batch` | `process_batch` | api/v1/routes/sentiment_analysis.py |
| POST | `/api/v1/sentiment/entity-score` | `entity_score` | api/v1/routes/sentiment_analysis.py |
| POST | `/api/v1/sentiment/portfolio` | `portfolio_sentiment` | api/v1/routes/sentiment_analysis.py |
| POST | `/api/v1/sentiment/module-feed` | `generate_module_feed` | api/v1/routes/sentiment_analysis.py |
| POST | `/api/v1/sentiment/topic-trend` | `topic_trend` | api/v1/routes/sentiment_analysis.py |
| GET | `/api/v1/sentiment/ref/config` | `get_reference_data` | api/v1/routes/sentiment_analysis.py |
| GET | `/api/v1/sentiment/ref/sources` | `get_sources` | api/v1/routes/sentiment_analysis.py |
| GET | `/api/v1/sentiment/ref/module-connections` | `get_module_connections` | api/v1/routes/sentiment_analysis.py |
| GET | `/api/v1/sentiment/ref/alert-config` | `get_alert_config` | api/v1/routes/sentiment_analysis.py |

### 2.3 Engine `sentiment_analysis_engine` (services/sentiment_analysis_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SentimentAnalysisEngine.process_signal` | signal | Process a single sentiment signal through the full pipeline: classify → score → weight → decay → return enriched signal. |
| `SentimentAnalysisEngine.process_batch` | req | Process a batch of signals and return enriched signals + summary. |
| `SentimentAnalysisEngine.entity_score` | req | Compute entity-level composite sentiment score. In production this queries sentiment_signals table; here it generates a deterministic demo score from entity_id hash. |
| `SentimentAnalysisEngine.portfolio_sentiment` | req | Aggregate sentiment across a portfolio of entities. |
| `SentimentAnalysisEngine.generate_module_feed` | req | Generate an outbound sentiment feed for a specific downstream module. Each module receives a tailored payload: - ecl_calculator: PD adjustment factor - portfolio_analytics: heatmap data - dme_dmi_engine: materiality input signal - dme_alert_engine: alert triggers - pe_deal_pipeline: reputation score etc. |
| `SentimentAnalysisEngine.topic_trend` | req | Analyze sentiment trend for a specific topic across entities. |
| `SentimentAnalysisEngine.get_reference_data` |  |  |
| `SentimentAnalysisEngine.get_sources` |  |  |
| `SentimentAnalysisEngine.get_module_connections` |  |  |
| `SentimentAnalysisEngine.get_alert_config` |  |  |
| `SentimentAnalysisEngine._classify_stakeholder` | signal_type |  |
| `SentimentAnalysisEngine._classify_esg` | text, tags |  |
| `SentimentAnalysisEngine._get_source_tier` | source_name |  |
| `SentimentAnalysisEngine._signal_decay_category` | signal_type |  |
| `SentimentAnalysisEngine._feed_type_for_module` | module |  |

**Engine `sentiment_analysis_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `STAKEHOLDER_GROUPS` | `['investor', 'employee', 'customer', 'regulator', 'community', 'ngo', 'media', 'supplier']` |
| `STAKEHOLDER_WEIGHTS` | `{'investor': 0.2, 'regulator': 0.18, 'employee': 0.15, 'customer': 0.14, 'media': 0.12, 'ngo': 0.08, 'community': 0.07, 'supplier': 0.06}` |
| `SOURCE_CREDIBILITY_TIERS` | `{1: {'label': 'Authoritative', 'weight': 1.0, 'examples': ['SEC filings', 'regulatory decisions', 'audited reports']}, 2: {'label': 'High Quality', 'weight': 0.85, 'examples': ['Reuters', 'Bloomberg', 'FT', 'peer-reviewed papers']}, 3: {'label': 'Standard', 'weight': 0.65, 'examples': ['major newspa` |
| `DEFAULT_SOURCES` | `[{'name': 'SEC EDGAR', 'type': 'regulatory', 'tier': 1, 'frequency': 'daily'}, {'name': 'EU Official Journal', 'type': 'regulatory', 'tier': 1, 'frequency': 'daily'}, {'name': 'Company Annual Reports', 'type': 'financial', 'tier': 1, 'frequency': 'annual'}, {'name': 'Bloomberg News', 'type': 'news',` |
| `SIGNAL_STAKEHOLDER_MAP` | `{'sec_filing': 'regulator', 'earnings_call': 'investor', 'annual_report': 'investor', 'press_release': 'media', 'news_article': 'media', 'tweet': 'community', 'glassdoor_review': 'employee', 'customer_review': 'customer', 'ngo_report': 'ngo', 'academic_paper': 'community', 'regulatory_action': 'regu` |
| `ESG_TOPIC_KEYWORDS` | `{'E': {'topics': ['climate', 'carbon', 'emissions', 'pollution', 'biodiversity', 'deforestation', 'water', 'waste', 'energy', 'renewable', 'fossil', 'methane', 'environment', 'ecological', 'nature', 'ocean', 'soil', 'air quality', 'circular economy', 'recycling'], 'weight': 1.0}, 'S': {'topics': ['l` |
| `DECAY_HALF_LIVES` | `{'instant': 1, 'fast': 7, 'medium': 30, 'slow': 90, 'chronic': 365, 'permanent': 3650}` |
| `REGIME_THRESHOLDS` | `{'crisis': -2.0, 'deteriorating': -0.5, 'stable': 0.5, 'improving': 999}` |
| `MODULE_CONNECTIONS` | `{'inbound': [{'module': 'dme_nlp_pulse_engine', 'feed_type': 'score_input', 'description': 'NLP pulse scores with source credibility'}, {'module': 'dme_greenwashing_engine', 'feed_type': 'controversy_flag', 'description': 'Greenwashing divergence signals'}, {'module': 'gdelt_controversy', 'feed_type` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `news` *(shared)*, `services` *(shared)*
**Frontend seed datasets:** `ALERT_ACTIONS`, `CLASSES`, `COPULA_PAIRS`, `DECAY_COLORS`, `DECAY_TYPES`, `ENTITY_NAMES`, `FM_FACTORS`, `FM_FACTOR_COLORS`, `FM_MONTHS`, `GRANGER_PAIRS`, `HEADLINES`, `LAGS`, `LAMBDAS`, `MODELS_RAW`, `MODEL_COLORS`, `MONTHS`, `PILLARS`, `PIPELINE_STEPS`, `RETRAINING_LOG`, `SOURCES`, `STAKEHOLDERS`, `STRESS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Daily Documents | — | Ingestion log | Average number of news articles and social posts processed through the pipeline per day. |
| Entity Match Rate | — | NER engine | Share of processed documents with at least one successfully resolved entity mention. |
| Latency P95 | — | Pipeline monitor | 95th percentile end-to-end processing latency from document receipt to structured output. |
- **Raw text feeds, ESG taxonomy, LEI reference database** → NER, topic classification, polarity scoring, entity resolution → **Structured sentiment records, entity-topic scores, pipeline metrics**

## 5 · Intermediate Transformation Logic
**Methodology:** Pipeline Throughput
**Headline formula:** `Documents Processed ÷ Processing Time (hours)`

Rate of ESG document processing through the full NLP pipeline from ingestion to structured output.

**Standards:** ['Internal pipeline metrics', 'HuggingFace Transformers']
**Reference documents:** HuggingFace FinBERT Sentiment Model; spaCy NER Framework; GRI ESG Topic Taxonomy; TCFD Recommendation Themes

**Engine `sentiment_analysis_engine` — extracted transformation lines:**
```python
weighted_sentiment = signal.raw_sentiment * cred_weight * signal.confidence
age_days = (datetime.utcnow() - pub_dt.replace(tzinfo=None)).days
decay_factor = math.exp(-0.693 * age_days / half_life) if half_life > 0 else 1.0
decayed_sentiment = weighted_sentiment * decay_factor
val = ((seed * (i + 7) * 2654435761) % 2000 - 1000) / 1000  # -1 to +1
composite = round(composite / total_weight if total_weight else 0.0, 4)
velocity = round(((seed * 17) % 600 - 300) / 1000, 4)
acceleration = round(((seed * 23) % 400 - 200) / 1000, 4)
z = round(velocity / 0.15 if abs(velocity) > 0 else 0.0, 3)
n_sources = max(3, (seed % 15) + 3)
hhi = 1.0 / n_sources  # simplified
diversity = round(1 - hhi, 3)
signal_count = max(10, (seed % 200) + 10)
weights = req.weights or {eid: 1.0 / n for eid in req.entity_ids}
pd_mult = 1.0 + (-composite * 0.15)  # linear mapping
adj_pct = composite * 3.0  # ±3% valuation adjustment
rep_score = round((composite + 1) / 2 * 100, 1)  # 0-100 scale
day_seed = (seed + i * 7919) % 10000
val = ((day_seed % 2000) - 1000) / 1000
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).
**Shared engines (edits propagate!):** `sentiment_analysis_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `sentiment-analysis` | engine:sentiment_analysis_engine, table:news |
| `sentiment-alpha-engine` | engine:sentiment_analysis_engine, table:news |

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

## 9 · Future Evolution

### 9.1 Evolution A — From MLOps mockup to measured pipeline (analytics ladder: rung 1 → 3)

**What.** §7.6 is explicit: this page is an architecture demonstration — the 5-model comparison (FinBERT/RoBERTa-ESG/VADER/TextBlob/LSTM) is a hand-set table with no training or inference code path, and the deep-dive caught the tell: FinBERT's stated accuracy (0.936) disagrees with the accuracy implied by its own confusion matrix (1,222/1,300 = 0.940). The pipeline stage taxonomy, however, matches the real `sentiment_analysis_engine` docstring verbatim — the page was designed as that backend's UI but never wired. Evolution A makes the monitoring surface report measured numbers: run at least two real classifiers (VADER via NLTK is dependency-light; FinBERT via transformers where the venv allows) on an ingested corpus, evaluate on a labelled held-out set, and render metrics from one computed source of truth.

**How.** (1) Wire the 8 pipeline tabs to the live endpoints (`POST /process-batch`, `GET /ref/sources`, `GET /ref/config`) so throughput, queue depth, and stage counts are real. (2) A small labelled ESG-sentiment eval set (~500 items, curated from public FinBERT benchmark data) stored as `golden_qa`-style fixtures; accuracy/precision/recall/F1 and the confusion matrix all derive from one evaluation run — the §7.2 discrepancy becomes structurally impossible. (3) TF-IDF weights and feature importances computed from the actual corpus, replacing the hand-set descending sequences.

**Prerequisites.** The backend-deps constraint applies (fastapi==0.110.1 pin; transformers may need the dedicated venv noted in platform memory); labelled eval data curation. **Acceptance:** the rendered confusion matrix reproduces the headline accuracy exactly; re-running evaluation updates both together.

### 9.2 Evolution B — LLM as pipeline stage: NER-to-LEI resolution and classification triage (LLM tier 2)

**What.** The overview's stated workflow — "run NER to identify and resolve company mentions to LEI" — is unimplemented, and the platform now has the golden-source asset for it: the GLEIF-populated `entity_lei` table. Evolution B inserts an LLM stage into the pipeline: extract entity mentions from raw text, resolve to LEI candidates via the existing entity-resolution routes, and classify topic against the E/S/G sub-theme taxonomy — with the deterministic engine still doing all scoring math downstream via `POST /process-signal`.

**How.** The LLM emits structured JSON (mention, LEI candidates with confidence, topic tags); low-confidence resolutions route to a human-review queue rather than auto-committing, mirroring the entity-resolution module's pattern. Every processed document logs `(text, extraction, engine score)` to `llm_traces` — training data for the Tier-4 flywheel. The Model Performance tab gains a real row: the LLM extractor's precision/recall on the labelled set, benchmarked against the spaCy baseline the page already names.

**Prerequisites (hard).** Evolution A's eval harness first — an LLM stage without measured precision/recall would recreate the hand-set-metrics problem this page exemplifies. **Acceptance:** on the labelled set, LEI resolution precision is reported from an actual run; unresolvable mentions appear in the review queue, never as silent guesses.