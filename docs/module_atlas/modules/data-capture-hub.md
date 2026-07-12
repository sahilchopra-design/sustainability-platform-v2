# Climate Data Capture Hub
**Module ID:** `data-capture-hub` · **Route:** `/data-capture-hub` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Multi-source climate data ingestion hub supporting API connections, PDF OCR extraction, spreadsheet parsing, and web scraping. Provides structured extraction templates for TCFD, CSRD, and SFDR disclosure data, manual entry workflows with validation, and full audit trails for data provenance in sustainability reporting.

> **Business value:** Used by sustainability reporting teams, external assurance providers, and ESG data managers to automate the tedious data collection process and ensure audit-ready provenance for regulatory filings.

**How an analyst works this module:**
- Upload or connect source documents (PDFs, spreadsheets, APIs)
- Select extraction template (TCFD, CSRD ESRS, SFDR, GRI)
- Review extraction results and validate flagged low-confidence fields
- Publish extracted data to reporting module with provenance log

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHART_COLORS`, `CoverageTab`, `DashboardTab`, `DataEntryTab`, `DataLineageTab`, `DocsTab`, `ISO_COUNTRIES`, `ImportExportTab`, `ModuleRegistryTab`, `PaginationBar`, `PipelineTab`, `QuickStartTab`, `RecordsTab`, `RequirementsTab`, `SPRINT_GROUPS`, `SchemaTab`, `SprintCoverageTab`, `TABS`, `Toast`, `ValidationTab`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TABS` | 15 | `label` |
| `SPRINT_GROUPS` | 30 | `domain`, `code_prefix` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `start` | `(page - 1) * perPage;` |
| `inputStyle` | `{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' };` |
| `badgeStyle` | `(color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: color + '18', color });` |
| `allModules` | `useMemo(() => Object.entries(MODULE_DATA_MAP).map(([route, m]) => ({ route, ...m })), []);` |
| `totalFields` | `useMemo(() => DATA_ENTITIES.reduce((s, e) => s + e.fields.length, 0), []);` |
| `pieData` | `useMemo(() => DATA_ENTITIES.map((e, i) => ({` |
| `domainCoverage` | `useMemo(() => domainGroups.map(dg => {` |
| `name` | `dg.name.length > 14 ? dg.name.slice(0, 12) + '..' : dg.name;` |
| `errorMap` | `Object.fromEntries((errors \|\| []).map(e => [e.field, e.message]));` |
| `activeDomains` | `useMemo(() => { if (!search && !domainFilter) return null; // null = manual control return new Set(filteredModules.map(m => m.domain));` |
| `moduleRoutes` | `useMemo(() => allModules.map(m => m.route), [allModules]);` |
| `moduleNameMap` | `useMemo(() => Object.fromEntries(Object.entries(MODULE_DATA_MAP).map(([r, m]) => [r, m.name])), []);` |
| `producers` | `[...new Set(pipelines.filter(p => p.entity === entityFlowId).map(p => p.from))];` |
| `consumers` | `[...new Set(pipelines.filter(p => p.entity === entityFlowId).map(p => p.to))];` |
| `seed` | `i * 7 + 3;` |
| `rows` | `entity.fields.map(f => [f.key, f.type, f.unit \|\| '', f.required ? 'Yes' : 'No', f.defaultValue !== undefined ? f.defaultValue : '', (f.help \|\| '').replace(/,/g, ';')].join(','));` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `entityHeatmap` | `useMemo(() => DATA_ENTITIES.map(e => {` |
| `maxFilled` | `records.length > 0 ? totalFields * records.length : 0;` |
| `fillPct` | `maxFilled > 0 ? Math.round((filledFields / maxFilled) * 100) : 0;` |
| `entityBarData` | `entityHeatmap.map(e => ({ name: e.entity.length > 12 ? e.entity.slice(0, 10) + '..' : e.entity, records: e.records, fillPct: e.fillPct }));` |
| `moduleReadiness` | `useMemo(() => allModules.map(m => { const cov = getDataCoverage(m.route);` |
| `recommendations` | `useMemo(() => { return DATA_ENTITIES.filter(e => (capturedData[e.id] \|\| []).length === 0).map(e => { const mods = allModules.filter(m => (m.requiredEntities \|\| []).includes(e.id));` |
| `failedIds` | `new Set(results.map(r => r.recordId));` |
| `qualityTrend` | `useMemo(() => { return Array.from({ length: 10 }, (_, i) => ({ period: `Week ${i + 1}`, score: Math.round(60 + sr(i * 31) * 40), }));` |
| `displayRecords` | `searchResults ? searchResults.filter(r => r.entityId === entityFilter).map(r => r.record) : records;` |
| `entityCounts` | `useMemo(() => DATA_ENTITIES.map(e => ({` |
| `keys` | `entity.fields.map(f => f.key);` |
| `importHistory` | `useMemo(() => [ { id: 1, filename: 'company_data_2025.csv', entity: 'Company', rows: 142, status: 'Completed', date: '2025-12-15' }, { id: 2, filename: 'emissions_q3.csv', entity: 'Emissions Data', rows: 89, status: 'Completed', date: '2025-11-20' }, { id: 3, filename: 'portfolio_update.csv', entity: 'Portfolio Holding', rows: 256, status` |
| `header` | `ent.fields.map(f => f.key).join(',');` |
| `sprintData` | `useMemo(() => SPRINT_GROUPS.map((sg, idx) => {` |
| `avgCov` | `mods.length ? Math.round(mods.reduce((s, m) => s + getDataCoverage(m.route), 0) / mods.length) : 0;` |
| `barData` | `sprintData.map(s => ({ name: s.code_prefix.replace('-', ''), count: s.mods.length }));` |
| `entityProgress` | `useMemo(() => DATA_ENTITIES.map(e => ({` |
| `progressPct` | `DATA_ENTITIES.length > 0 ? Math.round((totalWithData / DATA_ENTITIES.length) * 100) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `ISO_COUNTRIES`, `SPRINT_GROUPS`, `TABS`
**Shared context buses:** `DataCaptureContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| OCR Extraction Accuracy | `correctly_extracted_fields / total_fields × 100` | Human review benchmark sample | Production systems achieve 85-95% accuracy on structured tables; narrative extraction lower at 60-75%; human review flags <80% confidence fields. |
| Template Coverage Rate | `template_matched_fields / required_fields_per_standard × 100` | TCFD/CSRD/SFDR field registries | Measures how completely a submission fills the required data fields for a given standard; <70% triggers incomplete submission warning. |
| Data Provenance Score | `fields_with_source_document / total_fields × 100` | Audit trail log | Score 100 = every data point linked to source document; required for third-party assurance (ISAE 3000/3410 limited assurance standard). |
- **PDFs + spreadsheets + APIs → ingestion layer** → OCR extraction → template matching → validation → provenance logging → **Structured, validated, and audit-trailed ESG data for regulatory reporting**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-Source Structured Data Extraction
**Headline formula:** `extraction_confidence = OCR_accuracy × template_match_score × field_validation_pass_rate`

