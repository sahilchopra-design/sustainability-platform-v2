# Data Versioning
**Module ID:** `data-versioning` · **Route:** `/data-versioning` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Point-in-time ESG data snapshots enable full version control for auditable disclosures and retrospective analysis. Each data change is recorded with actor, timestamp, and change reason, supporting regulatory restatement workflows. Snapshot comparison tools highlight what changed between versions.

> **Business value:** Provides the complete audit trail required by CSRD, GRI, and PCAF for data restatement transparency. Enables compliance teams to demonstrate exactly what data underpinned any historical disclosure and why it may have changed.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `DATA_SOURCES_VERSIONED`, `KPICard`, `LS_AUDIT`, `LS_PORT`, `LS_SCHED`, `LS_SNAP`, `MAX_SNAPSHOTS`, `Section`, `SortHeader`, `TRACKED_FIELDS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v => v == null ? '--' : typeof v === 'number' ? v.toLocaleString() : String(v);` |
| `fmtPct` | `v => v == null ? '--' : `${v.toFixed(1)}%`;` |
| `uid` | `() => `snap_${Date.now()}_${sr(_sc++).toString(36).slice(2, 8)}`;` |
| `count` | `8 + Math.floor(sr(_sc++) * 20);` |
| `field` | `TRACKED_FIELDS[Math.floor(sr(_sc++) * TRACKED_FIELDS.length)];` |
| `oldVal` | `(sr(_sc++) * 100).toFixed(2);` |
| `changePct` | `(-15 + sr(_sc++) * 30);` |
| `newVal` | `(parseFloat(oldVal) * (1 + changePct / 100)).toFixed(2);` |
| `latest` | `snapshots.length ? snapshots[snapshots.length - 1] : null;` |
| `totalRollbacks` | `snapshots.reduce((s, sn) => s + (sn.rollback_count \|\| 0), 0);` |
| `avgSize` | `snapshots.length ? snapshots.reduce((s, sn) => s + sn.size_kb, 0) / snapshots.length : 0;` |
| `newAuditEntries` | `companyKeys.slice(0, 5).map((co, idx) => ({` |
| `fieldChart` | `Object.entries(byField).map(([f, count]) => ({ field: f.replace(/_/g, ' ').slice(0, 18), count })).sort((a, b) => b.count - a.count).slice(0, fieldSli` |
| `sourceChart` | `Object.entries(bySource).map(([s, count]) => ({ source: s, count }));` |
| `uniqueCompanies` | `[...new Set(changes.map(c => c.company))];` |
| `growthData` | `useMemo(() => snapshots.map((s, i) => ({` |
| `blob` | `new Blob([JSON.stringify({ snapshots, audit, exported: nowISO() }, null, 2)], { type: 'application/json' });` |
| `rows` | `audit.map(a => [a.snapshot_from, a.snapshot_to, a.company, a.field, a.old_value, a.new_value, a.change_pct, a.source, a.timestamp, a.changed_by]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DATA_SOURCES_VERSIONED`, `TABS`, `TRACKED_FIELDS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Snapshots | — | Version registry | Count of named point-in-time snapshots retained for audit and comparison |
| Avg Fields Changed per Commit | — | Change log | Mean number of data fields updated in each versioned commit |
| Material Restatements (YTD) | — | Restatement engine | Count of version transitions where a tracked KPI changed by more than 5% versus prior version |
| Oldest Retained Snapshot | — | Retention policy engine | Age of the oldest snapshot under the configured 3-year audit retention policy |
- **ESG data store (all active metrics)** → Snapshot capture triggered by manual tag, scheduled job, or pre-submission hook → **Immutable versioned snapshot stored with metadata**
- **Change event stream** → Diff computation between consecutive or selected snapshots → **Field-level change log with before/after values and actor attribution**
- **Restatement policy rules** → Threshold comparison against materiality limits → **Restatement register with regulatory notification flags**

## 5 · Intermediate Transformation Logic
**Methodology:** Version Drift Index
**Headline formula:** `VDI = Σ |vᵢₜ − vᵢₜ₋₁| / vᵢₜ₋₁ / N`
**Standards:** ['GRI 2-4 Restatements', 'ESRS 2 BP-2', 'PCAF Audit Trail Requirements']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).