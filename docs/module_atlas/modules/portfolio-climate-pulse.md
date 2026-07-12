# Portfolio Climate Pulse
**Module ID:** `portfolio-climate-pulse` · **Route:** `/portfolio-climate-pulse` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time climate risk monitoring dashboard aggregating physical, transition, and carbon exposure signals for live portfolio surveillance.

> **Business value:** Enables continuous climate risk surveillance with real-time alerting, supporting proactive portfolio risk management and regulatory readiness.

**How an analyst works this module:**
- Connect live portfolio data feed or upload holdings.
- Monitor real-time Pulse Score and component risk signals.
- Set alert thresholds for score deterioration or news triggers.
- Drill into individual holdings for root-cause analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANY_NAMES`, `COUNTRIES`, `ENGAGEMENT_STATUSES`, `ESG_RATINGS`, `HOLDINGS`, `PATHWAY_YEARS`, `RAW_WEIGHTS`, `SECTORS`, `TOTAL_W`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RAW_WEIGHTS` | `Array.from({ length: 150 }, (_, i) => sr(i * 7 + 1) + 0.1);` |
| `TOTAL_W` | `RAW_WEIGHTS.reduce((s, w) => s + w, 0);` |
| `sector` | `SECTORS[Math.floor(sr(i * 11) * SECTORS.length)];` |
| `carbonIntensity` | `10 + sr(i * 13) * 990; // tCO2e/$M revenue` |
| `physicalRiskScore` | `parseFloat((sr(i * 17) * 100).toFixed(1));` |
| `transitionRiskScore` | `parseFloat((sr(i * 19) * 100).toFixed(1));` |
| `itr` | `parseFloat((1.3 + sr(i * 23) * 3.2).toFixed(2));` |
| `greenRevenuePct` | `parseFloat((sr(i * 29) * 60).toFixed(1));` |
| `weight` | `parseFloat((RAW_WEIGHTS[i] / TOTAL_W * 100).toFixed(3));` |
| `marketCapBn` | `parseFloat((0.5 + sr(i * 31) * 499).toFixed(1));` |
| `scope1` | `parseFloat((carbonIntensity * 0.3 * marketCapBn * 0.01).toFixed(0));` |
| `scope2` | `parseFloat((carbonIntensity * 0.2 * marketCapBn * 0.01).toFixed(0));` |
| `scope3Up` | `parseFloat((carbonIntensity * 0.25 * marketCapBn * 0.01).toFixed(0));` |
| `scope3Dn` | `parseFloat((carbonIntensity * 0.25 * marketCapBn * 0.01).toFixed(0));` |
| `PATHWAY_YEARS` | `Array.from({ length: 26 }, (_, i) => 2025 + i);` |
| `totalW` | `filteredHoldings.reduce((s, h) => s + h.weight, 0);` |
| `wITR` | `totalW > 0 ? filteredHoldings.reduce((s, h) => s + h.itr * h.weight, 0) / totalW : 0;` |
| `waci` | `totalW > 0 ? filteredHoldings.reduce((s, h) => s + h.carbonIntensity * h.weight, 0) / totalW : 0;` |
| `physVaR` | `totalW > 0 ? filteredHoldings.reduce((s, h) => s + h.physicalRiskScore * h.weight, 0) / totalW : 0;` |
| `transVaR` | `totalW > 0 ? filteredHoldings.reduce((s, h) => s + h.transitionRiskScore * h.weight, 0) / totalW : 0;` |
| `avgGreenRev` | `totalW > 0 ? filteredHoldings.reduce((s, h) => s + h.greenRevenuePct * h.weight, 0) / totalW : 0;` |
| `scopeAttribution` | `useMemo(() => { return sectorBreakdown.map(s => { const holdings = HOLDINGS.filter(h => h.sector === s.sector);` |
| `parisTarget` | `baseCI * (1 - reduction * 0.95);` |
| `actual` | `baseCI * (1 - reduction * 0.45);` |
| `budget` | `baseCI * (1 - reduction * 0.85);` |
| `radarData` | `useMemo(() => [ { metric: 'Physical Risk', value: parseFloat(portfolioKPIs.physVaR) }, { metric: 'Transition Risk', value: parseFloat(portfolioKPIs.transVaR) }, { metric: 'Carbon Intensity', value: Math.min(100, parseFloat(portfolioKPIs.waci) / 10) }, { metric: 'Green Revenue', value: parseFloat(portfolioKPIs.avgGreenRev) * (100/60) }, { ` |
| `avgGreen` | `holdings.length>0 ? holdings.reduce((a,h)=>a+h.greenRevenuePct,0)/holdings.length : 0;` |
| `impact` | `totalW > 0 ? (sectorW/totalW)*0.5 : 0;` |
| `totalWeight` | `countryHoldings.reduce((s,h)=>s+h.weight,0);` |
| `avgITR` | `countryHoldings.length>0 ? countryHoldings.reduce((s,h)=>s+h.itr,0)/countryHoldings.length : 0;` |
| `range` | `label.match(/[\d.]+/g);` |
| `requiredReduction` | `h.carbonIntensity * h.reductionTarget2030 / 100;` |

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
**Frontend seed datasets:** `COUNTRIES`, `ENGAGEMENT_STATUSES`, `ESG_RATINGS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Temp Score (°C) | — | SBTi/TCFD Methodology | Weighted average implied temperature rise of portfolio holdings. |
| Physical Risk Exposure (%) | — | Hazard Mapping Engine | Share of portfolio AUM exposed to high or extreme physical hazard. |
| Carbon Intensity (tCO₂e/£M) | — | PCAF Standard | WACI of portfolio measured against revenue denominator. |
- **Live portfolio feed + carbon data + hazard scores** → Real-time aggregation; Pulse Score computation; alert evaluation → **Live dashboard with component scores and configurable alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Pulse Score
**Headline formula:** `P = 0.4×PhysRisk + 0.4×TransRisk + 0.2×CarbonIntensity (normalised 0–100)`

Composite real-time climate risk score weighting physical hazard, transition risk, and portfolio carbon intensity.

**Standards:** ['TCFD Recommendations', 'NGFS Scenarios']
**Reference documents:** TCFD Final Recommendations (2017); NGFS Climate Scenarios for Central Banks and Supervisors

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
| `portfolio-manager` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-optimizer` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-suite` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-temperature-score` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `real-estate-valuation` | table:decimal, table:schemas, table:uuid |
| `sustainability-report-builder` | table:decimal, table:schemas, table:uuid |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide defines a single *Climate Pulse Score*
> `P = 0.4·PhysRisk + 0.4·TransRisk + 0.2·CarbonIntensity`. **No such composite score is computed
> anywhere in the page.** The dashboard instead reports five *weight-averaged* portfolio metrics
> (wITR, WACI, physVaR, transVaR, avgGreenRev) over 150 `sr()`-seeded holdings. The tier-A backend
> (`portfolio_analytics_engine.py`, a real PCAF/WACI engine over Postgres assets) is **not invoked by
> this page** — the frontend is self-contained synthetic data. §8 specifies the composite the guide
> promises.

