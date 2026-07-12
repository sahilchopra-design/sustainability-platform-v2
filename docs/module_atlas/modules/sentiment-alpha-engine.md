# Sentiment Alpha Engine
**Module ID:** `sentiment-alpha-engine` · **Route:** `/sentiment-alpha-engine` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG sentiment as alpha factor in equity portfolios, extracting return-predictive signals from news sentiment, controversy data and stakeholder engagement analytics.

> **Business value:** Converts ESG news sentiment into a systematic alpha factor with demonstrable return-predictive power in equity portfolios.

**How an analyst works this module:**
- Ingest ESG news and social media text streams; run NLP sentiment classifier.
- Aggregate entity-level daily sentiment scores and compute 30-day exponential moving average.
- Construct long-short sentiment alpha factor and estimate IC via rolling backtest.
- Integrate sentiment factor into portfolio optimiser as tilt constraint or return forecast.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BACKTESTS`, `Badge`, `COMPANIES`, `FF5`, `FF5_FACTORS`, `IC_DECAY`, `IC_HORIZONS`, `RAW_COMPANIES`, `SECTORS`, `SIGNALS`, `Stat`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SIGNALS` | 7 | `name`, `desc`, `color`, `ic`, `sharpe`, `status` |
| `RAW_COMPANIES` | 26 | `name`, `sector`, `mcap` |
| `TABS` | 6 | `idx` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `i * 100 + si * 7;` |
| `score` | `Math.round(sr(seed) * 80 + 10);` |
| `ret1m` | `(sr(seed + 1) - 0.45) * 0.08;` |
| `ret3m` | `(sr(seed + 2) - 0.44) * 0.18;` |
| `ret6m` | `(sr(seed + 3) - 0.43) * 0.28;` |
| `benchRet` | `(sr(seed) - 0.48) * 0.06;` |
| `longRet` | `benchRet + (sr(seed + 1) - 0.42) * 0.04 + 0.003;` |
| `shortRet` | `-(benchRet + (sr(seed + 2) - 0.52) * 0.03);` |
| `lsRet` | `longRet + shortRet;` |
| `lsReturns` | `months.map(m => m.lsRet / 100);` |
| `mean` | `lsReturns.reduce((a, b) => a + b, 0) / lsReturns.length;` |
| `std` | `Math.sqrt(lsReturns.map(r => (r - mean) ** 2).reduce((a, b) => a + b, 0) / lsReturns.length);` |
| `ann` | `mean * 12;` |
| `annS` | `std * Math.sqrt(12);` |
| `sortS` | `downsideDevAnn > 0 ? (ann - targetReturn) / downsideDevAnn : 0;` |
| `maxDD` | `-Math.abs((sr(sigIdx * 3 + 1) * 0.12 + 0.05));` |
| `BACKTESTS` | `SIGNALS.map((sig, i) => buildBacktest(sig.id, i));` |
| `FF5_FACTORS` | `['Market (Rm-Rf)', 'Size (SMB)', 'Value (HML)', 'Profit (RMW)', 'Invest (CMA)'];` |
| `loadings` | `FF5_FACTORS.map((f, fi) => ({` |
| `alpha` | `+((sig.ic * 0.8 + sr(si * 3) * 0.04) * 100).toFixed(2);` |
| `alphaTstat` | `+((sr(si * 7 + 1) * 2 + 1.5)).toFixed(2);` |
| `sorted` | `useMemo(() => [...companies].sort((a, b) => b.signals[sig.id].score - a.signals[sig.id].score), [sig.id, companies] );` |
| `shortPort` | `sorted.slice(-10).reverse();` |
| `totalLongWt` | `longPort.reduce((s, c)  => s + c.signals[sig.id].score, 0);` |
| `totalShortWt` | `shortPort.reduce((s, c) => s + (100 - c.signals[sig.id].score), 0);` |
| `histogram` | `useMemo(() => { const bins = Array.from({ length: 10 }, (_, i) => ({ bin: `${i * 10}-${i * 10 + 10}`, count: 0 }));` |
| `corr` | `(sr(selSig * 20 + fi) - 0.3) * 0.8;` |
| `intensity` | `Math.min(1, Math.abs(v) / heatMax);` |
| `rollingAlpha` | `useMemo(() => { const months = Array.from({ length: 60 }, (_, i) => { const yr = 2020 + Math.floor((i + 12) / 12);` |
| `factorExposure` | `useMemo(() => { return FF5_FACTORS.map((factor, fi) => { const row = { factor };` |
| `overlap` | `+(sr(si * 13 + 3) * 50 + 20).toFixed(1);` |
| `icDecayData` | `useMemo(() => IC_HORIZONS.map((h, hi) => { const row = { horizon: `${h}d` };` |
| `icStability` | `useMemo(() => { return SIGNALS.map((sig, si) => { const monthly = Array.from({ length: 72 }, (_, i) => ({ month: i, ic: +((sr(si * 500 + i) - 0.45) * sig.ic * 4 + sig.ic * 0.8).toFixed(4) }));` |
| `tcImpact` | `useMemo(() => SIGNALS.map((sig, si) => { const grossSharpe = sig.sharpe;` |
| `icRatio` | `(row.icMean / row.icStd).toFixed(2);` |
| `div` | `Math.abs(row.icMean - row.icRankIC);` |
| `totalWt` | `Object.values(weights).reduce((s, v) => s + v, 0);` |
| `compositeScores` | `useMemo(() => { return companies .filter(c => { const avgEsg = Object.values(c.signals).reduce((s, sig) => s + sig.esgScore, 0) / SIGNALS.length;` |
| `avgEsg` | `Object.values(c.signals).reduce((s, sig) => s + sig.esgScore, 0) / SIGNALS.length;` |
| `shortList` | `compositeScores.slice(-8).reverse();` |

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

