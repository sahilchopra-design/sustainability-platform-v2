## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The atlas record attaches three backend engines
> (`pe_impact_framework.py`, `pe_irr_sensitivity.py`, `pe_reporting_engine.py`) and route
> `api/v1/routes/pe_reporting.py` to this module. **None of them are called anywhere in the
> frontend** — `ReportingHubPage.jsx` contains zero `fetch`/`axios` calls (grep confirms 0 matches
> for `fetch(`); its only side effect is a `useEffect` that persists UI state to `localStorage`.
> Inspecting the engines confirms they are unrelated: `pe_reporting_engine.py` generates **Private
> Equity LP reports** (`FundMetrics`, `ESGAnnex` for SFDR Art.11, `LPReport`) — a different domain
> from this page's actual purpose, which is a **client-facing sustainability disclosure
> operations dashboard** (report pipeline status, SLA tracking, framework coverage across a book
> of asset-management clients). The atlas's engine attribution appears to be a keyword-similarity
> mismatch ("report" → "reporting"), not a real wiring. Everything below documents the frontend
> code as it actually runs — a pure client-side, seeded-demo-data dashboard.

### 7.1 What the module computes

The page aggregates three hard-coded seed tables — `CLIENTS` (9 asset-management clients with AUM,
satisfaction, reports/year), `REPORT_TYPES` (13 report templates with generation time and data
coverage), `MONTHLY_STATS` (12 months of report volume/error counts) — into a set of simple
descriptive KPIs. There is no scoring model; every headline number is a direct sum, mean, or ratio:

```
totalAUM        = Σ CLIENTS[i].aum
avgSatisfaction = Σ CLIENTS[i].satisfaction / |CLIENTS|
avgGenTime      = Σ REPORT_TYPES[i].avgGenTime / |REPORT_TYPES|
avgDataCoverage = Σ REPORT_TYPES[i].dataCoverage / |REPORT_TYPES|
errorRate       = Σ MONTHLY_STATS[i].errors / Σ MONTHLY_STATS[i].reports
revenueEstimate = totalAUM × 0.0002              // 2 bps advisory-fee proxy
engagementScore = satisfaction × 18 + reportsPerYear × 0.5
```

### 7.2 Parameterisation

| Constant | Content | Provenance |
|---|---|---|
| `CLIENTS` (9 rows) | name, AUM, type, region, satisfaction (1–5 or /10 scale), reportsPerYear, frameworks, contact | Synthetic demo client book |
| `REPORT_TYPES` (13 rows) | name, framework, format, avgGenTime (min), dataCoverage (%), template | Synthetic demo values for generation time/coverage |
| `REG_SUBMISSIONS` (16 rows) | regulator, regulation, filing, jurisdiction, deadline, status, completion | Synthetic demo regulatory-filing calendar |
| `MONTHLY_STATS` (12 rows) | reports generated, errors, by month | Synthetic demo |
| `ACTION_ITEMS` (11 rows) | module, action, priority, due | Synthetic demo task backlog |
| `revenueEst` multiplier | 2 bps (`× 0.0002`) on total AUM | Hard-coded assumption, commented `// 2bps` in code — a plausible advisory-fee benchmark but not sourced |
| `engagementScore` weights | satisfaction×18 + reportsPerYear×0.5 | Ad hoc weighting with no stated derivation |

### 7.3 Calculation walkthrough

1. `totalAUM`, `totalReportsYTD`, `avgSatisfaction` are `useMemo`-cached reductions over `CLIENTS`
   and `MONTHLY_STATS`, guarded with `Math.max(1, …)` denominators to avoid divide-by-zero.
2. `onTrack` (deadline tracking) filters `REG_SUBMISSIONS` (aliased `relevant`) to items where
   `s.completion > 0` **or** the days-to-deadline exceeds 90 — i.e. a submission counts as "on
   track" either because work has started or because there's no urgency yet; this is a permissive
   heuristic, not a true RAG (red/amber/green) status derived from percent-complete vs days-remaining
   velocity.
3. `errorRate = errors/total×100` from `MONTHLY_STATS`, feeding the "SLA" chart series (`slaData`).
4. `fwCoverageData` cross-references the fixed `FRAMEWORKS_LIST` against `REPORT_TYPES.some(r =>
   r.framework === fw || r.framework === 'Multi')` to render a binary framework-coverage matrix.
5. `radarData` builds a spider chart from `MODULES` (6 platform report-producing modules) using
   each module's static `reportsThisMonth` field — again a direct pass-through, no scoring model.

### 7.4 Worked example

With `CLIENTS` totalling (illustrative) `totalAUM = $184.6B` across 9 clients:
`revenueEst = 184,600M × 0.0002 = $36.92M` advisory-fee estimate.
For a client with `satisfaction = 4.6` (out of 5, scaled ×2 → effectively out of 10 internally) and
`reportsPerYear = 24`: `engScore = 4.6×18 + 24×0.5 = 82.8 + 12 = 94.8`, plotted on the client
engagement scatter/leaderboard. Because both weights are arbitrary, this score has no external
benchmark to validate against (e.g. no comparison to a published client-retention model).

### 7.5 Companion analytics

- **Regulatory submissions calendar** (`REG_SUBMISSIONS`, 16 filings) — jurisdiction/deadline
  tracker feeding the "on track" count in §7.3.2; purely descriptive, no predictive slippage model.
- **Framework coverage matrix** — binary presence/absence of each of the platform's report
  templates against a fixed framework list (`FRAMEWORKS_LIST`).
- **SLA dashboard** (`slaData`) — monthly error-rate trend from `MONTHLY_STATS`.
- **CSV export** — generic `keys.join(',')` exporter for any of the seed tables; no server round
  trip, purely client-side `Blob` download.

### 7.6 Data provenance & limitations

- All content (clients, report types, submissions, monthly stats, action items) is static,
  hand-authored demo data — there is no live report-generation pipeline behind this dashboard, and
  no connection to the three backend PE engines the atlas record lists.
- `revenueEst` (2bps × AUM) and `engagementScore` (satisfaction×18 + volume×0.5) are illustrative
  heuristics without a cited benchmark or regression fit.
- "On track" deadline logic (§7.3.2) is permissive by construction (any started or >90-day-out item
  counts as on-track) and would understate risk in a real SLA-monitoring deployment.

**Framework alignment:** GRI 2, TCFD, CSRD Art.19a are named in the guide as the disclosure
completeness basis, but the code computes no per-framework completeness score — the "Coverage
Score" the guide cites (84%) does not appear anywhere in the calculated fields; the framework names
only appear as labels on the static `REPORT_TYPES`/`REG_SUBMISSIONS` rows.
