# Audit Trail Viewer
**Module ID:** `audit-trail-viewer` · **Route:** `/audit-trail-viewer` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Platform-wide audit log viewer. All user actions, data changes, score modifications, and report generations recorded with timestamp, user ID, and change detail. ISAE 3000 assurance-ready.

> **Business value:** External assurance on sustainability reporting requires comprehensive audit trails. This viewer enables assurance providers to trace any disclosed metric back to its source data, supporting both limited and reasonable assurance under ISAE 3000 and ISAE 3410.

**How an analyst works this module:**
- Audit Search queries by date, user, action, or entity
- Change Diff shows before/after for each modification
- Export generates audit extract for assurance providers

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTION_TYPES`, `AUDIT_EVENTS`, `CALC_AUDITS`, `CHANGE_HEATMAP`, `COLORS`, `COLUMNS_BY_TABLE`, `COMPLIANCE_MODULES`, `DATA_CHANGES`, `ENGINES`, `ENTITY_TYPES`, `SEVERITY_LEVELS`, `TABLES`, `TABS`, `USER_NAMES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `ENGINES` | `['E1-EmissionsCalculator','E2-ScopeMapper','E3-CarbonFootprint','E4-WaterRisk','E5-BiodiversityImpact','E6-ClimatePolicyScorer','E7-ESGRatingEngine','E8-TransitionRisk','E9-PhysicalRisk','E10-SocialImpact','E11-Governanc` |
| `action` | `ACTION_TYPES[Math.floor(sr(i*3)*10)];` |
| `entityType` | `ENTITY_TYPES[Math.floor(sr(i*7)*10)];` |
| `user` | `USER_NAMES[Math.floor(sr(i*11)*20)];` |
| `entityId` | ``${entityType.toUpperCase().slice(0,3)}-${String(Math.floor(sr(i*29)*9000+1000)).padStart(5,'0')}`;` |
| `oldVal` | `action==='edit'?`${(sr(i*31)*100).toFixed(2)}`:null;` |
| `newVal` | `action==='edit'?`${(sr(i*37)*100).toFixed(2)}`:null;` |
| `engine` | `ENGINES[Math.floor(sr(i*100)*25)];` |
| `table` | `TABLES[Math.floor(sr(i*200)*20)];` |
| `col` | `cols[Math.floor(sr(i*203)*cols.length)];` |
| `changeType` | `['manual','import','calculation','system','api'][Math.floor(sr(i*207)*5)];` |
| `CHANGE_HEATMAP` | `TABLES.map((table,ti)=>{` |
| `eventsByAction` | `useMemo(()=>ACTION_TYPES.map(a=>({name:a,count:AUDIT_EVENTS.filter(e=>e.action===a).length})),[]);` |
| `eventsByEntity` | `useMemo(()=>ENTITY_TYPES.map(t=>({name:t,count:AUDIT_EVENTS.filter(e=>e.entityType===t).length})),[]);` |
| `eventTimeline` | `useMemo(()=>Array.from({length:24},(_,i)=>({hour:`${String(i).padStart(2,'0')}:00`,events:AUDIT_EVENTS.filter(e=>+e.timestamp.slice(11,13)===i).length})),[]);` |
| `severityDist` | `useMemo(()=>['info','warning','critical'].map(s=>({name:s,count:AUDIT_EVENTS.filter(e=>e.severity===s).length})),[]);` |
| `calcSuccessRate` | `useMemo(()=>Math.round(CALC_AUDITS.filter(c=>c.status==='Success').length/ Math.max(1, CALC_AUDITS.length)*100),[]);` |
| `avgExecTime` | `useMemo(()=>Math.round(CALC_AUDITS.reduce((a,c)=>a+parseInt(c.executionTime),0)/ Math.max(1, CALC_AUDITS.length)),[]);` |
| `avgDataQuality` | `useMemo(()=>Math.round(CALC_AUDITS.reduce((a,c)=>a+c.dataQualityScore,0)/ Math.max(1, CALC_AUDITS.length)),[]);` |
| `handleSort` | `(col)=>{if(sortCol===col)setSortDir(d=>-d);else{setSortCol(col);setSortDir(-1);}};` |
| `handleChangeSort` | `(col)=>{if(changeSort===col)setChangeSortDir(d=>-d);else{setChangeSort(col);setChangeSortDir(-1);}};` |
| `intensity` | `h.changes/200;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTION_TYPES`, `COLORS`, `ENGINES`, `ENTITY_TYPES`, `SEVERITY_LEVELS`, `TABLES`, `TABS`, `USER_NAMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Log Retention | — | Default | Configurable; SOX requires 7yr minimum |
| Coverage | — | Platform | All data modification events captured |
- **Platform write operations** → Audit event capture → **Immutable audit log**
- **Audit log** → Assurance review → **ISAE 3000 evidence pack**

## 5 · Intermediate Transformation Logic
**Methodology:** Immutable audit log
**Headline formula:** `AuditRecord = {timestamp, user, action, entity, before, after, reason}`

All platform write operations generate immutable audit entries. Tamper-evident logging. Audit queries support time-range, user, entity, and action-type filters.

**Standards:** ['ISAE 3000', 'SOX Section 302/906', 'GDPR Article 5']
**Reference documents:** ISAE 3000 (Revised); SOX Section 302/906

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an "immutable audit log" over
> real platform write operations with "tamper-evident logging", 7-year retention and 100% coverage
> of data-modification events. **The code contains no log at all** — every record on the page is
> generated in the browser at module load from the seeded PRNG (`sr`). Nothing is read from a
> backend, localStorage, or any event stream, and nothing the user does on the platform ever
> appears here. It is a *viewer UI demo* over four synthetic datasets. (Note: a second module,
> `audit-trail`, at least scans real localStorage keys; this one does not.) The guide's schema
> `{timestamp, user, action, entity, before, after, reason}` is approximated, minus `reason`.

### 7.1 What the module computes

Four tabs — Activity Timeline, Calculation Audit, Data Change Log, Compliance Reporting — over four
seeded arrays built once at import time:

| Dataset | Rows | Key generated fields |
|---|---|---|
| `AUDIT_EVENTS` | 500 | user (20 names incl. 'System', 'API Bot'), action (10 types), entityType (10), severity, timestamp (60-day window ending 2026-03-29), synthetic IPv4, sessionId, old/new value (edits only), module, duration, dataQuality 70–100 |
| `CALC_AUDITS` | 80 | engine (25 named engines E1–E25), engineVersion, inputParams (methodology ∈ {GHG Protocol, PCAF, TCFD, TNFD, GRI, SASB}), outputValue/unit, executionTime 200–5,200 ms, dataQualityScore 75–100, refDataVersion, status (95% Success), steps, dataPointsUsed |
| `DATA_CHANGES` | 200 | table (20 tables), column (per-table column lists), changeType ∈ {manual, import, calculation, system, api}, old/new value, rowId, verified (80%) |
| `COMPLIANCE_MODULES` | 43 | domain name, auditEvents 50–550, completenessScore 80–100, gaps 0–4, attestationStatus (~70% Signed Off / ~20% Pending / ~10% Not Started) |

Representative generation formulas (quoted):

```js
action   = ACTION_TYPES[Math.floor(sr(i*3)*10)]
severity = action==='delete' ? 'critical' : action==='edit' ? 'warning' : 'info'
ts       = new Date(2026, 2, 29 − floor(sr(i*13)*60), floor(sr(i*17)*24), …)   // fixed anchor date
oldVal   = action==='edit' ? (sr(i*31)*100).toFixed(2) : null
status   = sr(i*147) > 0.05 ? 'Success' : 'Error'
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Severity rule | delete→critical, edit→warning, else info | deterministic mapping in code |
| Calc success threshold | `sr > 0.05` (≈95% success) | synthetic demo value |
| Data-quality ranges | events 70–100; calcs 75–100 | synthetic demo values |
| Change `verified` rate | `sr > 0.2` (≈80%) | synthetic demo value |
| Timestamp anchor | 2026-03-29, minus 0–60 days | hard-coded |
| Heatmap intensity | `changes / 200` | normalising constant |

