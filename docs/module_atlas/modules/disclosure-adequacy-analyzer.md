# Disclosure Adequacy Analyzer
**Module ID:** `disclosure-adequacy-analyzer` · **Route:** `/disclosure-adequacy-analyzer` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automated gap analysis of sustainability disclosures against framework requirements including CSRD/ESRS, GRI, TCFD, SFDR, and ISSB/IFRS S1-S2. Each disclosure element is scored against required, recommended, and voluntary criteria. Gap reports prioritise missing disclosures by regulatory materiality and deadline.

> **Business value:** Prevents regulatory filing gaps by systematically identifying undisclosed mandatory elements before submission deadlines. Prioritised gap reports help disclosure teams allocate limited time and resources to the highest-risk missing items first.

**How an analyst works this module:**
- Select the reporting entity and the frameworks applicable to this disclosure cycle
- Upload or link the current sustainability report and disclosure documents
- Review the automated gap analysis results ranked by framework priority and regulatory deadline
- Assign gap remediation tasks to disclosure owners and track closure before filing

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSURANCE_LEVELS`, `ENTITIES`, `ENTITY_NAMES`, `FRAMEWORKS`, `FRAMEWORK_LABELS`, `IMPROVEMENT_TIPS`, `JURISDICTIONS`, `JUR_MANDATORY`, `KpiCard`, `MiniBar`, `REPORT_TYPES`, `SECTORS`, `ScoreBadge`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sectorIdx` | `Math.floor(sr(i * 7) * 12);` |
| `jurIdx` | `Math.floor(sr(i * 11) * 12);` |
| `reportTypeIdx` | `Math.floor(sr(i * 13) * 4);` |
| `assuranceIdx` | `Math.floor(sr(i * 17) * 3);` |
| `overallScore` | `Math.round(FRAMEWORKS.reduce((s, f) => s + frameworkScores[f], 0) / FRAMEWORKS.length);` |
| `marketCapB` | `+(sr(i * 23) * 200 + 0.5).toFixed(1);` |
| `dataQualityScore` | `Math.round(sr(i * 29) * 70 + 25);` |
| `disclosureYear` | `2021 + Math.floor(sr(i * 31) * 3);` |
| `trajectory3yr` | `+(sr(i * 37) * 20 - 5).toFixed(1);` |
| `avgScore` | `filtered.length ? (filtered.reduce((s, e) => s + e.overallScore, 0) / filtered.length).toFixed(1) : '0';` |
| `scoreDist` | `useMemo(() => [ [0, 25], [25, 50], [50, 70], [70, 85], [85, 100] ].map(([lo, hi]) => ({ range: `${lo}-${hi}`,` |
| `frameworkCoverage` | `useMemo(() => FRAMEWORKS.map(f => ({` |
| `sectorLeaders` | `useMemo(() => SECTORS.map(s => {` |
| `sorted` | `[...ents].sort((a, b) => b.overallScore - a.overallScore);` |
| `jurMandatoryMatrix` | `useMemo(() => JURISDICTIONS.map(jur => {` |
| `complianceScores` | `mandatoryFwks.map(f => {` |
| `avg` | `ents.length ? ents.reduce((s, e) => s + e.frameworkScores[f], 0) / ents.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSURANCE_LEVELS`, `FRAMEWORKS`, `JURISDICTIONS`, `REPORT_TYPES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESRS Mandatory Coverage | — | ESRS requirement database vs. disclosure text | Share of ESRS-mandatory disclosure requirements addressed in the current sustainability statement |
| TCFD Coverage | — | TCFD recommendation checklist | Share of 11 TCFD recommended disclosures with substantive content |
| GRI Topic Coverage | — | GRI Standards index | Count of applicable GRI topic standards with at least partial disclosure |
| Open Mandatory Gaps | — | Gap engine | Count of mandatory disclosure requirements with no matching content identified |
- **Framework requirement databases (ESRS, GRI, TCFD, IFRS S1/S2)** → Requirement extraction and classification by mandatory / recommended / voluntary → **Requirement inventory with deadline and regulatory penalty metadata**
- **Sustainability report text (PDF, XBRL, or structured input)** → NLP classification to match disclosure text against requirement items → **Coverage matrix with confidence scores per requirement**
- **Gap register** → Priority ranking by regulatory mandatory status and filing deadline → **Remediation task list with owner assignment and due date**

## 5 · Intermediate Transformation Logic
**Methodology:** Disclosure Coverage Score
**Headline formula:** `DCS = Disclosed Mandatory Items / Total Mandatory Items × 100`

Mandatory disclosure items are extracted from framework requirements databases and matched against the entity's disclosure text using NLP classification. The coverage score distinguishes mandatory from recommended items and highlights which specific data points are absent or insufficiently detailed.

**Standards:** ['ESRS 2 Omnibus', 'GRI Universal Standards 2021', 'IFRS S1/S2 (2023)', 'TCFD 2021']
**Reference documents:** ESRS 2 (2023) General Disclosures â€” full mandatory requirement list; GRI (2021) GRI 1 Foundation and GRI 2 General Disclosures; IFRS S1 (2023) General Requirements for Disclosure of Sustainability-related Financial Information; TCFD (2021) Final Recommendations Report

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Real coverage scoring against the in-DB requirement catalogs (analytics ladder: rung 1 → 2, honestly attained)

**What.** The §7 flag is explicit: the guide's Disclosure Coverage Score (`DCS = disclosed mandatory / total mandatory × 100`) is unimplemented — all 180 entities' per-framework scores are `sr()`-seeded with only an assurance multiplier as structure. What *is* real: the 12-framework list, the jurisdiction→mandatory-framework matrix (EU→ESRS/TCFD, UK→TCFD/UK-TCFD, etc.), and the improvement tips. Evolution A builds the first backend vertical: an actual requirement inventory and a computed DCS, replacing every seeded score.

**How.** (1) The requirement database already exists in the platform — the ESRS/GRI datapoint catalogs are in the refdata layer (`/api/v1/refdata`, used by `esrs-datapoint-navigator`); add TCFD's 11 recommendations and IFRS S1/S2 as small seed tables rather than re-scraping. (2) New `services/disclosure_adequacy_engine.py`: given a per-entity disclosure checklist (which datapoints are addressed), compute DCS per framework, mandatory-gap counts against the real jurisdiction matrix (port it server-side — it's the module's one genuine asset), and deadline-weighted priority. (3) The page's `ENTITIES` seed set becomes a persisted `disclosure_assessments` table; boolean readiness flags (`doubleMaterialityDone` etc.) become user-entered evidence, not `sr()` threshold draws.

**Prerequisites.** The fabricated-scores defect acknowledged in release notes (numbers will visibly change); refdata ESRS catalog confirmed complete for E1–E5. **Acceptance:** `check_no_fabricated_random.py`-style audit finds zero `sr()` in the scoring path; a fixture entity with 40/80 mandatory ESRS datapoints ticked scores exactly 50.

### 9.2 Evolution B — LLM does the requirement matching the guide promised (LLM tier 2)

**What.** The guide's unbuilt "NLP classification to match disclosure text against requirement items" is the canonical LLM-shaped task: upload a sustainability report, and a tool-calling analyst maps each passage to ESRS/GRI/TCFD requirement items, producing the coverage matrix with per-requirement confidence and quoted evidence spans — turning this module from a checklist into the analyzer its name claims.

**How.** (1) Chunk the uploaded report (the platform's `esg-report-parser` module is the natural ingestion partner); for each mandatory requirement from Evolution A's inventory, retrieve candidate passages via pgvector (`llm_corpus_chunks` pattern from the roadmap D3 stage) and have Claude classify covered / partial / absent, returning the supporting quote. (2) Results write to `disclosure_assessments` as *evidence-linked* coverage, feeding the deterministic DCS from Evolution A — the LLM classifies, the engine scores; numbers never come from the model. (3) Human-review queue for low-confidence matches before anything counts toward the mandatory-gap KPI.

**Prerequisites (hard).** Evolution A's requirement inventory and honest scoring first — an LLM matcher writing into seeded scores would be garbage-on-garbage. **Acceptance:** on a golden report fixture (one public CSRD statement), precision/recall of requirement matching ≥ a hand-labeled baseline, every "covered" verdict carries a verbatim quote, and unmatched requirements appear as gaps rather than guesses.