# Regulatory Calendar
**Module ID:** `regulatory-calendar` · **Route:** `/regulatory-calendar` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG regulatory deadline tracker aggregating global reporting obligations with configurable jurisdiction and framework filters and automated alerts.

> **Business value:** Ensures no ESG regulatory deadline is missed by providing a centralised, entity-specific compliance calendar with automated alerting and audit trail.

**How an analyst works this module:**
- Configure entity profile (size, sector, jurisdiction).
- Review upcoming deadlines by framework and priority.
- Set calendar alerts and assign responsible owners.
- Mark obligations complete with submission reference.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BADGE`, `DEADLINES`, `EFFORT_COLOR`, `ENTITIES`, `FRAMEWORKS_LIST`, `FW_COLOR`, `JURISDICTIONS`, `STATUSES`, `STATUS_COLOR`, `VIEWS`

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/regulatory-calendar/summary` | `get_summary` | api/v1/routes/regulatory_calendar.py |
| GET | `/api/v1/regulatory-calendar/frameworks` | `list_frameworks` | api/v1/routes/regulatory_calendar.py |
| GET | `/api/v1/regulatory-calendar/obligations/{obligation_id}` | `get_obligation` | api/v1/routes/regulatory_calendar.py |

### 2.3 Engine `regulatory_obligation_calendar` (services/regulatory_obligation_calendar.py)
| Function | Args | Purpose |
|---|---|---|
| `_reg` | o |  |
| `RegulatoryObligationCalendar.get_all` | include_rescinded |  |
| `RegulatoryObligationCalendar.filter` | frameworks, jurisdictions, entity_types, include_rescinded |  |
| `RegulatoryObligationCalendar.get_upcoming_alerts` | days_ahead, frameworks, jurisdictions, entity_types | Return obligations with deadlines within *days_ahead* days, with urgency scoring. |
| `RegulatoryObligationCalendar.get_obligation` | obligation_id |  |
| `RegulatoryObligationCalendar.get_platform_module_coverage` |  | Return dict: {module_name: [obligation_ids that depend on it]}. |
| `RegulatoryObligationCalendar.get_summary` |  | Return a summary of all obligations by framework and urgency. |
| `RegulatoryObligationCalendar._compute_urgency` | days_until |  |
| `RegulatoryObligationCalendar._build_message` | o, days_until, urgency |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `get_upcoming_alerts`, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DEADLINES`, `ENTITIES`, `FRAMEWORKS_LIST`, `JURISDICTIONS`, `STATUSES`, `VIEWS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Regulatory Obligations | — | Regulatory Registry | Count of ESG regulatory obligations active for configured jurisdiction and entity profile. |
| Next Deadline | — | Calendar Engine | Nearest upcoming mandatory reporting deadline based on entity classification. |
| Overdue Obligations | — | Compliance Monitor | Number of mandatory deadlines passed without confirmed submission. |
- **Regulatory deadline database + entity configuration** → Obligation matching; deadline calculation; alert scheduling → **Personalised regulatory calendar with deadline alerts and compliance tracking**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/regulatory-calendar/alerts** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['days_ahead', 'alert_count', 'critical', 'high', 'medium', 'low', 'alerts'], 'n_keys': 7}`

**GET /api/v1/regulatory-calendar/frameworks** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/regulatory-calendar/module-coverage** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['module_count', 'coverage', 'note'], 'n_keys': 3}`

**GET /api/v1/regulatory-calendar/obligations** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/regulatory-calendar/obligations/{obligation_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/regulatory-calendar/summary** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_obligations', 'rescinded_obligations', 'by_framework', 'by_urgency', 'overdue_obligation_ids', 'frameworks_covered', 'jurisdictions_covered', 'reference_date'], 'n_keys': 8}`

## 5 · Intermediate Transformation Logic
**Methodology:** Compliance Timeline Score
**Headline formula:** `CTS = Σ(days_to_deadline_i × materiality_weight_i) / total_obligations`

Weighted average horizon to next compliance deadline across all active regulatory obligations.

**Standards:** ['CSRD (EU) 2022/2464', 'SEC Climate Disclosure Rule', 'FCA SDR']
**Reference documents:** CSRD Directive (EU) 2022/2464; SEC Enhancement and Standardization of Climate-Related Disclosures (2024); FCA Sustainability Disclosure Requirements Policy Statement (2023)

**Engine `regulatory_obligation_calendar` — extracted transformation lines:**
```python
days_until = (dl - self._today).days
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its own live engine, then entity-scope it (analytics ladder: rung 1 → 2)

**What.** §7's finding is the platform's cleanest wiring gap: a genuinely well-built backend (`regulatory_obligation_calendar.py`, 26 real obligations with article-level references — CSRD, SFDR, CBAM, ISSB, EUDR, CSDDD — and urgency computed live from `deadline − today`) that the frontend never calls. The page renders its own 21-item array with a hardcoded `status` field that never recomputes — a deadline marked 'Completed' stays 'Completed' forever, and passed deadlines silently stay 'Upcoming'. A stale compliance calendar is worse than none. Evolution A wires the UI to `GET /api/v1/regulatory-calendar/obligations` and `/alerts` (both already implemented), then adds the entity-profile filtering the overview promises.

**How.** (1) Replace the static `DEADLINES` array with the engine's response; the hardcoded status field is deleted, urgency badges render `_compute_urgency` output (≤14d critical / ≤45d high / ≤90d medium). (2) Entity applicability: an org profile (size, sector, jurisdiction, listed status) filters the 26 obligations by their applicability metadata — CSRD thresholds, BRSR top-500 scope, CBAM importer status — so the calendar is *this entity's* obligations, per the documented workflow step. (3) Implement the guide's Compliance Timeline Score as §7.7 sketches (`Σ(days_i × materiality_i)/n` over upcoming alerts) or drop the claim. (4) Owner assignment and completion become persisted per-org state (a `regulatory_calendar_status` table), giving the promised audit trail.

**Prerequisites.** Essentially none for the wiring (endpoints exist); applicability metadata added to the 26 records. **Acceptance:** the UI's urgency changes as today's date advances with no code change; an entity profile change adds/removes obligations; completion marks persist per org with timestamps.

### 9.2 Evolution B — Deadline concierge with obligation explainers (LLM tier 1 → 2)

**What.** A compliance copilot on the calendar: "what does the ETS2 deadline actually require us to file, and are we in scope?", "brief the CFO on everything due in the next 90 days with owners and status", "the SEC climate rule shows rescinded — what replaced it?" — grounded in the engine's obligation records, whose article-level `regulatory_reference` fields make citation-faithful answers unusually feasible here.

**How.** Tier 1: RAG over the 26 obligation records plus the referenced regulation texts (public EU/SEBI/ISSB documents chunked with article anchors); scope answers combine the entity profile with the obligation's applicability clause and cite both. Tier 2: the 90-day briefing composes from `GET /alerts` tool calls plus per-org status rows — every date, urgency, and owner from live data. Guardrails: the copilot states the record's last-verified date on every obligation (regulatory facts decay — the SEC rescission already illustrates it) and refuses interpretive legal advice beyond the stored reference ("consult counsel" boundary encoded in the prompt).

**Prerequisites.** Evolution A (a concierge over the stale static array would confidently misreport compliance status — the worst failure mode this module can have); regulation texts chunked. **Acceptance:** briefing dates/urgencies match live `/alerts` output; every requirement claim cites an article anchor; scope determinations name the applicability rule applied.