No constant traces to an external standard; the methodology names inside `inputParams`
(GHG Protocol, PCAF, TCFD, TNFD, GRI, SASB) are labels only.

### 7.3 Calculation walkthrough

1. **Activity Timeline** — filter chain (search over user/entityId/module; action/entity/severity/
   user dropdowns) then generic sort `(av<bv?-1:av>bv?1:0)*sortDir` on a copied array; paginated by
   `visibleCount` (30 default). Charts: events by action, by entity type, per-hour histogram
   (parsing hour from the timestamp string), severity distribution.
2. **Calculation Audit** — engine/user search + engine filter; KPIs:
   `calcSuccessRate = round(#Success / max(1,80) × 100)`,
   `avgExecTime = round(Σ parseInt(executionTime) / max(1,80))` (parses the "ms" strings),
   `avgDataQuality = round(Σ dataQualityScore / max(1,80))`. Row click opens a detail pane with
   input params, ref-data version, steps and confidence interval.
3. **Data Change Log** — table/type filters, sortable; optional heatmap view over
   `CHANGE_HEATMAP` (20 tables × their column lists, `changes = floor(sr(ti*300+ci*7)*200+5)`,
   cell shading `intensity = changes/200`).
4. **Compliance Reporting** — 43 domain rows with completeness, gaps and attestation status;
   period/format selectors (`Q1 2026`, JSON/CSV) are UI state only.

