# ETL Pipeline Manager
**Module ID:** `etl-pipeline` · **Route:** `/etl-pipeline` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages the configuration, scheduling, monitoring, and quality assurance of ESG data ETL pipelines ingesting data from external providers, regulatory databases, company filings, and internal systems. Provides a visual pipeline builder, run history, data quality monitoring dashboards, and automated alerting for pipeline failures or data anomalies. Supports lineage tracking and audit trails required for GDPR, BCBS 239, and ESMA data governance compliance.

> **Business value:** Provides the data engineering and governance foundation for the entire ESG analytics platform, ensuring every metric, rating, and KPI consumed by downstream modules is traceable, quality-controlled, and delivered within SLA â€” a prerequisite for regulatory-grade ESG disclosure and investment decision-making.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_STAGES`, `Badge`, `Btn`, `ETL_STAGES`, `KPICard`, `LS_CUSTOM`, `LS_LOG`, `LS_PORT`, `LS_SCHED`, `STAGE_TYPE_COLORS`, `Section`, `SortHeader`, `StatusDot`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v => v == null ? '--' : typeof v === 'number' ? v.toLocaleString() : String(v);` |
| `fmtPct` | `v => v == null ? '--' : `${v.toFixed(1)}%`;` |
| `inputs` | `(stage.input \|\| '').split(',').map(s => s.trim()).filter(Boolean);` |
| `stageRuns` | `ALL_STAGES.map(s => ({` |
| `arr` | `[...ALL_STAGES, ...customStages.map(c => ({ ...c, type: 'Custom' }))];` |
| `totalRecords` | `ALL_STAGES.reduce((s, st) => s + (typeof st.records === 'number' ? st.records : 0), 0);` |
| `successRate` | `latestRuns.length ? (latestRuns.filter(r => r.status === 'success').length / latestRuns.length * 100) : 100;` |
| `avgDuration` | `latestRuns.length ? latestRuns.reduce((s, r) => s + r.duration_ms, 0) / latestRuns.length : 0;` |
| `lastRunDate` | `runLog.length ? runLog[runLog.length - 1].started : null;` |
| `freshness` | `lastRunDate ? Math.round((Date.now() - new Date(lastRunDate).getTime()) / 3600000) : null;` |
| `newRun` | `ALL_STAGES.map(s => ({` |
| `runs` | `[...new Set(runLog.map(r => r.run_id))].slice(-10);` |
| `totalMs` | `stages.reduce((s, r) => s + r.duration_ms, 0);` |
| `latestRun` | `[...new Set(runLog.map(r => r.run_id))].pop();` |
| `errorLog` | `useMemo(() => runLog.filter(r => r.status === 'error').slice(-30).reverse(), [runLog]);` |
| `latest` | `[...new Set(runLog.map(r => r.run_id))].pop();` |
| `successPct` | `stages.length ? stages.filter(s => s.status === 'success').length / stages.length * 100 : 100;` |
| `avgLatency` | `stages.length ? stages.reduce((s, r) => s + r.duration_ms, 0) / stages.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_STAGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Pipeline Run DQS (%) | — | DAMA DMBOK2 | Overall data quality score for a pipeline run; below 85% triggers quarantine and analyst review before downstr |
| Record Completeness (%) | — | Schema Validation | Proportion of mandatory fields with non-null values; 100% required for financial-grade ESG data ingestion. |
| Timeliness SLA Adherence (%) | — | Pipeline Scheduler | Percentage of scheduled pipeline runs completing within the contracted SLA window; critical for market-hours d |
| Lineage Coverage (%) | — | Data Catalogue | Proportion of downstream ESG metrics with documented lineage to source system, transformation, and load step. |
- **External ESG provider APIs (MSCI, Sustainalytics, Bloomberg, CDP)** → Scheduled API calls with retry logic; schema validation on ingestion; DQS computation per run → **Validated ESG data records with DQS metadata and lineage tag**
- **Regulatory databases (EDGAR, SEDAR, ESMA FIRDS)** → Event-triggered or nightly batch extraction; filing metadata enrichment; deduplication by ISIN/LEI → **Structured regulatory disclosure records with source URL and filing date**
- **Internal portfolio and CRM systems** → Bidirectional sync via certified API; conflict resolution rules for overlapping data fields → **Enriched internal records with ESG data fields and lineage documentation**

## 5 · Intermediate Transformation Logic
**Methodology:** Pipeline Data Quality Score
**Headline formula:** `DQS = w_c × Completeness + w_a × Accuracy + w_t × Timeliness + w_u × Uniqueness`
**Standards:** ['DAMA DMBOK2 2017', 'BCBS 239 Principles 2013', 'ISO 8000 Data Quality']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).