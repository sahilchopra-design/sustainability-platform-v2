# Portfolio Dashboard
**Module ID:** `portfolio-dashboard` · **Route:** `/portfolio-dashboard` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COUNTRIES`, `HOLDINGS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `TABS` | `['Portfolio Overview','Sector Drill-Down','Country Exposure','ESG Analytics'];const SECTORS=['All','Technology','Financials','Healthcare','Energy','Consumer','Industrials','Materials','Utilities','Real Estate'];const PAG` |
| `country` | `COUNTRIES[Math.floor(sr(i*7)*COUNTRIES.length)];const wt=+(3-i*0.025+sr(i*11)*0.5).toFixed(2);const mktCap=+(sr(i*13)*2000+10).toFixed(0);` |
| `ret1d` | `+((sr(i*17)-0.48)*4).toFixed(2);const ret1m=+((sr(i*19)-0.45)*10).toFixed(1);const retYTD=+((sr(i*23)-0.4)*30).toFixed(1);const ret1y=+((sr(i*29)-0.35)*40).toFixed(1);` |
| `esgScore` | `Math.round(sr(i*31)*40+50);const carbonI=Math.round(sr(i*37)*300+10);const greenRev=Math.round(sr(i*41)*50);` |
| `filtered` | `useMemo(()=>{let d=[...HOLDINGS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((pa` |
| `stats` | `useMemo(()=>({count:filtered.length,totalWeight:filtered.reduce((s,r)=>s+r.weightPct,0).toFixed(1),avgRet1D:(filtered.reduce((s,r)=>s+r.return1D,0)/filtered.length\|\|0).toFixed(2),avgRetYTD:(filtered.reduce((s,r)=>s+r.ret` |
| `sectorAlloc` | `useMemo(()=>{const m={};HOLDINGS.forEach(h=>{if(!m[h.sector])m[h.sector]={s:h.sector,wt:0,ret:0,esg:0,n:0};m[h.sector].wt+=h.weightPct;m[h.sector].ret+=h.returnYTD;m[h.sector].esg+=h.esgScore;m[h.sector].n++;});return Ob` |
| `countryAlloc` | `useMemo(()=>{const m={};HOLDINGS.forEach(h=>{if(!m[h.country])m[h.country]={c:h.country,wt:0,n:0};m[h.country].wt+=h.weightPct;m[h.country].n++;});return Object.values(m).map(c=>({country:c.c,weight:+c.wt.toFixed(1),coun` |
| `perfHistory` | `Array.from({length:12},(_,m)=>({month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],portfolio:+((m+1)*0.8+sr(m*7)*3-1.5).toFixed(1),benchmark:+((m+1)*0.6+sr(m*11)*2.5-1.2).toFixed(1)}));` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=UR` |

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
**Provenance classes:** `frontend-seed`

**Database tables:** `api` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `fields` *(shared)*, `middleware` *(shared)*, `pcaf_time_series` *(shared)*, `portfolio` *(shared)*, `portfolios_pg` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `typing` *(shared)*, `uuid` *(shared)*
**Frontend seed datasets:** `COUNTRIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 5 · Intermediate Transformation Logic

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
| `portfolio-climate-pulse` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-manager` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-optimizer` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-suite` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-temperature-score` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `real-estate-valuation` | table:decimal, table:schemas, table:uuid |
| `sustainability-report-builder` | table:decimal, table:schemas, table:uuid |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code note.** There is no MODULE_GUIDES entry for this route (guide = null). The page is
> a synthetic holdings dashboard: it generates a random 150-name book and shows descriptive analytics
> (returns, sector/country allocation, ESG overlay). The tier-A backend PCAF engine
> (`portfolio_analytics_engine.py`) is **not called** — all data is `sr()`-seeded in the frontend.

### 7.1 What the module computes

Descriptive aggregates over `filtered` holdings, plus formatting helpers:

```js
stats.count      = filtered.length
stats.totalWeight= Σ r.weightPct
stats.avgRet1D   = Σ r.return1D / n      (||0 guard)
stats.avgRetYTD  = Σ r.returnYTD / n
sectorAlloc[s]   = { wt: Σ weightPct, ret: Σ returnYTD, esg: Σ esgScore, n }   // then means
countryAlloc[c]  = { wt: Σ weightPct, n }
perfHistory[m]   = { portfolio: (m+1)·0.8 + sr(m·7)·3 − 1.5, benchmark: (m+1)·0.6 + sr(m·11)·2.5 − 1.2 }
```

`fmt()` renders B/M/K/T suffixes. `pct(v,t) = t>0 ? v/t·100 : 0` guards allocation shares.

### 7.2 Parameterisation / seed rubric

| Field | Formula | Provenance |
|---|---|---|
| `weight (wt)` | `3 − i·0.025 + sr(i·11)·0.5` | synthetic; declining base + jitter |
| `mktCap` | `sr(i·13)·2000 + 10` ($M) | synthetic demo value |
| `ret1d / ret1m / retYTD / ret1y` | `(sr(i·1x)−0.4x)·[4,10,30,40]` | synthetic; centred returns |
| `esgScore` | `round(sr(i·31)·40 + 50)` | 50–90 synthetic |
| `carbonI` | `round(sr(i·37)·300 + 10)` | 10–310 synthetic |
| `greenRev` | `round(sr(i·41)·50)` | 0–50 % synthetic |
| `perfHistory` | linear trend + `sr()` jitter | synthetic 12-month series |

