# Sentiment Analysis
**Module ID:** `sentiment-analysis` · **Route:** `/sentiment-analysis` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG news and social media sentiment analytics scoring companies on controversy exposure, media tone and stakeholder perception across environmental, social and governance themes.

> **Business value:** Delivers entity-level ESG sentiment intelligence from news and social media to support controversy monitoring and investment decisions.

**How an analyst works this module:**
- Define entity universe and ESG keyword/topic taxonomy for classification.
- Ingest and process news articles and social media posts through NLP sentiment classifier.
- Aggregate daily entity scores by E/S/G theme and compute composite weighted score.
- Flag controversy spikes and deliver portfolio-level sentiment heatmaps.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARTICLES`, `Badge`, `COMPANIES`, `COMPANY_NAMES`, `Card`, `ENTITIES_NER`, `ENTITY_TYPES`, `HEADLINE_POOL`, `Kpi`, `PIE_COLORS`, `SECTORS`, `SOURCES_DATA`, `SectionLabel`, `TABS`, `TOPICS`, `TOPIC_NAMES`, `TOPIC_TERM_POOL`, `TabAlphaFactory`, `TabDashboard`, `TabDataSources`, `TabEWMA`, `TabFinBERT`, `TabNER`, `TabSourceIntelligence`, `TabTopicModeling`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SOURCES_DATA` | 15 | `tier`, `articlesMonth`, `bias`, `credWeight`, `avgSentiment` |

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
| `score` | `sentiment === 'Positive' ? Math.round(55 + sr(i * 19) * 45) : sentiment === 'Neutral' ? Math.round(40 + sr(i * 21) * 20) : Math.round(5 + sr(i * 23) * 40);` |
| `pillar` | `['E', 'S', 'G'][Math.floor(sr(i * 29) * 3)];` |
| `day` | `String(Math.ceil(sr(i * 31) * 28)).padStart(2, '0');` |
| `month` | `String(Math.ceil(sr(i * 37) * 3)).padStart(2, '0');` |
| `type` | `ENTITY_TYPES[Math.floor(sr(i * 7) * 7)];` |
| `firstYear` | `2022 + Math.floor(sr(i * 37) * 4);` |
| `firstMonth` | `String(Math.ceil(sr(i * 41) * 12)).padStart(2, '0');` |
| `pct` | `Math.max(0, Math.min(100, v)) / 100;` |
| `avgESG` | `Math.round(COMPANIES.reduce((a, c) => a + c.overall, 0) / Math.max(1, COMPANIES.length));` |
| `controversyIdx` | `parseFloat((COMPANIES.reduce((a, c) => a + c.controversies, 0) / Math.max(1, COMPANIES.length)).toFixed(1));` |
| `sectorHeatmap` | `SECTORS.map(s => {` |
| `controversyAlerts` | `[...COMPANIES].sort((a, b) => b.controversies - a.controversies).slice(0, 10);` |
| `trendingBubbles` | `TOPIC_NAMES.slice(0, 12).map((t, i) => ({` |
| `pos` | `article.confidence * article.finbert_pos \|\| article.confidence * (article.sentiment === 'Positive' ? 0.72 : 0.18);` |
| `neg` | `article.confidence * (article.sentiment === 'Negative' ? 0.71 : 0.12);` |
| `neu` | `Math.max(0, 1 - pos - neg);` |
| `sortedTopics` | `useMemo(() => [...TOPICS].sort((a, b) => b[sortBy] - a[sortBy]), [sortBy]);` |
| `similarityMatrix` | `useMemo(() => TOPICS.slice(0, 8).map((t, i) =>` |
| `driftData` | `TOPICS.slice(0, 10).map(t => ({` |
| `typeCounts` | `ENTITY_TYPES.map(t => ({ type: t, count: ENTITIES_NER.filter(e => e.type === t).length }));` |
| `topCoEnts` | `ENTITIES_NER.slice(0, 15).map(e => e.text.slice(0, 15));` |
| `weightedAvg` | `SOURCES_DATA.reduce((a, s) => a + s.avgSentiment * s.credWeight, 0) / Math.max(0.01, SOURCES_DATA.reduce((a, s) => a + s.credWeight, 0));` |

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
Output: `{'type': 'object', 'keys': ['entity_id', 'lookback_days', 'as_of_date', 'composite_score', 'composite_confidence', 'signal_count', 'source_diversity', 'stakeholder_scores', 'esg_scores', 'velocity', 'alert'], 'n_keys': 11}`

**POST /api/v1/sentiment/module-feed** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sentiment/portfolio** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sentiment/process-batch** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Composite Sentiment Score
**Headline formula:** `(E_sentiment × 0.4) + (S_sentiment × 0.35) + (G_sentiment × 0.25)`

Pillar-weighted average of ESG-themed sentiment scores derived from NLP analysis of news and social media.

