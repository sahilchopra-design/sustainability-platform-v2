# Api::Data_Hub_Catalog
**Module ID:** `api::data_hub_catalog` · **Route:** `/api/v1/data-hub-catalog` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/data-hub-catalog/sources` | `list_catalog_sources` | api/v1/routes/data_hub_catalog.py |
| GET | `/api/v1/data-hub-catalog/coverage` | `get_coverage` | api/v1/routes/data_hub_catalog.py |
| GET | `/api/v1/data-hub-catalog/search` | `cross_source_search` | api/v1/routes/data_hub_catalog.py |
| GET | `/api/v1/data-hub-catalog/entity/{identifier}` | `entity_360_view` | api/v1/routes/data_hub_catalog.py |
| GET | `/api/v1/data-hub-catalog/freshness` | `get_freshness` | api/v1/routes/data_hub_catalog.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `all` *(shared)*, `api` *(shared)*, `db` *(shared)*, `dh_ca100_assessments` *(shared)*, `dh_country_risk_indices` *(shared)*, `dh_reference_data` *(shared)*, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/data-hub-catalog/coverage** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`, `dh_climate_trace_emissions`, `dh_country_risk_indices`, `dh_ngfs_scenario_data`, `dh_owid_co2_energy`, `dh_reference_data`, `dh_sbti_companies`, `dh_sec_edgar_filings`, `dh_yfinance_market_data`, `entity_lei`
Output: `{'type': 'object', 'keys': ['coverage', 'total_records'], 'n_keys': 2}`

**GET /api/v1/data-hub-catalog/entity/{identifier}** — status `passed`, provenance ['db-empty'], source tables: `dh_sbti_companies`, `dh_sec_edgar_filings`, `dh_yfinance_market_data`, `entity_lei`, `entity_sanctions`
Output: `{'type': 'object', 'keys': ['identifier', 'sources', 'sources_found', 'source_count'], 'n_keys': 4}`

**GET /api/v1/data-hub-catalog/freshness** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`, `dh_climate_trace_emissions`, `dh_country_risk_indices`, `dh_ngfs_scenario_data`, `dh_owid_co2_energy`, `dh_reference_data`, `dh_sbti_companies`, `dh_sec_edgar_filings`, `dh_yfinance_market_data`, `entity_lei`
Output: `{'type': 'object', 'keys': ['freshness'], 'n_keys': 1}`

**GET /api/v1/data-hub-catalog/search** — status `passed`, provenance ['db-empty'], source tables: `dh_ca100_assessments`, `dh_climate_trace_emissions`, `dh_country_risk_indices`, `dh_owid_co2_energy`, `dh_sbti_companies`, `dh_sec_edgar_filings`, `dh_yfinance_market_data`, `entity_lei`, `entity_sanctions`
Output: `{'type': 'object', 'keys': ['query', 'total_hits', 'sources_matched', 'results'], 'n_keys': 4}`

**GET /api/v1/data-hub-catalog/sources** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`, `dh_climate_trace_emissions`, `dh_country_risk_indices`, `dh_ngfs_scenario_data`, `dh_owid_co2_energy`, `dh_reference_data`, `dh_sbti_companies`, `dh_sec_edgar_filings`, `dh_yfinance_market_data`, `entity_lei`
Output: `{'type': 'object', 'keys': ['sources', 'total_sources'], 'n_keys': 2}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).