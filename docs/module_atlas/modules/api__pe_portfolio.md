# Api::Pe_Portfolio
**Module ID:** `api::pe_portfolio` · **Route:** `/api/v1/pe-portfolio` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pe-portfolio/monitor-company` | `monitor_company` | api/v1/routes/pe_portfolio.py |
| POST | `/api/v1/pe-portfolio/monitor-portfolio` | `monitor_portfolio` | api/v1/routes/pe_portfolio.py |
| POST | `/api/v1/pe-portfolio/value-creation-plan` | `value_creation_plan` | api/v1/routes/pe_portfolio.py |
| GET | `/api/v1/pe-portfolio/kpi-template` | `get_kpi_template` | api/v1/routes/pe_portfolio.py |
| GET | `/api/v1/pe-portfolio/sector-levers` | `get_sector_levers` | api/v1/routes/pe_portfolio.py |
| POST | `/api/v1/pe-portfolio/db/companies` | `db_create_company` | api/v1/routes/pe_portfolio.py |
| GET | `/api/v1/pe-portfolio/db/companies` | `db_list_companies` | api/v1/routes/pe_portfolio.py |
| PATCH | `/api/v1/pe-portfolio/db/companies/{company_id}` | `db_update_company` | api/v1/routes/pe_portfolio.py |
| POST | `/api/v1/pe-portfolio/db/companies/{company_id}/exit` | `db_record_exit` | api/v1/routes/pe_portfolio.py |
| GET | `/api/v1/pe-portfolio/db/summary` | `db_portfolio_summary` | api/v1/routes/pe_portfolio.py |

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

### 2.3 Engine `pe_portfolio_monitor` (services/pe_portfolio_monitor.py)
| Function | Args | Purpose |
|---|---|---|
| `PEPortfolioMonitor.monitor_company` | inp | Monitor a single portfolio company's ESG KPIs. |
| `PEPortfolioMonitor.monitor_portfolio` | fund_id, companies | Monitor all portfolio companies and produce summary. |
| `PEPortfolioMonitor.get_kpi_template` |  | Return KPI collection template for portfolio companies. |
| `PEPortfolioMonitor._traffic_light` | current, prior, target, direction | Determine traffic light for a single KPI. |
| `PEPortfolioMonitor._overall_traffic_light` | green, amber, red, total | Overall company traffic light from KPI distribution. |
| `PEPortfolioMonitor._aggregate_kpis` | companies | Weighted-average KPIs across portfolio (by ownership %). |

### 2.3 Engine `pe_value_creation` (services/pe_value_creation.py)
| Function | Args | Purpose |
|---|---|---|
| `PEValueCreationEngine.generate_plan` | company_id, company_name, sector, ebitda_eur, entry_multiple, current_esg_score | Generate a value creation plan for a portfolio company. |
| `PEValueCreationEngine.get_sector_levers` | sector | Return available ESG levers for a sector. |
| `PEValueCreationEngine.get_available_sectors` |  | Return sectors with defined ESG lever sets. |
| `PEValueCreationEngine._generate_milestones` | levers | Generate implementation milestones from levers. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `DB` *(shared)*, `__future__` *(shared)*, `api` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `for`, `pe_portfolio_companies`, `portfolio` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/pe-portfolio/db/companies** — status `passed`, provenance ['db-empty'], source tables: `pe_portfolio_companies`
Output: `{'type': 'object', 'keys': ['count', 'companies'], 'n_keys': 2}`

**GET /api/v1/pe-portfolio/db/summary** — status `passed`, provenance ['real-db'], source tables: `pe_portfolio_companies`
Output: `{'type': 'object', 'keys': ['total_companies', 'active_count', 'exited_count', 'total_invested_eur', 'total_nav_eur', 'total_exit_proceeds_eur', 'avg_esg_score', 'avg_esg_entry_score', 'by_sector'], 'n_keys': 9}`

**GET /api/v1/pe-portfolio/kpi-template** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['kpis'], 'n_keys': 1}`

**GET /api/v1/pe-portfolio/sector-levers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector', 'levers', 'available_sectors'], 'n_keys': 3}`

**POST /api/v1/pe-portfolio/db/companies** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `pe_portfolio_monitor` — extracted transformation lines:**
```python
yoy = current_val - prior_val
yoy_pct = round((current_val - prior_val) / abs(prior_val) * 100, 2)
total_all = total_g + total_a + total_r
pct_g = round(total_g / total_all * 100, 1) if total_all > 0 else 0
pct_a = round(total_a / total_all * 100, 1) if total_all > 0 else 0
pct_r = round(total_r / total_all * 100, 1) if total_all > 0 else 0
red_pct = red / total * 100
green_pct = green / total * 100
result[kpi_id] = round(totals[kpi_id] / weights[kpi_id], 4)
```

**Engine `pe_value_creation` — extracted transformation lines:**
```python
capex_mid = (capex_low + capex_high) / 2
rev_base = revenue_eur if revenue_eur > 0 else ebitda_eur * 4  # rough estimate
sav_mid_eur = rev_base * (sav_low + sav_high) / 2 / 100
ebitda_mid_eur = ebitda_eur * (ebitda_low + ebitda_high) / 2 / 100
roi = sav_mid_eur / capex_mid if capex_mid > 0 else 0.0
esg_improvement = min(len(levers) * 3.0, 20.0)  # ~3 points per lever, capped at 20
multiple_expansion = round(esg_improvement * ESG_MULTIPLE_EXPANSION_BPS / 10000, 2)
exit_mult = entry_multiple + multiple_expansion
exit_ebitda = ebitda_eur + total_ebitda
exit_ev = exit_ebitda * exit_mult
entry_ev = ebitda_eur * entry_multiple
value_creation = exit_ev - entry_ev
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `api::pe_deals` | engine:pe_db_service |