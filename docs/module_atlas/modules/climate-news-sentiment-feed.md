# Climate News Sentiment Feed
**Module ID:** `climate-news-sentiment-feed` · **Route:** `/climate-news-sentiment-feed` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Applies real-time NLP analysis to climate-related news, regulatory announcements, and social media to generate sentiment scores and event-driven risk signals for portfolio monitoring.

> **Business value:** Delivers real-time climate sentiment intelligence to portfolio managers, risk officers, and analysts enabling early identification of reputational, regulatory, and market-moving climate events.

**How an analyst works this module:**
- Ingest news via RSS, API, and web scraping across climate, regulatory, and financial news sources
- Apply FinBERT and climate-domain NLP classifier to extract entity mentions and sentiment polarity
- Aggregate scores by entity, sector, topic (transition, physical, litigation, policy)
- Publish event-driven alerts when sentiment breaches configured thresholds

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `ENTITIES`, `HEADLINE_TEMPLATES`, `NEWS_ITEMS`, `PORTFOLIO_HOLDINGS`, `SOURCES`, `TOPICS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `topicIdx` | `Math.floor(sr(i * 7) * TOPICS.length);` |
| `sourceIdx` | `Math.floor(sr(i * 11) * SOURCES.length);` |
| `catIdx` | `Math.floor(sr(i * 13) * CATEGORIES.length);` |
| `tmplIdx` | `Math.floor(sr(i * 29) * HEADLINE_TEMPLATES.length);` |
| `rawSentiment` | `sr(i * 31) * 2 - 1; // -1 to +1` |
| `relevance` | `parseFloat((0.3 + sr(i * 37) * 0.7).toFixed(2));` |
| `reach` | `Math.round(1000 + sr(i * 41) * 49000);` |
| `portfolioImpact` | `parseFloat(((sr(i * 43) - 0.5) * 6).toFixed(2));` |
| `daysAgo` | `Math.floor(sr(i * 47) * 30);` |
| `totalWeight` | `NEWS_ITEMS.reduce((s, n) => s + n.reach * n.relevanceScore, 0);` |
| `weighted` | `NEWS_ITEMS.reduce((s, n) => s + n.sentiment * n.reach * n.relevanceScore, 0);` |
| `topicStats` | `useMemo(() => { return TOPICS.map(topic => { const items = NEWS_ITEMS.filter(n => n.topic === topic);` |
| `avgSentiment` | `items.reduce((s, n) => s + n.sentiment, 0) / items.length;` |
| `recentAvg` | `recent.length > 0 ? recent.reduce((s,n)=>s+n.sentiment,0)/recent.length : 0;` |
| `olderAvg` | `older.length > 0 ? older.reduce((s,n)=>s+n.sentiment,0)/older.length : 0;` |
| `momentum` | `parseFloat((recentAvg - olderAvg).toFixed(3));` |
| `variance` | `items.length > 1 ? items.reduce((s, n) => s + Math.pow(n.sentiment - mean, 2), 0) / (items.length - 1) : 0;` |
| `volatility` | `parseFloat(Math.sqrt(variance).toFixed(3));` |
| `avg` | `dayItems.length > 0 ? dayItems.reduce((s,n)=>s+n.sentiment,0)/dayItems.length : 0;` |
| `portfolioLinkage` | `useMemo(() => { return PORTFOLIO_HOLDINGS.map((holding, i) => { const items = NEWS_ITEMS.filter(n => n.entityMentions.includes(holding));` |
| `totalImpact` | `items.reduce((s,n)=>s+n.portfolioImpact,0);` |
| `estPnL` | `totalImpact * (1 + sr(i * 7) * 4);` |
| `sentimentHistogram` | `useMemo(() => { const bins = Array.from({ length: 10 }, (_, i) => ({ range: `${(-1 + i * 0.2).toFixed(1)}–${(-0.8 + i * 0.2).toFixed(1)}`, count: 0, }));` |
| `binIdx` | `Math.min(9, Math.floor((n.sentiment + 1) / 0.2));` |
| `pagedNews` | `filteredNews.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);` |
| `avgS` | `catItems.length>0 ? catItems.reduce((s,n)=>s+n.sentiment,0)/catItems.length : null;` |
| `correlation` | `parseFloat(((sr(i*79+3)-0.5)*1.8).toFixed(3));` |
| `avgReach` | `srcItems.length>0 ? srcItems.reduce((a,n)=>a+n.reach,0)/srcItems.length : 0;` |
| `avgRel` | `srcItems.length>0 ? srcItems.reduce((a,n)=>a+n.relevanceScore,0)/srcItems.length : 0;` |
| `wsi` | `totalWeight>0 ? items.reduce((s,n)=>s+n.sentiment*n.reach*n.relevanceScore,0)/totalWeight : 0;` |
| `totalReach` | `items.reduce((s,n)=>s+n.reach,0);` |
| `barH` | `Math.max(4, (dayItems.length/20)*maxH);` |
| `avgSent` | `items.length>0 ? items.reduce((a,n)=>a+n.sentiment,0)/items.length : 0;` |
| `val` | `(sr(seed)*2-1)*0.6;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `ENTITIES`, `HEADLINE_TEMPLATES`, `SOURCES`, `TOPICS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Articles Processed Daily | — | Internal NLP Pipeline | Volume of climate-relevant news articles ingested and scored per day across 200+ media sources. |
| Sentiment Signal Lag | — | System Benchmark | Median latency from article publication to sentiment score availability in the feed. |
- **News APIs, regulatory gazettes, social media streams, corporate press releases** → NLP classification, entity resolution, rolling sentiment aggregation → **Sentiment time series, entity signal dashboards, threshold-triggered alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** Sentiment Score
**Headline formula:** `SS = (Positive – Negative) / Total Articles × 100`

