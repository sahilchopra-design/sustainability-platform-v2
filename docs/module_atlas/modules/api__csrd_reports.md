# Api::Csrd_Reports
**Module ID:** `api::csrd_reports` · **Route:** `/api/csrd` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/csrd/reports/upload` | `upload_csrd_pdf` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/reports` | `list_reports` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/reports/{report_id}` | `get_report` | api/v1/routes/csrd_reports.py |
| POST | `/api/csrd/reports/{report_id}/reprocess` | `reprocess_report` | api/v1/routes/csrd_reports.py |
| POST | `/api/csrd/ingest/bulk` | `bulk_ingest` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/entities` | `list_entities` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/entities/{entity_id}/kpis` | `get_entity_kpis` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/entities/{entity_id}/gaps` | `get_entity_gaps` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/entities/{entity_id}/dashboard` | `get_entity_dashboard` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/entities/{entity_id}/lineage` | `get_entity_lineage` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/catalog` | `list_catalog` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/catalog/summary/standards` | `catalog_summary_by_standard` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/catalog/summary/modules` | `catalog_summary_by_module` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/catalog/{indicator_code}` | `get_catalog_item` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/gri/standards` | `list_gri_standards` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/gri/standards/summary` | `gri_standards_summary` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/gri/mapping` | `list_gri_esrs_mapping` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/gri/mapping/summary` | `gri_mapping_summary` | api/v1/routes/csrd_reports.py |
| GET | `/api/csrd/gri/mapping/esrs/{indicator_code}` | `get_gri_for_esrs` | api/v1/routes/csrd_reports.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `ESRS_INDICATORS`, `csrd_data_lineage`, `csrd_entity_registry` *(shared)*, `csrd_esrs_catalog`, `csrd_gap_tracker` *(shared)*, `csrd_kpi_values` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `gri_esrs_mapping`, `gri_standards`, `pathlib` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `workers` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/csrd/catalog** — status `passed`, provenance ['real-db'], source tables: `csrd_esrs_catalog`
Output: `{'type': 'object', 'keys': ['total', 'page', 'page_size', 'items'], 'n_keys': 4}`

**GET /api/csrd/catalog/summary/modules** — status `passed`, provenance ['real-db'], source tables: `csrd_esrs_catalog`
Output: `{'type': 'object', 'keys': ['modules'], 'n_keys': 1}`

**GET /api/csrd/catalog/summary/standards** — status `passed`, provenance ['real-db'], source tables: `csrd_esrs_catalog`
Output: `{'type': 'object', 'keys': ['standards', 'total_data_points'], 'n_keys': 2}`

**GET /api/csrd/catalog/{indicator_code}** — status `failed`, provenance ['db-empty'], source tables: `csrd_esrs_catalog`
Output: `None`

**GET /api/csrd/entities** — status `passed`, provenance ['real-db'], source tables: `csrd_entity_registry`
Output: `{'type': 'array', 'len': 15, 'item0_keys': ['id', 'legal_name', 'primary_sector', 'country_iso', 'created_at']}`

**GET /api/csrd/entities/{entity_id}/dashboard** — status `passed`, provenance ['real-db'], source tables: `csrd_data_lineage`, `csrd_entity_registry`, `csrd_gap_tracker`, `csrd_kpi_values`
Output: `{'type': 'object', 'keys': ['entity', 'kpi_by_standard', 'gap_summary', 'kpis_disclosed', 'kpi_count', 'gaps_open', 'gap_count', 'disclosure_coverage_score_pct', 'recent_lineage'], 'n_keys': 9}`

