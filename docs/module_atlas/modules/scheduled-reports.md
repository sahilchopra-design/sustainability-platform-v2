# Scheduled Reports
**Module ID:** `scheduled-reports` · **Route:** `/scheduled-reports` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Report scheduling, delivery automation, and subscription management enabling recurring distribution of sustainability disclosures and analytics to stakeholders.

> **Business value:** Automates recurring sustainability report generation and multi-channel delivery to reduce manual effort and ensure timeliness.

**How an analyst works this module:**
- Configure report template, parameters and output format (PDF, XLSX, JSON).
- Set recurrence schedule (daily, weekly, monthly, quarterly) and delivery window.
- Add subscriber list with role-based access and delivery channel preferences.
- Monitor delivery status, retry failed runs, and archive completed reports.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `BACKEND_FREQUENCY_MAP`, `BACKEND_REPORT_TYPE_MAP`, `Badge`, `Btn`, `CLIENT_MAP`, `Card`, `DATA_MODULES`, `DEFAULT_SCHEDULES`, `FORMATS`, `FREQUENCIES`, `FREQUENCY_LABEL`, `Input`, `KPI`, `LS_EXEC_LOG`, `LS_NOTIFICATIONS`, `LS_PORT`, `LS_SCHEDULES`, `REPORT_TYPES`, `REPORT_TYPE_LABEL`, `SCHED_API`, `SEED_EXEC_LOG`, `STATUS_COLORS`, `ScheduleForm`, `SortHeader`, `TEMPLATES`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REPORT_TYPES` | 13 | `label` |
| `DEFAULT_SCHEDULES` | 11 | `client_id`, `report_type`, `template`, `frequency`, `next_run`, `last_run`, `status`, `auto_send`, `recipients`, `format`, `sections`, `data_check`, `sla_buffer`, `created` |
| `SEED_EXEC_LOG` | 12 | `timestamp`, `status`, `duration_sec`, `report_size_kb`, `error` |
| `DATA_MODULES` | 13 | `name`, `last_updated`, `freshness_days` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `SCHED_API` | ``${API}/api/v1/scheduled-reports`;` |
| `BACKEND_REPORT_TYPE_MAP` | `{ // frontend value -> backend ReportType value` |
| `BACKEND_FREQUENCY_MAP` | `{ // frontend value -> backend ReportFrequency value (no semi-annual/annual on backend)` |
| `REPORT_TYPE_LABEL` | `{ // backend ReportType value -> display label` |
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `fmtD` | `d => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';` |
| `fmtDT` | `d => d ? new Date(d).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';` |
| `daysBetween` | `(a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);` |
| `FREQUENCIES` | `['Weekly','Monthly','Quarterly','Semi-Annual','Annual'];` |
| `FORMATS` | `['PDF','HTML','PDF+XBRL','Excel','Interactive'];` |
| `body` | `rows.map(r => cols.map(c => `"${String(c.get(r)\|\|'').replace(/"/g,'""')}"`).join(',')).join('\n');` |
| `autoSendCount` | `useMemo(() => schedules.filter(s => s.auto_send).length, [schedules]); const avgGenTime = useMemo(() => { const completed = execLog.filter(e => e.status === 'completed' && e.duration_sec); return completed.length ? Math.round(completed.reduce((s, e) => s + e.duration_sec, 0) / completed.length) : 0; }, [execLog]);` |
| `successRate` | `useMemo(() => { const runs = execLog.filter(e => e.status !== 'skipped'); return runs.length ? Math.round((runs.filter(e => e.status === 'completed').length / runs.length) * 100) : 100; }, [execLog]);` |
| `totalReportsYear` | `useMemo(() => schedules.reduce((s, sch) => { const f = { Weekly:52, Monthly:12, Quarterly:4, 'Semi-Annual':2, Annual:1 }; return s + (f[sch.frequency] \|\| 1); }, 0), [schedules]);` |
| `sortedLog` | `useMemo(() => { let res = execLog.map(e => ({ ...e, clientName: clientName(schedules.find(s => s.id === e.schedule_id)?.client_id \|\| ''), reportType: (REPORT_TYPES.find(r => r.value === (schedules.find(s => s.id === e.schedule_id) \|\| {}).report_type) \|\| {}).label \|\| '' }));` |
| `dataReadiness` | `useMemo(() => DATA_MODULES.map(m => {` |
| `slaDash` | `useMemo(() => schedules.filter(s => s.next_run && s.status === 'scheduled').map(s => {` |
| `entry` | `{ schedule_id: schedId, timestamp: new Date().toISOString(), status: 'completed', duration_sec: Math.round(60 + sr(_sc++) * 200), report_size_kb: Math.round(1000 + sr(_sc++) * 5000), error: null };` |
| `batchPauseAll` | `useCallback(() => { setSchedules(prev => prev.map(s => ({ ...s, status:'paused' }))); }, []);` |
| `batchResumeAll` | `useCallback(() => { setSchedules(prev => prev.map(s => s.status === 'paused' ? { ...s, status:'scheduled' } : s)); }, []);` |
| `pct` | `s.slaTarget ? Math.min(100, Math.max(0, (s.days / s.slaTarget) * 100)) : 50;` |
| `offset` | `firstDay === 0 ? 6 : firstDay - 1;` |
| `daysInMonth` | `new Date(2025, calendarMonth + 1, 0).getDate();` |
| `dateStr` | ``2025-${String(calendarMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/scheduled-reports` | `create_report` | api/v1/routes/scheduled_reports.py |
| GET | `/api/v1/scheduled-reports` | `list_reports` | api/v1/routes/scheduled_reports.py |
| GET | `/api/v1/scheduled-reports/{report_id}` | `get_report` | api/v1/routes/scheduled_reports.py |
| PATCH | `/api/v1/scheduled-reports/{report_id}` | `update_report` | api/v1/routes/scheduled_reports.py |
| DELETE | `/api/v1/scheduled-reports/{report_id}` | `delete_report` | api/v1/routes/scheduled_reports.py |
| POST | `/api/v1/scheduled-reports/{report_id}/toggle` | `toggle_report` | api/v1/routes/scheduled_reports.py |
| GET | `/api/v1/scheduled-reports/due/list` | `get_due_reports_list` | api/v1/routes/scheduled_reports.py |
| GET | `/api/v1/scheduled-reports/options/types` | `get_report_types` | api/v1/routes/scheduled_reports.py |
| GET | `/api/v1/scheduled-reports/options/frequencies` | `get_frequencies` | api/v1/routes/scheduled_reports.py |

### 2.3 Engine `scheduled_reports_service` (services/scheduled_reports_service.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_db_engine` |  | Get or create database engine. |
| `create_scheduled_report_table` |  | Create scheduled reports table if not exists. |
| `calculate_next_run` | frequency, from_date | Calculate next run time based on frequency. |
| `create_scheduled_report` | report, user_id | Create a new scheduled report. |
| `get_scheduled_report` | report_id | Get scheduled report by ID. |
| `list_scheduled_reports` | user_id, active_only | List all scheduled reports. |
| `update_scheduled_report` | report_id, updates | Update a scheduled report. |
| `delete_scheduled_report` | report_id | Delete a scheduled report. |
| `get_due_reports` |  | Get reports that are due to run. |
| `mark_report_executed` | report_id | Mark a report as executed and calculate next run. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `real-db`

**Database tables:** `datetime` *(shared)*, `failed`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DATA_MODULES`, `DEFAULT_SCHEDULES`, `FORMATS`, `FREQUENCIES`, `REPORT_TYPES`, `SEED_EXEC_LOG`, `TABS`, `TEMPLATES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Schedules | — | Platform config | Number of active recurring report schedules across all users and report types. |
| Delivery Rate | — | Audit log | Share of scheduled reports delivered on time in the trailing 90-day period. |
| Subscribers | — | User registry | Total stakeholder email/API subscriptions receiving automated report delivery. |
- **Report templates, parameter sets, subscriber registry** → Schedule execution, report generation, delivery dispatch → **Delivered report archive, delivery logs, failure alerts**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/scheduled-reports** — status `passed`, provenance ['real-db'], source tables: `scheduled_reports`
Output: `{'type': 'object', 'keys': ['items', 'total'], 'n_keys': 2}`

**GET /api/v1/scheduled-reports/due/list** — status `passed`, provenance ['real-db'], source tables: `scheduled_reports`
Output: `{'type': 'object', 'keys': ['items', 'total'], 'n_keys': 2}`

**GET /api/v1/scheduled-reports/options/frequencies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frequencies'], 'n_keys': 1}`

**GET /api/v1/scheduled-reports/options/types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['types'], 'n_keys': 1}`

**GET /api/v1/scheduled-reports/{report_id}** — status `passed`, provenance ['real-db'], source tables: `scheduled_reports`
Output: `{'type': 'object', 'keys': ['id', 'name', 'report_type', 'frequency', 'recipients', 'format', 'parameters', 'is_active', 'next_run', 'last_run', 'created_at'], 'n_keys': 11}`

**POST /api/v1/scheduled-reports** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**PATCH /api/v1/scheduled-reports/{report_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**DELETE /api/v1/scheduled-reports/{report_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** On-Time Delivery Rate
**Headline formula:** `Reports Delivered on Schedule ÷ Total Scheduled Reports × 100`

Percentage of scheduled report runs delivered within the configured tolerance window.

**Standards:** ['Internal SLA', 'Platform audit log']
**Reference documents:** ISO 8601 Date/Time Standard; Platform SLA Documentation; GDPR Data Minimisation Principles (subscriber management)

**Engine `scheduled_reports_service` — extracted transformation lines:**
```python
next_run = base.replace(hour=6, minute=0, second=0, microsecond=0) + timedelta(days=1)
days_until_monday = (7 - base.weekday()) % 7 or 7
next_run = base.replace(hour=6, minute=0, second=0, microsecond=0) + timedelta(days=days_until_monday)
next_run = base.replace(year=base.year + 1, month=1, day=1, hour=6, minute=0, second=0, microsecond=0)
next_run = base.replace(month=base.month + 1, day=1, hour=6, minute=0, second=0, microsecond=0)
next_quarter_idx = (quarter_starts.index(current_quarter_start) + 1) % 4
next_year = base.year if next_quarter_idx > 0 else base.year + 1
next_run = base + timedelta(days=7)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Wire the existing scheduler backend and make SLA real (analytics ladder: rung 1 → 2)

**What.** §7 documents the familiar disconnect: a real backend (`scheduled_reports_service.py`, 8 endpoints) the frontend never calls — all schedule and execution-log state lives in `localStorage`, hand-authored. Two metric defects compound it: `successRate` counts completion, not on-time delivery (a systematically late schedule scores misleadingly high, contradicting the guide's own formula intent), and `dataReadiness` freshness flags are static despite presenting as a live dependency check. Evolution A wires the UI to its backend and makes both metrics honest.

**How.** (1) Replace localStorage state with the 8 existing endpoints; schedules, runs, and logs become server-side, org-scoped, and shareable — the scheduling concept only means anything when a server actually executes on schedule (a background job runner ticking the service is part of this stage if not already live). (2) On-time SLA: each run records scheduled-vs-actual delivery timestamps; `successRate` splits into completion rate and on-time-within-tolerance rate, both reported. (3) `dataReadiness` computed from real dependency freshness — the source modules' last-computed timestamps (the widget-bus/artifact metadata the dashboard-builder evolution establishes serves double duty here), so a report scheduled on stale scenario data warns before it sends. (4) Delivery integrates with `report-generator`'s compose pipeline so what ships is the engine-sourced document, not a placeholder.

**Prerequisites.** Job-runner infrastructure confirmed; artifact-freshness metadata from sibling modules. **Acceptance:** a schedule created in the UI appears via the backend API and fires without the browser open; late-but-complete runs degrade the on-time rate, not the completion rate; readiness flags change when a dependency actually goes stale.

### 9.2 Evolution B — Subscription concierge and delivery-failure triage (LLM tier 2)

**What.** Scheduling UIs accumulate cruft; a copilot keeps them intentional: "set up a monthly financed-emissions pack for the credit committee, first business day, DOCX, only if the underlying data refreshed this month" — natural-language schedule creation mapped onto the backend's schedule schema with the freshness condition attached; and triage: "why did Tuesday's board pack not deliver?" answered from the execution log (dependency stale, generation error, delivery failure) with the specific cause quoted.

**How.** Tier-2 tool calls over the schedule/run/log endpoints; schedule creation is a confirmation-gated mutation (the copilot drafts the schedule object, the user approves — the roadmap's RBAC-gated write pattern). Failure triage reads the run's recorded error states and dependency snapshot, mapping each to a documented remediation ("scenario run is 45 days old — re-run scenario-stress-test or relax the freshness condition"). Subscription reviews ("which schedules delivered to no active recipients last quarter?") are computed log queries proposed for cleanup, never auto-deleted.

**Prerequisites (hard).** Evolution A's live backend and logged runs — triaging a hand-authored demo log is theatre; mutation confirmation flow. **Acceptance:** created schedules match the confirmed draft exactly; every triage explanation quotes logged states; cleanup proposals list only schedules matching the stated computed criteria.