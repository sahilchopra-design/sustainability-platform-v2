# Portfolio Temperature Score
**Module ID:** `portfolio-temperature-score` · **Route:** `/portfolio-temperature-score` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Company-level temperature score aggregation using SBTi methodology. Shows score distribution, sector analysis, and what-if target-setting scenarios.

> **Business value:** Enables investors to set and track portfolio temperature alignment targets aligned with Paris Agreement goals. Required metric for net-zero alliances and increasingly requested by clients and regulators as a forward-looking climate performance indicator.

**How an analyst works this module:**
- Portfolio Overview shows temperature gauge with 1.5/2.0/3.2°C markers
- Company Scores ranks all holdings by temperature score
- Sector Analysis decomposes score by GICS sector
- Target Gap shows each company's deviation from 1.5°C pathway
- What-If Builder models score impact of target commitments

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_HOLDINGS`, `Badge`, `Btn`, `COUNTRIES`, `Card`, `DashboardTab`, `ENG_STATUSES`, `EngagementTab`, `HoldingsTab`, `INITIAL_ENGAGEMENTS`, `METHODOLOGIES`, `PACTA_SECTORS`, `PactaTab`, `SBTI_STATUSES`, `SECTORS`, `SbtiColors`, `TABS`, `YEARS`, `YEAR_DELTAS`, `YEAR_FILTERS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `METHODOLOGIES` | 5 | `label`, `temp` |
| `PACTA_SECTORS` | 6 | `label`, `tempScore`, `radarScore`, `unit`, `port`, `path15`, `path2`, `pathNdc`, `gap`, `companies` |
| `TABS` | 5 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `YEAR_DELTAS` | `{ 'Q4 2023':0, 'Q4 2024':-0.1, 'Forward to 2030':+0.3 };` |
| `temp` | `1.2 + sr(s * 3) * 3.6;` |
| `weight` | `0.4 + sr(s * 7) * 3.2;` |
| `sbtiIdx` | `Math.floor(sr(s * 11) * 3);` |
| `engIdx` | `Math.floor(sr(s * 13) * 3);` |
| `sectorIdx` | `Math.floor(sr(s * 5) * SECTORS.length);` |
| `countryIdx` | `Math.floor(sr(s * 9) * COUNTRIES.length);` |
| `nearYear` | `2025 + Math.floor(sr(s * 17) * 6);` |
| `nzYear` | `2040 + Math.floor(sr(s * 19) * 11);` |
| `lastEng` | ``2025-${String(Math.floor(sr(s*23)*12+1)).padStart(2,'0')}-${String(Math.floor(sr(s*29)*28+1)).padStart(2,'0')}`;` |
| `_CDP_MAP` | `Object.fromEntries((CDP_COMPANY_EMISSIONS\|\|[]).map(c=>[c.name?.toLowerCase(),c]));` |
| `_CDP_TICKER_MAP` | `Object.fromEntries((CDP_COMPANY_EMISSIONS\|\|[]).map(c=>[c.ticker?.toLowerCase(),c]));` |
| `ALL_HOLDINGS` | `isIndiaMode() ? adaptForTransitionRisk().slice(0, 60).map((c, i) => ({` |
| `holding` | `ALL_HOLDINGS[i * 3];` |
| `markerPct` | `Math.min(100, Math.max(0, ((portfolioTemp - 1) / 3) * 100));` |
| `delta` | `{ pacta:0, sbti:-1, tpi:2, wa:1 };` |
| `totalWeight` | `ALL_HOLDINGS.reduce((s,h) => s+h.weight, 0);` |
| `whatIfTemp` | `+(portfolioBaseTemp - (selected.length>0` |
| `lineData` | `YEARS.map((yr, i) => ({` |
| `radarData` | `PACTA_SECTORS.map(s => ({ sector:s.label, score:s.radarScore }));` |
| `sorted` | `useMemo(() => [...engagements].sort((a,b) => { if(sortEng==='priority') return a.priority - b.priority;` |
| `today` | `new Date('2026-03-28');` |
| `diff` | `(d - today) / 86400000;` |
| `livePortfolioTemp` | `engagements.length > 0 ? engagements.reduce((s,e) => s + e.itr * e.weight / 100, 0) : 2.7;` |
| `scope3Adj` | `scope3 ? 0 : -0.3;` |

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
**Frontend seed datasets:** `COUNTRIES`, `ENG_STATUSES`, `METHODOLOGIES`, `PACTA_SECTORS`, `SBTI_STATUSES`, `SECTORS`, `STATUSES`, `TABS`, `YEARS`, `YEAR_FILTERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Temperature | `AUM-weighted avg` | SBTi | Current portfolio temperature score |
| Companies Scored | — | Coverage | Proportion with individual scores vs defaults |
| SBTi Target Coverage | — | SBTi registry | Holdings with committed or approved SBTi targets |
- **Company emissions trajectories** → Pathway comparison → **Temperature score per company**
- **SBTi target registry** → Ambition scoring → **Target-based adjustment**
- **Portfolio weights** → AUM-weighted aggregation → **Portfolio temperature**

## 5 · Intermediate Transformation Logic
**Methodology:** SBTi temperature scoring
**Headline formula:** `PortfolioTemp = Σ(weight_i × ITR_i); ITR from target ambition + trajectory`

Company scores based on: (1) Target ambition vs science-based pathway, (2) Actual emission trajectory. No target = default high temperature (3.2°C or sector default). Portfolio aggregation: exposure-weighted average.

**Standards:** ['SBTi Temperature Scoring v1.5', 'PACTA']
**Reference documents:** SBTi Temperature Scoring Methodology v1.5; SBTi Corporate Net-Zero Standard; PACTA 2020 Methodology

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
| `portfolio-suite` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `real-estate-valuation` | table:decimal, table:schemas, table:uuid |
| `sustainability-report-builder` | table:decimal, table:schemas, table:uuid |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states `PortfolioTemp = Σ(weightᵢ × ITRᵢ)` with company
> ITRs from target ambition + trajectory. **The headline portfolio temperature is not an aggregation
> of holdings at all** — it is a **hard-coded per-methodology constant** (`METHODOLOGIES[m].temp`:
> PACTA 2.7, SBTi 2.4, TPI 2.9, Weighted-Avg 2.6) plus a Scope-3 toggle and a year delta. The 60
> per-holding temperatures *are* `sr()`-seeded and *are* weight-aggregated in some sub-tabs, but the
> gauge and KPIs read the constant, not the sum. §8 specifies the real SBTi/PACTA aggregation.

### 7.1 What the module computes

Headline temperature (the gauge):
```js
portfolioTemp = METHODOLOGIES[methodology].temp        // 2.4–2.9 constant per method
              + (scope3 ? 0 : −0.3)                     // Scope-3 exclusion drops 0.3°C
              + YEAR_DELTAS[yearFilter]                 // Q4-2023 0, Q4-2024 −0.1, Fwd-2030 +0.3
