# Api::Gdelt_Controversy
**Module ID:** `api::gdelt_controversy` · **Route:** `/api/v1/gdelt` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/gdelt/events/search` | `search_gdelt_events` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/events/actors` | `gdelt_top_actors` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/events/timeline` | `gdelt_event_timeline` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/events/countries` | `gdelt_event_countries` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/events/stats` | `gdelt_event_stats` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/gkg/search` | `search_gdelt_gkg` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/gkg/themes` | `gdelt_gkg_themes` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/controversy/search` | `search_controversy` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/controversy/entity/{entity_name}` | `controversy_entity_detail` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/controversy/rankings` | `controversy_rankings` | api/v1/routes/gdelt_controversy.py |
| GET | `/api/v1/gdelt/controversy/stats` | `controversy_stats` | api/v1/routes/gdelt_controversy.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `GKG`, `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `dh_controversy_scores`, `dh_gdelt_events`, `dh_gdelt_gkg`, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/gdelt/controversy/entity/{entity_name}** — status `failed`, provenance ['db-empty'], source tables: `dh_controversy_scores`
Output: `None`

**GET /api/v1/gdelt/controversy/rankings** — status `passed`, provenance ['real-db'], source tables: `dh_controversy_scores`
Output: `{'type': 'object', 'keys': ['rankings'], 'n_keys': 1}`

**GET /api/v1/gdelt/controversy/search** — status `passed`, provenance ['real-db'], source tables: `dh_controversy_scores`
Output: `{'type': 'object', 'keys': ['records', 'total'], 'n_keys': 2}`

**GET /api/v1/gdelt/controversy/stats** — status `passed`, provenance ['real-db'], source tables: `dh_controversy_scores`, `dh_gdelt_gkg`
Output: `{'type': 'object', 'keys': ['controversy'], 'n_keys': 1}`

**GET /api/v1/gdelt/events/actors** — status `passed`, provenance ['real-db'], source tables: `dh_gdelt_events`
Output: `{'type': 'object', 'keys': ['actors'], 'n_keys': 1}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).