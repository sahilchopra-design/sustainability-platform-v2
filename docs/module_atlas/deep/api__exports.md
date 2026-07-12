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
