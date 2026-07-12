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
| `ExportService.export` | module, data, format | Universal export method that routes to appropriate generator. Args: module: One of 'portfolio_analytics', 'sustainability', 'stranded_assets', 'scenario_analysis', 'nature_risk', 'valuation' data: The data to export format: 'pdf' or 'excel' Returns: BytesIO buffer with the generated file |

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
| `BREEAMCalculator._calculate_percentile` | score, regional_avg | Estimate percentile based on score. |
| `ValueImpactCalculator.calculate_value_impact` | request | Calculate value impact of certification. |
| `ValueImpactCalculator._get_cap_rate_compression` | cert_type, level | Get cap rate compression for certification. |
| `ValueImpactCalculator._get_source_studies` | cert_type | Get academic/industry source studies for premiums. |
| `PortfolioSustainabilityCalculator.analyze_portfolio` | request | Analyze portfolio sustainability metrics. |
| `PortfolioSustainabilityCalculator._generate_recommendations` | coverage, score, by_type, uncertified | Generate portfolio improvement recommendations. |
| `SustainabilityEngine.calculate_gresb` | request |  |
| `SustainabilityEngine.calculate_leed` | request |  |
| `SustainabilityEngine.calculate_breeam` | request |  |
| `SustainabilityEngine.calculate_value_impact` | request |  |
| `SustainabilityEngine.analyze_portfolio` | request |  |

**Engine `sustainability_calculator` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `RENT_PREMIUMS` | `{CertificationType.LEED: {LEEDLevel.CERTIFIED: {'low': Decimal('2.0'), 'mid': Decimal('4.0'), 'high': Decimal('6.0')}, LEEDLevel.SILVER: {'low': Decimal('4.0'), 'mid': Decimal('6.0'), 'high': Decimal('8.0')}, LEEDLevel.GOLD: {'low': Decimal('6.0'), 'mid': Decimal('9.0'), 'high': Decimal('12.0')}, LE` |
| `CAP_RATE_COMPRESSION` | `{CertificationType.LEED: {LEEDLevel.CERTIFIED: 15, LEEDLevel.SILVER: 25, LEEDLevel.GOLD: 40, LEEDLevel.PLATINUM: 60}, CertificationType.BREEAM: {BREEAMLevel.PASS: 10, BREEAMLevel.GOOD: 20, BREEAMLevel.VERY_GOOD: 35, BREEAMLevel.EXCELLENT: 50, BREEAMLevel.OUTSTANDING: 70}}` |
| `OPERATING_COST_SAVINGS` | `{CertificationType.LEED: Decimal('8.0'), CertificationType.BREEAM: Decimal('7.0'), CertificationType.ENERGY_STAR: Decimal('10.0'), CertificationType.WELL: Decimal('3.0')}` |
| `GRESB_BENCHMARKS` | `{Region.NORTH_AMERICA: {'peer_avg_score': Decimal('72'), 'top_quartile_threshold': Decimal('82'), 'bottom_quartile_threshold': Decimal('60'), 'num_peers': 450}, Region.EUROPE: {'peer_avg_score': Decimal('76'), 'top_quartile_threshold': Decimal('86'), 'bottom_quartile_threshold': Decimal('65'), 'num_` |
| `GRESB_RATING_THRESHOLDS` | `{GRESBRating.FIVE_STAR: 80, GRESBRating.FOUR_STAR: 60, GRESBRating.THREE_STAR: 40, GRESBRating.TWO_STAR: 20, GRESBRating.ONE_STAR: 0}` |
| `LEED_LEVEL_THRESHOLDS` | `{LEEDLevel.PLATINUM: 80, LEEDLevel.GOLD: 60, LEEDLevel.SILVER: 50, LEEDLevel.CERTIFIED: 40}` |
| `BREEAM_LEVEL_THRESHOLDS` | `{BREEAMLevel.OUTSTANDING: Decimal('85'), BREEAMLevel.EXCELLENT: Decimal('70'), BREEAMLevel.VERY_GOOD: Decimal('55'), BREEAMLevel.GOOD: Decimal('45'), BREEAMLevel.PASS: Decimal('30')}` |
| `REGIONAL_ADJUSTMENTS` | `{Region.NORTH_AMERICA: Decimal('1.0'), Region.EUROPE: Decimal('1.1'), Region.ASIA_PACIFIC: Decimal('0.9'), Region.MIDDLE_EAST: Decimal('0.85'), Region.LATIN_AMERICA: Decimal('0.75'), Region.AFRICA: Decimal('0.7')}` |
| `SECTOR_ADJUSTMENTS` | `{PropertySector.OFFICE: Decimal('1.0'), PropertySector.RETAIL: Decimal('0.85'), PropertySector.INDUSTRIAL: Decimal('0.7'), PropertySector.MULTIFAMILY: Decimal('0.9'), PropertySector.HOTEL: Decimal('0.8'), PropertySector.HEALTHCARE: Decimal('0.95'), PropertySector.DATA_CENTER: Decimal('0.6'), Propert` |

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
Output: `{'type': 'StreamingResponse', 'repr': '<starlette.responses.StreamingResponse object at 0x0000013D4A1C20F0>'}`