Net sentiment index ranging from –100 (fully negative) to +100 (fully positive) computed over a rolling 24-hour article window.

**Standards:** ['VADER Sentiment', 'FinBERT NLP Model']
**Reference documents:** Devlin et al. BERT 2018; Yang et al. FinBERT 2020; Hutto & Gilbert VADER 2014; TCFD Recommendations 2017

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *live NLP pipeline*:
> FinBERT + VADER sentiment models, 15,000+ articles/day ingested via RSS/API/scraping across
> 200+ sources, entity resolution, and `<2 min` signal latency. **None of that exists.** There
> is no NLP model, no ingestion, no live data (`engines: []`, `route_files: []`). The page holds
> **200 synthetic news items whose sentiment is drawn from the seeded PRNG** and then aggregated
> with genuinely correct index/momentum/volatility arithmetic. The analytics layer is real; the
> "sentiment" it consumes is random. Sections below document the code.

### 7.1 What the module computes

200 items are built once, outside the component:

```js
NEWS_ITEMS = Array.from({length:200}, (_, i) => {
  rawSentiment    = sr(i*31) * 2 - 1;                      // uniform on [-1, +1]
  relevance       = 0.3 + sr(i*37) * 0.7;                  // [0.30, 1.00]
  reach           = round(1000 + sr(i*41) * 49000);        // [1k, 50k]
  portfolioImpact = (sr(i*43) - 0.5) * 6;                  // [-3%, +3%]
  daysAgo         = floor(sr(i*47) * 30);                  // 0..29
  headline        = HEADLINE_TEMPLATES[tmplIdx].replace('{entity}',…).replace('{topic}',…);
  entityMentions  = [ENTITIES[e1], ENTITIES[e2], ENTITIES[e3]];
});
```

`sentiment` is thus a pure uniform draw — the headline text (a Mad-Libs template fill) has **no
causal link** to the sentiment number attached to it.

### 7.2 Aggregation formulas (these are real)

```js
// Reach- and relevance-weighted sentiment index
WSI = Σ(sentiment · reach · relevance) / Σ(reach · relevance)

// Per-topic statistics
avgSentiment = mean(sentiment | topic)
momentum     = mean(sentiment | daysAgo<7) − mean(sentiment | daysAgo≥7)
variance     = Σ(sentiment − mean)² / (n − 1)          // sample variance
volatility   = √variance
```

The weighting scheme (importance ∝ audience reach × topical relevance) is a legitimate
sentiment-index construction; the sample-variance `n−1` denominator and the recent-minus-older
momentum are correct.

### 7.3 Parameterisation & provenance

| Field | Range / rule | Provenance |
|---|---|---|
| `sentiment` | `sr(i*31)·2 − 1` → `[−1, +1]` | Synthetic PRNG (not FinBERT) |
| `relevanceScore` | `0.3 + sr(i*37)·0.7` | Synthetic |
| `reach` | `1000 + sr(i*41)·49000` | Synthetic proxy for audience size |
| `portfolioImpact` | `(sr(i*43) − 0.5)·6` | Synthetic %; **not derived from prices** |
| `correlation` (ρ) | `(sr(i*79+3) − 0.5)·1.8` → `[−0.9, +0.9]` | Synthetic — labelled "Deterministic, sr-seeded" in the code itself |
| `estPnL` | `totalImpact · (1 + sr(i*7)·4)` | Synthetic 1×–5× multiplier on a synthetic impact |
| TOPICS / SOURCES / ENTITIES | 15 / 15 / 35 real names | Real taxonomy (Reuters, Bloomberg, FT, Shell, BP…) but only used as labels |

