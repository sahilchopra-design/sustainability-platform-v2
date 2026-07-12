# Portfolio Climate VaR
**Module ID:** `portfolio-climate-var` · **Route:** `/portfolio-climate-var` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies climate value-at-risk for investment portfolios, decomposing loss potential into physical and transition risk drivers.

> **Business value:** Delivers rigorous, decomposed climate VaR analytics supporting TCFD disclosures, stress testing, and climate-integrated risk budgeting.

**How an analyst works this module:**
- Select portfolio and scenario (NGFS/IPR).
- Set time horizon and confidence level.
- Run physical and transition VaR decomposition.
- Review asset-level contribution to total Climate VaR.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DATA`, `LOSS_DIST`, `NAMES`, `N_SCEN`, `RISK_MULT`, `SCENARIOS`, `SECTOR_TRANS_MULT`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `normalDraw` | `(seedA,seedB)=>{const u1=Math.min(Math.max(sr(seedA),1e-9),1-1e-9);const u2=sr(seedB);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);};` |
| `meanOf` | `(arr)=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0;` |
| `percentileOf` | `(sortedAsc,p)=>{if(!sortedAsc.length)return 0;const idx=p*(sortedAsc.length-1);const lo=Math.floor(idx),hi=Math.ceil(idx);if(lo===hi)return sortedAsc[lo];const w=idx-lo;return sortedAsc[lo]*(1-w)+sortedAsc[hi]*w;};` |
| `varCvarOf` | `(dist)=>{const sorted=[...dist].sort((a,b)=>a-b);const var95=percentileOf(sorted,0.95);const var99=percentileOf(sorted,0.99);const tail95=sorted.filter(v=>v>=var95);const tail99=sorted.filter(v=>v>=var99);return{var95,va` |
| `LOSS_DIST` | `new Map(); // holding id -> N_SCEN synthetic loss-scenario array (%)` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.cre` |
| `baseLossPct` | `(1.5+s(31)*3.5)*(RISK_MULT[risk]\|\|1)*(SECTOR_TRANS_MULT[sector]\|\|1);` |
| `sigma` | `0.35+s(37)*0.35;` |
| `lossDist` | `buildLossDistribution(1000+i*997,baseLossPct,sigma,N_SCEN);` |
| `filtered` | `useMemo(()=>{let d=[...DATA];if(search){const s=search.toLowerCase();d=d.filter(r=>r.name.toLowerCase().includes(s)\|\|r.sector.toLowerCase().includes(s));}if(fSector!=='All')d=d.filter(r=>r.sector===fSector);if(fRisk!=='All')d=d.filter(r=>r.risk===fRisk);d.sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];if(av==null)return 1;if(bv==null)retu` |
| `portfolioRisk` | `useMemo(()=>computePortfolioVaR(filtered),[filtered]); const kpis=useMemo(()=>{const d=filtered;if(!d.length)return{count:0,totalNotional:0,avgTrans:0,avgPhys:0};return{count:d.length,totalNotional:d.reduce((a,r)=>a+r.notional,0),avgTrans:d.reduce((a,r)=>a+r.transRisk,0)/d.length,avgPhys:d.reduce((a,r)=>a+r.physRisk,0)/d.length};},[filter` |
| `scenarioAvg` | `useMemo(()=>SCENARIOS.map((n,i)=>({name:n.length>16?n.slice(0,16)+'..':n,loss:filtered.reduce((a,r)=>a+[r.scen1,r.scen2,r.scen3,r.scen4,r.scen5,r.scen6][i],0)/(filtered.length\|\|1)})),[filtered]);` |
| `sectorVaR` | `useMemo(()=>SECTORS.map(s=>{const items=filtered.filter(r=>r.sector===s);if(!items.length)return null;return{name:s.length>10?s.slice(0,10)+'..':s,var99:computePortfolioVaR(items).var99};}).filter(Boolean).sort((a,b)=>b.` |
| `riskDist` | `useMemo(()=>RISK_LEVELS.map(l=>({name:l,value:filtered.filter(r=>r.risk===l).length})),[filtered]);` |
| `horizonAvg` | `useMemo(()=>HORIZONS.map((h,i)=>({horizon:h,loss:filtered.reduce((a,r)=>a+[r.h1y,r.h5y,r.h10y,r.h30y][i],0)/(filtered.length\|\|1)})),[filtered]);` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;return[{axis:'VaR 95',value:avg('climateVaR95')*4},{axis:'VaR 99',value:avg('climateVaR99')*3},{axis:'CVaR 99',value` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,var:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length\|\|1)})),[filtered]);` |

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
**Frontend seed datasets:** `NAMES`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total Climate VaR (%) | — | Scenario Engine | Expected portfolio loss under 1.5°C disorderly transition at 2030 horizon. |
| Physical Risk VaR (%) | — | Hazard Mapping | Loss attributable to physical climate damage (flood, heat, SLR) under RCP 4.5. |
| Transition Risk VaR (%) | — | Carbon Pricing Model | Loss from stranded assets and carbon cost pass-through under net-zero policy shock. |
- **Holdings data + NGFS/IPR scenarios + hazard scores** → Asset-level impact modelling; portfolio aggregation; VaR decomposition → **Scenario-specific VaR outputs with physical/transition split and attribution**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate VaR
**Headline formula:** `CVaR = Σ(wᵢ × Vᵢ × (δᵢ_physical + δᵢ_transition))`

Portfolio-weighted sum of asset-level valuation impacts from physical damage costs and transition policy shocks.

**Standards:** ['TCFD Portfolio Alignment', 'NGFS Scenarios', 'IPR FPS 2023']
**Reference documents:** NGFS Climate Scenarios: Technical Documentation (2023); Inevitable Policy Response (IPR) Forecast Policy Scenario 2023; TCFD Technical Supplement: Use of Scenario Analysis

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
| `portfolio-dashboard` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-climate-pulse` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-manager` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-optimizer` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-suite` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-temperature-score` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `real-estate-valuation` | table:decimal, table:schemas, table:uuid |
| `sustainability-report-builder` | table:decimal, table:schemas, table:uuid |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — fabricated risk metric.** The guide advertises
> `CVaR = Σ(wᵢ · Vᵢ · (δᵢ_physical + δᵢ_transition))` under NGFS/IPR scenarios. **No VaR is ever
> computed.** Every "Climate VaR" number on the page is a direct seeded-random draw:
> `climateVaR95 = 1 + s(31)·18`, `climateVaR99 = 2 + s(37)·28`, `cvar99 = 3 + s(43)·32`, and the six
> scenario losses `scen1..6 = s(6x)·[8..25]`. There is no loss distribution, no percentile estimation,
> no weight×value×delta aggregation, and no scenario engine. The displayed KPIs are then **simple
> means** of these random fields. This is exactly the "random-as-data" pattern the platform audit
> flagged; §8 specifies the real climate-VaR model this module must run.

### 7.1 What the module "computes"

Per-position fields are pure random draws; the only genuine computation is averaging and sorting:

```js
kpis.avgVaR95 = Σ r.climateVaR95 / n          // mean of random draws
kpis.avgVaR99 = Σ r.climateVaR99 / n
scenarioAvg[i]= Σ r.scen(i+1) / n             // mean scenario loss (random)
sectorVaR[s]  = Σ_{r∈s} r.climateVaR99 / |s|  // sector mean
horizonAvg[i] = Σ r.[h1y,h5y,h10y,h30y][i] / n
radarData     = avg(metric) × display-scalar  // e.g. avg(VaR95)×4 to fill 0–100 radar
```

The radar multipliers (`×4`, `×3`, `×2.5`, `×5`, `×6`, `×8`) are cosmetic axis-fills with no risk
meaning.

### 7.2 Parameterisation / seed rubric

| Field | Formula | Range | Provenance |
|---|---|---|---|
| `climateVaR95` | `1 + s(31)·18` | 1–19 % | **fabricated** (`sr` draw, labelled VaR) |
| `climateVaR99` | `2 + s(37)·28` | 2–30 % | **fabricated** |
| `cvar95 / cvar99` | `2 + s(41)·22` / `3 + s(43)·32` | — | **fabricated** |
| `transRisk` | `s(47)·20` | 0–20 % | synthetic demo value |
| `physRisk` | `s(53)·15` | 0–15 % | synthetic demo value |
| `litigationRisk` | `s(59)·10` | 0–10 % | synthetic demo value |
| `scen1..6` | `s(61..83)·[12,18,25,8,22,15]` | — | **fabricated** scenario losses |
| `h1y..h30y` | `s(89..103)·[10,18,25,35]` | — | **fabricated**, but monotone-ish by scalar |
| `notional` | `10 + s(29)·490` | $10–500M | synthetic demo value |
| `tempAlign` | `1.2 + s(127)·2.3` | 1.2–3.5 °C | synthetic demo value |

Note the scenario losses are drawn from **independent** seeds, so a position's Current-Policies loss
(`scen3`) can be *lower* than its Net-Zero loss (`scen1`) — violating the NGFS ordering that
disorderly/hot-house scenarios are worse. Real scenario analysis would preserve that ordering.

### 7.3 Calculation walkthrough

1. `genData(50)` builds 50 positions, each field an independent `sr()` draw.
2. Filters (search / sector / risk) → `filtered`.
3. KPIs and all charts are means/sorts over `filtered`. The horizon "profile" trends upward only
   because the display scalars 10<18<25<35 grow, not because of any term-structure model.
4. `DATA` is module-level, so the same random portfolio renders every session.

### 7.4 Worked example

Two positions pass a filter: A (`climateVaR99 = 12.0`, `scen3 = 20.0`), B (`climateVaR99 = 6.0`,
`scen3 = 10.0`).

| Output | Computation | Result |
|---|---|---|
| kpis.avgVaR99 | (12.0 + 6.0)/2 | 9.0 % |
| scenarioAvg[Current] | (20.0 + 10.0)/2 | 15.0 % |
| radar VaR99 axis | 9.0 × 3 | 27 (cosmetic) |

The "9.0 % Avg VaR99" is the average of two random numbers — it carries no statistical confidence
interpretation despite the "99 %" label.

### 7.5 Data provenance & limitations

- **All risk metrics fabricated** by `sr(seed)=frac(sin(seed+1)×10⁴)`. "VaR", "CVaR", "scenario
  loss" and "horizon loss" are labels on random draws, not model outputs.
- No NGFS/IPR scenario library, no asset-level repricing, no distribution, no percentile — the entire
  methodology the guide describes is absent.
- Position names are curated (CLO Tranche AA, Sukuk Pool…) but decorative.

**Framework alignment (aspirational only):** NGFS Climate Scenarios and IPR Forecast Policy Scenario
are named as the scenario set (the six columns echo NZ2050 / Delayed / Current / Below-2°C / Divergent
/ NDCs) but no NGFS variable path is used · TCFD scenario-analysis supplement — the physical/transition
decomposition is labelled but not computed. The real methodology lives (partially) in the platform's
`climate-credit-integration` module and `climate_stress_test_engine`, not here.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute portfolio Climate Value-at-Risk decomposed into physical and transition drivers, per NGFS/IPR
scenario and horizon, with position-level attribution — for TCFD disclosure, stress testing, and
climate risk budgeting across multi-asset portfolios.

### 8.2 Conceptual approach
A **scenario-conditioned valuation-shock model** mirroring MSCI Climate VaR (asset-level DCF
repricing under transition-policy and physical-damage pathways) and BlackRock Aladdin Climate; the
transition channel repricing carbon-cost pass-through per NGFS, the physical channel applying
damage-function-based cash-flow haircuts per IPCC/Swiss Re, aggregated to a portfolio loss
distribution for percentile extraction.

### 8.3 Mathematical specification
```
δ_trans,i,s = ΔPV_i from CarbonCost_i,s,t = Σ_t Emissions_i,t·(CarbonPrice_s,t)·(1−passthrough_i)/(1+r)^t / V_i
δ_phys,i,s  = Σ_h AAL_i,h(scenario s) / V_i                 # damage-function driven
L_i,s       = w_i · V_i · (δ_trans,i,s + δ_phys,i,s)
L_pf,s      = Σ_i L_i,s ;  with cross-position correlation Σ:  L_pf ~ (μ_s, σ_s)
ClimateVaR_α,s = −quantile_α( L_pf,s )        # α = 95 %, 99 %
CVaR_α,s    = −E[ L_pf,s | L_pf,s ≤ VaR_α ]
CompVaR_i   = w_i·∂VaR/∂w_i                    # Euler allocation
```

| Parameter | Calibration source |
|---|---|
| `CarbonPrice_s,t` | NGFS Phase IV / IPR FPS carbon-price paths by scenario |
| `Emissions_i,t` | PCAF financed emissions (platform engine already produces) |
| `passthrough_i` | sector cost pass-through elasticity; ECB/EBA climate stress params |
| `AAL_i,h` | hazard damage functions; IPCC AR6, Swiss Re sigma, EM-DAT |
| `Σ` correlation | factor model on sector/region; RiskMetrics-style |
| `r` | discount rate / WACC by issuer |

### 8.4 Data requirements
`financed_emissions`, `enterprise_value`, `weight`, `sector`, `region`, `physical_hazard_exposure`,
scenario carbon-price and damage tables. Sources: platform PCAF engine (emissions, EVIC), hazard
engine, NGFS/IPR scenario data (free), Swiss Re/EM-DAT. Weights and notionals already present.

### 8.5 Validation & benchmarking plan
Reconcile ClimateVaR against MSCI Climate VaR and Aladdin outputs for overlapping issuers; backtest
transition losses against realised carbon-cost impacts in ETS-covered sectors; verify scenario
ordering (Current Policies physical loss ≥ NZ2050) as a monotonicity test; component-VaR sums to
total (Euler additivity check).

### 8.6 Limitations & model risk
Damage functions and pass-through elasticities are deeply uncertain; correlation Σ is regime-dependent;
long-horizon (30Y) discounting dominates results. Conservative fallback: report VaR as a scenario
band and disclose the dominant driver (physical vs transition) per position rather than a single
headline number.

## 9 · Future Evolution

### 9.1 Evolution A — Replace fabricated VaR with a real climate-VaR model (analytics ladder: rung 1 → 4)

**What.** §7's flag is the platform's worst-case pattern, named explicitly: "fabricated risk metric." The guide advertises `CVaR = Σ(wᵢ·Vᵢ·(δᵢ_physical + δᵢ_transition))` under NGFS/IPR scenarios, but *no VaR is ever computed* — every "Climate VaR" is a direct seeded draw (`climateVaR95 = 1 + s(31)·18`, `climateVaR99 = 2 + s(37)·28`, scenario losses `scen1..6 = s(6x)·[8..25]`), and the KPIs are means of these randoms; the radar `×4/×3/×5` multipliers are cosmetic. There is no loss distribution, percentile estimation, or weight×value×delta aggregation. This is the exact random-as-data pattern the platform audit purged elsewhere. §8 specifies the real model. Evolution A must build it.

**How.** (1) Implement the documented `CVaR = Σ(wᵢ·Vᵢ·(δᵢ_physical + δᵢ_transition))`: per-asset valuation impact from physical damage (the physical-risk modules' damage functions) and transition policy shocks (NGFS/IPR sector shocks — the `ngfs-scenarios` workbench provides real δ_transition by sector), weighted by real `portfolios_pg` positions. (2) For a proper VaR, run the loss distribution via the shared `monte_carlo_engine` (correlated shocks) and read percentiles — connecting to the real portfolio-analytics engine and the 11 available endpoints rather than the self-contained frontend. (3) Rung-4: scenario-conditional VaR under NGFS×IPR, the genuinely predictive step. Every number must trace to a computation, per the platform's guardrail (`check_no_fabricated_random.py`).

**Prerequisites.** This is a from-scratch VaR build — nothing salvageable today; the physical-damage and transition-shock inputs come from sibling modules (`physical-risk-portfolio`, `ngfs-scenarios`); pin in `bench_quant`. Blast radius 48 via the shared engine. **Acceptance:** Climate VaR is computed from weight×value×delta and a real loss distribution, not `sr()`; percentiles come from the distribution; the fabrication guardrail passes; scenario VaR responds to NGFS/IPR selection.

### 9.2 Evolution B — Climate-VaR analyst copilot (LLM tier 2, hard-gated)

**What.** A copilot for the TCFD/stress-testing users §1 targets: "what's my 99% Climate VaR under NGFS Disorderly?", "decompose it into physical vs transition", "which assets contribute most to the tail?", "compare 1.5°C and hot-house scenarios" — executed against the (Evolution-A) real VaR engine, decomposing total VaR into physical/transition drivers and per-asset contributions.

**How.** Tool calls to the VaR and portfolio-analytics endpoints; system prompt from this Atlas page's §5 formula and the NGFS/IPR/TCFD references named in §5. Scenario comparisons and asset-contribution drill-downs are tool calls returning real decompositions; VaR figures carry the scenario, horizon, confidence level, and (Monte Carlo) seed in a provenance expander. The no-fabrication validator is doubly important here given the module's history — every VaR/percentile must trace to a tool response.

**Prerequisites (hard).** Evolution A — this is the one module where an LLM layer is categorically forbidden until the fix: narrating seeded numbers as "99% Climate VaR" for a TCFD disclosure would launder pure noise into a regulatory risk metric, exactly the harm the platform's fabrication guardrail exists to prevent. **Acceptance:** every VaR figure traces to a real computation with scenario/horizon/confidence provenance; the copilot cannot run against the pre-fix seeded data; asking for VaR the model doesn't produce yields a refusal.