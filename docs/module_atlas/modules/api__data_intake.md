# Api::Data_Intake
**Module ID:** `api::data_intake` · **Route:** `/api/v1/data-intake` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/data-intake/status` | `get_data_intake_status` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/portfolio/template` | `download_portfolio_template` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/portfolio` | `list_portfolio_uploads` | api/v1/routes/data_intake.py |
| POST | `/api/v1/data-intake/portfolio/upload` | `upload_portfolio_csv` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/portfolio/{upload_id}/rows` | `get_portfolio_rows` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/counterparty` | `list_counterparty_emissions` | api/v1/routes/data_intake.py |
| POST | `/api/v1/data-intake/counterparty` | `upsert_counterparty_emissions` | api/v1/routes/data_intake.py |
| DELETE | `/api/v1/data-intake/counterparty/{record_id}` | `delete_counterparty_emission` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/real-estate/template` | `download_real_estate_template` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/real-estate` | `list_real_estate_assets` | api/v1/routes/data_intake.py |
| POST | `/api/v1/data-intake/real-estate/upload` | `upload_real_estate_csv` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/shipping-fleet/template` | `download_fleet_template` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/shipping-fleet` | `list_fleet` | api/v1/routes/data_intake.py |
| POST | `/api/v1/data-intake/shipping-fleet/upload` | `upload_fleet_csv` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/steel-borrowers` | `list_steel_borrowers` | api/v1/routes/data_intake.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `SET` *(shared)*, `data_source_type`, `datetime` *(shared)*, `db` *(shared)*, `dh_country_risk_indices` *(shared)*, `di_`, `di_counterparty_emissions`, `di_internal_config`, `di_loan_portfolio_rows`, `di_loan_portfolio_uploads`, `di_project_finance`, `di_real_estate_assets`, `di_shipping_fleet`, `di_steel_borrowers`, `fastapi` *(shared)*, `job`, `pydantic` *(shared)*, `raw`, `row`, `sqlalchemy` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/data-intake/counterparty** — status `passed`, provenance ['db-empty'], source tables: `di_counterparty_emissions`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/data-intake/internal-config** — status `passed`, provenance ['real-db'], source tables: `di_internal_config`
Output: `{'type': 'array', 'len': 8, 'item0_keys': ['config_key', 'config_value', 'display_name', 'description', 'config_group', 'data_type', 'updated_by', 'updated_at']}`

**GET /api/v1/data-intake/pcaf-summary** — status `passed`, provenance ['db-empty'], source tables: `di_counterparty_emissions`, `di_loan_portfolio_rows`
Output: `{'type': 'object', 'keys': ['summary', 'dqs_distribution', 'sector_breakdown'], 'n_keys': 3}`

**GET /api/v1/data-intake/portfolio** — status `passed`, provenance ['db-empty'], source tables: `di_loan_portfolio_uploads`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/data-intake/portfolio/template** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'StreamingResponse', 'repr': '<starlette.responses.StreamingResponse object at 0x0000022D10C7B470>'}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).