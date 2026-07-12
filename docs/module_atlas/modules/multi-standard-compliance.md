# Multi-Standard Compliance Analytics
**Module ID:** `multi-standard-compliance` · **Route:** `/multi-standard-compliance` · **Tier:** B (frontend-computed) · **EP code:** EP-DQ5 · **Sprint:** DQ

## 1 · Overview
Provides comprehensive compliance assessment across all major voluntary and compliance carbon market standards — CDM, GS4GG v4, VCS v4, CAR v12, ACR v9, CORSIA SARS, ISO 14064-3:2019, and ICVCM Core Carbon Principles (10 principles). Scores projects and credits against each standard.

> **Business value:** Essential for carbon market investors conducting credit due diligence, corporations selecting high-integrity offsets for net zero claims, and project developers seeking multiple standard registration. ICVCM CCP is the emerging market standard for voluntary carbon quality assurance.

**How an analyst works this module:**
- Select carbon project for multi-standard assessment
- Score against each applicable standard's criteria
- Check ICVCM CCP 10 principles compliance
- Verify CORSIA eligibility for aviation offset use
- Generate side-by-side standard comparison scorecard

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ACR_REQUIREMENTS`, `ART6_STATUSES`, `ARTICLE6_CA_COUNTRIES`, `ARTICLE6_PENDING_COUNTRIES`, `Badge`, `CAR_PROTOCOLS`, `CCP_PRINCIPLES`, `CDM_REQUIREMENTS`, `CORSIA_ELIGIBLE_STANDARDS`, `COUNTRIES`, `ComplianceCell`, `GS_REQUIREMENTS`, `KpiCard`, `PROJECTS`, `REG_STATUSES`, `ReqRow`, `SECTORS`, `ScoreBadge`, `SectionHeader`, `TYPES_MAP`, `VCS_REQUIREMENTS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CDM_REQUIREMENTS` | 14 | `label`, `ref` |
| `GS_REQUIREMENTS` | 9 | `label`, `ref` |
| `VCS_REQUIREMENTS` | 9 | `label`, `ref` |
| `CCP_PRINCIPLES` | 11 | `label`, `cat` |
| `CORSIA_ELIGIBLE_STANDARDS` | 7 | `phase`, `status` |
| `CAR_PROTOCOLS` | 6 | `carbApproved` |
| `ACR_REQUIREMENTS` | 6 | `label`, `ref` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `cdm` | `Math.round(40 + sr(i * 7  + 1) * 55);` |
| `vcs` | `Math.round(50 + sr(i * 13 + 3) * 48);` |
| `car` | `Math.round(30 + sr(i * 19 + 4) * 60);` |
| `acr` | `Math.round(35 + sr(i * 23 + 5) * 58);` |
| `corsia` | `Math.round(40 + sr(i * 29 + 6) * 55);` |
| `sdgCount` | `3 + Math.floor(sr(i * 31 + 7) * 7);` |
| `sdgs` | `allSdgs.filter((_, idx) => sr(i * 37 + idx * 3) > (1 - sdgCount / 17));` |
| `nonC` | `total - fullyC - partial;` |
| `cdmPassFn` | `(proj, ri) => sr(proj.id.charCodeAt(4) * 7 + ri * 3 + 1) > 0.28;` |
| `gsPassFn` | `(proj, ri) => sr(proj.id.charCodeAt(4) * 11 + ri * 5 + 2) > 0.22;` |
| `vcsPassFn` | `(proj, ri) => sr(proj.id.charCodeAt(4) * 13 + ri * 7 + 3) > 0.20;` |
| `carApplicable` | `sr(idx * 43 + 17) > 0.5;` |
| `acrApplicable` | `sr(idx * 47 + 19) > 0.35;` |
| `corsiaAppl` | `p.corsiaEligible \|\| sr(idx * 53 + 23) > 0.6;` |
| `pct` | `CDM_REQUIREMENTS.length > 0 ? Math.round(passed / CDM_REQUIREMENTS.length * 100) : 0;` |
| `open` | `CDM_REQUIREMENTS.length - passedCount;` |
| `stars` | `aligned ? 1 + Math.floor(sr(selProject.id.charCodeAt(4) * 13 + sdgNum * 7) * 4) : 0;` |
| `score` | `Math.round(5 + sr(selProject.id.charCodeAt(4) * 7 + pi * 11 + 4) * 5);` |
| `scores` | `CCP_PRINCIPLES.map((_, pi) => Math.round(5 + sr(selProject.id.charCodeAt(4) * 7 + pi * 11 + 4) * 5));` |
| `avgScore` | `scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0.0';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACR_REQUIREMENTS`, `ART6_STATUSES`, `ARTICLE6_CA_COUNTRIES`, `ARTICLE6_PENDING_COUNTRIES`, `CAR_PROTOCOLS`, `CCP_PRINCIPLES`, `CDM_REQUIREMENTS`, `CORSIA_ELIGIBLE_STANDARDS`, `COUNTRIES`, `GS_REQUIREMENTS`, `REG_STATUSES`, `SECTORS`, `TABS`, `VCS_REQUIREMENTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ICVCM CCP Label Attainment | — | ICVCM CCP Assessment Progress 2024 | Only ~30% of voluntary carbon credits expected to meet ICVCM Core Carbon Principles — quality filter |
| CORSIA Eligible Credits | — | ICAO CORSIA Technical Advisory Body 2023 | CORSIA recognises specific methodologies from CDM, GS, VCS, REDD+ — airline offset compliance use |
| ISO 14064-3 Verification Level | — | ISO 14064-3:2019 §5.4 | ISO 14064-3 defines two verification levels — Reasonable (positive conclusion) required for CDM/VCS; Limited for reporting |
- **Project documentation (PDD, monitoring report, verification report)** → Standard compliance mapping → **Criterion-by-criterion compliance score per standard**
- **ICVCM CCP assessment database** → CCP label checking → **Methodology-level CCP approval status**
- **CORSIA eligible units list** → Aviation offset compliance → **Whether credits qualify for CORSIA Phase 1 airline use**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-Standard Compliance Score
**Headline formula:** `ComplianceScore = Σ [w_standard × StandardScore]; StandardScore = Σ [w_criterion × CriterionScore] / n; ICVCMscore = CCPAssessment across 10 principles`

