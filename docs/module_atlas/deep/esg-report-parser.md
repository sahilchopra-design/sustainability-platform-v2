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
