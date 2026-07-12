# Portfolio Optimizer
**Module ID:** `portfolio-optimizer` · **Route:** `/portfolio-optimizer` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Mean-variance portfolio optimisation incorporating ESG scores, carbon budget constraints, and climate tilt factors alongside financial objectives.

> **Business value:** Bridges quantitative portfolio construction with sustainability constraints, enabling ESG-integrated asset allocation without sacrificing return optimisation rigour.

**How an analyst works this module:**
- Define investment universe and constraint parameters.
- Set ESG floor, carbon budget, and sector limits.
- Run optimisation and review efficient frontier.
- Compare optimised vs benchmark allocations.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CONSTRAINT_DEFS`, `CustomTooltip`, `DEFAULT_CONSTRAINTS`, `MetricRow`, `PRESETS`, `SliderControl`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CONSTRAINT_DEFS` | 7 | `label`, `min`, `max`, `unit` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `waci` | `holdings.reduce((s, h, i) => {` |
| `ghg` | `((c.scope1_mt \|\| 0) + (c.scope2_mt \|\| 0));` |
| `esgScore` | `holdings.reduce((s, h, i) => s + (h.company?.esg_score \|\| 50) * (weights[i] / 100), 0);` |
| `sbtiPct` | `activeH.length ? (sbtiCount / activeH.length) * 100 : 0;` |
| `tRisk` | `holdings.reduce((s, h, i) => s + (h.company?.transition_risk_score \|\| 50) * (weights[i] / 100), 0);` |
| `hhi` | `weights.reduce((s, w) => s + (w / 100) ** 2, 0);` |
| `totalExp` | `holdings.reduce((s, h) => s + (h.exposure_usd_mn \|\| h.company?.market_cap_usd_mn \|\| 100), 0) \|\| 1;` |
| `scores` | `holdings.map((h, idx) => {` |
| `esg` | `(c.esg_score \|\| 50) / 100;` |
| `tRiskPenalty` | `1 - (c.transition_risk_score \|\| 50) / 100;` |
| `sizeWeight` | `(h.exposure_usd_mn \|\| c.market_cap_usd_mn \|\| 100) / totalExp;` |
| `totalScore` | `scores.reduce((s, x) => s + x.score, 0) \|\| 1;` |
| `belowTotal` | `belowCap.reduce((s, i) => s + rawWeights[i], 0) \|\| 1;` |
| `wSum` | `rawWeights.reduce((s, w) => s + w, 0) \|\| 1;` |
| `totalW` | `eligible.reduce((s, h) => s + (h.weight \|\| 1), 0) \|\| 1;` |
| `retProxy` | `eligible.reduce((s, h) => {` |
| `esgRet` | `(c.esg_score \|\| 50) * 0.1;` |
| `revYield` | `((c.revenue_usd_mn \|\| 100) / (c.market_cap_usd_mn \|\| 1000)) * 10;` |
| `meanTR` | `eligible.reduce((s, h) => s + (h.company?.transition_risk_score \|\| 50) * ((h.weight \|\| 1) / totalW), 0);` |
| `variance` | `eligible.reduce((s, h) => {` |
| `diff` | `(h.company?.transition_risk_score \|\| 50) - meanTR;` |
| `riskProxy` | `Math.sqrt(variance) * 0.5 + 5;` |
| `delta` | `optimized - current;` |
| `allHoldings` | `useMemo(() => { const enriched = baseHoldings.map(h => enrichHolding(h));` |
| `addedHoldings` | `universeAdditions.map(c => ({` |
| `existingTickers` | `new Set(allHoldings.map(h => h.company?.ticker));` |
| `uniqueSectors` | `useMemo(() => [...new Set(GLOBAL_COMPANY_MASTER.map(c => c.sector).filter(Boolean))].sort(), []);` |
| `uniqueExchanges` | `useMemo(() => EXCHANGES.map(e => e.id).sort(), []);` |
| `currentWeights` | `useMemo(() => { const totalExp = allHoldings.reduce((s, h) => s + (h.exposure_usd_mn \|\| 0), 0) \|\| 1;` |
| `currentMetrics` | `useMemo(() => computeMetrics(allHoldings, currentWeights), [allHoldings, currentWeights]);  // Data quality assessment const dataQualityAssessment = useMemo(() => { const assessments = allHoldings.map(h => ({ ticker: h.company?.ticker \|\| 'N/A', quality: assessDataQuality(h.company) }));` |
| `missingESG` | `allHoldings.filter(h => h.company?.esg_score == null).map(h => h.company?.ticker \|\| 'N/A');` |
| `missingGHG` | `allHoldings.filter(h => h.company?.scope1_mt == null && h.company?.scope2_mt == null).map(h => h.company?.ticker \|\| 'N/A');` |
| `frontierPoints` | `useMemo(() => generateFrontier(allHoldings), [allHoldings]);  // Handlers const handleOptimize = useCallback(() => { const result = optimizePortfolio(allHoldings, constraints);` |
| `totalExposure` | `portfolio.holdings.reduce((s, h) => s + (h.exposure_usd_mn \|\| 0), 0) \|\| 100;` |
| `frontierWithMarkers` | `useMemo(() => { const pts = frontierPoints.map(p => ({ ...p, currentRet:null, currentRisk:null, optRet:null, optRisk:null }));` |

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
**Frontend seed datasets:** `CONSTRAINT_DEFS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Expected Return (%) | — | Factor Model | Annualised expected portfolio return from optimised weight vector. |
| Portfolio Volatility (%) | — | Covariance Matrix | Annualised standard deviation of optimised portfolio returns. |
| ESG Score | — | Provider Composite | Weighted average ESG score of optimised portfolio. |
- **Security returns + covariance matrix + ESG scores + carbon data** → Quadratic programming; constraint handling; frontier generation → **Optimal weight vector + efficient frontier + attribution vs benchmark**

## 5 · Intermediate Transformation Logic
**Methodology:** Optimised Objective
**Headline formula:** `max [E(r) – λσ² + γ×ESG] subject to: carbon ≤ budget, wᵢ ≥ 0, Σwᵢ = 1`

Lagrangian optimisation balancing return, variance, ESG tilt, and carbon budget hard constraint.

**Standards:** ['Markowitz (1952)', 'MSCI ESG Integration Framework']
**Reference documents:** Markowitz H. (1952) Portfolio Selection. Journal of Finance; MSCI ESG Integration: A Practical Guide (2020)

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
| `portfolio-suite` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-temperature-score` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `real-estate-valuation` | table:decimal, table:schemas, table:uuid |
| `sustainability-report-builder` | table:decimal, table:schemas, table:uuid |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide claims a Lagrangian mean-variance optimiser
> `max[E(r) − λσ² + γ·ESG]` subject to carbon budget and `Σwᵢ=1`. **The code is not an MVO.** It is a
> **score-tilt heuristic**: each holding gets a linear composite score, weights are set proportional
> to score, then clipped to a max-position cap and renormalised. There is no covariance matrix, no
> variance term, no Lagrangian, and no quadratic program. The metrics it reports (WACI, ESG, HHI,
> SBTi %) are genuine; the "efficient frontier" uses proxy return/risk. §8 specifies the real MVO.

