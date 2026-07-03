# Api::Sfdr_Product_Reporting
**Module ID:** `api::sfdr_product_reporting` · **Route:** `/api/v1/sfdr-product-reporting` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sfdr-product-reporting/generate-report` | `generate_report` | api/v1/routes/sfdr_product_reporting.py |
| POST | `/api/v1/sfdr-product-reporting/verify-sustainable-investment` | `verify_sustainable_investment` | api/v1/routes/sfdr_product_reporting.py |
| GET | `/api/v1/sfdr-product-reporting/ref/pai-indicators` | `ref_pai_indicators` | api/v1/routes/sfdr_product_reporting.py |
| GET | `/api/v1/sfdr-product-reporting/ref/sfdr-articles` | `ref_sfdr_articles` | api/v1/routes/sfdr_product_reporting.py |
| GET | `/api/v1/sfdr-product-reporting/ref/sustainable-investment-criteria` | `ref_sustainable_investment_criteria` | api/v1/routes/sfdr_product_reporting.py |
| GET | `/api/v1/sfdr-product-reporting/ref/rts-sections/{article}` | `ref_rts_sections` | api/v1/routes/sfdr_product_reporting.py |
| GET | `/api/v1/sfdr-product-reporting/ref/reporting-timeline` | `ref_reporting_timeline` | api/v1/routes/sfdr_product_reporting.py |
| GET | `/api/v1/sfdr-product-reporting/ref/dnsh-objectives` | `ref_dnsh_objectives` | api/v1/routes/sfdr_product_reporting.py |

### 2.3 Engine `sfdr_product_reporting_engine` (services/sfdr_product_reporting_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SFDRProductReportingEngine.generate_report` | product_id, product_name, sfdr_article, reporting_period, sections_completed, benchmark_index |  |
| `SFDRProductReportingEngine.verify_sustainable_investment` | product_id, holdings | Aggregate sustainable-investment qualification from real holdings. |
| `SFDRProductReportingEngine.ref_pai_indicators` |  |  |
| `SFDRProductReportingEngine.ref_sfdr_articles` |  |  |
| `SFDRProductReportingEngine.ref_sustainable_investment_criteria` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sfdr-product-reporting/ref/dnsh-objectives** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['objectives', 'rule'], 'n_keys': 2}`

**GET /api/v1/sfdr-product-reporting/ref/pai-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['PAI-1', 'PAI-2', 'PAI-3', 'PAI-4', 'PAI-5', 'PAI-6', 'PAI-7', 'PAI-8', 'PAI-9', 'PAI-10', 'PAI-11', 'PAI-12', 'PAI-13', 'PAI-14'], 'n_keys': 14}`

**GET /api/v1/sfdr-product-reporting/ref/reporting-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'applies_from', 'periodic_report_deadline', 'article_8_annex', 'article_9_annex', 'pai_statement_deadline', 'website_disclosure'], 'n_keys': 7}`

**GET /api/v1/sfdr-product-reporting/ref/rts-sections/{article}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/sfdr-product-reporting/ref/sfdr-articles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['8', '9'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic

**Engine `sfdr_product_reporting_engine` — extracted transformation lines:**
```python
delta = round(val - bench, 2) if (val is not None and bench is not None) else None
report.pai_coverage_pct = round(sum(covs) / len(covs), 1) if covs else None
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).