### 7.1 What the module computes

For 150 synthetic holdings, portfolio KPIs are exposure-weighted means (weight `h.weight`, total
`totalW`):

```js
wITR    = Σ h.itr·h.weight / totalW                     // implied temperature rise (°C)
waci    = Σ h.carbonIntensity·h.weight / totalW         // WACI (tCO2e/$M)
physVaR = Σ h.physicalRiskScore·h.weight / totalW       // mean physical score (0–100)
transVaR= Σ h.transitionRiskScore·h.weight / totalW     // mean transition score (0–100)
avgGreenRev = Σ h.greenRevenuePct·h.weight / totalW     // green revenue %
```

All are guarded `totalW > 0 ? … : 0`. Scope emissions per holding are back-derived from carbon
intensity and market cap:
```js
scope1 = carbonIntensity · 0.30 · marketCapBn · 0.01
scope2 = carbonIntensity · 0.20 · marketCapBn · 0.01
scope3Up = scope3Dn = carbonIntensity · 0.25 · marketCapBn · 0.01     // 30/20/25/25 split
```

A decarbonisation pathway compares Paris/budget/actual glidepaths:
```js
parisTarget = baseCI·(1 − reduction·0.95)   // near-full decarbonisation
budget      = baseCI·(1 − reduction·0.85)
actual      = baseCI·(1 − reduction·0.45)   // portfolio lags target
```

### 7.2 Parameterisation / seed rubric

