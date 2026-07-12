# Api::Exports
**Module ID:** `api::exports` · **Route:** `/exports` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/exports/portfolios/{portfolio_id}/report` | `download_portfolio_report` | api/v1/routes/exports.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`

**Database tables:** `api` *(shared)*, `datetime` *(shared)*, `fastapi` *(shared)*, `latest`, `sqlalchemy` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /exports/portfolios/{portfolio_id}/report** — status `failed`, provenance ['db-empty'], source tables: `portfolios`
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded solely in
`backend/api/v1/routes/exports.py`. There is no dedicated engine: this is a pure
serialization/download domain with a single endpoint.)*

### 7.1 What the domain computes

`GET /exports/portfolios/{portfolio_id}/report?format=json|csv` assembles a **portfolio analysis
report** and streams it as a downloadable file. It performs **no risk calculations of its own** —
every number in the report is read back from the database via two repositories:

| Data block | Source call | Contents |
|---|---|---|
| `portfolio` | `PortfolioRepository.get_by_id` | id, name, description, created/updated timestamps |
| `metrics` | `PortfolioRepository.get_portfolio_metrics` | portfolio aggregates (total exposure, holding count, …) |
| `holdings[]` | `PortfolioRepository.get_holdings` | per-holding: company name, sector, asset type, `exposure`, `market_value`, `base_pd`, `base_lgd`, `rating` |
| `analysis_runs[]` | `AnalysisRepository.get_portfolio_runs` (last 10) | run id, scenarios, horizons, status, timestamps |
| `latest_analysis_results[]` | `AnalysisRepository.get_results` on the **first completed run** in the returned page | per scenario × horizon: `expected_loss`, `expected_loss_pct`, `var_95`, `avg_pd_change_pct`, `concentration_hhi` |

A missing portfolio returns HTTP 404; an unknown `format` returns HTTP 400 (docstring notes
"future: pdf, xlsx").

### 7.2 Parameterisation

There are no model constants, weights, or thresholds — the only parameters are:

| Parameter | Default | Effect |
|---|---|---|
| `portfolio_id` (path) | — | which portfolio to export |
| `format` (query) | `"json"` | `json` → full nested report; `csv` → simplified flat file |
| runs page size | hardcoded `limit=10` | only the 10 most recent analysis runs are considered |

### 7.3 Calculation walkthrough

1. Load portfolio → 404 guard.
2. Load metrics + holdings + last 10 runs.
3. Build `report_data` dict with `generated_at = datetime.utcnow()`.
4. Filter `runs` for `status == "completed"`; if any, take `completed_runs[0]` (the most recent,
   given the repository's ordering) and attach its scenario×horizon results as
   `latest_analysis_results`. If no completed run exists, the key is simply absent.
5. Serialize: JSON via `json.dumps(indent=2)` into a `StreamingResponse` with a
   `Content-Disposition: attachment` header; CSV via hand-built lines.

The CSV branch exports **less** than the JSON branch: a two-line header (name, total exposure,
holding count) plus one row per holding (`Company Name, Sector, Asset Type, Exposure, PD, LGD,
Rating`). Analysis results, run history, and market values are JSON-only.

### 7.4 Worked example

For portfolio `pf-123` with 2 holdings and one completed run over scenarios
`["NGFS_NetZero2050"]` × horizons `[2030]`:

- `GET /exports/portfolios/pf-123/report` → `portfolio_pf-123_report.json` containing the
  portfolio block, metrics, both holdings with their PD/LGD, the run record, and one
  `latest_analysis_results` entry, e.g. `{"scenario": "NGFS_NetZero2050", "horizon": 2030,
  "expected_loss": …, "var_95": …, "concentration_hhi": …}` — values computed upstream by the
  scenario-analysis engine, not here.
- `GET …?format=csv` → `portfolio_pf-123_report.csv` with the header rows and 2 holding rows.
- `GET …?format=pdf` → HTTP 400 "Unsupported format".

### 7.5 Interconnections

This endpoint is the read-side of the core portfolio-analysis pipeline: portfolios/holdings are
created via the portfolio CRUD routes, analysis runs are produced by the scenario analysis domain
(expected loss = PD×LGD×EAD aggregates, VaR 95, HHI concentration), and `exports` snapshots
whatever the latest completed run stored. Any methodology questions about `var_95` or
`concentration_hhi` belong to the analysis engine's deep dive, not this file.

### 7.6 Data provenance & limitations

- No synthetic PRNG data in this route; content fidelity depends entirely on what upstream
  writers stored in the portfolio/analysis tables.
- **CSV injection & quoting:** holding fields are interpolated into CSV lines without quoting or
  escaping — a company name containing a comma breaks column alignment; no protection against
  formula-injection (`=…`) if opened in Excel.
- `datetime.utcnow()` is deprecated-style naive UTC (rest of the platform uses
  `datetime.now(timezone.utc)`).
- "Latest completed run" assumes the repository returns runs newest-first; the route does not
  re-sort.
- No pagination of holdings — very large portfolios are serialized in full in memory
  (`io.BytesIO`).
- PDF/XLSX formats are documented as future work; only json/csv exist.

### 7.7 Framework alignment

- **No regulatory framework is implemented here.** The exported fields echo an IFRS 9-style
  credit-risk vocabulary (PD, LGD, expected loss) and a market-risk VaR figure produced by the
  upstream analysis engine, plus a Herfindahl–Hirschman concentration index; this route is
  transport only.
- The attachment-download pattern (Content-Disposition streaming) is the platform's generic
  report-delivery convention, also used by other export surfaces.

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