### 7.4 Worked example — weighted sentiment index

The WSI is `Σ(s·reach·rel)/Σ(reach·rel)`. For three illustrative items:

| Item | sentiment `s` | reach | rel | weight `reach·rel` | `s·weight` |
|---|---|---|---|---|---|
| n1 | +0.50 | 40,000 | 0.90 | 36,000 | +18,000 |
| n2 | −0.30 | 10,000 | 0.50 | 5,000 | −1,500 |
| n3 | +0.10 | 25,000 | 0.70 | 17,500 | +1,750 |
| **Σ** | | | | **58,500** | **+18,250** |

`WSI = 18,250 / 58,500 = 0.312`. A colour band then classifies it (`>0.2` green, `<−0.2` red,
else amber). Over the real 200-item set the index converges near 0 because `sentiment` is a
symmetric uniform draw — the headline "Sentiment Index" is essentially noise around zero.

### 7.5 Companion analytics

- **Topic × Category cross-tab** and **reach-weighted index by topic** — both re-apply the WSI
  formula per subgroup; correct given the inputs.
- **Sentiment histogram** — 10 bins of width 0.2 over `[−1, +1]`, `binIdx = min(9, floor((s+1)/0.2))`.
- **Sentiment-to-price correlation** — a grid of ρ values that are *directly seeded*, not computed
  from any price series (the code comment admits "sr-seeded").
- **Portfolio linkage** — filters items whose `entityMentions` include a holding, sums
  `portfolioImpact`, and inflates it into `estPnL` via a seeded 1×–5× multiplier.

### 7.6 Data provenance & limitations

- **Every sentiment, relevance, reach, impact and correlation value is synthetic**, from
  `sr(s)=frac(sin(s+1)×10⁴)`. Deterministic across reloads, but not real signal.
- **No NLP** — no FinBERT, no VADER, no tokeniser, no model weights; the guide's model names are
  aspirational.
- **Headline ↔ sentiment are decoupled** — a "sued over misleading claims" headline can carry a
  positive sentiment because the two are independent draws.
- **`estPnL` and `correlation` are not market-derived** — they cannot be used for trading signals.

**Framework alignment:** *FinBERT* (Yang et al. 2020) — a BERT model fine-tuned on financial
text (Reuters TRC2, Financial PhraseBank) that outputs per-sentence positive/negative/neutral
logits; here named but not run. *VADER* (Hutto & Gilbert 2014) — a lexicon-plus-rules valence
scorer producing a compound score in `[−1, +1]`; the module's `[−1, +1]` range mimics VADER's
output scale but is generated randomly. *TCFD* — cited as the reason to monitor climate news
(reputational/transition-risk signal), which the dashboard structure supports conceptually.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** The module surfaces a headline
"Sentiment Index", per-holding `estPnL`, and sentiment-to-price correlations that a PM could act
on — all currently `sr()`-seeded. A production build requires a real news-NLP and event-study stack.

**8.1 Purpose & scope.** Convert a real-time stream of climate-relevant news, regulatory
notices, and filings into per-entity and per-topic sentiment signals, then estimate the
short-horizon return impact on portfolio holdings for reputational/transition-risk monitoring.

**8.2 Conceptual approach.** Two stages benchmarked to industry practice. (i) **Domain-adapted
transformer sentiment** — FinBERT (Yang 2020) fine-tuned further on a climate corpus, in the
lineage of **RavenPack** and **Bloomberg's news-analytics sentiment** feeds. (ii) **Event-study
return attribution** — map entity-level sentiment shocks to abnormal returns via a market-model
event study (MacKinlay 1997), the same design equity-quant desks use to price news (cf.
**S&P Global Market Intelligence** textual-signal factors).

