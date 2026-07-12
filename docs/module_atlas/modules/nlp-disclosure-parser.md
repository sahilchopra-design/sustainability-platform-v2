# NLP Disclosure Parser
**Module ID:** `nlp-disclosure-parser` · **Route:** `/nlp-disclosure-parser` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Uses natural language processing to extract structured ESG KPIs, metrics, and qualitative disclosures from regulatory filings (CSRD, TCFD, CDP, SFDR), reducing manual data collection burden.

> **Business value:** Automates the labour-intensive extraction of ESG KPIs from regulatory filings, enabling faster, more consistent data collection for ESG scoring, portfolio monitoring, and regulatory reporting workflows.

**How an analyst works this module:**
- Ingest disclosure documents (PDF, HTML, XBRL) and pre-process for NLP pipeline
- Apply domain-specific entity recognition to identify GHG values, target years, and KPI labels
- Validate extracted values using unit consistency checks and cross-document reconciliation
- Output structured JSON datasets tagged by standard (CSRD, TCFD, SFDR, GRI, CDP) for downstream use

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CLAIMS`, `CLAIM_TEXTS`, `CLAIM_TYPES`, `COMMITMENTS`, `COMMITMENT_TEXTS`, `COMMITMENT_TYPES`, `COMPANIES`, `COMPLIANCE_MATRIX`, `COVERAGE_TYPES`, `DATA_SOURCES`, `DOCUMENTS`, `DOC_TYPES`, `ESRS_STANDARDS`, `EXCERPT_TEXTS`, `EXTRACTIONS`, `FRAMEWORKS`, `GAPS`, `GREENWASH_FLAGS`, `GW_CATEGORIES`, `GW_COLOR`, `GW_PHRASES`, `GW_RISKS`, `GW_SEVERITIES`, `KpiCard`, `LANGUAGES`, `PATTERNS`, `PATTERN_TEXTS`, `RISK_TYPES`, `SECTORS`, `SEV_COLOR`, `STANDARD_MAPPED`, `Sel`, `TABS`, `VERIFICATION_SOURCES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DATA_SOURCES` | 12 | `endpoint`, `format`, `rateLimit`, `auth`, `useCase`, `sample` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `DOC_TYPES` | `['Annual Report','Sustainability Report','CDP Response','TCFD Report','SFDR PAI','Proxy Statement','10-K','ESG Supplement'];` |
| `sector` | `SECTORS[Math.floor(sr(i * 3) * 10)];` |
| `year` | `2022 + Math.floor(sr(i * 7) * 5);` |
| `type` | `DOC_TYPES[Math.floor(sr(i * 11) * 8)];` |
| `pages` | `Math.floor(sr(i * 13) * 350) + 50;` |
| `wordCount` | `Math.floor(sr(i * 17) * 105000) + 15000;` |
| `language` | `LANGUAGES[Math.floor(sr(i * 19) * 6)];` |
| `extracted` | `sr(i * 23) > 0.25;` |
| `greenwashScore` | `Math.floor(sr(i * 29) * 100);` |
| `compliancePct` | `Math.floor(sr(i * 31) * 70) + 30;` |
| `STANDARD_MAPPED` | `['ESRS E1-4','ESRS E1-1','ESRS E1-5','ESRS E4-2','ESRS E3-1','ESRS S2-3','ESRS S1-16','ESRS G1-2','IFRS S2-6','IFRS S2-14','ESRS E1-8','ESRS E1-3'];` |
| `EXTRACTIONS` | `EXCERPT_TEXTS.map((excerpt, i) => ({` |
| `GW_CATEGORIES` | `['Vague Claims','Unsubstantiated Targets','Missing Baselines','Cherry-picking Data','Misleading Scope','False Labeling','Offsetting Abuse','Regulatory Non-compliance'];` |
| `GREENWASH_FLAGS` | `DOCUMENTS.map((doc, i) => ({` |
| `COVERAGE_TYPES` | `['Company','Group','Scope 1-3'];` |
| `VERIFICATION_SOURCES` | `['Third-party audit','CDP','SBTi','UNFCCC','Unverified'];` |
| `RISK_TYPES` | `['Greenwashing','Non-compliance','Completeness Gap','Ambiguity'];` |
| `COMPLIANCE_MATRIX` | `DOCUMENTS.slice(0, 40).map((doc, i) => {` |
| `cellStyle` | `{ padding: '8px 12px', fontSize: 12, color: T.textPri, borderBottom: '1px solid ' + T.borderL, verticalAlign: 'middle' };` |
| `avgGwScore` | `filteredDocs.length ? Math.round(filteredDocs.reduce((a, b) => a + b.greenwashScore, 0) / filteredDocs.length) : 0;` |
| `extractedPct` | `filteredDocs.length ? Math.round(filteredDocs.filter(d => d.extracted).length / filteredDocs.length * 100) : 0;` |
| `gwChartData` | `GW_RISKS.map(r => ({ name: r, count: DOCUMENTS.filter(d => d.greenwashRisk === r).length }));` |
| `scatterData` | `DOCUMENTS.map(d => ({ x: d.wordCount, y: d.greenwashScore, name: d.company }));` |
| `sectorGwData` | `SECTORS.map(s => {` |
| `complianceSummary` | `ESRS_STANDARDS.map(std => {` |
| `vals` | `COMPLIANCE_MATRIX.map(row => row[std]);` |
| `leastCompliant` | `[...complianceSummary].sort((a, b) => a.rate - b.rate)[0] \|\| { std: 'N/A', rate: 0 };` |
| `bestCompliant` | `[...complianceSummary].sort((a, b) => b.rate - a.rate)[0] \|\| { std: 'N/A', rate: 0 };` |
| `complianceTrend` | `[2020, 2021, 2022, 2023, 2024, 2025, 2026].map((yr, i) => ({` |
| `commitByType` | `COMMITMENT_TYPES.map(t => ({ type: t.slice(0, 18), count: COMMITMENTS.filter(c => c.type === t).length }));` |
| `frameworkSeverityGrid` | `FRAMEWORKS.map(fw => {` |
| `claimByType` | `CLAIM_TYPES.map(t => ({ type: t, count: CLAIMS.filter(c => c.type === t).length }));` |
| `verifTrend` | `[2020, 2021, 2022, 2023, 2024, 2025, 2026].map((yr, i) => ({` |
| `avgExtrConf` | `EXTRACTIONS.length ? Math.round(EXTRACTIONS.reduce((a, b) => a + b.confidence, 0) / EXTRACTIONS.length) : 0;` |
| `coverageRate` | `EXTRACTIONS.length ? Math.round(EXTRACTIONS.filter(e => e.confidence >= 75).length / EXTRACTIONS.length * 100) : 0;` |
| `icon` | `v === 'compliant' ? '\u2713' : v === 'partial' ? '\u007e' : v === 'missing' ? '\u2717' : 'N/A';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLAIM_TEXTS`, `CLAIM_TYPES`, `COMMITMENT_TEXTS`, `COMMITMENT_TYPES`, `COMPANIES`, `COVERAGE_TYPES`, `DATA_SOURCES`, `DOC_TYPES`, `ESRS_STANDARDS`, `EXCERPT_TEXTS`, `FRAMEWORKS`, `GAPS`, `GW_CATEGORIES`, `GW_PHRASES`, `GW_RISKS`, `GW_SEVERITIES`, `LANGUAGES`, `PATTERN_TEXTS`, `RISK_TYPES`, `SECTORS`, `STANDARD_MAPPED`, `TABS`, `VERIFICATION_SOURCES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| KPI Categories Extracted | — | Internal NLP Framework | Number of distinct ESG and climate KPI categories the parser can extract across GHG, water, social, governance, and regulatory dimensions. |
| Extraction F1 Score (Scope 1/2 GHG) | — | Internal Validation 2024 | Measured F1 accuracy for Scope 1 and 2 GHG extraction from CSRD and TCFD-aligned reports in validation corpus. |
- **Regulatory filing PDFs, XBRL iXBRL documents, CDP questionnaire responses, TCFD reports** → NLP pipeline: tokenisation, NER, relation extraction, unit normalisation → **Structured ESG KPI datasets, extraction confidence scores, audit trails**

## 5 · Intermediate Transformation Logic
**Methodology:** Extraction Accuracy
**Headline formula:** `F1 = 2 × (Precision × Recall) / (Precision + Recall)`

Harmonic mean of precision (correct extractions / total extractions) and recall (correct extractions / total relevant instances) for each KPI category.

**Standards:** ['Devlin et al. BERT 2018', 'FinBERT NLP 2020']
**Reference documents:** Devlin et al. BERT: Pre-training of Deep Bidirectional Transformers 2018; Yang et al. FinBERT 2020; EFRAG ESRS Full Technical Standards 2023; GRI Universal Standards 2021

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Run an actual extraction pipeline over real filings (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag is total: the guide claims F1=0.91 GHG-extraction accuracy via BERT/FinBERT, but no NLP model runs — no tokeniser, no inference, no precision/recall. What exists is (a) a genuinely useful `DATA_SOURCES` table of 12 real free/public APIs and models (SEC EDGAR full-text, EFRAG ESRS, CDP, GRI, ClimateBERT on Hugging Face, Climate Policy Radar, UNFCCC NDC registry) that *could* power a pipeline, and (b) an 80-document synthetic corpus with `sr()`-generated confidence/greenwash scores. Evolution A builds the real parser the module is named for.

**How.** (1) Stand up `POST /api/v1/nlp-parser/extract` running an actual pipeline: ingest a filing (PDF/HTML/XBRL), apply ClimateBERT (already identified in `DATA_SOURCES`, freely available on Hugging Face) for climate-domain NER, and extract GHG values, target years, and KPI labels mapped to the real `STANDARD_MAPPED` ESRS/IFRS codes (the 12 hand-written excerpt→datapoint pairs become the labelled seed set). (2) Compute the §5 F1 honestly against a hand-labelled validation set — replacing the asserted 0.91 with a measured, dated number and a model card per Atlas §8. (3) Unit-consistency and cross-document reconciliation checks (§1) as post-extraction validators. XBRL filings need no NLP — parse them structurally first, NLP only for narrative PDFs.

**Prerequisites.** This is greenfield NLP — the current page has zero real extraction; ClimateBERT inference in the backend (the pinned fastapi/starlette venv constraint means model-serving may need a dedicated process); a labelled validation corpus. **Acceptance:** the same filing always yields the same extractions with a measured (not asserted) F1; XBRL Scope 1/2 values reconcile to the filing's tagged facts; no `sr()` in any score.

### 9.2 Evolution B — Extraction-review copilot with source-span citations (LLM tier 2)

**What.** This module is LLM-native by nature — the modern realization of "NLP disclosure parsing" is an LLM extraction agent. A copilot that, given a filing, extracts KPIs and lets the analyst verify each: "pull all Scope 3 figures with their source sentences", "which ESRS E1 datapoints are disclosed?", "flag unsubstantiated targets" — every extracted value carrying the exact source span it came from.

**How.** Tool calls to the Evolution-A `/extract` endpoint; the LLM's role is orchestration and verification-surfacing, not extraction-by-hallucination — a hard rule here, since the whole failure mode of this module is fabricated confidence. Every extracted datapoint must cite a character span in the source document (the roadmap's Tier-2 provenance UX made literal); the fabrication validator rejects any KPI value not present in the source text. Greenwashing flags map to the real `GW_CATEGORIES` taxonomy with the triggering phrase quoted from the filing, not from `GW_PHRASES` templates. Structured JSON output tagged by standard (§1) is the deliverable.

**Prerequisites (hard).** Evolution A's real pipeline — an LLM "extracting" from the current synthetic corpus would fabricate ESG data, the single worst outcome for a data-collection tool feeding downstream scoring. **Acceptance:** every extracted value resolves to a verbatim source span; asking for a KPI absent from the document yields "not disclosed", not an invented figure.