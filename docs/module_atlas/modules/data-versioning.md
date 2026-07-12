# Data Versioning
**Module ID:** `data-versioning` · **Route:** `/data-versioning` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Point-in-time ESG data snapshots enable full version control for auditable disclosures and retrospective analysis. Each data change is recorded with actor, timestamp, and change reason, supporting regulatory restatement workflows. Snapshot comparison tools highlight what changed between versions.

> **Business value:** Provides the complete audit trail required by CSRD, GRI, and PCAF for data restatement transparency. Enables compliance teams to demonstrate exactly what data underpinned any historical disclosure and why it may have changed.

**How an analyst works this module:**
- Tag a snapshot before any bulk data update or regulatory submission to create a named restore point
- Use the diff viewer to compare any two snapshots field-by-field
- Flag material restatements and attach a justification note for the audit record
- Export a version history report for disclosure appendix or regulator request

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `DATA_SOURCES_VERSIONED`, `KPICard`, `LS_AUDIT`, `LS_PORT`, `LS_SCHED`, `LS_SNAP`, `MAX_SNAPSHOTS`, `Section`, `SortHeader`, `TRACKED_FIELDS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TABS` | 7 | `label` |

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
| `kpis` | `useMemo(() => { const latest = snapshots.length ? snapshots[snapshots.length - 1] : null;` |
| `totalRollbacks` | `snapshots.reduce((s, sn) => s + (sn.rollback_count \|\| 0), 0);` |
| `avgSize` | `snapshots.length ? snapshots.reduce((s, sn) => s + sn.size_kb, 0) / snapshots.length : 0;` |
| `newAuditEntries` | `companyKeys.slice(0, 5).map((co, idx) => ({` |
| `fieldChart` | `Object.entries(byField).map(([f, count]) => ({ field: f.replace(/_/g, ' ').slice(0, 18), count })).sort((a, b) => b.count - a.count).slice(0, fieldSlider);` |
| `sourceChart` | `Object.entries(bySource).map(([s, count]) => ({ source: s, count }));` |
| `uniqueCompanies` | `[...new Set(changes.map(c => c.company))];` |
| `growthData` | `useMemo(() => snapshots.map((s, i) => ({` |
| `blob` | `new Blob([JSON.stringify({ snapshots, audit, exported: nowISO() }, null, 2)], { type: 'application/json' });` |
| `rows` | `audit.map(a => [a.snapshot_from, a.snapshot_to, a.company, a.field, a.old_value, a.new_value, a.change_pct, a.source, a.timestamp, a.changed_by]);` |
| `csv` | `[headers, ...rows].map(r => r.join(',')).join('\n');` |
| `current` | `snapshots[snapshots.length - 1];` |
| `totalSize` | `snapshots.reduce((sum, sn) => sum + sn.size_kb, 0);` |
| `pct` | `totalSize > 0 ? (s.size_kb / totalSize * 100) : 0;` |

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

The drift index measures the mean absolute percentage change across all tracked metrics between two snapshot versions, flagging material restatements that may require regulatory notification. Each individual change is logged with before/after values and change rationale.

**Standards:** ['GRI 2-4 Restatements', 'ESRS 2 BP-2', 'PCAF Audit Trail Requirements']
**Reference documents:** GRI Standards 2021 â€” GRI 2-4 Restatements of information; ESRS 2 BP-2 Disclosures in relation to specific circumstances; PCAF (2022) Audit Trail and Data Governance Guidance; ISAE 3000 (Revised) Assurance Engagements Other than Audits

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide advertises a *Version Drift Index* `VDI = Σ|vᵢₜ − vᵢₜ₋₁|/vᵢₜ₋₁ / N` — a mean-absolute-
percentage-change across tracked metrics between two snapshots. The code **tracks per-field
before/after changes and change_pct** (the building blocks of VDI) and flags material restatements by
a threshold, but the change values themselves are **synthetically generated**, not diffed from real
consecutive data loads. The mechanics (snapshot, diff, restatement flag, retention) are real; the
underlying change magnitudes are seeded demo data.

### 7.1 What the module computes

```js
snapshots  = 5 seed snapshots (or LS)   // {id, timestamp, company_count, fields_count, size_kb, data_hash, source}
audit      = buildSeedAudit(snapshots)  // per-transition field-level change log
// each audit row:
oldVal    = (sr(_sc++)·100).toFixed(2)
changePct = -15 + sr(_sc++)·30          // ∈ [-15%, +15%]
newVal    = oldVal·(1 + changePct/100)
```

31 `TRACKED_FIELDS` (revenue, market cap, EVIC, ESG E/S/G, Scope 1/2/3, intensity, SBTi, implied
temperature, PCAF score, taxonomy-aligned %, physical/transition risk…) are versioned across 8
`DATA_SOURCES_VERSIONED` (EODHD, Alpha Vantage, BRSR Supabase, OpenFIGI, CBI Bonds, IMF Climate,
World Bank, Manual Overrides). Each snapshot carries a `data_hash` (`hashStr(ts + company_count)`),
a `size_kb`, a `company_count`, and a `source`.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Seed snapshots | 5, weekly-spaced | synthetic (`Initial Load`, `BRSR Sync`, `EODHD Update`, `ESG Refresh`, `Weekly Auto`) |
| Change-pct band | −15% … +15% | `sr()`-seeded demo |
| Changes per transition | 8 + ⌊sr·20⌋ | synthetic |
| Retention cap | `MAX_SNAPSHOTS = 10` | code policy |
| Material threshold | >5% (per guide) | restatement rule (GRI 2-4 materiality proxy) |
| Data hash | `hashStr(ts + cc)` 8-hex | integrity fingerprint (not cryptographic) |