markerPct = clamp( ((portfolioTemp − 1)/3)·100, 0, 100 )   // gauge fill on a 1–4°C scale
```

Sub-tab aggregations that *do* use holdings:
```js
totalWeight   = Σ h.weight
whatIfTemp    = portfolioBaseTemp − mean(sbtiDelta of selected)     // engagement what-if
livePortfolioTemp = Σ e.itr·e.weight/100  (engagement register)    // real Σ(w·ITR), fallback 2.7
```

### 7.2 Parameterisation / seed rubric

| Quantity | Value / formula | Provenance |
|---|---|---|
| `METHODOLOGIES[].temp` | PACTA 2.7 / SBTi 2.4 / TPI 2.9 / WA 2.6 | **hard-coded per-method constants** |
| Scope-3 adjustment | `−0.3 °C` when excluded | heuristic |
| `YEAR_DELTAS` | 0 / −0.1 / +0.3 | heuristic time drift |
| per-holding `temp` | `1.2 + sr(s·3)·3.6` | synthetic 1.2–4.8 °C |
| `weight` | `0.4 + sr(s·7)·3.2` | synthetic |
| `emissions[3yr]` | `180+sr·320`, `160+sr·300`, `140+sr·280` | synthetic declining series |
| holdings names | 60 real issuers (Shell, NextEra, Toyota…) | curated labels |
| reference pathways | `TEMPERATURE_PATHWAYS`, `sbti-companies.json`, `CDP_COMPANY_EMISSIONS` | real imported data (under-used) |

The page *imports* real SBTi and CDP data and `TEMPERATURE_PATHWAYS`, but the headline gauge ignores
them in favour of the method constant — a missed opportunity flagged in §8.

### 7.3 Calculation walkthrough

1. User selects a methodology → headline temp = that method's constant.
2. Scope-3 toggle and year filter add fixed deltas.
3. Gauge marker positions on a 1–4 °C scale.
4. Holdings tab shows 60 synthetic-temp names; selecting names for the SBTi what-if subtracts their
   mean `sbtiDelta` from the base.
5. Engagement tab computes a *genuine* `Σ(w·ITR)` (`livePortfolioTemp`) over the engagement register —
   the only place the guide's formula actually runs.

### 7.4 Worked example

Method = SBTi (2.4), Scope 3 excluded, year = Forward to 2030:

| Step | Computation | Result |
|---|---|---|
| base | METHODOLOGIES[sbti].temp | 2.40 |
| scope3Adj | excluded → −0.3 | −0.30 |
| yearAdj | Forward to 2030 → +0.3 | +0.30 |
| portfolioTemp | 2.40 − 0.30 + 0.30 | **2.40 °C** |
| markerPct | ((2.40−1)/3)·100 | 46.7 % |

Switching to PACTA jumps the headline to 2.7 °C with **no change to holdings** — proof the number is a
method constant, not an aggregation.

### 7.5 Data provenance & limitations

- **Headline is a constant + fixed deltas**, not a portfolio aggregation. Per-holding temps are
  synthetic `sr()` draws; only the engagement register does real `Σ(w·ITR)`.
- Imported SBTi/CDP/pathway data is present but not wired into the headline score.
- Scope-3 −0.3 °C and year deltas are illustrative heuristics, not derived from re-scoring.

**Framework alignment:** SBTi Temperature Scoring v1.5 — the guide's method; SBTi actually derives each
company's ITR from target ambition vs a science-based pathway (over/under-shoot of an allocated carbon
budget), then exposure-weights — none of that math runs for the headline · PACTA — technology-pathway
alignment, represented here by a per-sector `radarScore` table, not computed · the 3.2 °C no-target
default (SBTi convention) is referenced in the guide.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute the portfolio Implied Temperature Rise bottom-up as `Σ wᵢ·ITRᵢ`, with company ITRs from SBTi
temperature scoring, so the headline gauge reflects actual holdings — required for net-zero-alliance
(NZAM/NZAOA) reporting.

### 8.2 Conceptual approach
**SBTi Temperature Scoring** at the company level, aggregated by portfolio weight, cross-checked
against **PACTA** technology alignment — the two standards the module already names. Company ITR is
the temperature implied by its target's carbon-budget over/under-shoot; unscored names take the SBTi
default.

### 8.3 Mathematical specification
```
Overshoot_i = (ProjectedCumEmissions_i − Budget_i,1.5) / Budget_i,1.5
ITR_i       = clip( a_scope + b_scope · Overshoot_i , 1.3 , 4.0 )     # SBTi regression
ITR_i       = 3.2 °C  if no validated target
ITR_pf      = Σ_i w_i · ITR_i
Scope3_adj  = recompute ITR_i including/excluding Scope-3 target coverage (not a flat −0.3)
```

| Parameter | Calibration source |
|---|---|
| `a_scope, b_scope` | SBTi Temperature Scoring regression coefficients (public v1.5) |
| `Budget_i,1.5` | IPCC AR6 / IEA NZE sector budget allocated by revenue/production share |
| default 3.2 °C | SBTi no-target default |
| target data | SBTi registry (`sbti-companies.json`, already imported), CDP emissions |
| `w_i` | portfolio weights (already present) |

### 8.4 Data requirements
`near_term_target`, `net_zero_year`, `base_year_emissions`, `scope_coverage`, `sector`, `revenue`,
`weight`. Sources already in-platform: `sbti-companies.json`, `CDP_COMPANY_EMISSIONS`,
`TEMPERATURE_PATHWAYS`. Only the scoring regression + aggregation are missing.

### 8.5 Validation & benchmarking plan
Reconcile company ITRs against published SBTi scores; benchmark `ITR_pf` against PACTA output;
verify the Scope-3 exclusion effect emerges from re-scoring (not a hard −0.3); check coverage % and
default-application rate.

### 8.6 Limitations & model risk
Target data sparse and self-reported; the regression is scope/sector-sensitive; weighting scheme moves
the headline. Conservative fallback: SBTi default (3.2 °C) for unscored names and disclose coverage %.

## 9 · Future Evolution

### 9.1 Evolution A — Aggregate real holding ITRs instead of a per-method constant (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide states `PortfolioTemp = Σ(weightᵢ × ITRᵢ)` from target-ambition + trajectory, but the headline gauge temperature is *not an aggregation at all* — it's a hard-coded per-methodology constant (`METHODOLOGIES[m].temp`: PACTA 2.7, SBTi 2.4, TPI 2.9, WA 2.6) plus a Scope-3 toggle (−0.3°C) and a year delta. The 60 per-holding temperatures *are* `sr()`-seeded and *are* weight-aggregated in some sub-tabs (and the engagement register's `livePortfolioTemp = Σ e.itr·e.weight/100` is a real weighted sum), but the gauge and KPIs read the constant. Evolution A makes the headline a real aggregation over real holdings.

**How.** (1) Compute each holding's ITR from the SBTi Temperature Scoring v1.5 methodology (named in §5): target ambition vs the science-based sector pathway plus actual emission trajectory, with the documented "no target → 3.2°C default" fallback — over real `portfolios_pg` holdings via the shared engine, not `sr()` seeds. (2) The headline gauge then reads `Σ weightᵢ·ITRᵢ` (the sub-tabs already do this correctly — promote it to the gauge), so the methodology choice affects *how ITRs are computed*, not a lookup constant. (3) The what-if target-setting builder (§1) recomputes ITRs under committed targets. Shared with the `paris-alignment` and `portfolio-manager` ITR siblings — build one SBTi ITR engine.

**Prerequisites.** SBTi ITR inputs (sector pathways, company targets/trajectories — shared resolver); the portfolio-analytics endpoints (auth-gated); blast radius 48 via shared engine — pin first. Remove `sr()` holding temps and the constant gauge. **Acceptance:** the gauge reads `Σ wᵢ·ITRᵢ` over real holdings; changing a holding or a target moves it; the methodology selection changes ITR computation, not a lookup.

### 9.2 Evolution B — Temperature-alignment copilot (LLM tier 2)

**What.** A copilot for the workflow §1 describes: "what's my portfolio temperature and is it 1.5°C-aligned?", "which holdings are hottest and why?", "how much does excluding Scope 3 change it?", "model the effect if these 5 companies commit to SBTi targets" — executed against the (Evolution-A) SBTi ITR engine, decomposing the weighted portfolio temperature into per-holding and per-sector contributions.

**How.** Tool calls to endpoints wrapping the ITR computation and the what-if builder; system prompt from this Atlas page's §5 and the SBTi Temperature Scoring v1.5 / PACTA references named in §5. The what-if target-setting is a recomputation tool call, not an estimate; sector decomposition and target-gap answers come from the engine. Fabrication validator matches every temperature figure to a response; the copilot must convey ITR's methodology-dependence (SBTi vs PACTA vs TPI give different numbers — the module has all four) and the no-target default convention. Provenance cites which holdings had real targets vs the 3.2°C default.

**Prerequisites (hard).** Evolution A — the current gauge is a hard-coded constant, and a copilot reporting it as "your portfolio's temperature" would present a lookup value as a computed Paris-alignment metric. **Acceptance:** every temperature figure traces to the SBTi ITR engine over real holdings; what-if scenarios recompute; the copilot flags methodology-dependence and default-ITR holdings.