**GET /api/v1/exports/scenario-analysis/{portfolio_id}/scenarios** — status `passed`, provenance ['db-empty'], source tables: `assets_pg`, `portfolios_pg`
Output: `{'type': 'StreamingResponse', 'repr': '<starlette.responses.StreamingResponse object at 0x0000013D4A215670>'}`

**GET /api/v1/exports/sustainability/certifications** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'StreamingResponse', 'repr': '<starlette.responses.StreamingResponse object at 0x0000013D4A148380>'}`

**POST /api/v1/exports/carbon/calculation** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/exports/nature-risk/assessment** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'StreamingResponse', 'repr': '<starlette.responses.StreamingResponse object at 0x0000013D4A1ED6A0>'}`

**POST /api/v1/exports/scenario-analysis/comparison** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'StreamingResponse', 'repr': '<starlette.responses.StreamingResponse object at 0x0000013D4A1C1790>'}`

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
rent_premium = rent_mid * regional_adj * sector_adj
value_premium = rent_premium * VALUE_PREMIUM_MULTIPLIER
annual_rent_increase = rent_premium_psf * request.gross_floor_area_sf
coverage = (len(certified_assets) / total_assets * 100) if total_assets > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).
**Shared engines (edits propagate!):** `portfolio_analytics_engine` (used by 9 modules), `sustainability_calculator` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `api::portfolio_analytics` | engine:portfolio_analytics_engine |
| `api::sustainability` | engine:sustainability_calculator |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/exports` is the platform's **document-generation domain**: it computes no new analytics of its own but pulls results from three backing services and renders them to downloadable PDF (ReportLab) or Excel (xlsxwriter/openpyxl) via `backend/services/export_service.py`:

| Endpoint | Backing computation |
|---|---|
| `GET /exports/portfolio-analytics/{id}` (+ `/dashboard`) | `PortfolioAggregationEngine` → PCAF Standard v2.0 financed-emissions run (`portfolio_analytics_engine.run_pcaf_calculation`) with report types executive/valuation/climate_risk/sustainability/tcfd/investor |
| `GET /exports/scenario-analysis/{id}/scenarios`, `POST /comparison` | scenario comparison tables (total value, Δ%, risk score, VaR 95%) |
| `POST /exports/carbon/calculation` | caller-supplied carbon calculation payload → formatted report |
| `POST /exports/nature-risk/assessment` | nature-risk assessment payload → formatted report |
| `GET /exports/sustainability/certifications` | `SustainabilityEngine` (GRESB / LEED / BREEAM calculators + certification value-impact model) |
| `GET /exports/bulk` | multi-module batch export |

`ExportService.export(module, data, format)` routes to one of four generator pairs (portfolio_analytics, sustainability, stranded_assets, scenario_analysis); unknown modules fall back to the portfolio-analytics template.

### 7.2 Parameterisation

