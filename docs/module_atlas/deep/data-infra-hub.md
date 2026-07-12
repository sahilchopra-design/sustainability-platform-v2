## 7 · Methodology Deep Dive

The guide describes a *Platform Health Score* — `HealthScore = 0.35·Uptime + 0.30·QueryPerf +
0.20·PipelineHealth + 0.15·StorageStatus`. The code is an **infrastructure-monitoring dashboard**: 11
data sources with status/latency/call-count/error metrics, 6 modules with health flags, alerts, and
cost/benefit and quota views. The aggregation arithmetic (total calls, error rate, avg latency) is real,
but every underlying metric is **hard-coded or `seeded()`-generated**, and the weighted health-score
formula from the guide is not actually computed on the page. Partial mismatch: real roll-up maths over
authored/seeded telemetry.

### 7.1 What the module computes

```js
totalCalls  = Σ DATA_SOURCES.calls_today                            // real sum
totalErrors = Σ DATA_SOURCES.errors                                 // real sum
avgLatency  = round(Σ latency (where >0) / count(>0))               // real average
errorRate   = totalCalls>0 ? totalErrors/totalCalls·100 : 0         // real
pctUsed     = c.used / c.limit · 100                                // quota %
```
These are genuine aggregations; `DATA_SOURCES` metrics themselves are authored, and a `seeded()` helper
generates some derived series. The guide's composite HealthScore weights are not applied in the code.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| DATA_SOURCES | 11 (type, status, fields, companies, latency, calls_today, errors) | curated demo (Yahoo, BRSR Supabase, OpenFIGI, IMF Climate, NSE/BSE…) |
| Error rate | `totalErrors/totalCalls·100` | **real** |
| Avg latency | mean of positive latencies | **real** |
| Quota % | `used/limit·100` | **real** |
| MODULES | 6 (name, status, health, path) | curated |
| MODULE_DATA_DEPS | 11 (sources, fields, dq_dep) | curated dependency map |
| UPGRADE_RECS | 6 (benefit, cost, priority, coverage_delta) | curated recommendations |
| Health-score weights (guide) | 0.35/0.30/0.20/0.15 | **not implemented** |
| Sources list | Yahoo Finance, BRSR Supabase, OpenFIGI, Company Master, IMF Climate, NSE/BSE | **real** platform sources |

### 7.3 Calculation walkthrough

`DATA_SOURCES` (11 static rows) → totals (calls, errors, fields), avg latency, error rate. Cost/benefit
view maps each source; quota view shows `used/limit`. Module tab shows the 6 modules' health flags and
their data dependencies (`MODULE_DATA_DEPS`). Alerts are static. The `seeded()` helper backs some
derived chart series. No live infrastructure telemetry is ingested.

### 7.4 Worked example (error rate)

Eleven sources summing to 48,200 calls today with 63 errors, latencies (positive) averaging 340 ms:
```
totalCalls  = 48,200 ; totalErrors = 63
errorRate   = 63/48200·100 = 0.131%
avgLatency  = round(Σ positive latency / n) = 340 ms
```
A source with quota `used=8,400 / limit=10,000` → `pctUsed = 84%` (approaching the 90% saturation
alert). These roll-ups are correct arithmetic over authored metrics.

### 7.5 Data provenance & limitations

- **Aggregations (totals, error rate, avg latency, quota %) are real**; the 11 source metrics, 6
  modules, alerts and upgrade recommendations are **hard-coded/seeded demo values**.
- **The guide's weighted HealthScore is not computed** on the page — no uptime/query-perf/pipeline/
  storage composite exists.
- No connection to CloudWatch/Datadog/pg_stat_statements; all telemetry is authored.

**Framework alignment:** AWS Well-Architected (reliability/performance) · PostgreSQL performance
guidelines · Google SRE SLO practice (uptime 99.9%, P95 latency targets, quota saturation alerts). The
dashboard mirrors these operational KPIs conceptually; the metrics are placeholders for real telemetry.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Infrastructure metrics are authored/seeded; no
live telemetry or composite health score is computed.

**8.1 Purpose & scope.** Real-time operational visibility of the platform's data infrastructure —
uptime, query latency, pipeline health, storage, API availability — with a composite health score and
SLO-based alerting.

**8.2 Conceptual approach.** An **SLO/error-budget health model** over live telemetry — the Google SRE /
AWS Well-Architected pattern; each component scored against its SLO and rolled to a weighted composite.

**8.3 Mathematical specification.**
```
Uptime_30d   = available_minutes / total_minutes
QueryPerf    = clamp(0,1, 1 − P95_latency / SLA_latency)
PipelineH    = success_runs / total_runs (rolling 7d) · latency_factor
StorageStat  = clamp(0,1, headroom / target_headroom)
HealthScore  = 0.35·Uptime + 0.30·QueryPerf + 0.20·PipelineH + 0.15·StorageStat
ErrorBudget  = 1 − Uptime_30d vs (1 − SLO)                          # burn-rate alerting
```

| Parameter | Source |
|---|---|
| Uptime / latency | CloudWatch / Datadog |
| Query P95 | PostgreSQL `pg_stat_statements` |
| Pipeline runs | orchestrator logs |
| Storage headroom | DB storage metrics |
| SLO targets | governance (99.9%, P95<500ms) |

**8.4 Data requirements.** Live infra metrics (uptime, latency percentiles, pipeline runs, storage,
connections). Sources: CloudWatch/Datadog, PostgreSQL, orchestrator. None currently wired.

**8.5 Validation & benchmarking.** Reconcile computed uptime to incident logs; verify P95 against DB
telemetry; test error-budget burn-rate alerts against real degradation; benchmark against SRE SLO
targets and SOC 2 availability evidence.

**8.6 Limitations & model risk.** Composite scores can mask a single failing component; sampling gaps
bias percentiles. Fallback: surface component scores and error-budget burn alongside the composite, and
alert on burn-rate rather than instantaneous dips.