Portfolio-weighted average ESG sentiment score minus benchmark equivalent, producing the active sentiment factor exposure.

**Standards:** ['Bloomberg NLP', 'Refinitiv ESG News', 'Barra Factor Model']
**Reference documents:** Refinitiv Eikon ESG News Analytics; Bloomberg NLP Sentiment Scores; AQR Sentiment Alpha Research 2022; MSCI Barra Factor Model Handbook

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
| `sentiment-analysis` | engine:sentiment_analysis_engine, table:news |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

25 real named large-caps (`RAW_COMPANIES` — ExxonMobil, JPMorgan, Microsoft, Unilever, etc.) each get 6
synthetic factor-signal scores (`SIGNALS`: ESG Momentum, Controversy Reversal, Disclosure Quality,
Greenwashing Reversal, SBTi Initiator, Narrative Tone Shift), generated via `sr(s)=frac(sin(s+1)×10⁴)`. Each
signal also carries a **separately hardcoded** headline `ic` (information coefficient) and `sharpe` figure
in the static `SIGNALS` array, independent of the Monte-Carlo-style backtest built by `buildBacktest`:

```js
score      = round(sr(seed)×80 + 10)                         // 10–90
direction  = score>60 ? 'long' : score<35 ? 'short' : 'neutral'
ret1m/3m/6m = (sr(seed+n) − c) × scale                        // per-signal simulated forward returns
```

`buildBacktest(sigId, sigIdx)` independently simulates 72 months (2020–2025) of long/short/long-short
returns and compounds them into cumulative return paths, then computes standard portfolio statistics.

### 7.2 Parameterisation

| Signal | Static `ic` | Static `sharpe` | Status |
|---|---|---|---|
| SBTi Initiator | 0.165 | 1.34 | Active |
| ESG Momentum | 0.142 | 1.18 | Active |
| Disclosure Quality | 0.118 | 0.91 | Active |
| Narrative Tone Shift | 0.109 | 0.88 | Active |
| Controversy Reversal | 0.097 | 0.74 | Active |
| Greenwashing Reversal | 0.083 | 0.61 | **Paused** |

These headline IC/Sharpe figures are **fixed constants set once in the `SIGNALS` array**, not computed —
they are illustrative of what a real IC/Sharpe range for ESG-alpha factors looks like in published
literature (typical published ESG factor ICs range ~0.02–0.15), but are not derived from the page's own
`buildBacktest` simulation.

| Backtest return construction | Formula |
|---|---|
| Benchmark monthly return | `(sr(seed) − 0.48) × 0.06` → ≈ ±3% monthly |
| Long return | `benchRet + (sr(seed+1) − 0.42)×0.04 + 0.3%` → long book beats benchmark by a small positive skew |
| Short return | `−(benchRet + (sr(seed+2) − 0.52)×0.03)` → short book profits when benchmark falls |
| Long-short return | `longRet + shortRet` |

