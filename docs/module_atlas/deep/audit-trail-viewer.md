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
