# Portfolio Manager
**Module ID:** `portfolio-manager` · **Route:** `/portfolio-manager` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG-integrated portfolio management with holdings import, position tracking, ESG score overlay, benchmark comparison, and SFDR/taxonomy classification at portfolio level.

> **Business value:** ESG-integrated portfolio management requires aggregating hundreds of ESG data points across thousands of holdings. This module provides the operational infrastructure for ESG portfolio monitoring, rebalancing, and regulatory reporting — the day-to-day workflow for ESG portfolio managers.

**How an analyst works this module:**
- Holdings View shows all positions with ESG scores and flags
- Benchmark Comparison shows ESG score vs index
- SFDR Overlay shows SI% and taxonomy alignment
- Rebalancing Tool suggests trades to improve ESG score within TE budget
- Performance Attribution decomposes return by ESG factor

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Chip`, `DEFAULT_PORTFOLIOS`, `KpiCard`, `RISK_C`, `SECTOR_COLORS`, `STORAGE_KEY`, `WeightInput`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtB` | `n => n == null ? '—' : n >= 1000 ? `$${(n / 1000).toFixed(1)}T` : `$${n.toFixed(0)}B`;` |
| `fmtMn` | `n => n == null ? '—' : n >= 1000000 ? `$${(n / 1000000).toFixed(2)}T` : n >= 1000 ? `$${(n / 1000).toFixed(1)}B` : `$${n}M`;` |
| `fmtCO2` | `n => n == null ? '—' : n >= 1e9 ? `${(n / 1e9).toFixed(2)} Gt` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} Mt` : `${(n / 1000).toFixed(0)} Kt`;` |
| `pct` | `(v, t) => t > 0 ? ((v / t) * 100).toFixed(1) : '0.0';` |
| `cin` | `company.cin \|\| company.id \|\| `${company.ticker}-${company.exchange}`;` |
| `total` | `updated.reduce((s, h) => s + h.weight, 0);` |
| `totalW` | `holdings.reduce((s, h) => s + h.weight, 0);` |
| `totalExp` | `holdings.reduce((s, h) => s + (h.exposure_usd_mn \|\| 0), 0);` |
| `rev` | `c.revenue_usd_mn \|\| (c.revenue_inr_cr ? c.revenue_inr_cr * 0.1203 : 0);` |
| `waci` | `waciW > 0 ? waciSum / waciW : null;` |
| `totalWeight` | `holdings.reduce((s, h) => s + h.weight, 0);` |
| `rows` | `holdings.map(h => {` |
| `blob` | `new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });` |
| `EXCHANGE_LABELS` | `EXCHANGES.map(e => e.label.split(' — ')[1] \|\| e.label);` |
| `ALL_SECTORS` | `[...new Set(GLOBAL_COMPANY_MASTER.map(c => c.sector).filter(Boolean))].sort();` |
| `s12` | `(c.scope1_co2e \|\| 0) + (c.scope2_co2e \|\| 0);` |

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
**Frontend seed datasets:** `ALL_SECTORS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Holdings | — | User upload | Portfolio positions with weights and identifiers |
| ESG Score | — | Provider | Portfolio-level ESG composite |
| Benchmark TE | — | Tracking error | Expected annual deviation from benchmark |
- **Holdings positions** → ESG score matching → **ESG-enriched portfolio**
- **Portfolio weights** → AUM-weighted aggregation → **Portfolio ESG score**
- **SFDR/taxonomy data** → Portfolio classification → **SFDR art/taxonomy reporting**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG portfolio aggregation
**Headline formula:** `PortfolioScore = Σ(w_i × ESG_i); Tracking_Error = std(r_portfolio - r_benchmark)`

Aggregation: AUM-weighted average of company ESG scores. SFDR classification: sum of SI%-eligible holdings. Taxonomy: % of covered portfolio aligned per EU Taxonomy KPIs.

**Standards:** ['Markowitz MPT', 'MSCI ESG', 'Bloomberg']
**Reference documents:** MSCI ESG Research; Sustainalytics; EU Taxonomy Regulation; SFDR RTS

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
| `portfolio-optimizer` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-suite` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-temperature-score` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `real-estate-valuation` | table:decimal, table:schemas, table:uuid |
| `sustainability-report-builder` | table:decimal, table:schemas, table:uuid |

## 7 · Methodology Deep Dive

This module is one of the more **grounded** portfolio pages: holdings are built from the real
`GLOBAL_COMPANY_MASTER` dataset (with an MSCI/enrichment merge layer), and the portfolio WACI is a
genuine PCAF-style exposure-weighted intensity. The one heuristic worth flagging is the
**implied-temperature lookup** — a 6-bucket step function on WACI, not a target/trajectory-based ITR
as SBTi defines it — so §8 specifies the production ITR model.

### 7.1 What the module computes

Real portfolio aggregation over user-managed holdings (persisted to `localStorage`):