**8.3 Mathematical specification.**
```
Article sentiment:  s_a = softmax(FinBERT(text_a)) · [+1, 0, −1]        ∈ [−1, +1]
Entity daily score: S_{e,t} = Σ_{a∋e} w_a · s_a / Σ w_a,  w_a = reach_a · relevance_a · decay(t−t_a)
Sentiment shock:    Δ_{e,t} = S_{e,t} − EWMA_λ(S_{e,·})
Abnormal return:    AR_{e,t} = R_{e,t} − (α_e + β_e R_{mkt,t})          (market model)
Impact estimate:    E[AR | Δ] = γ · Δ_{e,t}                             (γ from panel regression)
Portfolio P&L:      PnL_p = Σ_h weight_h · Ê[AR_{h}]
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Sentiment logits | `FinBERT` | Financial PhraseBank + climate-labelled corpus (fine-tune) |
| Relevance | `relevance_a` | Entity-linker confidence + climate-classifier probability |
| Time decay | `λ` | Fitted to news half-life (~2–5 days), RavenPack-style |
| Market betas | `α_e, β_e` | 250-day OLS on daily returns vs regional index |
| Sentiment→return slope | `γ` | Panel regression of `AR` on `Δ`, per sector |

**8.4 Data requirements.** News: licensed feed (RavenPack / Bloomberg / GDELT-free) with
timestamps, source, full text. Entity map: ISIN↔name (present in `GLOBAL_COMPANY_MASTER`).
Prices: daily total returns + regional index (vendor or free via Stooq). Model: FinBERT weights
(open, HuggingFace). The platform already has the entity taxonomy and portfolio reader; it lacks
the feed, the transformer, and price history.

**8.5 Validation & benchmarking.** Label a held-out sample against human annotators (target
FinBERT F1 ≥ 0.85 vs Financial PhraseBank). Back-test the event study: does `γ·Δ` predict
next-day `AR` out-of-sample (information coefficient > 0)? Reconcile aggregate sentiment against
RavenPack ESS and against realised drawdowns around known climate events (e.g. litigation
filings). Stability: rolling-window γ.

**8.6 Limitations & model risk.** Transformer sentiment is domain-sensitive and can invert on
sarcasm/hedging; entity resolution errors propagate; event-study betas are unstable around the
very events of interest; `γ` is small and noisy, so per-holding `estPnL` must carry wide CIs.
Conservative fallback: publish sentiment *ranks* and flag events, not point P&L, until the
sentiment→return link is validated out-of-sample.

## 9 · Future Evolution

### 9.1 Evolution A — Real ingestion under the real analytics (analytics ladder: rung 1 → 2)

**What.** §7's split verdict: the aggregation layer is genuinely correct
(index/momentum/volatility arithmetic over article scores) but everything it consumes
is fabricated — 200 template-generated headlines with `sr()`-drawn sentiment,
relevance, and "portfolio impact"; no NLP, no ingestion, no sources despite the
guide's 15k-articles/day FinBERT pipeline claim. Evolution A builds a modest, honest
pipeline: RSS ingestion from a curated list of climate/regulatory feeds (GDELT's free
API and public RSS from regulators and trade press are keyless), entity matching
against the platform's GLEIF-backed entity spine, and sentiment scored server-side —
where the platform's LLM tier does this credibly: a Haiku-tier classification call
per article (sentiment, topic, entities) is cheaper and better than shipping a
FinBERT sidecar, and its outputs are cacheable and auditable.

**How.** (1) A 20th ingester: `news_articles(url, published_at, source, title,
entities, topic, sentiment, model_version)` on a 15-minute cycle over ~30 feeds —
thousands/day honestly, not "15,000+". (2) The existing aggregation functions
(rolling net-sentiment index `SS = (pos−neg)/total×100`, momentum, volatility)
re-pointed at real rows unchanged — the §7-praised math survives intact.
(3) Threshold alerting per the guide, with alert events persisted and auditable.
(4) Guide rewritten to the shipped scale and method.

**Prerequisites (hard).** Synthetic `NEWS_ITEMS` purge; feed licensing (headlines +
links are safe; full-text storage is not — store snippets and URLs); LLM
classification cost ceiling and `llm_traces` logging per the platform pattern.
**Acceptance:** every rendered item links to a real URL with a fetch timestamp;
sentiment carries model version; the index recomputes correctly as new articles
arrive; zero template headlines remain.

### 9.2 Evolution B — Signal-triage copilot (LLM tier 2)

**What.** With real articles in place, the natural assistant is a triage analyst:
"why did the utilities sentiment index drop 20 points this week?" answered by
retrieving the driving articles (the aggregation identifies them; the LLM summarises
with links), "which portfolio holdings had negative litigation-topic coverage this
month?", "draft a morning briefing of climate-regulatory signals". Summaries cite
article URLs; index moves cite the aggregation math; the copilot never scores
sentiment itself in conversation — scores come from the ingestion pipeline's logged
classifications.

**How.** Tool schemas over article search/aggregate endpoints; the validator ties
every index value and count to tool outputs; briefing drafts follow a fixed structure
(movers, drivers, watch items) with per-item links; the classification model version
is disclosed so users can discount appropriately.

**Prerequisites (hard).** Evolution A first — a triage copilot over template
headlines would fabricate market intelligence in the most literal sense.
**Acceptance:** every article referenced in an answer resolves to a stored URL; an
index-move explanation lists the articles whose scores arithmetically drove it;
briefings regenerate identically for a frozen window.