| Field | Formula | Range | Provenance |
|---|---|---|---|
| `carbonIntensity` | `10 + sr(i·13)·990` | 10–1000 tCO2e/$M | synthetic demo value |
| `physicalRiskScore` | `sr(i·17)·100` | 0–100 | synthetic demo value |
| `transitionRiskScore` | `sr(i·19)·100` | 0–100 | synthetic demo value |
| `itr` | `1.3 + sr(i·23)·3.2` | 1.3–4.5 °C | synthetic; plausible ITR band |
| `greenRevenuePct` | `sr(i·29)·60` | 0–60 % | synthetic demo value |
| `weight` | `RAW_WEIGHTS[i]/TOTAL_W·100`, `RAW_WEIGHTS = sr(i·7+1)+0.1` | Σ=100 % | synthetic; normalised |
| `marketCapBn` | `0.5 + sr(i·31)·499` | $0.5–500B | synthetic demo value |
| scope 1/2/3 | derived 30/20/25/25 of `CI·mktCap·0.01` | — | heuristic split, not GHG-Protocol |

The 30/20/25/25 scope split is a fixed heuristic applied to *every* holding regardless of sector — a
utility and a bank get the same scope mix, which is unrealistic (banks are ~99 % Scope 3).

### 7.3 Calculation walkthrough

1. `RAW_WEIGHTS` seeded then normalised so `Σ weight = 100 %`.
2. Each holding's six risk primitives drawn from independent `sr()` streams.
3. Filters (search, sector, ITR range, weight floor) produce `filteredHoldings`.
4. `totalW = Σ filtered weight`; the five KPIs are weight-averages over the filtered set.
5. `radarData` normalises the KPIs onto a 0–100 radar (WACI ÷10, greenRev ×100/60).
6. `scopeAttribution` re-aggregates scope emissions by sector.

### 7.4 Worked example

Two holdings pass the filter: A (`weight 2 %`, `itr 3.0`, `CI 600`), B (`weight 1 %`, `itr 1.8`,
`CI 200`). `totalW = 3`.

| Output | Computation | Result |
|---|---|---|
| wITR | (3.0·2 + 1.8·1)/3 = 7.8/3 | 2.60 °C |
| waci | (600·2 + 200·1)/3 = 1400/3 | 466.7 tCO2e/$M |

Guide's "Pulse Score" (were it implemented) on A alone with physScore 50, transScore 40, CI 600:
`0.4·50 + 0.4·40 + 0.2·(600/10) = 20 + 16 + 12 = 48` — but the code never produces this number.

### 7.5 Data provenance & limitations

- **All 150 holdings synthetic** via `sr(seed)=frac(sin(seed+1)×10⁴)`; ISINs are `US0000000ⁿX`
  placeholders. The real PCAF backend engine is dormant relative to this page.
- No composite Pulse Score, no live feed, no alert-threshold evaluation — the guide's "real-time
  surveillance / alerting" is not built.
- Scope split is a flat 30/20/25/25 heuristic; ITR is a raw draw, not derived from targets/trajectory.

**Framework alignment:** PCAF *Global GHG Accounting Standard* — WACI (`Σ wᵢ·CIᵢ`) matches the PCAF
weighted-average carbon-intensity definition · SBTi/TCFD — ITR is the forward-looking temperature
metric (SBTi derives it from target ambition vs a science-based pathway; here it is a synthetic draw)
· NGFS — named for physical/transition framing, not used computationally.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** *(This composite-Pulse spec is shared in
spirit across the portfolio-analytics family; here it is scoped to the real-time surveillance score.)*

### 8.1 Purpose & scope
Compute a single 0–100 Climate Pulse Score per portfolio and per holding, updated on data refresh,
with configurable deterioration alerts — for climate risk officers running continuous surveillance.

### 8.2 Conceptual approach
A **normalised weighted-composite index** (mirroring MSCI Climate VaR component roll-ups and
BlackRock Aladdin Climate factor scores) over three standardised pillars, plus an **EWMA change
detector** for alerting (mirroring RiskMetrics volatility-of-signal triggers).

### 8.3 Mathematical specification
```
z_k(h)    = (x_k(h) − μ_k) / σ_k                       # standardise each pillar k over universe
Pillar_P  = Φ(z_phys)·100 ; Pillar_T = Φ(z_trans)·100 ; Pillar_C = Φ(z_CI)·100
Pulse(h)  = w_P·Pillar_P + w_T·Pillar_T + w_C·Pillar_C           # w = 0.4/0.4/0.2 (guide)
Pulse_pf  = Σ_h weight_h·Pulse(h)
EWMA_t    = λ·Pulse_pf,t + (1−λ)·EWMA_{t−1}
Alert     = 1{ Pulse_pf,t − EWMA_t > κ·σ_pulse }
```

