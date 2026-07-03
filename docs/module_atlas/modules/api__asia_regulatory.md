# Api::Asia_Regulatory
**Module ID:** `api::asia_regulatory` · **Route:** `/api/v1/asia-regulatory` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/asia-regulatory/brsr/top-1000` | `brsr_top_1000_summary` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/brsr/{entity_id}/scorecard` | `get_brsr_scorecard` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/brsr/{entity_id}` | `get_brsr_disclosure` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/hkma/sector-benchmark` | `hkma_sector_benchmark` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/hkma/{entity_id}` | `get_hkma_assessment` | api/v1/routes/asia_regulatory.py |
| POST | `/api/v1/asia-regulatory/hkma/{entity_id}/stress-test` | `run_hkma_stress_test` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/boj/{entity_id}/scenarios` | `get_boj_entity_scenarios` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/boj/sector-impact/{sector}` | `get_boj_sector_impact` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/asean/member-states` | `list_asean_member_states` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/asean/focus-areas` | `list_asean_focus_areas` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/asean/member-state/{country_code}` | `get_asean_member_state_coverage` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/asean/{entity_id}/taxonomy` | `get_asean_entity_taxonomy` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/pboc/catalogue` | `pboc_gbepc_catalogue` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/pboc/categories` | `pboc_categories` | api/v1/routes/asia_regulatory.py |
| GET | `/api/v1/asia-regulatory/pboc/{entity_id}/green-finance` | `get_pboc_green_finance` | api/v1/routes/asia_regulatory.py |

### 2.3 Engine `asia_regulatory_engine` (services/asia_regulatory_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_exec_read` | sql, params | Execute a read query and return list-of-dicts. Fails silently → []. |
| `_exec_write` | sql, params | Execute a write query. Returns True on success. |
| `BRSRCoreEngine.get_brsr_disclosure` | entity_id |  |
| `BRSRCoreEngine.get_brsr_scorecard` | entity_id |  |
| `BRSRCoreEngine._normalise_reporter_row` | r | Add frontend-expected key aliases to a raw DB row. |
| `BRSRCoreEngine.get_top_1000_summary` |  |  |
| `BRSRCoreEngine._extract_core_kpis` | row |  |
| `BRSRCoreEngine._enrich` | row |  |
| `BRSRCoreEngine._band` | score | score is on 0-100 scale (weighted sum of P1-P9 × weights). |
| `HKMAEngine.get_assessment` | entity_id |  |
| `HKMAEngine.run_stress_test` | entity_id, scenarios |  |
| `HKMAEngine.get_sector_benchmark` |  |  |
| `HKMAEngine._enrich_assessment` | row |  |
| `HKMAEngine._format_stress` | entity, results, total_assets |  |
| `HKMAEngine._maturity_label` | score |  |
| `BOJScenarioEngine.get_entity_scenarios` | entity_id |  |
| `BOJScenarioEngine.get_sector_impact` | sector |  |
| `BOJScenarioEngine._build_reference_output` | entity_id |  |

### 2.3 Engine `cbi_data_client` (services/cbi_data_client.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_db` |  |  |
| `_exec_read` | sql, params |  |
| `_exec_write` | sql, params |  |
| `CBIDataClient.get_market_overview` | force_refresh | Returns aggregate market stats. |
| `CBIDataClient.get_certified_bonds` | limit, country, sector, label, issuer | Returns list of CBI-certified bonds. |
| `CBIDataClient.refresh` |  | Force refresh from CBI API and store in DB. |
| `CBIDataClient.get_sector_criteria` |  |  |
| `CBIDataClient.get_pricing_report` |  | Green Bond Pricing in the Primary Market — latest available. |
| `CBIDataClient._fetch_live_market` |  | Attempt to fetch from CBI API.  Returns None if unreachable. |
| `CBIDataClient._fetch_live_bonds` |  | Fetch bond-level data from CBI API. |
| `CBIDataClient._parse_market_response` | raw | CBI publishes data as CSV. We parse column headers and aggregate. |
| `CBIDataClient._normalise_market` | data |  |
| `CBIDataClient._normalise_bond` | b |  |
| `CBIDataClient._get_latest_snapshot` |  |  |
| `CBIDataClient._store_snapshot` | data |  |
| `CBIDataClient._store_bonds` | bonds |  |
| `CBIDataClient._format_overview` | data |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `CBI`, `DB` *(shared)*, `__future__` *(shared)*, `fastapi` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/asia-regulatory/asean/focus-areas** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['focus_areas'], 'n_keys': 1}`

**GET /api/v1/asia-regulatory/asean/member-state/{country_code}** — status `passed`, provenance ['db-empty'], source tables: `asean_entities`, `asean_taxonomy_activities`
Output: `{'type': 'object', 'keys': ['country_code', 'total_activities', 'green_pct', 'amber_pct', 'red_pct', 'activities'], 'n_keys': 6}`

**GET /api/v1/asia-regulatory/asean/member-states** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['member_states'], 'n_keys': 1}`

**GET /api/v1/asia-regulatory/asean/{entity_id}/taxonomy** — status `passed`, provenance ['db-empty'], source tables: `asean_entities`, `asean_taxonomy_activities`
Output: `{'type': 'object', 'keys': ['error', 'entity_id'], 'n_keys': 2}`

**GET /api/v1/asia-regulatory/boj/sector-impact/{sector}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector', 'scenarios', 'methodology'], 'n_keys': 3}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).