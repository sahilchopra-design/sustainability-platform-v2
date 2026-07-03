# Api::Regulatory_Reports
**Module ID:** `api::regulatory_reports` · **Route:** `/api/v1/regulatory-reports` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/regulatory-reports/compile/tcfd` | `compile_tcfd` | api/v1/routes/regulatory_reports.py |
| POST | `/api/v1/regulatory-reports/compile/sfdr` | `compile_sfdr` | api/v1/routes/regulatory_reports.py |
| POST | `/api/v1/regulatory-reports/compile/gri305` | `compile_gri305` | api/v1/routes/regulatory_reports.py |
| POST | `/api/v1/regulatory-reports/compile/sec-climate` | `compile_sec_climate` | api/v1/routes/regulatory_reports.py |
| POST | `/api/v1/regulatory-reports/compile/issb` | `compile_issb` | api/v1/routes/regulatory_reports.py |
| POST | `/api/v1/regulatory-reports/compile/apra-cpg229` | `compile_apra_cpg229` | api/v1/routes/regulatory_reports.py |
| POST | `/api/v1/regulatory-reports/compile/brsr` | `compile_brsr` | api/v1/routes/regulatory_reports.py |
| GET | `/api/v1/regulatory-reports/frameworks` | `list_frameworks` | api/v1/routes/regulatory_reports.py |
| GET | `/api/v1/regulatory-reports/ref/tcfd-structure` | `ref_tcfd` | api/v1/routes/regulatory_reports.py |
| GET | `/api/v1/regulatory-reports/ref/sfdr-pai` | `ref_sfdr_pai` | api/v1/routes/regulatory_reports.py |
| GET | `/api/v1/regulatory-reports/ref/gri305` | `ref_gri305` | api/v1/routes/regulatory_reports.py |
| GET | `/api/v1/regulatory-reports/ref/sec-climate` | `ref_sec_climate` | api/v1/routes/regulatory_reports.py |
| GET | `/api/v1/regulatory-reports/ref/brsr-framework` | `ref_brsr_framework` | api/v1/routes/regulatory_reports.py |

### 2.3 Engine `regulatory_report_compiler` (services/regulatory_report_compiler.py)
| Function | Args | Purpose |
|---|---|---|
| `RegulatoryReportCompiler.compile_tcfd` | entity_data, period_start, period_end | Compile TCFD 11-recommendation structured disclosure. |
| `RegulatoryReportCompiler._auto_populate_tcfd` | rec_id, data | Auto-populate TCFD data points from platform engines. |
| `RegulatoryReportCompiler._tcfd_recommendations` | sections |  |
| `RegulatoryReportCompiler.compile_sfdr_periodic` | fund_data, period_start, period_end | Compile SFDR periodic disclosure (Annex III Art.8 / Annex IV Art.9). |
| `RegulatoryReportCompiler._compile_pai_indicators` | fund_data | Compile SFDR PAI mandatory indicators. |
| `RegulatoryReportCompiler._sfdr_recommendations` | sections, article |  |
| `RegulatoryReportCompiler.compile_gri305` | entity_data, period_start, period_end | Compile GRI 305 emissions disclosure. |
| `RegulatoryReportCompiler._gri305_recommendations` | sections |  |
| `RegulatoryReportCompiler.compile_sec_climate` | entity_data, period_start, period_end | Compile SEC Climate-Related Disclosures (Reg S-K Subpart 1500). |
| `RegulatoryReportCompiler._sec_recommendations` | sections |  |
| `RegulatoryReportCompiler.compile_issb` | entity_data, period_start, period_end | Compile IFRS S1 (General) + S2 (Climate) disclosure. |
| `RegulatoryReportCompiler._issb_recommendations` | sections |  |
| `RegulatoryReportCompiler.compile_apra_cpg229` | entity_data, period_start, period_end | Compile APRA CPG 229 Climate Change Financial Risks assessment. |
| `RegulatoryReportCompiler.compile_brsr` | entity_data, period_start, period_end | Compile SEBI BRSR + BRSR Core with GRI and ESRS cross-reference. |
| `RegulatoryReportCompiler._brsr_recommendations` | sections, core_pct, principle_pct | Generate BRSR-specific recommendations. |
| `RegulatoryReportCompiler.render_html` | report | Render a CompiledReport to a self-contained HTML string. |
| `RegulatoryReportCompiler.render_pdf_bytes` | report | Render a CompiledReport to PDF bytes via WeasyPrint. |
| `RegulatoryReportCompiler.get_supported_frameworks` |  | Return list of supported regulatory frameworks. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/regulatory-reports/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks'], 'n_keys': 1}`

**GET /api/v1/regulatory-reports/ref/brsr-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['brsr_framework'], 'n_keys': 1}`

**GET /api/v1/regulatory-reports/ref/gri305** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['gri305_template'], 'n_keys': 1}`

**GET /api/v1/regulatory-reports/ref/sec-climate** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sec_climate_template'], 'n_keys': 1}`

**GET /api/v1/regulatory-reports/ref/sfdr-pai** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sfdr_pai_template'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `regulatory_report_compiler` — extracted transformation lines:**
```python
comp_pct = (disclosed / total_guidance * 100) if total_guidance else 0
overall_pct = (total_disclosed / total_guidance_points * 100) if total_guidance_points else 0
completeness_pct=round(inv_disclosed / len(fields) * 100, 1),
completeness_pct=min(100.0, len(top_inv) / 15 * 100),
overall_pct = sum(s.completeness_pct for s in sections) / len(sections) if sections else 0
completeness_pct=round(reported_unique / unique_pais * 100, 1),
overall = sum(s.completeness_pct for s in sections) / len(sections) if sections else 0
overall = sum(s.completeness_pct for s in sections) / len(sections) if sections else 0
comp = (disclosed / len(fields) * 100) if fields else 0
comp = (disclosed / len(fields) * 100) if fields else 0
overall = sum(s.completeness_pct for s in sections) / len(sections) if sections else 0
comp = (disclosed / total * 100) if total else 0
overall = sum(s.completeness_pct for s in sections) / len(sections) if sections else 0
a_pct = (a_disclosed / a_total_fields * 100) if a_total_fields else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).