# ESG Report Parser
**Module ID:** `esg-report-parser` · **Route:** `/esg-report-parser` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
AI-powered extraction engine that automatically parses PDF and HTML sustainability reports, integrated annual reports, and CDP questionnaire responses to extract structured ESG KPIs, targets, and commitments. Uses LLM-based document intelligence to handle inconsistent report formats, multiple languages, and non-tabular disclosures. Outputs structured data to the ESG Ratings Hub and entity 360 profiles.

> **Business value:** Scales ESG data collection from hundreds to thousands of companies without proportional analyst headcount growth, dramatically reducing time-to-insight for ESG research teams while maintaining a documented, reproducible extraction audit trail for regulatory and client audit purposes.

**How an analyst works this module:**
- Upload sustainability report PDF or provide URL; select target KPI schema (GRI, SASB, TCFD, ESRS, or custom).
- Review extraction results with confidence scores; approve auto-ingested items and assign analyst review for low-confidence extractions.
- Resolve multi-value conflicts by selecting authoritative disclosure and documenting rationale.
- Publish extracted KPIs to ESG Ratings Hub and entity profiles; schedule annual re-parse for the next reporting cycle.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_TOPICS`, `DEMO_TEXT`, `FRAMEWORKS`, `FRAMEWORK_MAPPING`, `HISTORY_ROWS`, `INTEGRATION_CARDS`, `NLP_QUALITY_TREND`, `OIL_MAJORS`, `PARSE_STEPS`, `PILLAR_COLORS`, `SHARED_KPIS`, `TOPIC_KEYWORDS`, `TOPIC_LABELS`, `TOPIC_PILLAR`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `OIL_MAJORS` | 6 | `name`, `ticker`, `climate`, `water`, `biodiversity`, `social`, `governance`, `disclosure` |
| `SHARED_KPIS` | 6 | `shell`, `bp`, `total`, `equinor`, `eni`, `repsol` |
| `HISTORY_ROWS` | 8 | `ts`, `doc`, `fw`, `complete`, `status` |
| `NLP_QUALITY_TREND` | 5 | `precision`, `recall`, `f1`, `procMs` |
| `INTEGRATION_CARDS` | 5 | `path`, `desc`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FRAMEWORKS` | `['ESRS', 'ISSB S1/S2', 'TCFD', 'GRI', 'SASB', 'CDP'];` |
| `base` | `Math.min(0.95, 0.45 + matches.length * 0.06 + sr(i * 7) * 0.15);` |
| `val` | `m ? m[1].replace(/,/g, '') : (sr(i * 3) * 50 + 10).toFixed(1);` |
| `sentences` | `text.split(/[.!?]+/).filter(s => s.trim().length > 20).slice(0, 30);` |
| `numRe` | `/\b([\d,\.]+)\s*(million\|billion\|%\|Mt\|kt\|PJ\|TWh\|MWh\|GW\|MW\|Mm³\|m³\|USD\|tCO2e\|kgCO2e)?\b/g;` |
| `pill` | `(color, bg) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, background: bg, color, fontSize: 11, fontWeight: 600 });` |
| `filteredTopics` | `useMemo(() => topics.filter(t => t.confidence >= threshold), [topics, threshold]);  const topicBarData = useMemo(() => filteredTopics.map(t => ({ name: TOPIC_LABELS[t.topic].slice(0, 14), confidence: +(t.confidence * 100).toFixed(1), matches: t.matches, fill: PILLAR_COLORS[t.pillar]` |
| `completenessScores` | `useMemo(() => FRAMEWORKS.map(fw => { const covered = ALL_TOPICS.filter(t => FRAMEWORK_MAPPING[t]?.[fw] && FRAMEWORK_MAPPING[t][fw] !== 'n/a').length;` |
| `detected` | `filteredTopics.filter(t => FRAMEWORK_MAPPING[t.topic]?.[fw] && FRAMEWORK_MAPPING[t.topic][fw] !== 'n/a').length;` |
| `quantQuality` | `useMemo(() => [ { year: 2020, pct: 41 + Math.round(sr(10) * 8) }, { year: 2021, pct: 47 + Math.round(sr(11) * 8) }, { year: 2022, pct: 54 + Math.round(sr(12) * 8) }, { year: 2023, pct: 62 + Math.round(sr(13) * 8) }, { year: 2024, pct: 69 + Math.round(sr(14) * 8) } ], []);` |
| `selectedCompanies` | `useMemo(() => OIL_MAJORS.filter(c => selectedCos.includes(c.id)), [selectedCos]); const radarData = useMemo(() => ['Climate', 'Water', 'Biodiversity', 'Social', 'Governance', 'Disclosure'].map(dim => { const key = dim.toLowerCase().replace('disclosure', 'disclosure');` |
| `dot` | `dims.reduce((s, d) => s + a[d] * b[d], 0);` |
| `magA` | `Math.sqrt(dims.reduce((s, d) => s + a[d] ** 2, 0));` |
| `magB` | `Math.sqrt(dims.reduce((s, d) => s + b[d] ** 2, 0));` |
| `unitNorm` | `useMemo(() => [ { raw: 'kt CO2', standard: 'tCO2e', factor: '1,000×', example: '4,200 kt → 4.2 MtCO2e' }, { raw: 'million m³', standard: 'm³', factor: '1,000,000×', example: '48.2 Mm³ → 48,200,000 m³' }, { raw: 'PJ', standard: 'GWh', factor: '277.8×', example: '312 PJ → 86,666 GWh' }, { raw: 'per million hrs', standard: '/Mhrs', factor: '` |
| `TABS` | `['Smart Parser', 'Framework Extraction', 'NER & KPI', 'Multi-Doc Compare', 'Export & Integrate'];` |
| `delta` | `(sr(i * 9) * 20 - 10).toFixed(1);` |
| `conf` | `sr(fi * 7 + ci * 3);` |
| `vals` | `selectedCompanies.map(c => row[c.id]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_TOPICS`, `FRAMEWORKS`, `HISTORY_ROWS`, `INTEGRATION_CARDS`, `NLP_QUALITY_TREND`, `OIL_MAJORS`, `PARSE_STEPS`, `RADAR_COLORS`, `SHARED_KPIS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| KPI Extraction Coverage (%) | — | Parser Output | Proportion of target ESG KPIs successfully extracted from document; benchmark: 70%+ for GRI-indexed reports. |
| Extraction Confidence Score (0â€“100) | — | LLM Confidence Model | Weighted average ECS across all extracted values; low scores indicate complex or non-standard disclosure formats. |
| Multi-Value Conflict Rate (%) | — | Parser QC Module | Percentage of KPIs with conflicting values across report sections; high rate indicates disclosure inconsistency or restatement. |
| Assurance Level Flag | — | Report Metadata | Highest level of independent assurance applied to disclosures (None/Limited/Reasonable); affects downstream data quality score. |
- **Corporate sustainability report PDFs and HTML pages** → OCR scanned pages; split by section using heading detection; run LLM extraction with GRI/SASB KPI schema → **Structured KPI table with value, unit, year, page reference, and ECS**
- **CDP questionnaire XML/CSV responses** → Parse standard CDP response format; map module answers to GHG Protocol and TCFD disclosure taxonomy → **CDP-sourced KPIs with assurance flag and disclosure quality indicator**
- **EDGAR/SEDAR regulatory filings** → Extract climate risk disclosures from 10-K Item 1C; identify quantified vs. qualitative disclosures → **TCFD-mapped disclosures with narrative vs. quantitative classification**

## 5 · Intermediate Transformation Logic
**Methodology:** Extraction Confidence Score
**Headline formula:** `ECS = P(correct extraction) × (1 − Ambiguity) × SourceQuality`

Bayesian extraction confidence combining model probability of correct parsing, ambiguity penalty from multi-value or contradictory disclosures, and source quality factor (audited > unaudited > estimated). ECS >80% qualifies for auto-ingestion; ECS 50â€“80% routes to analyst review queue; ECS <50% triggers manual extraction flag.

**Standards:** ['GRI Universal Standards 2021', 'SASB Standards 2023', 'TCFD Framework']
**Reference documents:** GRI Universal Standards 2021 â€” Reporting Principles and Disclosures; SASB Standards Codification 2023; TCFD Guidance on Metrics and Targets 2021; EFRAG ESRS 2 â€” General Disclosures 2023; CDP Technical Note on Data Quality 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is unusually real for a "parser": it performs **genuine regex-based KPI extraction and
keyword topic detection on the actual document text** the user pastes (default: a full synthetic
Meridian Energy sustainability report). Topic detection, KPI value extraction, named-entity
recognition and framework mapping all operate on the real text — the `sr()` PRNG is used only for
confidence jitter and as a fallback value when a regex fails to match. The guide's Bayesian
Extraction Confidence Score (`ECS = P(correct)×(1−Ambiguity)×SourceQuality`) is approximated by a
keyword-count-driven confidence rather than that exact product; no full ⚠️ flag, but the confidence
model is a heuristic (§7.5).

### 7.1 What the module computes

**Topic detection** (real keyword matching):

```js
matches    = TOPIC_KEYWORDS[topic].filter(k => text.toLowerCase().includes(k)).length
confidence = min(0.95, 0.45 + matches×0.06 + sr(i*7)×0.15)      // more keyword hits → higher confidence
detected   = topics with confidence > 0.6
```

**KPI extraction** (real regex on the text):

```js
// e.g. Scope 1: /scope\s*1[^.]*?([\d,\.]+)\s*(million|mn|m)?\s*t\s*co2/i
m   = text.match(pattern.regex)
val = m ? m[1].replace(/,/g,'') : (sr(i*3)*50+10).toFixed(1)     // fallback only if no match
confidence = 0.72 + sr(i*5)×0.24
```

**NER** scans numeric/percent/year tokens and classifies them (Value / Percentage / Year). **Framework
mapping** (`FRAMEWORK_MAPPING`) is a curated crosswalk of each topic to its ESRS / ISSB / TCFD / GRI /
SASB / CDP disclosure reference.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Topic confidence | `0.45 + matches×0.06 + sr×0.15`, cap 0.95 | heuristic; base 0.45, +0.06/keyword |
| Detection threshold | confidence > 0.6 | platform convention |
| KPI regexes | Scope 1/2/3, carbon intensity, renewables %, energy PJ, water, employees, TRIFR, women-in-leadership | real regex patterns matching report phrasing |
| KPI confidence | `0.72 + sr×0.24` | synthetic jitter |
| FRAMEWORK_MAPPING (18 topics × 6 frameworks) | e.g. climate→ESRS E1-6 / ISSB S2-C1 / TCFD Metrics / GRI 305 / SASB EM-EP-110a / CDP C6.1 | curated real disclosure crosswalk |
| TOPIC_PILLAR | 18 topics → E/S/G | correct pillar assignment |

The `FRAMEWORK_MAPPING` is accurate reference content (GRI 305 for climate, GRI 303 for water, ESRS
E1–E5/S1–S4/G1 codes, SASB EM-EP metrics) — genuinely useful for a disclosure-mapping workflow.

### 7.3 Calculation walkthrough

1. User pastes/loads report text (defaults to the embedded Meridian report).
2. `detectTopics`: for each of 18 topics, count keyword hits in the lowercased text → confidence.
3. `extractKPIs`: run 10 regexes; on match, capture the numeric value (comma-stripped); else fall back
   to a seeded placeholder.
4. `extractNER`: tokenise numbers/percents/years, classify, attach confidence.
5. Build a JSON export (`meta`, `topics_detected` filtered to confidence>0.6, `kpis`, entities).
6. Framework tab: map each detected topic to its ESRS/ISSB/TCFD/GRI/SASB/CDP reference.

### 7.4 Worked example — Scope 1 extraction from the demo text

The demo text contains *"total Scope 1 emissions were 4.2 million tCO2e"*. The regex
`/scope\s*1[^.]*?([\d,\.]+)\s*(million|mn|m)?\s*t\s*co2/i` matches, capturing `m[1] = "4.2"` →
`val = "4.2"`, unit `MtCO2e`. This is a **real extraction from the document** — no PRNG. For topics,
"climate" keywords `[carbon, emission, ghg, scope 1, scope 2, scope 3, net zero, sbti, 1.5]` mostly hit
in the text (≈8 matches) → `confidence = min(0.95, 0.45 + 8×0.06 + sr×0.15) = min(0.95, ≈0.93+jitter) =
0.95` → detected. A topic with 0 keyword hits gets `0.45 + sr×0.15 ≈ 0.5` → below the 0.6 threshold →
not detected. The pipeline correctly surfaces the topics actually present in the report.

### 7.5 Data provenance & limitations

- **Extraction is genuinely performed on the input text** via regex/keyword matching — the KPI values
  and detected topics reflect the actual document, not `sr()` (which only jitters confidence and
  provides fallback values when a regex misses).
- **Confidence is a heuristic**, not the guide's Bayesian `P(correct)×(1−Ambiguity)×SourceQuality`:
  topic confidence is `0.45 + 0.06/keyword`; KPI confidence is a seeded band around 0.8. Ambiguity and
  source-quality factors are not computed.
- Regex extraction is brittle to phrasing (only ~10 KPI patterns; a differently-worded report yields
  the seeded fallback). No unit reconciliation, no multi-value disambiguation.
- `FRAMEWORK_MAPPING` is a static crosswalk (accurate but not exhaustive; many `n/a` cells).

**Framework alignment:** the disclosure crosswalk is real and useful — **ESRS** (E1 climate, E2
pollution, E3 water, E4 biodiversity, E5 resources, S1–S4 social, G1 governance), **ISSB IFRS S1/S2**,
**TCFD** (Governance/Strategy/Risk/Metrics), **GRI** (305 emissions, 303 water, 403 safety, 405
diversity, 205 anti-corruption, 207 tax), **SASB** (EM-EP oil-&-gas metrics) and **CDP** questionnaire
references. The parser approximates a production NLP disclosure-extraction pipeline with regex + keyword
heuristics rather than an ML model.

### 8 · Model Specification

**Status: specification — not yet implemented in code** (the regex parser is real but the guide's
Bayesian confidence model is not).

**8.1 Purpose & scope.** Extract structured ESG KPIs and topic coverage from unstructured
sustainability reports with a calibrated extraction-confidence score, to auto-populate downstream
modules (ratings, portfolio, regulatory gap).

**8.2 Conceptual approach.** Replace brittle regex with an NER/relation-extraction model (transformer
token-classifier fine-tuned on ESG reports) plus a **Bayesian confidence** combining model probability,
ambiguity and source quality — the guide's ECS.

**8.3 Mathematical specification.**
- Model prob: `p_correct` = softmax confidence of the extraction head for the (metric, value, unit)
  triple.
- Ambiguity: `A = 1 − 1/n_candidates` (n competing values for the same metric in-doc).
- Source quality: `Q ∈ {audited 1.0, unaudited 0.8, estimated 0.6}` from assurance metadata.
- `ECS = p_correct × (1 − A) × Q`; accept extraction if `ECS > 0.8`, flag 0.5–0.8 for review.

| Parameter | Source |
|---|---|
| Extraction model | transformer fine-tuned on GRI/ESRS-tagged reports |
| Source quality Q | assurance statement (ISAE 3000 / limited vs reasonable) |
| Accept threshold 0.8 | guide (ECS>80% qualifies) |
| Framework crosswalk | ESRS/ISSB/GRI/SASB/CDP official mappings |

**8.4 Data requirements.** Report text (PDF/HTML → text), assurance metadata, a labelled ESG-KPI
training corpus. Text ingestion already exists; assurance metadata and the model are new.

**8.5 Validation & benchmarking plan.** Precision/recall of extracted KPIs vs a human-labelled hold-out;
calibration of ECS (reliability diagram); benchmark against commercial ESG-extraction vendors.

**8.6 Limitations & model risk.** Regex fallback (current) fabricates values on miss — dangerous if
consumed downstream; ML models hallucinate values/units; assurance metadata often absent; report
phrasing drift degrades recall.

## 9 · Future Evolution

### 9.1 Evolution A — A real extraction service with measured, not decorative, quality (analytics ladder: rung 1 → 3)

**What.** §7 rates this "unusually real for a parser": genuine in-browser regex KPI extraction (unit-aware `numRe`, sentence segmentation, topic-keyword matching), a real framework-mapping table across ESRS/ISSB/TCFD/GRI/SASB/CDP, and honest unit-normalization examples. What's not real: the promised LLM extraction doesn't exist, confidence blends in `sr()` terms (`base = 0.45 + matches·0.06 + sr·0.15`), and the `NLP_QUALITY_TREND` precision/recall figures, parse history, and oil-major comparison tables are curated fiction. Evolution A builds the backend service — the ingestion utility half the atlas's other §9 entries depend on.

**How.** (1) `api/v1/routes/report_parser.py` + `parsed_documents` / `extracted_kpis` tables (value, unit, year, page reference, ECS, framework mapping) — the persistence that makes "documented, reproducible extraction audit trail" true. (2) Two-stage extraction: the existing regex/keyword pass as the cheap first cut, Claude-based structured extraction (typed KPI schema per framework) for the hard cases — with the §5 ECS formula computed from real signals (model confidence, multi-value ambiguity, assurance-level source quality) instead of seeded terms. (3) Measured quality: a hand-labeled 200-KPI golden set; precision/recall computed per release and displayed where the fake trend chart sits today — that measurement is what earns rung 3. (4) Publish path: approved extractions flow to `esg_score_history`/entity profiles as the §4 lineage promises, with page-reference provenance carried through.

**Prerequisites.** Golden-set labeling effort; PDF pipeline choice (the platform's existing document tooling); cost benchmarking for the LLM pass. **Acceptance:** a real report upload yields KPIs each carrying page reference and computed ECS; released precision/recall comes from the golden-set run; the seeded quality trend and history tables are deleted.

### 9.2 Evolution B — Extraction-review workbench with confidence routing (LLM tier 2)

**What.** The module's own §5 defines the workflow: ECS >80% auto-ingests, 50–80% routes to analyst review, <50% flags manual extraction. Evolution B is the review workbench's assistant: for each queued extraction it presents the value, the verbatim source passage, and competing candidates for multi-value conflicts; the analyst asks "why did it read 4.2 Mt when page 61 says 4,200 kt?" and the assistant explains the unit normalization applied (the module's own conversion table), or concedes an error and corrects with re-extraction — every resolution logged with rationale per the conflict-resolution workflow the overview describes.

**How.** Tools: `get_review_queue(threshold_band)`, `get_extraction_context(kpi_id)` (source spans + candidates), `re_extract(document, kpi, hint)`, `resolve_conflict(kpi_id, chosen, rationale)` (gated mutation). The grounding rule is span-fidelity: every explanation quotes stored passages; corrections re-run extraction rather than letting the assistant type a number. Approved resolutions feed the golden set — the review loop becomes the training-data flywheel the roadmap's tier-4 stage needs.

**Prerequisites (hard).** Evolution A end-to-end — there is no queue, no stored spans, and no real ECS to route on today. **Acceptance:** every queued item shows its source span; conflict resolutions persist with analyst attribution; assistant-suggested corrections match re-extraction output, never free-typed values; resolution rationales are exportable for audit.