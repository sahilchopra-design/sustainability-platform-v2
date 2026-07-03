# Api::Financial_Data
**Module ID:** `api::financial_data` · **Route:** `/api/v1/financial-data` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/financial-data/edgar` | `search_edgar` | api/v1/routes/financial_data.py |
| GET | `/api/v1/financial-data/edgar/companies` | `edgar_companies` | api/v1/routes/financial_data.py |
| GET | `/api/v1/financial-data/edgar/filing-types` | `edgar_filing_types` | api/v1/routes/financial_data.py |
| GET | `/api/v1/financial-data/edgar/compare` | `edgar_compare` | api/v1/routes/financial_data.py |
| GET | `/api/v1/financial-data/market` | `search_market` | api/v1/routes/financial_data.py |
| GET | `/api/v1/financial-data/market/tickers` | `market_tickers` | api/v1/routes/financial_data.py |
| GET | `/api/v1/financial-data/market/sectors` | `market_sectors` | api/v1/routes/financial_data.py |
| GET | `/api/v1/financial-data/market/evic` | `market_evic` | api/v1/routes/financial_data.py |
| GET | `/api/v1/financial-data/stats` | `combined_stats` | api/v1/routes/financial_data.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/financial-data/edgar** — status `passed`, provenance ['real-db'], source tables: `dh_sec_edgar_filings`
Output: `{'type': 'object', 'keys': ['total', 'offset', 'limit', 'records'], 'n_keys': 4}`

**GET /api/v1/financial-data/edgar/companies** — status `passed`, provenance ['db-empty'], source tables: `dh_sec_edgar_filings`
Output: `{'type': 'object', 'keys': ['companies'], 'n_keys': 1}`

**GET /api/v1/financial-data/edgar/compare** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/financial-data/edgar/filing-types** — status `passed`, provenance ['db-empty'], source tables: `dh_sec_edgar_filings`
Output: `{'type': 'object', 'keys': ['filing_types'], 'n_keys': 1}`

**GET /api/v1/financial-data/market** — status `passed`, provenance ['real-db'], source tables: `dh_yfinance_market_data`
Output: `{'type': 'object', 'keys': ['total', 'offset', 'limit', 'records'], 'n_keys': 4}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).