PDF OCR uses layout-aware models (LayoutLM/DocTR) to extract tabular data from sustainability reports with field-level confidence scoring. Template matching maps extracted fields to canonical ESG data model entities. Validation rules check data type, range, unit consistency, and temporal continuity. All extraction actions are logged with extractor identity, timestamp, and source document hash for regulatory audit trail.

**Standards:** ['TCFD Recommendations 2023 – Annex', 'EFRAG ESRS Data Collection Guidance', 'GRI 2 – General Disclosures']
**Reference documents:** TCFD Recommendations (2023 Final Report Annex); EFRAG ESRS Data Collection and Reporting Guidance; GRI 2 – General Disclosures 2021

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide describes *Multi-Source Structured Data Extraction* with an OCR-confidence formula
(`extraction_confidence = OCR_accuracy × template_match × validation_pass_rate`). The code implements
**no OCR** — it is a genuine, functional **manual/structured data-capture hub** backed by a real
context (`useDataCapture`): entity-schema-driven forms, real per-record validation (`validateRecord`),
real coverage computation (`getDataCoverage` per module route), pipeline producer/consumer mapping, and
CSV import/export. The extraction/confidence pipeline in the guide is aspirational; what exists is a
data-entry and coverage-tracking system over the platform's real data-entity model. Partial mismatch.