**GET /api/csrd/entities/{entity_id}/gaps** — status `passed`, provenance ['db-empty'], source tables: `csrd_gap_tracker`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/csrd/entities/{entity_id}/kpis** — status `passed`, provenance ['real-db'], source tables: `csrd_kpi_values`
Output: `{'type': 'array', 'len': 7, 'item0_keys': ['indicator_code', 'reporting_year', 'numeric_value', 'text_value', 'unit', 'data_quality_score', 'status', 'report_page_reference', 'extraction_method', 'created_at', 'updated_at', 'is_assured', 'assurance_level', 'coverage_pct']}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/api/v1/routes/csrd_reports.py` at `/api/csrd` — the CSRD report-ingestion and ESRS/GRI
catalog service. There is no `services/*` engine; extraction runs in the background worker
`workers/tasks/csrd_tasks.py` (`process_csrd_report_task`), and everything else is SQL over the
`csrd_*` and `gri_*` tables.)*

### 7.1 What the module computes

Three functional blocks:

1. **PDF ingestion pipeline** — `POST /reports/upload` (202 Accepted) stores the PDF
   (≤100 MB, `.pdf` only) under `CSRD_UPLOAD_DIR`, writes a `csrd_report_uploads` row, and
   queues the extraction task. Per the endpoint's own docstring the worker runs: *pdfplumber
   text + table extraction → regex-based ESRS indicator matching (Scope 1/2/3, water, waste,
   headcount…) → confidence scoring and unit normalisation → idempotent persistence* into
   `csrd_kpi_values`, `csrd_gap_tracker`, `csrd_data_lineage`. `POST /reports/{id}/reprocess`
   and `POST /ingest/bulk` re-trigger the task (bulk skips uploads whose file is missing on
   disk).
2. **Entity analytics** — `GET /entities`, `/entities/{id}/kpis`, `/gaps`, `/lineage`, and the
   `/dashboard` roll-up. The dashboard contains the module's only real formula:
   ```python
   total_mandatory = 12          # hardcoded from ESRS_INDICATORS mandatory=True
   gaps_open      = gap_summary["open"] + gap_summary["in_progress"]
   coverage_score = max(0, (total_mandatory − gaps_open) / total_mandatory) × 100
   ```
   plus KPI counts grouped by ESRS standard (`SPLIT_PART(indicator_code,'-',1)`), average
   data-quality score, and assured-KPI counts.
3. **Standards catalogs** — read-only browse/search over the ingested **ESRS data-point
   catalog** (documented as 1,184 data points in `csrd_esrs_catalog`), the **GRI Standards
   taxonomy** (2,230 elements / 1,143 concrete data points in `gri_standards`), and the
   **ESRS↔GRI mapping** (649 rows in `gri_esrs_mapping`), with per-standard and per-module
   summary aggregations.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `MAX_PDF_SIZE` | 100 MB | route constant |
| Valid sectors | 10 enum values (financial_institution … other); invalid → `other` | route constant |
| `total_mandatory` | 12 | hardcoded, commented as the count of `mandatory=True` entries in the worker's `ESRS_INDICATORS` set |
| Gap statuses counted "open" | `open`, `in_progress` | dashboard code |
| Coverage-summary linkage | `coverage_pct = gri_linked / total_dps × 100` per standard | `/gri/mapping/summary` |

The ESRS catalog schema is rich and standards-faithful: per data point it stores DR code,
paragraph reference, mandatory/voluntary/conditional flags, **phase-in relief** columns
(`phase_in_less_750`, `phase_in_all_undertakings`, `esrs_phase_in`, `smei_exemption`),
`sfdr_pillar3_benchmark` linkage, XBRL tag, and cross-references to GRI, TCFD pillar, ISSB,
BRSR and SDGs — mirroring the structure of EFRAG's published ESRS data-point list (EFRAG IG 3).

### 7.3 Calculation walkthrough

