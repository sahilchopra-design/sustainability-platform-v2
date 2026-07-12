# Carbon Accounting AI
**Module ID:** `carbon-accounting-ai` · **Route:** `/carbon-accounting-ai` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
LLM-powered extraction of emissions data from invoices, utility bills, supplier documents, and product datasheets using structured information extraction and confidence scoring. Automates Scope 1, 2, and 3 Category 1 data collection, reducing manual GHG inventory effort by 60–80%. Integrates extracted data directly into the platform GHG calculation engine with data quality flags.

> **Business value:** AI-powered carbon accounting addresses the primary bottleneck in enterprise Scope 3 data collection: the manual effort of extracting activity data from thousands of unstructured supplier documents. By automating 90%+ of extraction with human-in-the-loop validation for low-confidence cases, the engine accelerates GHG inventory closure from months to days.

**How an analyst works this module:**
- Upload batch of invoices, utility bills, or supplier ESG documents
- Extraction Queue tab shows processing status per document with confidence scores
- Field Review tab presents low-confidence extractions for human validation
- Emission Factor Matching links extracted activity data to IPCC AR6 factors
- GHG Summary integrates extracted data into Scope 1/2/3 inventory
- Audit Trail records each extraction with source, model version, and confidence

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIVITY_CATS`, `API`, `Btn`, `CONSOLIDATION`, `Inp`, `KpiCard`, `REPORTING_STANDARDS`, `Row`, `Section`, `Sel`, `TABS`, `UNITS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ACTIVITY_CATS` | 9 | `label` |
| `UNITS` | 7 | `label` |
| `REPORTING_STANDARDS` | 5 | `label` |
| `CONSOLIDATION` | 4 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `ghgScore` | `Math.round((ghgReqList.filter(r => r.status === 'Pass').length / ghgReqList.length) * 100);` |
| `cdpAvg` | `Math.round((parseFloat(govS) + parseFloat(riskS) + parseFloat(targS) + parseFloat(emisS) + parseFloat(enerS)) / 5);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|

### 2.3 Engine `carbon_accounting_ai_engine` (services/carbon_accounting_ai_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CarbonAccountingAIEngine.check_ghg_compliance` | d | Check completeness of GHG disclosures against GHG Protocol requirements. Returns: compliance_pct: overall compliance percentage criterion_scores: per-criterion pass/fail/partial gaps: list of identified compliance gaps recommendations: actionable improvement suggestions |
| `CarbonAccountingAIEngine.match_emission_factor` | query | Match an activity description to emission factor databases using keyword scoring. Returns best-match EF, confidence score, data quality tier, and alternatives. |
| `CarbonAccountingAIEngine.classify_scope3_category` | tx | Auto-classify a financial transaction into GHG Protocol Scope 3 Category 1-15. Uses keyword matching on description + SIC code range matching. Returns primary category, confidence, FLAG/non-FLAG, DQS. |
| `CarbonAccountingAIEngine.derive_dqs_score` | metadata_input | ML-based DQS (Data Quality Score) derivation from metadata. Five input features: 1. data_source: primary_measurement / supplier_specific / industry_average / spend_based / estimate 2. verification_status: third_party_reasonable / third_party_limited / internal_review / unverified 3. measurement_approach: direct_measurement / calculation_primary / calculation_secondary / spend_proxy 4. coverage_pct |
| `CarbonAccountingAIEngine.auto_tag_xbrl` | d | Map GHG disclosure fields to ESRS XBRL taxonomy tags. Returns tagged concepts, tagging confidence, mandatory/optional flags, and untaggable fields. |
| `CarbonAccountingAIEngine.score_cdp_response` | cdp_input | Score CDP Climate questionnaire responses for A-list gap analysis. Scores C1-C12 sections based on completeness and quality indicators. Returns section scores, overall band, and gaps to reach next band. |
| `CarbonAccountingAIEngine.analyse_data_gaps` | d | Identify missing data fields, recommend proxy methodologies, estimate DQS improvement potential, and calculate materiality-weighted gap score. |
| `CarbonAccountingAIEngine.full_assessment` | d | Run all Carbon Accounting AI sub-modules and return a consolidated result. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `GHG`, `Scope`, `exc` *(shared)*, `fastapi` *(shared)*, `metadata`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ACTIVITY_CATS`, `CONSOLIDATION`, `REPORTING_STANDARDS`, `TABS`, `UNITS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Extraction Accuracy | — | Human review benchmark | Percentage of LLM-extracted fields matching human-verified ground truth |
| Processing Speed | — | Platform throughput | Volume of supplier/utility documents processed per hour by the AI extraction pipeline |
| Scope 3 Cat 1 Coverage | — | GHG inventory completeness | Percentage of purchased goods/services spend with AI-extracted supplier emission data |
- **Supplier invoices, utility bills, product datasheets (PDF/image)** → LLM extraction of activity data fields; confidence scoring; route low-confidence to human review → **Structured emission activity records with confidence flags and source document links**
- **IPCC AR6 emission factor database** → Match extracted fuel/energy type to AR6 factor; compute GHG contribution → **Per-document GHG contribution integrated into Scope 1/2/3 inventory**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/carbon-accounting-ai/ref/cdp-questionnaire** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['questionnaire', 'total_sections', 'scoring_reference', 'a_list_threshold_pct', 'bands'], 'n_keys': 5}`

**GET /api/v1/carbon-accounting-ai/ref/ef-databases** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['databases', 'total_databases', 'total_activity_categories', 'note'], 'n_keys': 4}`