`_sc` is a mutable global counter feeding `sr(_sc++)` so each seeded draw is distinct — a stable but
entirely synthetic change history.

### 7.3 Calculation walkthrough

Snapshot creation captures a new versioned record (uid `snap_{ts}_{rand}`, `data_hash`, size, counts)
and prepends it (retention trims to 10). The **diff viewer** compares any two snapshots field-by-field
using the audit log's `old_value/new_value/change_pct`. KPIs aggregate: latest snapshot's company/field
counts, `totalRollbacks`, `avgSize`, snapshot growth over time (`growthData`), change frequency
`byField` and `bySource` bar charts, and the count of transitions where a tracked KPI moved >5%
(material restatements). Export writes the full `{snapshots, audit}` to JSON or a flattened CSV.

### 7.4 Worked example

A `revenue_usd_mn` audit row seeds `oldVal = 62.40`, `changePct = +7.3%`:
`newVal = 62.40 × 1.073 = 66.96`. Because 7.3% > the 5% materiality threshold, this transition is
counted as a **material restatement** and would (in the guide's design) trigger a regulatory-
notification flag. A field-level VDI over one transition with N=3 tracked fields changing by 7.3%,
2.1%, 11.0% would be `(0.073 + 0.021 + 0.110)/3 = 0.068 = 6.8%` — but note the page reports individual
change_pct and a >5% count rather than computing the aggregated VDI scalar the guide names.

### 7.5 Data provenance & limitations

- **All change magnitudes are synthetic**, seeded by `sr(seed) = frac(sin(seed+1)×10⁴)` via the
  `_sc` counter. Snapshot company/field counts are near-real (derived from `GLOBAL_COMPANY_MASTER`
  length) but the field-level deltas are manufactured.
- `Object.keys(GLOBAL_COMPANY_MASTER)` is used to size counts — note the master is an array, so this
  yields numeric indices; company names in the audit are keyed off `.slice(0,40)` of those keys
  (a latent quirk: audit "company" labels may be array indices, not names).
- `data_hash` is a non-cryptographic djb2-style fingerprint — good for change detection, not tamper
  evidence. No real immutability (localStorage is mutable).
- The aggregated VDI scalar is not computed; restatement flagging uses a flat >5% per-field rule.

**Framework alignment:** GRI 2-4 (Restatements of information) — requires disclosing restatements and
their effect; the change log + material-restatement flag is a direct implementation of that audit
trail. ESRS 2 BP-2 (disclosures re: specific circumstances, incl. prior-period adjustments) and PCAF
audit-trail guidance both require reproducible point-in-time data provenance — the snapshot + hash +
actor/timestamp model provides the skeleton. ISAE 3000 assurance engagements depend on exactly this
kind of versioned before/after evidence to re-perform prior disclosures.

## 9 · Future Evolution

### 9.1 Evolution A — Diff real consecutive loads; compute the VDI (analytics ladder: rung 1 → 2)

**What.** §7's verdict: the mechanics are real — snapshot records with hashes,
field-level before/after change logs, restatement flagging by threshold,
retention — but "the change values themselves are synthetically generated, not
diffed from real consecutive data loads", and the guide's Version Drift Index
(`VDI = Σ|vᵢₜ−vᵢₜ₋₁|/vᵢₜ₋₁/N`) is assembled from seeded parts. Evolution A makes
snapshots and diffs operate on actual platform data.

**How.** (1) Real snapshots: a server-side snapshot service capturing the tracked
tables (company master, captured records, golden records from
`data-reconciliation`) at tag-time — content-hashed, stored with actor and reason
via AuditMiddleware; the `localStorage` seed snapshots retire. (2) Real diffs:
field-level comparison between any two snapshots computed on demand, with
`change_pct` from actual values — the building blocks §7 says exist get real
inputs. (3) VDI computed per the formula over tracked metrics, with the
materiality threshold configurable and each flagged restatement requiring the
justification note the workflow promises. (4) Integration: a locked golden
record's change between snapshots is exactly the trigger for
`data-reconciliation`'s restatement drafter — one restatement pipeline, two
modules' promises fulfilled. (5) Retention policy per the D4/D5 governance
roadmap stages.

**Prerequisites.** Snapshot storage sizing (hash-dedup or column-level deltas —
full copies of 577 tables won't scale); the tracked-table registry decision.
**Acceptance:** tagging a snapshot, changing one company's Scope 1, and tagging
again yields a diff containing exactly that change; VDI reproduces by hand from
the diff; a change above threshold cannot be saved without a justification note.

### 9.2 Evolution B — Restatement-disclosure drafter from version history (LLM tier 1 → 2)

**What.** The module's regulatory purpose — GRI 2-4 and ESRS BP-2 restatement
transparency — culminates in written disclosure: what was restated, why, and the
effect. Evolution B drafts it from the (post-Evolution A) real version history:
the flagged material changes between the disclosure-tagged snapshots, their
justification notes, the affected metrics with before/after values, and the
disclosure-format paragraph per the cited standards — every figure from the diff
record, every rationale from the attached note, nothing reconstructed from memory.

**How.** Tier 1 over the diff payloads and justification notes plus the GRI
2-4/ESRS BP-2 texts (shared corpus with `data-reconciliation`'s drafter —
deliberately the same restatement pipeline); tier 2 adds tool calls to the
snapshot/diff service so "draft the FY25 restatement appendix" retrieves the
tagged snapshot pair itself. The export joins the version-history report the
module already promises for regulator requests.

**Prerequisites (hard).** Evolution A (drafting restatements from seeded change
magnitudes would fabricate the exact artifact regulators use to check honesty);
justification notes present on flagged changes. **Acceptance:** every restated
figure in a draft matches the diff record; changes below the materiality
threshold are excluded per the documented rule; the draft cites each change's
justification note verbatim or summarized with reference.