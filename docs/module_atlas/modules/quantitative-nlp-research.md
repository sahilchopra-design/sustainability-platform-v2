# Quantitative NLP Research Tools
**Module ID:** `quantitative-nlp-research` · **Route:** `/quantitative-nlp-research` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Research toolkit for constructing ESG text-based quantitative factors from 10-K/annual report corpora, generating sentiment momentum signals, detecting regulatory filing change events, analysing green technology patent intensity, and mapping academic citation networks for climate risk models.

> **Business value:** Used by quant researchers, systematic ESG fund managers, and alternative data analysts to construct investment signals from unstructured sustainability and regulatory text data.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AV_KEY`, `CITATION_GROWTH`, `CONCEPT_PAIRS`, `ENTITIES`, `KpiCard`, `LiveBadge`, `MODELS`, `MULTI_TASK_COMPARISON`, `PRI_TIMELINE`, `REGULATIONS`, `REGULATORY_TIMELINE`, `SEED_COUNTRIES_RENEW`, `SEED_FILINGS`, `SEED_OA_WORKS`, `SEED_PAPERS`, `SectionHeader`, `TAU_EFFECT`, `TOP20_AUTHORS`, `TabBtn`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `doc` | `parser.parseFromString(xml, 'application/xml');` |
| `works` | `data.results.map(w => ({` |
| `items` | `data[1].filter(d => d.value != null).map(d => ({` |
| `hits` | `data.hits.hits.slice(0, 10).map((h, i) => ({` |
| `topF1` | `[...MODELS].sort((a, b) => b.f1 - a.f1).slice(0, 5);` |
| `regions` | `['All', ...Array.from(new Set(SEED_COUNTRIES_RENEW.map(r => r.region)))];` |
| `avgF1` | `MODELS.length ? (MODELS.reduce((s, m) => s + m.f1, 0) / MODELS.length).toFixed(3) : '0.000';` |
| `radarData` | `topF1.map(m => ({` |
| `val` | `sr(i * 37 + j * 13);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `CONCEPT_PAIRS`, `MODELS`, `MULTI_TASK_COMPARISON`, `REGULATIONS`, `REGULATORY_TIMELINE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Sentiment Alpha (annualised) | `long_short_ESG_text_factor_return` | Backtested factor (2010-2024) | Academic studies show 2-5% annualised alpha from ESG text momentum; strongest in transition-exposed sectors (e |
| Filing Change Materiality Score | `BERT_semantic_similarity_delta × materiality_keyword_weight` | EDGAR/SEDAR filing pairs | Scores >60 indicate material filing changes warranting analyst review; strong predictor of subsequent earnings |
| Green Patent Intensity Rank | `CPC_Y02_patents / total_patents × 100` | USPTO/EPO patent database | Companies in top quartile of green patent intensity show 15-25% lower carbon intensity 5 years forward; leadin |
- **SEC EDGAR 10-K corpus + USPTO Y02 patent data + BERT model** → Sentiment scoring → factor construction → patent intensity ranking → backtest → **Quantitative ESG text factors for systematic investment strategies**

## 5 · Intermediate Transformation Logic
**Methodology:** Text Factor Construction for Systematic ESG
**Headline formula:** `text_factor_return = long(high_ESG_sentiment_decile) - short(low_ESG_sentiment_decile)`
**Standards:** ['Loughran & McDonald (2011) Textual Analysis in Finance', 'Ke, Kelly, Xiu (2019) Predicting Returns with Text Data', 'NBER Working Paper ESG Text Factors 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).