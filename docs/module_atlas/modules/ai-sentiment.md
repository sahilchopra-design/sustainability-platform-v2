# AI ESG Sentiment Engine
**Module ID:** `ai-sentiment` · **Route:** `/ai-sentiment` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time NLP sentiment analysis for ESG news and social media. Covers 10,000+ sources, entity-level sentiment, topic classification, and portfolio momentum signals.

> **Business value:** ESG news sentiment provides leading indicators of company-specific risks before they appear in structured ESG scores — which are updated quarterly at best. This real-time signal helps portfolio managers avoid adverse events and identify engagement opportunities as they emerge.

**How an analyst works this module:**
- Dashboard shows portfolio sentiment heat map with scores
- News Feed shows latest ESG news with entity tags and sentiment
- Topic Breakdown shows E/S/G sub-topic sentiment trends
- Momentum Alerts flags unusual sentiment spikes
- Alpha Signal shows historical relationship between sentiment and returns

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACF_DATA`, `AMBIG_NAMES`, `ARTICLES`, `BACKTEST_MONTHS`, `Badge`, `CALIBRATION_BINS`, `COMPANIES`, `COMPANY_NAMES`, `CONTROVERSY_DATA`, `CONTROVERSY_TYPES`, `DISAMBIG_METHODS`, `ENTITIES_DISAMBIG`, `FADE_RATES`, `GENERATED_DISAMBIG`, `HEADLINE_SUFFIXES`, `IC_DECAY`, `IMPULSE_RESPONSE`, `KpiCard`, `NLP_MODELS`, `PILLARS`, `PILLAR_COLOR`, `PILLAR_SEASONALITY`, `SECTORS`, `SECTOR_TRAJECTORIES`, `SEED_DISAMBIG`, `SENTIMENTS`, `SENT_COLOR`, `SOURCES_LIST`, `SOURCE_META`, `SectionTitle`, `TABS`, `TIER_COLORS`, `TabAlphaGeneration`, `TabConfidenceUncertainty`, `TabControversy`, `TabEntityDisambig`, `TabLiveFeed`, `TabNLPBenchmarking`, `TabSourceLanguage`, `TabTemporalDynamics`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SEED_DISAMBIG` | 19 | `resolved`, `conf`, `alts`, `name` |
| `NLP_MODELS` | 7 | `ref`, `domain`, `classes`, `f1_e`, `f1_s`, `f1_g`, `f1_avg`, `precision`, `recall`, `latency_ms`, `cost_per_k`, `open_source`, `training_docs`, `use_case` |
| `IC_DECAY` | 5 | `smf`, `srs`, `cp` |
| `TABS` | 9 | `label` |

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
| `kwBase` | `['carbon','emissions','ESG','disclosure','transition','climate','governance','reporting','net-zero','taxonomy','TCFD','SFDR','biodiversity','scope3','alignment'];` |
| `keywords` | `Array.from({ length: 5 }, (_, j) => kwBase[Math.floor(sr(i * 7 + j + 15) * kwBase.length)]);` |
| `baseScore` | `30 + sr(i * 31 + 1) * 50;` |
| `raw` | `baseScore + (sr(i * 7 + m + 2) - 0.5) * 20;` |
| `ewmaHistory` | `history.map(v => {` |
| `smf` | `parseFloat(((sr(i * 41 + 4) - 0.5) * 2).toFixed(3));` |
| `srs` | `parseFloat(((sr(i * 43 + 5) - 0.5) * 2).toFixed(3));` |
| `alt1conf` | `Math.max(0.3, conf - 0.10 - sr(i * 7 + 2) * 0.15);` |
| `alt2conf` | `Math.max(0.2, conf - 0.20 - sr(i * 7 + 3) * 0.20);` |
| `SOURCE_META` | `SOURCES_LIST.map((name, i) => {` |
| `articles` | `Math.round(100 + sr(i * 17 + 1) * 4900);` |
| `avgSentiment` | `parseFloat((40 + sr(i * 19 + 2) * 30).toFixed(1));` |
| `biasScore` | `parseFloat(((sr(i * 23 + 3) - 0.5) * 100).toFixed(1));` |
| `avgConf` | `parseFloat((0.60 + sr(i * 29 + 4) * 0.35).toFixed(2));` |
| `credWeight` | `[1.0, 0.85, 0.70, 0.55, 0.40][tier - 1];` |
| `enPct` | `Math.round(40 + sr(i * 31 + 5) * 40);` |
| `frPct` | `Math.round(5 + sr(i * 31 + 6) * 20);` |
| `dePct` | `Math.round(5 + sr(i * 31 + 7) * 15);` |
| `esPct` | `Math.round(3 + sr(i * 31 + 8) * 12);` |
| `jpPct` | `Math.max(0, 100 - enPct - frPct - dePct - esPct);` |
| `numEvents` | `3 + Math.floor(sr(i * 7 + 1) * 6);` |
| `lsReturn` | `parseFloat(((sr(i * 17 + 1) - 0.42) * 6).toFixed(2));` |
| `benchReturn` | `parseFloat(((sr(i * 17 + 2) - 0.47) * 4).toFixed(2));` |
| `midConf` | `(i + 0.5) / 10;` |
| `actualAcc` | `Math.max(0, Math.min(1, midConf + (sr(i * 7 + 1) - 0.5) * 0.15));` |
| `SECTOR_TRAJECTORIES` | `SECTORS.map((sec, si) => ({` |
| `pillarPie` | `PILLARS.map(p => ({ name: p, value: byPillar[p] }));` |
| `sentDist` | `SENTIMENTS.map(s => ({ name: s, value: filtered.filter(a => a.sentiment === s).length }));` |
| `methodCounts` | `DISAMBIG_METHODS.map(m => ({ name: m, value: ENTITIES_DISAMBIG.filter(e => e.method === m).length }));` |
| `mostAmbiguous` | `[...ENTITIES_DISAMBIG].sort((a, b) => a.conf - b.conf).slice(0, 20);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AMBIG_NAMES`, `COMPANY_NAMES`, `CONTROVERSY_TYPES`, `DISAMBIG_METHODS`, `ENTITIES_DISAMBIG`, `HEADLINE_SUFFIXES`, `IC_DECAY`, `LANGS`, `NLP_MODELS`, `PILLARS`, `SECTORS`, `SEED_DISAMBIG`, `SENTIMENTS`, `SOURCES_LIST`, `TABS`, `TIER_COLORS`

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

