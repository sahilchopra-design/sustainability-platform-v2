# Api::Pe_Deals
**Module ID:** `api::pe_deals` · **Route:** `/api/v1/pe-deals` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pe-deals/screen` | `screen_deal` | api/v1/routes/pe_deals.py |
| POST | `/api/v1/pe-deals/compare` | `compare_deals` | api/v1/routes/pe_deals.py |
| POST | `/api/v1/pe-deals/pipeline-summary` | `pipeline_summary` | api/v1/routes/pe_deals.py |
| GET | `/api/v1/pe-deals/sector-heatmap` | `get_sector_heatmap` | api/v1/routes/pe_deals.py |
| GET | `/api/v1/pe-deals/sub-dimensions` | `get_sub_dimensions` | api/v1/routes/pe_deals.py |
| POST | `/api/v1/pe-deals/db/screen-and-persist` | `db_screen_and_persist` | api/v1/routes/pe_deals.py |
| GET | `/api/v1/pe-deals/db/deals` | `db_list_deals` | api/v1/routes/pe_deals.py |
| GET | `/api/v1/pe-deals/db/deals/{deal_id}` | `db_get_deal` | api/v1/routes/pe_deals.py |
| PATCH | `/api/v1/pe-deals/db/deals/{deal_id}/stage` | `db_update_stage` | api/v1/routes/pe_deals.py |
| GET | `/api/v1/pe-deals/db/pipeline-summary` | `db_pipeline_summary` | api/v1/routes/pe_deals.py |
| GET | `/api/v1/pe-deals/db/sector-heatmap` | `db_sector_heatmap` | api/v1/routes/pe_deals.py |
| POST | `/api/v1/pe-deals/db/seed-heatmap` | `db_seed_heatmap` | api/v1/routes/pe_deals.py |

### 2.3 Engine `pe_db_service` (services/pe_db_service.py)
| Function | Args | Purpose |
|---|---|---|
| `PEDBService.create_deal` | deal_data | Create a new PE deal record. |
| `PEDBService.get_deal` | deal_id | Get a single deal by ID. |
| `PEDBService.list_deals` | fund_id, stage, sector, limit | List deals with optional filters. |
| `PEDBService.update_deal_stage` | deal_id, new_stage, notes | Update deal pipeline stage. |
| `PEDBService.persist_screening` | deal_id, screening_result | Persist ESG screening scores from pe_deal_engine.screen_deal() output. |
| `PEDBService.get_screening_scores` | deal_id | Get all screening scores for a deal. |
| `PEDBService.create_portfolio_company` | company_data | Create a portfolio company record (typically after deal closes). |
| `PEDBService.list_portfolio_companies` | fund_id, status, limit | List portfolio companies with optional filters. |
| `PEDBService.update_portfolio_company` | company_id, updates | Update a portfolio company (NAV, ESG score, exit data, etc.). |
| `PEDBService.record_exit` | company_id, exit_date, exit_proceeds_eur | Record a portfolio company exit. |
| `PEDBService.seed_sector_heatmap` |  | Seed pe_sector_risk_heatmap from PEDealEngine's hardcoded data. |
| `PEDBService.get_sector_heatmap` |  | Get sector risk heatmap from DB. |
| `PEDBService.pipeline_summary` | fund_id | Generate pipeline analytics from pe_deals table. |
| `PEDBService.portfolio_summary` | fund_id | Generate portfolio company analytics from pe_portfolio_companies. |
| `PEDBService.screen_and_persist_deal` | deal_data, screening_input | Full workflow: create deal record → run ESG screening → persist scores. |
| `_to_json` | val | Convert a Python object to JSON string for JSONB columns. |
| `_row_to_dict` | row | Convert a SQLAlchemy row mapping to a JSON-safe dict. |
| `_dataclass_to_dict` | obj | Recursively convert a dataclass to dict. |

### 2.3 Engine `pe_deal_engine` (services/pe_deal_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PEDealEngine.screen_deal` | deal | Run ESG screening on a single deal. |
| `PEDealEngine.compare_deals` | deals | Generate side-by-side comparison table for IC discussion. |
| `PEDealEngine.pipeline_summary` | deals | Aggregate pipeline analytics. |
| `PEDealEngine.get_sector_heatmap` |  | Return sector ESG risk heatmap reference data. |
| `PEDealEngine.get_sub_dimensions` |  | Return ESG sub-dimensions for screening scorecard. |
| `PEDealEngine._score_dimensions` | deal | Score each ESG dimension from deal's sub-dimension ratings. |
| `PEDealEngine._composite_score` | dimension_scores | Equal-weighted composite across all dimensions. 1=best, 5=worst risk. |
| `PEDealEngine._risk_band` | composite | Map composite score to risk band. Lower score = lower risk. |
| `PEDealEngine._detect_red_flags` | deal | Detect ESG red flags from deal attributes. |
| `PEDealEngine._recommendation` | composite, risk_band, red_flags, hard_count | Generate screening recommendation. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `DB` *(shared)*, `__future__` *(shared)*, `db` *(shared)*, `deal`, `engine` *(shared)*, `fastapi` *(shared)*, `pe_deals`, `pe_sector_risk_heatmap`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/pe-deals/db/deals** — status `passed`, provenance ['db-empty'], source tables: `pe_deals`
Output: `{'type': 'object', 'keys': ['count', 'deals'], 'n_keys': 2}`

**GET /api/v1/pe-deals/db/deals/{deal_id}** — status `failed`, provenance ['db-empty'], source tables: `pe_deals`
Output: `None`

**GET /api/v1/pe-deals/db/pipeline-summary** — status `passed`, provenance ['real-db'], source tables: `pe_deals`
Output: `{'type': 'object', 'keys': ['totals', 'by_stage', 'by_sector', 'by_screening_status'], 'n_keys': 4}`

**GET /api/v1/pe-deals/db/sector-heatmap** — status `passed`, provenance ['db-empty'], source tables: `pe_sector_risk_heatmap`
Output: `{'type': 'object', 'keys': ['count', 'sectors'], 'n_keys': 2}`

**GET /api/v1/pe-deals/sector-heatmap** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sectors'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `pe_deal_engine` — extracted transformation lines:**
```python
sector_overall = round(sum(sector_risk.values()) / max(len(sector_risk), 1))
red_flag_count=result.hard_flag_count + result.soft_flag_count,
overall = round(sum(risks.values()) / len(risks))
avg_deal_size_eur=round(total_size / n, 2),
avg_esg_score=round(total_esg / n, 2),
overall = round(sum(risks.values()) / len(risks))
avg = total / assessed if assessed > 0 else 3.0  # Default to neutral if not assessed
avg = sum(assessed_vals) / len(assessed_vals)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `api::pe_portfolio` | engine:pe_db_service |