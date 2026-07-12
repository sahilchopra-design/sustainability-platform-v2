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