**GET /api/v1/carbon-accounting-ai/ref/scope3-classification-rules** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['categories', 'total_categories', 'reference', 'flag_note'], 'n_keys': 4}`

**GET /api/v1/carbon-accounting-ai/ref/xbrl-concepts** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_concepts', 'mandatory_count', 'optional_count', 'mandatory_concepts', 'optional_concepts', 'taxonomy_reference', 'format'], 'n_keys': 7}`

**POST /api/v1/carbon-accounting-ai/assess** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['entity_name', 'reporting_year', 'overall_readiness_score', 'priority_actions', 'ghg_compliance', 'ef_matching', 'scope3_classification', 'dqs_score', 'xbrl_tagging', 'cdp_scoring', 'data_gaps'], 'n_keys': 11}`

**POST /api/v1/carbon-accounting-ai/cdp-scoring** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/carbon-accounting-ai/data-gaps** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/carbon-accounting-ai/dqs-derivation** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** LLM structured extraction with confidence scoring
**Headline formula:** `Extraction_confidence = P(field_correct | extracted_value, source_type); GHG_contribution = Activity_data × EF_IPCC_AR6`

A fine-tuned LLM extracts key fields (energy quantity, unit, fuel type, period, supplier) from unstructured documents. Confidence scoring uses a calibrated uncertainty model trained on human-verified extraction pairs. Low-confidence extractions are routed to human review queue. Activity data is matched to IPCC AR6 emission factors for GHG calculation.

**Standards:** ['GHG Protocol Corporate Standard', 'IPCC AR6 Emission Factors', 'ISO 14064-1']
**Reference documents:** GHG Protocol Corporate Accounting and Reporting Standard; IPCC AR6 WGI Chapter 7 Emission Factors; ISO 14064-1:2018 GHG Inventory

**Engine `carbon_accounting_ai_engine` — extracted transformation lines:**
```python
score = matches / max(len(kws), 1)
confidence = min(best_score * 1.5, 0.95)
scores[rule_key] = kw_score * 0.7 + sic_score * 0.3
confidence = min(sorted_cats[0][1] * 1.2, 0.92)
coverage_score = coverage / 100.0
recency_score = max(0.0, 1.0 - recency * 0.15)
total = d.scope1_tco2e + d.scope2_location_tco2e + s3_total
coverage_pct = round(mandatory_tagged / max(mandatory_total, 1) * 100, 1)
section_score = completeness * 0.5 + quality * 0.35 + (0.15 if has_evidence else 0.0)
missing_critical = critical_cats - reported_cats
overall_gap_score = round(materiality_weighted_gap * 100, 1)
overall_readiness_score=round(readiness * 100, 1),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **46** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |
| `crrem` | table:exc |
| `climate-underwriting-workbench` | table:exc |
| `battery-revenue-stacker` | table:exc |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an *LLM-powered document
> extraction* pipeline — "a fine-tuned LLM extracts key fields … from unstructured documents",
> "confidence scoring uses a calibrated uncertainty model trained on human-verified extraction
> pairs", 90–97% extraction accuracy, NER, human-review queue. **None of that exists in the code.**
> There is no model inference, no document upload/parsing, no NER, no trained confidence model.
> What actually ships is (a) a **React compliance-checklist calculator** (`CarbonAccountingAIPage.jsx`)
> driven by dropdown booleans and a seeded PRNG for demo confidence numbers, and (b) a **deterministic
> rule-based backend engine** (`carbon_accounting_ai_engine.py`) with a genuine curated emission-factor
> library and weighted GHG-Protocol scoring. The "AI" is branding; the real logic is lookup + rules.
> The sections below document what the code computes.

### 7.1 What the module computes

Five tabs, each a self-contained rule engine:

