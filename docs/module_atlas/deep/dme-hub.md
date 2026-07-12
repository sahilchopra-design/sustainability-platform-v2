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