Entity extraction: named entity recognition for company mentions. Topic classification: environment, social, governance sub-topics. Source credibility: tier 1 news > analyst reports > social media. Momentum: change in sentiment vs 30-day average.

**Standards:** ['VADER', 'FinBERT', 'Refinitiv News']
**Reference documents:** FinBERT Financial Sentiment Model; VADER Sentiment Analysis Tool; Refinitiv/LSEG News API

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *live NLP pipeline* —
> "Sentiment = VADER_score(text) weighted by source_credibility × topic_relevance" over 10,000+
> real-time sources. **No NLP runs in this module.** Every article, sentiment score, FinBERT
> probability triple, confidence value and forward return is generated by the platform's seeded
> PRNG `sr(seed) = frac(sin(seed+1)×10⁴)`. What the page genuinely implements is the *analytics
> layer that would sit on top of* such a pipeline: EWMA sentiment smoothing, source-credibility
> weighting, a 3-factor alpha combiner with IC-decay diagnostics, confidence calibration bins, and
> an entity-disambiguation review queue. The sections below document that layer as coded.

### 7.1 What the module computes

Four synthetic datasets drive nine tabs:

- **80 articles** (`ARTICLES`): each carries a sentiment `score = round(20 + sr(i·13+4)·60)`
  (range 20–80), classified `Positive` if score > 60, `Neutral` if score > 40, else `Negative`;
  a confidence `conf = 0.55 + sr(i·11+5)·0.44` (0.55–0.99); a credibility tier 1–5; and a
  pseudo-FinBERT probability triple `(fp, fn, fg) = (posRaw, neuRaw, negRaw) / total` where the
  three raws are independent `sr()` draws — so the triple always sums to 1 but is unrelated to the
  headline text.
- **80 companies** (`COMPANIES`): 24-month sentiment history around `baseScore = 30 + sr(i·31+1)·50`
  with ±10-pt monthly noise, clamped to [10, 90], plus the smoothed series below.
- **50 entity-disambiguation records** (10 curated, e.g. `'Shell' → Shell plc conf 0.82` with
  alternates, + 40 generated with `conf = 0.70 + sr(·)·0.29`).
- **12 source-metadata rows** (`SOURCE_META`) with tier, bias score, language mix and credibility
  weight.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| EWMA decay λ | 0.15 (`ewma = 0.15·v + 0.85·ewma`) | Hardcoded; displayed as "EWMA λ = 0.15" on the tab |
