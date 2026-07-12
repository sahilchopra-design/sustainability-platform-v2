# ETL Pipeline Manager
**Module ID:** `etl-pipeline` · **Route:** `/etl-pipeline` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages the configuration, scheduling, monitoring, and quality assurance of ESG data ETL pipelines ingesting data from external providers, regulatory databases, company filings, and internal systems. Provides a visual pipeline builder, run history, data quality monitoring dashboards, and automated alerting for pipeline failures or data anomalies. Supports lineage tracking and audit trails required for GDPR, BCBS 239, and ESMA data governance compliance.

> **Business value:** Provides the data engineering and governance foundation for the entire ESG analytics platform, ensuring every metric, rating, and KPI consumed by downstream modules is traceable, quality-controlled, and delivered within SLA â€” a prerequisite for regulatory-grade ESG disclosure and investment decision-making.

**How an analyst works this module:**
- Configure new pipeline by selecting source connector, transformation rules, target schema, and quality thresholds.
- Set schedule (real-time, daily, weekly, or event-triggered) and configure alerting channels for failure and DQS breach.
- Monitor pipeline run dashboard for current status, last-run DQS, record counts, and SLA performance.
- Review data lineage graph for any ESG metric to trace from target field back to source system field via all transformations.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_STAGES`, `Badge`, `Btn`, `ETL_STAGES`, `KPICard`, `LS_CUSTOM`, `LS_LOG`, `LS_PORT`, `LS_SCHED`, `STAGE_TYPE_COLORS`, `Section`, `SortHeader`, `StatusDot`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TABS` | 7 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v => v == null ? '--' : typeof v === 'number' ? v.toLocaleString() : String(v);` |
| `fmtPct` | `v => v == null ? '--' : `${v.toFixed(1)}%`;` |
| `inputs` | `(stage.input \|\| '').split(',').map(s => s.trim()).filter(Boolean);` |
| `stageRuns` | `ALL_STAGES.map(s => ({` |
| `sortedStages` | `useMemo(() => { const arr = [...ALL_STAGES, ...customStages.map(c => ({ ...c, type: 'Custom' }))];` |
| `kpis` | `useMemo(() => { const totalRecords = ALL_STAGES.reduce((s, st) => s + (typeof st.records === 'number' ? st.records : 0), 0);` |
| `successRate` | `latestRuns.length ? (latestRuns.filter(r => r.status === 'success').length / latestRuns.length * 100) : 100;` |
| `avgDuration` | `latestRuns.length ? latestRuns.reduce((s, r) => s + r.duration_ms, 0) / latestRuns.length : 0;` |
| `lastRunDate` | `runLog.length ? runLog[runLog.length - 1].started : null;` |
| `freshness` | `lastRunDate ? Math.round((Date.now() - new Date(lastRunDate).getTime()) / 3600000) : null;` |
| `newRun` | `ALL_STAGES.map(s => ({` |
| `timelineData` | `useMemo(() => { const runs = [...new Set(runLog.map(r => r.run_id))].slice(-10);` |
| `totalMs` | `stages.reduce((s, r) => s + r.duration_ms, 0);` |
| `flowMetrics` | `useMemo(() => { const latestRun = [...new Set(runLog.map(r => r.run_id))].pop();` |
| `errorLog` | `useMemo(() => runLog.filter(r => r.status === 'error').slice(-30).reverse(), [runLog]);` |
| `healthScore` | `useMemo(() => { const latest = [...new Set(runLog.map(r => r.run_id))].pop();` |
| `successPct` | `stages.length ? stages.filter(s => s.status === 'success').length / stages.length * 100 : 100;` |
| `avgLatency` | `stages.length ? stages.reduce((s, r) => s + r.duration_ms, 0) / stages.length : 0;` |
| `blob` | `new Blob([JSON.stringify({ stages: ETL_STAGES, custom: customStages, schedule, exported: nowISO() }, null, 2)], { type: 'application/json' });` |
| `rows` | `runLog.map(r => [r.run_id, r.stage_id, r.stage_name, r.type, r.started, r.duration_ms, r.records_in, r.records_out, r.status, r.error_msg \|\| '']);` |
| `csv` | `[headers, ...rows].map(r => r.join(',')).join('\n');` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_STAGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Pipeline Run DQS (%) | — | DAMA DMBOK2 | Overall data quality score for a pipeline run; below 85% triggers quarantine and analyst review before downstream propagation. |
| Record Completeness (%) | — | Schema Validation | Proportion of mandatory fields with non-null values; 100% required for financial-grade ESG data ingestion. |
| Timeliness SLA Adherence (%) | — | Pipeline Scheduler | Percentage of scheduled pipeline runs completing within the contracted SLA window; critical for market-hours data feeds. |
| Lineage Coverage (%) | — | Data Catalogue | Proportion of downstream ESG metrics with documented lineage to source system, transformation, and load step. |
- **External ESG provider APIs (MSCI, Sustainalytics, Bloomberg, CDP)** → Scheduled API calls with retry logic; schema validation on ingestion; DQS computation per run → **Validated ESG data records with DQS metadata and lineage tag**
- **Regulatory databases (EDGAR, SEDAR, ESMA FIRDS)** → Event-triggered or nightly batch extraction; filing metadata enrichment; deduplication by ISIN/LEI → **Structured regulatory disclosure records with source URL and filing date**
- **Internal portfolio and CRM systems** → Bidirectional sync via certified API; conflict resolution rules for overlapping data fields → **Enriched internal records with ESG data fields and lineage documentation**

## 5 · Intermediate Transformation Logic
**Methodology:** Pipeline Data Quality Score
**Headline formula:** `DQS = w_c × Completeness + w_a × Accuracy + w_t × Timeliness + w_u × Uniqueness`

Composite data quality score computed per pipeline run across four DAMA dimensions. Completeness measures non-null field rates vs. expected schema. Accuracy cross-validates values against reference sources or prior period ranges (outlier detection). Timeliness scores delivery against SLA windows. Uniqueness detects duplicate records. Pipeline DQS below 85% triggers automatic quarantine of the run output pending analyst review.

**Standards:** ['DAMA DMBOK2 2017', 'BCBS 239 Principles 2013', 'ISO 8000 Data Quality']
**Reference documents:** DAMA International â€” DMBOK2 Data Management Body of Knowledge 2017; BCBS 239 â€” Principles for Effective Risk Data Aggregation and Reporting 2013; ISO 8000-61:2016 â€” Data Quality Management; EU GDPR Article 5 â€” Data Quality Principles

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **DAMA-based Data Quality Score**
> `DQS = w_c·Completeness + w_a·Accuracy + w_t·Timeliness + w_u·Uniqueness`, per-run quarantine below
> 85%, and lineage-coverage tracking. **The code computes no DQS at all** — there is no completeness,
> accuracy, or uniqueness measurement. What the page actually is: an **operational pipeline monitor**
> that tracks *run-level* metrics (success rate, duration, record throughput, freshness, and a heuristic
> health score) over a seeded 10-run history of the platform's real ETL stages. Documented below.

### 7.1 What the module computes

Over a simulated run log, the module derives operational KPIs:

```js
successRate = runs.filter(r=>r.status==='success').length / runs.length × 100
avgDuration = Σ r.duration_ms / runs.length
freshness   = round((now − lastRunStart) / 3_600_000)          // hours since last run
```

Plus a `healthScore` (per latest run) and per-stage flow metrics (`records_in`, `records_out`,
`duration_ms`). The `errorLog` filters the last 30 error rows. Each stage's run is simulated:

```js
duration_ms = round(avg_duration_ms · (0.7 + sr(_sc++)·0.6))          // ±30% jitter
records_out = records − floor(sr(_sc++)·3)                            // small drop
status      = sr(_sc++) < (error_rate/100)·3 ? 'error' : 'success'    // 3× amplified error prob
```

So "data quality" here means **did the pipeline stage run succeed**, not whether the delivered data is
complete/accurate — a fundamentally operational, not DAMA-quality, view.

### 7.2 Parameterisation & provenance

| Table | Rows | Provenance |
|---|---|---|
| `ETL_STAGES.extract` | 8 | **Real platform sources**: EODHD fundamentals/EOD, Alpha Vantage, BRSR Supabase, OpenFIGI, CBI bond universe, IMF climate, World Bank — with realistic record counts and error rates |
| `ETL_STAGES.transform` | 10 | **Real platform transforms**: FX→USD, GHG intensity `(S1+S2)·1e6/Rev`, WACI `Σ(w·intensity)`, PCAF attribution `Exposure/EVIC`, ITR IPCC-budget interpolation, sovereign composite — these mirror actual engines |
| `ETL_STAGES.load` | 5 | Real targets: `globalCompanyMaster.js`, `ra_portfolio_v1`, bond/sovereign reference DBs |
| Run log | 10 runs × 23 stages | **Synthetic** via `sr()` — durations, record drops, error flags all seeded |
| `error_rate` per stage | 0–3.5% | Hand-set plausible values (IMF ArcGIS 3.5%, BRSR 0.1%) |

The stage **definitions** are genuinely the platform's data architecture (the transform descriptions
match real modules — WACI, PCAF, ITR). Only the *run outcomes* are fabricated.

### 7.3 Calculation walkthrough

1. `buildSeedLogs()` generates 10 daily runs; each of the 23 stages gets a seeded duration, output
   record count, and success/error flag (error probability = 3× the stage's `error_rate`).
2. `stageRuns`/`latestRuns` isolate the most recent run; `successRate`, `avgDuration` aggregate it.
3. `freshness` = hours since the last run's start.
4. `healthScore` blends latest-run success and freshness into a 0–100 indicator.
5. `buildDependencies()` parses each transform/load stage's `input` field into a DAG for the lineage
   graph (E01→T01, T02→T03, etc.) — this is real, structural, and the module's most valuable artefact.
6. Custom stages, schedule, and run log persist to localStorage; CSV/JSON export serialises them.

### 7.4 Worked example (latest run)

Suppose the latest run has 22 of 23 stages succeed (one IMF timeout):

| Metric | Computation | Result |
|---|---|---|
| successRate | 22/23 × 100 | **95.7%** |
| avgDuration (say Σ = 34,500ms) | 34,500 / 23 | **1,500ms** |
| lastRun 3h ago → freshness | round(10,800,000 / 3,600,000) | **3h** |
| E07 IMF duration | round(5,500 · (0.7 + sr()·0.6)), sr≈0.64 | ≈ 5,940ms |

The one IMF error surfaces in `errorLog` with a seeded message (e.g. "Timeout after 30s"). Note the
DAMA DQS the guide advertises (≥85% completeness gate) is never computed — a stage can "succeed" while
delivering incomplete data, and the module would not catch it.

### 7.5 Companion analytics

- **Dependency/lineage graph** — the DAG from `buildDependencies()` is genuine and satisfies the
  *structure* (if not the coverage %) of the BCBS-239 lineage requirement.
- **Timeline & flow** — per-run stacked duration by stage type (Extract/Transform/Load).
- **Health score & error log** — operational SRE-style monitoring.

### 7.6 Data provenance & limitations

- **Run outcomes are synthetic** (`sr(s)=frac(sin(s+1)·10⁴)` via the `_sc` counter). Stage definitions
  are real; the monitored history is fabricated and does not reflect actual pipeline runs.
- **No data-quality measurement**: completeness, accuracy, uniqueness (the DAMA dimensions the guide
  names) are never computed. "Quality" collapses to run success/failure.
- **Error probability is amplified 3×** in the simulator (`(error_rate/100)·3`) — the displayed failure
  frequency overstates the configured stage error rates.
- Lineage *coverage %* (guide KPI) is not computed; only the lineage *graph* exists.

**Framework alignment:** The lineage DAG aligns in spirit with **BCBS 239** (risk-data aggregation &
lineage) and **DAMA DMBOK2** data-management practice — but only structurally. A true **ISO 8000** /
DAMA DQS requires the four measured dimensions (completeness, accuracy, timeliness, uniqueness), which
this module does not implement.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's DQS, quarantine gate, and
lineage-coverage % are absent; only operational run stats over synthetic logs exist. Below is the
production data-quality scoring model.

**8.1 Purpose & scope.** Compute a per-run, per-field data-quality score for every ETL stage so that
downstream ESG metrics carry a quality tag and low-quality runs are quarantined before propagation —
the prerequisite for regulatory-grade (BCBS 239) ESG data.

**8.2 Conceptual approach.** A **DAMA DMBOK2 / ISO 8000** four-dimension quality model with rule-based
validation, mirroring enterprise data-observability tooling (Great Expectations, Monte Carlo, dbt
tests). Each dimension is measured against declared expectations, then weighted into a run DQS.

**8.3 Mathematical specification.**

```
Per run, per target schema with fields F:
  Completeness = 1 − (nulls_in_mandatory / mandatory_cells)
  Accuracy     = 1 − (rows_failing_range/reference_checks / rows)
  Timeliness   = clip( 1 − max(0, delivery_time − SLA)/SLA_window , 0, 1)
  Uniqueness   = 1 − (duplicate_keys / rows)               (key = ISIN/LEI)
  DQS = w_c·Completeness + w_a·Accuracy + w_t·Timeliness + w_u·Uniqueness   (Σw = 1)
Gate: quarantine run ⇔ DQS < 0.85
LineageCoverage = downstream_metrics_with_documented_lineage / downstream_metrics
```

| Parameter | Source |
|---|---|
| Dimension weights w | DAMA practice; tune per feed criticality |
| Range/reference checks | Prior-period bounds, cross-source reconciliation |
| SLA windows | Feed contract / scheduler config |
| Quarantine threshold | 0.85 (guide) |

**8.4 Data requirements.** Declared schema with mandatory-field flags; reference ranges per field;
SLA windows per feed; unique-key definitions (ISIN/LEI). Platform already has the stage catalogue,
`globalCompanyMaster` schema, and run scheduler; needs an expectations table and a validation runner.

**8.5 Validation & benchmarking plan.** Inject known bad records (nulls, duplicates, out-of-range) and
confirm DQS drops and quarantine fires; reconcile Accuracy checks against a golden reference feed;
compare against Great Expectations/dbt test results on the same data.

**8.6 Limitations & model risk.** Accuracy checks are only as good as the reference ranges — stale
bounds cause false positives; version them. A high DQS does not guarantee semantic correctness (right
number, wrong meaning). Conservative fallback: on validation-runner failure, quarantine by default
rather than pass-through.

## 9 · Future Evolution

### 9.1 Evolution A — Manage the platform's real 19-ingester fleet, not a simulated one (analytics ladder: rung 1 → 2)

**What.** The §7 flag: the guide's DAMA-based `DQS = w_c·Completeness + w_a·Accuracy + w_t·Timeliness + w_u·Uniqueness` with sub-85% quarantine "computes no DQS at all" — the page simulates runs over an authored `ALL_STAGES` list into LocalStorage, with run logs, health scores, and timelines that are UI theater. Meanwhile the platform operates a *real* ingestion framework — 19 ingesters (GLEIF, IBTrACS, GWIS, OpenFEMA, market data…) with actual schedules, run outcomes, and the lineage harness's endpoint traces. Evolution A binds this manager to that reality.

**How.** (1) A standardized `ingester_runs` registry (run id, source, started, duration, records in/out, status, error) emitted by the ingestion framework — the schema the page's UI already renders, minus the simulation. (2) Implement the DQS per run from real signals: completeness from schema-validation counts, timeliness from schedule-vs-actual, uniqueness from dedup stats, accuracy from range/reference checks where defined; the <85% quarantine flag becomes a real gate on downstream table writes. (3) Lineage tab reads `lineage_output/traces/` — the platform's genuine lineage artifact — instead of a drawn graph; "lineage coverage %" becomes the harness's actual endpoint coverage. (4) Custom-pipeline builder scopes down honestly: configuration of *existing* ingesters (schedule, thresholds, alert channels) rather than a visual builder for arbitrary pipelines nobody will run. (5) Relationship to `dme-hub`'s ops evolution: dme-hub consumes this module's registry for its family view — one run store, two lenses.

**Prerequisites.** Ingester instrumentation pass (each of the 19 emits the registry row); alerting channel decision (the email system exists). **Acceptance:** the run dashboard shows the GLEIF ingester's actual last run; a forced ingester failure appears with its real error and fires the alert; DQS components trace to measured signals; LocalStorage simulation deleted.

### 9.2 Evolution B — Pipeline-failure triage copilot (LLM tier 2)

**What.** Ops questions at 9am: "why did the overnight IBTrACS run fail, has it failed like this before, and is anything downstream stale because of it?" A tool-calling copilot that reads the run registry and error logs, correlates with the run history (recurrence patterns), maps blast radius via the lineage traces (which module endpoints source from the affected tables), and drafts the incident note with remediation suggestions grounded in the error class (auth expiry vs schema drift vs source outage — each with its known fix from the runbook corpus).

**How.** Tools: `get_run(run_id)`, `get_run_history(ingester)`, `get_error_log(filters)`, `get_downstream_consumers(table)` (from lineage traces), `get_dqs_breakdown(run)`. Grounding corpus = this Atlas record plus a curated runbook of known failure modes (the data-sources project memos already document several: UCDP access change, UK EPC auth change — institutional knowledge worth encoding). The copilot diagnoses and drafts; re-run triggers are gated mutations. Staleness claims are computed from freshness fields, never inferred.

**Prerequisites (hard).** Evolution A's real registry — triaging simulated failures is a demo, not operations; the runbook corpus curated from the project's actual ingester history. **Acceptance:** a golden failure's triage note cites the real error text, correct recurrence count, and the true downstream consumer list from lineage traces; unknown error classes are labeled unknown rather than pattern-matched to a wrong runbook entry.