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
