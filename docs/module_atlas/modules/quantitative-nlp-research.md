# Quantitative NLP Research Tools
**Module ID:** `quantitative-nlp-research` · **Route:** `/quantitative-nlp-research` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Research toolkit for constructing ESG text-based quantitative factors from 10-K/annual report corpora, generating sentiment momentum signals, detecting regulatory filing change events, analysing green technology patent intensity, and mapping academic citation networks for climate risk models.

> **Business value:** Used by quant researchers, systematic ESG fund managers, and alternative data analysts to construct investment signals from unstructured sustainability and regulatory text data.

**How an analyst works this module:**
- Select filing corpus and ESG text factor specification
- Run sentiment extraction and factor signal computation
- Backtest factor strategy across sectors and time periods
- Export factor scores for systematic portfolio construction

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AV_KEY`, `CITATION_GROWTH`, `CONCEPT_PAIRS`, `ENTITIES`, `KpiCard`, `LiveBadge`, `MODELS`, `MULTI_TASK_COMPARISON`, `PRI_TIMELINE`, `REGULATIONS`, `REGULATORY_TIMELINE`, `SEED_COUNTRIES_RENEW`, `SEED_FILINGS`, `SEED_OA_WORKS`, `SEED_PAPERS`, `SectionHeader`, `TAU_EFFECT`, `TOP20_AUTHORS`, `TabBtn`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MODELS` | 10 | `f1`, `domain`, `params`, `license`, `huggingface` |
| `CONCEPT_PAIRS` | 10 | `frequency` |
| `REGULATORY_TIMELINE` | 5 | `date`, `framework`, `color` |
| `MULTI_TASK_COMPARISON` | 4 | `singleF1`, `multiF1` |

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
| ESG Sentiment Alpha (annualised) | `long_short_ESG_text_factor_return` | Backtested factor (2010-2024) | Academic studies show 2-5% annualised alpha from ESG text momentum; strongest in transition-exposed sectors (energy, materials). |
| Filing Change Materiality Score | `BERT_semantic_similarity_delta × materiality_keyword_weight` | EDGAR/SEDAR filing pairs | Scores >60 indicate material filing changes warranting analyst review; strong predictor of subsequent earnings surprises and regulatory actions. |
| Green Patent Intensity Rank | `CPC_Y02_patents / total_patents × 100` | USPTO/EPO patent database | Companies in top quartile of green patent intensity show 15-25% lower carbon intensity 5 years forward; leading indicator of transition readiness. |
- **SEC EDGAR 10-K corpus + USPTO Y02 patent data + BERT model** → Sentiment scoring → factor construction → patent intensity ranking → backtest → **Quantitative ESG text factors for systematic investment strategies**

## 5 · Intermediate Transformation Logic
**Methodology:** Text Factor Construction for Systematic ESG
**Headline formula:** `text_factor_return = long(high_ESG_sentiment_decile) - short(low_ESG_sentiment_decile)`

ESG text factors are constructed by computing a rolling sentiment score from 10-K filings using the Loughran-McDonald financial dictionary augmented with ESG-specific term lists (green, sustainability, climate, transition). Regulatory filing change detection uses BERT-based semantic similarity to flag material changes between consecutive annual filings. Patent intensity for green technology uses CPC Y02 classification codes to identify Scope 3 innovation capacity signals.

**Standards:** ['Loughran & McDonald (2011) Textual Analysis in Finance', 'Ke, Kelly, Xiu (2019) Predicting Returns with Text Data', 'NBER Working Paper ESG Text Factors 2023']
**Reference documents:** Loughran & McDonald (2011) When Is a Liability Not a Liability? JoF; Ke, Kelly, Xiu (2019) Predicting Returns with Text Data – RFS; USPTO CPC Y02 Green Technology Patent Classification Manual

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Unusually for the B tier, this module is a **live research-data aggregator**, not a calculator. It
issues real HTTP requests to five public APIs — **arXiv**, **OpenAlex**, **World Bank**, **SEC
EDGAR full-text search**, and **AlphaVantage** — and renders the returned data, falling back to
seeded demo data only when a request fails or returns empty. There is no financial or risk quantity
being modelled here, so no §8 model specification is required; the "methodology" is retrieval,
graceful degradation, and reference tabulation.