| Sentiment classes | > 60 Positive / > 40 Neutral / else Negative | Synthetic demo thresholds |
| Credibility weights by tier | `[1.0, 0.85, 0.70, 0.55, 0.40]` for tiers 1–5 | Synthetic; implements the guide's "tier-1 news > social media" ordering |
| Source tier assignment | index-based: Reuters/Bloomberg/FT = tier 1 … Academic = tier 5 | Hardcoded list order |
| Controversy fade half-lives | `FADE_RATES` map, 18–56 days by controversy type (e.g. Board Misconduct 56d, Tax Avoidance 18d) | Synthetic demo values |
| Alpha factors | `smf`, `srs` ∈ [−1, 1]; `cp` ∈ [0, 1.5] per company | Independent `sr()` draws |
| NLP benchmark table | 6 models incl. FinBERT (arXiv:1908.10063, F1 0.87), ClimateRoBERTa (F1 0.82), VADER+lexicon (F1 0.71, 8 ms) | Model names/refs are real public models; the F1/latency/cost figures are hardcoded plausible values, not measured |

### 7.3 Calculation walkthrough

1. **EWMA smoothing** — each company's raw monthly series is filtered with
   `ewma_t = 0.15·raw_t + 0.85·ewma_{t−1}`, seeded at `history[0]`. This is the only genuine
   time-series computation on the page; charts overlay raw vs smoothed.
2. **Factor combiner (Alpha Signal tab)** — user sliders set weights `(smfW, srsW, cpW)` and the
   80 companies are ranked by `smf·smfW + srs·srsW + cp·cpW`; top/bottom names form the
   long/short book. SMF = sentiment momentum, SRS = reversal, CP = controversy premium (labels
   only — the underlying values are random draws, not derived from the sentiment histories).
3. **Backtest** — 12 months of long/short returns `((sr(i·17+1) − 0.42)·6)%` vs benchmark
   `((sr(i·17+2) − 0.47)·4)%`, compounded into cumulative index lines from 100. The positive
   offsets (−0.42 vs −0.47 pivots) build in a synthetic positive drift for the L/S strategy.
4. **IC decay** — hardcoded rank-IC values per horizon (1D/5D/21D/63D); SMF IC peaks at 5D
   (~0.11–0.18) and decays by 63D while CP rises — the classic fast-signal/slow-signal contrast,
   drawn rather than estimated.
5. **Calibration bins** — 10 confidence buckets with
   `accuracy = clamp(midConf + (sr(i·7+1) − 0.5)·0.15)`, i.e. accuracy ≈ confidence ± 7.5%, so the
   reliability diagram plots as approximately calibrated by construction.
6. **Entity disambiguation** — a query box hashes the input (`seed = len·7 + charCodeAt(0)`) to
   pick a resolved company and two alternates; the review queue sorts all 50 records ascending by
   confidence (`mostAmbiguous`).

### 7.4 Worked example (article i = 0)

| Step | Computation | Result |
|---|---|---|
| posRaw / neuRaw / negRaw | `sr(1), sr(2), sr(3)` | 0.7942, 0.1120, 0.4121 |
| total | 0.7942 + 0.1120 + 0.4121 | 1.3183 |
| FinBERT triple | raws ÷ total | P 60.2% / N 8.5% / Neg 31.3% |
| score | `round(20 + sr(4)·60)` = round(20 + 0.9563·60) | **77** |
| sentiment | 77 > 60 | **Positive** |
| confidence | `0.55 + sr(5)·0.44` = 0.55 + 0.2794·0.44 | **0.673** |
| credibility tier | `max(1, ceil(sr(6)·5))` = ceil(0.6570·5) | **4** |

(`sr(1)=frac(sin(2)·10⁴)`, etc.) Note the display quirk: the FinBERT bar can show a Positive-
dominant triple on an article whose independent `score` draw classifies it Negative — the two are
uncoupled random draws.

### 7.5 Companion analytics

- **Source intelligence tab** — per-source articles tracked (100–5,000), bias score ±50, language
  mix (EN 40–80%, residual to JP), average credibility weight KPI
  `Σ credibility_weight / 12`.
- **Seasonality & ACF** — pillar seasonality uses genuine sinusoids
  (`E = 55 + 8·sin(2πm/12) + noise`); ACF bars decay as `exp(−0.15·lag)` with random sign —
  illustrative autocorrelation shapes, not estimated from the series.
- **Impulse response** — controversy shock decays `100·exp(−0.3t)` over 12 weeks.

### 7.6 Data provenance & limitations

- **Everything numeric is synthetic**, generated by `sr(seed)` — stable across renders but not
  derived from any text corpus. There is no ingestion, no model inference, no API call.
- The NLP model benchmark table names real models (FinBERT, ClimateBERT's distilroberta
  climate-sentiment, ESG-BERT, VADER, TextBlob, GPT-4o) with fabricated-but-plausible F1/latency
  figures; treat as a design spec, not an evaluation.
