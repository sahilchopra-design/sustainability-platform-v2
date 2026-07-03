# API Orchestration
**Module ID:** `api-orchestration` · **Route:** `/api-orchestration` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG data pipeline orchestration layer managing multi-provider API workflows, data transformation, normalisation, and routing to downstream platform modules. Supports DAG-based workflow definition, retry logic, data lineage capture, and provider failover. Enables operations teams to configure data feeds from Bloomberg, MSCI, Sustainalytics, and proprietary sources without code changes.

> **Business value:** Robust API orchestration is the invisible backbone of ESG data quality: without lineage capture and failover logic, data gaps from provider outages silently degrade disclosure accuracy. The orchestration layer ensures that every data point in the platform can be traced to its source, transformation, and ingestion timestamp.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COVERAGE_FIELDS`, `DATA_SOURCES`, `FIELD_SOURCE_MAP`, `KPICard`, `LS_CONFIG`, `LS_KEYS`, `LS_LOG`, `LS_PORT`, `PIPELINES_INIT`, `STATUS_COLORS`, `TIER_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v => v == null ? '--' : typeof v === 'number' ? v.toLocaleString() : String(v);` |
| `fmtPct` | `v => v == null ? '--' : `${v.toFixed(1)}%`;` |
| `totalCalls24` | `sources.reduce((s, d) => s + (d.calls_24h \|\| Math.round(sr(_sc++) * 20)), 0);` |
| `totalErrors24` | `sources.reduce((s, d) => s + d.errors_24h, 0);` |
| `avgLatency` | `Math.round(sources.filter(s => s.avg_latency_ms > 0).reduce((a, s) => a + s.avg_latency_ms, 0) / Math.max(1, sources.filter(s => s.avg_latency_ms > 0)` |
| `companiesCov` | `sources.filter(s => typeof s.companies_covered === 'number').reduce((a, s) => a + s.companies_covered, 0);` |
| `bondsCov` | `50 + 0; // CBI certified` |
| `countriesCov` | `190; // IMF` |
| `pipelineSuccessRate` | `pipelineLog.length > 0 ? (pipelineLog.filter(e => e.status === 'success').length / pipelineLog.length * 100) : 100;` |
| `rateLimits` | `useMemo(() => sources.filter(s => s.status !== 'planned').map(s => {` |
| `used` | `Math.round(sr(_sc++) * max * 0.6);` |
| `cacheInfo` | `useMemo(() => sources.filter(s => s.cache_ttl_hrs > 0).map(s => {` |
| `size` | `Math.round(sr(_sc++) * 500 + 50);` |
| `dur` | `1500 + Math.round(sr(_sc++) * 3000);` |
| `records` | `50 + Math.round(sr(_sc++) * 500);` |
| `csv` | `[headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `hoursAgo` | `s.last_call ? Math.round((Date.now() - new Date(s.last_call).getTime()) / 3600000) : null;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COVERAGE_FIELDS`, `DATA_SOURCES`, `PIPELINES_INIT`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Pipeline Success Rate | — | Orchestration log | Percentage of scheduled pipeline runs completing without error |
| Data Freshness | `now() – last_run` | Orchestration scheduler | Time elapsed since each data feed was last successfully refreshed |
| Field Coverage | `Populated / Total × 100` | Data quality monitor | Proportion of required data fields populated across all portfolio companies |
- **Bloomberg / MSCI / Sustainalytics APIs** → Extract ESG fields; transform to platform schema; capture lineage metadata per field → **Normalised ESG records in platform database with full source lineage**
- **Orchestration scheduler** → Execute DAGs on cron schedule; apply retry logic on failure; trigger failover chain → **Pipeline run logs, freshness metrics, and coverage reports**

## 5 · Intermediate Transformation Logic
**Methodology:** DAG-based pipeline orchestration with lineage
**Headline formula:** `Pipeline_latency = Σ(node_processing_time_i); Data_freshness = now() – last_successful_run; Coverage = Populated_fields / Total_fields × 100`
**Standards:** ['Apache Airflow DAG pattern', 'DAMA DMBOK Data Lineage', 'ISO 8000 Data Quality']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).