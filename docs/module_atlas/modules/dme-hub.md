# DME Hub
**Module ID:** `dme-hub` · **Route:** `/dme-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Central hub for the Dynamic Materiality Engine providing navigation to all DME sub-modules, system configuration, data source management, and platform-level materiality settings. Displays a consolidated summary of DME outputs across alerts, entity scores, portfolio views, and competitive intelligence. Administrative controls for topic library and weight configuration.

> **Business value:** Provides administrators and power users with a single governance point for the entire Dynamic Materiality Engine ecosystem, ensuring the platform operates reliably and remains configured to the entity's strategic materiality framework.

**How an analyst works this module:**
- Use the sub-module navigation to access Alerts, Entity View, Portfolio, Scenarios, and other DME tools
- Manage the topic library and configure topic weights in DME Configuration
- Review DME Health Score and resolve any data freshness or coverage issues in the pipeline monitor
- Set entity universe scope and schedule automated score refresh frequency

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIVE_ISSUES`, `COLORS`, `CROSS_MODULE_FEED`, `DME_MODULES`, `ETL_PIPELINES`, `LS_ETL`, `LS_KEY`, `LS_PORTFOLIO`, `LS_RECON`, `LS_SNAPSHOTS`, `LS_VALIDATION`, `LS_VENDOR`, `MODULE_HEALTH`, `QUALITY_TREND`, `ROADMAP`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DME_MODULES` | 6 | `name`, `desc`, `path`, `icon`, `color` |
| `MODULE_HEALTH` | 6 | `status`, `score`, `lastRun`, `issues`, `critical`, `rulesActive`, `rulesPassing` |
| `QUALITY_TREND` | 10 | `overall`, `validation`, `reconciliation`, `versioning`, `etl`, `governance`, `target` |
| `ETL_PIPELINES` | 9 | `name`, `source`, `schedule`, `lastRun`, `status`, `duration`, `records`, `errors` |
| `ACTIVE_ISSUES` | 11 | `module`, `severity`, `description`, `field`, `count`, `created`, `status` |
| `ROADMAP` | 9 | `priority`, `action`, `module`, `impact`, `effort`, `owner`, `status`, `eta` |
| `CROSS_MODULE_FEED` | 7 | `dmeInput`, `qualityImpact`, `score` |
| `SECTIONS` | 7 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `fmtM` | `(n) => typeof n === 'number' ? (n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n)) : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `today` | `new Date('2025-05-15');` |
| `maturityScore` | `useMemo(() => { const scores = MODULE_HEALTH.map(m => m.score);` |
| `cmp` | `typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));` |
| `totalStorageKB` | `useMemo(() => lsUsage.reduce((s, l) => s + l.sizeKB, 0), [lsUsage]);` |
| `blob` | `new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });` |
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

The DME health score reflects the operational status of the materiality engine: data freshness (hours since last signal ingestion), coverage rate (share of topics with active signals), and signal processing error rate. A DHS below 0.80 triggers a system alert to the platform administrator.

**Standards:** ['EFRAG DME Technical Guidance', 'ISO 8000 Data Quality']
**Reference documents:** EFRAG (2022) Dynamic Materiality Assessment Technical Guidance; ESRS 1 (2023) Chapter 3 â€” Materiality Assessment Process and Documentation; GRI 3 (2021) Material Topics Determination

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code note.** The MODULE_GUIDES entry for the DME family frames these pages as materiality
> scoring. **This page is not analytical** — it is the **DME Data-Ops hub**: a governance/health console
> over the five data-infrastructure modules (Validation, Reconciliation, Versioning, ETL, Governance).
> There is no materiality score, PD, or VaR here; the page aggregates hard-coded status tables and a
> handful of counts over `GLOBAL_COMPANY_MASTER`.

### 7.1 What the module computes

The hub is a **dashboard-of-dashboards**. It renders curated status objects and derives simple roll-ups:

- **Module health** (`MODULE_HEALTH`, 5 rows) — each carries a `status` (healthy/warning), a `score`
  (85–97), issue/critical counts, and module-specific KPIs (rules passing, sources active, snapshots
  stored, pipeline duration, compliance rate). These are **authored constants**, not computed.
- **Quality trend** (`QUALITY_TREND`, 9 months) — overall + per-module data-quality scores vs a moving
  `target`, for a line chart. Hand-authored time series.
- **ETL pipelines** (`ETL_PIPELINES`, 8 rows) — real source names (EODHD, SEBI/BSE BRSR, World Bank,
  CBI, ND-GAIN, OpenFIGI, CSRD/iXBRL) with schedule, last-run, status, record and error counts.
- **Active issues** (`ACTIVE_ISSUES`, ~11 rows) — a data-quality issue log (severity, field, count,
  status) referencing concrete gaps ("14 companies missing Scope 1 for PCAF Tier 1").
- **Roadmap** and **cross-module feed** tables complete the view.

Derived values are limited to counts and averages over these tables and over the company master
(e.g. total companies, records ingested via `fmtM`). Any per-company enrichment reuses the
`sRand(n)=frac(sin(n+1)×10⁴)` PRNG seeded by a djb2 name hash.

### 7.2 Parameterisation / scoring rubric