ICVCM CCP 10 principles (governance, tracking, transparency, registration, additionality, permanence, robust quantification, no double counting, SD safeguards, sustainable land use) provide universal benchmark

**Standards:** ['ICVCM Core Carbon Principles — Assessment Framework 2023', 'Verra VCS Standard v4.0', 'Gold Standard for Global Goals v4 Principles', 'CDM EB Consolidated Procedures', 'CORSIA Eligible Emissions Unit Criteria 2022']
**Reference documents:** ICVCM — Core Carbon Principles and Assessment Framework (2023); Verra VCS Standard v4.0 — Requirements and Procedures (2021); Gold Standard for Global Goals — Principles and Requirements v4 (2023); ICAO CORSIA — Eligible Emissions Units Assessment Framework (2022); ISO 14064-3:2019 — Greenhouse Gases — Specification with guidance for the verification and validation of GHG statements

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry and the code agree on scope — a **carbon-project compliance matrix** across
CDM, Gold Standard v4 (GS4GG), Verra VCS v4, CAR, ACR, CORSIA, and ICVCM Core Carbon Principles. The
requirement checklists carry **accurate standard references** (e.g. `CDM EB TOOL01 v8` for
additionality, `VCS Standard v4 §3.7` for AFOLU buffer pools, `GS4GG P&R §5.1` for the 3-SDG minimum).
What is entirely synthetic is every *score* and every pass/fail — they come from the platform PRNG.

### 7.1 What the module computes

50 synthetic projects (`PROJECTS`) each get six per-standard scores in fixed ranges:

```js
cdm    = round(40 + sr(i·7 +1)·55)     // 40–95
gs     = round(45 + sr(i·11+2)·50)     // 45–95
vcs    = round(50 + sr(i·13+3)·48)     // 50–98
car    = round(30 + sr(i·19+4)·60)     // 30–90
acr    = round(35 + sr(i·23+5)·58)     // 35–93
corsia = round(40 + sr(i·29+6)·55)     // 40–95
```

Derived flags: **CCP label** `ccpLabel = (gs≥72 && vcs≥75 && cdm≥70) ? 'Y':'N'`; **CORSIA eligible**
`corsia > 70`; and a **price premium** `premiumFactor = 1.0 + sdgPremium(0.25 if ≥5 SDGs) +
corsiaBonus(0.08) + ccpBonus(0.20)`. Portfolio KPIs classify each project as fully compliant (all six
scores ≥80), partial (some ≥80), or non-compliant.

### 7.2 Parameterisation / scoring rubric

| Standard | Score range | Requirement rows | Real refs quoted |
|---|---|---|---|
| CDM | 40–95 | 13 | CDM Standard v8, TOOL01 v8, VVS v1 |
| GS4GG v4 | 45–95 | 8 | GS4GG P&R §4–6, SDG Impact Standards |
| VCS v4 | 50–98 | 8 | VCS Standard v4 §3.1–4.2, Art 6.2 PA |
| CAR | 30–90 | 5 protocols | Forest v3.5, Livestock v2.1 (CARB-approved flag) |
| ACR | 35–93 | 5 | ACR Standard v8, buffer-pool reqs |
| CORSIA | 40–95 | 6 standards | ICAO CORSIA labels 2021–2035 phases |
| ICVCM CCP | 0–10 per principle | 10 principles | Governance…No-Net-Harm |