Note the sort comparator uses string comparison for every column — numeric-looking fields such as
`duration` ("500ms") and timestamps sort lexicographically, which is correct for the zero-padded
timestamps but ordinal-wrong for durations (e.g. "99ms" > "500ms").

### 7.4 Worked example — event i = 0

- `action = ACTION_TYPES[floor(sr(0)×10)]`: sr(0) = frac(sin(1)×10⁴) = 0.70985 → index 7 →
  **'import'** → severity **'info'** (not delete/edit).
- `entityType = ENTITY_TYPES[floor(sr(0)×10)]` — same seed (i×7 = 0) → index 7 → **'dataset'**.
- `user = USER_NAMES[floor(sr(0)×20)]` — seed i×11 = 0 again → floor(0.70985×20) = 14 →
  **'Charlotte Nguyen'**.
- Day offset `floor(sr(0)×60)` = floor(42.59…) → wait: `sr(i*13)=sr(0)=0.70985`, ×60 = 42.59 →
  **42 days before 2026-03-29 → 2026-02-15**.

Because seeds `i*3, i*7, i*11, i*13` all collapse to 0 for the first record, its fields are
perfectly correlated — a visible artefact of the seeding scheme at i = 0.

### 7.5 Companion analytics

- 25-engine catalogue (E1-EmissionsCalculator … E25-NetZeroTracker) gives the Calculation Audit tab
  a realistic engine-registry feel; versions and ref-data versions are seeded strings.
- The per-hour timeline and module × category counts are purely descriptive statistics of the
  synthetic arrays.

### 7.6 Data provenance & limitations

- **100% synthetic**: all four datasets derive from `sr(seed) = frac(sin(seed+1)×10⁴)` at module
  import. No API, no localStorage, no session identity — the viewer can never show a real action,
  and refreshing the page regenerates the identical dataset (deterministic seeds).
- No immutability or tamper evidence; nothing is persisted, so there is nothing to tamper with —
  but equally nothing to assure. The guide's ISAE 3000 "evidence pack" claim has no code path
  (export selectors render but the compliance export is presentational).
- IP addresses and session IDs are fabricated numerics; treat any resemblance to real addresses as
  coincidental.
- Duplicate-seed correlation (§7.4) and lexicographic duration sorting are known artefacts.
- A production viewer would page a server-side `audit_trail` table (which exists in the platform's
  synthetic table list here, ironically) with authenticated user identity and server timestamps.

### 7.7 Framework alignment

