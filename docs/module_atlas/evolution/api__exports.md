## 9 · Future Evolution

> Atlas page documents a small serialization/download domain with a single endpoint
> (`GET /exports/portfolios/{id}/report?format=json|csv`) and no engine — transport only.
> Evolutions are scoped to what the page documents.

### 9.1 Evolution A — Safe CSV, timezone-aware timestamps, and XLSX/PDF formats (analytics ladder: rung 1 → 2)

**What.** A pure serialization endpoint that assembles a portfolio-analysis report (portfolio metadata,
metrics, holdings with PD/LGD, last 10 analysis runs, latest completed run's scenario×horizon results)
and streams it as JSON or CSV — no calculations, every number read back from the portfolio/analysis
repositories. §7.6 names concrete defects, not just gaps: **CSV injection & quoting** — holding fields
are interpolated into CSV lines with no quoting/escaping, so a company name containing a comma breaks
column alignment and there's no formula-injection (`=…`) protection in Excel; `datetime.utcnow()` is
deprecated naive UTC (rest of the platform uses `datetime.now(timezone.utc)`); "latest completed run"
assumes newest-first ordering without re-sorting; and holdings are serialized in full in memory with no
pagination (large portfolios risk OOM). Evolution A hardens the CSV, fixes the timestamp, and adds the
promised XLSX/PDF formats.

**How.** CSV uses the `csv` module (proper quoting) with formula-injection neutralisation (prefix `'`
on cells starting `=+-@`); `datetime.now(timezone.utc)`; explicit sort of completed runs by timestamp;
streaming/paginated holding serialization for large books; XLSX (openpyxl) and PDF (the platform's
report layer) formats added, so the CSV branch's current omissions (analysis results, run history,
market values) are available in a richer export. Rung 2: the report gains provenance/version stamps so
an exported figure is traceable to the run that produced it.

**Prerequisites (hard).** Fix the harness failure — §4.2 shows `GET /exports/portfolios/{id}/report`
**failed** (db-empty on `portfolios`); note the platform uses `portfolios_pg`, not `portfolios` (per
the critical rules) — the export must read the correct table. The CSV-injection issue is a security fix.
**Acceptance:** a holding name with a comma or leading `=` exports safely; the endpoint reads
`portfolios_pg` and returns a report; XLSX and PDF formats work (no longer 400); timestamps are
timezone-aware; the endpoint passes the harness.

### 9.2 Evolution B — Report-export tool for the desk-orchestrator memos (LLM tier 2 → 3)

**What.** This endpoint is the platform's portfolio-report **render/delivery surface** — its LLM role is
the export tool a desk orchestrator calls to deliver a finished artifact: after a copilot assembles a
portfolio analysis (financed emissions, ECL, scenario results), it calls `/exports/portfolios/{id}/
report?format=xlsx` to produce the downloadable deliverable, grounding every figure in the stored run.
It is the transport leg of the roadmap's tier-3 "compose into report-studio-style artifacts" step.

**How.** Register the export endpoint as a delivery tool; the copilot never invents report figures — it
triggers an export of the *stored* analysis run, and the no-fabrication validator confirms the delivered
report's numbers come from the persisted run (not the conversation). The report's provenance/version
stamps (Evolution A) appear in the "show work" expander. Read-only, RBAC-scoped to the portfolio owner.

**Prerequisites.** Evolution A's `portfolios_pg` fix, safe serialization and richer formats (a broken/
unsafe exporter can't back reliable delivery); Atlas corpus embedded (roadmap D3). **Acceptance:** a
desk-copilot's delivered report is an export of the stored analysis run with matching figures; the
export is safe (no CSV injection) and format-complete (JSON/CSV/XLSX/PDF); every figure traces to the
run that produced it.