```js
rev  = c.revenue_usd_mn || (c.revenue_inr_cr · 0.1203)        // INR→USD FX
s12  = (c.scope1_co2e || 0) + (c.scope2_co2e || 0)            // Scope 1+2 tCO2e
waci = waciW > 0 ? waciSum / waciW : null                     // exposure-weighted intensity
impliedTemp(waci): <50→1.5 | <120→1.7 | <250→2.0 | <500→2.5 | <900→3.0 | else 3.5   (°C)
pct(v,t) = t>0 ? v/t·100 : 0
```

`resolveCompanyData` merges three layers per holding — manual overrides `mData`, enrichment `eData`
(`.value`), then base `company` — with sensible fallbacks (`esg_score ?? 50`, `transition_risk_score
?? 50`). `addHolding` auto-rebalances weights to ≤100 % (`factor = 100/total`).

### 7.2 Parameterisation / provenance

| Quantity | Source | Provenance |
|---|---|---|
| holdings universe | `GLOBAL_COMPANY_MASTER` + `EXCHANGES` | real curated company master (not `sr()`) |
| `esg_score`, `transition_risk_score` | merged from master/enrichment, default 50 | real where available; 50 fallback |
| `scope1_co2e`, `scope2_co2e`, `evic_usd_mn` | company master + enrichment | real where available |
| INR→USD factor | `0.1203` | hard-coded FX constant (≈₹83/$) |
| `impliedTemp` buckets | 50/120/250/500/900 WACI thresholds → 1.5–3.5 °C | **heuristic lookup**, not a standard |

The WACI denominator uses exposure/EVIC weights, matching PCAF's attribution logic; the temperature
buckets are the sole ad-hoc mapping.

### 7.3 Calculation walkthrough

1. User adds companies from the master; each is resolved and weighted (default 5 %, auto-rebalanced).
2. Per holding, revenue is normalised to USD; Scope 1+2 summed.
3. Carbon intensity = emissions / revenue; WACI = Σ(weightᵢ·CIᵢ)/Σweightᵢ (guarded).
4. Portfolio implied temperature read from the `impliedTemp(waci)` step function.
5. SFDR/taxonomy overlays and CSV export operate on the resolved holdings.

### 7.4 Worked example

Two holdings, exposure-weighted: A (weight 60, revenue $10,000M, S1+2 = 3.0 Mt → CI 300), B (weight
40, revenue $20,000M, S1+2 = 1.0 Mt → CI 50):

| Output | Computation | Result |
|---|---|---|
| CI_A | 3,000,000 / 10,000 | 300 tCO2e/$M |
| CI_B | 1,000,000 / 20,000 | 50 tCO2e/$M |
| WACI | (60·300 + 40·50)/100 | 200 tCO2e/$M |
| impliedTemp | 200 → bucket `<250` | 2.0 °C |

### 7.5 Data provenance & limitations

- **Real company data** from `GLOBAL_COMPANY_MASTER`; no `sr()` seeding. Missing fields fall back to
  neutral defaults (ESG 50, transition 50), which can bias a sparse portfolio toward the mean.
- WACI is methodologically sound; the **implied temperature is a coarse 6-step lookup** with no
  target ambition, no trajectory, and no sector pathway — it will misrank two firms with equal WACI
  but very different decarbonisation commitments.
- Tracking error / benchmark comparison described in the guide is not a statistical computation here.

**Framework alignment:** PCAF — WACI (`Σ wᵢ·CIᵢ`) follows the PCAF weighted-average-carbon-intensity
definition and attribution logic · SBTi/TCFD — the implied-temperature output *approximates* an ITR
but SBTi's method derives ITR from a company's target ambition and modelled emissions trajectory
versus a science-based benchmark pathway, then aggregates portfolio-weighted; the step-function here
skips all of that · SFDR/EU Taxonomy — surfaced as classification overlays, not computed from RTS
criteria.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Replace the WACI→°C step function with a proper portfolio Implied Temperature Rise, computed
bottom-up from company targets and trajectories, for net-zero-alliance reporting and client mandates.

### 8.2 Conceptual approach
The **SBTi Temperature Scoring** method (target-ambition regression → company ITR) aggregated per
portfolio, cross-checked against the **PACTA** technology-pathway approach — the two industry
references named in the sibling temperature module. Company temperature is derived from the implied
over/under-shoot of a science-based carbon budget, not from current intensity alone.

### 8.3 Mathematical specification
```
Overshoot_i   = (CumEmissions_i,target − Budget_i,1.5) / Budget_i,1.5
ITR_i         = a + b · Overshoot_i           # SBTi linear-model coefficients (scope-specific)
ITR_i(default)= 3.2 °C  if no validated target (SBTi default)
ITR_pf        = Σ_i w_i · ITR_i               # exposure- or emissions-weighted
Coverage      = Σ_i w_i · 1{ target_i validated }
```

