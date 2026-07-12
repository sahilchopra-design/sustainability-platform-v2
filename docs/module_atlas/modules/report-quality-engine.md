# Sustainability Report Quality Engine
**Module ID:** `report-quality-engine` · **Route:** `/report-quality-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Automated quality assessment engine for sustainability reports scoring TCFD recommendation alignment (11 recommendations, 0-100%), CSRD completeness, GRI Standards coverage, data consistency through year-over-year variance analysis, and third-party assurance level tracking against ISAE 3000/3410 standards.

> **Business value:** Used by sustainability reporting managers, external auditors, and ESG investors to assess and compare sustainability report quality, identify material gaps, and track improvement over time.

**How an analyst works this module:**
- Upload sustainability report (PDF or structured XML/XBRL)
- Run quality scoring for TCFD, CSRD, GRI, and data consistency
- Review gap analysis and year-over-year variance flags
- Generate report quality certificate and improvement action plan

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSURANCE_LEVELS`, `COMPANIES`, `ENFORCEMENT_CASES`, `GREENWASH_TYPES`, `ISAE_REQS`, `KPI`, `LINEAGE_ENTRIES`, `QA_CATEGORIES`, `TABS`, `TOTAL_QA_ITEMS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GREENWASH_TYPES` | 8 | `name`, `desc`, `severity`, `detection`, `color` |
| `ENFORCEMENT_CASES` | 16 | `jurisdiction`, `year`, `penalty`, `type`, `detail`, `gwType`, `learning` |
| `QA_CATEGORIES` | 7 | `items` |
| `ASSURANCE_LEVELS` | 5 | `confidence`, `description`, `color` |
| `ISAE_REQS` | 11 | `req`, `desc`, `status`, `evidence` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TOTAL_QA_ITEMS` | `QA_CATEGORIES.reduce((s, c) => s + c.items.length, 0);` |
| `seed` | `i * 41 + 500;` |
| `sources` | `['ERP SAP S/4HANA','Utility Invoices','Supplier Surveys','EPA GHGRP','CDP Disclosure','Internal HSE System','HR Payroll','Financial Controller','Energy Mgmt System','IoT Sensors','Manual Estimation','Industry Benchmark',` |
| `transforms` | `['Direct Measurement','Activity-based Calculation','Spend-based Estimation','Supplier-specific EF','Average-data Method','Hybrid Approach','Extrapolation','Statistical Sampling'];` |
| `claims` | `Math.floor(3 + sr(seed) * 8);` |
| `flagged` | `Math.floor(sr(seed + 1) * (claims + 1));` |
| `qaPercent` | `TOTAL_QA_ITEMS > 0 ? Math.round((totalChecked / TOTAL_QA_ITEMS) * 100) : 0;` |
| `key` | ``${cat}-${idx}`;` |
| `sectors` | `useMemo(() => ['All', ...new Set(COMPANIES.map(c => c.sector))], []);` |
| `gwDistribution` | `useMemo(() => GREENWASH_TYPES.map(g => ({` |
| `assuranceDistribution` | `useMemo(() => ASSURANCE_LEVELS.map(a => ({` |
| `results` | `GREENWASH_TYPES.map(g => {` |
| `score` | `Math.round(5 + sr(text.length * 7 + g.id.length * 13) * 30);` |
| `overall` | `results.length > 0 ? Math.round(results.reduce((s, r) => s + r.riskScore, 0) / results.length) : 0;` |
| `ixbrlItems` | `useMemo(() => Array.from({ length: 20 }, (_, i) => { const seed = i * 29 + 200;` |
| `tags` | `['ESRS E1-6 GHG Total','ESRS E1-4 Targets','ESRS E2-4 Water Use','ESRS S1-6 Workforce','ESRS G1-1 Governance','ESRS E1-1 Transition Plan','ESRS E3-1 Marine','ESRS E4-1 Biodiversity','ESRS E5-1 Circular Economy','ESRS S2-` |
| `catChecked` | `cat.items.filter((_, ii) => checkedItems[`${ci}-${ii}`]).length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSURANCE_LEVELS`, `ENFORCEMENT_CASES`, `GREENWASH_TYPES`, `ISAE_REQS`, `QA_CATEGORIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| TCFD Alignment Score | `Σ(w_i × TCFD_rec_i_score) / 11` | NLP-based TCFD recommendation mapping | Scores >70 indicate strong TCFD alignment; regulatory momentum (UK, EU, SEC) is moving toward mandatory full alignment requirements. |
| CSRD Completeness Gap | `(required_datapoints − reported_datapoints) / required_datapoints × 100` | EFRAG ESRS datapoint checklist | Gap >30% is a material compliance risk for first-year CSRD filers; gap analysis drives data collection prioritisation. |
| Assurance Level | `ISAE_3000_engagement_type from auditor report` | Auditor assurance report | CSRD mandates limited assurance from 2025, moving to reasonable assurance by 2028; current Fortune 500 average: 62% limited assurance. |
- **Sustainability report PDFs/XBRL → NLP extraction + datapoint mapping** → TCFD/CSRD/GRI scoring → consistency analysis → assurance level tracking → **Report quality scorecard with gap analysis and improvement recommendations**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-Standard Report Quality Scoring
**Headline formula:** `quality_score = w_tcfd·TCFD_score + w_csrd·CSRD_score + w_gri·GRI_score + w_consistency·consistency_score`

TCFD scoring maps 11 recommended disclosures across Governance, Strategy, Risk Management, and Metrics & Targets to report sections using NLP, scoring 0 (absent) to 100 (fully addressed). CSRD completeness uses the EFRAG ESRS datapoint checklist against the reported datapoints. GRI coverage counts Standards disclosed vs applicable standards. Year-over-year variance flags metrics that change by >30% without restatement note, a key audit indicator.

**Standards:** ['TCFD Final Recommendations 2017 / 2023 Annex', 'EFRAG CSRD Completeness Assessment Guide', 'GRI Universal Standards 2021']
**Reference documents:** TCFD Final Recommendations and 2023 Annex; EFRAG CSRD Reporting Completeness Assessment Guidance; GRI Universal Standards 2021; IAASB ISAE 3000 and 3410 Assurance Standards

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes NLP-based TCFD 11-recommendation scoring, an
> EFRAG ESRS datapoint-checklist CSRD completeness gap, and GRI Standards coverage counting. **None
> of these three scoring engines exist in the code.** There is no TCFD recommendation mapper, no
> CSRD datapoint checklist, no GRI standard counter, and no NLP/text-extraction logic anywhere in
> the file. What the code actually implements is: (1) a genuine 55-item **manual QA checklist**
> across 6 categories that a user ticks by hand, (2) a **greenwashing "risk score" derived from the
> character length of pasted text** (not semantic/NLP detection despite the guide's "LCA scope
> analysis" / "terminology audit" detection-method labels), (3) a hard-coded **enforcement-case
> database** (16 real regulatory actions), and (4) a hard-coded **ISAE 3000 assurance-readiness
> checklist**. This is a real-but-different tool: manual audit-readiness tracking, not automated
> report quality scoring.

### 7.1 What the module computes

```
TOTAL_QA_ITEMS = Σ QA_CATEGORIES[c].items.length              // 55 items, 6 categories
qaPercent = TOTAL_QA_ITEMS > 0 ? round(totalChecked / TOTAL_QA_ITEMS × 100) : 0
greenwashScore_g = round(5 + sr(text.length×7 + g.id.length×13) × 30)   // per greenwash type g
overall = round(Σ greenwashScore_g / GREENWASH_TYPES.length)
```
`totalChecked` is the count of checkboxes the user has manually ticked across the 6 QA categories
(Basic Data Quality, iXBRL Compliance, Narrative Quality, Greenwashing Prevention, Internal Audit
Readiness, Third-Party Assurance) — a genuine, if manual, completeness ratio.

### 7.2 Parameterisation

| Component | Content | Provenance |
|---|---|---|
| `QA_CATEGORIES` | 6 categories, 55 checklist items total (9 Basic Data Quality, 10 iXBRL, 8 Narrative, 7 Greenwashing, 10 Internal Audit, 10 Assurance) | Hand-authored, references real standards (Flesch-Kincaid readability, EFRAG 2024 taxonomy, ISAE 3000) — a genuine audit checklist, not calculated |
| `GREENWASH_TYPES` | 7 types (Hidden Trade-offs, Lack of Proof, Vague Language, False Imagery, No Progress, Lesser of Two Evils, Fake Certifications) | Standard "Seven Sins of Greenwashing" taxonomy (TerraChoice/UL 2010), a recognised industry framework |
| `greenwashScore_g` formula | `5 + sr(text.length×7 + g.id.length×13) × 30` → 5–35 | **Not** semantic detection — the score is a deterministic function of the pasted text's character count and the greenwash-type id's string length, so two different texts of the same length against the same type produce the same score regardless of content |
| `ENFORCEMENT_CASES` | 16 real-world greenwashing enforcement actions (Shell, HSBC, Ryanair, DWS, Volkswagen Dieselgate, etc.) | Real, publicly documented cases — accurately summarised, genuinely useful reference data |
| `ASSURANCE_LEVELS` | None (0%) / Limited (40%) / Reasonable (75%) / High (95%) confidence | ISAE 3000 assurance-tier convention; confidence % values are illustrative, not derived from a formula |
| `ISAE_REQS` | 10-item ISAE 3000 engagement checklist (Ethical Requirements → Reporting), each with a hard-coded `met`/`partial`/`not-started` status | Static demo state, not computed from any live engagement data |
| `ixbrlItems` (20 rows) | ESRS iXBRL tag list (e.g. `ESRS E1-6 GHG Total`, `ESRS E1-4 Targets`) with `sr(seed)`-derived pass/fail | Tag names are standards-accurate ESRS datapoint references; pass/fail state is synthetic, not a real validator run |

### 7.3 Calculation walkthrough

1. **QA checklist**: user toggles `checkedItems[`${catIndex}-${itemIndex}`]`; `catChecked` per
   category = `cat.items.filter((_, ii) => checkedItems[key]).length`; `qaPercent` aggregates all 6
   categories against `TOTAL_QA_ITEMS = 55`. This is the module's one genuinely computed ratio.
2. **Greenwashing scanner**: user pastes report text into a textarea; for each of the 7
   `GREENWASH_TYPES`, `score = round(5 + sr(text.length×7 + g.id.length×13) × 30)`; `overall` is the
   simple mean across the 7 type scores. Because the seed depends only on `text.length` (not word
   content), pasting "aaaa...a" (100 chars) produces an identical score to any other 100-character
   string against the same greenwash type.
3. **Enforcement case browser**: static filter/sort over the 16-row `ENFORCEMENT_CASES` table,
   cross-referenced to `gwType` so a user researching e.g. "Vague Language" sees the Danone/Santos/
   TotalEnergies cases.
4. **iXBRL tab**: 20 synthetic tag-validation rows (`sr(seed)`-derived pass/fail per ESRS datapoint
   tag) presented as a filing-readiness table.

### 7.4 Worked example

QA checklist: a user ticks 38 of the 55 items (all of Basic Data Quality [9], all of Narrative
Quality [8], 6/7 Greenwashing Prevention, 9/10 Internal Audit, 6/10 Assurance, 0/10 iXBRL).
`totalChecked = 9+8+6+9+6+0 = 38`; `qaPercent = round(38/55×100) = 69%`.

Greenwashing scan on a 340-character passage against "Vague Language" (`g.id = "vague-language"`,
length 15): `seed = 340×7 + 15×13 = 2,380 + 195 = 2,575`; `sr(2575) = frac(sin(2576)×10⁴)`.
`sin(2576 rad)` (reduced mod 2π) ≈ 0.4817 → `x = 4,817.xx` → `frac ≈ 0.xx` — illustratively
`sr(2575) ≈ 0.63` → `score = round(5 + 0.63×30) = round(23.9) = 24/35`, i.e. "Medium" greenwash
risk purely from the passage's length, independent of whether it actually contains vague terms
like "eco-friendly" or "natural".

### 7.5 Data provenance & limitations

- The QA checklist (§7.1–7.2) is the only part of the module that computes a real ratio from user
  input; everything else is either static reference data (enforcement cases, ISAE requirements) or
  a PRNG proxy dressed as a detection score.
- The greenwashing scanner does **no NLP, keyword matching, or semantic analysis** despite its UI
  framing — a bank or regulator using this to triage disclosures would get a text-length artifact,
  not a genuine greenwashing signal. A production version would need actual NLP (keyword/phrase
  detection for vague terms, claim-evidence proximity scoring, certification-registry lookups).
- `ISAE_REQS` statuses and `ixbrlItems` pass/fail are fixed/synthetic, not wired to any real
  document upload or validator despite the guide's "Upload sustainability report (PDF or
  structured XML/XBRL)" user-interaction claim — there is no file upload or parsing in the code.
- `ENFORCEMENT_CASES` is accurate, real-world reference data and is the module's strongest asset.

**Framework alignment:** ISAE 3000/3410 (assurance-tier checklist, general structure correct) ·
EFRAG ESRS/iXBRL tagging (tag names accurate, validation synthetic) · TerraChoice "Seven Sins of
Greenwashing" taxonomy (correctly reproduced) · Flesch-Kincaid readability and ISO 14021
environmental-claim vocabulary referenced in the QA checklist items but not computed by any
readability algorithm in code.

## 9 · Future Evolution

### 9.1 Evolution A — Real document ingestion with checklist-driven scoring (analytics ladder: rung 1 → 2)

**What.** §7 documents a real-but-different tool: the genuine part is a 55-item manual QA checklist whose completion ratio actually computes, plus a strong hand-curated asset (16 real enforcement cases) and an ISAE 3000 readiness checklist — but the guide's three automated engines (NLP TCFD scoring, ESRS datapoint completeness, GRI coverage counting) don't exist, there is no file upload or parsing despite the "upload PDF/XBRL" workflow claim, and the greenwashing "risk score" is derived from the character length of pasted text — a text-length artifact dressed as detection. Evolution A builds the document pipeline the guide assumes.

**How.** (1) Server-side report ingestion: PDF text extraction into sectioned passages stored per report (`report_quality_documents`), the platform's uploads route as intake. (2) Deterministic scoring first: TCFD 11-recommendation coverage via a curated keyword/phrase map per recommendation (transparent, auditable hit lists — not a black box), ESRS completeness against the datapoint catalogs already in the refdata layer, GRI counting from the standards index; each score decomposable to the passages that earned it. (3) The greenwashing scanner becomes honest: vague-term lexicon matching plus claim-evidence proximity checks (flag "carbon neutral" without a named standard/registry within N sentences), with the length-based score deleted. (4) The manual checklist persists per report with the automated results pre-filling suggestions the reviewer confirms.

**Prerequisites.** Extraction tooling; keyword maps curated per framework (research effort, versioned). **Acceptance:** a scored report's TCFD percentage decomposes to passage citations; the same document scores identically twice; the greenwashing score changes with content, not character count.

### 9.2 Evolution B — LLM-graded report review with evidence citations (LLM tier 2)

**What.** Report quality assessment is semantic judgment over long documents — the module's guide promised NLP because the task genuinely needs it, and an LLM is now the right instrument. Evolution B layers model-graded assessment on the Evolution-A pipeline: per TCFD recommendation, the LLM reads retrieved passages and grades disclosure depth (present/boilerplate/decision-useful) with quoted evidence; the greenwashing review escalates lexicon hits to a claim-substantiation judgment ("net-zero claim cites no interim targets or scope boundaries").

**How.** Tool-calling pattern: the LLM retrieves passages via the document-query endpoint (never grades text it hasn't retrieved in-conversation), grades against a rubric chunked from TCFD/EFRAG implementation guidance, and outputs structured findings (recommendation, grade, verbatim evidence quote, rubric criterion). Verbatim quotes are string-checked against the stored document — the fabrication guardrail adapted for text. Deterministic keyword scores and LLM grades are shown side by side; disagreement is surfaced as a review queue, not silently merged. Enforcement-case context: findings link to similar cases from the module's real 16-case database for precedent framing.

**Prerequisites (hard).** Evolution A's ingestion and deterministic baseline (LLM grades need something to disagree with); rubric golden set — a hand-graded reference report for evaluation. **Acceptance:** every LLM finding's quote is verbatim-present in the document; grades on the golden report match the hand grading within tolerance; ungraded recommendations are reported as not-assessed, never defaulted.