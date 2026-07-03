# Live Feed Manager
**Module ID:** `live-feed-manager` · **Route:** `/live-feed-manager` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Central management console for financial and ESG data feed ingestion, covering WebSocket real-time streams, REST API polling, SFTP batch delivery, and third-party vendor feed configurations. Monitors feed health, data latency, field completeness, and schema drift with automated alerting. Supports feed prioritisation, fallback routing, and audit logging for platform data governance.

> **Business value:** Gives data engineering and governance teams full visibility and control over ESG and financial data feed quality, ensuring platform analytics are built on complete, timely, and accurate inputs with a defensible audit trail.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AV_ENDPOINTS`, `Badge`, `Btn`, `COVERAGE_FIELDS`, `Card`, `EODHD_ENDPOINTS`, `EXCHANGE_FEEDS`, `FIELD_MAPPING`, `LS_FEED_CFG`, `LS_FEED_KEYS`, `LS_FEED_LOG`, `LS_PORTFOLIO`, `SortIcon`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `defaultCfg` | `useMemo(() => EXCHANGE_FEEDS.reduce((a, f) => { a[f.exchange] = { enabled:true, frequency:'daily', time:'06:00' }; return a; }, {}), []);` |
| `maskKey` | `(k) => k ? k.slice(0,4) + '****' + k.slice(-4) : '';` |
| `data` | `EXCHANGE_FEEDS.map(f => ({ ...f, coverage_pct:f.coverage_pct \|\| Math.round((f.fields_covered\|\|15)/(f.fields_total\|\|35)*100) }));` |
| `totalCompanies` | `EXCHANGE_FEEDS.reduce((s,f) => s + f.companies, 0);` |
| `avgCoverage` | `Math.round(EXCHANGE_FEEDS.reduce((s,f) => s + (f.coverage_pct\|\|50), 0) / EXCHANGE_FEEDS.length);` |
| `lastGlobalUpdate` | `'2025-03-25 06:00 UTC';` |
| `now` | `new Date('2025-03-25T18:00:00Z');` |
| `avgFreshness` | `Math.round(freshness.reduce((s,f) => s + f.hours, 0) / freshness.length);` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k]??''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });` |
| `pct` | `(api.used / api.limit) * 100;` |
| `totalCo` | `exData.reduce((s,f) => s + f.companies, 0);` |
| `avgCov` | `Math.round(exData.reduce((s,f) => s + (f.coverage_pct\|\|50), 0) / exData.length);` |
| `days` | `Array(7).fill(0).map(() => sr(_sc++) > 0.08 ? 'ok' : sr(_sc++) > 0.5 ? 'slow' : 'fail');` |
| `successPct` | `Math.round(days.filter(d => d === 'ok').length / 7 * 100);` |
| `exchanges` | `EXCHANGE_FEEDS.map(f => f.exchange);` |
| `baseDate` | `new Date('2025-03-25T06:00:00Z');` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BRSR_TABLES`, `COVERAGE_FIELDS`, `EXCHANGE_FEEDS`, `FIELD_MAPPING`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Feed Latency (ms) | — | Platform ingestion timestamp vs. vendor publish timestamp | End-to-end delay from data source to platform availability; >500ms triggers SLA alert |
| Field Completeness (%) | — | Schema conformance checker | Proportion of expected fields populated per inbound record |
| Daily Record Volume | — | Platform ingestion counter | Total records ingested per feed per day; drops >20% trigger volume anomaly alert |
| Schema Drift Events (30d) | — | Automated schema comparator | Number of unexpected field additions, removals, or type changes detected in the past 30 days |
- **WebSocket / REST API vendor connections** → Ingest real-time or polled records; timestamp on receipt; validate against schema → **Raw inbound record stream with ingestion metadata**
- **Schema registry** → Compare inbound field set to registered schema version; detect drift; log changes → **Schema conformance report and drift event log**
- **Feed quality metrics aggregator** → Compute FQS components per feed per hour; persist to time-series store → **Feed health dashboard and SLA breach alert queue**

## 5 · Intermediate Transformation Logic
**Methodology:** Feed Quality Score
**Headline formula:** `FQS = w₁×Completeness + w₂×Timeliness + w₃×Accuracy`
**Standards:** ['DAMA Data Management Body of Knowledge v2', 'ISO/IEC 25012 Data Quality Model', 'IOSCO Principles for Financial Benchmarks 2013', 'EDMC FIBO Financial Data Standards']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).