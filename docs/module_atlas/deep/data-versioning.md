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