Pass/fail per checklist item is a seeded threshold, e.g. `cdmPassFn = sr(id.charCodeAt(4)·7 + ri·3 +1)
> 0.28` (≈72 % pass rate), `gsPassFn` threshold 0.22, `vcsPassFn` 0.20. CCP principle scores:
`round(5 + sr(id.charCodeAt(4)·7 + pi·11 + 4)·5)` → 5–10.

### 7.3 Calculation walkthrough

1. `PROJECTS` seeds 50 projects with six scores, SDG set, buffer/leakage %, Article 6 status, registry
   membership (a project claims CDM if `cdm>70`, GS if `gs>65`, VCS if `vcs>60`, else defaults VCS).
2. Filters (sector/country/registry) subset the list; `kpis` count fully/partial/non-compliant, multi-
   registry (`≥2`), CCP-labelled, and CORSIA-eligible.
3. The **CCP tab** scores the selected project against the 10 Core Carbon Principles (`scores` array,
   each 5–10) and averages them (`avgScore`).
4. Per-standard tabs render the requirement checklist with seeded pass/fail ticks and completion %
   (`pct = round(passed / REQUIREMENTS.length · 100)`).

### 7.4 Worked example (project PRJ-011, CCP tab)

`selProject.id = 'PRJ-011'` → `charCodeAt(4) = '1'.charCodeAt(0) = 49`. CCP principle 1 (`pi=0`):
`round(5 + sr(49·7 + 0·11 + 4)·5) = round(5 + sr(347)·5)`. If `sr(347)≈0.6` → **8/10**. Averaging ten
such draws gives an `avgScore` around 7–8. Whether PRJ-011 earns the CCP `'Y'` label instead depends on
its `gs/vcs/cdm` triple crossing 72/75/70 — a *separate* seeded gate from the CCP-tab per-principle
scores (the two CCP representations are not reconciled in code).

### 7.5 Data provenance & limitations