**Standards:** ['RepRisk', 'Refinitiv', 'MSCI ESG']
**Reference documents:** RepRisk ESG Risk Platform Methodology; Refinitiv ESG News Analytics Technical Guide; MSCI ESG Controversies Methodology 2023; GRI 2-29 Stakeholder Engagement

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
| `sentiment-pipeline` | engine:sentiment_analysis_engine, table:news |
| `sentiment-alpha-engine` | engine:sentiment_analysis_engine, table:news |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The MODULE_GUIDES formula states
> `Composite Sentiment = (E_sentiment×0.4) + (S_sentiment×0.35) + (G_sentiment×0.25)` — a pillar-weighted
> average. **The code computes an unweighted mean**: `overall = round((eScore + sScore + gScore) / 3)`
> (i.e. implicitly 0.333/0.333/0.333, not 0.4/0.35/0.25). Everything else described below (FinBERT-style
> 3-class scoring, source-tier credibility weighting, momentum classification) is genuinely present in code.

### 7.1 What the module computes

200 real-named large-caps (`COMPANY_NAMES`, 10 per sector × 20 sectors sampled cyclically via `i%10`) each
get independent E/S/G pillar scores and a FinBERT-style 3-class sentiment distribution, all seeded via
`sr(s)=frac(sin(s+1)×10⁴)`. A separate pool of 100 synthetic news articles (`ARTICLES`) references these
companies with sentiment-tagged headlines drawn from a fixed 20-headline pool.

```js
eScore/sScore/gScore = round(20 + sr()×70) / round(20 + sr()×70) / round(30 + sr()×60)
overall               = round((eScore + sScore + gScore) / 3)          // unweighted — see mismatch flag
finbert_pos = raw × 0.7
finbert_neg = (1 − raw) × 0.4
finbert_neu = max(0, 1 − finbert_pos − finbert_neg)
```

### 7.2 Parameterisation

| Field | Range/formula | Provenance |
|---|---|---|
| `eScore`/`sScore` | 20–90 | Synthetic |
| `gScore` | 30–90 | Synthetic (narrower floor, matching real-world observation that governance scores skew higher/less dispersed than E or S) |
| `ic` (information coefficient) | `0.05 + sr()×0.25` → 0.05–0.30 | Synthetic; plausible range vs. published ESG-factor IC literature |
| `momentum` | `>0.65`→Accelerating, `>0.35`→Stable, else Decelerating | 3-tier threshold classification |
| `controversies` | `round(sr()×8)` → 0–8 | Synthetic |
| `priceCorr` | `round(-50+sr()×100)` → −50 to +50 | Synthetic correlation-style metric |
| Article `sourceTier` | `ceil(sr()×5)` → 1–5 | Synthetic tiering across 15 named real source types (SEC EDGAR, GDELT News, Bloomberg, Reuters, FT, NGO Reports, CDP Disclosures, UNFCCC, etc.) |
| Article `sentiment` | `sentRaw>0.55`→Positive (55/tier score 55–100), `>0.3`→Neutral (40–60), else Negative (5–45) | 3-class threshold, score ranges overlap slightly at the Neutral/Positive boundary (both can produce ~55–60) |

### 7.3 Calculation walkthrough

1. `COMPANIES` (200) generates independent E/S/G scores, a FinBERT-style positive/negative/neutral
   probability triple, an IC, momentum label, controversy count, media volume, and price correlation — all
   from independent `sr()` seeds per field, so (as with sibling modules) a company's `overall` sentiment and
   its `momentum`/`trend` labels are not causally linked.
2. `ARTICLES` (100) independently samples a company (`COMPANIES[floor(sr()×200)]`), a headline template, a
   source, and a 3-class sentiment + numeric score — **not derived from the referenced company's own
   `eScore`/`sScore`/`gScore`**, so an article about a company can show "Positive" sentiment even if that
   company's E/S/G `overall` score is low.
3. **Portfolio-level KPIs**: `avgESG = round(Σ overall / N)`, `controversyIdx = round(Σ controversies / N,
   1)` (both guarded via `Math.max(1,...)`), `sectorHeatmap` aggregates by `SECTORS`, `controversyAlerts`
   is the top-10 by `controversies` descending.
4. **Source Intelligence tab**: `weightedAvg = Σ(avgSentiment × credWeight) / Σ credWeight` — a genuine
   credibility-weighted aggregate sentiment across the 15 `SOURCES_DATA` rows, guarded at `max(0.01, ...)`.

### 7.4 Worked example

Company `i=15` ("Nvidia Corporation"): `eScore = round(20+sr(105)×70)`, illustrative draw `eScore=68`,
`sScore=54`, `gScore=79`.

| Guide formula (weighted) | Code formula (unweighted, actual) |
|---|---|
| `68×0.4 + 54×0.35 + 79×0.25 = 27.2+18.9+19.75 = 65.85 → 66` | `(68+54+79)/3 = 201/3 = 67` |

A 1-point difference in this illustrative case, but the gap widens whenever pillar scores diverge more —
e.g. `E=90, S=30, G=90`: weighted = `36+10.5+22.5=69`, unweighted = `70` — generally small but systematic,
since G is both the highest-floor pillar (30 vs 20) and (per the guide) intended to carry the *lowest*
weight (0.25) while code gives it equal weight (0.333).

