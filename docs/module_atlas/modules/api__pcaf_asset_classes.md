# Api::Pcaf_Asset_Classes
**Module ID:** `api::pcaf_asset_classes` · **Route:** `/api/v1/pcaf` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf/listed-equity` | `assess_listed_equity` | api/v1/routes/pcaf_asset_classes.py |
| POST | `/api/v1/pcaf/business-loans` | `assess_business_loans` | api/v1/routes/pcaf_asset_classes.py |
| POST | `/api/v1/pcaf/project-finance` | `assess_project_finance` | api/v1/routes/pcaf_asset_classes.py |
| POST | `/api/v1/pcaf/commercial-real-estate` | `assess_commercial_real_estate` | api/v1/routes/pcaf_asset_classes.py |
| POST | `/api/v1/pcaf/mortgages` | `assess_mortgages` | api/v1/routes/pcaf_asset_classes.py |
| POST | `/api/v1/pcaf/vehicle-loans` | `assess_vehicle_loans` | api/v1/routes/pcaf_asset_classes.py |
| POST | `/api/v1/pcaf/sovereign-bonds` | `assess_sovereign_bonds` | api/v1/routes/pcaf_asset_classes.py |
| POST | `/api/v1/pcaf/portfolio-aggregate` | `aggregate_portfolio` | api/v1/routes/pcaf_asset_classes.py |
| GET | `/api/v1/pcaf/asset-classes` | `list_asset_classes` | api/v1/routes/pcaf_asset_classes.py |
| GET | `/api/v1/pcaf/methodology` | `get_methodology` | api/v1/routes/pcaf_asset_classes.py |
| GET | `/api/v1/pcaf/sector-emission-factors` | `list_sector_emission_factors` | api/v1/routes/pcaf_asset_classes.py |
| GET | `/api/v1/pcaf/epc-benchmarks` | `list_epc_benchmarks` | api/v1/routes/pcaf_asset_classes.py |
| GET | `/api/v1/pcaf/vehicle-benchmarks` | `list_vehicle_benchmarks` | api/v1/routes/pcaf_asset_classes.py |
| GET | `/api/v1/pcaf/sovereign-data` | `list_sovereign_data` | api/v1/routes/pcaf_asset_classes.py |
| GET | `/api/v1/pcaf/dqs-improvement-guidance` | `dqs_improvement_guidance` | api/v1/routes/pcaf_asset_classes.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `EDGAR` *(shared)*, `EPC`, `IMF`, `annual` *(shared)*, `asset`, `borrower` *(shared)*, `building`, `data` *(shared)*, `datetime` *(shared)*, `energy` *(shared)*, `fastapi` *(shared)*, `generation`, `installed`, `investee` *(shared)*, `manufacturer`, `national` *(shared)*, `owned`, `physical`, `purchased`, `pydantic` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/pcaf/asset-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['standard', 'publisher', 'effective_date', 'asset_classes', 'data_quality_scores', 'uncertainty_bands'], 'n_keys': 6}`

**GET /api/v1/pcaf/dqs-improvement-guidance** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['principle', 'priority_order', 'data_sources_by_dqs'], 'n_keys': 3}`

**GET /api/v1/pcaf/epc-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['unit', 'source', 'note', 'ratings'], 'n_keys': 4}`

**GET /api/v1/pcaf/methodology** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['standard', 'attribution_factors', 'data_quality', 'scope_boundaries', 'regulatory_alignment', 'sector_emission_factors', 'temperature_alignment'], 'n_keys': 7}`

**GET /api/v1/pcaf/sector-emission-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['unit', 'source', 'note', 'factors'], 'n_keys': 4}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).