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
