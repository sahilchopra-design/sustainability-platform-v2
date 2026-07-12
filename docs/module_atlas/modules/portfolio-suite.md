# Portfolio Suite
**Module ID:** `portfolio-suite` · **Route:** `/portfolio-suite` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated hub consolidating portfolio analytics modules including climate risk, ESG scoring, optimisation, and performance attribution.

> **Business value:** Serves as the single entry point for all portfolio-level sustainability analytics, enabling holistic review and drill-down into specialist modules.

**How an analyst works this module:**
- Select portfolio from registry or upload holdings.
- Access sub-modules via suite navigation tiles.
- Review cross-module summary scorecard.
- Export consolidated portfolio ESG and climate report.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ITEMS`, `PAGE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `ITEMS` | `Array.from({length:50},(_,i)=>({id:i+1,name:'Portfolio '+(i+1),strategy:F1[Math.floor(sr(i*3)*F1.length)],region:F2[Math.floor(sr(i*7)*F2.length)],aum:+(sr(i*11)*5000+100).toFixed(0),returnYtd:+(sr(i*13)*25-5).toFixed(2)` |
| `exportCSV` | `(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.create` |
| `filtered` | `useMemo(()=>{let d=[...ITEMS];if(search)d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));if(f1!=='All')d=d.filter(x=>x.strategy===f1);if(f2!=='All')d=d.filter(x=>x.region===f2);d.sort((a,b)=>sortDir==='asc'?((a[sortCol]>b[sortCol])?1:-1):((a[sortCol]<b[sortCol])?1:-1));return d;},[search,sortCol,sortDir,f1,f2]); const pa` |
| `kpis` | `useMemo(()=>{const n=filtered.length\|\|1;return[{l:'Portfolios',v:filtered.length},{l:'Total AUM',v:'$'+fmt(filtered.reduce((s,x)=>s+x.aum,0))+'M'},{l:'Avg Return',v:(filtered.reduce((s,x)=>s+parseFloat(x.returnYtd),0)/n)` |

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
| GET | `/api/v1/portfolio-analytics/{portfolio_id}/pcaf-results` | `get_pcaf_results` | api/v1/routes/portfolio_analytics.py |
| GET | `/api/v1/portfolio-analytics/{portfolio_id}/waci-history` | `get_waci_history` | api/v1/routes/portfolio_analytics.py |