- The factor values (`smf/srs/cp`) are not computed from the sentiment histories they sit beside;
  a production build would derive momentum as (EWMA_now − EWMA_lag) and IC as realised Spearman
  rank correlation vs forward returns.
- Forward returns per company are also `sr()` draws, so the alpha ranking demonstrates the UI, not
  predictive power.

### 7.7 Framework alignment

- **FinBERT / ClimateBERT** — real transformer models fine-tuned on financial/climate text for
  3-class sentiment; the page reproduces their output *format* (probability triple) only.
- **VADER** — lexicon-and-rule sentiment scorer producing a compound score in [−1, 1]; cited by
  the guide as the scoring core but absent from the code.
- **Information Coefficient (Grinold–Kahn active-management practice)** — IC = rank correlation of
  signal vs forward return; the IC-decay tab visualises this diagnostic with synthetic values.
- **Model calibration (reliability diagrams)** — the calibration tab follows the standard
  confidence-vs-accuracy binning used to validate classifier probability outputs.

## 9 · Future Evolution

### 9.1 Evolution A — Real NLP pipeline feeding the analytics layer (analytics ladder: rung 1 → 4)

**What.** Per the §7 mismatch flag, no NLP runs here: every article, sentiment score, FinBERT
probability triple, confidence and forward return is an `sr()` draw. What the page *does*
genuinely implement is the analytics layer that would sit atop a real pipeline — EWMA smoothing
(`ewma = 0.15·v + 0.85·ewma`, the one real time-series calc), source-credibility weighting
(tier weights [1.0…0.40]), a 3-factor alpha combiner (SMF/SRS/CP) with IC-decay diagnostics, and
confidence-calibration bins. Evolution A supplies the missing pipeline: ingest real ESG news
(GDELT is already wired in the sibling ai-data-live module), run an actual FinBERT/ClimateBERT
inference pass for the sentiment triple, and derive the factor values from the sentiment
histories — SMF as `EWMA_now − EWMA_lag`, IC as realised Spearman rank-correlation vs forward
returns — instead of independent random draws.

**How.** A news ingester + an inference service (`POST /api/v1/ai-sentiment/score` running the
transformer, `GET /portfolio-sentiment` for the EWMA-smoothed entity series); the existing
analytics (credibility weighting, calibration, IC decay) consume real model outputs. Rung 4
(predictive): the alpha signal becomes a real backtest of sentiment-momentum vs forward returns
with honest IC/IR, replacing the synthetic positive drift baked into the current backtest
(−0.42 vs −0.47 pivots).

**Prerequisites (hard).** Purge the pervasive `sr()` draws per the no-fabricated-random
guardrail; the NLP benchmark table's F1/latency figures are fabricated-plausible (§7.6) and must
be replaced with measured values once models run; entity disambiguation needs a real linker
(the 50-record queue is seeded). **Acceptance:** the FinBERT triple and headline sentiment agree
(today they are uncoupled draws — §7.4 quirk); factor values recompute from EWMA histories;
backtest IC reflects realised, not built-in, predictive power.

### 9.2 Evolution B — Sentiment copilot grounded in entity-level scores (LLM tier 1 → 2)

**What.** A copilot answering "why did sentiment on Company X drop this month?" (walking the EWMA
series and the news that moved it), "which controversy types decay slowest?" (Board Misconduct
56d vs Tax Avoidance 18d from `FADE_RATES`), and "is my sentiment alpha signal calibrated?"
(reading the reliability-diagram bins). Grounded in the page's computed analytics; because the
underlying scores are synthetic today, the copilot must state that sentiment values and forward
returns are seeded until Evolution A's real pipeline lands.

**How.** Tier-1 roadmap pattern: §7.2 parameter table (EWMA λ, credibility weights, fade
half-lives, IC-decay framing) and §7.6 framework alignment (FinBERT, VADER, Grinold–Kahn IC)
embedded as the module corpus; page state (selected entity's EWMA history, factor weights) passed
as context; served via `POST /api/v1/copilot/ai-sentiment/ask` with the standard refusal path.
After Evolution A, graduate to tier 2: "score the latest news on X" tool-calls the real inference
endpoint, and the no-fabrication validator checks every sentiment figure against model output.

**Prerequisites.** Atlas corpus embedded (roadmap D3); grounding carries the §7 mismatch note so
the copilot never presents seeded FinBERT triples as real inference. **Acceptance:** every figure
cited matches page state with its synthetic status stated; a request to score a live headline
before Evolution A returns a refusal naming the absent NLP pipeline.