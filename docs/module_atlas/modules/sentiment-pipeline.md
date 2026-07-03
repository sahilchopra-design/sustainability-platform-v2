# Sentiment Pipeline
**Module ID:** `sentiment-pipeline` · **Route:** `/sentiment-pipeline` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
NLP pipeline for ESG sentiment extraction encompassing ingestion, entity recognition, topic classification, polarity scoring and structured output for downstream consumption.

> **Business value:** Provides the NLP backbone for ESG sentiment extraction, converting unstructured text into structured sentiment signals at scale.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `ALERT_ACTIONS`, `Badge`, `COPULA_PAIRS`, `DECAY_TYPES`, `ENTITY_NAMES`, `FM_COMPANIES`, `FM_FACTORS`, `FM_FACTOR_COLORS`, `FM_FACTOR_DESCS`, `FM_MONTHS`, `GRANGER_PAIRS`, `HEADLINES`, `KpiCard`, `LAGS`, `MODELS`, `PILLARS`, `PIPELINE_STEPS`, `RETRAINING_LOG`, `SIGNALS`, `SOURCES`, `STRESS_SCENARIOS`, `SectionTitle`, `TABS`, `TIER_WEIGHTS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `score` | `-(0.3 + sr(i * 7) * 0.7);` |
| `avgLatency` | `parseFloat((PIPELINE_STEPS.reduce((a, s) => a + s.latency, 0) / PIPELINE_STEPS.length).toFixed(1));` |
| `avgError` | `parseFloat((PIPELINE_STEPS.reduce((a, s) => a + s.errorRate, 0) / PIPELINE_STEPS.length).toFixed(2));` |
| `sourceStats` | `useMemo(() => SOURCES.map(src => ({` |
| `tierDist` | `useMemo(() => [1,2,3,4,5].map(t => ({` |
| `trueIdx` | `Math.floor(sr(i * 7) * 3);` |
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
| `entityAlertFreq` | `useMemo(() => ENTITY_NAMES.map(e => ({` |

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
| `SentimentAnalysisEngine.process_signal` | signal | Process a single sentiment signal through the full pipeline: |
| `SentimentAnalysisEngine.process_batch` | req | Process a batch of signals and return enriched signals + summary. |
| `SentimentAnalysisEngine.entity_score` | req | Compute entity-level composite sentiment score. |
| `SentimentAnalysisEngine.portfolio_sentiment` | req | Aggregate sentiment across a portfolio of entities. |
| `SentimentAnalysisEngine.generate_module_feed` | req | Generate an outbound sentiment feed for a specific downstream module. |
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

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `news` *(shared)*, `services` *(shared)*
**Frontend seed datasets:** `ALERT_ACTIONS`, `CLASSES`, `COPULA_PAIRS`, `DECAY_COLORS`, `DECAY_TYPES`, `ENTITY_NAMES`, `FM_FACTORS`, `FM_FACTOR_COLORS`, `FM_MONTHS`, `GRANGER_PAIRS`, `HEADLINES`, `LAGS`, `LAMBDAS`, `MODELS`, `MODEL_COLORS`

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
**Standards:** ['Internal pipeline metrics', 'HuggingFace Transformers']

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
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).
**Shared engines (edits propagate!):** `sentiment_analysis_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `sentiment-analysis` | engine:sentiment_analysis_engine, table:news |
| `sentiment-alpha-engine` | engine:sentiment_analysis_engine, table:news |