- **ISAE 3000 (Revised)** — external assurance requires evidence trails linking disclosed metrics
  to source data; the Calculation Audit tab *models* exactly the right artefact (engine, version,
  inputs, ref-data version, output, data-quality score) — the schema is assurance-grade even
  though the content is synthetic.
- **SOX §302/§906** — officer certification of reporting controls presumes complete, retained
  change logs (typically 7 years); nothing here is retained.
- **GDPR Art 5 (guide reference)** — the accountability principle (5(2)) motivates logging of
  processing activity; a real implementation must also respect storage limitation (5(1)(e)) —
  synthetic IPs sidestep this entirely.
- The `refDataVersion` + `engineVersion` pattern mirrors model-risk-management expectations
  (SR 11-7-style reproducibility: same inputs + same version ⇒ same output) and is the most
  production-worthy idea in the module.

## 9 · Future Evolution

### 9.1 Evolution A — Real calculation-audit ledger from the engine registry (analytics ladder: rung 1 → 3)

**What.** §7's flag is unambiguous: this page contains **no log at all** — all four datasets (500 events, 80 calc audits, 200 data changes, 43 compliance rows) are seeded-PRNG fabrications built at module import; nothing a user does ever appears here. Yet §7.6 identifies its most production-worthy idea: the Calculation Audit schema (engine, engineVersion, inputParams, refDataVersion, output, dataQualityScore, executionTime) "mirrors model-risk-management expectations (SR 11-7-style reproducibility)". Evolution A builds exactly that ledger for real — differentiating this module from the sibling `audit-trail` (user-action stream) by owning the **calculation** audit dimension.

**How.** (1) A `calculation_audit` table written by engine invocations, populated via the validation-summary engine's envelope (`calculation_id`, inputs, methodology reference, outputs hash, confidence — already computed for wrapping engines) plus execution time and engine version from the planned engine registry (roadmap §3: version stamps in every engine response). (2) The page's Calculation Audit tab reads this table; its KPIs (`calcSuccessRate`, `avgExecTime`, `avgDataQuality`) become real aggregates. (3) Fix the documented sort defect while porting: the generic comparator sorts every column as strings, so durations order "99ms" > "500ms". (4) Rung 3: a reproducibility check — re-run a sampled calculation with its recorded inputs and engine version and compare output hashes, the SR 11-7 test made executable.

**Prerequisites.** Engine-registry version stamps (platform work, not this module); envelope adoption across the 22+ registry engines; retire all four PRNG generators including the documented i=0 seed-collapse artefact. Decide the module boundary with `audit-trail` explicitly — two audit viewers with real backends must not overlap. **Acceptance:** running any wrapped engine creates a visible ledger row; the reproducibility check passes for a deterministic engine and flags a version-changed one; duration sorting is numeric.

### 9.2 Evolution B — Model-risk Q&A over the calculation ledger (LLM tier 2)

**What.** With a real ledger, this module answers the questions a model-risk or assurance reviewer actually asks: "which engine versions produced the Q1 PCAF numbers?", "did any calculation run on stale reference data?", "show me every failed run of the ECL engine this month and the input pattern" — each a tool call against the calculation-audit API, with the LLM contributing pattern description and SR 11-7-framed narrative, never the underlying counts.

**How.** Read-only tool schemas (query by engine/version/period/status, aggregate KPIs, reproducibility-check trigger — the last gated behind confirmation since it consumes compute). Grounding corpus: this Atlas record plus the methodology registry from `api::validation_summary` (which standard governs each engine), so "is this calculation IFRS 9-conformant?" is answered by citing the registry entry, not model memory. Answers about data-quality trends cite the DQS-derived confidence values stored in the envelopes. The refusal path: questions about calculations predating the ledger's go-live return "no audit record exists for that period" — the honest answer a real MRM function gives about pre-instrumentation history.

**Prerequisites (hard).** Evolution A; a copilot over the current synthetic arrays would invent an audit history for engines that never ran. **Acceptance:** every engine name, version, count, and timestamp in an answer resolves to a ledger row; a question about an unwrapped engine returns the documented coverage gap rather than a fabricated record.