# Api::Universal_Exports
**Module ID:** `api::universal_exports` · **Route:** `/api/v1/exports` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/exports/portfolio-analytics/{portfolio_id}` | `export_portfolio_analytics` | api/v1/routes/universal_exports.py |
| GET | `/api/v1/exports/portfolio-analytics/{portfolio_id}/dashboard` | `export_portfolio_dashboard` | api/v1/routes/universal_exports.py |
| POST | `/api/v1/exports/sustainability/assessment` | `export_sustainability_assessment` | api/v1/routes/universal_exports.py |
| GET | `/api/v1/exports/sustainability/certifications` | `export_sustainability_certifications` | api/v1/routes/universal_exports.py |
| POST | `/api/v1/exports/stranded-assets/analysis` | `export_stranded_asset_analysis` | api/v1/routes/universal_exports.py |
| POST | `/api/v1/exports/scenario-analysis/comparison` | `export_scenario_comparison` | api/v1/routes/universal_exports.py |
| GET | `/api/v1/exports/scenario-analysis/{portfolio_id}/scenarios` | `export_portfolio_scenarios` | api/v1/routes/universal_exports.py |
| POST | `/api/v1/exports/nature-risk/assessment` | `export_nature_risk_assessment` | api/v1/routes/universal_exports.py |
| POST | `/api/v1/exports/valuation/analysis` | `export_valuation_analysis` | api/v1/routes/universal_exports.py |
| POST | `/api/v1/exports/carbon/calculation` | `export_carbon_calculation` | api/v1/routes/universal_exports.py |
| GET | `/api/v1/exports/bulk` | `get_available_exports` | api/v1/routes/universal_exports.py |

### 2.3 Engine `export_service` (services/export_service.py)
| Function | Args | Purpose |
|---|---|---|
| `DecimalEncoder.default` | obj |  |
| `ExportService._setup_custom_styles` |  | Setup custom paragraph styles. |
| `ExportService.generate_portfolio_analytics_pdf` | data | Generate PDF report for Portfolio Analytics. |
| `ExportService.generate_sustainability_pdf` | data | Generate PDF report for Sustainability Assessment. |
| `ExportService.generate_stranded_assets_pdf` | data | Generate PDF report for Stranded Asset Analysis. |
| `ExportService.generate_scenario_analysis_pdf` | data | Generate PDF report for Scenario Analysis. |
| `ExportService.generate_portfolio_analytics_excel` | data | Generate Excel report for Portfolio Analytics. |
| `ExportService.generate_sustainability_excel` | data | Generate Excel report for Sustainability Assessment. |
| `ExportService.generate_stranded_assets_excel` | data | Generate Excel report for Stranded Asset Analysis. |
| `ExportService.generate_scenario_analysis_excel` | data | Generate Excel report for Scenario Analysis. |
| `ExportService.export` | module, data, format | Universal export method that routes to appropriate generator. |

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

### 2.3 Engine `sustainability_calculator` (services/sustainability_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `GRESBCalculator.calculate_assessment` | request | Calculate GRESB score and value impact. |
| `GRESBCalculator._get_star_rating` | score | Determine GRESB star rating from score. |
| `GRESBCalculator._calculate_percentile` | score, benchmark | Estimate percentile rank based on benchmark data. |
| `GRESBCalculator._calculate_gresb_rent_premium` | rating, region | Calculate rent premium based on GRESB rating. |
| `GRESBCalculator._calculate_gresb_cap_compression` | rating | Calculate cap rate compression in basis points. |
| `GRESBCalculator._score_to_next_star` | current_score, current_rating | Calculate points needed for next star rating. |
| `GRESBCalculator._generate_gresb_recommendations` | scores, total | Generate improvement recommendations. |
| `GRESBCalculator._identify_priority_areas` | scores | Identify priority improvement areas with potential points. |
| `LEEDCalculator.calculate_assessment` | request | Calculate LEED points and value impact. |
| `LEEDCalculator._get_certification_level` | points | Determine LEED certification level from points. |
| `LEEDCalculator._points_to_next_level` | current, level | Calculate points needed for next certification level. |
| `LEEDCalculator._analyze_categories` | scores | Analyze category performance. |
| `LEEDCalculator._calculate_market_percentile` | points | Estimate market percentile based on points. |
| `BREEAMCalculator.calculate_assessment` | request | Calculate BREEAM score and value impact. |
| `BREEAMCalculator._get_rating` | score | Determine BREEAM rating from weighted score. |
| `BREEAMCalculator._points_to_next_level` | current, level | Calculate points to next BREEAM level. |
| `BREEAMCalculator._identify_highest_performing` | scores | Identify top performing categories. |
| `BREEAMCalculator._identify_improvements` | scores, weights | Identify improvement priorities with impact analysis. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `mock-sample`

**Database tables:** `DB` *(shared)*, `api` *(shared)*, `datetime` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `typing` *(shared)*, `uuid` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/exports/bulk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['exports'], 'n_keys': 1}`

