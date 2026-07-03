# Data Infrastructure Hub
**Module ID:** `data-infra-hub` · **Route:** `/data-infra-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Monitors platform data infrastructure performance including storage utilisation, query performance, pipeline health, database replication, and API availability. Provides operational intelligence for platform administrators ensuring sustainability data platform uptime and performance SLAs.

> **Business value:** Provides platform administrators with full operational visibility of the data infrastructure underpinning the sustainability platform, enabling proactive capacity management, rapid incident response, and evidence of platform reliability for SOC 2 and ISO 27001 audits.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIVITY_FEED`, `ALERTS`, `Badge`, `Btn`, `DATA_SOURCES`, `DataInfraHubPage`, `KpiCard`, `LS_KEY`, `MODULES`, `MODULE_DATA_DEPS`, `PIE_COLORS`, `Section`, `Slider`, `SortHeader`, `StatusDot`, `UPGRADE_RECS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seeded` | `(seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `fmt` | `(n) => n == null ? '--' : typeof n === 'number' ? (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n.toLocaleString())` |
| `pct` | `(n) => n == null ? '--' : n.toFixed(1) + '%';` |
| `sources` | `['Yahoo Finance', 'BRSR Supabase', 'Open FIGI', 'Company Master', 'IMF Climate', 'NSE/BSE'];` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
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
**Standards:** ['AWS Well-Architected Framework', 'PostgreSQL Performance Guidelines', 'SLO Engineering Practices']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).