### 7.1 What the module computes

Most quantities come from the shared data-capture context, not local seeds:
```js
totalFields = Σ DATA_ENTITIES.fields.length                          // real schema
maxFilled   = records.length>0 ? totalFields·records.length : 0
fillPct     = maxFilled>0 ? round(filledFields/maxFilled·100) : 0     // real fill ratio
getDataCoverage(route)                                               // real, per-module coverage
producers/consumers = pipelines.filter(entity).map(from/to)          // real dependency graph
```
Coverage per module and per sprint is computed from actual captured records against required entities;
only the `qualityTrend` weekly series (`60 + sr(i·31)·40`) and one `seed = i·7+3` helper are synthetic.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| DATA_ENTITIES | schema with typed fields (key, type, unit, required, help) | **real** data model |
| MODULE_DATA_MAP | route → required entities + name | **real** module registry |
| SPRINT_GROUPS | 30 domains × code_prefix | **real** sprint taxonomy |
| Fill % | `filledFields / (totalFields·records)` | **real** computation |
| Module readiness | `getDataCoverage(route)` | **real** (context) |
| Validation | `validateRecord` → field-level errors | **real** rule engine |
| Import history | 3 static sample rows | curated demo |
| Quality trend | `60 + sr(i·31)·40` weekly | synthetic seeded |
| OCR confidence | described in guide | **not implemented** |

### 7.3 Calculation walkthrough

Context supplies `capturedData`, `entities`, `pipelines`, `getDataCoverage`. Dashboard sums fields/
pipelines and shows per-entity fill %. Entry tab renders the selected entity's schema as a form and
validates on save. Coverage/Requirements/Sprint tabs compute per-module and per-sprint coverage from
real captured records vs required entities. Registry maps modules to their data dependencies; the
pipeline view lists producers/consumers per entity. Export dumps entity schemas or records to CSV.

### 7.4 Worked example (fill %)

An entity with 8 fields and 5 captured records, of which 34 field-values are populated:
```
totalFields = 8 ; maxFilled = 8·5 = 40 ; filledFields = 34
fillPct     = round(34/40·100) = round(85.0) = 85%
```
A module requiring the "Emissions Data" entity, with that entity 85% filled, contributes its coverage
to `moduleReadiness` via `getDataCoverage(route)` — a real dependency-weighted completeness figure.

### 7.5 Data provenance & limitations

- **Core is real and functional**: schema-driven entry, field validation, per-module/-sprint coverage
  from actual captured records, real producer/consumer pipeline graph — all context-backed, not seeded.
- **No OCR/PDF/API extraction** exists despite the guide's LayoutLM/DocTR narrative; capture is manual/
  CSV.
- Only the weekly quality trend and import-history samples are synthetic/static.

**Framework alignment:** TCFD / EFRAG ESRS / SFDR / GRI data-collection templates (the entity schemas
map to these disclosure field sets) · ISAE 3000 provenance (records carry source metadata). The capture,
validation and coverage logic is genuine; the OCR extraction and confidence scoring are unimplemented.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The OCR/template-matching extraction pipeline
and its confidence score do not exist; capture is manual.

**8.1 Purpose & scope.** Ingest disclosure data from PDFs, spreadsheets and APIs into the canonical
entity model with field-level confidence, template matching to ESRS/TCFD/SFDR, and provenance logging.

**8.2 Conceptual approach.** A **layout-aware document-extraction pipeline** (LayoutLMv3 / DocTR) with
template matching to the entity schema and a rule-validation gate — the pattern in Nanonets/Rossum
document-AI; provenance follows ISAE 3000 audit-trail requirements.

**8.3 Mathematical specification.**
```
OCR_conf(field)      = model token confidence for extracted span
TemplateMatch(field) = cos(embed(field_label), embed(schema_key)) > τ
ValidationPass(field)= rule_check(value, type, range, unit)
ExtractionConf = OCR_conf · TemplateMatch · ValidationPass                # per field
Coverage = template_matched_required / required_fields_per_standard
Provenance = fields_with_source_doc_hash / total_fields
```