- **All scores and pass/fail states are synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`). Only the requirement
  text and standard-clause references are real, hand-curated content.
- The two CCP mechanics are inconsistent: `ccpLabel` is a boolean gate on the GS/VCS/CDM triple, while
  the CCP tab shows ten independently seeded 5–10 principle scores. A real ICVCM assessment produces a
  single program-level + methodology-category-level approval, not either of these.
- No actual project documents (PDD, monitoring report, verification statement) are parsed; compliance is
  asserted by PRNG, not evidenced.

**Framework alignment:**
- **ICVCM Core Carbon Principles** — the CCP is assessed by ICVCM at two levels: the *carbon-crediting
  programme* (governance, registry/tracking, transparency, third-party V&V) and the *methodology
  category* (additionality, permanence, robust quantification, no-double-counting, SD benefits, no net
  harm). A credit earns the CCP label only if both its programme and methodology pass. The code lists
  the correct 10 principles but scores them by PRNG.
- **CDM / GS4GG v4 / VCS v4 / CAR / ACR** — checklist clauses are accurately referenced to each
  standard's rulebook.
- **CORSIA** — eligibility mirrors ICAO's TAB-approved unit list (VCS/GS/ACR/CAR/ART-TREES with the
  CORSIA label, CDM Phase-1 limited); the code's `CORSIA_ELIGIBLE_STANDARDS` phases are correct.
- **ISO 14064-3** — named in the guide (Reasonable vs Limited assurance) but not implemented in code.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module displays per-standard compliance
scores and a CCP label with no real assessment behind them. Below is the production scoring model.

### 8.1 Purpose & scope
Produce, per carbon project/credit vintage, a defensible compliance score against each applicable
standard and an ICVCM CCP eligibility decision, to support buyer due-diligence and portfolio quality
screening across VCM and CORSIA-compliance markets.

### 8.2 Conceptual approach
A rules-based, evidence-weighted conformance model — not a statistical model. Benchmarks: **ICVCM
Assessment Framework** (two-tier programme + methodology-category gates) and **BeZero / Sylvera / Calyx
credit-rating** methodologies (weighted sub-scores on additionality, permanence, over-crediting risk,
co-benefits, safeguards). Each standard is a checklist of mandatory + scored criteria; the composite is
a weighted conformance ratio.

### 8.3 Mathematical specification
Per standard *s*: `StandardScore_s = Σⱼ wⱼ·cⱼ / Σⱼ wⱼ`, where `cⱼ ∈ {0, 0.5, 1}` is criterion-*j*
conformance (fail/partial/pass) evidenced from documents, `wⱼ` its materiality weight (mandatory
criteria `w=∞` → gate: any mandatory fail sets `StandardScore_s = fail`). CCP eligibility:
`CCP = 1` iff programme-gate `∧` methodology-gate all pass, where each gate = `∏(mandatory criteria)`.
Over-crediting risk score: `OC = 1 − (verified ERR / claimed ERR)` from independent re-quantification.
Composite quality: `Q = Σₛ ωₛ·StandardScore_s + ω_OC·(1−OC) + ω_cb·CoBenefitScore`.

| Parameter | Source |
|---|---|
| Criterion weights wⱼ | ICVCM AF + rating-agency rubrics |
| Conformance cⱼ | PDD, monitoring report, VVB statement (NLP-extracted + analyst) |
| Verified ERR | Independent baseline re-estimation (IPCC Tier 2/3 EFs) |
| CoBenefitScore | SDG evidence, CCB/SD-VISta certification |

### 8.4 Data requirements
Registry API pulls (Verra, Gold Standard, ACR, CAR, ICVCM CCP database), PDD/monitoring/verification PDFs,
VVB accreditation status, ICAO CORSIA eligible-unit list. Platform already seeds requirement taxonomies;
the missing layer is document ingestion and a registry connector.

### 8.5 Validation & benchmarking plan
Reconcile CCP decisions against ICVCM's published assessed-methodology list; correlate composite Q with
BeZero/Sylvera letter grades on a shared sample (target rank correlation >0.7); backtest over-crediting
flags against known invalidations (e.g. Verra REDD+ 2023 reversals).

### 8.6 Limitations & model risk
Document-based conformance is analyst-intensive and lags registry updates; over-crediting re-estimation
depends on contested baselines. Conservative fallback: treat unknown criteria as fail, and default to the
lowest of standard-level and rating-agency scores where they diverge.

## 9 · Future Evolution

### 9.1 Evolution A — Real project scoring from registry data instead of PRNG ranges (analytics ladder: rung 1 → 3)

**What.** §7 is precise about what is real and what is not: the requirement checklists carry accurate standard references (CDM EB TOOL01 v8, VCS v4 §3.7 AFOLU buffer, GS4GG P&R §5.1), but every score for the 50 synthetic projects is drawn from `sr()` in fixed ranges (`cdm = 40 + sr()·55` etc.), and the CCP label, CORSIA flag, and price `premiumFactor` all derive from those fabricated scores. Evolution A replaces the PRNG layer with criterion-level assessment of real registry projects.

**How.** (1) Build a first backend vertical `api/v1/routes/multi_standard.py` with `POST /assess` scoring a project against the already-encoded requirement rows (13 CDM, 8 GS4GG, etc.) as explicit criterion pass/fail/partial inputs — analyst-entered or pre-filled from the platform's Verra registry seed (migration 102 seeded real Verra projects; use them as the assessment universe). (2) `StandardScore = Σ w_criterion × CriterionScore / n` per §5, computed from those inputs, never sampled. (3) Replace the invented CCP heuristic (`gs≥72 && vcs≥75 && cdm≥70`) with the ICVCM's actual assessment status where published — ICVCM CCP-approval decisions are public and enumerable in a `ref_icvcm_decisions` table.

**Prerequisites.** Verra seed data coverage check (methodology + status fields needed per criterion); the price-premium factors (0.25 SDG / 0.08 CORSIA / 0.20 CCP) must either cite a market study or be labelled illustrative. **Acceptance:** a seeded Verra project's scorecard shows per-criterion evidence, not range-bounded randoms; no `sr()` call remains in any score path.

### 9.2 Evolution B — Carbon-credit due-diligence copilot citing standard texts (LLM tier 1 → 2)

**What.** A copilot for credit buyers: "does this project meet CORSIA eligibility?", "which VCS v4 clauses does an AFOLU project have to satisfy?", "explain why its CCP label is N." Grounded in this module's genuinely accurate asset — the requirement checklists with their real clause references — plus the ICVCM/VCS/GS4GG/CORSIA reference documents named in §5, so answers quote the applicable clause rather than paraphrasing carbon-market lore.

**How.** Tier 1: embed the requirement rows and the named standard documents as the module corpus (roadmap `llm_corpus_chunks` pattern); the copilot answers standard-interpretation questions with clause citations and explains scorecards by walking the criterion table. Tier 2, after Evolution A: tool calls to `POST /assess` for what-ifs ("if the buffer contribution rises to 25%, does VCS alignment change?"), with the fabrication validator matching quoted scores to tool outputs. Refusal path for legal advice ("will this survive an ICVCM appeal?") and for the 50 legacy synthetic projects until they are replaced.

**Prerequisites.** Evolution A for any score-explaining behaviour — today's scores are PRNG output and must not be narrated as assessments; standard-text ingestion rights check (ICMA/ICVCM PDFs are public, Verra terms permit reference use). **Acceptance:** every clause citation resolves to a real section of the named standard; score explanations only occur for assessed (non-synthetic) projects.