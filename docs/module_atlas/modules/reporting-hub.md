# Reporting Hub
**Module ID:** `reporting-hub` · **Route:** `/reporting-hub` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralized sustainability disclosure management platform consolidating GHG, TCFD, CSRD, SFDR and custom report workflows into a single governed hub.

> **Business value:** Centralises multi-framework reporting obligations with completeness tracking and workflow governance.

**How an analyst works this module:**
- Map required disclosures by framework and reporting period.
- Assign data owners and collect underlying metrics per disclosure item.
- Run completeness checks and gap analysis before submission.
- Submit reports and archive audit trail for regulator access.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTION_ITEMS`, `API`, `CLIENTS`, `COLORS`, `FRAMEWORKS_LIST`, `LS_CLIENT_NOTES`, `LS_KEY`, `LS_PORTFOLIO`, `LS_REPORT_HISTORY`, `LS_REPORT_SCHEDULE`, `LS_REPORT_TEMPLATES`, `MODULES`, `MONTHLY_STATS`, `REG_CAL_API`, `REG_SUBMISSIONS`, `REPORT_TYPES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MODULES` | 6 | `name`, `desc`, `status`, `path`, `icon`, `reportsThisMonth`, `color` |
| `CLIENTS` | 9 | `name`, `aum`, `type`, `region`, `satisfaction`, `reportsPerYear`, `frameworks`, `contactName`, `lastDelivery` |
| `REPORT_TYPES` | 13 | `name`, `framework`, `format`, `avgGenTime`, `dataCoverage`, `template` |
| `REG_SUBMISSIONS` | 16 | `regulator`, `regulation`, `filing`, `jurisdiction`, `deadline`, `status`, `completion` |
| `MONTHLY_STATS` | 12 | `reports`, `errors` |
| `ACTION_ITEMS` | 11 | `module`, `action`, `priority`, `due` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `REG_CAL_API` | ``${API}/api/v1/regulatory-calendar`;` |
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `fmtM` | `(n) => typeof n === 'number' ? (n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${n.toLocaleString()}`) : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `today` | `new Date('2025-05-15');` |
| `clientNotes` | `useMemo(() => loadLS(LS_CLIENT_NOTES) \|\| {}, []);  /* ── State ────────────────────────────────────────────────────────────── */ const [searchTerm, setSearchTerm] = useState('');` |
| `deadlines` | `useMemo(() => buildDeadlines(), []);  const totalAUM = useMemo(() => CLIENTS.reduce((a, c) => a + c.aum, 0), []);` |
| `totalReportsYTD` | `useMemo(() => MONTHLY_STATS.reduce((a, m) => a + m.reports, 0), []);` |
| `avgSatisfaction` | `useMemo(() => (CLIENTS.reduce((a, c) => a + c.satisfaction, 0) / Math.max(1, CLIENTS.length)).toFixed(1), []);` |
| `schedulesActive` | `useMemo(() => CLIENTS.length, []); // Prefer the live Regulatory Obligation Calendar summary (real cross-framework // obligation registry) when reachable; fall back to the seeded REG_SUBMISSIONS // demo array (clearly badged) if the API is unavailable. const submissionsDue = useMemo(() => { if (regCalStatus === 'live' && regCalSummary) { ` |
| `onTrack` | `relevant.filter(s => s.completion > 0 \|\| Math.ceil((new Date(s.deadline) - today) / 86400000) > 90).length;` |
| `avgGenTime` | `useMemo(() => (REPORT_TYPES.reduce((a, r) => a + r.avgGenTime, 0) / Math.max(1, REPORT_TYPES.length)).toFixed(0), []);` |
| `avgDataCov` | `useMemo(() => (REPORT_TYPES.reduce((a, r) => a + r.dataCoverage, 0) / Math.max(1, REPORT_TYPES.length)).toFixed(0), []);` |
| `errorRate` | `useMemo(() => { const total = MONTHLY_STATS.reduce((a, m) => a + m.reports, 0);` |
| `errors` | `MONTHLY_STATS.reduce((a, m) => a + m.errors, 0);` |
| `reportsPerMonth` | `useMemo(() => (totalReportsYTD / Math.max(1, MONTHLY_STATS.length)).toFixed(0), [totalReportsYTD]);` |
| `fwCovered` | `useMemo(() => new Set(REPORT_TYPES.map(r => r.framework)).size, []);` |
| `formatsSupported` | `useMemo(() => new Set(REPORT_TYPES.map(r => r.format)).size, []);` |
| `revenueEst` | `useMemo(() => fmtM(totalAUM * 0.0002), [totalAUM]); // 2bps` |
| `clientAumData` | `useMemo(() => CLIENTS.map(c => ({ name: c.name.split(' ').slice(0, 2).join(' '), aum: c.aum / 1e9 })), []);` |
| `fwCoverageData` | `useMemo(() => { return FRAMEWORKS_LIST.map(fw => { const hasReport = REPORT_TYPES.some(r => r.framework === fw \|\| r.framework === 'Multi');` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `badge` | `(color, bg) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, color, background: bg \|\| `${color}18`, marginRight: 4 });` |
| `regionData` | `Object.entries(regionMap).map(([name, value]) => ({ name, value }));` |
| `volData` | `CLIENTS.map(c => ({ name: c.name.split(' ').slice(0, 2).join(' '), reports: c.reportsPerYear })).sort((a, b) => b.reports - a.reports);` |
| `pctVal` | `Math.min(100, (g.current / g.target) * 100);` |
| `slaData` | `MONTHLY_STATS.map((m, i) => ({` |
| `typeData` | `Object.entries(typeMap).map(([name, value]) => ({ name, value: +(value / 1e6).toFixed(2) }));` |
| `covData` | `REPORT_TYPES.map(r => ({ name: r.name.split(' ').slice(0, 3).join(' '), coverage: r.dataCoverage })).sort((a, b) => b.coverage - a.coverage);` |
| `engScore` | `Math.round(c.satisfaction * 18 + c.reportsPerYear * 0.5);` |
| `radarData` | `MODULES.map(m => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pe/reporting/lp-report` | `generate_lp_report` | api/v1/routes/pe_reporting.py |
| POST | `/api/v1/pe/reporting/fund-impact` | `assess_fund_impact` | api/v1/routes/pe_reporting.py |
| POST | `/api/v1/pe/reporting/irr-sensitivity` | `irr_sensitivity` | api/v1/routes/pe_reporting.py |
| POST | `/api/v1/pe/reporting/compute-irr` | `compute_irr` | api/v1/routes/pe_reporting.py |
| GET | `/api/v1/pe/reporting/pai-indicators` | `get_pai_indicators` | api/v1/routes/pe_reporting.py |
| GET | `/api/v1/pe/reporting/sdg-definitions` | `get_sdg_definitions` | api/v1/routes/pe_reporting.py |
| GET | `/api/v1/pe/reporting/impact-dimensions` | `get_impact_dimensions` | api/v1/routes/pe_reporting.py |

### 2.3 Engine `pe_impact_framework` (services/pe_impact_framework.py)
| Function | Args | Purpose |
|---|---|---|
| `PEImpactFramework.assess_company_impact` | company | Assess impact for a single portfolio company. |
| `PEImpactFramework.assess_fund_impact` | inp | Assess impact across the entire fund. |
| `PEImpactFramework.get_sdg_definitions` |  | Return SDG reference data. |
| `PEImpactFramework.get_impact_dimensions` |  | Return IMP impact dimensions. |

**Engine `pe_impact_framework` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `IMPACT_DIMENSIONS` | `['what', 'who', 'how_much', 'contribution', 'risk']` |

### 2.3 Engine `pe_irr_sensitivity` (services/pe_irr_sensitivity.py)
| Function | Args | Purpose |
|---|---|---|
| `PEIRRSensitivityEngine.analyse` | inp | Run complete IRR sensitivity analysis. |
| `PEIRRSensitivityEngine.compute_irr` | cashflows | Compute IRR from a series of cashflows using Newton's method. |
| `PEIRRSensitivityEngine._compute_scenario` | name, equity, entry_ebitda, growth_pct, exit_mult, debt, years | Compute IRR and MOIC for a single scenario. |
| `PEIRRSensitivityEngine._esg_impact` | equity, entry_ebitda, growth_pct, base_exit_mult, debt, years, esg_score, esg_improvement | Compute ESG impact on IRR/MOIC. |
| `PEIRRSensitivityEngine._build_sensitivity_table` | equity, entry_ebitda, base_growth, base_exit_mult, debt, years | Build exit multiple x EBITDA growth sensitivity grid. |

### 2.3 Engine `pe_reporting_engine` (services/pe_reporting_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PEReportingEngine.generate_lp_report` | inp | Generate a complete LP report. |
| `PEReportingEngine.get_pai_indicators` |  | Return SFDR PAI indicator reference data. |
| `PEReportingEngine._compute_fund_metrics` | perf | Compute TVPI, DPI, RVPI, and estimated IRR. |
| `PEReportingEngine._generate_esg_annex` | inp | Generate SFDR Art.11 periodic ESG annex. |
| `PEReportingEngine._generate_executive_summary` | perf, metrics, companies, period | Generate executive summary paragraph. |
| `PEReportingEngine._generate_sections` | perf, metrics, portfolio_summary, esg_annex, report_type | Generate report sections. |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `explicit`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ACTION_ITEMS`, `CLIENTS`, `COLORS`, `FRAMEWORKS_LIST`, `MODULES`, `MONTHLY_STATS`, `REG_SUBMISSIONS`, `REPORT_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Frameworks Active | — | Platform config | Number of regulatory frameworks with at least one active report in period. |
| Reports Submitted | — | Report log | Total disclosure submissions across all frameworks in rolling 12-month window. |
| Coverage Score | — | Calculated | Percentage of mandatory disclosure items completed across all active frameworks. |
- **Framework configs, entity hierarchy, reporting calendar** → Completeness scoring, cross-framework deduplication, version control → **Formatted disclosure packages, submission receipts, audit log**

## 5 · Intermediate Transformation Logic
**Methodology:** Disclosure Coverage Score
**Headline formula:** `Completed Disclosures ÷ Required Disclosures × 100`

Ratio of completed disclosure items to total mandatory items across active frameworks.

**Standards:** ['GRI 2', 'TCFD', 'CSRD Art.19a']
**Reference documents:** GRI Universal Standards 2021; TCFD Final Recommendations 2017; CSRD ESRS Set 1 2023; ISSB IFRS S1/S2 2023

**Engine `pe_impact_framework` — extracted transformation lines:**
```python
composite = round(sum(dim_scores.values()) / len(dim_scores), 2)
all_sdgs = company.primary_sdgs + company.secondary_sdgs
social_value = company.beneficiaries_reached * 100 + company.co2_avoided_tonnes * 50
imm = round(social_value / company.invested_eur, 4)
```

**Engine `pe_irr_sensitivity` — extracted transformation lines:**
```python
npv = sum(a / (1 + rate) ** (p / 4) for p, a in amounts)
dnpv = sum(-p / 4 * a / (1 + rate) ** (p / 4 + 1) for p, a in amounts)
new_rate = rate - npv / dnpv
exit_ebitda = entry_ebitda * (1 + growth_pct / 100) ** years
exit_ev = exit_ebitda * exit_mult
equity_value = exit_ev - debt
moic = round(equity_value / equity, 2) if equity > 0 else 0
irr = round((moic ** (1 / years) - 1) * 100, 1) if moic > 0 and years > 0 else 0
expansion = round(esg_improvement * ESG_BPS_PER_POINT / 10000, 4)
premium_pct = round(esg_improvement * ESG_BPS_PER_POINT / 100, 2)
deficit = (50 - esg_score) / 10
risk_discount = round(deficit * ESG_RISK_BPS_PER_10 / 100, 2)
adj_exit_mult = base_exit_mult + expansion
delta_bps = round((adj.irr_pct - base.irr_pct) * 100)
mult_offsets = [-2, -1, 0, 1, 2]
growth_offsets = [-2, -1, 0, 1, 2]
row_values = [round(base_exit_mult + o, 1) for o in mult_offsets]
col_values = [round(base_growth + o, 1) for o in growth_offsets]
```

**Engine `pe_reporting_engine` — extracted transformation lines:**
```python
dpi = round(perf.distributed_capital_eur / called, 2)
rvpi = round(perf.nav_eur / called, 2)
tvpi = round(dpi + rvpi, 2)
called_pct = round(called / perf.committed_capital_eur * 100, 1) if perf.committed_capital_eur > 0 else 0
dry_powder = perf.committed_capital_eur - called
fund_age = max(1, 2026 - perf.vintage_year)
gross_irr = round((tvpi ** (1 / fund_age) - 1) * 100, 1) if tvpi > 0 else 0
net_irr = round(gross_irr * 0.80, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — A live disclosure-operations backend for the client book (analytics ladder: rung 1 → 2)

**What.** §7 clarifies what this module really is: a client-facing sustainability disclosure operations dashboard (report pipeline status, SLA tracking across 9 asset-management clients) rendered entirely from hand-authored seed tables — zero fetch calls; the three backend engines the atlas attributes to it (`pe_reporting_engine.py` etc.) are a keyword-similarity artifact serving a different domain (PE LP reports), not real wiring. Its "on track" deadline logic is permissive by construction (§7.6), and the guide's per-framework completeness score doesn't exist. Evolution A gives the operations dashboard a real backend: persisted clients, report jobs, and honest SLA states.

**How.** (1) Tables `reporting_clients`, `reporting_jobs` (report type, period, owner, status transitions with timestamps, deadline), and `reporting_sla_rules`; `api/v1/routes/reporting_hub.py` with pipeline/SLA/coverage endpoints. (2) SLA logic tightened: on-track requires stage-appropriate progress vs elapsed time (a job "started" the day before a deadline is not on-track), with the rule documented and per-client overridable. (3) Framework coverage becomes computable by linking job outputs to the `report-generator`'s datapoint bindings and `regulatory-gap`'s requirement mapping — one coverage fact base across the three reporting modules rather than three inventions. (4) Correct the atlas engine attribution (an atlas-builder note, worth recording since blast-radius consumers read it). Revenue/engagement heuristics stay but are labelled illustrative or replaced with client-entered fees.

**Prerequisites.** Workflow schema agreed with the reporting team's actual states; cross-module coverage keys. **Acceptance:** a job's status history is timestamped and queryable; the on-track flag flips when elapsed-vs-progress crosses the documented rule; framework coverage recomputes when a linked report's completeness changes.

### 9.2 Evolution B — Operations-manager copilot for the reporting desk (LLM tier 2)

**What.** A reporting-operations manager's Monday questions: "which client deliverables are at SLA risk this month and why?", "summarize Q2 throughput by report type — where are we slowest?", "draft the client status email for Meridian Capital: two reports delivered, one in review, CSRD readiness at 78%". The copilot composes these from pipeline queries, SLA evaluations, and coverage state.

**How.** Tier-2 tool schemas over the Evolution-A endpoints; status emails draw exclusively on stored job facts (delivered dates, review states, computed coverage) with client-name accuracy enforced by the register — no cross-client leakage, which makes org/client scoping in the query layer a hard requirement (the RBAC middleware's per-module access extends to per-client rows here). Bottleneck analysis quotes computed cycle-time aggregates per stage. The copilot proposes but never executes status changes or client communications — drafts route to the owner for send. Escalation summaries link each at-risk job to its SLA rule evaluation.

**Prerequisites (hard).** Evolution A's job/SLA machinery and client-scoped RBAC — a copilot over the current static demo would draft fictional client updates with real-sounding names; send-workflow integration deferred. **Acceptance:** every date/status in a drafted email matches job records; at-risk lists equal the SLA endpoint output; cross-client questions from an unauthorized session are refused by scoping, not prompt politeness.