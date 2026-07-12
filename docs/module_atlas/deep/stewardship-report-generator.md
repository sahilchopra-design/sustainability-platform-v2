## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch — static mock content, not even PRNG-generated.** The guide describes
> `Compliance = Principles_met / Total_principles` computed per framework, templates "auto-populated
> from engagement data," and a case-study generator that "selects an engagement and produces a
> structured narrative." **None of this is computed.** Every number in this file — UK Stewardship
> Code principle compliance %, ICGN principle scores, PRI module scores, case-study outcomes, report
> completion % — is a **literal hardcoded constant**; there is no `sr()` seeding, no formula, and no
> API call anywhere in the 218-line file. A real backend engine (`backend/services/
> stewardship_engine.py`, 742 lines) exists with genuine engagement-scoring and escalation logic, but
> this page never calls it.

### 7.1 What the module computes

Nothing is computed — four static reference tables are rendered directly:

```
UK_PRINCIPLES   — 12 principles (P1–P12), each a hardcoded {compliance, evidence} pair, e.g.
                  P1 Purpose & Governance: compliance=92, evidence=88
                  P8 Monitoring Service Providers: compliance=68, evidence=60  (lowest of the 12)
ICGN_DATA       — 7 principles, hardcoded scores 72–90
PRI_SCORES      — 6 modules, hardcoded score/maxScore out of 5 (e.g. Fixed Income 3/5)
CASE_STUDIES    — 4 hardcoded named engagement narratives (Shell, Barclays, Glencore, Toyota)
REPORTS         — 4 hardcoded report-pipeline rows with a literal completePct
```

The only "calculation" in the file is `Math.round(REPORTS.reduce((s,r)=>s+r.completePct,0)/
REPORTS.length)` — an average of 4 hardcoded percentages (72, 58, 100, 45 → **69%** "Avg Completion"
KPI).

### 7.2 Parameterisation

| Table | Values | Provenance |
|---|---|---|
| UK Stewardship Code 12 principles | Compliance 68–92%, evidence 60–88% | Real principle titles (FRC 2020 Code); scores are illustrative constants with no computation basis |
| ICGN 7 principles | Scores 72–90 | Real principle categories; illustrative constants |
| PRI 6 modules | 3–4 out of 5 | Real PRI Reporting Framework module names; illustrative constants |
| Case studies | 4 named real companies (Shell, Barclays, Glencore, Toyota) | Plausible, real-world-consistent engagement narratives, presented as fixed examples not generated from actual engagement records |

### 7.3 Calculation walkthrough

1. **Report Builder tab** — 4 KPI cards (`Active Reports`, `Templates`, `Case Studies`, `Avg
   Completion`) computed from `REPORTS.length`/`CASE_STUDIES.length`/the literal-average above, plus
   a pipeline table with a progress bar per report.
2. **UK Stewardship Code / ICGN / PRI tabs** — bar/radar charts of the static tables above, with no
   drill-down computation.
3. **Case Study Generator tab** — displays the 4 fixed `CASE_STUDIES` entries; despite the guide's
   claim of a generator that "selects an engagement and produces a structured narrative," there is no
   selection logic or narrative-generation code — the 4 entries are the entire dataset.
4. **Export Centre tab** — UI affordances (buttons) for export; no export logic is implemented in the
   portion of the file reviewed (no CSV/PDF generation call).

### 7.4 Worked example

`Avg Completion = round((72+58+100+45)/4) = round(68.75) = 69%` — the only genuinely computed number
on the page.

### 7.5 The real (disconnected) backend engine

`backend/services/stewardship_engine.py` implements a real per-company engagement-effectiveness
scorer that this page could call but does not:

```
_engagement_score(e) =  20 (baseline, any engagement)
                       + intensity_bonus×10   (intensity ∈ {low:1, medium:2, high:3, critical:4})
                       + 20 (if objectives_set)
                       + 20 (if milestone_achieved)
                       + 15 / −10 / −20  (outcome: positive / stalled / failed)
                       + 5  (if ≥3 engagement types used)
                       clamped to [0,100]
```

`_rating(score)`: `advanced ≥75`, `progressing ≥50`, `developing ≥25`, else `initial`.
`_escalation_signal` walks a real `ESCALATION_LADDER` (engagement type → escalation level) and
recommends escalation based on months since last contact and outcome, citing **GFANZ-E-2** guidance
("requires escalation to assertive stewardship after…"). This is a substantive, defensible
rules-based scoring engine — entirely unused by the report generator UI.

### 7.6 Data provenance & limitations

- Every score in this module is a fixed illustrative constant, not derived from any actual fund's
  engagement records, voting history, or PRI submission.
- The case-study narratives, while plausible and referencing real companies (Shell, Barclays,
  Glencore, Toyota), are fixed demo content, not generated from an underlying engagement database.
- The real backend `stewardship_engine.py` scoring/escalation logic is validated, cites a named
  standard (GFANZ-E-2), and should be the actual data source for this page — the remediation path is
  wiring, not building a new model.

**Framework alignment:** UK Stewardship Code 2020 (real 12 principles reproduced, scores fictional) ·
ICGN Global Stewardship Principles (real 7-category structure, scores fictional) · PRI Reporting
Framework (real 6-module structure, scores fictional) · GFANZ-E-2 escalation guidance (genuinely
cited and implemented in the disconnected backend engine).
