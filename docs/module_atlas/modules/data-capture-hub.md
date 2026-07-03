# Climate Data Capture Hub
**Module ID:** `data-capture-hub` · **Route:** `/data-capture-hub` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Multi-source climate data ingestion hub supporting API connections, PDF OCR extraction, spreadsheet parsing, and web scraping. Provides structured extraction templates for TCFD, CSRD, and SFDR disclosure data, manual entry workflows with validation, and full audit trails for data provenance in sustainability reporting.

> **Business value:** Used by sustainability reporting teams, external assurance providers, and ESG data managers to automate the tedious data collection process and ensure audit-ready provenance for regulatory filings.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHART_COLORS`, `CoverageTab`, `DashboardTab`, `DataEntryTab`, `DataLineageTab`, `DocsTab`, `ISO_COUNTRIES`, `ImportExportTab`, `ModuleRegistryTab`, `PaginationBar`, `PipelineTab`, `QuickStartTab`, `RecordsTab`, `RequirementsTab`, `SPRINT_GROUPS`, `SchemaTab`, `SprintCoverageTab`, `TABS`, `Toast`, `ValidationTab`

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
| `moduleRoutes` | `useMemo(() => allModules.map(m => m.route), [allModules]);` |
| `moduleNameMap` | `useMemo(() => Object.fromEntries(Object.entries(MODULE_DATA_MAP).map(([r, m]) => [r, m.name])), []);` |
| `producers` | `[...new Set(pipelines.filter(p => p.entity === entityFlowId).map(p => p.from))];` |
| `consumers` | `[...new Set(pipelines.filter(p => p.entity === entityFlowId).map(p => p.to))];` |
| `seed` | `i * 7 + 3;` |
| `rows` | `entity.fields.map(f => [f.key, f.type, f.unit \|\| '', f.required ? 'Yes' : 'No', f.defaultValue !== undefined ? f.defaultValue : '', (f.help \|\| '').rep` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `entityHeatmap` | `useMemo(() => DATA_ENTITIES.map(e => {` |
| `maxFilled` | `records.length > 0 ? totalFields * records.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `ISO_COUNTRIES`, `SPRINT_GROUPS`, `TABS`
**Shared context buses:** `DataCaptureContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| OCR Extraction Accuracy | `correctly_extracted_fields / total_fields × 100` | Human review benchmark sample | Production systems achieve 85-95% accuracy on structured tables; narrative extraction lower at 60-75%; human r |
| Template Coverage Rate | `template_matched_fields / required_fields_per_standard × 100` | TCFD/CSRD/SFDR field registries | Measures how completely a submission fills the required data fields for a given standard; <70% triggers incomp |
| Data Provenance Score | `fields_with_source_document / total_fields × 100` | Audit trail log | Score 100 = every data point linked to source document; required for third-party assurance (ISAE 3000/3410 lim |
- **PDFs + spreadsheets + APIs → ingestion layer** → OCR extraction → template matching → validation → provenance logging → **Structured, validated, and audit-trailed ESG data for regulatory reporting**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-Source Structured Data Extraction
**Headline formula:** `extraction_confidence = OCR_accuracy × template_match_score × field_validation_pass_rate`
**Standards:** ['TCFD Recommendations 2023 – Annex', 'EFRAG ESRS Data Collection Guidance', 'GRI 2 – General Disclosures']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).