### 7.1 What the module computes

Almost nothing is *computed*; the module *fetches* and *displays*. The four data flows:

```js
arXiv:     GET export.arxiv.org/api/query?search_query=all:ESG+sentiment+NLP&max_results=20
           → DOMParser on Atom XML → {title, abstract, published, link}; sets livePapers=true
OpenAlex:  GET api.openalex.org/works?search=ESG+sentiment+analysis&filter=open_access.is_oa:true
           → {title, cited_by_count, concepts[0..3]}; sets liveOa=true
World Bank:GET api.worldbank.org/v2/country/all/indicator/EG.FEC.RNEW.ZS (renewable energy % — real
           indicator code) → {country, renewableShare}
SEC EDGAR: GET efts.sec.gov/... full-text search on "science based targets"
AlphaVantage: GET alphavantage.co/query (news sentiment)
```

On any `.catch()`, the handler swaps in the corresponding `SEED_*` array and sets the `live*` flag
`false`, so the UI can badge results as live vs demo.

**The `MODELS` table is genuine reference data**: real NLP models with accurate HuggingFace IDs and
published F1 benchmarks — FinBERT (`ProsusAI/finbert`, F1 0.87), ClimateBERT
(`climatebert/climatebert`), ESG-BERT (`nbroad/ESG-BERT`), XLM-RoBERTa, DeBERTa-v3, GPT-4o zero-shot.
The only derived view is `topF1 = [...MODELS].sort(desc by f1).slice(0,5)`.

### 7.2 Parameterisation / provenance

| Data | Source | Provenance |
|---|---|---|
| Papers (arXiv monitor) | arXiv API | **live**; `SEED_PAPERS` (20) fallback |
| OpenAlex works / citations | OpenAlex API | **live**; `SEED_OA_WORKS` (15) fallback |
| Renewable share by country | World Bank `EG.FEC.RNEW.ZS` | **live**; `SEED_COUNTRIES_RENEW` (40) fallback |
| SEC filings | EDGAR full-text search | **live** |
| News sentiment | AlphaVantage | **live** (API-key dependent) |
| NLP model table | hand-curated | **real** (accurate HF IDs & F1) |
| Seed citations / years | `sr()` ranges | synthetic (fallback only) |

### 7.3 Calculation walkthrough

1. On mount, five `useEffect` hooks fire parallel `fetch`es.
2. Each success path maps the API payload into the UI shape and sets its `live*` flag true.
3. Each failure path substitutes the matching `SEED_*` array and sets `live*` false.
4. Views: arXiv monitor (paper cards), OpenAlex citation bars, World Bank renewable-share chart,
   SEC filing list, and the NLP model-comparison table / top-F1 ranking.

### 7.4 Worked example

No numeric pipeline to trace. The only computation is the model ranking: `topF1` sorts the 10-model
`MODELS` array descending by `f1` and takes 5 — yielding GPT-4o (0.89), FinBERT (0.87),
ClimateRoBERTa (0.82), DeBERTa-v3 (0.81), ClimateBERT (0.80). These F1 figures are the published
benchmark values, not computed. World-Bank renewable shares, when live, are the actual latest
`EG.FEC.RNEW.ZS` values per country.

### 7.5 Data provenance & limitations

- **Primary data is live from authoritative public APIs** (arXiv, OpenAlex, World Bank, SEC EDGAR,
  AlphaVantage) — a genuine strength. The `live*` flags let the UI distinguish real vs fallback.
- **Seeded fallbacks** (`SEED_PAPERS`, `SEED_OA_WORKS`, `SEED_COUNTRIES_RENEW`) use `sr(seed) =
  frac(sin(seed+1)×10⁴)` for citations/years/shares — these appear only when an API call fails or the
  network is unavailable (e.g. offline demo), and are clearly non-authoritative.
- **No model is actually run**: the page does not execute FinBERT/ClimateBERT inference; it tabulates
  their published benchmarks. The abstracts in `SEED_PAPERS` are illustrative, not fetched.