| Parameter | Source |
|---|---|
| OCR/layout model | LayoutLMv3 / DocTR |
| Schema keys | DATA_ENTITIES (exists) |
| Standard field registries | TCFD/ESRS/SFDR (exist) |
| Rule library | validateRecord (exists) |

**8.4 Data requirements.** Source documents, entity schema (exists), standard field registries (exist),
rule library (exists), document hashes for provenance. Vendors: AWS Textract, Azure Doc Intelligence;
open: DocTR/LayoutLM.

**8.5 Validation & benchmarking.** Human-review sample to measure extraction accuracy (target 85–95% on
tables); reconcile template coverage to required-field lists; verify provenance hashes. Benchmark vs
commercial ESG data-extraction tools.

**8.6 Limitations & model risk.** Narrative extraction accuracy is far lower than tabular (60–75%);
mis-mapped templates silently corrupt data. Fallback: route sub-80% confidence fields to mandatory human
review (already the manual path) before publishing.

## 9 · Future Evolution

### 9.1 Evolution A — Server-side capture with the promised extraction pipeline's deterministic half (analytics ladder: rung 1 → 2)

**What.** §7's verdict is favorable: the hub's core is "real and functional" —
schema-driven entry over the platform's actual `DATA_ENTITIES` model, real
`validateRecord` field validation, real per-module/per-sprint coverage from captured
records, and a genuine producer/consumer pipeline graph; only the weekly quality
trend is seeded and the OCR/extraction narrative is unimplemented. The structural
gap is persistence and ingestion: capture lives in client context, and the
multi-source promise (PDF, spreadsheet, API) is manual/CSV only. Evolution A builds
the deterministic ingestion layer.

**How.** (1) Backend vertical: `captured_records` table with the entity schemas as
the validation contract, so capture survives sessions and feeds other modules
server-side — the audit-trail promise (extractor identity, timestamp, source hash)
becomes AuditMiddleware-backed fact. (2) Spreadsheet ingestion: template-mapped
XLSX/CSV parsing against entity schemas with the existing validation rules —
deterministic, no ML required, and covers the bulk of real-world evidence.
(3) API connectors: the platform's 19-ingester framework is the scaffold; expose
selected ingester outputs as capture sources with provenance. (4) The seeded
`qualityTrend` derives from actual validation pass rates over time. (5) PDF/OCR
stays deferred to Evolution B where it belongs — the guide's
LayoutLM confidence formula is an ML concern, not a blocker for the deterministic
80%.

**Prerequisites.** Migration on the 2-head Alembic state; entity-schema versioning
(schemas will evolve under CSRD updates). **Acceptance:** a captured record
survives browser change and appears in the consuming module's coverage; an XLSX
template round-trips through validation with field-level errors; the quality trend
recomputes from stored validation events.

### 9.2 Evolution B — Document-extraction assistant with confidence-gated review (LLM tier 2)

**What.** The guide's aspirational pipeline — layout-aware extraction from
sustainability PDFs with field-level confidence — is today best served by an LLM
with vision/document input rather than a bespoke LayoutLM stack. Evolution B: upload
a sustainability report or utility bill, and the assistant proposes
`(entity, field, value, unit, source page)` tuples against the real entity schemas,
each with confidence; the existing `validateRecord` rules run on every proposal
before display (type, range, unit checks — deterministic gates on probabilistic
extraction), and low-confidence or validation-flagged fields queue for the review
workflow the module already sketches.

**How.** Tier-2 with gated writes into the Evolution A store: extraction prompts
per entity schema (the typed field definitions with units and help text are
ready-made extraction specs); the guide's confidence formula becomes
`model_confidence × validation_pass` recorded per field. Provenance is the product:
each accepted value stores its source-document hash and page, completing the
audit-trail chain assurance providers need. Confirmed extractions log to
`llm_traces` for the roadmap's flywheel.

**Prerequisites (hard).** Evolution A's persistence and validation service;
document storage with hashing. **Acceptance:** on a test report, ≥85% of proposed
quantitative fields confirmed unchanged; every accepted value carries page-level
provenance; validation-failed proposals never auto-enter records.