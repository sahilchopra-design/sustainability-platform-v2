# Regulatory Calendar
**Module ID:** `regulatory-calendar` · **Route:** `/regulatory-calendar` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG regulatory deadline tracker aggregating global reporting obligations with configurable jurisdiction and framework filters and automated alerts.

> **Business value:** Ensures no ESG regulatory deadline is missed by providing a centralised, entity-specific compliance calendar with automated alerting and audit trail.

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

**GET /api/v1/regulatory-calendar/alerts** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/regulatory-calendar/frameworks** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/regulatory-calendar/module-coverage** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['module_count', 'coverage', 'note'], 'n_keys': 3}`

**GET /api/v1/regulatory-calendar/obligations** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/regulatory-calendar/obligations/{obligation_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Compliance Timeline Score
**Headline formula:** `CTS = Σ(days_to_deadline_i × materiality_weight_i) / total_obligations`
**Standards:** ['CSRD (EU) 2022/2464', 'SEC Climate Disclosure Rule', 'FCA SDR']

**Engine `regulatory_obligation_calendar` — extracted transformation lines:**
```python
days_until = (dl - self._today).days
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).