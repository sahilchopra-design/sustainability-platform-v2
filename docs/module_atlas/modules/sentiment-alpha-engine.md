# Sentiment Alpha Engine
**Module ID:** `sentiment-alpha-engine` · **Route:** `/sentiment-alpha-engine` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG sentiment as alpha factor in equity portfolios, extracting return-predictive signals from news sentiment, controversy data and stakeholder engagement analytics.

> **Business value:** Converts ESG news sentiment into a systematic alpha factor with demonstrable return-predictive power in equity portfolios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BACKTESTS`, `Badge`, `COMPANIES`, `FF5`, `FF5_FACTORS`, `IC_DECAY`, `IC_HORIZONS`, `RAW_COMPANIES`, `SECTORS`, `SIGNALS`, `Stat`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `i * 100 + si * 7;` |
| `score` | `Math.round(sr(seed) * 80 + 10);` |
| `ret1m` | `(sr(seed + 1) - 0.45) * 0.08;` |
| `ret3m` | `(sr(seed + 2) - 0.44) * 0.18;` |
| `ret6m` | `(sr(seed + 3) - 0.43) * 0.28;` |
| `seed` | `sigIdx * 1000 + (yr - 2020) * 12 + m;` |
| `benchRet` | `(sr(seed) - 0.48) * 0.06;` |
| `longRet` | `benchRet + (sr(seed + 1) - 0.42) * 0.04 + 0.003;` |
| `shortRet` | `-(benchRet + (sr(seed + 2) - 0.52) * 0.03);` |
| `lsRet` | `longRet + shortRet;` |
| `lsReturns` | `months.map(m => m.lsRet / 100);` |
| `mean` | `lsReturns.reduce((a, b) => a + b, 0) / lsReturns.length;` |
| `std` | `Math.sqrt(lsReturns.map(r => (r - mean) ** 2).reduce((a, b) => a + b, 0) / lsReturns.length);` |
| `ann` | `mean * 12;` |
| `annS` | `std * Math.sqrt(12);` |
| `sortS` | `neg.length ? std / (Math.sqrt(neg.map(r => r ** 2).reduce((a, b) => a + b, 0) / neg.length) * Math.sqrt(12)) : 0;` |
| `maxDD` | `-Math.abs((sr(sigIdx * 3 + 1) * 0.12 + 0.05));` |
| `BACKTESTS` | `SIGNALS.map((sig, i) => buildBacktest(sig.id, i));` |

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
**Frontend seed datasets:** `FF5_FACTORS`, `IC_HORIZONS`, `RAW_COMPANIES`, `SECTORS`, `SIGNALS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Signal Universe | — | NLP pipeline | Companies with active daily ESG sentiment signals from news and social media. |
| Factor IC | — | Backtest | Information coefficient of sentiment alpha factor versus 1-month forward equity returns. |
| Alpha Capture | — | Live portfolio | Annualised excess return attributable to sentiment alpha factor tilt in live portfolio. |
- **News and social media text feeds, equity return data, portfolio weights** → NLP classification, factor construction, IC backtesting → **Sentiment factor exposures, alpha attribution, portfolio overlays**

## 5 · Intermediate Transformation Logic
**Methodology:** Sentiment Alpha Factor
**Headline formula:** `(Σ Sentiment Score_i × w_i) – Benchmark Sentiment Score`
**Standards:** ['Bloomberg NLP', 'Refinitiv ESG News', 'Barra Factor Model']

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
| `sentiment-analysis` | engine:sentiment_analysis_engine, table:news |