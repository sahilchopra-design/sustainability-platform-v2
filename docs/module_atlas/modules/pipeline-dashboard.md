# Pipeline Dashboard
**Module ID:** `pipeline-dashboard` · **Route:** `/pipeline-dashboard` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Monitors data ingestion pipeline status, throughput, latency, and error rates across all ESG and climate data feeds.

> **Business value:** Provides operations-level visibility into all data ingestion workflows, enabling rapid fault detection and data freshness assurance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `BADGE`, `DEFAULT_PIPELINES`, `DEMO_HISTORY`, `DEMO_STATS`, `MANUAL_FIELDS`, `STATUS_COLOR`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `fakeStatus` | `sr(_sc++) > 0.15 ? 'success' : 'failed';` |
| `ids` | `new Set(prev.map(p => p.id));` |
| `sortedDurations` | `[...filtHistBase].filter(r=>r.duration_ms).map(r=>r.duration_ms).sort((a,b)=>a-b);` |
| `trendData` | `Object.values(dayBuckets).sort((a,b) => a.day.localeCompare(b.day)).slice(-14);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DEFAULT_PIPELINES`, `MANUAL_FIELDS`
**Shared context buses:** `TestDataContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Pipelines | — | Platform Telemetry | Count of data pipelines currently scheduled and operational. |
| Avg Latency (min) | — | Pipeline Logs | Mean time from data source update to platform availability. |
| Error Rate (%) | — | Error Tracking | Percentage of pipeline runs terminating in a fault state over rolling 24 hours. |
- **Source API / file drop / CDC events** → Extraction; validation; transformation; load; reconciliation → **Processed dataset in platform data warehouse with lineage metadata**

## 5 · Intermediate Transformation Logic
**Methodology:** Pipeline Health Score
**Headline formula:** `H = (successful_runs / total_runs) × (1 – error_rate)`
**Standards:** ['Internal Platform Telemetry']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).