1. **GHG Compliance** — an 8-item requirements checklist. Score is a pure ratio:
   `ghgScore = round(passCount / 8 × 100)`. Four items (`boundary`, `baseRestated`, `verified`,
   `uncertainty`) toggle Pass/Fail from user dropdowns; the other four are hard-coded Pass/Partial.
2. **EF Matching** — returns candidate emission factors for the chosen activity. For `electricity`
   and `natural_gas` the values are **real, hard-coded** (IEA/IPCC/ecoinvent/DEFRA); for every other
   category the four rows are **synthetic** (`seed()` PRNG generating value, confidence, DQS).
3. **Scope 3 Classify** — screens the 15 GHG-Protocol categories, each with a demo probability
   `prob = (seed(i+120) × 0.9)`.
4. **XBRL Tagging** — 10 ESRS concepts; mandatory flags are real (keyed to `esrs`/`ifrs`), Tagged/
   Untagged status is seeded (`seed(i+140) > 0.4`).
5. **CDP Scoring** — averages five user-entered section scores and maps to a letter grade.

The **backend** engine (`check_ghg_compliance`) is the substantive artefact: it scores 8 weighted
criteria (weights below), accumulates partial credit, emits gaps + recommendations, and returns a
weighted `compliance_pct`.

```python
compliance_pct = Σ_k  scores[k] × GHG_COMPLIANCE_CRITERIA[k]["weight"]
```

### 7.2 Parameterisation / scoring rubric

**Backend GHG compliance weights** (`GHG_COMPLIANCE_CRITERIA`, provenance: engine constants aligned
to GHG Protocol Corporate Standard chapters):

| Criterion | Weight | What earns credit |
|---|---|---|
| boundary_setting | 0.20 | consolidation approach (+0.40), boundary description (+0.40), +0.20 baseline |
| base_year | 0.15 | base year stated (+0.50), + Scope1 present (+0.30), +0.20 |
| scope1_completeness | 0.15 | Scope1 value present (+0.60) + 0.20 by-gas + 0.20 by-facility (assumed partial) |
| scope2_dual_method | 0.10 | location-based (+0.50), market-based (+0.50) |
| scope3_coverage | 0.15 | `min(n_cats/15, 0.60)` + 0.20 if C15 present + 0.20 flag partial |
| verification_status | 0.10 | reasonable→1.0, limited→0.60, none→0 |
| biogenic_carbon | 0.05 | biogenic emissions reported (0.80) + 0.20 removals partial |
| uncertainty_quantification | 0.10 | uncertainty % stated (0.80) + 0.20 |

**Emission-factor library** (`EMISSION_FACTOR_LOOKUP`, 40 activities × databases) is the strongest
real content — e.g. `natural_gas_combustion` = 2.03441 kgCO₂e/m³ (DEFRA 2023), `steel_production`
2170 kgCO₂e/t (ecoinvent 3.9), `refrigerants_hfc134a` GWP 1430 (IPCC AR6). Each carries a PCAF-style
`dqs` 1–5 and Scope/Category tag. These are authentic published factors.

**Frontend EF demo values** (fallback branch of `efMatches`) are `seed()`-generated and carry no
provenance — clearly labelled synthetic.

**CDP letter map** (`cdpLetter`): ≥85→A, ≥75→A-, ≥65→B, ≥55→B-, ≥45→C, else D — a simplified proxy
for CDP's actual banded scoring.

### 7.3 Calculation walkthrough

Frontend GHG tab: user sets four booleans → `ghgReqs()` builds the 8-row list → `ghgScore` counts
Pass rows / 8 × 100. The `call()` helper POSTs to the backend but silently swallows errors and falls
back to the seed-derived KPIs (`ghgResult?.x ?? seedValue`), so the page renders even offline.

Backend path: `GHGDisclosureInput` → `check_ghg_compliance` walks each criterion, adds partial credit,
records gaps, then computes the weighted `compliance_pct`. Scope-3 coverage is the only criterion with
a smooth (non-step) function of an input (`n_cats/15`).

### 7.4 Worked example (backend `check_ghg_compliance`)

Entity reports: consolidation="operational_control", boundary_description present, base_year=2019,
scope1=12,500, scope2_location present, scope2_market **absent**, scope3 = 6 categories incl. C15,
verification="limited", biogenic absent, uncertainty absent.