The `−0.42`/`−0.52` offset constants (rather than `−0.5`) bias the long book to a positive mean and the
short book to a slightly negative mean by construction — i.e. **the backtest is seeded to produce a
profitable long-short strategy for every signal**, not to test whether it is profitable.

### 7.3 Calculation walkthrough

1. For each of the 6 signals, 72 monthly returns are simulated and compounded: `longCum *= (1+longRet)`,
   similarly for `shortCum`, `lsCum`, `benchCum` — producing 4 parallel cumulative-return series.
2. **Risk statistics** computed directly from the simulated `lsReturns` series:
   ```js
   mean = Σ lsReturns / N;  std = sqrt(Σ(r-mean)² / N)
   ann  = mean × 12;         annS = std × √12                    // annualised return & vol
   sortS = neg.length ? std / (sqrt(mean(neg²)) × √12) : 0        // labelled "Sortino" but uses std, not mean, as numerator
   maxDD = −|sr(sigIdx×3+1)×0.12 + 0.05|                          // independently random, NOT derived from the cumulative path
   ```
   **Two issues worth flagging**: (a) `sortS` divides *total volatility* (`std`) by annualised downside
   deviation — the standard Sortino ratio divides *annualised excess return* (`ann − MAR`) by downside
   deviation, so this metric is mislabelled/miscalculated relative to its name; (b) `maxDD` is drawn from an
   independent `sr()` call rather than computed from the actual `lsCum` path minimum, so the displayed max
   drawdown is not guaranteed to be consistent with the cumulative return chart shown alongside it.
3. **Factor Overlay / FF5 loadings** (`FF5_FACTORS`: Market, SMB, HML, RMW, CMA) — per-signal factor
   loadings and an `alpha`/`alphaTstat` are computed as `sig.ic×0.8 + sr()×0.04` and
   `sr()×2+1.5` respectively — i.e. **alpha is partly derived from the static `ic` constant** (§7.2), giving
   a thin causal link between the headline table and the Fama-French decomposition, but the t-stat is purely
   random.
4. **Composite scoring / long-short portfolio construction** — `longPort`/`shortPort` are the top/bottom 10
   companies by a signal's `score`; portfolio weights are the raw scores (`totalLongWt`) and
   `100 − score` for shorts (`totalShortWt`) — an equal-ish, score-proportional weighting, not
   mean-variance optimised.

### 7.4 Worked example

ESG Momentum signal, one simulated month: `benchRet ≈ 1.2%`, `longRet ≈ benchRet + 0.9% + 0.3% = 2.4%`,
`shortRet ≈ −(benchRet + 0.4%) = −1.6%`, `lsRet = 2.4% − 1.6% = 0.8%`. Compounding 72 such months typically
produces a positive `lsCum` because of the systematic `−0.42`/`−0.52` bias in §7.2 — this is a designed
demo outcome, not a genuine backtested edge.

Sortino computation for a hypothetical signal: `std=1.8%`, downside deviation (annualised) `=4.5%` →
`sortS = 1.8/4.5 = 0.40` — note this number is **not** an excess-return-to-downside-risk ratio as the
Sortino name implies; a real Sortino using `ann=9.6%` would instead be `9.6/4.5=2.13`, a materially
different (and more standard) figure.

### 7.5 Companion analytics on the page

- **IC decay / IC stability tabs** — `icDecayData` across `IC_HORIZONS`, and 72-month rolling IC series per
  signal (`icStability`), both `sr()`-seeded independent of the backtest returns.
- **Transaction-cost impact** (`tcImpact`) — derives a "net Sharpe after costs" from `sig.sharpe` (the
  static constant), not from the simulated backtest's own computed Sharpe (`ann/annS`), so the two Sharpe
  figures shown on the page (static-table Sharpe vs. backtest-computed Sharpe) can diverge for the same
  signal.

### 7.6 Data provenance & limitations

- **All company signal scores, monthly returns, and factor loadings are synthetic**, generated by
  `sr(seed)=frac(sin(seed+1)×10⁴)`; company names/tickers/market caps are real-world illustrative anchors,
  not live market data.
- **The backtest is constructed to succeed**: the `−0.42`/`−0.52` mean offsets in the long/short return
  formulas guarantee a positive expected long-short return for every signal, so the "backtest" cannot fail
  or demonstrate a signal with negative alpha — a genuine backtesting tool must allow for signals that don't
  work.
