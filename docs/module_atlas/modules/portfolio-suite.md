# Portfolio Suite
**Module ID:** `portfolio-suite` · **Route:** `/portfolio-suite` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated hub consolidating portfolio analytics modules including climate risk, ESG scoring, optimisation, and performance attribution.

> **Business value:** Serves as the single entry point for all portfolio-level sustainability analytics, enabling holistic review and drill-down into specialist modules.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ITEMS`, `PAGE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `ITEMS` | `Array.from({length:50},(_,i)=>({id:i+1,name:'Portfolio '+(i+1),strategy:F1[Math.floor(sr(i*3)*F1.length)],region:F2[Math.floor(sr(i*7)*F2.length)],aum` |
| `exportCSV` | `(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].j` |
| `paged` | `filtered.slice(page*PAGE,page*PAGE+PAGE);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `kpis` | `useMemo(()=>{const n=filtered.length\|\|1;return[{l:'Portfolios',v:filtered.length},{l:'Total AUM',v:'$'+fmt(filtered.reduce((s,x)=>s+x.aum,0))+'M'},{l:` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/portfolio-analytics/portfolios` | `list_all_portfolios` | api/v1/routes/portfolio_analytics.py |
| POST | `/api/v1/portfolio-analytics/portfolios` | `create_portfolio` | api/v1/routes/portfolio_analytics.py |
| GET | `/api/v1/portfolio-analytics/portfolios/{portfolio_id}` | `get_portfolio_by_id` | api/v1/routes/portfolio_analytics.py |
| PATCH | `/api/v1/portfolio-analytics/portfolios/{portfolio_id}` | `update_portfolio` | api/v1/routes/portfolio_analytics.py |
| GET | `/api/v1/portfolio-analytics/portfolios/{portfolio_id}/holdings` | `list_holdings` | api/v1/routes/portfolio_analytics.py |
| POST | `/api/v1/portfolio-analytics/portfolios/{portfolio_id}/holdings` | `add_holding` | api/v1/routes/portfolio_analytics.py |
| DELETE | `/api/v1/portfolio-analytics/portfolios/{portfolio_id}/holdings/{property_id}` | `delete_holding` | api/v1/routes/portfolio_analytics.py |
| GET | `/api/v1/portfolio-analytics/portfolios/{portfolio_id}/analytics` | `get_portfolio_analytics` | api/v1/routes/portfolio_analytics.py |
| POST | `/api/v1/portfolio-analytics/portfolios/{portfolio_id}/scenarios/compare` | `compare_scenarios` | api/v1/routes/portfolio_analytics.py |
| GET | `/api/v1/portfolio-analytics/portfolios/{portfolio_id}/dashboard` | `get_portfolio_dashboard` | api/v1/routes/portfolio_analytics.py |
| POST | `/api/v1/portfolio-analytics/portfolios/{portfolio_id}/reports/generate` | `generate_report` | api/v1/routes/portfolio_analytics.py |
| GET | `/api/v1/portfolio-analytics/reports/{report_id}` | `get_report_by_id` | api/v1/routes/portfolio_analytics.py |
| GET | `/api/v1/portfolio-analytics/enums` | `get_enum_values` | api/v1/routes/portfolio_analytics.py |
| POST | `/api/v1/portfolio-analytics/seed-sample-data` | `seed_sample_data` | api/v1/routes/portfolio_analytics.py |
| POST | `/api/v1/portfolio-analytics/{portfolio_id}/pcaf-run` | `run_pcaf_for_portfolio` | api/v1/routes/portfolio_analytics.py |

### 2.3 Engine `portfolio_analytics_engine` (services/portfolio_analytics_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_db_engine` |  | Lazy import to avoid circular imports at module load. |
| `_resolve_emissions` | asset | Resolve Scope 1, 2, 3 emissions and PCAF DQS for one asset row. |
| `_write_time_series` | db_engine, portfolio_id, sector, metric_type, actual_value, glidepath_value | Insert one record into pcaf_time_series. No-ops if table doesn't exist. |
| `run_pcaf_calculation` | portfolio_id | Execute a full PCAF Standard v2.0 financed emissions calculation for |
| `get_latest_pcaf_results` | portfolio_id | Return the most recent PCAF metrics from pcaf_time_series (cached). |
| `get_waci_history` | portfolio_id, years | Return year-by-year WACI vs glidepath for sparkline charts. |
| `get_portfolio` | portfolio_id | Return portfolio metadata from portfolios_pg. |
| `get_holdings` | portfolio_id | Return asset holdings for a portfolio from assets_pg. |
| `_ReportSubEngine.generate_report` | portfolio_id, report_type, include_property_details |  |
| `PortfolioAggregationEngine.get_dashboard` | portfolio_id |  |
| `PortfolioAggregationEngine.compare_scenarios` | portfolio_id, scenario_ids |  |

### 2.3 Engine `portfolio_analytics_engine_v2` (services/portfolio_analytics_engine_v2.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_db_engine` |  | Return (or lazily create) the SQLAlchemy engine. |
| `_exec` | query, params | Execute a SELECT and return all rows, or [] on failure. |
| `_exec_scalar` | query, params |  |
| `_exec_write` | query, params |  |
| `_table_exists` | t | Return True if table exists in the public schema. |
| `get_portfolio` | portfolio_id, org_id | Return portfolio dict — reads from portfolios_pg (primary) or legacy portfolios table. |
| `list_portfolios` | org_id | List portfolios — reads from portfolios_pg (primary) or legacy portfolios table. |
| `get_portfolios_from_db` | org_id | Async wrapper - returns portfolios for the given org from Supabase. |
| `_get_sector_ref` | sector | Look up reference data for a sector, with fuzzy matching. |
| `_estimate_region_from_lei` | lei, sector | Estimate geographic region from LEI prefix or sector heuristic. |
| `get_holdings` | portfolio_id | Return holdings from assets_pg (primary) or legacy portfolio_holdings table. |
| `save_portfolio` | portfolio_id, portfolio | Persist a portfolio to portfolio_analytics (migration 005). |
| `save_holding` | portfolio_id, holding | Persist a holding to portfolio_property_holdings (migration 005). |
| `remove_holding` | portfolio_id, holding_id | Delete a holding from portfolio_property_holdings or in-memory store. |
| `save_report` | report | Persist a report to portfolio_reports (migration 005) or in-memory fallback. |
| `get_report` | report_id | Retrieve a report from portfolio_reports or in-memory fallback. |
| `init_sample_data` |  | No-op: v2 uses real DB data, not sample data. |
| `_get_climate_risk_summary` | portfolio_id | Query portfolio_climate_risk for this portfolio. |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

**Database tables:** `api` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `fields` *(shared)*, `middleware` *(shared)*, `pcaf_time_series` *(shared)*, `portfolio` *(shared)*, `portfolios_pg` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `typing` *(shared)*, `uuid` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Modules Integrated | — | Platform Registry | Number of portfolio analytics sub-modules accessible via the suite hub. |
| Portfolio ESG Score | — | Provider Composite | Current weighted average ESG composite for default portfolio. |
| Climate Risk Flag | — | Climate Pulse Engine | Aggregate physical + transition risk classification for the portfolio. |
- **Portfolio holdings + ESG data + climate scores** → Cross-module aggregation; summary scorecard computation → **Suite landing page with navigation and integrated KPI summary**

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio ESG Composite
**Headline formula:** `ESG_p = Σ(wᵢ × ESGᵢ) / Σwᵢ`
**Standards:** ['MSCI ESG Ratings Methodology', 'TCFD Recommendations']

**Engine `portfolio_analytics_engine` — extracted transformation lines:**
```python
estimated_s1  = (intensity * revenue_meur).quantize(
reporting_year = datetime.now(timezone.utc).year - 1
coverage_pct=float(portfolio_result.coverage_pct) / 100.0,
reporting_year = datetime.now(timezone.utc).year - 1
```

**Engine `portfolio_analytics_engine_v2` — extracted transformation lines:**
```python
adjusted_value = current_value * (1 + adjustment)
weighted_base = acquisition_cost * ownership
weighted_adjusted = adjusted_value * ownership
weighted_income = annual_income * ownership
risk = min(100, max(0, int(float(raw_pd) * 1000)))  # PD 0.02 → 20, PD 0.10 → 100
value_change = total_adjusted_value - total_base_value
avg_gresb = sum(gresb_scores) / len(gresb_scores) if gresb_scores else None
σ = base_vol + risk_premium × (risk_score / 100)
BASE_VOL = 0.04      # institutional-grade baseline
RISK_PREMIUM = 0.16  # max additional for highest-risk portfolios
HOLDING_PERIOD_DAYS = 250  # 1-year VaR
risk_vol = BASE_VOL + RISK_PREMIUM * (avg_risk / 100.0)
blended = 0.7 * realised_vol + 0.3 * risk_vol
blended = BASE_VOL + RISK_PREMIUM * (avg_risk / 100.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **66** other module(s).
**Shared engines (edits propagate!):** `portfolio_analytics_engine` (used by 9 modules), `portfolio_analytics_engine_v2` (used by 9 modules)

| Connected module | Shared via |
|---|---|
| `portfolio-transition-alignment` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:datetime, table:db, table:decimal |
| `portfolio-optimizer` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:datetime, table:db, table:decimal |
| `portfolio-temperature-score` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:datetime, table:db, table:decimal |
| `portfolio-dashboard` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:datetime, table:db, table:decimal |
| `portfolio-climate-var` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:datetime, table:db, table:decimal |
| `portfolio-stress-test-drilldown` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:datetime, table:db, table:decimal |
| `portfolio-manager` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:datetime, table:db, table:decimal |
| `portfolio-climate-pulse` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:datetime, table:db, table:decimal |
| `stranded-assets` | table:datetime, table:db, table:decimal, table:schemas, table:uuid |
| `real-estate-valuation` | table:datetime, table:db, table:decimal, table:schemas, table:uuid |