| Parameter | Calibration source |
|---|---|
| `Budget_i,1.5` | sector carbon budget; IPCC AR6 / IEA NZE allocated to company revenue share |
| `a, b` | SBTi Temperature Scoring regression coefficients (public methodology v1.5) |
| default 3.2 °C | SBTi no-target default |
| `w_i` | portfolio exposure/EVIC weight (already computed) |
| target data | SBTi registry (`sbti-companies.json` already in platform), CDP |

### 8.4 Data requirements
`near_term_target`, `net_zero_year`, `base_year_emissions`, `target_scope_coverage`, `sector`,
`revenue`. Sources: SBTi registry (platform has `sbti-companies.json`), CDP emissions
(`CDP_COMPANY_EMISSIONS` already imported by the sibling page), company filings. WACI/weights exist.

### 8.5 Validation & benchmarking plan
Reconcile company ITRs against published SBTi temperature scores where available; benchmark portfolio
ITR against PACTA technology-alignment output; verify default-3.2 °C application rate matches coverage
gap. Sensitivity-test on scope coverage and weighting scheme (exposure vs emissions).

### 8.6 Limitations & model risk
Target data is self-reported and sparse; the SBTi regression is scope- and sector-sensitive;
weighting choice materially moves the headline. Conservative fallback: apply the SBTi default (3.2 °C)
to any name lacking a validated target and disclose coverage % alongside the portfolio ITR.

## 9 · Future Evolution

### 9.1 Evolution A — Persist to the backend and add a real ITR and rebalancer (analytics ladder: rung 2 → 4)

**What.** §7 rates this one of the more grounded portfolio pages: holdings come from the real `GLOBAL_COMPANY_MASTER` (with an MSCI/enrichment merge), the WACI is a genuine PCAF-style exposure-weighted intensity, and `resolveCompanyData` sensibly layers manual/enrichment/base data with honest fallbacks. Two gaps: holdings persist only to `localStorage` (not the tier-A `portfolios_pg` backend the 11 endpoints expose), and the implied-temperature is a 6-bucket step function on WACI (`<50→1.5…else 3.5`), not a target/trajectory ITR as SBTi defines it. §8 specifies the production ITR. Evolution A backs it with the real engine and replaces the ITR heuristic.

**How.** (1) Persist holdings to `portfolios_pg` via the real endpoints (`POST/PATCH/DELETE /portfolios/{id}/holdings`) instead of `localStorage`, so portfolios survive sessions and feed the shared `portfolio_analytics_engine` — this also connects to `CarbonCreditContext` for cross-module propagation. (2) Replace the WACI-bucket implied-temperature with a real SBTi-methodology ITR (target/trajectory-based, shared with the `paris-alignment` and `portfolio-temperature-score` siblings). (3) Implement the rebalancing tool (§1) the page describes as a real tracking-error-constrained optimiser (scipy — the rung-4/5 step) that suggests ESG-improving trades within a TE budget, and the performance attribution by ESG factor. The genuine WACI engine and data-merge logic stay.

**Prerequisites.** Portfolio-analytics endpoints (auth-gated); SBTi ITR inputs (shared resolver); scipy for the rebalancer; the `0.1203` INR→USD constant should become a live FX lookup. Blast radius 48 via shared engine — pin first. **Acceptance:** holdings persist to `portfolios_pg` and survive reload; ITR uses SBTi trajectory logic, not a WACI bucket; the rebalancer returns TE-constrained trades.

### 9.2 Evolution B — ESG-portfolio-management copilot (LLM tier 2)

**What.** A copilot for the day-to-day workflow §1 describes: "what's my portfolio ESG score vs the benchmark?", "which holdings fail the SFDR SI threshold?", "suggest trades to lift ESG within 1.5% tracking error", "attribute my return by ESG factor" — executed against the real portfolio engine and the (Evolution-A) rebalancer, with every figure a computed output.

**How.** Tool calls to the portfolio-analytics endpoints and the rebalancer; system prompt from this Atlas page's §5 (`PortfolioScore = Σ wᵢ·ESGᵢ`, tracking error) and the MSCI ESG / EU Taxonomy / SFDR references named in §5. Rebalancing suggestions come from the optimiser (TE-constrained), not the LLM's judgment; SFDR/taxonomy classification and attribution are tool calls. The fabrication validator matches every score/weight/TE figure to a response. Trade execution and holding changes are mutating actions — explicit confirmation + RBAC per the roadmap's Tier-2 pattern; the copilot inherits the user's session.

**Prerequisites.** Evolution A's backend persistence and rebalancer (the WACI/ESG aggregation is grounded today, but rebalancing and persistence need the backend); confirmation gating on writes. **Acceptance:** every ESG/WACI/TE figure traces to a tool call; rebalance suggestions come from the constrained optimiser; holding changes require confirmation and RBAC.