- **The Sortino ratio formula is non-standard** (uses total std rather than mean/excess-return as the
  numerator) — see §7.3(a). `maxDD` is independently randomised rather than computed from the actual
  cumulative-return path — see §7.3(b).
- **Two disconnected sources of truth for Sharpe/IC** exist on the page: the static `SIGNALS[].ic`/`.sharpe`
  constants, and the live-computed `ann/annS` from `buildBacktest` — they are not reconciled.

**Framework alignment:** the signal taxonomy (ESG Momentum, Controversy Reversal, Disclosure Quality
Improvement, Greenwashing Reversal, SBTi-commitment early-mover, NLP-derived Narrative Tone) reflects
genuine, published categories of ESG/sentiment alpha research (AQR, MSCI Barra factor literature cited in
the guide) · Fama-French 5-factor model (Market, SMB, HML, RMW, CMA) is the correct, standard academic
factor set used for the attribution decomposition · Information Coefficient and annualised Sharpe/Sortino
are the correct standard quant metrics for factor evaluation, though as noted above the Sortino
implementation and the maxDD sourcing deviate from their standard definitions in this specific
implementation.

## 9 · Future Evolution

### 9.1 Evolution A — An honest backtest that can fail (analytics ladder: rung 1 → 3)

**What.** The module has a real backend (`sentiment_analysis_engine`, shared by 3 modules, with genuine credibility-weighting and exponential decay math) but its frontend backtest is constructed to succeed: §7.6 documents that the `−0.42`/`−0.52` mean offsets guarantee positive long-short returns for every signal, `maxDD` is randomised rather than computed from the cumulative path, the Sortino implementation is non-standard, and the headline IC/Sharpe figures are static constants never reconciled with `buildBacktest` output. Evolution A replaces the rigged simulation with a genuine event-study backtest over ingested sentiment history so a signal with no alpha shows no alpha.

**How.** (1) Persist `POST /process-batch` outputs into a `sentiment_signals_history` table (the engine already computes decayed, credibility-weighted scores — they are just not stored). (2) Compute IC as rank correlation between stored entity scores and subsequent realised returns (market data seeds from the EA-hybrid-v3 work provide the return side); derive Sharpe/Sortino/maxDD from the actual cumulative path, fixing the two §7.3 formula defects. (3) Delete the static `SIGNALS[].ic/.sharpe` constants — one source of truth, computed. (4) Report IC with confidence intervals so a 0.02 IC is visibly indistinguishable from noise.

**Prerequisites.** A real text feed for signal generation (GDELT is free/keyless and fits the existing ingester scaffold); the engine's seeded fallback path (`2654435761` hash) must be labelled or removed per platform anti-fabrication convention. **Acceptance:** a deliberately shuffled-label backtest produces IC ≈ 0 within CI; maxDD equals the drawdown of the plotted cumulative series.

### 9.2 Evolution B — Signal-desk analyst over the sentiment API (LLM tier 2)

**What.** The module already exposes a 10-route API (`/process-signal`, `/process-batch`, `/entity-score`, `/portfolio`, `/topic-trend`, `/module-feed`, plus four `/ref/*` config endpoints). Evolution B is a tool-calling analyst that operates it: "score this headline for Unilever," "what drove the portfolio sentiment dip in May," "show topic trend for greenwashing across my holdings" — each answered by calling the real endpoints and narrating returned scores, credibility weights, and decay factors. The LLM also becomes the classifier front-end: raw text in, structured signal (entity, polarity, confidence, source credibility) out, submitted to `/process-signal` for the deterministic weighting math.

**How.** Tool schemas from the module's OpenAPI spec (all read-only or compute-only); system prompt from this Atlas record with §5's weighting formula as grounding. The no-fabrication validator checks every IC/score in answers against tool outputs. The classifier path logs `(text, extracted signal, engine score)` triples into `llm_traces` — the Tier-4 flywheel's first sentiment corpus.

**Prerequisites (hard).** Evolution A's honest backtest first — an analyst narrating the current guaranteed-positive backtest would market fabricated alpha. **Acceptance:** every quantitative claim traces to a tool response; asking "what's this signal's true out-of-sample IC?" before sufficient history exists returns the coverage caveat, not a number.