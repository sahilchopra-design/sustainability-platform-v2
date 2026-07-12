## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (backend wiring).** A real backend service and route file exist
> (`backend/services/scheduled_reports_service.py`, `api/v1/routes/scheduled_reports.py`, with the
> 8 real endpoints listed in `trace_labels`), but **the frontend never calls them** — `grep -n
> "fetch(\|axios\|api/v1"` over `ScheduledReportsPage.jsx` returns zero matches. All schedule and
> execution-log state is generated client-side and persisted to `localStorage`
> (`ra_schedules_v1`, `ra_schedule_exec_log_v1`). This is the same "real backend, disconnected
> frontend" pattern seen in `reporting-hub` and `residential-re-assessment` in this batch.

### 7.1 What the module computes

```
successRate    = completedRuns / nonSkippedRuns x 100    // completion-status rate, NOT time-window SLA
avgGenTime     = mean(execLog[completed].duration_sec)
autoSendCount  = count(schedules where auto_send === true)
totalReportsYear = Sum(schedules) of frequencyMultiplier[sch.frequency]
                    where {Weekly:52, Monthly:12, Quarterly:4, 'Semi-Annual':2, Annual:1}
slaPct(schedule) = schedule.slaTarget
                    ? clip((daysUntilDue / slaTarget) x 100, 0, 100)
                    : 50                                   // default when no SLA target set
```

### 7.2 Parameterisation

| Component | Content | Provenance |
|---|---|---|
| `CLIENT_MAP` (8 clients) | Nordic Pension Fund (EU, SFDR/TCFD/EU Taxonomy, 15-day SLA), CalPERS ESG Mandate (US, TCFD/PRI/SEC, 20-day), Swiss Re Insurance (CH, TCFD/PCAF/TNFD, 30-day), SEBI Compliance Fund (IN, BRSR/SEBI ESG, 45-day), Green Bond Investors Ltd (UK, 15-day), Tokyo ESG Partners (JP, ISSB/TCFD, 30-day), Sovereign Wealth Fund Abu Dhabi (AE, 60-day), Impact Ventures Europe (EU, EDCI, 15-day) | Realistic composite client archetypes with plausible jurisdiction-appropriate SLA windows and framework assignments (correctly matches jurisdiction to regulatory framework, e.g. India→BRSR/SEBI, US→SEC) |
| `REPORT_TYPES` (12) | SFDR PAI, TCFD, PCAF, CSRD E1/Full, EU Taxonomy, BRSR, TNFD, GRI, ISSB, Client Quarterly, Custom | Real disclosure-framework taxonomy, consistent with the platform's other report-template modules |
| `frequencyMultiplier` | Weekly=52, Monthly=12, Quarterly=4, Semi-Annual=2, Annual=1 | Correct calendar arithmetic for annualising a recurring schedule |
| `execLog` duration | `60 + sr()x200` seconds | Synthetic demo generation-time distribution |
| `slaPct` fallback | 50% when no `slaTarget` set | Arbitrary neutral default |

### 7.3 Calculation walkthrough

1. `successRate` filters `execLog` to non-skipped runs, then computes the completed fraction —
   this is a genuine deterministic ratio, but it measures **completion status**, not **on-time
   delivery within tolerance** as the guide's formula (`Reports Delivered on Schedule ÷ Total
   Scheduled Reports`) implies; a report that completes 3 days late would count identically to one
   that completes on time, because the code never compares `duration_sec` or completion timestamp
   against the schedule's SLA window.
2. `avgGenTime` and `totalReportsYear` are straightforward, correctly-implemented aggregations.
3. `slaDash` filters to scheduled (not paused/completed) schedules with a `next_run` date, and for
   each computes `pct = clip((daysUntilDue/slaTarget)×100, 0, 100)` — a genuine countdown-to-due
   percentage, correctly clamped to [0,100], giving a visual "how much runway is left before this
   report is due" indicator.
4. `dataReadiness` cross-references `DATA_MODULES` (13 platform modules) against a
   `freshness_days` threshold to flag stale upstream data sources feeding into scheduled reports —
   a genuine, useful dependency-freshness check, though the freshness values themselves are static
   seed data, not live module-update timestamps.

### 7.4 Worked example

For a schedule with `slaTarget=15` days (matching a "Nordic Pension Fund" SFDR schedule) and
`daysUntilDue=4`: `slaPct = clip((4/15)×100, 0, 100) = clip(26.7, 0, 100) = 26.7%` — interpreted as
"73% of the SLA countdown has elapsed, 27% runway remaining," correctly flagging urgency as the
due date approaches.

For `successRate`: if `execLog` has 40 non-skipped runs of which 38 show `status==='completed'`:
`successRate = round(38/40 × 100) = 95%` — displayed in green per the `successRate >= 95` colour
threshold in the code.

### 7.5 Data provenance & limitations

- All client, schedule, and execution-log data is synthetic/hand-authored demo content persisted
  to `localStorage` — there is no live report-generation pipeline behind this dashboard, and the
  real backend `scheduled_reports_service.py`/route exist but are unused by this page.
- `successRate` measures completion status, not genuine on-time-within-tolerance delivery as the
  guide's formula implies — a systematically late-but-eventually-completing schedule would show a
  misleadingly high success rate.
- `dataReadiness` freshness flags are static, not derived from actual module last-updated
  timestamps, despite representing themselves as a live dependency check.

**Framework alignment:** ISO 8601 date/time handling (correctly implemented via `Date` arithmetic)
· Platform SLA documentation (client SLA windows are jurisdiction-appropriate and plausible, though
static) · the guide's regulatory-framework-per-client mapping (SFDR/TCFD/PCAF/BRSR/ISSB/TNFD) is
accurate and correctly jurisdiction-matched.