| Parameter | Calibration source |
|---|---|
| `μ_k, σ_k` | cross-sectional moments of physical/transition scores; MSCI/S&P Trucost distributions |
| `w_P,w_T,w_C` | 0.4/0.4/0.2 per guide; validate via PCA loadings |
| `λ` | EWMA decay ≈0.94 (RiskMetrics daily convention) |
| `κ` | alert sensitivity ≈2 (2σ); ops-tuned |

### 8.4 Data requirements
`physical_risk_score`, `transition_risk_score`, `carbon_intensity`, `weight`, timestamped refreshes.
Sources: platform PCAF engine (WACI already produced), hazard-mapping engine, news/controversy feed
for intraday deltas. The five weight-averages already exist; only standardisation + EWMA are new.

### 8.5 Validation & benchmarking plan
Backtest Pulse against realised drawdowns of climate-tilted vs benchmark portfolios; reconcile the
carbon pillar against PCAF WACI; sensitivity-test weights and κ on historical controversy events.

### 8.6 Limitations & model risk
Standardisation moments drift with universe composition; alert flapping if κ too low. Conservative
fallback: report raw pillar percentiles alongside the composite and require 2 consecutive breaches
before firing an alert.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the tier-A engine and compute the Pulse Score (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide defines a Climate Pulse Score (`P = 0.4·PhysRisk + 0.4·TransRisk + 0.2·CarbonIntensity`), but no composite is computed — the dashboard reports five weight-averaged metrics (wITR, WACI, physVaR, transVaR, avgGreenRev) over 150 `sr()`-seeded holdings with scope emissions back-derived from a fixed 30/20/25/25 split. Critically, the real tier-A backend (`portfolio_analytics_engine.py`, a genuine PCAF/WACI engine over `portfolios_pg`, shared by 9 modules with 48-module blast radius) is *not invoked* — the frontend is self-contained synthetic data despite 11 real portfolio-analytics endpoints being available.

**How.** (1) Replace the synthetic 150-holding generator with calls to the real endpoints: `GET /portfolios/{id}/holdings`, `/analytics`, and `/dashboard` — so wITR/WACI/physVaR/transVaR come from the PCAF engine over real `portfolios_pg` holdings (the engine already computes estimated Scope 1 from intensity × revenue per §5's extracted lines, replacing the fixed-split back-derivation). (2) Compute the documented Pulse Score (`0.4·Phys + 0.4·Trans + 0.2·CarbonIntensity`) from those real components. (3) The real-time surveillance/alerting (§1) uses the `/scenarios/compare` endpoint for threshold monitoring. Because this engine is shared by 48 modules, wiring it here compounds across the portfolio family.

**Prerequisites.** The endpoints exist and are Pydantic-typed; REQUIRE_AUTH gates them — exercise under auth. Blast radius is 48 modules via the shared engine — pin regression cases before any engine touch. Remove the frontend `sr()` generator. **Acceptance:** the Pulse Score and five metrics compute from real `portfolios_pg` holdings via the engine; changing a holding moves the score; no `sr()` in the metrics.

### 9.2 Evolution B — Real-time climate-surveillance copilot (LLM tier 2)

**What.** A copilot for the surveillance workflow §1 describes: "what's my portfolio's Pulse Score and which component is deteriorating?", "which holdings drive my physical VaR?", "alert me if WACI crosses the threshold", "root-cause the score drop this week" — executed against the real portfolio-analytics engine, decomposing the Pulse Score into its physical/transition/carbon terms and per-holding contributions.

**How.** Tool calls to the 11 portfolio-analytics endpoints (mostly read GETs plus `/scenarios/compare`); system prompt from this Atlas page's §5 Pulse-Score formula and the TCFD/NGFS references named in §5. The root-cause drill-down (§1) is a per-holding contribution query; alerting maps threshold breaches to the real metric values. Fabrication validator matches every score/VaR/WACI to a tool response; because this engine feeds 48 modules, the copilot is a natural tier-3 hub for portfolio-level climate questions. Mutating actions (creating portfolios, adding holdings via POST/PATCH/DELETE) gate behind confirmation + RBAC.

**Prerequisites (hard).** Evolution A — the copilot must call the real engine, not narrate the current seeded 150-holding book; the auth blocker on the endpoints must be resolved. **Acceptance:** every metric traces to an endpoint call over real holdings; the Pulse-Score decomposition sums correctly; write actions require confirmation and RBAC.