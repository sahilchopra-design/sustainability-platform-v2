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