**GET /api/v1/exports/portfolio-analytics/{portfolio_id}** — status `failed`, provenance ['db-empty'], source tables: `assets_pg`, `portfolios_pg`
Output: `None`

**GET /api/v1/exports/portfolio-analytics/{portfolio_id}/dashboard** — status `passed`, provenance ['db-empty'], source tables: `assets_pg`, `portfolios_pg`
Output: `{'type': 'StreamingResponse', 'repr': '<starlette.responses.StreamingResponse object at 0x000002C07FA8D640>'}`

**GET /api/v1/exports/scenario-analysis/{portfolio_id}/scenarios** — status `passed`, provenance ['db-empty'], source tables: `assets_pg`, `portfolios_pg`
Output: `{'type': 'StreamingResponse', 'repr': '<starlette.responses.StreamingResponse object at 0x000002C07FB515E0>'}`

**GET /api/v1/exports/sustainability/certifications** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'StreamingResponse', 'repr': '<starlette.responses.StreamingResponse object at 0x000002C07FF0D940>'}`

## 5 · Intermediate Transformation Logic

**Engine `export_service` — extracted transformation lines:**
```python
table = Table(summary_data, colWidths=[2*inch, 3*inch])
table = Table(overview_data, colWidths=[2*inch, 3*inch])
table = Table(prop_data, colWidths=[2*inch, 1*inch, 1.5*inch, 1*inch, 0.7*inch])
table = Table(score_data, colWidths=[2*inch, 2*inch])
table = Table(value_data, colWidths=[2.5*inch, 2*inch])
table = Table(risk_data, colWidths=[2.5*inch, 2*inch])
table = Table(table_data, colWidths=[1.8*inch, 1.2*inch, 1*inch, 0.9*inch, 1.2*inch])
table = Table(summary_data, colWidths=[2*inch, 3*inch])
```

**Engine `portfolio_analytics_engine` — extracted transformation lines:**
```python
estimated_s1  = (intensity * revenue_meur).quantize(
reporting_year = datetime.now(timezone.utc).year - 1
coverage_pct=float(portfolio_result.coverage_pct) / 100.0,
reporting_year = datetime.now(timezone.utc).year - 1
```

**Engine `sustainability_calculator` — extracted transformation lines:**
```python
management_score = scores.management + scores.policy + scores.risk_management
performance_score = scores.stakeholder_engagement + scores.performance_indicators
value_premium = rent_premium * VALUE_PREMIUM_MULTIPLIER
yoy_change = total_score - request.prior_year_score
potential = max_val - current
value_premium = rent_premium * VALUE_PREMIUM_MULTIPLIER
rent_premium = rent_premium * regional_adj * sector_adj
value_premium = value_premium * regional_adj * sector_adj
percentages[cat] = (current / max_val) * 100 if max_val > 0 else 0
weakest = [cat for cat, pct in sorted_cats[-3:] if pct < 70]
remaining = max_val - current
value_premium = rent_premium * VALUE_PREMIUM_MULTIPLIER
rent_premium = rent_premium * regional_adj * sector_adj
value_premium = value_premium * regional_adj * sector_adj
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).
**Shared engines (edits propagate!):** `portfolio_analytics_engine` (used by 9 modules), `sustainability_calculator` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `api::portfolio_analytics` | engine:portfolio_analytics_engine |
| `api::sustainability` | engine:sustainability_calculator |