### 7.1 What the module computes

Real metric aggregation (`computeMetrics`) over holdings and weights:
```js
waci     = Σ (GHG_i / rev_i) · (wᵢ/100)          // Scope1+2 intensity, exposure-weighted
esgScore = Σ (esg_i || 50) · (wᵢ/100)
tRisk    = Σ (transition_i || 50) · (wᵢ/100)
sbtiPct  = sbtiCount / activeH.length · 100
hhi      = Σ (wᵢ/100)²                            // concentration (0–1)
```

The optimiser (`optimizePortfolio`) is a greedy re-weighter:
```js
score_i  = esg_i·0.4 + (1 − transition_i)·0.3 + sbtiBonus(0.2) + sizeWeight·0.1
// exclusion filters (high-carbon, min ESG, max transition) drop names → removed[]
rawWeight_i = score_i / Σscore · 100
// clip w>maxPos, redistribute excess to below-cap names ∝ their weight, renormalise to 100
```
`generateFrontier` sweeps an ESG threshold 0→100 in steps of 5, and at each step computes a
**proxy** return and risk over eligible names.

### 7.2 Parameterisation / scoring rubric

| Term | Weight / formula | Provenance |
|---|---|---|
| ESG | `esg/100 × 0.4` | heuristic tilt weight |
| Transition penalty | `(1 − transition/100) × 0.3` | heuristic tilt weight |
| SBTi bonus | `+0.2 if sbti_committed` | heuristic |
| Size | `sizeWeight × 0.1` | heuristic (exposure/market-cap share) |
| High-carbon exclusion | sector=Energy or `(S1+S2)/rev > 400` | threshold rule |
| Frontier return proxy | `esg·0.1 + (revenue/mktCap)·10` | **proxy**, not expected return |
| Frontier risk proxy | `√var(transition_risk)·0.5 + 5` | **proxy**, not portfolio volatility |
| Data source | `GLOBAL_COMPANY_MASTER` + enrichment | real curated data (not `sr()`) |

