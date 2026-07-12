# AI-Driven Live Climate Data Platform
**Module ID:** `ai-data-live-platform` · **Route:** `/ai-data-live-platform` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Real-time climate data ingestion platform integrating satellite imagery, IoT sensor streams, and regulatory filing feeds with AI-powered anomaly detection, automated PCAF DQ tier scoring, data lineage tracking, API endpoint management, and data freshness monitoring for enterprise-grade climate intelligence.

> **Business value:** Used by data engineering teams, ESG data managers, and chief sustainability officers to ensure climate data reliability, completeness, and audit-readiness for TCFD, SFDR, and CSRD disclosures.

**How an analyst works this module:**
- Configure data ingestion pipelines (satellite, IoT, API, filing)
- Review data freshness dashboard and PCAF DQ tier scores
- Investigate flagged anomalies and update data quality scores
- Monitor API endpoint performance and lineage DAG for key metrics

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARTICLE_TITLES`, `COMPANIES_SEC`, `CORR_MATRIX`, `CORR_SOURCES`, `DAILY_NEWS`, `ENTITY_COMPANIES`, `ENTITY_SECTORS`, `ENTITY_TOPICS`, `EVENT_TYPES`, `EVENT_WINDOW_DATA`, `FACTOR_NAMES`, `FORM_TYPES`, `GDELT_URL`, `HAWKES_PARAMS`, `IC_CURVES`, `IC_DAYS`, `KpiBox`, `LiveBadge`, `NLP_MODELS`, `OPENALEX_URL`, `PAPER_TITLES`, `PILLAR_COLORS`, `REGION_COUNTRIES`, `ROLLING_CORR`, `SAMPLE_TOKENS`, `SECTOR_COLORS`, `SEC_URL`, `SEED_COUNTRIES`, `SEED_ENTITIES`, `SEED_EVENTS`, `SEED_FILINGS`, `SEED_GDELT`, `SEED_PAPERS`, `SOURCE_COUNTRIES`, `SectionHeader`, `TABS`, `Tab10Alpha`, `Tab1News`, `Tab2SEC`, `Tab3Research`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGION_COUNTRIES` | 41 | `region`, `co2PerCapita` |
| `NLP_MODELS` | 6 | `weight`, `f1`, `color` |
| `SAMPLE_TOKENS` | 9 | `importance` |
| `HAWKES_PARAMS` | 4 | `mu`, `alpha`, `beta` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `GDELT_URL` | `'https://api.gdeltproject.org/api/v2/doc/doc?query=ESG+climate&mode=artlist&maxrecords=25&format=json';` |
| `SEC_URL` | `'https://efts.sec.gov/LATEST/search-index?q=%22climate+disclosure%22&dateRange=custom&startdt=2024-01-01&forms=10-K';` |
| `OPENALEX_URL` | `'https://api.openalex.org/works?search=ESG+sentiment+analysis&filter=open_access.is_oa:true&sort=cited_by_count:desc&per_page=20';` |
| `WORLDBANK_URL` | `'https://api.worldbank.org/v2/country/all/indicator/EN.ATM.CO2E.PC?format=json&mrv=1&per_page=50';` |
| `SEED_GDELT` | `ARTICLE_TITLES.map((title, i) => ({` |
| `FORM_TYPES` | `['10-K','10-K','10-K','8-K','DEF 14A'];` |
| `SEED_FILINGS` | `COMPANIES_SEC.map((company, i) => ({` |
| `SEED_PAPERS` | `PAPER_TITLES.map((title, i) => ({` |
| `SEED_COUNTRIES` | `REGION_COUNTRIES.map(c => ({ ...c, co2PerCapita: +c.co2PerCapita.toFixed(2) }));` |
| `SEED_ENTITIES` | `ENTITY_COMPANIES.map((name, i) => ({` |
| `SEED_EVENTS` | `EVENT_TYPES.map((type, i) => ({` |
| `avgCar` | `(sr(i * 53 + 16) - 0.52) * 2.5;` |
| `buildCorrMatrix` | `() => CORR_SOURCES.map((r, i) =>` |
| `raw` | `sr(i * 61 + j * 17 + 18) * 1.6 - 0.8;` |
| `IC_CURVES` | `FACTOR_NAMES.map((name, fi) => ({` |
| `eKw` | `['climate','carbon','emissions','renewable','biodiversity','net-zero','water','methane'];` |
| `avgTone` | `articles.length ? articles.reduce((s, a) => s + +a.tone, 0) / articles.length : 0;` |
| `posPct` | `articles.length ? articles.filter(a => +a.tone > 0).length / articles.length * 100 : 0;` |
| `totalMentions` | `filtered.reduce((s, f) => s + f.climateMentions, 0);` |
| `sorted` | `[...papers].sort((a, b) => b.cited_by_count - a.cited_by_count);` |
| `regions` | `['all','europe','asia','americas','africa','middle-east'];` |
| `globalAvg` | `countries.length ? countries.reduce((s, c) => s + c.co2PerCapita, 0) / countries.length : 0;` |
| `lowest` | `sorted[sorted.length - 1];` |
| `totalWeight` | `weights.reduce((s, w) => s + w, 0);` |
| `ensembleScore` | `(weights.reduce((s, w, i) => s + w * (NLP_MODELS[i].f1 * 0.6 + 0.2), 0) / Math.max(totalWeight, 0.001)).toFixed(4);` |
| `topicCooccurrence` | `ENTITY_TOPICS.slice(0, 6).map(topic => ({` |
| `divergenceAlerts` | `SEED_ENTITIES.slice(0, 5).map((e, i) => ({` |
| `smoothedData` | `IC_CURVES[0].data.map((pt, i) => ({` |
| `parsed` | `articles.map((a, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ARTICLE_TITLES`, `COMPANIES_SEC`, `CORR_SOURCES`, `ENTITY_COMPANIES`, `ENTITY_SECTORS`, `ENTITY_TOPICS`, `EVENT_TYPES`, `FACTOR_NAMES`, `FORM_TYPES`, `HAWKES_PARAMS`, `IC_DAYS`, `NLP_MODELS`, `PAPER_TITLES`, `REGION_COUNTRIES`, `SAMPLE_TOKENS`, `SOURCE_COUNTRIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Data Freshness Index | `(1 - days_since_update / max_acceptable_age) × 100` | Ingestion timestamp log | Score <60 triggers stale data warning; critical for real-time physical risk monitoring and daily portfolio carbon exposure. |
| PCAF DQ Score (portfolio-weighted) | `Σ(w_i × DQ_tier_i)` | PCAF Data Quality Framework | Lower scores are better (1=best); PCAF target for financed emissions is weighted avg DQ ≤ 3 for credible disclosure. |
| Anomaly Detection Rate | `flagged_anomalies / total_datapoints × 100` | Isolation forest anomaly model | Rates >5% suggest systematic data quality issues; each flagged anomaly is routed for human review before inclusion in disclosures. |
- **Satellite feeds + IoT sensors + regulatory filing APIs → raw ingestion layer** → Anomaly detection → DQ tier scoring → lineage DAG construction → **Clean, tagged, and auditable climate data with quality scores for regulatory disclosure**

## 5 · Intermediate Transformation Logic
**Methodology:** Automated Data Quality & Lineage Management
**Headline formula:** `DQ_tier = f(source_type, verification_level, recency, coverage_completeness)`

PCAF DQ tiers (1=highest, 5=lowest) are automatically assigned based on data source type (audited primary data = tier 1-2, modelled/estimated = tier 4-5), verification status, and temporal recency. Anomaly detection uses isolation forest algorithms on time-series data to flag outlier values >3σ from rolling 12-month mean. Data lineage is tracked using a directed acyclic graph (DAG) model from raw ingestion to derived KPI, enabling full audit trail for regulatory disclosure.

**Standards:** ['PCAF Data Quality Framework (2022)', 'SASB Data Standards', 'ISO 8000 Data Quality Standards']
**Reference documents:** PCAF Data Quality Assessment Framework v2.0 (2022); ISO 8000-8: Data Quality – Concepts and Measuring; Liu, Ting, Zhou (2008) Isolation Forest – ICDM

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (EP-MISC) frames this as an *automated PCAF data-
> quality & lineage engine* with anomaly detection and DQ-tier scoring
> (`DQ_tier = f(source_type, verification_level, recency, coverage)`). **No PCAF DQ-tier scoring,
> lineage graph or anomaly detector exists in the code.** What the module actually is: a
> **multi-source live-data intelligence console** — 10 tabs that fetch four public APIs (GDELT,
> SEC EDGAR, OpenAlex, World Bank) with graceful seed fallbacks, plus quant-signal panels
> (ensemble NLP, event study, Hawkes news arrivals, alpha-factor IC). Sections document the code.

### 7.1 What the module computes

Ten tabs, each backed by a public API with a `LIVE`/`SEEDED` badge:

| Tab | Source | Live URL |
|---|---|---|
| Live News | GDELT DOC 2.0 | `api.gdeltproject.org/api/v2/doc/doc?query=ESG+climate` |
| SEC Filings | SEC EDGAR full-text | `efts.sec.gov/LATEST/search-index` |
| Research | OpenAlex | `api.openalex.org/works?search=ESG+sentiment` |
| Country ESG | World Bank | `api.worldbank.org/.../EN.ATM.CO2E.PC` |
| Ensemble NLP · Knowledge Graph · Event Study · Triangulation · Temporal · Alpha Factors | seeded | — |

Each live tab uses the pattern: `fetch(URL) → if results parse & set live=true, else fall back
to SEED_* and live=false`; the `.catch` also falls back. So the platform degrades to fully
synthetic data offline without breaking. Note even on a *successful* GDELT/SEC fetch, some
fields (SEC `sentiment`, `climateMentions`) are still filled from the PRNG — only titles/dates/
companies come from the wire.

### 7.2 Parameterisation

- **PRNG** `sr(s)=frac(sin(s+1)×10⁴)` seeds every fallback dataset: 20 GDELT article titles with
  tone `sr·20−10` (GDELT's −100…+100 tone scale, compressed), 15 SEC filings, 15 OpenAlex
  papers, 41 countries with hand-anchored CO₂/capita (Qatar 31.2, USA 14.2, India 1.9 t —
  realistic 2022 per-capita figures) plus a small random jitter.
- **NLP ensemble (`NLP_MODELS`):** FinBERT (weight 0.30, F1 0.87), ClimateRoBERTa (0.25, 0.82),
  ESG-BERT (0.20, 0.79), VADER+ESG (0.15, 0.71), XLM-RoBERTa (0.10, 0.78) — weights sum to 1.
- **Hawkes parameters (`HAWKES_PARAMS`):** per ESG pillar, self-exciting point-process params
  μ (base intensity), α (excitation), β (decay): Environmental μ0.42/α0.31/β0.85, Social
  0.28/0.22/0.71, Governance 0.19/0.17/0.63. Branching ratio α/β < 1 (stationary) in all three.
- **Alpha factors:** 5 signals (GDELT Tone IC, SEC Disclosure IC, OpenAlex Momentum, CO₂ Delta
  IC, Composite) with seeded IC/IR/Sharpe/α and IC-decay curves `sr·0.25·e^(−d/40)`.

### 7.3 Calculation walkthrough — the real formulas

- **News tone stats (Tab 1):** `avgTone = mean(tone)`, `posPct/negPct` = share with tone ≷ 0;
  articles bucketed into 5 tone bands.
- **Ensemble score (Tab 5):**
  ```
  ensembleScore = Σ w_i × (F1_i × 0.6 + 0.2) / Σ w_i
  ```
  a weighted "F1 proxy" (linear rescale of each model's F1) — not an actual model inference.
- **Event study (Tab 7):** cumulative abnormal returns `CAR[−5,+5]`, `CAR[−1,+1]` and t-stats
  per event type, plus an average CAR curve over the [−10,+10] window — all seeded.
- **Correlation triangulation (Tab 8):** 4×4 matrix over {GDELT Tone, SEC Sentiment, OpenAlex
  Cit., WB CO₂}, diagonal 1.0, off-diagonal `sr·1.6 − 0.8` ∈ [−0.8, 0.8].
- **Alpha framework (Tab 10):** EWMA-smoothed composite signal
  `smoothed = Σ_f IC_f × (1−λ) + λ×0.05` with a user-selectable λ ∈ {0.05, 0.10, 0.20, 0.30};
  Information Ratio displayed as `IR = IC × √BR` (fundamental law of active management).
- **Pillar tagging** (`tagPillar`): keyword classifier mapping a title to E / S / G / ESG.

### 7.4 Worked example — ensemble score

Using the five model weights and F1s:

| Model | w | F1 | F1×0.6+0.2 | w × term |
|---|---|---|---|---|
| FinBERT | 0.30 | 0.87 | 0.722 | 0.2166 |
| ClimateRoBERTa | 0.25 | 0.82 | 0.692 | 0.1730 |
| ESG-BERT | 0.20 | 0.79 | 0.674 | 0.1348 |
| VADER+ESG | 0.15 | 0.71 | 0.626 | 0.0939 |
| XLM-RoBERTa | 0.10 | 0.78 | 0.668 | 0.0668 |
| Σ | 1.00 | | | **0.6851** |

`ensembleScore = 0.6851 / 1.00 ≈ 0.6851` → displayed 0.6851, labelled "POSITIVE ESG". Because
the inputs are fixed, this score is constant — it demonstrates the ensemble-weighting mechanic,
not a live classification.

### 7.5 Data provenance & limitations

- **Genuinely live-capable** for 4 tabs (GDELT, SEC EDGAR, OpenAlex, World Bank) — a real
  differentiator vs pure-synthetic modules — but all live calls run client-side and are subject
  to CORS; on failure the `SEEDED` badge shows and PRNG data renders.
- The 6 quant tabs (Ensemble, Knowledge Graph, Event Study, Triangulation, Temporal, Alpha) are
  **entirely seeded**: CARs, correlations, IC curves, Hawkes intensities and factor stats are
  `sr()` draws, not estimated from the fetched data.
- **No PCAF DQ engine:** despite the guide, there is no source-type→tier mapping, no verification/
  recency scoring, no lineage tracking and no anomaly detection.
- The Hawkes parameters are displayed but the self-exciting intensity
  `λ(t) = μ + Σ α·e^(−β(t−t_i))` is not simulated; daily news counts are independent draws.

### 7.6 Framework alignment

- **PCAF Data Quality Framework (2022)** — cited by the guide; the real PCAF DQ hierarchy scores
  data 1 (reported+verified) to 5 (estimated) by source type. This module references the concept
  but does not implement the scoring.
- **GDELT tone / event data** — the news tab uses GDELT's real tone metric (−100…+100 sentiment)
  and article-list API; the seed compresses tone to ±10.
- **Fundamental Law of Active Management (Grinold)** — `IR = IC × √BR` is correctly stated as
  the relationship between information coefficient, breadth and information ratio.
- **Hawkes self-exciting point process** — the μ/α/β parameterisation and stationarity condition
  (branching ratio α/β < 1) are correct for modelling clustered ESG-news arrivals, even though
  the intensity is not simulated here.
- **FinBERT / ClimateBERT family** — the ensemble references real domain-adapted transformer
  models with plausible F1 scores; no inference is actually performed.

## 9 · Future Evolution

### 9.1 Evolution A — Real PCAF DQ engine + server-side live ingestion (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag, the guide promises a PCAF data-quality/lineage engine with
anomaly detection (`DQ_tier = f(source_type, verification, recency, coverage)`) — **none of
which exists**; and while four tabs are genuinely live-capable (GDELT, SEC EDGAR, OpenAlex,
World Bank), the six quant panels (Ensemble NLP, Event Study, Triangulation, Hawkes, Alpha)
are entirely seeded `sr()` draws. Evolution A builds the guide's actual engine: a PCAF DQ-tier
scorer mapping source type → tier 1–5 with verification/recency weighting, an isolation-forest
anomaly detector on ingested time series (sklearn is in the environment), and a lineage DAG
persisted per KPI — the platform's own `lineage_output/traces/` is the pattern to formalise.
Move the four live fetches server-side to kill the documented CORS fragility.

**How.** A `data_quality` engine with `POST /api/v1/live-data/dq-score` (source metadata → tier)
and `/anomalies` (series → flagged outliers >3σ from rolling 12-month mean); a server-side
ingestion job for GDELT/SEC/OpenAlex/World Bank writing to real tables with freshness
timestamps, so `Data Freshness Index = (1 − days_since/max_age)·100` is computed from actual
ingestion logs. Rung 3: calibrate the anomaly threshold against labelled data-error cases;
actually simulate the Hawkes intensity `λ(t) = μ + Σα·e^(−β(t−tᵢ))` rather than displaying its
parameters.

**Prerequisites (hard).** Purge the seeded CARs/correlations/IC curves per the no-fabricated-
random guardrail; note that today even successful GDELT/SEC fetches fill some fields (sentiment,
climateMentions) from the PRNG — those must come from the wire or an NLP pass. **Acceptance:**
DQ tier changes with source type; an injected outlier is flagged by the detector; the four live
tabs render server-fetched data with real freshness timestamps.

### 9.2 Evolution B — Multi-source ESG intelligence copilot with tool-called fetches (LLM tier 2)

**What.** This module's four public APIs make it a natural tier-2 analyst: "what's today's ESG
news tone for the energy sector?" tool-calls the GDELT fetch; "which companies filed climate
10-Ks this quarter?" calls SEC EDGAR full-text; "top-cited ESG-sentiment research this year?"
calls OpenAlex; "CO₂-per-capita for these countries?" calls World Bank — then the copilot
narrates real fetched results instead of the page's seeded fallbacks. The genuine quant scaffolding
(ensemble weighting, IC = rank-corr, IR = IC·√BR from the fundamental law) becomes explainable.

**How.** Tool schemas wrapping the four (now server-side, from Evolution A) fetch endpoints plus
the DQ/anomaly routes; the no-fabrication validator checks every numeric — tone, citation count,
CO₂ figure — against tool outputs. The copilot must surface the `LIVE`/`SEEDED` state per source
and refuse to present seeded fallback data as live. The 41-country CO₂ anchors (Qatar 31.2, USA
14.2, India 1.9) are the ideal grounding for a "is this figure realistic?" check.

**Prerequisites.** Evolution A's server-side fetches (client-side CORS makes reliable tool-calling
impossible); Atlas corpus embedded (roadmap D3). **Acceptance:** every figure in an answer traces
to a tool call whose `LIVE` flag is true, or is explicitly flagged as seeded fallback; asking for
a PCAF DQ score before Evolution A returns a refusal naming the absent engine.