### 2.3 Engine `portfolio_analytics_engine` (services/portfolio_analytics_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_db_engine` |  | Lazy import to avoid circular imports at module load. |
| `_resolve_emissions` | asset | Resolve Scope 1, 2, 3 emissions and PCAF DQS for one asset row. Priority: DQS 3 -- scope1/2/3 columns populated in assets_pg DQS 4 -- Data Hub LEI lookup DQS 5 -- sector-average intensity x revenue (estimated proxy) Returns (scope1_tco2e, scope2_tco2e, scope3_tco2e, dqs_int) |
| `_write_time_series` | db_engine, portfolio_id, sector, metric_type, actual_value, glidepath_value, unit, dqs_score | Insert one record into pcaf_time_series. No-ops if table doesn't exist. |
| `run_pcaf_calculation` | portfolio_id | Execute a full PCAF Standard v2.0 financed emissions calculation for the given portfolio. Returns a serialisable dict with keys: data_available, portfolio_id, portfolio_name, reporting_year, portfolio_summary, dqs_distribution, sector_breakdown, investee_results, pai_indicators, validation_summary, parse_errors, engine_version, calculation_timestamp |
| `get_latest_pcaf_results` | portfolio_id | Return the most recent PCAF metrics from pcaf_time_series (cached). Runs the engine on-demand if no cached record exists. |
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
| `get_portfolio` | portfolio_id, org_id | Return portfolio dict — reads from portfolios_pg (primary) or legacy portfolios table. P0-2: When org_id is provided the row is only returned if portfolio.org_id matches, preventing cross-tenant data access. |
| `list_portfolios` | org_id | List portfolios — reads from portfolios_pg (primary) or legacy portfolios table. P0-2: When org_id is provided only portfolios belonging to that org are returned. |
| `get_portfolios_from_db` | org_id | Async wrapper - returns portfolios for the given org from Supabase. |
| `_get_sector_ref` | sector | Look up reference data for a sector, with fuzzy matching. |
| `_estimate_region_from_lei` | lei, sector | Estimate geographic region from LEI prefix or sector heuristic. |
| `get_holdings` | portfolio_id | Return holdings from assets_pg (primary) or legacy portfolio_holdings table. Auto-estimates missing datapoints using sector reference data and flags them. |
| `save_portfolio` | portfolio_id, portfolio | Persist a portfolio to portfolio_analytics (migration 005). Falls back to in-memory store when the table is unavailable. |
| `save_holding` | portfolio_id, holding | Persist a holding to portfolio_property_holdings (migration 005). Falls back to in-memory store when the table is unavailable. |
| `remove_holding` | portfolio_id, holding_id | Delete a holding from portfolio_property_holdings or in-memory store. |
| `save_report` | report | Persist a report to portfolio_reports (migration 005) or in-memory fallback. |
| `get_report` | report_id | Retrieve a report from portfolio_reports or in-memory fallback. |
| `init_sample_data` |  | No-op: v2 uses real DB data, not sample data. |
| `_get_climate_risk_summary` | portfolio_id | Query portfolio_climate_risk for this portfolio. |
| `_get_exposure_assessments` | portfolio_id | Query exposure_assessments ordered by physical_var_pct DESC. |
| `_get_financial_instruments` | portfolio_id | Query financial_instruments for this portfolio. |
| `_get_entities_for_portfolio` | portfolio_id | Query entities joined to financial_instruments for this portfolio. |
| `_get_emission_trends_db` | portfolio_id | Query scope3_category_emissions for this portfolio. |
| `_get_top_exposed_assets_db` | portfolio_id, limit | Return top assets by exposure from exposure_assessments or financial_instruments. |
| `get_portfolio_overview` | portfolio_id | Return portfolio overview KPIs from DB (no mock data). |
| `get_climate_risk_heatmap` | portfolio_id | Return climate risk heatmap data from DB. |
| `get_sector_breakdown` | portfolio_id | Return sector breakdown from DB. |
| `get_emission_trends` | portfolio_id | Return emission trends from scope3_category_emissions. |
| `get_top_exposed_assets` | portfolio_id, limit | Return top exposed assets from DB. |
| `PortfolioAnalyticsEngine.calculate_analytics` | portfolio_id, scenario_id, time_horizon, as_of_date | Calculate comprehensive portfolio analytics. |
| `PortfolioAnalyticsEngine._empty_analytics` | portfolio_id, calc_date | Return empty analytics for portfolio with no holdings. |
| `PortfolioAnalyticsEngine._get_scenario_adjustment` | scenario_id, holding | Get scenario-specific value adjustment from DB scenario parameters. |
| `PortfolioAnalyticsEngine._calculate_var` | portfolio_value, avg_risk, holdings | Calculate parametric Value-at-Risk (95% confidence). Uses sector-level volatility from exposure_assessments when available, otherwise applies a risk-score-calibrated volatility model: σ = base_vol + risk_premium × (risk_score / 100) where base_vol = 4% (institutional-grade RE) and risk_premium = 16%. |
| `PortfolioAnalyticsEngine._calculate_concentration` | values_dict, total | Calculate concentration metrics (HHI). |
| `PortfolioAnalyticsEngine.compare_scenarios` | portfolio_id, scenario_ids, time_horizon | Compare multiple scenarios for a portfolio. |
| `PortfolioDashboardEngine.get_dashboard` | portfolio_id, scenario_id, time_horizon | Generate dashboard data for a portfolio. |
| `PortfolioReportEngine.generate_report` | portfolio_id, report_type, scenario_id, time_horizon, include_charts, include_property_details | Generate a report for the portfolio. |

