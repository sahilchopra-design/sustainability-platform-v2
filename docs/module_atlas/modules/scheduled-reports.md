# Scheduled Reports
**Module ID:** `scheduled-reports` · **Route:** `/scheduled-reports` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Report scheduling, delivery automation, and subscription management enabling recurring distribution of sustainability disclosures and analytics to stakeholders.

> **Business value:** Automates recurring sustainability report generation and multi-channel delivery to reduce manual effort and ensure timeliness.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CLIENT_MAP`, `Card`, `DATA_MODULES`, `DEFAULT_SCHEDULES`, `FORMATS`, `FREQUENCIES`, `Input`, `KPI`, `LS_EXEC_LOG`, `LS_NOTIFICATIONS`, `LS_PORT`, `LS_SCHEDULES`, `REPORT_TYPES`, `SEED_EXEC_LOG`, `STATUS_COLORS`, `ScheduleForm`, `SortHeader`, `TEMPLATES`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `fmtD` | `d => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';` |
| `fmtDT` | `d => d ? new Date(d).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';` |
| `daysBetween` | `(a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);` |
| `FREQUENCIES` | `['Weekly','Monthly','Quarterly','Semi-Annual','Annual'];` |
| `FORMATS` | `['PDF','HTML','PDF+XBRL','Excel','Interactive'];` |
| `body` | `rows.map(r => cols.map(c => `"${String(c.get(r)\|\|'').replace(/"/g,'""')}"`).join(',')).join('\n');` |
| `avgGenTime` | `useMemo(() => { const completed = execLog.filter(e => e.status === 'completed' && e.duration_sec); return completed.length ? Math.round(completed.redu` |
| `successRate` | `useMemo(() => { const runs = execLog.filter(e => e.status !== 'skipped'); return runs.length ? Math.round((runs.filter(e => e.status === 'completed').` |
| `totalReportsYear` | `useMemo(() => schedules.reduce((s, sch) => { const f = { Weekly:52, Monthly:12, Quarterly:4, 'Semi-Annual':2, Annual:1 }; return s + (f[sch.frequency]` |
| `res` | `execLog.map(e => ({ ...e, clientName: clientName(schedules.find(s => s.id === e.schedule_id)?.client_id \|\| ''), reportType: (REPORT_TYPES.find(r => r.` |
| `dataReadiness` | `useMemo(() => DATA_MODULES.map(m => {` |
| `slaDash` | `useMemo(() => schedules.filter(s => s.next_run && s.status === 'scheduled').map(s => {` |
| `entry` | `{ schedule_id: schedId, timestamp: new Date().toISOString(), status: 'completed', duration_sec: Math.round(60 + sr(_sc++) * 200), report_size_kb: Math` |
| `batchPauseAll` | `useCallback(() => { setSchedules(prev => prev.map(s => ({ ...s, status:'paused' }))); }, []);` |
| `batchResumeAll` | `useCallback(() => { setSchedules(prev => prev.map(s => s.status === 'paused' ? { ...s, status:'scheduled' } : s)); }, []);` |
| `pct` | `s.slaTarget ? Math.min(100, Math.max(0, (s.days / s.slaTarget) * 100)) : 50;` |
| `offset` | `firstDay === 0 ? 6 : firstDay - 1;` |

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

## 5 · Intermediate Transformation Logic
**Methodology:** On-Time Delivery Rate
**Headline formula:** `Reports Delivered on Schedule ÷ Total Scheduled Reports × 100`
**Standards:** ['Internal SLA', 'Platform audit log']

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
**Blast radius:** changes here can affect **54** other module(s).

| Connected module | Shared via |
|---|---|
| `carbon-aware-allocation` | table:datetime |
| `stranded-assets` | table:datetime |
| `portfolio-optimizer` | table:datetime |
| `carbon-capture-finance` | table:datetime |
| `carbon-credit-audit-trail` | table:datetime |
| `re-portfolio-dashboard` | table:datetime |
| `carbon-wallet` | table:datetime |
| `insurance-climate-hub` | table:datetime |
| `insurance-transition` | table:datetime |
| `supply-chain-map` | table:datetime |