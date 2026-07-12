# Audit Trail Viewer
**Module ID:** `audit-trail` · **Route:** `/audit-trail` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Immutable platform audit log capturing all data changes, user actions, report generations, and access events. Provides full ISAE 3000 and SOX-compliant evidence packs with tamper-evident hash chains, granular search by user, action type, and timestamp. Supports external auditor access for sustainability assurance engagements.

> **Business value:** An immutable, hash-chained audit trail is the foundational control that enables external assurance providers to give limited or reasonable assurance on ESG disclosures. Without it, auditors cannot verify that data was not manipulated between measurement and reporting, making ISAE 3000 engagement scope and testing prohibitively expensive.

**How an analyst works this module:**
- Search audit log by user, date range, action type, or target entity
- Event Detail tab shows full before/after values for any data change
- Hash Chain Integrity tab shows last verification status and timestamps
- User Activity tab ranks users by action volume for anomaly detection
- ISAE 3000 Export generates formatted evidence pack for external auditors
- Retention Policy tab configures log archival periods per data classification

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDIT_CATEGORIES`, `Badge`, `Btn`, `DATE_RANGES`, `KpiCard`, `MAX_EVENTS`, `MODULES`, `SEVERITIES`, `STORAGE_KEY`, `Section`, `SevBadge`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `AUDIT_CATEGORIES` | 9 | `name`, `icon`, `color`, `description`, `examples` |
| `DATE_RANGES` | 4 | `l`, `d` |
| `TABS` | 7 | `id`, `l` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `catMap` | `Object.fromEntries(AUDIT_CATEGORIES.map(c => [c.id, c]));` |
| `sRand` | `seed => { let x=Math.sin(seed + 1) * 10000; return x-Math.floor(x); };` |
| `fmtDate` | `d => new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});` |
| `fmtTime` | `d => new Date(d).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});` |
| `daysBetween` | `(a,b) => Math.floor((new Date(b)-new Date(a))/(86400000));` |
| `catIds` | `AUDIT_CATEGORIES.map(c=>c.id);` |
| `catIdx` | `hash(key+i) % catIds.length;` |
| `eventsPerDay` | `Math.floor(sRand(day*7+42)*6)+2;` |
| `act` | `actList[Math.floor(sRand(day*19+j*3)*actList.length)];` |
| `companies` | `useMemo(()=>(GLOBAL_COMPANY_MASTER\|\|[]).slice(0,80),[]);  // Portfolio read (wrapped format) const portfolio = useMemo(()=>{ try { const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1')\|\|'{}');` |
| `filtered` | `useMemo(()=>{ const cutoff = Date.now() - dateRange*86400000;` |
| `catDist` | `useMemo(()=>AUDIT_CATEGORIES.map(c=>({ name:c.name, value:filtered.filter(e=>e.category===c.id).length, color:c.color })).filter(d=>d.value>0),[filtered]);` |
| `dayData` | `{ date: d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) };` |
| `complianceEvents` | `useMemo(()=>events.filter(e=>e.category==='compliance'\|\|e.severity==='critical'\|\|e.category==='report_generation'),[events]);  // Data integrity check const integrityIssues = useMemo(()=>{ const issues = [];` |
| `coNames` | `companies.map(c=>c.name);` |
| `cutoff` | `Date.now() - purgeDays*86400000;` |
| `rows` | `filtered.map(e=>[e.id,e.timestamp,e.category,e.action,`"${(e.detail\|\|'').replace(/"/g,"'")}"`,e.module,e.entity,e.user,e.severity,e.before_value\|\|'',e.after_value\|\|'',e.reversible]);` |
| `csv` | `[headers.join(','),...rows.map(r=>r.join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `entityList` | `useMemo(()=>[...new Set(events.map(e=>e.entity).filter(Boolean))].sort(),[events]);` |
| `maxV` | `Math.max(...moduleHeatmap.map(r=>r[c.id]\|\|0),1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AUDIT_CATEGORIES`, `DATE_RANGES`, `MODULES`, `SEVERITIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Audit Events (30d) | — | Audit log database | Total platform events captured in the last 30 days across all users and modules |
| Chain Integrity | `Hash_n verification` | Hourly integrity check | Percentage of audit log records passing hash chain validation; <100% is a critical alert |
| ISAE 3000 Evidence Pack | — | Platform export | Structured evidence pack exported for external assurance engagements with full event detail |
- **Platform application event stream** → Append each event to hash chain with SHA-256; store in immutable log partition → **Tamper-evident audit log with hourly chain integrity verification**
- **ISAE 3000 assurance engagement scope** → Filter log by scope period and entity; format per assurance provider template → **Structured evidence pack with event details, hash proofs, and user activity summary**

## 5 · Intermediate Transformation Logic
**Methodology:** Hash-chained immutable event log
**Headline formula:** `Hash_n = SHA256(event_n || Hash_{n-1}); Integrity_check = (Computed_chain == Stored_chain)`

Each audit event is appended to a hash chain: the SHA-256 hash of each record includes the previous record's hash, making retrospective modification detectable. Integrity checks run hourly; any chain break triggers an immediate P0 alert. Event schema captures user, action, target entity, old value, new value, and IP.

**Standards:** ['ISAE 3000 (Revised)', 'SOX Section 404', 'ISO/IEC 27001 Audit Logging']
**Reference documents:** ISAE 3000 Revised Assurance Engagements; SOX Section 404 Internal Controls; ISO/IEC 27001:2022 Logging and Monitoring

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *hash-chained immutable*
> audit log — `Hash_n = SHA256(event_n || Hash_{n-1})` — with hourly integrity verification, P0
> alerts on chain break, IP capture, and "immutable log partitions". **No cryptography exists in
> this module.** The implementation is a **browser-localStorage event viewer** (`ra_audit_log_v1`,
> capped at 500 events) whose history is largely *synthetically generated*, fully mutable (users
> can purge it from the Retention tab), and whose "Data Integrity Check" is a heuristic
> consistency scan of other localStorage keys — not hash verification. Sections below document the
> code as it behaves.

### 7.1 What the module computes

The page builds and displays an event log with schema
`{id, timestamp, category, action, detail, module, entity, user, before_value, after_value,
reversible, severity}` across 8 audit categories (data_change, model_run, portfolio_action,
report_generation, alert_action, engagement, config_change, compliance) and 16 named platform
modules. On first load (or when the stored log has ≤ 10 events) it calls
`generateSyntheticEvents(companies)`:

```js
// 1) "Real" events: scan 9 localStorage keys (ra_portfolio_v1, ra_manual_overrides, …)
catIdx = hash(key+i) % catIds.length          // hash = 31-based string hash (Math.imul)
// 2) Synthetic history: 90 days
eventsPerDay = Math.floor(sRand(day*7+42)*6)+2        // 2–7 events/day
sev = sRand(day*31+j) < 0.1 ? 'critical' : (<0.35 ? 'warning' : 'info')   // 10/25/65% split
user = sRand(day*41+j) < 0.3 ? 'Manual' : 'System'
reversible = sRand(day*47+j) < 0.6
```

`sRand(seed) = frac(sin(seed+1)×10⁴)` is the platform PRNG. Events are sorted newest-first and
truncated to `MAX_EVENTS = 500`, then persisted back to `ra_audit_log_v1`.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `MAX_EVENTS` | 500 | code constant (storage cap) |
| Synthetic history window | 90 days, 2–7 events/day | code constants |
| Severity mix | 10% critical / 25% warning / 65% info | seeded thresholds |
| Manual-vs-System user split | 30% / 70% | seeded threshold |
| Date-range filters | 7d / 30d / 90d / All | `DATE_RANGES` |
| Retention purge default | 90 days (user-set `purgeDays`) | UI state |
| Scanned localStorage keys | 9 (`ra_portfolio_v1`, `ra_manual_overrides`, `ra_materiality_assessment_v1`, `ra_report_history_v1`, `ra_stewardship_v1`, `ra_compliance_actions_v1`, `ra_sfdr_assessments_v1`, `ra_scenario_results_v1`, `ra_pd_results_v1`) | code list |

All are engineering constants, not values from an audit-logging standard.

### 7.3 Calculation walkthrough

1. **Load** — parse `ra_audit_log_v1`; if > 10 events, use it; else regenerate synthetically.
2. **Filter pipeline** — category set ∩ severity set ∩ `timestamp ≥ now − dateRange·86,400,000 ms`
   ∩ free-text search over action/detail/entity/module.
3. **KPIs** — total events, today's count, and per-category counts (unfiltered `events`).
4. **Analytics** — category pie (`catDist` on filtered set); 30-day stacked area trend (per-day ×
   per-category counts); module × category heatmap with cell shading normalised by
   `maxV = max(counts, 1)`; entity activity ranking (top 30, excluding 'System') with per-entity
   drill-down history.
5. **Compliance evidence view** — `complianceEvents = category=='compliance' ∪ severity=='critical'
   ∪ category=='report_generation'` (the "evidence pack" is just this filter).
6. **Integrity check** — parses `ra_manual_overrides` (flags "Orphaned Override" when a key matches
   no known company name) and `ra_portfolio_v1` (flags "Empty Portfolio"); JSON parse failures →
   "Parse Error / critical"; otherwise emits a single "All Clear" row.
7. **Export** — CSV of the filtered set (12 columns incl. before/after values, `reversible`);
   quotes in `detail` are swapped to apostrophes.
8. **Retention** — purge removes events older than `Date.now() − purgeDays×86,400,000`
   (confirmation modal), then rewrites localStorage — demonstrating the log is *not* immutable.

### 7.4 Worked example — synthetic day 0 event count

`eventsPerDay = floor(sRand(0×7+42)×6)+2 = floor(frac(sin(43)×10⁴)×6)+2`.
sin(43) = −0.831775…; ×10⁴ = −8317.75…; `frac = −8317.75 − (−8318) = 0.2450`;
`floor(0.2450×6)+2 = 1+2 =` **3 events** generated for the most recent day. Each event then draws
category, action, entity, timestamp offset, severity and user from further `sRand` seeds as in
§7.1, so the whole 90-day history (~400–450 events before the 500 cap) is reproducible on any
machine with an empty localStorage.

### 7.5 Companion analytics on the page

Seven tabs (`timeline`, plus analytics/heatmap/entity/compliance/integrity/retention views per the
tab list): the timeline groups events by day with severity badges; a manual-event form lets users
append arbitrary log entries (category/action/detail/entity/severity) — useful for demos, fatal
for evidentiary integrity, since self-authored entries are indistinguishable from system ones.

### 7.6 Data provenance & limitations

- **The event history is predominantly synthetic** (seeded PRNG, §7.1); the only "real" entries
  are shallow reflections of what exists in nine other modules' localStorage keys at load time
  (max 5 entries per key, timestamped at 2-hour synthetic intervals — not the actual mutation
  times).
- **No immutability, no tamper evidence**: localStorage is user-writable, the page itself offers
  purge and manual insertion, and there is no hash chain, signature, server persistence, or even a
  checksum. Every guide claim about SHA-256 chains, hourly verification and IP capture is
  aspirational.
- No user identity: `user` is only ever 'System' or 'Manual'.
- 500-event cap means older evidence silently rolls off; retention is client-side only.
- A production design would write events server-side (append-only table or WORM store), hash-chain
  or Merkle-batch them, and anchor user identity via the auth layer.

### 7.7 Framework alignment

- **ISAE 3000 (Revised)** — the standard under which assurance practitioners require evidence that
  reported data was not altered between measurement and disclosure. This viewer *illustrates* the
  control (event capture, before/after values, evidence filtering) but cannot satisfy it: evidence
  must be tamper-evident and complete, which client-side storage is not.
- **SOX §404 / §302** — require documented, testable internal controls over reporting and
  management certification; audit logs supporting SOX are expected to be retained ~7 years
  (guide's "Log Retention: 7 years" datapoint) — this module retains ≤ 500 events client-side.
- **ISO/IEC 27001:2022 (A.8.15 Logging / A.8.16 Monitoring)** — calls for protected, centrally
  managed logs with clock synchronisation; the module's design is the opposite (per-browser,
  user-mutable).
- The `reversible` flag and before/after value capture mirror good change-management practice
  (e.g., COBIT BAI06), and are the parts of the schema a production rebuild could keep as-is.

## 9 · Future Evolution

### 9.1 Evolution A — Back the viewer with the platform's real server-side audit stream (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag is blunt: the guide promises SHA-256 hash chains, hourly verification, and immutable partitions, but the code is a browser-localStorage viewer (`ra_audit_log_v1`, 500-event cap) over mostly PRNG-generated history, with a purge button and a manual-event form that make self-authored entries indistinguishable from system ones — "fatal for evidentiary integrity" per §7.5. Meanwhile the platform already runs `AuditMiddleware` on every request writing to real `audit_*` tables. Evolution A retires the synthetic generator and makes this page the viewer for that real stream.

**How.** (1) A read API over the audit tables (filter by user/category/date/entity — the page's filter pipeline ports directly), with server-side pagination replacing the 500-event cap and real user identity replacing 'System'/'Manual'. (2) Add the tamper-evidence layer the guide claims: nightly Merkle-batch hashing of the day's audit rows with the root persisted, plus a verification endpoint — cheaper than per-row chaining at platform write volume. (3) Keep the module's two best schema ideas (§7.7): before/after value capture and the `reversible` flag, added to middleware capture where missing. (4) The "Data Integrity Check" tab replaces its localStorage heuristics with the verification endpoint's result. Rung 2: the retention tab becomes a what-if over real volumes ("archiving at 90 days removes N events, M of them compliance-relevant").

**Prerequisites.** Audit-table schema audit (which of the 18 audit tables carry before/after values today); RBAC gating — audit read access is admin-tier; remove the manual-event form entirely. **Acceptance:** an action performed in another module appears in the viewer with the session user's identity; the verification endpoint detects a manually mutated row; purge only archives, never deletes, and is itself audit-logged.

### 9.2 Evolution B — Evidence-pack drafting analyst for assurance engagements (LLM tier 2)

**What.** The page's "compliance evidence view" is currently just a filter (`compliance ∪ critical ∪ report_generation`). Evolution B makes evidence-pack assembly a tool-called workflow: "prepare the ISAE 3000 evidence extract for entity X, FY25 reporting period" runs scoped audit queries, verifies the covering Merkle roots, and drafts the pack narrative (event summaries, user-activity profile, before/after change tables) — every event and count from tool output, structured per the assurance-provider template the guide envisions.

**How.** Read-only tools over the Evolution-A API (query, aggregate, verify); grounding corpus is this Atlas record plus §7.7's framework notes (ISAE 3000 evidence expectations, SOX 7-year retention, ISO 27001 A.8.15). The verification tool result is embedded in every pack so integrity is asserted by computation, not by the LLM. Anomaly summarisation ("user Y's activity volume tripled in March, concentrated in manual overrides") is descriptive statistics over tool output — flagged for human review, never auto-escalated.

**Prerequisites (hard).** Evolution A — drafting evidence packs from the current synthetic localStorage log would fabricate assurance evidence, the single worst failure available to this module. **Acceptance:** every event cited in a pack resolves to an audit-table row; each pack embeds a passing verification stamp with the covered date range; queries outside the user's RBAC scope are refused server-side, not by the LLM.