**Engine `portfolio_analytics_engine_v2` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `SECTOR_REFERENCE_DATA` | `{'Technology': {'avg_pd': 0.015, 'avg_lgd': 0.4, 'avg_scope1_intensity': 5, 'avg_scope2_intensity': 25, 'avg_scope3_intensity': 50, 'avg_risk_score': 25}, 'Healthcare': {'avg_pd': 0.018, 'avg_lgd': 0.42, 'avg_scope1_intensity': 8, 'avg_scope2_intensity': 30, 'avg_scope3_intensity': 55, 'avg_risk_sco` |
| `COUNTRY_REFERENCE_DATA` | `{'US': {'sovereign_spread': 0, 'regulatory_risk': 'low'}, 'UK': {'sovereign_spread': 10, 'regulatory_risk': 'low'}, 'Germany': {'sovereign_spread': 5, 'regulatory_risk': 'low'}, 'France': {'sovereign_spread': 8, 'regulatory_risk': 'low'}, 'Japan': {'sovereign_spread': 15, 'regulatory_risk': 'low'}, ` |
| `GLOBAL_FALLBACK` | `{'avg_pd': 0.025, 'avg_lgd': 0.45, 'avg_scope1_intensity': 40, 'avg_scope2_intensity': 30, 'avg_scope3_intensity': 100, 'avg_risk_score': 35}` |
| `_LEI_REGION_MAP` | `{'US': 'North America', 'GB': 'Europe', 'DE': 'Europe', 'FR': 'Europe', 'JP': 'Asia Pacific', 'CN': 'Asia Pacific', 'IN': 'Asia Pacific', 'BR': 'Latin America', 'AU': 'Asia Pacific', 'CA': 'North America', 'CH': 'Europe', 'NL': 'Europe', 'SE': 'Europe', 'IT': 'Europe', 'ES': 'Europe', 'KR': 'Asia Pa` |
| `_SECTOR_REGION_HEURISTIC` | `{'Technology': 'North America', 'Financials': 'Europe', 'Energy': 'North America', 'Healthcare': 'North America', 'Industrials': 'Europe', 'Consumer': 'North America', 'Materials': 'Asia Pacific', 'Utilities': 'Europe', 'Real Estate': 'Europe', 'Communications': 'North America'}` |

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

AUM-weighted aggregation of holding-level ESG scores into a portfolio-level composite.

**Standards:** ['MSCI ESG Ratings Methodology', 'TCFD Recommendations']
**Reference documents:** TCFD Final Recommendations (2017); MSCI ESG Ratings Methodology Document

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
var_amount = float(portfolio_value) * blended * Z_95
shares = [float(v) / total_float for v in values_dict.values()]
hhi = sum(s ** 2 for s in shares)
worst = sorted_rows[-1].scenario_name
value_spread = sorted_rows[0].total_value - sorted_rows[-1].total_value
top_missing = sorted(missing_fields_counter.items(), key=lambda x: -x[1])[:5]
data_quality_report=DataQualityReport(**data_quality_report),
uncertified = len(holdings) - cert_count
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **48** other module(s).
**Shared engines (edits propagate!):** `portfolio_analytics_engine` (used by 9 modules), `portfolio_analytics_engine_v2` (used by 9 modules)

| Connected module | Shared via |
|---|---|
| `portfolio-stress-test-drilldown` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-transition-alignment` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-climate-var` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-dashboard` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-climate-pulse` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-manager` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-optimizer` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-temperature-score` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `real-estate-valuation` | table:decimal, table:schemas, table:uuid |
| `sustainability-report-builder` | table:decimal, table:schemas, table:uuid |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a *hub consolidating 12 portfolio analytics
> sub-modules* with a portfolio ESG composite `ESG_p = Σ(wᵢ·ESGᵢ)/Σwᵢ` and a "Climate Risk Flag" from
> a "Climate Pulse Engine". **The code is a generic filterable list of 50 synthetic portfolios**
> (`ITEMS`) with strategy/region filters and KPI cards. There is no ESG-composite aggregation of real
> holdings and no cross-module scorecard — the "suite" is a directory-style landing table, not an
> analytics engine.

### 7.1 What the module computes

Descriptive KPIs over a filtered list of synthetic portfolios:

```js
ITEMS[i] = { strategy, region, aum: sr(i·11)·5000+100, returnYtd: sr(i·13)·25−5, … }   // 50 rows
kpis = [ Portfolios: filtered.length,
         Total AUM: Σ aum,
         Avg Return: Σ returnYtd / n,
         … ]