The return draws are centred slightly positive (offsets 0.48/0.45/0.40/0.35) so the synthetic book
shows a mild upward drift across horizons.

### 7.3 Calculation walkthrough

150 `HOLDINGS` built once; `filtered` applies search + sector + sort. `stats` are means over
`filtered`; `sectorAlloc`/`countryAlloc` bucket the **full** `HOLDINGS` (not filtered) into weight
sums and per-sector ESG/return means. `perfHistory` is a fixed 12-point portfolio-vs-benchmark line.
Pagination slices the table. No risk model, no scenario, no optimisation.

### 7.4 Worked example

Sector "Energy" holds 3 names with weightPct [2.0, 1.5, 2.5] and esgScore [60, 55, 65]:

| Output | Computation | Result |
|---|---|---|
| sectorAlloc.wt | 2.0+1.5+2.5 | 6.0 % |
| sectorAlloc.esg (mean) | (60+55+65)/3 | 60.0 |
| pct of 100 | 6.0/100·100 | 6.0 % |

### 7.5 Data provenance & limitations

- **All holdings and the performance line are synthetic** via `sr(seed)=frac(sin(seed+1)×10⁴)`;
  company names are `COUNTRIES`-tagged template strings.
- No benchmark data feed, no true attribution, no tracking error — the "ESG Analytics" tab overlays
  synthetic ESG/carbon scores only. This is a UI demonstration of a portfolio monitor, not a live
  analytics engine. No financial/risk quantity is model-derived, so §8 is not triggered (the metrics
  are descriptive aggregates of random inputs, not a claimed model output).

**Framework alignment:** none implemented computationally; the dashboard mirrors the *shape* of an
ESG-integrated portfolio monitor (PCAF WACI, MSCI-style ESG overlay) without the underlying
calculations. The real PCAF/WACI methodology exists in the shared backend engine but is not wired to
this page.

## 9 · Future Evolution

### 9.1 Evolution A — Real holdings behind the descriptive dashboard (analytics ladder: rung 1 → 3)

**What.** §7 notes there is no MODULE_GUIDES entry (guide = null) — the page is a synthetic holdings dashboard generating a random 150-name book and showing descriptive analytics (returns, sector/country allocation, ESG overlay). The correct pieces are the descriptive aggregations (weight/return/ESG means, guarded allocation shares, B/M/K/T formatting) and even `perfHistory` mixes a real trend with `sr()` noise. The tier-A backend PCAF engine (`portfolio_analytics_engine.py` / `_v2`, shared by 9 modules, 48-module blast radius) is not called; all data is frontend `sr()`. Evolution A wires the real portfolio data.

**How.** (1) Replace the 150-name random generator with `GET /portfolios/{id}/holdings` and `/analytics` over `portfolios_pg` — the descriptive aggregation logic (sector/country allocation, weighted returns, ESG means) is correct and carries over unchanged onto real positions. (2) Real returns from market data (the platform's market-data ingesters) rather than centred `sr()` draws, so `perfHistory` and attribution reflect actual performance vs a real benchmark. (3) The `_v2` engine's real portfolio-valuation logic (`adjusted_value = current_value × (1+adjustment)`, ownership-weighted, per §5's extracted lines) drives the valuation view. This is primarily a data-wiring exercise — the aggregation math is sound.

**Prerequisites.** Portfolio-analytics endpoints (exist, auth-gated); real return/market data for performance; the aggregation logic is correct — keep it. Blast radius 48 via shared engine — pin before touching. Remove the `sr()` book. **Acceptance:** the dashboard renders real `portfolios_pg` holdings; allocations and returns compute from real positions and market data; no `sr()` in holdings or returns.

### 9.2 Evolution B — Portfolio-monitoring copilot (LLM tier 2)

**What.** A copilot for a portfolio manager: "what's my YTD return and top contributors?", "show sector allocation and the ESG overlay", "how am I tracking vs benchmark?", "which country exposures are largest?" — executed against the real portfolio-analytics engine over `portfolios_pg`, with every aggregate a computed output.

**How.** Tool calls to the portfolio-analytics GET endpoints (`/holdings`, `/analytics`, `/dashboard`); system prompt from this Atlas page's §7.1 aggregation logic. Allocation, return, and ESG-overlay answers decompose the descriptive aggregates by holding; the fabrication validator matches every weight/return/ESG figure to a tool response. Because this dashboard shares the engine feeding 48 modules, the copilot is a portfolio-level entry point that can hand off to the specialist copilots (climate VaR, temperature score) for deeper analysis. Mutating actions (add/delete holdings via the POST/DELETE endpoints) gate behind confirmation + RBAC.

**Prerequisites (hard).** Evolution A — a monitoring copilot on the current random 150-name book would report fictional returns and allocations as portfolio state; the auth blocker must be resolved. **Acceptance:** every aggregate traces to an endpoint call over real holdings; allocation shares sum correctly; write actions require confirmation and RBAC.