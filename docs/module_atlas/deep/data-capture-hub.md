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
