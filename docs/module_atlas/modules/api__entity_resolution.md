# Api::Entity_Resolution
**Module ID:** `api::entity_resolution` · **Route:** `/api/v1/entity-resolution` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/entity-resolution/lei` | `search_lei` | api/v1/routes/entity_resolution.py |
| GET | `/api/v1/entity-resolution/lei/{lei}` | `get_lei` | api/v1/routes/entity_resolution.py |
| GET | `/api/v1/entity-resolution/sanctions` | `search_sanctions` | api/v1/routes/entity_resolution.py |
| GET | `/api/v1/entity-resolution/sanctions/{sanction_id}` | `get_sanction` | api/v1/routes/entity_resolution.py |
| POST | `/api/v1/entity-resolution/screen` | `screen_entity` | api/v1/routes/entity_resolution.py |
| GET | `/api/v1/entity-resolution/screening-results` | `list_screening_results` | api/v1/routes/entity_resolution.py |
| GET | `/api/v1/entity-resolution/screening-results/{result_id}` | `get_screening_result` | api/v1/routes/entity_resolution.py |
| PUT | `/api/v1/entity-resolution/screening-results/{result_id}/review` | `review_screening_result` | api/v1/routes/entity_resolution.py |
| GET | `/api/v1/entity-resolution/stats` | `entity_resolution_stats` | api/v1/routes/entity_resolution.py |
| POST | `/api/v1/entity-resolution/cross-module/resolve` | `cross_module_resolve` | api/v1/routes/entity_resolution.py |
| POST | `/api/v1/entity-resolution/cross-module/resolve/batch` | `cross_module_resolve_batch` | api/v1/routes/entity_resolution.py |
| GET | `/api/v1/entity-resolution/cross-module/entity/{lei}` | `entity_graph` | api/v1/routes/entity_resolution.py |
| POST | `/api/v1/entity-resolution/cross-module/auto-link` | `auto_link_entities` | api/v1/routes/entity_resolution.py |

### 2.3 Engine `entity_resolution_service` (services/entity_resolution_service.py)
| Function | Args | Purpose |
|---|---|---|
| `normalise_name` | name | Lowercase, strip legal suffixes, collapse whitespace. |
| `fuzzy_score` | a, b | SequenceMatcher ratio on normalised names. |
| `EntityResolutionService.resolve_entity` | lei, name, isin | Find all records across modules that match the given identifiers. |
| `EntityResolutionService.build_entity_graph` | lei | Gather all cross-module data for an entity identified by LEI. |
| `EntityResolutionService.link_to_company_profile` | lei, name | Find or create a company_profiles record for the given LEI. |
| `EntityResolutionService.auto_link_unlinked` |  | Background job: scan all sector entity tables for records with LEI |
| `EntityResolutionService.bulk_resolve` | records | Resolve a batch of records. Each dict may contain optional keys: |
| `EntityResolutionService._find_by_lei` | lei |  |
| `EntityResolutionService._find_by_isin` | isin |  |
| `EntityResolutionService._find_by_fuzzy_name` | name | Scan entity master tables for names that fuzzy-match above threshold. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/entity-resolution/cross-module/entity/{lei}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/entity-resolution/lei** — status `passed`, provenance ['real-db'], source tables: `entity_lei`
Output: `{'type': 'object', 'keys': ['total', 'offset', 'limit', 'records'], 'n_keys': 4}`

**GET /api/v1/entity-resolution/lei/{lei}** — status `failed`, provenance ['db-empty'], source tables: `entity_lei`
Output: `None`

**GET /api/v1/entity-resolution/sanctions** — status `passed`, provenance ['real-db'], source tables: `entity_sanctions`
Output: `{'type': 'object', 'keys': ['total', 'offset', 'limit', 'records'], 'n_keys': 4}`

**GET /api/v1/entity-resolution/sanctions/{sanction_id}** — status `failed`, provenance ['db-empty'], source tables: `entity_sanctions`
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `api::entity360` | engine:entity_resolution_service |