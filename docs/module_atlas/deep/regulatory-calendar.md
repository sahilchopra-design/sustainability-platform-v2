## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — frontend/backend disconnect.** The backend engine
> (`backend/services/regulatory_obligation_calendar.py`) is a genuinely well-built, dynamic
> compliance-calendar service: 26 real regulatory obligations (CSRD, SFDR, EU Taxonomy, ETS Phase
> 4/ETS2, CBAM, ISSB S1/S2, SEC Climate [marked rescinded], BRSR, TCFD, EUDR, CSDDD, EIOPA ORSA
> Climate) each with a real deadline, article-level `regulatory_reference`, and urgency computed
> **live** from `days_until = deadline − today` (`_compute_urgency`: ≤14d critical, ≤45d high,
> ≤90d medium, else low). **The frontend page never calls this engine or its API
> (`api/v1/routes/regulatory_calendar.py`) — no `fetch`/`axios`/`useModuleData`/`useEffect` call
> exists in `RegulatoryCalendarPage.jsx`.** Instead the page renders its own separate, hand-curated
> 21-item `DEADLINES` array with a **hardcoded `status` field** (`'Completed'`, `'Upcoming'`,
> `'Overdue'`, `'Due'`) that is never recomputed against the current date — a deadline marked
> `'Completed'` at the time the array was written will still say `'Completed'` in the UI
> indefinitely, and a deadline that has since passed without being marked overdue will silently
> stay `'Upcoming'`. The guide's own "CTS" (Compliance Timeline Score) weighted-average formula
> also has no implementation on either side. Below documents both the real backend engine (which
> the frontend should be calling) and the static frontend as it actually behaves today.

### 7.1 What the backend engine computes (not wired to the UI)

```python
days_until = (date.fromisoformat(deadline) - today).days
computed_urgency = "critical" if days_until<=14 else "high" if days_until<=45 else "medium" if days_until<=90 else "low"
alerts = [o for o in obligations if 0 <= days_until <= days_ahead], sorted by days_until
summary = { total_obligations, by_framework, by_urgency, overdue_obligation_ids, frameworks_covered, jurisdictions_covered }
```

`get_upcoming_alerts(days_ahead=90)` filters to obligations due within a rolling window and
**excludes already-overdue items from alerts** (`days_until < 0` is skipped) while `get_summary()`
separately lists `overdue_obligation_ids` — a sensible split between "act now" alerts and a
full audit trail of missed deadlines.

### 7.2 Parameterisation — backend obligation catalogue (26 records, real citations)

| Framework | Example obligation | Deadline | Regulatory reference |
|---|---|---|---|
| CSRD | FY2024 first report, large PIEs | 2025-01-31 | CSRD Art. 19a, Del. Reg 2023/2772 |
| CSRD | ESRS limited assurance, Year 1 | 2025-12-31 | CSRD Art. 26a, ISSA 5000 |
| SFDR | (obligation family, not shown in excerpt) | — | EU 2019/2088 + RTS 2022/1288 |
| SEC Climate | Rule (marked `is_rescinded=True`) | — | Release 33-11275, rescinded March 2025 |
| EUDR | Deforestation-free supply chain | — | EU 2023/1115 |
| CSDDD | Corporate sustainability due diligence | — | EU 2024/1760 |

The engine correctly tracks the **SEC Climate Disclosure Rule's rescission** (`is_rescinded=True`,
excluded from `get_all()` by default) — a detail requiring the codebase to be actively maintained
against real regulatory developments, and genuinely present in the backend.

### 7.3 What the frontend page actually renders

```js
DEADLINES = [ { id, framework, title, date, jurisdiction, regulator, description,
                entityTypes, effort, status /* hardcoded, one of Upcoming/Due/Overdue/Completed */,
                requirements[], links[], actions[] }, ... ]   // 21 static entries
filtered = DEADLINES.filter(matches framework/jurisdiction/status/entityType filters)
kpis.overdue = DEADLINES.filter(d => d.status === 'Overdue').length     // reads the static field, not today's date
```

Each of the 21 entries is richly detailed (description, 4-5 requirements, official links, 4 action
items) — clearly hand-authored with real regulatory content (e.g. CSRD Wave 1/2 entity thresholds,
SFDR's "18 mandatory PAI indicators," SEC filer categories) — but the **status/urgency labelling
is frozen at authoring time**, not live.

### 7.4 Worked example — the staleness problem

Entry `id=1`, "CSRD Wave 1 — FY2024 Annual Report Filing," `date: '2025-01-31'`,
`status: 'Completed'` (hardcoded). If today's date is after 2025-01-31, the backend engine would
correctly classify this as past-due (`days_until < 0`, appearing in `summary.overdue_obligation_ids`
if not filed) — but the frontend simply trusts the pre-set `'Completed'` label regardless of
whether the filing actually happened. Conversely, entry `id=2` ("CSRD Wave 2," `date: '2026-01-31'`,
`status: 'Upcoming'`) will still read `'Upcoming'` even once its real `days_until` crosses into the
backend's `critical` (≤14 days) band — the frontend gives no early-warning signal the backend
engine is already capable of producing.

### 7.5 Urgency rubric (backend, unused by frontend)

| Days until deadline | Computed urgency |
|---|---|
| ≤ 14 | critical |
| 15–45 | high |
| 46–90 | medium |
| > 90 | low |

### 7.6 Companion analytics

Frontend: KPI band (total, by-framework, overdue count from the static field), filterable deadline
list (framework/jurisdiction/status/entity-type), per-deadline detail card (requirements, links,
actions). Backend: `filter()`, `get_upcoming_alerts()`, `get_platform_module_coverage()` (maps
each of the 26 obligations to the platform modules that would generate its supporting evidence —
e.g. `csrd_auto_populate`, `xbrl_export_engine`), `get_summary()`.

### 7.7 Data provenance & limitations

- **Backend obligation records are real, citable regulatory facts** (article/paragraph level) —
  the strongest data-provenance profile of any calendar-style module reviewed in this batch.
- **The frontend is entirely disconnected from this engine** — this is the module's single most
  important finding: real, live urgency computation exists in the codebase but is not reaching
  users. Wiring `RegulatoryCalendarPage.jsx` to `GET /api/v1/regulatory-calendar/obligations` and
  `/alerts` (both already implemented per `route_files`) would be a low-effort, high-value fix.
  Until then, the frontend's `status` field should be treated as informational only, not a live
  compliance signal.
- No "Compliance Timeline Score" (the guide's formula) exists on either side — would need to be
  built as `Σ(days_to_deadline_i × materiality_weight_i)/n` over `get_upcoming_alerts()` output if
  actually required.
- 21 frontend entries vs 26 backend obligations — the two datasets are not the same size or
  necessarily the same content; no reconciliation step exists.

**Framework alignment:** CSRD (EU 2022/2464), SFDR (EU 2019/2088), EU Taxonomy (EU 2020/852), EU
ETS Phase 4 / ETS2, CBAM (EU 2023/956), ISSB S1/S2, SEC Climate Disclosure Rule (correctly flagged
rescinded), BRSR (SEBI), TCFD, EUDR (EU 2023/1115), CSDDD (EU 2024/1760), EIOPA ORSA Climate — all
13 frameworks are genuinely represented with real article-level citations in the backend engine;
the frontend surfaces a narrower, differently-curated subset with no live linkage back to those
citations' actual deadline-tracking logic.