fmt(v): B/M/K suffix formatter
```

Filtering is by `strategy` (F1) and `region` (F2); sorting toggles column/direction; a CSV export
serialises the filtered rows.

### 7.2 Parameterisation / seed rubric

| Field | Formula | Provenance |
|---|---|---|
| `aum` | `sr(i·11)·5000 + 100` ($M) | synthetic demo value |
| `returnYtd` | `sr(i·13)·25 − 5` (%) | synthetic; −5 to +20 |
| `strategy` | `F1[floor(sr(i·3)·|F1|)]` | synthetic categorical |
| `region` | `F2[floor(sr(i·7)·|F2|)]` | synthetic categorical |
| `name` | `'Portfolio ' + (i+1)` | template label |

### 7.3 Calculation walkthrough

50 `ITEMS` generated at load; `filtered` applies search + strategy + region + sort; `kpis` reduce over
the filtered set for count, total AUM, and mean return. No sub-module data is fetched or aggregated;
the "12 modules integrated" figure is guide prose, not a live registry read.

### 7.4 Worked example

Filter to 3 portfolios with AUM [2000, 1500, 800] and returnYtd [8.0, −2.0, 12.0]:

| Output | Computation | Result |
|---|---|---|
| Portfolios | count | 3 |
| Total AUM | 2000+1500+800 | $4.3B (fmt) |
| Avg Return | (8.0 − 2.0 + 12.0)/3 | 6.0 % |

### 7.5 Data provenance & limitations

- **All 50 portfolios synthetic** via `sr(seed)=frac(sin(seed+1)×10⁴)`; names are templated.
- No ESG composite, no climate flag, no cross-module scorecard — the guide's analytics-hub role is
  aspirational. This is a list/registry UI showing summary metrics of random portfolios, so no
  production risk-model specification is warranted (§8 not triggered).

**Framework alignment:** MSCI ESG / TCFD — named as the aggregation standards the hub *would* apply,
but the page computes only count/sum/mean over synthetic AUM and return; the portfolio-ESG-composite
formula is not implemented here (it exists in `portfolio-manager` / `portfolio-optimizer`).

## 9 · Future Evolution

### 9.1 Evolution A — Real cross-module scorecard over live portfolios (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide describes a hub consolidating 12 portfolio-analytics sub-modules with a portfolio ESG composite (`ESG_p = Σ wᵢ·ESGᵢ/Σwᵢ`) and a Climate Risk Flag from a "Climate Pulse Engine," but the code is a generic filterable list of 50 synthetic portfolios (`ITEMS`, `aum = sr()·5000+100`) with strategy/region filters and KPI cards — a directory landing table, not an analytics engine. There is no ESG composite over real holdings and no cross-module scorecard. Evolution A makes it the real hub it claims to be, over `portfolios_pg`.

**How.** (1) Replace the 50 synthetic portfolios with the real registry via `GET /portfolios` and per-portfolio `/analytics`/`/dashboard` (the shared `portfolio_analytics_engine`, feeding 48 modules). (2) Build the cross-module summary scorecard the guide promises: for a selected portfolio, pull the real ESG composite, WACI, temperature score, and climate VaR from the specialist sibling modules' engines (this suite is their consolidation layer) — the ESG composite `Σ wᵢ·ESGᵢ/Σwᵢ` computed over real holdings, not absent. (3) The suite-navigation tiles (§1) deep-link to the specialist modules pre-loaded with the selected portfolio, and the consolidated report (§1) uses the `/reports/generate` endpoint. This is primarily an orchestration/wiring build.

**Prerequisites.** The portfolio-analytics endpoints (auth-gated); the specialist modules' engines (many need their own Evolution-A wiring first — this suite depends on them being real); consistent portfolio selection across modules. **Acceptance:** the suite lists real `portfolios_pg` portfolios; the scorecard shows real ESG/WACI/temp/VaR from the specialist engines; tiles deep-link with the selected portfolio.

### 9.2 Evolution B — Portfolio-desk orchestrator (LLM tier 3)

**What.** This suite is the natural home for the roadmap's Tier-3 Desk Orchestrator: a persona-level assistant that routes across the portfolio family — "give me a full climate review of this portfolio" → ESG composite (portfolio-manager) → temperature score → climate VaR → stress test → synthesized memo, each figure sourced from the real specialist engine. It is the "single entry point for portfolio sustainability analytics" the guide describes, made conversational.

**How.** Routing uses the module atlas interconnection graph (this suite already links the sub-modules) and `module_tags.json`; the orchestrator calls each specialist module's tier-2 tools in sequence, composing results into a consolidated portfolio memo via the report-studio render layer (roadmap Tier-3 output). Every figure carries its source engine and provenance; the fabrication validator spans the whole multi-module conversation. The consolidated ESG/climate report (§1) becomes an engine-sourced, LLM-drafted deliverable. RBAC and confirmation gate any writes; the orchestrator inherits the user's session.

**Prerequisites (hard).** Evolution A here plus the specialist modules' own Evolution-A wiring — a desk orchestrator is only as sound as the engines it routes to; composing over the current synthetic sub-modules would launder fabrication at scale. **Acceptance:** every figure in a consolidated memo traces to a specific specialist-engine tool call; the orchestrator routes only to real (non-synthetic) module engines; writes require confirmation and RBAC.