The frontier's "risk" is the cross-sectional standard deviation of `transition_risk_score`, not a
return-covariance-based volatility — so it is a dispersion proxy, not σ_portfolio.

### 7.3 Calculation walkthrough

1. Holdings enriched from the company master; `currentMetrics` computed on current weights.
2. `optimizePortfolio` scores each name, applies exclusion filters, sets score-proportional weights,
   clips to `maxSinglePosition`, redistributes excess, renormalises to 100 %.
3. Post-hoc `violations` check recomputes metrics vs constraints (max WACI, min ESG, sector caps).
4. `generateFrontier` produces 21 ESG-threshold points with proxy return/risk for the chart.

### 7.4 Worked example

Three names scored 0.72, 0.55, 0.40 (Σ=1.67), max-position cap 40 %:

| Step | Computation | Result |
|---|---|---|
| raw w₁ | 0.72/1.67·100 | 43.1 % |
| clip w₁ | >40 → 40, excess 3.1 | 40.0 % |
| w₂ raw | 0.55/1.67·100 | 32.9 % |
| w₃ raw | 0.40/1.67·100 | 24.0 % |
| redistribute 3.1 to {2,3} ∝ weight | w₂ += 3.1·32.9/56.9=1.79; w₃ += 1.31 | 34.7 %, 25.3 % |
| renormalise (Σ=100) | already ≈100 | 40.0 / 34.7 / 25.3 |

The result maximises the ESG/transition tilt, not a risk-adjusted return — a high-Sharpe name with
mediocre ESG would be down-weighted.

### 7.5 Data provenance & limitations

- **Real company data**; no `sr()` seeding. Missing fields default to 50 (ESG/transition), biasing
  scores toward neutral.
- No covariance matrix, no expected-return model, no true efficient frontier — the frontier is a
  monotone ESG-threshold sweep with proxy axes.
- HHI, WACI, sector caps and exclusions are correct and useful; the "optimisation" is a defensible
  ESG *tilt* but should not be presented as mean-variance optimal.

**Framework alignment:** Markowitz MVO (1952) — *named* but not implemented; no `−λσ²` term exists ·
MSCI ESG Integration — the tilt scoring loosely mirrors best-in-class ESG weighting · PCAF — WACI is
computed correctly for the carbon-budget constraint.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A true climate-aware mean-variance optimiser producing an efficient frontier and optimal weights
under ESG, carbon-budget, sector and position constraints — for ESG-integrated strategic allocation.

### 8.2 Conceptual approach
**Constrained quadratic programming** (Markowitz) with an ESG tilt and a hard carbon budget,
mirroring MSCI BarraOne/Aladdin optimiser workflows and BlackRock's climate-tilted MVO. Objective
maximises risk-adjusted return plus ESG utility; the frontier is traced by sweeping the risk-aversion
λ, not an ESG threshold.

### 8.3 Mathematical specification
```
maximise_w   μᵀw − λ·wᵀΣw + γ·(ESGᵀw)
subject to   1ᵀw = 1,  w ≥ 0 (or box l≤w≤u),
             CIᵀw ≤ CarbonBudget,   Sw ≤ sectorCaps,   wᵢ ≤ maxPos
frontier:    solve for a grid of λ ∈ [λ_min, λ_max]
Sharpe*      = (μᵀw − r_f) / √(wᵀΣw)
```

| Parameter | Calibration source |
|---|---|
| `μ` expected returns | factor model (e.g. Fama-French + carbon factor) or CAPM; vendor estimates |
| `Σ` covariance | shrinkage estimator (Ledoit-Wolf) on historical returns; BarraOne factor Σ |
| `ESG`, `CI` | company master ESG + PCAF intensity (already present) |
| `λ`, `γ` | risk aversion / ESG-preference; investor mandate |
| `CarbonBudget`, caps | client policy; CRREM/SBTi-aligned budget |

