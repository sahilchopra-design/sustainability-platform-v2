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
