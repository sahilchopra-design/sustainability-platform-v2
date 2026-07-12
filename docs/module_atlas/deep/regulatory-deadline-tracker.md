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
