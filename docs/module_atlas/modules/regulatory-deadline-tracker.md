# Regulatory Deadline Tracker
**Module ID:** `regulatory-deadline-tracker` · **Route:** `/regulatory-deadline-tracker` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Compliance deadline monitoring tool for ESG reporting obligations, providing real-time status tracking, owner assignment, and escalation workflows.

> **Business value:** Provides compliance teams with a systematic workflow tool to manage ESG regulatory deadlines, prevent missed filings, and maintain audit-ready completion records.

**How an analyst works this module:**
- Import or configure regulatory obligation register.
- Assign owners and sub-tasks to each deadline.
- Track completion progress and update statuses.
- Review Deadline Risk Score dashboard and action escalations.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FRAMEWORKS`, `JURISDICTIONS`, `PRIORITIES`, `REQUIREMENTS`, `REQ_NAMES`, `RESPONSIBLE`, `STATUSES`, `TODAY`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TODAY` | `new Date('2026-04-07');` |
| `frameworkIdx` | `Math.floor(sr(i * 7) * FRAMEWORKS.length);` |
| `jurIdx` | `Math.floor(sr(i * 11) * JURISDICTIONS.length);` |
| `statusIdx` | `Math.floor(sr(i * 13) * STATUSES.length);` |
| `priorityIdx` | `Math.floor(sr(i * 17) * PRIORITIES.length);` |
| `respIdx` | `Math.floor(sr(i * 19) * RESPONSIBLE.length);` |
| `month` | `Math.floor(1 + sr(i * 23) * 23) % 24;` |
| `year` | `2026 + Math.floor(month / 12);` |
| `mon` | `(month % 12) + 1;` |
| `day` | `Math.floor(1 + sr(i * 29) * 27);` |
| `deadline` | ``${year}-${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}`;` |
| `gapCount` | `STATUSES[statusIdx] === 'Compliant' ? 0 : Math.floor(sr(i * 37) * 12);` |
| `evidenceItems` | `Math.floor(completionPct / 10 * (1 + sr(i * 41)));` |
| `estimatedHours` | `Math.round(20 + sr(i * 43) * 480);` |
| `total` | `REQUIREMENTS.reduce((s, r) => s + priorityW[r.priority] * (1 - r.completionPct / 100) * urgency(r.daysToDeadline), 0);` |
| `totalGaps` | `reqs.reduce((s, r) => s + r.gapCount, 0);` |
| `avgCompl` | `fwReqs.length>0 ? fwReqs.reduce((s,r)=>s+r.completionPct,0)/fwReqs.length : 0;` |
| `totalHrs` | `fwReqs.reduce((s,r)=>s+r.estimatedHours*(1-r.completionPct/100),0);` |
| `hrs` | `fwReqs.filter(r=>r.priority===p).reduce((s,r)=>s+r.estimatedHours*(1-r.completionPct/100),0);` |
| `avgComp` | `jItems.length>0 ? Math.round(jItems.reduce((a,r)=>a+r.completionPct,0)/jItems.length) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FRAMEWORKS`, `JURISDICTIONS`, `PRIORITIES`, `REQ_NAMES`, `RESPONSIBLE`, `STATUSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Tracked Deadlines (Active) | — | Deadline Registry | Total regulatory filing deadlines currently tracked for the entity. |
| On-Track (%) | — | Completion Status | Share of active deadlines where workflow completion is on schedule. |
| Escalation Alerts | — | Alert Engine | Number of deadlines with Deadline Risk Score above threshold requiring senior review. |
- **Regulatory deadline database + workflow status data** → Deadline risk scoring; owner assignment; escalation evaluation → **Deadline tracker dashboard with risk scores and escalation alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** Deadline Risk Score
**Headline formula:** `DR = (1 – completion_pct) × (1 / days_remaining) × materiality`

Urgency-weighted incompleteness score surfacing highest-risk upcoming deadlines for escalation.

**Standards:** ['Internal Compliance Framework']
**Reference documents:** CSRD Directive (EU) 2022/2464; ESRS Set 1 Final Standards (EFRAG, 2023)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

This module comes closer than most siblings to genuinely implementing its guide's formula. The
guide's Deadline Risk Score is `DR = (1−completion_pct) × (1/days_remaining) × materiality`; the
code implements a **discretised, tiered variant** of the same idea:

```js
urgency(days) = days<0 ? 3 : days<30 ? 2.5 : days<60 ? 2 : days<90 ? 1.5 : 1     // tiered proxy for 1/days_remaining
priorityW = { Critical:4, High:3, Medium:2, Low:1 }                              // proxy for "materiality"
riskScore = Σ[ priorityW[priority] × (1 − completionPct/100) × urgency(daysToDeadline) ] / N
```

This is a legitimate simplification (a continuous `1/days_remaining` term would blow up near a
deadline and needs a floor anyway; the 5-tier `urgency()` function achieves the same monotonic
ordering without a division-by-near-zero risk) — one of the more defensible risk-scoring
approximations found in this batch.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `TODAY` | hard-coded `new Date('2026-04-07')` | **Frozen reference date** — every `daysToDeadline`/`urgency` calculation is relative to this fixed date, not the browser's actual current date, so the risk score and status buckets will silently drift out of sync with reality as real time passes beyond April 2026 |
| `urgency()` tiers | Overdue→3, <30d→2.5, <60d→2, <90d→1.5, else→1 | Synthetic — monotonically decreasing with time-to-deadline, correct ordinal direction |
| `priorityW` | Critical 4, High 3, Medium 2, Low 1 | Synthetic linear weighting |
| `completionPct` | 100 if Compliant, 0 if Not Started, else `10+sr()×80` (10–90%) if In Progress/Overdue | Synthetic but logically gated by status |
| Framework/jurisdiction universe | 18 frameworks (CSRD, ISSB, TCFD, SFDR, EU Taxonomy, UK SDR, SEC Climate, ASIC, MAS, FSB, HKMA, TNFD, GRI, CDP, SASB, BRSR, IFRS S1/S2) × 20 jurisdictions | Real, comprehensive framework/jurisdiction lists |

### 7.3 Calculation walkthrough

1. **Requirement generation** (`REQUIREMENTS`, **80 rows** — guide states "41 Tracked Deadlines
   (Active)"): framework/jurisdiction/status/priority/responsible party drawn via `sr()`; deadline
   built from a `month∈[1,24]%24` + `day∈[1,28]` synthetic date within a rolling 2-year window from
   `TODAY`; `completionPct` gated by status (see §7.2); `gapCount` (0 if Compliant, else 0–12,
   `sr(i×37)×12`); `evidenceItems = completionPct/10 × (1+sr())`; `estimatedHours = 20+sr()×480`.
2. **`daysDiff()`**: `round((deadlineDate − TODAY) / 86,400,000)` — a correct day-count
   calculation, but relative to the frozen `TODAY` constant rather than `new Date()`.
3. **Portfolio risk score** (`riskScore`): single scalar, the mean of all 80 requirements'
   `priorityW × incompleteness × urgency` products — a portfolio-level aggregate, not surfaced
   per-requirement in the excerpt reviewed (i.e. no visible per-row "risk score" column to drive a
   ranked escalation list, despite the guide's "Deadline Risk Score dashboard" framing implying
   per-item escalation).
4. **Filters/table**: jurisdiction multi-select toggle, search, sortable columns.
5. **Quarterly view**: buckets `REQUIREMENTS` by deadline quarter for a bar chart.
6. **Framework rollup**: `avgCompl` (mean completion by framework), `totalHrs` (Σ
   `estimatedHours×(1−completionPct/100)` — remaining effort, correctly weighted by
   incompleteness), `hrs` by priority tier.
7. **Jurisdiction rollup**: `avgComp` — mean completion by jurisdiction.

### 7.4 Worked example

Requirement `i=0`: `sr(0)` seeds determine framework/jurisdiction/status/priority/responsible;
suppose `status='In Progress'`, `priority='Critical'`, `completionPct=45%`,
`deadline` resolves to a date 20 days after `TODAY` (2026-04-07):

| Step | Formula | Result |
|---|---|---|
| `daysToDeadline` | `round((deadline − 2026-04-07)/86.4M ms)` | **20** |
| `urgency(20)` | `20<30` | **2.5** |
| `priorityW['Critical']` | lookup | **4** |
| `(1 − 0.45)` | incompleteness | **0.55** |
| Contribution to `riskScore` numerator | `4 × 0.55 × 2.5` | **5.5** |

Averaged across all 80 requirements (mix of statuses/priorities/urgencies), `riskScore` lands in
the low single digits — the exact portfolio value depends on the full seeded distribution.

### 7.5 Status/priority rubric

| Status | Colour | Priority | Weight |
|---|---|---|---|
| Compliant | green | Critical | 4 |
| In Progress | blue | High | 3 |
| Overdue | red | Medium | 2 |
| Not Started | grey | Low | 1 |

### 7.6 Companion analytics

Requirement table (filterable/sortable), quarterly deadline distribution, framework rollup
(completion %, remaining hours by priority), jurisdiction rollup (completion %), portfolio risk
score KPI.

### 7.7 Data provenance & limitations

- **All 80 requirements are synthetic**, `sr(seed)=frac(sin(seed+1)×10⁴)`; framework/jurisdiction
  universes are real and comprehensive, but the specific requirement-to-framework-to-jurisdiction
  assignments are randomised, not sourced from an actual entity's compliance calendar.
- **The frozen `TODAY` constant is the module's clearest defect**: every days-remaining and
  urgency calculation silently becomes wrong the moment real time passes 2026-04-07, since nothing
  recomputes it from `new Date()`. This should be the first fix if the module is put into
  production use.
- 80 requirements vs the guide's stated "41 Tracked Deadlines (Active)" — the guide's other cited
  figures (83% on-track, 3 escalation alerts) are not independently verifiable against the code's
  actual distribution without running it, since status/completion are randomised per load.
- `riskScore` is portfolio-level only in the reviewed code path — a genuine escalation workflow
  needs the per-requirement score exposed and sortable, not just the aggregate mean.

**Framework alignment:** the risk-scoring approach (priority × incompleteness × urgency) is a
reasonable, auditable approximation of the guide's own `DR` formula — closer to a defensible
production design than most modules in this batch, main gaps being the frozen reference date and
lack of per-item score exposure · CSRD/ESRS — cited as guide source; the 18-framework universe
(including ISSB, TCFD, SFDR, EU Taxonomy, SEC Climate, BRSR, IFRS S1/S2) covers the real global
disclosure-regime landscape accurately as category labels, though specific requirement-deadline
pairings are randomised rather than sourced from actual official effective-date calendars.

## 9 · Future Evolution

### 9.1 Evolution A — Live clock, real register, per-item escalation (analytics ladder: rung 1 → 2)

**What.** The scoring is unusually defensible for tier B: the code's tiered urgency × priority × incompletion risk score is a legitimate discretisation of the guide's `DR = (1−completion) × (1/days) × materiality` (§7.1 notes it even avoids the near-deadline division blow-up). But §7.7 flags a disqualifying defect — `TODAY` is a frozen constant (2026-04-07), so every days-remaining figure silently went wrong the day after it was written — plus an all-synthetic 80-item register and a risk score computed only at portfolio level, with no per-item escalation path. Evolution A fixes the clock, persists a real register, and completes the escalation workflow.

**How.** (1) The one-line-fix first: `TODAY = new Date()` (or server time), with days-remaining recomputed per render — nothing else on the page is trustworthy until this ships. (2) Converge on the platform's regulatory-calendar backend as the obligation source (its 26 article-referenced records with live `_compute_urgency` are exactly what this tracker's synthetic rows imitate) and add this module's workflow layer on top: owner, completion %, evidence attachments, per-item risk score using the existing tiered formula. (3) Escalation becomes real: threshold breaches on per-item scores generate persisted alerts with an audit trail (the module's stated purpose). (4) The guide's stale figures (41 deadlines, 83% on-track) replaced by live aggregates.

**Prerequisites.** Coordination with `regulatory-calendar`'s Evolution A (shared register, two surfaces: calendar view vs workflow view — deliberately not two registers); org-scoped status tables. **Acceptance:** days-remaining changes overnight without a deploy; per-item risk scores reproduce from the formula; an item crossing the critical tier generates a timestamped alert row.

### 9.2 Evolution B — Compliance-workload triage copilot (LLM tier 2)

**What.** Compliance managers start the week asking "what needs attention?". The copilot answers from live state: "top-10 items by risk score with owners and blockers", "which CSRD items are behind their historical completion pace?", "draft the escalation email for the two overdue BRSR items with their evidence status" — operational triage where every claim comes from register rows and computed scores.

**How.** Tier-2 tool schemas over the register/score/alert endpoints; the drafted escalation uses the item's stored owner, deadline, completion %, and alert history — the copilot composes, never invents status. Pace analysis (behind/ahead) requires completion history, which the Evolution-A status table provides via timestamped updates. Guardrails: the copilot cannot mark items complete or reassign owners without the confirmation-gated mutation path; deadline authority remains the linked calendar record, cited per answer. This module and the calendar concierge share a corpus but differ in verbs — the calendar explains obligations, this copilot manages execution.

**Prerequisites (hard).** Evolution A (triage over the frozen-clock synthetic register would misprioritize by construction); completion-history timestamps. **Acceptance:** the top-10 list matches the score endpoint's ordering; escalation drafts contain only stored facts; mutation requests route through confirmation.