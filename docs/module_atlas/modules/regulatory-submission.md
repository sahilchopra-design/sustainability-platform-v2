# Regulatory Submission Manager
**Module ID:** `regulatory-submission` · **Route:** `/regulatory-submission` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages ESG regulatory filing workflows from data preparation through validation, formatting, and submission to regulatory portals.

> **Business value:** Streamlines the ESG regulatory submission process from data mapping to portal filing, reducing manual error risk and providing a complete audit trail of submissions.

**How an analyst works this module:**
- Select regulatory framework and submission period.
- Map data fields to regulatory template or XBRL taxonomy.
- Run validation checks and resolve errors.
- Submit to regulatory portal and record confirmation reference.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `CROSS_DEPS`, `EVIDENCE_ITEMS`, `HISTORICAL`, `LS_KEY`, `LS_PORTFOLIO`, `PREP_STEPS`, `REGULATORY_SUBMISSIONS`, `REG_CHANGES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGULATORY_SUBMISSIONS` | 16 | `regulator`, `regulation`, `filing_type`, `jurisdiction`, `deadline`, `frequency`, `status`, `completion_pct`, `assignee`, `data_sources`, `format`, `portal`, `last_submission`, `notes` |
| `HISTORICAL` | 10 | `year`, `date`, `outcome`, `feedback`, `score` |
| `REG_CHANGES` | 8 | `regulator`, `regulation`, `change`, `impact`, `affects` |
| `CROSS_DEPS` | 12 | `target`, `shared`, `strength` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `today` | `new Date('2025-05-15');` |
| `daysBetween` | `(a, b) => Math.ceil((new Date(b) - new Date(a)) / 86400000);` |
| `portfolio` | `useMemo(() => loadLS(LS_PORTFOLIO) \|\| GLOBAL_COMPANY_MASTER, []);  /* ── State ────────────────────────────────────────────────────────────── */ const [searchTerm, setSearchTerm] = useState('');` |
| `jurisdictions` | `useMemo(() => ['All', ...new Set(REGULATORY_SUBMISSIONS.map(s => s.jurisdiction))], []);` |
| `juris` | `new Set(all.map(s => s.jurisdiction)).size;` |
| `regs` | `new Set(all.map(s => s.regulator)).size;` |
| `avgComp` | `all.reduce((a, s) => a + s.completion_pct, 0) / all.length;` |
| `label` | `d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `badge` | `(color, bg) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, color, background: bg \|\| `${color}18`, marginRight: 4 });` |
| `steps` | `checklistState[sub.id] \|\| PREP_STEPS.map(() => false);` |
| `complexity` | `Math.min(100, filings.length * 25 + (j.jurisdiction === 'EU' ? 30 : 0));` |
| `overall` | `Math.round((complexity * 0.25 + deadlinePressure * 0.3 + (100 - dataReady) * 0.3 + assurance * 0.15));` |
| `assigneeData` | `Object.entries(assigneeMap).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.total - a.total);` |
| `fmtData` | `Object.entries(fmtMap).map(([name, value]) => ({ name, value }));` |
| `freqData` | `Object.entries(freqMap).map(([name, value]) => ({ name, value }));` |
| `weekDate` | `new Date(today.getTime() + w * 7 * 86400000);` |
| `daysTotal` | `Math.max(1, daysBetween('2025-01-01', s.deadline));` |
| `daysElapsed` | `daysBetween('2025-01-01', weekDate);` |
| `pctTime` | `Math.min(100, (daysElapsed / daysTotal) * 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `CROSS_DEPS`, `HISTORICAL`, `PREP_STEPS`, `REGULATORY_SUBMISSIONS`, `REG_CHANGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Submissions | — | Submission Registry | Regulatory filings currently in progress across all applicable frameworks. |
| Submission Readiness (%) | — | Validation Engine | Average readiness score across all active submission workflows. |
| Validation Errors | — | XBRL Validator | Count of XBRL tagging or data validation errors across pending submissions. |
- **Sustainability data warehouse + regulatory templates + XBRL taxonomy** → Field mapping; XBRL tagging; validation; portal API submission → **Submitted regulatory filing with confirmation receipt and audit trail**

## 5 · Intermediate Transformation Logic
**Methodology:** Submission Readiness Score
**Headline formula:** `SR = (validated_fields / required_fields) × (1 – error_rate) × 100`

Composite readiness metric combining field completion rate and validation pass rate for pending submission.

**Standards:** ['ESMA XBRL Taxonomy', 'EFRAG ESRS Taxonomy (Draft)']
**Reference documents:** ESMA XBRL Taxonomy for ESEF Reporting; EFRAG ESRS XBRL Taxonomy (Draft 2024); CSSF CSRD Filing Instructions

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — formula direction inverted.** The guide's calculation engine is
> `SR = (validated_fields/required_fields) × (1−error_rate) × 100`, a **readiness** score (higher
> = more ready). The code's actual jurisdiction-level composite score computes the opposite
> concept — a **regulatory burden/risk** score (higher = more exposed/less ready):
> `overall = complexity×0.25 + deadlinePressure×0.3 + (100−dataReady)×0.3 + assurance×0.15`,
> displayed with `riskColor(v) = v>65 red : v>40 amber : green` — i.e. **high values are bad**,
> the inverse of a readiness score where high values would be good. No `validated_fields`,
> `required_fields`, or `error_rate` field exists anywhere in the file. Below documents the
> jurisdiction-risk score the code actually implements.

### 7.1 What the module computes

15 real, named regulatory submissions (ESMA/SFDR, EC/EU Taxonomy, EFRAG/CSRD, FCA/TCFD, SEBI/BRSR,
FSA Japan/ISSB-SSBJ, MAS, SEC, FINMA, HKEX, ASIC/AASB, EC/CBAM) with genuine deadlines, formats,
and portals, plus a jurisdiction-level composite risk score:

```js
complexity        = min(100, filingCount×25 + (jurisdiction==='EU' ? 30 : 0))
deadlinePressure  = anyDeadline<45d ? 85 : anyDeadline<90d ? 55 : 25
dataReady         = avgCompletionPct(jurisdiction's filings)
assurance         = anyFiling has Assurance/XBRL/iXBRL format ? 75 : 30
overall           = round(complexity×0.25 + deadlinePressure×0.3 + (100−dataReady)×0.3 + assurance×0.15)
```

### 7.2 Parameterisation — the 15-submission registry (real, spot-checked)

| Regulator | Regulation | Jurisdiction | Deadline | Status | Completion |
|---|---|---|---|---|---|
| ESMA | SFDR PAI Statement | EU | 2025-06-30 | in_progress | 65% |
| ESMA | SFDR Pre-contractual (Annex II) | EU | 2025-03-31 | submitted | 100% |
| EFRAG | CSRD ESRS E1 Climate | EU | 2026-01-31 | not_started | 0% |
| FCA | TCFD | UK | 2025-06-30 | in_progress | 45% |
| SEBI | BRSR Core | IN | 2025-09-30 | in_progress | 70% |
| SEC | Climate Disclosure Rule (10-K) | US | 2026-12-31 | not_started | 0% |
| EC | CBAM | EU | 2026-01-31 (quarterly) | not_started | 0% |

Correctly notes SEC's rule status as *"effective date TBD pending litigation"* — accurate given
the rule's real stay/rescission history — and correctly identifies CBAM as quarterly-frequency
(matching the real EU CBAM transitional reporting cadence) vs the other regulations' annual
cadence.

| Constant | Value | Provenance |
|---|---|---|
| `complexity` EU bonus | +30 pts flat | Synthetic — reflects EU's genuinely denser multi-regulator overlap (ESMA/EC/EFRAG all active), a reasonable qualitative adjustment |
| `deadlinePressure` tiers | <45d→85, <90d→55, else→25 | Synthetic urgency tiering |
| `assurance` flag | 75 if any filing needs Assurance/XBRL/iXBRL, else 30 | Proxy for format/audit complexity — XBRL tagging genuinely adds submission complexity vs a plain PDF |
| Weights (complexity/deadline/dataGap/assurance) | 25% / 30% / 30% / 15% | Synthetic weighting, sums to 100% |

### 7.3 Calculation walkthrough

1. **Registry**: 15 static submissions across 10 jurisdictions (EU, UK, IN, JP, SG, US, CH, HK, AU
   — 9 distinct, guide's "Active Submissions" figure of 7 likely refers to `status==='in_progress'`
   count, which is 4 in the reviewed rows, or could include additional rows beyond SUB015 not
   captured in this excerpt).
2. **Jurisdiction Dashboard tab**: for each distinct jurisdiction, computes `complexity`,
   `deadlinePressure`, `dataReady` (=`avgComp`, the jurisdiction's mean `completion_pct`),
   `assurance`, and the composite `overall` risk score — each sub-component rendered as its own
   colour-coded risk bar plus the blended `overall`.
3. **Portfolio linkage**: `portfolio = loadLS('ra_portfolio_v1') || GLOBAL_COMPANY_MASTER` — reads
   the platform's real shared portfolio state (same pattern as `regulatory-gap`), falling back to
   a static global company master if none is set.
4. **Checklist tracking**: `PREP_STEPS` per submission, persisted per-submission completion state
   in `checklistState` (localStorage-backed).
5. **Historical outcomes** (`HISTORICAL`, 10 rows): prior-year submission outcomes with scores and
   feedback — descriptive audit trail.
6. **Regulatory changes** (`REG_CHANGES`, 8 rows) and **cross-dependencies** (`CROSS_DEPS`, 12
   rows): static reference tables showing which regulatory changes affect which submissions, and
   which submissions share data dependencies.
7. **Timeline tab**: `pctTime = min(100, daysElapsed(2025-01-01→week) / daysTotal(2025-01-01→
   deadline) × 100)` — genuine elapsed-time-vs-deadline percentage, per submission, per week.

### 7.4 Worked example — EU jurisdiction risk score

EU has multiple filings (SFDR PAI, SFDR Annex II, EU Taxonomy, CSRD ESRS E1, CBAM — say 5 EU
filings), with the nearest EU deadline (SFDR Annex II, 2025-03-31) already past `today`
(2025-05-15, hard-coded) or the next one (SFDR PAI, 2025-06-30) within 46 days of `today`:

| Step | Formula | Result |
|---|---|---|
| `complexity` | `min(100, 5×25+30)` | `min(100,155)=` **100** |
| `daysBetween(today, '2025-06-30')` | `(2025-06-30 − 2025-05-15)` | **46 days** |
| `deadlinePressure` | `46<90` (not <45) | **55** |
| `dataReady` (`avgComp` for EU filings, e.g. 65/100/0/0/0 mean) | `(65+100+0+0+0)/5` | **33%** |
| `assurance` | EU has XHTML/iXBRL formats | **75** |
| `overall` | `100×0.25+55×0.3+(100−33)×0.3+75×0.15` | `25+16.5+20.1+11.25=` **72.85 → 73** |
| `riskColor(73)` | `73>65` | **red** (high regulatory burden) |

### 7.5 Risk-tier rubric

| `overall` score | Colour | Meaning |
|---|---|---|
| > 65 | red | High regulatory burden/risk |
| 40–65 | amber | Moderate |
| < 40 | green | Low |

### 7.6 Companion analytics

Submission Registry (15-row filterable table), Jurisdiction Dashboard (composite risk score by
jurisdiction), Checklist/Prep Steps, Historical Outcomes (10-cycle track record), Regulatory
Changes (8 tracked changes affecting submissions), Cross-Dependencies (12 shared-data links
between submissions), Timeline (weekly elapsed-vs-deadline progress).

### 7.7 Data provenance & limitations

- **The 15-submission registry is real, curated content** (no PRNG) — regulator names, regulation
  names, deadlines, and formats are all genuine and internally plausible (correctly distinguishing
  XHTML/ESEF, iXBRL, XBRL, EDGAR XBRL, and PDF formats by regulator, and correctly flagging SEC's
  litigation-driven status uncertainty).
- **The "overall" jurisdiction score is a risk/burden metric, not a readiness metric** — the
  guide's SR formula and this module's `overall` formula measure conceptually opposite things and
  should not be conflated when reporting either figure externally.
- `today = new Date('2025-05-15')` is hard-coded (same pattern as `regulatory-deadline-tracker`)
  — every days-to-deadline and timeline calculation is frozen relative to this date rather than
  the actual current date.
- No XBRL/ESEF validation logic exists — `assurance` is a binary format-check proxy, not an actual
  taxonomy-conformance validator.

**Framework alignment:** ESMA XBRL Taxonomy for ESEF Reporting / EFRAG ESRS XBRL Taxonomy (Draft)
— referenced as guide sources; the registry correctly distinguishes format requirements by
regulator (iXBRL for CSRD, XHTML/ESEF for SFDR/Taxonomy, EDGAR XBRL for SEC) without implementing
actual taxonomy validation · CSSF CSRD Filing Instructions — referenced, not directly modelled ·
GHG Protocol / TCFD / BRSR / ISSB-SSBJ / CBAM — all correctly represented as distinct regulatory
filing obligations with jurisdiction-appropriate regulators and real portal URLs.

## 9 · Future Evolution

### 9.1 Evolution A — Live clock, reconciled scoring, and real filing-package validation (analytics ladder: rung 1 → 2)

**What.** The 15-submission registry is genuine curated content (correct XHTML/ESEF vs iXBRL vs EDGAR-XBRL distinctions per regulator, SEC litigation status correctly flagged), but §7 documents an inverted-formula mismatch — the guide's readiness score `SR = validated/required × (1−error_rate)` vs the code's burden score `overall = complexity×0.25 + deadline×0.3 + (100−dataReady)×0.3 + assurance×0.15`, conceptually opposite metrics that must not be conflated — plus the frozen `today = new Date('2025-05-15')` (all timeline math silently stale) and no actual validation logic behind the `assurance` proxy. Evolution A fixes the clock, defines both metrics honestly, and adds real package validation.

**How.** (1) Live date immediately (same one-line class of fix as `regulatory-deadline-tracker`). (2) Keep both scores, named correctly: "jurisdiction burden" (the existing composite, documented) and "submission readiness" (the guide's formula, now implementable once field-level state exists — `validated_fields/required_fields` over a persisted submission-package checklist per filing). (3) Package validation: for XBRL/ESEF formats, run structural checks (taxonomy version, mandatory tags present, calculation-linkbase consistency) via an open validator library server-side, making `assurance` a real result instead of a format flag. (4) Registry rows gain review dates; SEC-style status changes are edits with history, converging on the shared regulatory fact base with the calendar/horizon modules.

**Prerequisites.** Submission-package schema per framework (start ESEF/CSRD); validator library selection. **Acceptance:** days-to-deadline advances daily; the two scores are labelled and move independently (readiness improves as fields validate; burden falls as deadlines pass); an ESEF package missing a mandatory tag fails validation with the tag named.

### 9.2 Evolution B — Filing-desk copilot for format and portal questions (LLM tier 1 → 2)

**What.** Filing teams' recurring questions are procedural: "what format does SEBI require for BRSR and through which portal?", "our ESEF validation failed on calculation consistency — what does that mean and where do I fix it?", "which of our 15 filings are within 45 days and below 80% readiness?" The copilot answers from the registry, live validation results, and readiness state.

**How.** Tier 1: RAG over the registry rows (format/portal/deadline fields) and the framework filing-manual excerpts; procedural answers cite the registry row and its review date. Tier 2: triage and validation-explainer answers call the Evolution-A endpoints — a validation-failure explanation quotes the validator's actual error (tag, linkbase rule) and maps it to the responsible checklist field, which is exactly the translation-of-machine-output-to-action work LLMs do well when grounded. Guardrails: no assertion of current regulator requirements beyond registry vintage; portal-submission actions remain human-only (the copilot prepares, never files); readiness figures only from the computed score.

**Prerequisites.** Evolution A's validation and readiness machinery; filing manuals chunked. **Acceptance:** validation explanations reference the actual validator error codes; triage lists match endpoint queries; every requirement claim carries the registry's as-of date.