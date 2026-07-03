# Engagement Outcome Tracker
**Module ID:** `engagement-outcome-tracker` · **Route:** `/engagement-outcome-tracker` · **Tier:** A (backend vertical) · **EP code:** EP-CP1 · **Sprint:** CP

## 1 · Overview
30 engagements with CA100+ progress tracking, milestone monitoring, and escalation history.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CA100_INDICATORS`, `COLLAB`, `ENGAGEMENTS`, `ESCALATION_DIST`, `ESC_COLORS`, `MILESTONES_DIST`, `MILESTONE_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Engagement Dashboard','CA100+ Progress','Milestone Tracking','Escalation History','Collaborative Engagement','Impact Attribution'];` |
| `sectors` | `[...new Set(ENGAGEMENTS.map(e => e.sector))];` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/engagement/entities` | `list_entities` | api/v1/routes/engagement.py |
| POST | `/api/v1/engagement/entities` | `create_entity` | api/v1/routes/engagement.py |
| GET | `/api/v1/engagement/entities/{entity_id}` | `get_entity` | api/v1/routes/engagement.py |
| PATCH | `/api/v1/engagement/entities/{entity_id}/progress` | `update_progress` | api/v1/routes/engagement.py |
| POST | `/api/v1/engagement/log` | `add_log_entry` | api/v1/routes/engagement.py |
| POST | `/api/v1/engagement/commitments` | `add_commitment` | api/v1/routes/engagement.py |
| POST | `/api/v1/engagement/escalations` | `add_escalation` | api/v1/routes/engagement.py |
| GET | `/api/v1/engagement/summary` | `engagement_summary` | api/v1/routes/engagement.py |
| DELETE | `/api/v1/engagement/entities/{entity_id}` | `delete_entity` | api/v1/routes/engagement.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `__future__` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `engagement`, `engagement_commitments`, `engagement_entities`, `engagement_escalations`, `engagement_log`, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CA100_INDICATORS`, `COLLAB`, `ENGAGEMENTS`, `ESCALATION_DIST`, `ESC_COLORS`, `MILESTONES_DIST`, `MILESTONE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Engagements | — | Stewardship | Active company engagements |
| CA100+ Focus | — | CA100+ | Focus companies in portfolio |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/engagement/entities** — status `passed`, provenance ['db-empty'], source tables: `engagement_commitments`, `engagement_entities`, `engagement_escalations`, `engagement_log`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/engagement/entities/{entity_id}** — status `failed`, provenance ['db-empty'], source tables: `engagement_entities`
Output: `None`

**GET /api/v1/engagement/summary** — status `passed`, provenance ['real-db'], source tables: `engagement_entities`, `engagement_log`
Output: `{'type': 'object', 'keys': ['totals', 'by_theme', 'by_priority_tier', 'upcoming_actions'], 'n_keys': 4}`

**POST /api/v1/engagement/commitments** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/engagement/entities** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Engagement effectiveness scoring
**Headline formula:** `Effectiveness = MilestonesAchieved / MilestonesTargeted × 100`
**Standards:** ['CA100+', 'IIGCC', 'PRI']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **63** other module(s).

| Connected module | Shared via |
|---|---|
| `carbon-aware-allocation` | table:datetime, table:db, table:sqlalchemy |
| `carbon-capture-finance` | table:datetime, table:db, table:sqlalchemy |
| `carbon-credit-audit-trail` | table:datetime, table:db, table:sqlalchemy |
| `carbon-wallet` | table:datetime, table:db, table:sqlalchemy |
| `insurance-climate-hub` | table:datetime, table:db, table:sqlalchemy |
| `insurance-transition` | table:datetime, table:db, table:sqlalchemy |
| `supply-chain-map` | table:datetime, table:db, table:sqlalchemy |
| `carbon-adjusted-valuation` | table:datetime, table:db, table:sqlalchemy |
| `supply-chain-network-viz` | table:datetime, table:db, table:sqlalchemy |
| `carbon-storage-geology` | table:datetime, table:db, table:sqlalchemy |