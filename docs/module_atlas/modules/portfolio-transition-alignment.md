# Portfolio Transition Alignment
**Module ID:** `portfolio-transition-alignment` · **Route:** `/portfolio-transition-alignment` · **Tier:** A (backend vertical) · **EP code:** EP-CC1 · **Sprint:** CC

## 1 · Overview
Portfolio-level transition alignment analysis across ITR (Implied Temperature Rise), GFANZ commitment, TPT 3-pillar framework, and PACTA methodology. Includes engagement & escalation register.

**How an analyst works this module:**
- ITR Overview shows portfolio temperature trajectory and 2030 target
- GFANZ/TPT tab shows alignment status with radar chart for 3 pillars
- PACTA Analysis shows technology-level alignment by sector
- Engagement & Escalation register tracks stewardship actions per holding
- Sector Drill-Down decomposes ITR by GICS sector contribution

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `PORTFOLIOS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PORTFOLIOS` | 22 | `name`, `aum`, `itr`, `gfanz`, `nz_year`, `interim_2030`, `tpt_strategy`, `tpt_governance`, `tpt_metrics`, `pacta_aligned`, `pacta_misaligned`, `engagement_cov`, `sectors`, `weight` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['ITR Overview', 'GFANZ/TPT Alignment', 'PACTA Analysis', 'Engagement & Escalation', 'Sector Drill-Down'];` |
| `tptOverall` | `((port.tpt_strategy + port.tpt_governance + port.tpt_metrics) / 3).toFixed(1);` |
| `computedITR` | `useMemo(() => { const totalW = port.sectors.reduce((s, sec) => s + sec.weight, 0);` |
| `factor` | `0.8 + 0.2 * (Math.sin(si * 2.3 + port.sectors.length) + 1);` |

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
**Frontend seed datasets:** `PORTFOLIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio ITR | `Budget method` | PACTA | Current portfolio implies 2.4°C warming vs 1.5°C Paris target |
| GFANZ Alignment | `AUM-weighted` | Alliance databases | Percentage of portfolio by AUM with GFANZ-aligned commitments |
| TPT Readiness | `3-pillar composite` | UK TPT Framework | Transition plan readiness score across Ambition, Action, Accountability |

## 5 · Intermediate Transformation Logic
**Methodology:** ITR + GFANZ/TPT/PACTA alignment
**Headline formula:** `ITR = T_budget / (Σ Projected_Emissions_t / Allocated_Budget_t)`

ITR quantifies the implied global temperature outcome if all companies emitted at the same rate as the portfolio. GFANZ: checks commitment status across NZAM/NZAOA/NZBA alliances. TPT: 3-pillar assessment (Ambition, Action, Accountability). PACTA: technology-level alignment for high-emitting sectors.

**Standards:** ['GFANZ', 'UK TPT', 'PACTA 2020', 'Paris Agreement']
**Reference documents:** GFANZ Sector Pathway Reference Documents; UK TPT Disclosure Framework; PACTA 2020 Methodology; Paris Agreement Article 2.1(a)

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
| `portfolio-climate-var` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-dashboard` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-climate-pulse` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-manager` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-optimizer` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-suite` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `portfolio-temperature-score` | engine:portfolio_analytics_engine, engine:portfolio_analytics_engine_v2, table:api, table:decimal, table:fields, table:middleware |
| `real-estate-valuation` | table:decimal, table:schemas, table:uuid |
| `sustainability-report-builder` | table:decimal, table:schemas, table:uuid |

## 7 · Methodology Deep Dive

This module is comparatively grounded: it holds curated portfolios with hand-set sector weights and
sector ITRs, and it computes the **genuine budget-weighted ITR** `Σ(wᵢ·ITRᵢ)/Σwᵢ` the guide
specifies. Two caveats: the portfolio-level ITR/GFANZ/TPT/PACTA inputs are curated point values
(not derived from holdings), and the PACTA alignment chart uses a **nonstandard `sin`-based scaler**
rather than real technology-pathway data. A third, code-level (not guide↔code) defect: the GFANZ/TPT
tab's in-page copy labels the TPT radar "Taskforce on Nature framework" — TPT is the UK
**Transition Plan Taskforce**, unrelated to TNFD (Taskforce on Nature-related Financial
Disclosures); this is a one-line factual mislabel, not a methodology gap.

### 7.1 What the module computes

```js
computedITR = Σ_sec (weight_sec · itr_sec) / Σ_sec weight_sec           // real weighted ITR
tptOverall  = (tpt_strategy + tpt_governance + tpt_metrics) / 3         // 3-pillar mean
// PACTA chart per sector:
factor      = 0.8 + 0.2 · (sin(si·2.3 + sectors.length) + 1)            // ⚠ nonstandard scaler
aligned     = min(100, pacta_aligned · factor)
misaligned  = min(100, pacta_misaligned · (1.4 − factor + 0.8))
```

`computedITR` is the headline (guarded `totalW===0 ? port.itr`). The ITR color-bands at <2 (green),
<2.5 (amber), else red are applied to the computed value.

### 7.2 Parameterisation / provenance

| Quantity | Source | Provenance |
|---|---|---|
| `PORTFOLIOS` (22 rows) | curated: aum, itr, gfanz, nz_year, interim_2030, tpt_*, pacta_* | hand-authored demo portfolios |
| sector `itr`, `weight` | per-sector curated (Energy 3.8, Tech 1.8…) | curated; Energy hottest, Tech coolest (realistic) |
| `tpt_strategy/governance/metrics` | 0–100 curated | curated TPT 3-pillar scores |
| `pacta_aligned/misaligned` | curated % | curated |
| PACTA `factor` | `0.8 + 0.2·(sin(si·2.3)+1)` | **nonstandard PRNG-style scaler**, not pathway data |
| escalation register | curated (Glencore, RWE, ArcelorMittal…) | hand-authored stewardship rows |

The `computedITR` is methodologically correct; the PACTA `factor` is the one fabricated element — it
manufactures per-sector alignment values from a deterministic sine, not from technology mix vs a
1.5 °C pathway.

### 7.3 Calculation walkthrough

1. Select a portfolio → `port`.
2. `computedITR` = weight-average of the portfolio's sector ITRs (the guide's budget-method proxy).
3. `tptOverall` = mean of the 3 TPT pillar scores.
4. GFANZ tab reads the curated commitment status; radar plots the 3 pillars.
5. PACTA tab manufactures aligned/misaligned bars via the `sin` `factor`.
6. ITR trajectory chart plots `{2023: 2.9, 2024: computedITR, …}`.

### 7.4 Worked example

Two sectors: Energy (weight 8.2, ITR 3.8) and Technology (weight 14.2, ITR 1.8), Σweight 22.4:

| Output | Computation | Result |
|---|---|---|
| numerator | 8.2·3.8 + 14.2·1.8 = 31.16 + 25.56 | 56.72 |
| computedITR | 56.72 / 22.4 | 2.53 °C |
| band | 2.53 ≥ 2.5 → red | red |
| tptOverall (62,71,58) | (62+71+58)/3 | 63.7 /100 |

The full-portfolio `computedITR` uses all 8 sectors; this 2-sector slice illustrates the weighting.

### 7.5 Data provenance & limitations

- **Curated portfolio data**, not `sr()`-seeded; `computedITR` and `tptOverall` are real computations.
- Portfolio-level `itr`, `gfanz`, `pacta_*` are curated point values, not aggregated from underlying
  holdings — the sector-level ITR aggregation is the only true bottom-up number.
- The PACTA alignment chart is **fabricated by a `sin` scaler**; it does not reflect technology-pathway
  alignment and should not be read as PACTA output.

**Framework alignment:** GFANZ — commitment status (NZAM/NZAOA/NZBA) shown as a curated label · UK TPT
— the 3-pillar (Strategy/Governance/Metrics, mapped to Ambition/Action/Accountability) mean is a
faithful TPT-readiness proxy · PACTA 2020 — *named* but the alignment values are synthetic, not
technology-mix vs scenario pathways · Paris Article 2.1(a) — the 1.5 °C reference behind the ITR bands.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute portfolio transition alignment bottom-up from holdings: budget-method ITR, GFANZ commitment
coverage, TPT readiness, and genuine PACTA technology alignment — for stewardship and NZAM reporting.

### 8.2 Conceptual approach
The **PACTA 2020** technology-pathway method (compare portfolio technology mix vs IEA scenario
build-out) plus the **SBTi budget-method ITR**, mirroring the 2 Degrees Investing Initiative PACTA
tool and TPT Disclosure Framework scoring.

### 8.3 Mathematical specification
```
ITR_pf     = T_budget / ( Σ_t ProjectedEmissions_t / AllocatedBudget_t )     # guide budget method
Alignment_k= (PortfolioCapacity_k,t − ScenarioCapacity_k,t) / ScenarioCapacity_k,t   # per technology k
PACTA_score= Σ_k exposure_k · 1{ Alignment_k ≥ 0 }
GFANZ_cov  = Σ_i w_i · 1{ commitment_i ∈ {NZAM,NZAOA,NZBA} }
TPT_ready  = mean(Ambition, Action, Accountability)   # sub-criteria scored per TPT rubric
```

| Parameter | Calibration source |
|---|---|
| `ScenarioCapacity_k,t` | IEA NZE / WEO technology build-out by sector |
| `AllocatedBudget_t` | IPCC AR6 sector carbon budget |
| commitment status | GFANZ alliance membership registries |
| TPT sub-criteria | UK TPT Disclosure Framework scoring guide |
| technology exposure | company production/asset data (PACTA input) |

### 8.4 Data requirements
`technology_capacity` (MW, Mt by tech), `production_plans`, `commitment_status`, `emissions_trajectory`,
`weight`. Sources: asset-level production data (PACTA/Asset Resolution), GFANZ registries (free), IEA
scenarios (free), TPT rubric. Sector weights/ITRs partially exist.

### 8.5 Validation & benchmarking plan
Reconcile `ITR_pf` against the PACTA tool and SBTi portfolio scores; verify technology alignment signs
against IEA build-out; check GFANZ coverage against alliance member lists; TPT scores against disclosed
transition plans.

### 8.6 Limitations & model risk
Asset-level production data is costly and sparse; scenario technology paths are uncertain; ITR
budget-method is sensitive to allocation choice. Conservative fallback: report ITR as a methodology
band (PACTA vs SBTi vs weighted-average) as the current METHODOLOGIES table implies.

## 9 · Future Evolution

### 9.1 Evolution A — Holdings-derived inputs, fixed PACTA scaler and TPT mislabel (analytics ladder: rung 2 → 3)

**What.** §7 rates this comparatively grounded: it computes the genuine budget-weighted ITR (`Σ wᵢ·ITRᵢ/Σwᵢ`) the guide specifies over curated sector weights/ITRs (Energy 3.8 hottest, Tech 1.8 coolest — realistic), plus a real TPT 3-pillar mean. Three flaws: the ITR/GFANZ/TPT/PACTA inputs are curated point values not derived from holdings; the PACTA alignment chart uses a nonstandard `sin`-based scaler (`factor = 0.8 + 0.2·(sin(si·2.3+n)+1)`) instead of real technology-pathway data; and a code-level factual defect — the GFANZ/TPT tab labels the TPT radar "Taskforce on Nature framework" when TPT is the UK **Transition Plan Taskforce**, unrelated to TNFD. Evolution A grounds the inputs and fixes both defects.

**How.** (1) Derive the sector ITRs and GFANZ/TPT/PACTA inputs from real holdings (`portfolios_pg` via the shared engine) rather than curated point values — the weighted-ITR aggregation is already correct, so this grounds its inputs. (2) Replace the `sin`-based PACTA scaler with real PACTA technology-pathway data: a sector's aligned/misaligned split from actual production-plan-vs-scenario data (the PACTA 2020 methodology named in §5), not a trigonometric proxy. (3) Fix the one-line TPT/TNFD mislabel — TPT is the Transition Plan Taskforce (Ambition/Action/Accountability pillars), not a nature framework. (4) The GFANZ commitment check keys to the real net-zero-alliance rosters (shared with `net-zero-commitment-tracker`).

**Prerequisites.** Real holdings + PACTA technology data (the missing input for the alignment chart); GFANZ roster data (shared); the weighted-ITR math is correct — keep it. Blast radius 48 — pin first. **Acceptance:** ITR/alignment inputs derive from real holdings; the PACTA chart uses real pathway data, not `sin`; the TPT label is corrected to Transition Plan Taskforce.

### 9.2 Evolution B — Transition-alignment & stewardship copilot (LLM tier 2)

**What.** A copilot for the workflow §1 describes: "what's my portfolio ITR and 2030 target gap?", "which holdings are GFANZ-committed?", "show TPT 3-pillar alignment", "which sectors are PACTA-misaligned and need engagement?" — executed against the (Evolution-A) alignment engine, decomposing ITR by sector and surfacing the engagement/escalation register (§1).

**How.** Tool calls to endpoints wrapping the weighted ITR, TPT pillar scores, and PACTA alignment; system prompt from this Atlas page's §5 and the GFANZ/UK TPT/PACTA/Paris references named in §5 — with the TPT framework correctly described (Transition Plan Taskforce, not TNFD). The engagement register drives stewardship recommendations (which misaligned holdings to escalate); the fabrication validator matches every ITR/pillar/alignment figure to a response. Provenance distinguishes real-holding-derived from curated inputs until Evolution A completes.

**Prerequisites.** Compute endpoints; Evolution A for holdings-derived inputs and the corrected PACTA/TPT treatment (the weighted-ITR works today on curated data). The copilot must not repeat the TPT/TNFD mislabel. **Acceptance:** every ITR/alignment figure traces to a tool call; TPT is described correctly; PACTA answers (post-Evolution-A) use real pathway data; engagement recommendations cite the misaligned sectors.