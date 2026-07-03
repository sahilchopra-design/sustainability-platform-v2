# Data Hub Ingester
**Module ID:** `data-hub-ingester` · **Route:** `/data-hub-ingester` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages multi-source ESG data ingestion pipelines with normalisation, deduplication, and quality validation for provider data from MSCI, Refinitiv, CDP, Bloomberg, and proprietary sources. Supports scheduled and event-driven ingestion with conflict resolution and provenance tracking.

> **Business value:** Enables data engineering and ESG teams to maintain a high-quality, provenance-tracked multi-source ESG data foundation, reducing manual data reconciliation effort and providing the reliable data layer on which all platform modules depend.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENTITIES`, `PRIORITY_COLOR`, `RUN_HISTORY`, `SCHEDULES`, `STATUS_COLOR`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `suffix` | `String.fromCharCode(65 + (i % 26));` |
| `date` | `new Date('2026-04-01');` |
| `total` | `12 + Math.floor(sr(d) * 3);` |
| `failed` | `sr(d + 50) > 0.9 ? 1 : 0;` |
| `warning` | `sr(d + 100) > 0.85 ? 1 : 0;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/data-hub/stats` | `get_hub_stats` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/sources` | `list_sources` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/sources/{source_id}` | `get_source` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/sources` | `create_source` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/sources/seed` | `seed_sources` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/sources/{source_id}/sync` | `sync_source` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/sync-all` | `sync_all_sources` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/sync-synthetic` | `sync_synthetic_only` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/sync-logs` | `get_sync_logs` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/scenarios` | `list_scenarios` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/scenarios/search` | `search_scenarios` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/scenarios/{scenario_id}` | `get_scenario` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/scenarios/{scenario_id}/trajectories` | `get_scenario_trajectories` | api/v1/routes/data_hub.py |
| POST | `/api/v1/data-hub/trajectories/query` | `query_trajectories` | api/v1/routes/data_hub.py |
| GET | `/api/v1/data-hub/comparisons` | `list_comparisons` | api/v1/routes/data_hub.py |

### 2.3 Engine `data_hub_service` (services/data_hub_service.py)
| Function | Args | Purpose |
|---|---|---|
| `DataHubService.list_sources` | active_only |  |
| `DataHubService.get_source` | source_id |  |
| `DataHubService.get_source_by_short_name` | short_name |  |
| `DataHubService.create_source` | data |  |
| `DataHubService.list_scenarios` | source_id, category, limit, offset |  |
| `DataHubService.search_scenarios` | params |  |
| `DataHubService.get_scenario` | scenario_id |  |
| `DataHubService.upsert_scenario` | data | Insert or update a scenario based on source_id + external_id. |
| `DataHubService.get_trajectories` | scenario_id, variable_name, region |  |
| `DataHubService.bulk_insert_trajectories` | trajectories |  |
| `DataHubService.delete_trajectories_for_scenario` | scenario_id |  |
| `DataHubService.list_comparisons` |  |  |
| `DataHubService.create_comparison` | data |  |
| `DataHubService.get_comparison` | comparison_id |  |
| `DataHubService.delete_comparison` | comparison_id |  |
| `DataHubService.create_sync_log` | source_id |  |
| `DataHubService.complete_sync_log` | log_id, status, scenarios_added, scenarios_updated, trajectories_added, error_message |  |
| `DataHubService.get_sync_logs` | source_id, limit |  |

### 2.3 Engine `sync_orchestrator` (services/sync_orchestrator.py)
| Function | Args | Purpose |
|---|---|---|
| `ScenarioSyncOrchestrator.seed_sources` |  | Create all source entries if they don't exist. |
| `ScenarioSyncOrchestrator.sync_source` | source_id | Sync a single source by its ID. |
| `ScenarioSyncOrchestrator.sync_all` | include_real_data | Sync all active sources. |
| `ScenarioSyncOrchestrator.sync_synthetic_only` |  | Sync only synthetic sources (fast). |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `db` *(shared)*, `fastapi` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `SCHEDULES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Data Providers | — | Platform configuration | Number of integrated data providers feeding the ESG data hub |
| Daily Records Ingested | — | Pipeline metrics | Volume of ESG data records processed per day across all active provider feeds |
| Deduplication Rate | — | Entity resolution | Proportion of incoming records identified as duplicates and merged with existing records |
| Provider Conflict Rate | — | Conflict detection | Proportion of metrics where two or more providers disagree beyond threshold, requiring review |
| Pipeline Latency (P95) | — | Pipeline monitoring | 95th percentile ingestion latency from provider publication to platform availability |
- **MSCI/Refinitiv/CDP/Bloomberg API feeds** → Extract records via API, validate schema, assign quality tier weight → **Raw provider records with quality metadata**
- **Entity resolution engine (LEI/ISIN/SEDOL)** → Match incoming entities to master registry, detect duplicates → **Deduplicated entity-linked records**
- **Conflict detection and fusion engine** → Compare provider values, fuse where agreement, flag conflicts for review → **Fused ESG data with provenance trail**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/data-hub/analytics/carbon-price-range** — status `passed`, provenance ['real-db'], source tables: `hub_trajectories`
Output: `{'type': 'object', 'keys': ['count', 'min', 'max', 'scenarios'], 'n_keys': 4}`

**GET /api/v1/data-hub/analytics/coverage** — status `passed`, provenance ['real-db'], source tables: `hub_scenarios`, `hub_sources`
Output: `{'type': 'object', 'keys': ['by_tier', 'by_category', 'total_variables', 'total_regions', 'variables', 'regions'], 'n_keys': 6}`

**GET /api/v1/data-hub/analytics/temperature-range** — status `passed`, provenance ['real-db'], source tables: `hub_scenarios`
Output: `{'type': 'object', 'keys': ['buckets', 'total_with_target', 'details'], 'n_keys': 3}`

**GET /api/v1/data-hub/comparisons** — status `passed`, provenance ['real-db'], source tables: `hub_comparisons`
Output: `{'type': 'array', 'len': 3, 'item0_keys': None}`

**GET /api/v1/data-hub/comparisons/{comparison_id}** — status `failed`, provenance ['db-empty'], source tables: `hub_comparisons`
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-Source Data Fusion
**Headline formula:** `Fused_value = Σ_p (w_p × Value_p) / Σ_p w_p`
**Standards:** ['GHG Protocol Data Quality Tiers', 'ISO 19131 Data Product Specifications', 'ESRS Data Quality Levels']

**Engine `data_hub_service` — extracted transformation lines:**
```python
src = DataHubSource(**data)
sc = DataHubScenario(**data)
objs = [DataHubTrajectory(**t) for t in trajectories]
comp = DataHubComparison(**data)
fav = DataHubFavorite(**data)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **57** other module(s).

| Connected module | Shared via |
|---|---|
| `carbon-aware-allocation` | table:db, table:schemas, table:sqlalchemy |
| `carbon-capture-finance` | table:db, table:schemas, table:sqlalchemy |
| `carbon-credit-audit-trail` | table:db, table:schemas, table:sqlalchemy |
| `carbon-wallet` | table:db, table:schemas, table:sqlalchemy |
| `carbon-adjusted-valuation` | table:db, table:schemas, table:sqlalchemy |
| `carbon-storage-geology` | table:db, table:schemas, table:sqlalchemy |
| `carbon-budget` | table:db, table:schemas, table:sqlalchemy |
| `carbon-reduction-projects` | table:db, table:schemas, table:sqlalchemy |
| `real-estate-valuation` | table:db, table:schemas, table:sqlalchemy |
| `carbon-footprint-intelligence` | table:db, table:schemas, table:sqlalchemy |