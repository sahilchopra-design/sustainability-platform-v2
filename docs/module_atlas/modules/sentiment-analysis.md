# Sentiment Analysis
**Module ID:** `sentiment-analysis` · **Route:** `/sentiment-analysis` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG news and social media sentiment analytics scoring companies on controversy exposure, media tone and stakeholder perception across environmental, social and governance themes.

> **Business value:** Delivers entity-level ESG sentiment intelligence from news and social media to support controversy monitoring and investment decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARTICLES`, `Badge`, `COMPANIES`, `COMPANY_NAMES`, `Card`, `ENTITIES_NER`, `ENTITY_TYPES`, `HEADLINE_POOL`, `Kpi`, `PIE_COLORS`, `SECTORS`, `SOURCES_DATA`, `SectionLabel`, `TABS`, `TOPICS`, `TOPIC_NAMES`, `TOPIC_TERM_POOL`, `TabAlphaFactory`, `TabDashboard`, `TabDataSources`, `TabEWMA`, `TabFinBERT`, `TabNER`, `TabSourceIntelligence`, `TabTopicModeling`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `name` | `COMPANY_NAMES[i] \|\| `Company ${i + 1}`;` |
| `eScore` | `Math.round(20 + sr(i * 7) * 70);` |
| `sScore` | `Math.round(20 + sr(i * 11) * 70);` |
| `gScore` | `Math.round(30 + sr(i * 13) * 60);` |
| `raw` | `sr(i * 3);` |
| `rawNeu` | `sr(i * 5);` |
| `finbert_pos` | `parseFloat((raw * 0.7).toFixed(3));` |
| `finbert_neg` | `parseFloat(((1 - raw) * 0.4).toFixed(3));` |
| `finbert_neu` | `parseFloat(Math.max(0, 1 - finbert_pos - finbert_neg).toFixed(3));` |
| `momentumRaw` | `sr(i * 23);` |
| `controversies` | `Math.round(sr(i * 29) * 8);` |
| `volume` | `Math.round(50 + sr(i * 31) * 950);` |
| `priceCorr` | `Math.round(-50 + sr(i * 37) * 100);` |
| `trend` | `sr(i * 41) > 0.45 ? 'Improving' : 'Declining';` |
| `company` | `COMPANIES[Math.floor(sr(i * 7) * 200)];` |
| `headlineBase` | `HEADLINE_POOL[Math.floor(sr(i * 11) * HEADLINE_POOL.length)];` |
| `sourceTier` | `Math.ceil(sr(i * 13) * 5);` |
| `sentRaw` | `sr(i * 17);` |

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
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `news` *(shared)*, `services` *(shared)*
**Frontend seed datasets:** `COMPANY_NAMES`, `ENTITY_TYPES`, `HEADLINE_POOL`, `PIE_COLORS`, `SECTORS`, `SOURCES_DATA`, `TABS`, `TOPIC_NAMES`, `TOPIC_TERM_POOL`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Entities Monitored | — | NLP pipeline | Companies with active daily sentiment monitoring across ESG themes. |
| Avg Sentiment Score | — | NLP engine | Portfolio-weighted mean composite ESG sentiment score in current reporting month. |
| Controversy Alerts | — | Alert engine | Companies with composite sentiment below 40 or negative momentum over trailing 7 days. |
- **News feeds, social media APIs, entity name registry** → NLP classification, pillar scoring, composite aggregation → **Sentiment heatmaps, controversy alerts, trend charts**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sentiment/ref/alert-config** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sentiment_thresholds', 'velocity_thresholds', 'compound_condition'], 'n_keys': 3}`

**GET /api/v1/sentiment/ref/config** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['stakeholder_groups', 'stakeholder_weights', 'source_credibility_tiers', 'signal_decay_half_lives', 'regime_thresholds', 'esg_topic_keywords'], 'n_keys': 6}`

**GET /api/v1/sentiment/ref/module-connections** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['inbound', 'outbound'], 'n_keys': 2}`

**GET /api/v1/sentiment/ref/sources** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 20, 'item0_keys': ['name', 'type', 'tier', 'frequency']}`

**POST /api/v1/sentiment/entity-score** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['entity_id', 'lookback_days', 'as_of_date', 'composite_score', 'composite_confidence', 'signal_count', 'source_diversity', 'stakeholder_scores', 'esg_scores', 'velocity', 'alert'], 'n_keys': 1`

## 5 · Intermediate Transformation Logic
**Methodology:** Composite Sentiment Score
**Headline formula:** `(E_sentiment × 0.4) + (S_sentiment × 0.35) + (G_sentiment × 0.25)`
**Standards:** ['RepRisk', 'Refinitiv', 'MSCI ESG']

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
| `sentiment-pipeline` | engine:sentiment_analysis_engine, table:news |
| `sentiment-alpha-engine` | engine:sentiment_analysis_engine, table:news |