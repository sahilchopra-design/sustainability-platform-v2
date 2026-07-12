# LLM ESG Extractor
**Module ID:** `llm-esg-extractor` · **Route:** `/llm-esg-extractor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Large language model-powered extraction engine that identifies, classifies, and normalises ESG data points from unstructured sources including sustainability reports, proxy statements, press releases, contracts, and regulatory filings. Maps extracted entities to ESRS, SASB, GRI, and SFDR data point taxonomies with confidence scoring and evidence citation. Enables systematic ESG data collection at scale without manual analyst input.

> **Business value:** Scales ESG data collection by orders of magnitude, enabling investment teams and sustainability officers to extract structured, taxonomy-aligned ESG data from thousands of documents in hours rather than weeks of manual analyst effort.

**How an analyst works this module:**
- Upload a batch of sustainability reports, integrated reports, or filings in PDF or DOCX format
- Select target taxonomies (ESRS, GRI, SASB, SFDR PAI) to focus extraction scope and reduce noise
- Review extracted data point table with evidence snippets, confidence scores, and taxonomy mappings
- Accept, correct, or reject individual extractions using the inline annotation interface
- Export validated ESG data set to the central data repository or structured CSV for downstream analytics

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COMPANIES`, `Card`, `FRAMEWORKS`, `LLM_MODELS`, `LOW_CONF_REASONS`, `SectionTitle`, `Stat`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COMPANIES` | 13 | `name`, `sector`, `ticker`, `reportYear`, `leiCode` |
| `LLM_MODELS` | 5 | `label`, `cost_per_1k`, `avg_accuracy`, `speed_rating`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Extraction Studio', 'Framework Coverage', 'Confidence Intelligence', 'KPI Extraction', 'Multi-Doc Comparison'];` |
| `EXTRACTION_STEPS` | `['Parsing', 'Chunking', 'Extracting', 'Validating', 'Cross-mapping'];` |
| `extractionResults` | `useMemo(() => { const seed = selectedCompany.id * 31;` |
| `allFields` | `selectedFrameworks.flatMap(fw => (FRAMEWORKS[fw] \|\| []).map(f => ({ ...f, framework: fw })));` |
| `conf` | `0.45 + sr(seed + i * 7) * 0.53;` |
| `pageRef` | `extracted ? Math.floor(sr(seed + i) * 280) + 20 : null;` |
| `kpiVal` | `extracted ? (sr(seed + i * 3) * 900000 + 1000).toFixed(0) : null;` |
| `avgConf` | `extracted.length ? extracted.reduce((a, b) => a + b.confidence, 0) / extracted.length : 0;` |
| `tokens` | `Math.floor(sr(selectedCompany.id * 13) * 40000 + 60000);` |
| `seed` | `selectedCompany.id * 17 + fws.indexOf(fw) * 5;` |
| `covered` | `fields.filter((_, i) => sr(seed + i * 9) > 0.38).length;` |
| `radarData` | `useMemo(() => frameworkCoverage.map(f => ({ subject: f.framework, A: f.coverage })), [frameworkCoverage]);` |
| `scatterData` | `useMemo(() => { return extractionResults.filter(r => r.extracted).map((r, i) => ({ x: parseFloat((sr(r.id ? r.id : i * 3) * 10).toFixed(2)), y: r.confidence, framework: r.framework, label: r.label, size: r.required ? 8 : 5, }));` |
| `kpiData` | `useMemo(() => { const seed = selectedCompany.id * 23;` |
| `extracted` | `parseFloat((k.sectorAvg * (0.5 + sr(seed + i * 11) * 0.9)).toFixed(1));` |
| `delta` | `extracted - k.sectorAvg;` |
| `trendData` | `useMemo(() => { const seed = selectedCompany.id * 19;` |
| `companyScores` | `useMemo(() => { return COMPANIES.map(c => { const seed = c.id * 41;` |
| `completeness` | `Math.round(50 + sr(seed) * 45);` |
| `confidence` | `parseFloat((0.55 + sr(seed + 1) * 0.38).toFixed(2));` |
| `quantRate` | `Math.round(40 + sr(seed + 2) * 50);` |
| `assured` | `sr(seed + 3) > 0.5;` |
| `score` | `Math.round(completeness * 0.35 + confidence * 100 * 0.30 + quantRate * 0.25 + (assured ? 100 : 0) * 0.10);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `EXTRACTION_STEPS`, `LLM_MODELS`, `LOW_CONF_REASONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Extraction Recall (%) | — | Internal labelled ESG corpus | Proportion of ground-truth ESG data points successfully extracted from documents |
| Extraction Precision (%) | — | Internal labelled ESG corpus | Proportion of extracted data points that are correct, avoiding false positives |
| ESRS Taxonomy Coverage (%) | — | CSRD ESRS data point list 2023 | Proportion of mandatory ESRS data points for which at least one extraction is available |
| Average ECS | — | Model calibration output | Mean extraction confidence score across all extracted data points in a batch run |
- **Uploaded PDF / DOCX sustainability reports** → OCR if required; section parser; table and text segmentation → **Structured document corpus with page, section, and paragraph metadata**
- **Fine-tuned LLM extraction pipeline** → Apply NER + span extraction; map to taxonomy identifiers; score confidence → **Extracted data point table with value, unit, evidence snippet, ECS, and taxonomy mapping**
- **Human review annotation layer** → Accept / correct / reject per extraction; retrain model on corrections → **Validated ESG data set with provenance chain and model improvement feedback**

