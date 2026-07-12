# Data Infrastructure Hub
**Module ID:** `data-infra-hub` · **Route:** `/data-infra-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Monitors platform data infrastructure performance including storage utilisation, query performance, pipeline health, database replication, and API availability. Provides operational intelligence for platform administrators ensuring sustainability data platform uptime and performance SLAs.

> **Business value:** Provides platform administrators with full operational visibility of the data infrastructure underpinning the sustainability platform, enabling proactive capacity management, rapid incident response, and evidence of platform reliability for SOC 2 and ISO 27001 audits.

**How an analyst works this module:**
- Overview Dashboard shows real-time health score with component breakdown
- Database Performance tab displays query latency percentiles, slow query log, and index utilisation
- Pipeline Operations tab monitors all active ETL pipeline runs with success/fail status
- Storage Analytics tab shows utilisation trends and 90-day capacity projection
- API Gateway tab tracks endpoint availability, latency, and error rate by service
- Alert Configuration tab sets custom thresholds for Slack/email infrastructure notifications

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIVITY_FEED`, `ALERTS`, `Badge`, `Btn`, `DATA_SOURCES`, `DataInfraHubPage`, `KpiCard`, `LS_KEY`, `MODULES`, `MODULE_DATA_DEPS`, `PIE_COLORS`, `Section`, `Slider`, `SortHeader`, `StatusDot`, `UPGRADE_RECS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DATA_SOURCES` | 11 | `type`, `status`, `fields`, `companies`, `latency`, `calls_today`, `errors` |
| `MODULES` | 6 | `name`, `status`, `health`, `path`, `desc`, `icon`, `color` |
| `ALERTS` | 6 | `severity`, `type`, `desc`, `module`, `time` |
| `MODULE_DATA_DEPS` | 11 | `sources`, `fields`, `dq_dep` |
| `UPGRADE_RECS` | 6 | `benefit`, `cost`, `priority`, `coverage_delta` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seeded` | `(seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `fmt` | `(n) => n == null ? '--' : typeof n === 'number' ? (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n.toLocaleString()) : String(n);` |
| `pct` | `(n) => n == null ? '--' : n.toFixed(1) + '%';` |
| `sources` | `['Yahoo Finance', 'BRSR Supabase', 'Open FIGI', 'Company Master', 'IMF Climate', 'NSE/BSE'];` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `cmp` | `typeof v1 === 'number' ? v1 - v2 : String(v1 \|\| '').localeCompare(String(v2 \|\| ''));` |
| `totalCalls` | `DATA_SOURCES.reduce((s, d) => s + d.calls_today, 0);` |
| `totalErrors` | `DATA_SOURCES.reduce((s, d) => s + d.errors, 0);` |
| `avgLatency` | `Math.round(DATA_SOURCES.filter(d => d.latency > 0).reduce((s, d) => s + d.latency, 0) / DATA_SOURCES.filter(d => d.latency > 0).length);` |
| `totalFields` | `DATA_SOURCES.reduce((s, d) => s + d.fields, 0);` |
| `errorRate` | `totalCalls > 0 ? (totalErrors / totalCalls * 100) : 0;` |
| `costBenefitData` | `DATA_SOURCES.map(d => ({` |
| `pctUsed` | `(c.used / c.limit * 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERTS`, `DATA_SOURCES`, `MODULES`, `MODULE_DATA_DEPS`, `PIE_COLORS`, `TABS`, `UPGRADE_RECS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Platform Uptime (30d) | — | Infrastructure monitoring | Rolling 30-day platform availability; SLA target is 99.9% (8.7 hours annual downtime budget) |
| P95 Query Latency | — | Database monitoring | 95th percentile query response time; degradation alerts trigger above 1,000ms |
| Storage Utilisation | — | Database storage metrics | Current database storage utilisation; capacity planning triggers at 70% |
| Pipeline Success Rate | — | Pipeline monitoring | Proportion of ETL pipeline runs completing without error in rolling 7-day window |
| Active DB Connections | — | PostgreSQL metrics | Current active database connection count; pool saturation alerts above 180 (90% of pool max) |
- **AWS CloudWatch / Datadog infrastructure metrics** → Aggregate uptime, latency, and error rate metrics per service → **Real-time platform health score**
- **PostgreSQL pg_stat_statements** → Analyse slow query log, compute latency percentiles, identify index gaps → **Query performance dashboard**
- **Pipeline execution logs** → Track run success/fail, compute rolling success rate and mean latency → **Pipeline health score per ETL job**

## 5 · Intermediate Transformation Logic
**Methodology:** Platform Health Score
**Headline formula:** `HealthScore = 0.35×Uptime + 0.30×QueryPerf + 0.20×PipelineHealth + 0.15×StorageStatus`

Uptime measured as 30-day rolling availability percentage (target >99.9%). Query performance scored by P95 query latency vs SLA threshold (target P95 <500ms for standard queries). Pipeline health combines success rate and latency across all active ETL pipelines. Storage status monitors utilisation growth rate and projected capacity headroom (target >30% headroom).

**Standards:** ['AWS Well-Architected Framework', 'PostgreSQL Performance Guidelines', 'SLO Engineering Practices']
**Reference documents:** AWS Well-Architected Framework â€” Reliability and Performance Pillars; PostgreSQL 16 Performance and Monitoring Documentation; Google SRE Book â€” Service Level Objectives; Supabase Platform Documentation

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Sense the platform instead of describing it (analytics ladder: rung 1 → 2)

**What.** §7's verdict: real roll-up arithmetic (total calls, error rate, avg
latency, quota %) over authored telemetry — the 11 `DATA_SOURCES` rows, 6 module
health flags, alerts, and upgrade recommendations are hard-coded/seeded, and the
guide's weighted `HealthScore = 0.35·Uptime + 0.30·QueryPerf + 0.20·Pipeline +
0.15·Storage` is never computed. The platform, meanwhile, generates real telemetry
this page ignores: 18 `audit_*` tables capture every request (the roadmap's D4
stage plans materialized views over them), ingester runs log outcomes, and
Postgres exposes `pg_stat_statements`. Evolution A wires the senses.

**How.** (1) API telemetry: materialized views over the audit tables give real
per-endpoint call counts, error rates, and latency percentiles — the D4 warehouse
work this module should be the first consumer of. (2) Database: a scheduled
`pg_stat_statements` snapshot into a metrics table covers query-latency P95 and
slow-query surfacing (Supabase exposes the extension). (3) Pipeline health from
the data-hub sync logs (real ingester outcomes). (4) Storage: table-size growth
from `pg_total_relation_size` snapshots with the 90-day projection the overview
promises (linear fit is honest here). (5) Compute the guide's weighted HealthScore
from these four real components; alerts become threshold evaluations over live
metrics. The 11-source registry stays as configuration, its metrics now measured.

**Prerequisites.** The D4 materialized-view layer (this module is its natural
first customer); metric-snapshot scheduling; seed purge. **Acceptance:** the
error-rate KPI changes when a real endpoint 500s; P95 latency matches a direct
`pg_stat_statements` query; the HealthScore decomposes into four live components
with the documented weights.

### 9.2 Evolution B — Incident-triage copilot for platform operators (LLM tier 2)

**What.** Operational dashboards answer "what"; operators need "why". Evolution B:
when a health component degrades, the copilot investigates by tool call — which
endpoints drive the error-rate spike (audit-view query), whether a slow query
correlates (statements snapshot), whether an ingester failure explains stale data
(sync logs) — and drafts the incident note: timeline, affected modules (via the
dependency map `MODULE_DATA_DEPS` maintains), suspected cause, and the evidence
trail. SOC 2-style operational evidence, generated from real telemetry.

**How.** Tier-2 read-only tools over the Evolution A metric views — deliberately no
mutating operations (an ops copilot that restarts things is a different risk
class; start with diagnosis). Grounding: the SRE/SLO conventions §5 cites plus the
platform's own architecture documentation. Every claim in an incident note cites a
metric query result; "suspected cause" language is mandatory — the copilot
correlates, humans conclude.

**Prerequisites (hard).** Evolution A's live telemetry (triage over authored
metrics would be theater); metric-view query tools. **Acceptance:** for a
synthetically induced failure (kill one ingester), the copilot's note identifies
the right component and downstream modules; every number in the note reproduces
from the views; no remediation action is executed by the copilot.