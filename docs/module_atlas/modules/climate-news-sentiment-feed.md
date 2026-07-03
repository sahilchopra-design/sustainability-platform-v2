# Climate News Sentiment Feed
**Module ID:** `climate-news-sentiment-feed` · **Route:** `/climate-news-sentiment-feed` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Applies real-time NLP analysis to climate-related news, regulatory announcements, and social media to generate sentiment scores and event-driven risk signals for portfolio monitoring.

> **Business value:** Delivers real-time climate sentiment intelligence to portfolio managers, risk officers, and analysts enabling early identification of reputational, regulatory, and market-moving climate events.

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
| `avgSentiment` | `items.reduce((s, n) => s + n.sentiment, 0) / items.length;` |
| `recentAvg` | `recent.length > 0 ? recent.reduce((s,n)=>s+n.sentiment,0)/recent.length : 0;` |
| `olderAvg` | `older.length > 0 ? older.reduce((s,n)=>s+n.sentiment,0)/older.length : 0;` |
| `momentum` | `parseFloat((recentAvg - olderAvg).toFixed(3));` |
| `variance` | `items.length > 1 ? items.reduce((s, n) => s + Math.pow(n.sentiment - mean, 2), 0) / (items.length - 1) : 0;` |
| `volatility` | `parseFloat(Math.sqrt(variance).toFixed(3));` |
| `portfolioImpact` | `parseFloat((items.reduce((s,n)=>s+n.portfolioImpact,0)/items.length).toFixed(2));` |

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
**Standards:** ['VADER Sentiment', 'FinBERT NLP Model']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).