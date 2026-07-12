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