- API dependence means results vary with network availability, rate limits, and (AlphaVantage) an API
  key; there is no caching or retry beyond the single fetch.

**Framework alignment:** The module surfaces the real **climate/ESG NLP model ecosystem** — FinBERT,
ClimateBERT family (`climatebert/*` including the TCFD-disclosure classifier and climate-sentiment
model), ESG-BERT — which are the standard open models for **TCFD** disclosure classification, **ESG**
sentiment, and greenwashing detection. Data sources are authoritative: **World Bank WDI**
(`EG.FEC.RNEW.ZS` renewable energy consumption), **OpenAlex** (open bibliometrics), **arXiv**, and
**SEC EDGAR**. As a retrieval-and-reference tool with real data and honest fallback labelling, it does
not require a production model specification.

## 9 · Future Evolution

### 9.1 Evolution A — From aggregator to factor pipeline: LM-dictionary sentiment over EDGAR (analytics ladder: rung 1 → 3)

**What.** §7 documents this accurately as a live research-data aggregator — real fetches to arXiv, OpenAlex, World Bank, SEC EDGAR full-text search, and AlphaVantage with graceful seed fallback and live/demo badges — that computes almost nothing. The guide's headline methodology (Loughran-McDonald sentiment factors, `text_factor_return = long(top decile) − short(bottom decile)`, BERT filing-change detection, Y02 patent intensity) is entirely unbuilt. Evolution A implements the first computable slice: server-side LM-dictionary sentiment scoring over EDGAR filings, since the EDGAR retrieval path already works from the browser.

**How.** (1) `api/v1/routes/nlp_research.py`: `POST /filing-sentiment` — fetch a 10-K via EDGAR, tokenize, score against the Loughran-McDonald word lists (public, redistributable) augmented with the ESG term list §5 describes; return per-section counts, net sentiment, and the exact dictionary hits (auditable, unlike a black-box score). (2) `POST /filing-delta`: sentence-level diff between consecutive filings of the same issuer with section-mapped change magnitude — the deterministic precursor to the guide's BERT similarity, shipped first because it needs no model serving. (3) Store scored filings in `nlp_filing_scores` keyed by CIK/accession so a cross-sectional factor and its rank-IC become computable once coverage accumulates; the decile backtest is a later increment gated on price history.

**Prerequisites.** EDGAR fair-access compliance (rate limits, User-Agent) in the ingestion framework; LM dictionary vendored with license note. **Acceptance:** a scored filing's sentiment reproduces from its stored hit list; the same filing scored twice is identical; delta scores are zero for identical filings.

### 9.2 Evolution B — LLM-native filing-change analyst (LLM tier 2)

**What.** This is the platform's most naturally LLM-shaped module — its subject *is* text. Evolution B upgrades the deterministic §9.1 delta into an analyst: given a flagged filing pair, the LLM reads the changed sections and answers "what materially changed in this issuer's climate-risk disclosure year-over-year?", classifying changes against a materiality rubric (risk-factor additions, target revisions, litigation language) with paragraph-level citations into the actual filing text.

**How.** Tool-calling pattern: the LLM invokes `POST /filing-delta` to get the changed-section list, then a `GET /filing-section` tool for passages — it never summarizes a document it hasn't retrieved in-conversation. Output is a structured change report (section, change type, materiality rating, quoted evidence) that the module stores alongside the deterministic scores, building the labelled corpus the guide's "materiality score" needs for eventual calibration against realized outcomes. Serving per the roadmap: Sonnet-tier for the analysis calls, prompt-cached rubric. The live paper/model-registry tabs gain a tier-1 sidecar: "which of these models suits German-language CSRD filings?" answered from the curated `MODELS` table (real HF IDs and F1 scores — legitimate grounding today).

**Prerequisites.** Evolution A's retrieval/delta endpoints; filing text cached server-side (re-fetching EDGAR per question violates rate norms). **Acceptance:** every quoted passage in a change report is verbatim-present in the retrieved filing text (string-checkable), and materiality ratings cite a rubric criterion.