Upload → the route persists metadata (caller can override detected entity name/year) and
returns immediately; the client polls `GET /reports/{id}` whose summary carries
`kpis_extracted`, `kpis_updated`, `gaps_found`, `lineage_entries`, `validation_summary`,
`mandatory_gaps` and `indicators_attempted` from the worker's `extraction_summary` JSON.
Dashboard → four queries (entity registry row; KPI counts by standard×year; gap counts by
status; last 20 lineage rows) are stitched into one JSON. Entity matching throughout uses a
UUID-prefix pattern (`CAST(entity_registry_id AS text) LIKE :eid%`), so short ID prefixes
resolve. Lineage rows expose the full audit chain per KPI: source document, raw value/unit,
`transformation_applied`, output value/unit, tool name+version — the platform's
document-to-datapoint provenance trail.

### 7.4 Worked example — disclosure coverage score

An entity's gap tracker holds 5 gaps: 3 `open`, 1 `in_progress`, 1 `closed`.
`gaps_open = 3 + 1 = 4`; `coverage = max(0, (12 − 4)/12) × 100 = 66.7%`.
If 14 gaps were somehow open (more than the mandatory set), the `max(0, ·)` clamp keeps the
score at 0 rather than negative. Note the score depends **only** on the gap tracker — the
`kpis_disclosed` count shown beside it does not enter the formula.

### 7.5 Companion catalog analytics

- `/catalog/summary/standards` — per ESRS standard: total/quantitative/qualitative/mandatory
  data points, DR-name and AR-text coverage, distinct DR count.
- `/catalog/summary/modules` — data points grouped by the platform module that consumes them
  (`module_mapping`), enabling "which module covers which ESRS datapoint" traceability.
- `/gri/mapping/esrs/{code}` — all GRI disclosures mapped to one ESRS datapoint with
  `mapping_quality` and notes; `/gri/mapping/summary` reports interoperability coverage both
  from the mapping table and from `gri_disclosure_ref` back-links in the ESRS catalog.

### 7.6 Data provenance & limitations

- **No PRNG / synthetic seeds in this module.** KPI values come from real uploaded PDFs via
  the worker's extraction; catalog tables are ingested reference data (EFRAG ESRS data-point
  list structure; GRI taxonomy; ESRS-GRI correspondence). Extraction *quality*, however, is
  regex-based per the docstring — a heuristic, not an NLP/ML pipeline; confidence scoring and
  unit normalisation logic live in the worker and are not verifiable from this route file.
- `total_mandatory = 12` is a hardcoded mirror of the worker's mandatory indicator set; if the
  worker's set changes, the coverage denominator silently drifts. It also measures coverage
  against the *extraction pipeline's* 12 tracked mandatory indicators, not the full ESRS
  mandatory datapoint population in the catalog (hundreds of points).
- Free-text catalog filters are interpolated as SQL fragments with **bound parameters** (safe),
  but the `WHERE {where_clause}` string-building pattern means new filters must preserve that
  discipline.
- Dashboard `avg_data_quality_score` is a plain average of whatever DQ scores the extractor
  wrote; no weighting by indicator materiality.

### 7.7 Framework alignment

- **CSRD (Directive (EU) 2022/2464) / ESRS Set 1** — the catalog encodes the delegated-act
  structure: standards (ESRS 2, E1–E5, S1–S4, G1), Disclosure Requirements, Application
  Requirements (AR text), mandatory-vs-voluntary flags, and the real phase-in reliefs (e.g.
  <750-employee deferrals) as first-class columns.
- **EFRAG ESRS↔GRI interoperability** — the 649-row mapping table operationalises the
  EFRAG–GRI correspondence so a GRI reporter can locate equivalent ESRS datapoints (and vice
  versa), with per-mapping quality grading.
- **GRI Standards** — the 2,230-element taxonomy (abstract grouping elements vs concrete
  disclosures) follows GRI's XBRL-style taxonomy structure.
- **SFDR / Pillar 3 / benchmarks** — `sfdr_pillar3_benchmark` flags ESRS datapoints that feed
  SFDR PAI, banking Pillar 3 ESG templates, or Benchmark Regulation disclosures (ESRS 2
  Appendix B linkage).
