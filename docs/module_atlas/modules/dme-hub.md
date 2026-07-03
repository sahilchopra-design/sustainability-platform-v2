# DME Hub
**Module ID:** `dme-hub` · **Route:** `/dme-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Central hub for the Dynamic Materiality Engine providing navigation to all DME sub-modules, system configuration, data source management, and platform-level materiality settings. Displays a consolidated summary of DME outputs across alerts, entity scores, portfolio views, and competitive intelligence. Administrative controls for topic library and weight configuration.

> **Business value:** Provides administrators and power users with a single governance point for the entire Dynamic Materiality Engine ecosystem, ensuring the platform operates reliably and remains configured to the entity's strategic materiality framework.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIVE_ISSUES`, `COLORS`, `CROSS_MODULE_FEED`, `DME_MODULES`, `ETL_PIPELINES`, `LS_ETL`, `LS_KEY`, `LS_PORTFOLIO`, `LS_RECON`, `LS_SNAPSHOTS`, `LS_VALIDATION`, `LS_VENDOR`, `MODULE_HEALTH`, `QUALITY_TREND`, `ROADMAP`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `fmtM` | `(n) => typeof n === 'number' ? (n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` ` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `today` | `new Date('2025-05-15');` |
| `scores` | `MODULE_HEALTH.map(m => m.score);` |
| `cmp` | `typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));` |
| `totalStorageKB` | `useMemo(() => lsUsage.reduce((s, l) => s + l.sizeKB, 0), [lsUsage]);` |
| `blob` | `new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });` |
| `health` | `MODULE_HEALTH.find(h => h.module.toLowerCase().includes(mod.id.split('-')[1] \|\| mod.id));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTIVE_ISSUES`, `COLORS`, `CROSS_MODULE_FEED`, `DME_MODULES`, `ETL_PIPELINES`, `MODULE_HEALTH`, `QUALITY_TREND`, `ROADMAP`, `SECTIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| DME Health Score | — | DME operations monitor | Composite operational health of the Dynamic Materiality Engine; target ≥0.90 |
| Topics in Library | — | Topic registry | Total ESG topics defined in the DME topic library across E, S, and G dimensions |
| Entities Monitored | — | Entity universe | Count of companies and assets for which DME produces active materiality scores |
| Signal Ingestion Lag | — | Pipeline telemetry | Average delay between external signal publication and ingestion into the DME scoring engine |
- **External signal pipeline (news, regulatory, NGO, financial data)** → Ingestion, deduplication, and NLP topic classification → **Signal inventory with topic tags, sentiment, and source metadata**
- **Topic library and weight configuration** → Topic hierarchy management and weight assignment per entity type → **Configured topic library driving DME scoring**
- **DME operations database** → Freshness, coverage, and error rate monitoring → **DHS time series and operational alert log**

## 5 · Intermediate Transformation Logic
**Methodology:** DME Health Score
**Headline formula:** `DHS = Data Freshness × Coverage Rate × (1 − Error Rate)`
**Standards:** ['EFRAG DME Technical Guidance', 'ISO 8000 Data Quality']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).