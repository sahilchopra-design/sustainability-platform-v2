# Calculation Engine Monitor
**Module ID:** `calculation-engine-monitor` · **Route:** `/calculation-engine-monitor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time monitoring dashboard for all platform calculation pipelines covering GHG inventory, temperature scoring, PCAF attribution, CRREM pathways, and stress testing engines. Tracks pipeline run status, calculation accuracy KPIs, data freshness, and error rates. Provides operators with a centralised view of engine health and performance SLAs.

> **Business value:** Calculation engine monitoring prevents silent failures where pipeline crashes or stale data cause incorrect values to appear in disclosures without triggering visible errors. Centralised health scoring with SLA tracking gives data operations teams the visibility to prioritise remediation, maintain disclosure data quality, and evidence governance controls to assurance providers.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_ENGINES`, `CORE_ENGINES`, `ENGINE_CONFIGS`, `EXEC_HISTORY`, `MONTHS`, `PIE_COLORS`, `SECONDARY_ENGINES`, `SHADOW_TESTS`, `STATUSES`, `STATUS_COLORS`, `TABS`, `TRIGGERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr,s)=>arr[Math.floor(sr(s)*arr.length)];` |
| `rng` | `(min,max,s)=>min+sr(s)*(max-min);` |
| `rngI` | `(min,max,s)=>Math.floor(rng(min,max,s));` |
| `ALL_ENGINES` | `[...CORE_ENGINES, ...SECONDARY_ENGINES].map((e,i)=>({` |
| `status` | `sr(i*201) > 0.92 ? 'error' : sr(i*203) > 0.04 ? 'success' : 'warning';` |
| `dur` | `rngI(100, 60000, i*207);` |
| `inCount` | `rngI(10, 50000, i*211);` |
| `ENGINE_CONFIGS` | `ALL_ENGINES.slice(0,10).map((eng,i)=>({` |
| `fmtDate` | `(iso) => new Date(iso).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});` |
| `fmtK` | `(v) => v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':String(v);` |
| `next` | `ALL_ENGINES.filter(e=>!placed.has(e.id)&&e.depIds.every(d=>placed.has(d))).map(e=>e.id);` |
| `remaining` | `ALL_ENGINES.filter(e=>!placed.has(e.id)).map(e=>e.id);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_ENGINES`, `CORE_ENGINES`, `MONTHS`, `PIE_COLORS`, `STATUSES`, `TABS`, `TRIGGERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Engine Count Monitored | — | Platform | Total calculation engines tracked: GHG, PCAF, CRREM, ITR, stress test, and 13 others |
| Overall Pipeline Health | `Composite of success, freshness, accuracy` | Monitor | Aggregate health score; green ≥80, amber 60–80, red <60 |
| SLA Breach Rate (24h) | — | Scheduler | Percentage of scheduled engine runs missing their SLA in the last 24 hours |
- **Calculation engine run logs and result outputs** → Aggregate success rates, latency, and freshness; compute composite health score → **Engine health dashboard with RAG status, SLA breach flags, and error summaries**
- **Reference calculation benchmarks** → Run spot-check calculations; compare against engine output; compute accuracy delta → **Accuracy score per engine with anomaly alerts for significant deviations**

## 5 · Intermediate Transformation Logic
**Methodology:** Pipeline health composite scoring
**Headline formula:** `Engine_health = 0.40×Success_rate + 0.30×Freshness_score + 0.30×Accuracy_score; Freshness_score = 1 – (Age_hrs / SLA_hrs)`
**Standards:** ['ISO 9001 Process Monitoring', 'GHG Protocol Data Quality', 'PCAF DQ Scale']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).