## 5 · Intermediate Transformation Logic
**Methodology:** Extraction Confidence Score
**Headline formula:** `ECS = P(correct entity) × P(correct value) × P(correct unit)`

ECS is the joint probability of correct entity identification, value extraction, and unit assignment, calibrated using Platt scaling on a held-out labelled corpus. Extractions below ECS 0.70 are flagged for human review. Named entity recognition uses fine-tuned transformer models on ESG domain training data; value extraction applies regex-anchored span detection.

**Standards:** ['GRI Universal Standards 2021', 'CSRD ESRS Data Point Taxonomy 2023', 'SASB Standards Taxonomy', 'NLP Confidence Calibration â€” Platt Scaling']
**Reference documents:** GRI Universal Standards 2021; CSRD ESRS Data Point Taxonomy EFRAG 2023; SASB Standards Conceptual Framework 2017; Devlin et al. BERT: Pre-training of Deep Bidirectional Transformers 2019; SEC AI/ML Guidance for Financial Disclosures 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula
> `ECS = P(correct entity) × P(correct value) × P(correct unit)`, calibrated via "Platt scaling on a
> held-out labelled corpus," implies a genuine joint-probability confidence model. **The code computes
> no such product.** Every extraction's confidence is a **single seeded-random draw** in `[0.45,
> 0.98]`, thresholded at 0.55 (extracted vs "NOT FOUND") and 0.65 (high vs low confidence flag) — there
> is no entity/value/unit decomposition, no Platt scaling, and **no actual document parsing or LLM
> call anywhere in the code** (the "uploaded files" list is a hard-coded array of 3 filenames; no
> file is ever read). Sections below document the code as it actually behaves.

### 7.1 What the module computes

A simulated ESG-data-extraction console over 12 real, correctly-identified European/global companies
(Shell, HSBC, Siemens, SAP, Nestlé, TotalEnergies, BNP Paribas, ArcelorMittal, ASML, Unilever,
Equinor, Deutsche Bank — with plausible real LEI code formats) and 5 real disclosure frameworks
(ESRS, ISSB, TCFD, GRI, SASB), each populated with a genuine, correctly-cited data-point taxonomy
(e.g. ESRS `E1-6` GHG Scope 1, `S1-16` Gender Pay Gap; SASB `FN-CB-410a` Financed Emissions). For a
selected company, the "extraction" is fabricated per field:

```js
conf      = 0.45 + sr(seed + i*7) * 0.53          // 0.45-0.98
extracted = conf > 0.55
pageRef   = extracted ? floor(sr(seed+i)*280)+20 : null      // fake PDF page number, 20-300
kpiVal    = extracted ? sr(seed+i*3)*900000+1000 : null      // fake numeric value
lowConf   = conf < 0.65
reason    = lowConf ? LOW_CONF_REASONS[floor(sr(seed+i*5) × 6)] : null
```
where `seed = selectedCompany.id × 31`.

### 7.2 Parameterisation

| Construct | Detail | Provenance |
|---|---|---|
| `FRAMEWORKS.ESRS` (40 items) | Real ESRS data-point codes (E1-6, E1-7, E1-8, S1-16, G1-1, etc.), pillar, required flag, unit | **Real**, correctly structured ESRS taxonomy subset |
| `FRAMEWORKS.ISSB` (27), `.TCFD` (11), `.GRI` (15), `.SASB` (12) | Real framework-specific codes/labels (GRI 305-1/305-2/305-3, TCFD G-1/G-2/ST-1..3, SASB sector-specific codes like `FN-CB-410a`) | **Real** disclosure taxonomies |
| `COMPANIES` (12) | Real company names, sectors, tickers, plausible LEI-format codes, report year 2024 | Real entity identities; LEI codes follow correct 20-character ISO 17442 format but are not verified against GLEIF |
| `LLM_MODELS` (4) | Claude Opus 4 ($0.015/1k, 94% accuracy), GPT-4o ($0.010/1k, 91%), Gemini 1.5 Pro ($0.007/1k, 88%), Mistral Large ($0.004/1k, 83%) | Plausible relative cost/accuracy ordering (higher cost → higher stated accuracy) but the specific accuracy percentages are illustrative, not benchmarked |
| `LOW_CONF_REASONS` (6) | "Ambiguous language," "No quantitative data found," "Outdated reference," "Scope boundary not defined," "Partial disclosure," "Contradictory values" | Plausible, realistic NLP-extraction failure modes, randomly assigned rather than diagnosed |
| Confidence formula constants (`0.45`, `0.53`, thresholds `0.55`/`0.65`) | Author-chosen, not calibrated to any labelled corpus |
| `uploadedFiles` (3 hard-coded rows) | `Shell_Annual_Report_2024.pdf` (312pp), `Shell_TCFD_Report_2024.pdf` (68pp), `Shell_ESG_Data_2024.xbrl` | Static UI decoration — no file upload or parsing logic reads these |

### 7.3 Calculation walkthrough

- **Extraction Studio tab**: user selects a company, an LLM model, and a subset of frameworks;
  `extractionResults` regenerates the full per-field fabricated table (confidence, extracted
  value, page reference, low-confidence reason) keyed only on `selectedCompany.id` and field index —
  the selected LLM model has **no effect on the extraction outcome** (its `avg_accuracy`/`cost_per_1k`
  fields are displayed but never fed into the `conf` formula).
- **Value formatting**: flag fields render "Yes"/"NOT FOUND"; `%` fields render
  `sr(seed+i*2)×80+10` formatted to 1dp; all other units render a fabricated `kpiVal` formatted with
  thousands separators — producing numbers that look precisely sourced (e.g. "487,213 tCO2e") but are
  pure noise.
- **Summary stats**: `avgConf = mean(confidence of extracted fields)`, `tokens =
  floor(sr(company.id×13)×40000+60000)` — a fabricated token-count figure for the (non-existent) LLM
  call.
- **Framework Coverage tab**: `covered = count(sr(seed+i*9) > 0.38)` per framework — a **second,
  independent** seeded coverage calculation (not reusing `extractionResults.extracted`), so the
  "coverage %" shown on this tab will generally **disagree** with the extraction-count implied by the
  Extraction Studio tab for the same company/framework combination.
- **Confidence Intelligence tab** (scatter): plots `x = sr(r.id or i*3)×10` against `y = confidence` —
  the x-axis is itself another independent random draw, not a meaningful second dimension (e.g. not
  document position or field complexity), so the scatter has no real bivariate structure.
- **KPI Extraction tab**: `extracted_value = sectorAvg × (0.5 + sr(seed+i*11)×0.9)`, `delta =
  extracted − sectorAvg` — compares a fabricated "extracted" figure against a `sectorAvg` reference
  (not shown in the excerpt but presumably also static), producing a fabricated "vs sector" delta.
- **Multi-Doc Comparison tab**: `companyScores` computes a composite `score = round(completeness×0.35
  + confidence×100×0.30 + quantRate×0.25 + assured×0.10)` per comparison company, where
  `completeness`, `confidence`, `quantRate`, and `assured` are each independently
  `sr()`-seeded — a real-looking weighted composite built entirely from unrelated random draws.

### 7.4 Worked example

Shell plc (`id=1`): `seed = 1×31 = 31`. For ESRS field index `i=0` (`E1-6` GHG Scope 1):
`conf = 0.45 + sr(31+0)×0.53 = 0.45 + sr(31)×0.53`. `sr(31) = frac(sin(32)×10000)`;
`sin(32 rad) ≈ 0.5514` → `frac(5514.4) = 0.4426` → `conf ≈ 0.45+0.4426×0.53 = 0.685`. Since
`0.685 > 0.55`, the field is marked **extracted**; since `0.685 ≥ 0.65`, it is **not** flagged
low-confidence. `pageRef = floor(sr(31+0)×280)+20 = floor(0.4426×280)+20 = floor(123.9)+20 = 143`.
`kpiVal = sr(31+0×3)×900000+1000 = sr(31)×900000+1000 ≈ 399,340` → displayed as "Shell's GHG Scope 1
= 399,340 tCO2e, page 143" — entirely fabricated but formatted indistinguishably from a genuine
extraction.

### 7.5 Data provenance & limitations

- **No document is ever parsed and no LLM API is ever called.** Every "extracted" value, confidence
  score, page reference, and low-confidence reason across all 5 tabs is generated by the platform's
  seeded PRNG. A user could easily mistake this for a real extraction result given the realistic
  formatting (page numbers, thousands separators, plausible reason strings).
- The 4-model LLM comparison (Claude Opus 4 / GPT-4o / Gemini 1.5 Pro / Mistral Large) has cost and
  accuracy figures that are illustrative approximations of real-world relative model positioning, not
  benchmarked against this platform's actual usage.
- Framework Coverage and Extraction Studio tabs use **independently seeded** coverage calculations
  for the same company/framework — an internal-consistency gap a careful user could notice by
  cross-referencing tabs.
- The Multi-Doc Comparison composite score's 35/30/25/10 weighting is author-chosen with no external
  calibration and is applied to entirely fabricated sub-metrics.

**Framework alignment:** ESRS, ISSB, TCFD, GRI, and SASB data-point taxonomies are genuinely accurate
subsets of the real standards — this module's most defensible contribution is as a **reference
catalogue** of cross-framework disclosure codes. The guide's stated NLP methodology (NER + span
extraction + Platt-scaled confidence) describes real, established ESG-extraction techniques used by
production systems, but none of it is implemented here.

## 9 · Future Evolution

### 9.1 Evolution A — Build the real pipeline the console simulates, with a measured eval corpus (analytics ladder: rung 1 → 2)

**What.** §7's finding is that this module is a *simulation of itself*: no document is ever parsed, no LLM is ever called — "extractions" are seeded draws (`conf = 0.45 + sr(...)·0.53` thresholded at 0.55), page references are random integers, KPI values are noise, and the guide's Platt-scaled `ECS = P(entity)×P(value)×P(unit)` has no implementation. What *is* real and valuable: authentic taxonomy data (ESRS E1-6, S1-16; SASB FN-CB-410a), 12 correctly-identified companies with plausible LEIs, and a well-designed console UX for review workflows. Evolution A builds the actual backend: document upload/storage → parsing (text + table extraction) → LLM extraction against the taxonomy field definitions → per-field confidence → the accept/correct/reject review loop persisting validated datapoints — and, critically, the evaluation corpus the guide pretends exists: a labelled set of real sustainability reports (~20 documents, field-level ground truth) so precision/recall/ECS-calibration are *measured* numbers on the Framework Coverage tab, not draws.

**How.** (1) `POST /esg-extractor/run` orchestrating parse → chunk → extract → map → score, with results in `esg_extractions` (value, unit, evidence snippet, page, taxonomy id, confidence, review state). (2) Confidence starts as model-reported per-field scores; Platt calibration added once the eval corpus provides labels — the §5 formula becomes achievable in stages, honestly labeled. (3) Model routing per the `LLM_MODELS` cost/accuracy table, now with measured accuracy per model. (4) The roadmap's `bench_llm.py` concept applies directly: extraction quality gates every prompt/model change.

**Prerequisites.** Document pipeline; eval-corpus labelling effort (the binding cost — budget it explicitly); Claude API integration per the platform's LLM architecture. **Acceptance:** an uploaded real report yields extractions with verifiable page-anchored evidence snippets; published precision/recall on the eval set; review decisions persist and feed the metrics.

### 9.2 Evolution B — Become the platform's extraction service (LLM tier 2, as infrastructure)

**What.** This module's LLM-native evolution is not a copilot bolted on — it *is* the platform's designated extraction infrastructure: the atlas records for `issb-materiality` (§8.4: "route through the platform's llm-esg-extractor to auto-populate disclosure evidence"), `iris-metrics`, `living-wage`, `insurance-transition` and `invoice-parser` all name this module as their document-to-structured-data feeder. Evolution B productises that role: a shared internal API (`POST /esg-extractor/extract-for/{module}`) where consumer modules register their target schemas (ISSB disclosure items, IRIS+ codes, wage tables), and extractions flow into each module's review queue with taxonomy-mapped, evidence-cited candidates.

**How.** Per-consumer extraction profiles (taxonomy subset, unit rules, validation constraints) derived from the Atlas records of the consuming modules; the no-fabrication contract applies at the service boundary — every emitted datapoint carries evidence text, page, and confidence, and consumers must hold candidates in review state until confirmed (the pattern already specified in five sibling evolution files). A thin copilot layer answers extraction-ops questions ("why was this field low-confidence?" — grounded in the real `LOW_CONF_REASONS` classification once it's model-derived; "which ESRS datapoints does this report not cover?"). Trace logging into `llm_traces` feeds the roadmap's tier-4 data flywheel.

**Prerequisites (hard).** Evolution A end-to-end first — consumer modules must not integrate against a simulator. Cross-module schema registry. **Acceptance:** at least two consumer modules receive real extractions through the service; every datapoint carries evidence + confidence + review state; extraction traces logged for evaluation.