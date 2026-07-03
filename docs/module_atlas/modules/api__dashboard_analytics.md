# Api::Dashboard_Analytics
**Module ID:** `api::dashboard_analytics` · **Route:** `/api/v1/dashboard` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/dashboard/analytics` | `full_dashboard` | api/v1/routes/dashboard_analytics.py |
| GET | `/api/v1/dashboard/analytics/kpis` | `dashboard_kpis` | api/v1/routes/dashboard_analytics.py |
| GET | `/api/v1/dashboard/analytics/portfolio` | `dashboard_portfolio` | api/v1/routes/dashboard_analytics.py |
| GET | `/api/v1/dashboard/analytics/climate` | `dashboard_climate` | api/v1/routes/dashboard_analytics.py |
| GET | `/api/v1/dashboard/analytics/emissions` | `dashboard_emissions` | api/v1/routes/dashboard_analytics.py |
| GET | `/api/v1/dashboard/analytics/governance` | `dashboard_governance` | api/v1/routes/dashboard_analytics.py |
| GET | `/api/v1/dashboard/analytics/time-series` | `dashboard_time_series` | api/v1/routes/dashboard_analytics.py |
| GET | `/api/v1/dashboard/analytics/sensitivity` | `dashboard_sensitivity` | api/v1/routes/dashboard_analytics.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `real-db`

**Database tables:** `CPI`, `NGFS` *(shared)*, `SBTi`, `__future__` *(shared)*, `all` *(shared)*, `company_profiles` *(shared)*, `csrd_entity_registry` *(shared)*, `csrd_kpi_values` *(shared)*, `db` *(shared)*, `dh_ca100_assessments` *(shared)*, `dh_country_risk_indices` *(shared)*, `dh_sbti_companies`, `fastapi` *(shared)*, `ngfs_scenarios`, `portfolios_pg` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/dashboard/analytics** — status `passed`, provenance ['real-db'], source tables: `company_profiles`, `csrd_entity_registry`, `csrd_kpi_values`, `dh_ca100_assessments`, `dh_country_risk_indices`, `dh_sbti_companies`, `portfolios_pg`
Output: `{'type': 'object', 'keys': ['kpis', 'portfolio_exposure', 'climate_risk', 'emissions_by_sector', 'governance_heatmap', 'sbti_alignment', 'ca100_overview'], 'n_keys': 7}`

**GET /api/v1/dashboard/analytics/climate** — status `passed`, provenance ['real-db'], source tables: `dh_ca100_assessments`, `dh_sbti_companies`
Output: `{'type': 'object', 'keys': ['climate_risk', 'ca100_overview'], 'n_keys': 2}`

**GET /api/v1/dashboard/analytics/emissions** — status `passed`, provenance ['real-db'], source tables: `dh_sbti_companies`
Output: `{'type': 'object', 'keys': ['emissions_by_sector'], 'n_keys': 1}`

**GET /api/v1/dashboard/analytics/governance** — status `passed`, provenance ['real-db'], source tables: `dh_country_risk_indices`
Output: `{'type': 'object', 'keys': ['governance_heatmap'], 'n_keys': 1}`

**GET /api/v1/dashboard/analytics/kpis** — status `passed`, provenance ['real-db'], source tables: `company_profiles`, `csrd_entity_registry`, `csrd_kpi_values`, `dh_ca100_assessments`, `dh_country_risk_indices`, `dh_sbti_companies`, `portfolios_pg`
Output: `{'type': 'object', 'keys': ['total_entities', 'csrd_entities', 'csrd_kpi_values', 'sbti_companies', 'sbti_net_zero', 'sbti_aligned_1_5c', 'ca100_companies', 'country_risk_countries', 'country_risk_indices', 'portfolios',`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).