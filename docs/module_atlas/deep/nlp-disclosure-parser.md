## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry claims an **F1 = 0.91 extraction
> accuracy** for Scope 1/2 GHG NLP extraction, sourced to an "Internal Validation 2024," and cites
> BERT/FinBERT as the underlying models. **No NLP model runs anywhere in this module.** There is no
> tokeniser, no transformer inference call, no precision/recall computation. What exists is (1) a
> `DATA_SOURCES` reference table of 12 genuinely real, free/public APIs and models (SEC EDGAR
> full-text search, EFRAG ESRS standards, CDP, GRI, TCFD Hub, SBTi, **ClimateBERT on Hugging Face**,
> Climate Policy Radar, UNFCCC NDC Registry) that *could* power a real pipeline, and (2) a fully
> synthetic 80-document corpus with PRNG-generated "confidence"/"completeness"/"greenwash" scores
> standing in for what that pipeline would output.

### 7.1 What the module computes

- **`DOCUMENTS`** — 80 rows, one per named real company (Shell, HSBC, Apple, Unilever, Volkswagen,
  Siemens, Walmart, AXA, …, index-aligned 1:1 so `COMPANIES[i]` always maps to `DOCUMENTS[i]`),
  each seeded with `sector`, `year` (2022–2026), `type` (8 doc types: Annual Report, TCFD Report,
  SFDR PAI, 10-K, …), `pages`, `wordCount`, `language`, `extracted` (boolean), `greenwashScore`
  (0–100) → `greenwashRisk` (Low/Medium/High/Critical banded at 25/50/75), `compliancePct`.
- **`EXTRACTIONS`** — 12 rows pairing a **hand-written, plausible ESG excerpt sentence**
  (e.g. "Our Scope 1 and 2 emissions decreased by 18% compared to 2020 baseline…") with a specific
  ESRS/IFRS datapoint code (`STANDARD_MAPPED`, e.g. `ESRS E1-4`), a `confidence` score
  (`sr(i×37)×34+65` → 65–99%) and `completeness` score (`sr(i×41)×60+40` → 40–99%) — these 12
  excerpts are the module's only "extracted text," and they are static content the developer wrote,
  not text pulled from any actual filing.
- **`GREENWASH_FLAGS`** — for each of the 80 documents, 3 flags drawn from `GW_CATEGORIES` (8
  categories: Vague Claims, Unsubstantiated Targets, Missing Baselines, …), a severity, a
  greenwash-style phrase (`GW_PHRASES`, 12 hand-written marketing-speak examples), and a mapped
  ESRS/IFRS standard — all index-selected by independent `sr()` draws, not detected from text.
- **`COMMITMENTS`** — 200 rows randomly assigning one of 11 hand-written commitment texts to a
  random company, target/baseline year, `quantified`/`verified` booleans, and a `confidence` score.

### 7.2 Parameterisation

| Field | Formula | Range |
|---|---|---|
| `greenwashScore` | `floor(sr(i×29)×100)` | 0–99 |
| `greenwashRisk` bands | `<25 Low, <50 Medium, <75 High, else Critical` | — |
| `compliancePct` | `floor(sr(i×31)×70)+30` | 30–99% |
| `confidence` (extraction) | `floor(sr(i×37)×34)+65` | 65–98% |
| `confidence` (commitment) | `floor(sr(i×101)×39)+60` | 60–98% |
| `quantified` | `sr(i×83)>0.35` | ~65% true |
| `verified` | `sr(i×89)>0.55` | ~45% true |

### 7.3 Calculation walkthrough

1. **Dashboard aggregates** (`avgGwScore`, `extractedPct`) are simple means/ratios over the 80
   `DOCUMENTS` — arithmetically correct, applied to fabricated per-document scores.
2. **`COMPLIANCE_MATRIX`** — for the first 40 documents, synthesises a compliant/partial/missing
   status per `ESRS_STANDARDS` (16 standards) via further `sr()` draws; `complianceSummary`
   aggregates the rate per standard, and `leastCompliant`/`bestCompliant` pick the extremes — a
   believable-looking regulatory heatmap built entirely from random cell values.
3. **`sectorGwData`** — mean `greenwashScore` grouped by `SECTORS` (10 sectors) — legitimate
   aggregation over synthetic per-document inputs.
4. **`gwChartData`/`scatterData`** — count documents by `greenwashRisk` band; scatter
   `wordCount` vs `greenwashScore` — no correlation is modelled (both fields are independently
   seeded), so any visual trend in the scatter is coincidental.
5. **`complianceTrend`/`verifTrend`** — 7-year (2020–2026) synthetic adoption-rate ramps, unrelated
   to the 80-document corpus.
6. **`DATA_SOURCES` table** (Tab describing "How this would work") — 12 real, currently-unwired API
   endpoints and one real hosted NLP model (`climatebert/distilroberta-base-climate-sentiment` on
   Hugging Face) presented as a build reference, not invoked by any code path in this file.

### 7.4 Worked example

Document `i=0` ("Shell plc"): `sector = SECTORS[floor(sr(0)×10)]`. `sr(0)`: `sin(1)=0.8415`,
×10000=8414.7, `frac=0.7096` (`floor(8414.7)=8414`, remainder 0.71 — using the JS
`x-Math.floor(x)` convention on the unscaled `x`, `floor(8414.7)=8414`, `8414.7-8414=0.7`).
`floor(0.7×10)=7` → `SECTORS[7]="Utilities"` — note this assigns Shell (an Energy major) to
"Utilities" purely by PRNG collision, illustrating the sector-label unreliability. `greenwashScore
= floor(sr(29)×100)`: further seed at `i×29=0`, i.e. `sr(0)` again = 0.7096 →
`greenwashScore=floor(70.96)=70` → `greenwashRisk="High"` (70 falls in the [50,75) High band).
Shell — a company with genuine, well-documented greenwashing controversy in the real world —
happens to land in the "High" risk band here, but this is coincidence: the same formula applied to
any other `i=0` company name would produce the identical 70/High result.

### 7.5 Data provenance & limitations

- **No NLP inference occurs.** The guide's F1=0.91 BERT/FinBERT extraction-accuracy claim has zero
  code support — there is no tokenisation, embedding, or classification step in this file.
- The `DATA_SOURCES` table is the one genuinely useful artefact: 12 real, mostly-free endpoints
  (SEC EDGAR full-text search, EFRAG, CDP, GRI, TCFD Hub, SBTi companies-taking-action CSV,
  Climate Policy Radar, UNFCCC NDC Registry, OWID CO2 data, and a real Hugging Face ClimateBERT
  sentiment model) — a legitimate starting point for building the pipeline the guide describes, but
  currently just reference documentation embedded in a React array.
- All 80 documents' `confidence`/`completeness`/`greenwashScore`/`compliancePct` fields are
  `sr()`-seeded and bear no relationship to the named company's actual disclosures.
- The 12 `EXTRACTIONS` excerpt sentences are illustrative writing samples, not extracted text.

**Framework alignment:** ESRS (CSRD) / IFRS S1 / S2 / SEC Climate Rule / SFDR PAI — the standard
*codes* referenced (`ESRS E1-4`, `IFRS S2-6`, etc.) are real datapoint identifiers from the actual
disclosure taxonomies, correctly used as labels even though no extraction maps text to them · BERT
/ FinBERT / ClimateBERT — named as the intended model family; ClimateBERT specifically has a real,
free-tier-accessible Hugging Face endpoint listed in `DATA_SOURCES` that a production build could
call directly.
