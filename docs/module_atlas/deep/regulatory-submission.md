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