| Criterion | Sub-scores | Criterion score | × weight |
|---|---|---|---|
| boundary_setting | 0.40+0.40+0.20 | 1.00 | 0.200 |
| base_year | 0.50+0.30+0.20 | 1.00 | 0.150 |
| scope1_completeness | 0.60+0.20+0.20 | 1.00 | 0.150 |
| scope2_dual_method | 0.50 (location only) | 0.50 | 0.050 |
| scope3_coverage | min(6/15,.6)=0.40 +0.20(C15) +0.20 | 0.80 | 0.120 |
| verification_status | limited | 0.60 | 0.060 |
| biogenic_carbon | 0 +0.20 | 0.20 | 0.010 |
| uncertainty_quantification | 0 +0.20 | 0.20 | 0.020 |

`compliance_pct = 0.200+0.150+0.150+0.050+0.120+0.060+0.010+0.020 = 0.760 → **76%**`. Gaps emitted:
market-based Scope 2, biogenic reporting, uncertainty quantification, plus a recommendation to upgrade
limited→reasonable assurance for CSRD Art. 26a.

### 7.5 Data provenance & limitations

- **Frontend confidence/DQS/XBRL-status/Scope-3-probability numbers are synthetic**, from the
  platform PRNG `seed(s) = frac(sin(s+1)×10⁴)` — stable across renders but not measured.
- **Backend EF library is real** (DEFRA 2023, IPCC AR6, ecoinvent 3.9, EPA eGRID 2022, IEA WEO 2023)
  and the compliance weights are defensible, but the partial-credit constants (+0.20 "assumed") are
  heuristics, not evidence-derived.
- No LLM, no document ingestion, no NER, no trained/calibrated confidence model — the guide's central
  claim is unimplemented (see §8).

**Framework alignment:** GHG Protocol Corporate Standard (2004/2015) — boundary, base-year, dual
Scope-2 criteria mirror the standard's requirements · GHG Protocol Scope 3 Standard (2011) — 15
categories with keyword/SIC classification rules · PCAF — DQS 1–5 data-quality scores attached to each
EF and the C15 financed-emissions default method `pcaf_attribution` · ESRS E1-5/E1-6/E1-7 — the XBRL
concept taxonomy maps each datapoint to its ESRS disclosure requirement · CDP C1–C12 — the questionnaire
weighting (`CDP_QUESTIONNAIRE_STRUCTURE`) reproduces CDP's section weights; CDP itself scores by
Disclosure→Awareness→Management→Leadership bands, approximated here by the letter-grade thresholds.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide promises an LLM extraction engine
with calibrated confidence; the code has none. This section specifies the production model.

### 8.1 Purpose & scope
Automate extraction of GHG activity data (quantity, unit, fuel/energy type, period, supplier, spend)
from unstructured supplier invoices, utility bills and datasheets, with a calibrated per-field
confidence used to route low-confidence extractions to human review. Coverage: Scope 1 fuel bills,
Scope 2 utility bills, Scope 3 Cat-1 procurement invoices.

### 8.2 Conceptual approach
Two-stage extract-then-verify pipeline benchmarked against document-AI practice (AWS Textract +
LLM post-processing; Microsoft/Watershed carbon-ledger ingestion; Sylvera/Persefoni data pipelines):
(1) layout-aware OCR + a fine-tuned extraction LLM producing a structured record with token-level
log-probabilities; (2) a **calibrated confidence head** — isotonic/Platt calibration of the LLM's
raw self-reported probability against a human-verified gold set — so that a stated 0.9 means ~90%
empirical field accuracy. Field values then join the platform's real EF library (§7.2) for GHG
contribution. Mirrors the accuracy/human-in-the-loop split used by production carbon-accounting SaaS.

### 8.3 Mathematical specification

For extracted field *f* with candidate value *v* from document *d*:

```
p_raw(f)   = model self-probability (mean token prob over the field span)
p_cal(f)   = g(p_raw(f))            g = isotonic regression fit on gold set (monotone)
accept(f)  = p_cal(f) ≥ τ_f         τ_f per-field threshold (default 0.85)
GHG_d      = Σ_f  Activity(f) × EF_match(f) × GWP100_AR6
DQS_d      = PCAF score ∈ {1..5} from EF_match source tier and value-vs-average match
```

Calibration quality: Expected Calibration Error `ECE = Σ_b (n_b/N)·|acc_b − conf_b|` over 10 bins.

| Parameter | Symbol | Default | Calibration source |
|---|---|---|---|
| Accept threshold | τ_f | 0.85 | tuned to ≤2% error on held-out gold set |
| GWP100 factors | GWP | AR6 Annex II | IPCC AR6 WG1 Ch.7 |
| Emission factors | EF | library (§7.2) | DEFRA 2023 / ecoinvent 3.9 / EPA eGRID 2022 |
| DQS tiers | — | 1–5 | PCAF Standard Part A, Table 5-x |
| Target ECE | — | ≤0.03 | internal SLA |

