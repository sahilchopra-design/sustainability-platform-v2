# AI ESG Sentiment Engine
**Module ID:** `ai-sentiment` · **Route:** `/ai-sentiment` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time NLP sentiment analysis for ESG news and social media. Covers 10,000+ sources, entity-level sentiment, topic classification, and portfolio momentum signals.

> **Business value:** ESG news sentiment provides leading indicators of company-specific risks before they appear in structured ESG scores — which are updated quarterly at best. This real-time signal helps portfolio managers avoid adverse events and identify engagement opportunities as they emerge.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACF_DATA`, `AMBIG_NAMES`, `ARTICLES`, `BACKTEST_MONTHS`, `Badge`, `CALIBRATION_BINS`, `COMPANIES`, `COMPANY_NAMES`, `CONTROVERSY_DATA`, `CONTROVERSY_TYPES`, `DISAMBIG_METHODS`, `ENTITIES_DISAMBIG`, `FADE_RATES`, `GENERATED_DISAMBIG`, `HEADLINE_SUFFIXES`, `IC_DECAY`, `IMPULSE_RESPONSE`, `KpiCard`, `NLP_MODELS`, `PILLARS`, `PILLAR_COLOR`, `PILLAR_SEASONALITY`, `SECTORS`, `SECTOR_TRAJECTORIES`, `SEED_DISAMBIG`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `posRaw` | `sr(i * 7 + 1);` |
| `neuRaw` | `sr(i * 7 + 2);` |
| `negRaw` | `sr(i * 7 + 3);` |
| `total` | `posRaw + neuRaw + negRaw;` |
| `score` | `Math.round(20 + sr(i * 13 + 4) * 60);` |
| `conf` | `0.55 + sr(i * 11 + 5) * 0.44;` |
| `credTier` | `Math.max(1, Math.ceil(sr(i * 17 + 6) * 5));` |
| `month` | `String(Math.max(1, Math.ceil(sr(i * 3 + 7) * 12))).padStart(2, '0');` |
| `day` | `String(Math.max(1, Math.ceil(sr(i * 3 + 8) * 28))).padStart(2, '0');` |
| `numEntities` | `2 + Math.floor(sr(i * 5 + 9) * 3);` |
| `kwBase` | `['carbon','emissions','ESG','disclosure','transition','climate','governance','reporting','net-zero','taxonomy','TCFD','SFDR','biodiversity','scope3','` |
| `keywords` | `Array.from({ length: 5 }, (_, j) => kwBase[Math.floor(sr(i * 7 + j + 15) * kwBase.length)]);` |
| `baseScore` | `30 + sr(i * 31 + 1) * 50;` |
| `raw` | `baseScore + (sr(i * 7 + m + 2) - 0.5) * 20;` |
| `ewmaHistory` | `history.map(v => {` |
| `smf` | `parseFloat(((sr(i * 41 + 4) - 0.5) * 2).toFixed(3));` |
| `srs` | `parseFloat(((sr(i * 43 + 5) - 0.5) * 2).toFixed(3));` |
| `conf` | `0.70 + sr(i * 13 + 1) * 0.29;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AMBIG_NAMES`, `COMPANY_NAMES`, `CONTROVERSY_TYPES`, `DISAMBIG_METHODS`, `ENTITIES_DISAMBIG`, `HEADLINE_SUFFIXES`, `IC_DECAY`, `LANGS`, `NLP_MODELS`, `PILLARS`, `SECTORS`, `SEED_DISAMBIG`, `SENTIMENTS`, `SOURCES_LIST`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sources | — | Feeds | Global news, analyst reports, regulatory filings, social media |
| Update Frequency | — | Pipeline | 15-minute news ingestion cycle |
| Company Coverage | — | Universe | Major global companies tracked |
- **Raw news/social text** → NLP processing → **Entity sentiment scores**
- **Entity sentiment** → Portfolio weighting → **Portfolio ESG sentiment score**
- **Sentiment momentum** → Signal generation → **ESG alpha signal**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-source NLP sentiment
**Headline formula:** `Sentiment = VADER_score(text) weighted by source_credibility × topic_relevance`
**Standards:** ['VADER', 'FinBERT', 'Refinitiv News']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).