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