### 7.5 Companion analytics on the page

- **Topic Modeling (LDA/BERTopic) tab** — a themed word-frequency/topic-similarity display over
  `TOPIC_NAMES`, illustrative NLP-pipeline output, not a live LDA/BERTopic model run.
- **Named Entity Recognition tab** — `ENTITY_TYPES` counts and a co-occurrence list, similarly illustrative.
- **EWMA Momentum & IC Decay tab** — presents exponential moving-average style momentum framing consistent
  with the platform's standard EWMA convention used in `sentiment-pipeline` and `sentiment-alpha-engine`.

### 7.6 Data provenance & limitations

- **All 200 companies and 100 articles are synthetic**, generated fresh per session via
  `sr(seed)=frac(sin(seed+1)×10⁴)`; company names are real large-caps used as illustrative labels, article
  headlines are drawn from a fixed 20-item pool, not real news.
- **Composite score formula does not match the guide's stated pillar weights** (§ mismatch flag) — a
  one-line fix (`eScore×0.4 + sScore×0.35 + gScore×0.25`) would align code to the documented methodology.
- Article sentiment is independent of the referenced company's own E/S/G scores — the article stream and
  the company sentiment profile are two disconnected synthetic sources, so cross-referencing "recent
  articles" against a company's "overall sentiment trend" on this page will not show genuine correlation.
- `priceCorr` and `ic` are presented as if derived from a real return series but are independent random
  draws with no underlying price data feeding them.

**Framework alignment:** RepRisk ESG Risk Platform methodology and Refinitiv ESG News Analytics — inform
the general architecture (entity-level sentiment aggregation, controversy flagging, source-tier
credibility weighting) — genuinely reflected in the `sourceTier`/`credWeight` mechanics · FinBERT — the
3-class positive/negative/neutral probability structure (`finbert_pos/neg/neu`) mirrors FinBERT's standard
output format, though the underlying scores are synthetic, not model inference · GRI 2-29 stakeholder
engagement — informs the multi-source (NGO, regulator, media, academic) source taxonomy.

## 9 · Future Evolution

### 9.1 Evolution A — Real news ingestion with reconciled composite scoring (analytics ladder: rung 1 → 3)

**What.** The backend (`sentiment_analysis_engine`, shared by 3 modules) genuinely implements credibility weighting and exponential decay, but the page runs on 200 `sr()`-synthetic companies and a 20-headline article pool, and carries a documented guide↔code mismatch: the guide specifies pillar weights 0.4/0.35/0.25 while the code computes an unweighted `(e+s+g)/3`. §7.6 adds that the article stream and company profiles are two disconnected synthetic sources, and `priceCorr`/`ic` are random draws posing as return-derived statistics. Evolution A makes the entity scores real: ingest an actual news feed and drive the page from the module's own six POST endpoints.

**How.** (1) One-line fix first: apply the documented pillar weights (or update the guide — pick one source of truth). (2) A GDELT ingester (free, keyless, already listed in the page's own `SOURCES_DATA` taxonomy) feeding `POST /process-batch`; persist outputs to a `sentiment_signals_history` table shared with `sentiment-alpha-engine`'s Evolution A. (3) Replace the synthetic company array with `GET /entity-score` responses so "recent articles" and "sentiment trend" finally correlate because they share one pipeline. (4) Drop `priceCorr`/`ic` from this page entirely (they belong to the alpha module) or compute them from stored history.

**Prerequisites.** Entity resolution from GDELT organisation names to platform entities (the populated `entity_lei` table is the join key); the engine's seeded fallback (`2654435761` hash) must be labelled as fallback in responses. **Acceptance:** a headline visible in the article feed moves the referenced entity's score through the documented decay math; composite score matches the guide formula exactly.

### 9.2 Evolution B — Controversy-monitoring analyst (LLM tier 2)

**What.** A tool-calling analyst for the controversy workflow the overview describes: "flag controversy spikes and deliver portfolio-level sentiment heatmaps." It answers "what happened to Company X this week?" by calling `POST /entity-score` and `POST /topic-trend`, summarising the underlying articles (real ones, post-Evolution-A), and classifying severity against the RepRisk-style taxonomy the module already mirrors. For portfolios, it calls `POST /portfolio` and narrates which holdings drive the aggregate move.

**How.** Tool schemas from the module's 10 OpenAPI routes (6 POST compute + 4 GET ref); system prompt from this Atlas record with the §5 weighting formula and source-tier table as grounding. Article summarisation quotes source and date; the no-fabrication validator checks every score against tool outputs. Alert drafting reuses `GET /ref/alert-config` thresholds rather than letting the LLM pick cutoffs.

**Prerequisites (hard).** Evolution A's real feed — summarising the current fixed 20-headline synthetic pool would manufacture news. **Acceptance:** every article referenced in an answer exists in the ingested corpus with a retrievable URL; entity scores quoted match `/entity-score` responses byte-for-byte.