- **ISSB / TCFD / BRSR / SDG** — per-datapoint equivalence references for cross-framework
  reporting.
- **Assurance** — `is_assured` / `assurance_level` per KPI echo CSRD's limited-assurance
  requirement on sustainability statements.

## 9 · Future Evolution

### 9.1 Evolution A — LLM/ML extraction and full-catalog coverage denominator (analytics ladder: rung 1 → 3)

**What.** A genuine tier-A CSRD ingestion-and-catalog service: PDF upload → background extraction →
`csrd_kpi_values`/`csrd_gap_tracker`/`csrd_data_lineage`, plus standards-faithful browse over the
ESRS data-point catalog (1,184 points, phase-in reliefs, XBRL tags, cross-references), GRI taxonomy
(2,230 elements) and the 649-row ESRS↔GRI mapping — no PRNG, real document-to-datapoint provenance.
§7.6 names the deepening targets: extraction is **regex-based** (a heuristic, not NLP/ML) with
confidence/unit-normalisation in the worker; and `total_mandatory = 12` is a **hardcoded mirror** of
the worker's tracked-indicator set that silently drifts if the worker changes, measuring coverage
against 12 tracked indicators not the full ESRS mandatory population (hundreds of points). Evolution A
replaces regex extraction with an LLM/ML pipeline and computes coverage against the real catalog.

**How.** The worker's `process_csrd_report_task` gains an LLM-based datapoint extractor (grounded in
the ESRS catalog's DR codes and paragraph references) with span-level provenance into
`csrd_data_lineage`; the dashboard's coverage denominator is computed from the catalog's actual
`mandatory=True` count (per the entity's phase-in relief profile), not the hardcoded 12. Rung 3:
calibrate extraction confidence against a labelled set of assured CSRD reports and materiality-weight
the average data-quality score.

**Prerequisites (hard).** Fix the harness failure — §4.2 shows `GET /catalog/{indicator_code}`
**failed** (db-empty); preserve the honest document-to-datapoint lineage trail. **Acceptance:** the
§7.4 coverage worked example (66.7% at 4 open gaps) reproduces under the legacy 12-denominator, then
shifts to the catalog-derived mandatory count; an LLM-extracted KPI carries a page-span citation in
lineage; the catalog detail endpoint passes the harness.

### 9.2 Evolution B — CSRD reporting copilot over the extraction and catalog (LLM tier 2)

**What.** A copilot for disclosure teams answering "what ESRS datapoints did we disclose and which
are gaps?" (`/entities/{id}/dashboard`, `/gaps`), "trace where this Scope 3 figure came from"
(`/entities/{id}/lineage` → source doc, page, transformation), "what GRI disclosures map to ESRS
E1-6?" (`/gri/mapping/esrs/{code}`), and "what does this ESRS datapoint require?" (`/catalog/{code}`)
— narrating real extracted KPIs with their document provenance and data-quality scores.

**How.** Tool schemas over the ~19 endpoints; the ESRS catalog, GRI taxonomy and ESRS↔GRI mapping
are exceptional RAG grounding for standards questions (the phase-in reliefs, XBRL tags, cross-
references are all first-class). The no-fabrication validator checks every coverage %, KPI value and
gap count against tool output; crucially the copilot surfaces each KPI's `extraction_method`,
`is_assured` and `report_page_reference` so an extracted-and-assured figure is never conflated with a
regex-guessed one. Composable into a disclosure-readiness workflow with `analyst_portfolios` and
`cdp_scoring`.

**Prerequisites.** Evolution A's improved extraction (so narrated KPIs are reliable) and catalog
harness fix; Atlas + ESRS/GRI corpus embedded (roadmap D3). **Acceptance:** every figure cited traces
to a tool call and carries its extraction-method/assurance provenance; a lineage query resolves a KPI
to its source document and page; a datapoint-definition question resolves to the real ESRS catalog
entry with its paragraph reference.