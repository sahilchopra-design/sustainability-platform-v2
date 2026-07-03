# Api::Glidepath
**Module ID:** `api::glidepath` · **Route:** `/api/v1/glidepath` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/glidepath/sectors` | `list_glidepath_sectors` | api/v1/routes/glidepath.py |
| GET | `/api/v1/glidepath/sector/{sector}` | `get_sector_glidepath` | api/v1/routes/glidepath.py |
| GET | `/api/v1/glidepath/portfolio/{portfolio_id}/status-grid` | `get_glidepath_status_grid` | api/v1/routes/glidepath.py |
| GET | `/api/v1/glidepath/nzba/{sector}` | `get_nzba_glidepath` | api/v1/routes/glidepath.py |
| GET | `/api/v1/glidepath/crrem/{asset_type}` | `get_crrem_pathway` | api/v1/routes/glidepath.py |
| GET | `/api/v1/glidepath/crrem/asset/{asset_id}` | `get_crrem_asset` | api/v1/routes/glidepath.py |
| GET | `/api/v1/glidepath/dqs/{portfolio_id}` | `get_portfolio_dqs` | api/v1/routes/glidepath.py |
| GET | `/api/v1/glidepath/dqs/{portfolio_id}/improve` | `get_dqs_improvement_plan` | api/v1/routes/glidepath.py |

### 2.3 Engine `data_hub_client` (services/data_hub_client.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_db_session` |  | Get a fresh database session from the shared engine. |
| `_safe_query` | fn | Decorator that wraps DB calls with try/except + session cleanup. |
| `get_emissions` | db, lei | Retrieve Scope 1/2/3 GHG emissions for a counterparty by GLEIF LEI. |
| `get_glidepath` | db, sector, scenario | Retrieve the NZBA/IEA annual glidepath for a sector from NGFS data. |
| `get_crrem_pathway` | db, country, asset_type, scenario | Retrieve the CRREM carbon intensity pathway for a real estate asset. |
| `get_carbon_price` | db, scenario, year | Retrieve the carbon price (USD/tCO2) for a given NGFS scenario and year. |
| `get_sector_benchmark` | db, sector | Retrieve sector-level financial/emissions benchmarks from ingested data. |
| `get_dqs_summary` | db, portfolio_id | Exposure-weighted average PCAF Data Quality Score for a portfolio. |
| `health_check` |  | Always True -- same process, no network hop. |

### 2.3 Engine `pcaf_time_series_engine` (services/pcaf_time_series_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `compute_rag` | actual, target | Returns (rag_status, deviation_pct). |
| `interpolate_glidepath` | glidepath, year | Linear interpolation between known glidepath years. |
| `PCAFTimeSeriesEngine.get_sector_glidepath` | portfolio_id, sector, time_series_rows, data_hub_glidepath |  |
| `PCAFTimeSeriesEngine.get_crrem_asset` | asset_id, asset_name, asset_type, country, actual_by_year, crrem_pathway | Compute CRREM pathway comparison for a single real estate asset. |
| `PCAFTimeSeriesEngine.build_status_grid` | portfolio_id, sectors, time_series_rows | Build sector × year RAG status grid for the tracker table. |
| `PCAFTimeSeriesEngine.get_available_sectors` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `Data`, `__future__` *(shared)*, `api` *(shared)*, `assets_pg` *(shared)*, `collections` *(shared)*, `csrd_entity_registry` *(shared)*, `db` *(shared)*, `dh_crrem_pathways` *(shared)*, `esrs_e1_ghg_emissions`, `exc` *(shared)*, `fastapi` *(shared)*, `real` *(shared)*, `real_estate`, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `upgrading`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/glidepath/crrem/asset/{asset_id}** — status `passed`, provenance ['db-empty'], source tables: `dh_crrem_pathways`
Output: `{'type': 'object', 'keys': ['asset_id', 'asset_name', 'stranding_year', 'current_intensity_kgco2_m2', 'pathway_source', 'data_points'], 'n_keys': 6}`

**GET /api/v1/glidepath/crrem/{asset_type}** — status `passed`, provenance ['db-empty'], source tables: `dh_crrem_pathways`
Output: `{'type': 'object', 'keys': ['asset_type', 'country', 'metric', 'source', 'pathway'], 'n_keys': 5}`

**GET /api/v1/glidepath/dqs/{portfolio_id}** — status `passed`, provenance ['db-empty'], source tables: `assets_pg`
Output: `{'type': 'object', 'keys': ['portfolio_id', 'weighted_dqs', 'dqs_distribution', 'coverage_pct', 'total_assets', 'total_exposure', 'improvement_actions', 'note'], 'n_keys': 8}`

**GET /api/v1/glidepath/dqs/{portfolio_id}/improve** — status `passed`, provenance ['db-empty'], source tables: `assets_pg`
Output: `{'type': 'object', 'keys': ['portfolio_id', 'current_weighted_dqs', 'improvement_plan', 'note'], 'n_keys': 4}`

**GET /api/v1/glidepath/nzba/{sector}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector', 'metric', 'source', 'glidepath'], 'n_keys': 4}`

## 5 · Intermediate Transformation Logic

**Engine `data_hub_client` — extracted transformation lines:**
```python
co2_total = float(owid.co2 or 0) * 1_000_000  # Mt -> t
per_entity = co2_total / max(entity_count, 1)
scope1 = round(per_entity * 0.6, 2)
scope2 = round(per_entity * 0.25, 2)
scope3 = round(per_entity * 0.15, 2)
scope2 = round(float(ct.emissions_quantity) * 0.3, 2)
closest = min(records, key=lambda r: abs(r.year - year))
weighted_dqs = round(weighted_sum / total_exposure, 2) if total_exposure > 0 else 5.0
coverage_pct = round(covered_exposure / total_exposure * 100, 1) if total_exposure > 0 else 0.0
```

**Engine `pcaf_time_series_engine` — extracted transformation lines:**
```python
deviation = (actual - target) / target  # positive = above = worse
frac = (year - y1) / (y2 - y1)
years = sorted(set(list(range(2020, 2051, 5)) + list(actual_by_year.keys())))
iea_nze = target * 0.90 if target is not None else None
years = sorted(set(list(range(2020, 2051, 5)) + list(actual_by_year.keys())))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).