The service itself is presentation logic: branded paragraph styles (title #1e3a5f, section header #2563eb, sustainability green #16a34a, stranded-asset red #dc2626, scenario purple #7c3aed), A4 pages with 40pt margins, property tables truncated at 20 rows in PDF (unlimited in Excel). A `DecimalEncoder`/`_serialize_data` layer converts Decimal→float, UUID→str, datetime→ISO recursively so engine dataclasses serialise cleanly.

The quantitative content comes from the upstream engines:

- **`portfolio_analytics_engine.py`** — real DB-backed PCAF calculation over `assets_pg`/`portfolios_pg` (migration 019 columns). Emissions resolution ladder assigns the PCAF **Data Quality Score**: DQS 3 when reported scope1/2/3 columns exist, DQS 4 via Data Hub LEI lookup, DQS 5 as sector-average intensity × revenue proxy (`_SECTOR_INTENSITY_TCO2E_MEUR`, default 200 tCO₂e/€M). Asset types map to 9 PCAF asset classes (Bond→corporate_bonds … Sovereign→sovereign_bonds; unknown→business_loans). Results (WACI history, glidepaths) persist to `pcaf_time_series`.
- **`sustainability_calculator.py`** — GRESB (component scores → star rating → percentile → rent premium/cap-rate compression), LEED (points → Certified/Silver/Gold/Platinum), BREEAM (weighted category score → Pass…Outstanding), plus a `ValueImpactCalculator` that converts certification level into rent/value premia and cap-rate compression with cited source studies.

### 7.3 Calculation walkthrough

Request → engine call (e.g. `reports.generate_report(portfolio_id, ReportType, include_property_details)`) → `_serialize_data` → template selection → `StreamingResponse` with `Content-Disposition: attachment` and a dated filename (`portfolio_analytics_<id8>_<YYYYMMDD>.pdf|xlsx`). Errors map to 404 (`ValueError`, e.g. unknown portfolio) or 500. Report sections are conditional on payload keys — e.g. the sustainability PDF prints Overall Score + Rating, then a Value Impact table (`estimated_rent_premium_percent`, `cap_rate_compression_bps`), then up to 5 recommendations.

### 7.4 Worked example — DQS-5 fallback inside an exported PCAF report

A portfolio asset with no reported emissions, no LEI, sector "Unknown", exposure €50M:

| Step | Computation | Result |
|---|---|---|
| DQS ladder | no scope1 column → no LEI → sector proxy | DQS **5** |
| Intensity | `_SECTOR_INTENSITY_TCO2E_MEUR.get("Unknown", 200)` | 200 tCO₂e/€M |
| Revenue proxy | `annual_revenue_eur` absent → falls back to exposure | €50M |
| Estimated Scope 1 | 200 × 50 | **10,000 tCO₂e** (S2 = S3 = 0) |
| EVIC fallback | `evic_eur` absent → enterprise value := outstanding €50M | attribution factor 1.0 |

That 10,000 tCO₂e then flows through the PCAF/WACI engine into the exported executive summary ("Total Value", "Avg Risk Score", "Stranded Assets" KPI table) — so a report cell's provenance can be a level-5 estimate; the DQS distribution in the payload is the tell.

### 7.5 Data provenance & limitations

- **No PRNG, no synthetic seeds in this domain** — exported figures are whatever the backing engines return, which for portfolio analytics is genuine DB data (with the documented DQS-5 proxy fallback) and for POST endpoints is caller-supplied.
- The export layer performs **no validation or recomputation** — inconsistent upstream payloads render verbatim; missing keys silently render "N/A"/0 rather than erroring.
- PDF property tables truncate to 20 rows and 25/20-char name/location strings; Excel has no such limits — the two formats can therefore show different row counts for the same report.
- Reporting year is hard-coded to `current_year − 1` in the PCAF run; DQS-4 Data Hub lookups fail soft (logged, drop to DQS 5).
- Formatting quirk: sustainability/stranded Excel writers emit percentages and currency as pre-formatted *strings* (e.g. `"+4.0%"`), so those cells are not numerically usable downstream, unlike the scenario sheet which writes numeric cells with number formats.

### 7.6 Framework alignment

- **PCAF Global GHG Accounting Standard (v2.0, Part A)** — the portfolio exports carry PCAF-attributed financed emissions with the standard's 1–5 Data Quality Score ladder (1 = verified reported, 5 = economic-activity proxy); this module implements levels 3–5 (reported columns / third-party hub / sector-intensity estimate).
- **TCFD** — `report_type=tcfd` produces a TCFD-structured portfolio report from the same engine output (metrics & targets pillar data: WACI, financed emissions, DQS).
- **SFDR PAI** — `run_pcaf_calculation` returns a `pai_indicators` block, aligning exported metrics to SFDR Annex I principal adverse impact reporting.
- **GRESB / LEED / BREEAM** — certification exports reproduce each scheme's real rubric: GRESB scores components to a 0–100 total mapped to 1–5 stars by peer-percentile benchmarking; LEED sums credit points against 40/50/60/80 thresholds; BREEAM weights category scores against Pass(≥30)…Outstanding(≥85)-style bands — with modelled rent-premium/cap-rate-compression value impacts attributed to named market studies.

## 9 · Future Evolution

### 9.1 Evolution A — Provenance-stamped exports over repaired data paths (analytics ladder: rung 1 → 2)

**What.** The platform's document-generation domain: it computes no new analytics, pulling from
three backing services — `portfolio_analytics_engine` (PCAF v2.0 financed-emissions runs with
executive/valuation/climate_risk/tcfd/investor report types), scenario comparison tables, and
`SustainabilityEngine` (GRESB/LEED/BREEAM calculators with a rent/value-premium model) — and
rendering to PDF (ReportLab) or Excel via `ExportService`. §4.2 shows the weakness: the portfolio
export paths trace **failed / db-empty** against `assets_pg`/`portfolios_pg`, and provenance
classes include `mock-sample` — meaning some generated documents can render sample data with the
same polish as real data. Evolution A makes exports trustworthy artifacts.

**How.** (1) Fix the failing `GET /exports/portfolio-analytics/{id}` path (shares the
`portfolio_pg` read defect) so exports run against real stored portfolios. (2) Stamp every
generated document with a provenance block: source engine + version, data as-of date, portfolio id,
and — critically — an explicit SAMPLE watermark whenever any section rendered from mock/seed data,
so a PDF can't silently launder sample numbers into a board pack. (3) Add the lineage-trace
reference (the platform already produces `lineage_output/traces/`) to the document footer for
auditability. (4) Snapshot-test the PDF/Excel table contents against the backing engines' outputs.

**Prerequisites.** `portfolios_pg`/`assets_pg` read repairs (shared with `portfolio_pg` Evolution
A); engine version stamps (roadmap engine-registry work). **Acceptance:** portfolio exports return
`passed` on a real portfolio; every document carries source, version, and as-of metadata; any
mock-sample content renders with a visible SAMPLE watermark; snapshot tests match engine outputs.

### 9.2 Evolution B — Report-drafting output layer for every copilot (LLM tier 2 → 3)

**What.** This domain is the roadmap's designated *render layer* for tier-3: LLM-drafted,
engine-sourced memos become downloadable documents here. The copilot interaction is "export my
climate-risk pack for portfolio X as PDF, with an executive summary" — the copilot calls the export
endpoints for the tables and contributes only the narrative prose, never the numbers.

**How.** Register the export endpoints as the terminal tools in desk-orchestrator chains: after the
PCAF/scenario/nature copilots compute, the orchestrator routes results through
`/exports/{module}` with the chosen report type, and the LLM's drafted narrative is inserted as
labelled commentary sections distinct from engine-rendered tables. The no-fabrication contract is
structural here: tables come from `ExportService`'s engine pulls; the LLM text is visually
demarcated commentary. Bulk export (`GET /exports/bulk`) serves multi-module packs.

**Prerequisites.** Evolution A's provenance stamps and read repairs — an LLM-assembled document
without the SAMPLE watermark discipline would be the platform's highest-risk fabrication surface;
demarcation styling in the templates. **Acceptance:** every table in an exported document matches
its backing engine's response; LLM narrative sections are visually and structurally distinguished
from engine tables; a document containing any sample data carries the watermark; export actions
log portfolio id and engine versions to audit.