| Object | Rows | Nature |
|---|---|---|
| `DME_MODULES` | 5 | Route registry (id, name, path, icon, colour) |
| `MODULE_HEALTH` | 5 | Authored health scores 85–97 + KPIs |
| `QUALITY_TREND` | 9 | Authored monthly quality scores vs target |
| `ETL_PIPELINES` | 8 | Authored pipeline status (real source names) |
| `ACTIVE_ISSUES` | ~11 | Authored DQ issue log |
| `ROADMAP` / `CROSS_MODULE_FEED` | 9 / 7 | Authored planning + data-flow tables |

There is **no scoring formula** — the "scores" are static demo values. LocalStorage keys
(`ra_portfolio_v1`, `ra_validation_rules_v1`, etc.) let the hub read state written by the underlying
data-ops modules, so counts can partly reflect real user actions in this browser session.

### 7.3 Calculation walkthrough

1. On mount, the page reads any persisted state from LocalStorage (portfolio, validation rules,
   reconciliation config, snapshots, ETL schedule, vendor assessments).
2. It merges that with the authored `MODULE_HEALTH`/`ETL_PIPELINES`/`ACTIVE_ISSUES` tables.
3. Headline tiles count healthy vs warning modules, open critical issues, active pipelines, and
   overall quality (latest `QUALITY_TREND.overall`).
4. Clicking a module card navigates to that data-ops route.

### 7.4 Worked example

Overall health tile = average of the five `MODULE_HEALTH.score` values: (94 + 91 + 97 + 85 + 92)/5 =
459/5 = **91.8 → "healthy"** (one module, ETL at 85, shown "warning" with 1 critical issue). Open
critical issues = count of `ACTIVE_ISSUES.severity === 'critical'` (ISS01 PCAF Scope-1 gap, ISS05
CSRD/iXBRL failure) = **2**.

### 7.5 Data provenance & limitations

- **Health scores, quality trend, pipeline status and issue log are authored demo constants**, not
  measured — they will not change unless the underlying modules write LocalStorage state.
- ETL source names and issue descriptions are realistic (they name genuine free data sources the
  platform ingests) but the run metrics are illustrative.
- No statistical model runs here; this file needs **no §8 model specification** — it is a monitoring
  surface, and the modelling rigor belongs to the data-ops modules it links to (Data Validation,
  Reconciliation, Versioning, ETL, Governance).

**Framework alignment:** mirrors **DAMA-DMBOK** data-governance domains (data quality, master-data
reconciliation, lineage/versioning, ETL orchestration, policy/stewardship) and the **PCAF data-quality
score** concept (the issue log flags PCAF Tier-1 Scope-1 gaps). It is an operational-readiness view, not
a quantitative risk model.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the health score from real platform telemetry (analytics ladder: rung 1 → 2)

**What.** The §7 note is candid: "this page is not analytical" — it's a data-ops console whose `MODULE_HEALTH` scores (85–97), `QUALITY_TREND` series, `ETL_PIPELINES` statuses, and `ACTIVE_ISSUES` log are all **authored constants**. Yet the platform actually possesses the telemetry the page pretends to display: 18 `audit_*` tables capture every request, the ingestion framework runs 19 real ingesters with per-run stats, and `lineage_output/summary.json` records endpoint pass/fail across 292 domains. Evolution A computes the guide's `DHS = Freshness × Coverage × (1 − ErrorRate)` from those real sources.

**How.** (1) New `GET /api/v1/dme/ops-health` endpoint: freshness from ingester last-run timestamps, coverage from lineage-sweep pass rates per DME module, error rate from audit-log 5xx counts — replacing the hand-authored tables. (2) `ETL_PIPELINES` becomes a live read of the ingestion framework's run registry (the seed table already names the real sources: EODHD, BRSR, World Bank, ND-GAIN, OpenFIGI). (3) `ACTIVE_ISSUES` wires to genuine data-quality checks (the "14 companies missing Scope 1" style entries become computed assertions over the company master). (4) Rung 2: DHS history persisted per module with the guide's <0.80 admin alert implemented as a real threshold rule.

**Prerequisites.** Materialized views over `audit_*` (the roadmap's D4 stage — this module is its natural first consumer); ingester run metadata standardized. **Acceptance:** killing one ingester's schedule visibly degrades the freshness component within a day; zero authored health constants remain; the DHS<0.80 alert fires in a fault-injection test.

### 9.2 Evolution B — DME desk orchestrator seated at the hub (LLM tier 3)

**What.** As the family's navigation and governance point, the hub is where a cross-module DME orchestrator belongs: "give me the full materiality picture for entity X" should route across the sub-modules — topic scores from dme-entity, alert state from dme-alerts, contagion centrality from dme-contagion, index position from dme-index, PD context from dme-pd-engine — and synthesize one memo, with the hub's ops-health data gating the answer ("entity scores are 9 days stale — refresh before relying on this").

**How.** Routing knowledge from `module_tags.json` DME tags plus the Atlas interconnection graph; tool surface = the read-only endpoints of the six DME sub-modules as they land their own §9 Evolution A backends. The freshness gate is the hub-specific contribution: every synthesized memo carries the DHS components of its input modules, so stale data is disclosed rather than laundered. Output composes through report-studio per the tier-3 pattern.

**Prerequisites (hard).** At least dme-entity and dme-alerts Evolution A shipped (topic persistence + alert archive) — orchestrating today's seeded sub-modules would synthesize fabrications at desk scale; Evolution A's ops-health endpoint for the freshness gate. **Acceptance:** a golden entity memo cites every figure to a named sub-module endpoint and displays input freshness; when a sub-module's health is red, the memo flags it instead of silently including stale numbers.