### 8.4 Data requirements
Fields: raw document image/PDF, extracted {quantity, unit, activity_class, period_start/end,
supplier_name, spend, currency, SIC}. Sources: customer document uploads (new), the existing
`EMISSION_FACTOR_LOOKUP` and `SCOPE3_CLASSIFICATION_RULES` tables (present in engine), a **human-verified
gold-label store** (new) for calibration. Vendor options: AWS Textract / Google Document AI for OCR;
open-weight LLM fine-tuned on GHG documents.

### 8.5 Validation & benchmarking plan
Backtest extraction F1 and per-field accuracy on a held-out gold set (target ≥0.93 F1 on quantity/unit).
Reliability diagram + ECE for confidence calibration (target ECE ≤ 0.03). Reconcile total inventory
against a fully manual GHG inventory for a pilot cohort (±5%). Benchmark auto-classification of Scope 3
categories against analyst labels (Cohen's κ ≥ 0.8).

### 8.6 Limitations & model risk
LLM hallucination of numeric fields is the dominant failure mode — mitigated by requiring the value to
appear verbatim in OCR text before acceptance. Calibration drifts as document formats change; schedule
quarterly recalibration. Conservative fallback: any field below τ_f, or any document below a document-
level confidence floor, is routed to human review rather than auto-booked.

## 9 · Future Evolution

### 9.1 Evolution A — Real document extraction behind the honest scoring engine (analytics ladder: rung 2 → 4)

**What.** The backend `carbon_accounting_ai_engine` is substantial and honest: keyword-scored EF matching with confidence, Scope 3 classification (keyword + SIC), metadata-driven DQS derivation, ESRS XBRL auto-tagging, CDP scoring, and data-gap analysis — the `POST /assess` route passes the harness. But the module's *headline* promise — LLM extraction of activity data from unstructured invoices/utility bills — is **not implemented**: there is no document-ingestion or extraction path, only the downstream scoring/classification of already-structured inputs (the frontend's `ghgScore`/`cdpAvg` are trivial ratios). Evolution A builds the extraction front-end the module is named for.

**How.** (1) A document-extraction route using the platform's Claude API tier: structured field extraction (energy quantity, unit, fuel type, period, supplier) from uploaded PDFs/images with per-field confidence, routing low-confidence fields to the human-review queue the UI already mocks (`Field Review` tab). (2) Wire extraction output into the existing engine chain: extracted activity → `match_emission_factor` (already real) → GHG contribution → `derive_dqs_score` with the source-type feature reflecting extraction confidence. (3) The audit trail records source document, model version, and confidence per §7's stated design. (4) Rung 4: the confidence model calibrates against accumulated human-review corrections (the data flywheel — every human validation is a labelled pair), moving from a heuristic `min(best_score×1.5, 0.95)` to a calibrated uncertainty estimate.

**Prerequisites.** Document-ingestion infrastructure (storage, OCR for scanned bills — the `/uploads` module's parsing is a starting point); a human-review corpus before calibration is possible. **Acceptance:** a real utility bill yields extracted activity data with per-field confidence; low-confidence fields route to review; extracted data flows into a real GHG contribution via the EF-matching engine; the audit trail records model version and source.

### 9.2 Evolution B — Human-in-the-loop extraction copilot (LLM tier 2)

**What.** This module is inherently LLM-native — the copilot *is* the product. It processes a document batch, presents extractions with confidence, and for low-confidence fields asks the analyst targeted questions ("this invoice lists 'natural gas 4,200' — is the unit therms or kWh?"), then runs the downstream engines (`match_emission_factor`, `classify_scope3_category`, `derive_dqs_score`) and reports the GHG contribution and DQS — every factor and figure from tool output, never invented.

**How.** Extraction uses tool-calling against the Evolution-A document route; the downstream engine routes (`/assess`, `/cdp-scoring`, `/data-gaps`, `/dqs-derivation` — several currently `skipped` in the harness, triage first) are the analysis tools. Grounding corpus: this Atlas record plus the engine's real reference endpoints (EF databases, Scope 3 classification rules, XBRL concepts, CDP questionnaire — all harness-passing). The no-fabrication contract is doubly important: extraction confidence is surfaced explicitly, and the copilot must present low-confidence extractions *as* uncertain rather than smoothing them — the human-review gate is the module's core control.

**Prerequisites.** Evolution A's extraction route; the skipped POST routes triaged. **Acceptance:** every extracted value carries its confidence; low-confidence fields trigger a review question rather than a silent commit; every emission factor and DQS traces to an engine response; the audit trail attributes each accepted field to human confirmation or high-confidence extraction.