### 8.4 Data requirements
`historical_returns` (for Σ, μ), `esg_score`, `carbon_intensity`, `sector`, `exposure`. Sources:
price history (vendor/free — Stooq/Yahoo), platform ESG + PCAF engine, sector map. A QP solver
(OSQP/quadprog) is the missing computational piece.

### 8.5 Validation & benchmarking plan
Verify KKT optimality and `1ᵀw=1`, `w≥0`; reconcile the frontier against a reference solver on the
same inputs; benchmark optimal Sharpe against a naive risk-parity and the current score-tilt output;
stress Σ estimation (in-sample vs out-of-sample frontier stability).

### 8.6 Limitations & model risk
μ estimation error dominates MVO instability; Σ is regime-dependent; carbon-budget hard constraints
can force corner solutions. Conservative fallback: use shrinkage Σ, resampled-efficiency averaging
(Michaud), and report the frontier as a band rather than a single optimal point.

## 9 · Future Evolution

### 9.1 Evolution A — Ship the real mean-variance optimiser (analytics ladder: rung 1 → 5)

**What.** §7's mismatch flag: the guide claims a Lagrangian MVO (`max[E(r) − λσ² + γ·ESG]` s.t. carbon budget, `Σwᵢ=1`), but the code is a score-tilt heuristic — each holding gets a linear composite score (`esg·0.4 + (1−transition)·0.3 + sbtiBonus + sizeWeight`), weights set proportional to score, clipped to a max-position cap and renormalised. There is no covariance matrix, no variance term, no Lagrangian, no quadratic program; the "efficient frontier" sweeps an ESG threshold with proxy return/risk. The reported WACI/ESG/HHI/SBTi metrics are genuine. Evolution A builds the actual optimiser the module is named for — a canonical rung-5 prescriptive engine.

**How.** (1) Implement the real MVO with `scipy.optimize` (or cvxpy) — a quadratic program maximising `E(r) − λσ² + γ·ESG` subject to the carbon-budget hard constraint, long-only (`wᵢ≥0`), and `Σwᵢ=1`, over a real covariance matrix estimated from ingested return history. (2) The efficient frontier becomes a genuine λ-sweep of QP solutions, not an ESG-threshold proxy. (3) Real holdings and returns from `portfolios_pg` and market data via the 11 portfolio-analytics endpoints (the shared engine feeds 48 modules). The correct WACI/ESG/HHI metrics carry over as constraint/reporting terms.

**Prerequisites.** Return covariance from market history (the missing input — the current page has no Σ); scipy/cvxpy in the backend; the portfolio-analytics endpoints (auth-gated). Blast radius 48 via shared engine — pin first. A `bench_quant` case with a known QP optimum. **Acceptance:** the optimiser solves the QP (verifiable against a hand-solved small case); the carbon-budget constraint binds; the frontier is a real λ-sweep; tightening the ESG floor changes the optimum.

### 9.2 Evolution B — Portfolio-construction analyst (LLM tier 2)

**What.** A copilot: "optimise for max Sharpe with WACI 40% below benchmark and an ESG floor of 60", "show the efficient frontier under a 100 tCO₂/$M carbon budget", "how much return do I give up for the carbon constraint?" — executed against the (Evolution-A) MVO, presenting weights, frontier points, and the shadow cost of each sustainability constraint.

**How.** Tool calls to an optimise endpoint (constraint set as typed parameters) and the frontier generator; system prompt from this Atlas page's §5 objective and the Markowitz/MSCI references named in §5. The analyst explains which constraints bound and the return cost of each climate tilt from the QP's dual values, not intuition; the fabrication validator matches every weight/return/risk figure to a tool response. Saving an optimised portfolio (POST/PATCH holdings) gates behind confirmation + RBAC.

**Prerequisites (hard).** Evolution A — there is no MVO to call today; a copilot presenting the current score-tilt heuristic's output as "mean-variance optimal" would misrepresent it exactly as §7 flags. **Acceptance:** every weight/frontier figure traces to a QP solve; constraint shadow costs come from the optimiser's duals; the copilot refuses to claim optimality before the QP exists.