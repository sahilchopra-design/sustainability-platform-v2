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
