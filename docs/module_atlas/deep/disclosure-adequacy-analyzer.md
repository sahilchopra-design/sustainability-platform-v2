## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a *Disclosure Coverage Score* `DCS = Disclosed
> Mandatory Items / Total Mandatory Items × 100`, driven by **NLP classification of disclosure text**
> against framework requirement databases. **No text, no NLP, no requirement matching exists.** The
> per-framework scores for all 180 entities are drawn from the seeded PRNG `sr()` and scaled by a small
> assurance multiplier. The framework list and per-jurisdiction mandatory mapping are real and useful,
> but the *scores* are synthetic. Sections below document the real structure and the synthetic scoring.

### 7.1 What the module computes

```js
ENTITIES (180): per framework f (12):
  frameworkScores[f] = min(100, round(sr(i·19 + fi·100)·90 + 5) × assuranceMult)
  assuranceMult      = {None:1.0, Limited:1.1, Reasonable:1.2}[assuranceLevel]
overallScore  = round(mean(frameworkScores))
gapCount      = count(frameworkScores[f] < 50)                  // any framework below 50
mandatory     = JUR_MANDATORY[jurisdiction]                      // real per-jur mapping
mandatoryGap  = count(mandatory framework with score < 60)       // mandatory shortfalls
```

The only genuine logic is the **jurisdiction → mandatory-framework** matrix and the derived
mandatory-gap count; the underlying framework scores are seeded, then nudged by assurance level.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Frameworks (12) | TCFD, IFRS S1/S2, ESRS E1–E5, GRI 305, CDP, SASB, UK TCFD | real standards |
| Jurisdiction mandatory map | e.g. EU→{ESRS E1–E5, TCFD}; UK→{TCFD, UK_TCFD, GRI_305}; Canada→{TCFD, IFRS S1/S2, SASB} | **real** regulatory mapping |
| Assurance levels | None 1.0 / Limited 1.1 / Reasonable 1.2 | multiplier (encodes "assured reports score higher") |
| Framework score | `sr·90 + 5` (5–95) × mult | synthetic |
| Gap threshold | <50 (any), <60 (mandatory) | code heuristic |
| Improvement tips | per-framework text | curated real guidance (e.g. TCFD → add 1.5/2/3 °C scenarios) |

The per-jurisdiction mandatory mapping correctly reflects reality (EU CSRD ⇒ ESRS; UK ⇒ TCFD/UK-TCFD;
IFRS-adopting jurisdictions ⇒ IFRS S1/S2), and the improvement tips are accurate framework-specific
guidance.

### 7.3 Calculation walkthrough

Each entity's 12 framework scores are seeded independently, capped at 100, multiplied by its assurance
factor. `overallScore` averages them; `gapCount` counts sub-50 frameworks; `mandatoryGap` counts the
jurisdiction-mandatory frameworks scoring below 60. Aggregates: score distribution buckets, per-
framework average coverage, sector leaders, and a jurisdiction × mandatory-framework compliance
matrix. Boolean flags (`materialityAssessed`, `doubleMaterialityDone`, `quantitativeTargets`,
`forwardLookingScenarios`) are also seeded threshold draws.

### 7.4 Worked example

EU entity i=10, assurance = Reasonable (×1.2):
- `frameworkScores['ESRS_E1'] = min(100, round(sr(190+0)·90 + 5)·1.2)`. If `sr(190) = 0.42`,
  raw = `round(0.42·90 + 5) = round(42.8) = 43`; ×1.2 = `51.6` → 52.
- EU mandatory set = {ESRS E1–E5, TCFD}. If ESRS_E3 seeds to 55 and TCFD to 58, both < 60 →
  `mandatoryGap` counts them (plus any others below 60).
- `overallScore` = mean of all 12 (post-multiplier) scores. This entity would appear in the EU
  compliance matrix with two mandatory shortfalls flagged — but note these are seeded, not derived
  from any actual disclosure document.

### 7.5 Data provenance & limitations

- **Framework scores are synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`); the assurance multiplier is
  the only structural driver. There is no requirement database, no report ingestion, no NLP matching —
  the guide's DCS and its "NLP classification" pipeline are unimplemented.
- Jurisdiction mandatory mappings and improvement tips are **real and correct**, making the module a
  useful *requirements map* even though the coverage numbers are illustrative.
- Boolean readiness flags are seeded, not evidence-based.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The page shows a Disclosure Coverage Score
with no requirement-matching behind it. A production analyser must score a report against a structured
requirement taxonomy — the discipline behind CDP scoring, EFRAG's ESRS datapoint list, and commercial
tools (Datamaran, Novisto, Workiva) that map narrative text to mandatory datapoints.

**8.1 Purpose & scope.** For a filed sustainability report, compute per-framework coverage of
mandatory/recommended datapoints, a prioritised gap list, and a filing-readiness score, for all
applicable frameworks in the entity's jurisdiction.

**8.2 Conceptual approach.** A **retrieval + classification** pipeline: chunk the report, embed, and
match each chunk to a codified requirement taxonomy (ESRS ~1,100 datapoints, IFRS S2, TCFD 11
recommendations, GRI 305), then score coverage = matched-mandatory / total-mandatory, weighted by
regulatory penalty and deadline proximity. Benchmarks: (a) **EFRAG ESRS datapoint taxonomy** +
XBRL ESEF tagging; (b) **CDP scoring methodology** (Disclosure→Awareness→Management→Leadership bands);
(c) commercial disclosure-management NLP (Workiva/Novisto).

**8.3 Mathematical specification.**
```
match(chunk, req) = cos(embed(chunk), embed(req)) ≥ τ   # semantic retrieval, τ≈0.78
covered(req)      = 1 if ∃ chunk: match ∧ completeness(chunk,req) ≥ q   # q = detail threshold
DCS_f = Σ_{req∈mandatory_f} covered(req) / |mandatory_f| × 100
priority(req) = penalty_weight(req) · deadline_proximity(req) · (1 − covered)
readiness = Σ_f w_f · DCS_f ,  w_f = mandatory? 1 : 0.4     # weighted across applicable frameworks
```

| Parameter | Source |
|---|---|
| Requirement taxonomy | EFRAG ESRS datapoint list, IFRS S1/S2, TCFD 2021, GRI 305 |
| Embedding model + τ | tuned on labelled disclosure/requirement pairs |
| Completeness rubric q | ESRS "shall disclose" granularity |
| Penalty weights | jurisdiction enforcement regime (CSRD Art. 29a fines) |

**8.4 Data requirements.** Report text (PDF/XBRL/HTML), entity jurisdiction & sector (→ applicable
frameworks), the requirement taxonomy tables (needed as reference data), labelled training pairs.
Reuse the platform's framework registry; add an `esrs_datapoints` reference table.

**8.5 Validation & benchmarking.** Human-annotate a sample of reports for ground-truth coverage;
measure precision/recall of the matcher; reconcile computed CDP-equivalent bands against actual CDP
scores where public; backtest gap predictions against subsequent regulator findings.

**8.6 Limitations & model risk.** Semantic matching produces false positives (boilerplate that
mentions a topic without substantive disclosure) — mitigate with the completeness rubric and human
review of borderline matches. Taxonomy drift (ESRS revisions) requires versioned requirement tables.
Conservative fallback: flag low-confidence matches as "unverified" and require analyst sign-off before
a report is certified filing-ready.
