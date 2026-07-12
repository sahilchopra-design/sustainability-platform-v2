## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — scale and formula.** The guide states "50 active regulatory
> changes tracked globally" with "12 consultations open" and a calculation engine
> `Impact = Scope × Materiality × Urgency`. **The code implements none of this at the stated
> scale or with that formula.** `CHANGES` has **10** rows (not 50), `CONSULTATIONS` has **5** rows
> with only 2 marked `responded:true` (so 3 open, not the guide's 12), and `impact` is a static
> `'High'/'Medium'/'Low'` string set per row — there is no `Scope`, `Materiality`, or `Urgency`
> field or multiplication anywhere in the file. A further internal inconsistency: `IMPACT_BY_CAT`'s
> own category counts (15+8+6+5+4+3 = **41**) don't match the 10-row `CHANGES` array either, so
> even within the code the "active changes" figure is not self-consistent. Sections below document
> the 10-change, hand-curated tracker the code actually implements.

### 7.1 What the module computes

```js
jurisdictions = [...new Set(CHANGES.map(c => c.jurisdiction))]     // 7 distinct: EU, US, AU, UK, JP, HK, Global
filtered = jurisdictionFilter==='All' ? CHANGES : CHANGES.filter(c => c.jurisdiction===jurisdictionFilter)
```

No scoring formula exists — every displayed metric (impact level, modules affected, status) is a
static field on the 10 hand-entered regulatory-change records.

### 7.2 The 10-change dataset (real regulatory content, small scale)

| Title | Jurisdiction | Status | Impact | Deadline |
|---|---|---|---|---|
| CSRD Wave 2 Implementation | EU | Effective | High | 2025-01-01 |
| SEC Climate Disclosure (Stayed) | US | Stayed | High | 2025-06-30 |
| ISSB S2 Adoption (Australia) | AU | Effective | Medium | 2025-07-01 |
| EU CBAM Phase 2 | EU | Upcoming | High | 2026-01-01 |
| UK TPT Framework Mandatory | UK | Consultation | Medium | 2026-04-01 |
| EU Deforestation Regulation | EU | Effective | Medium | 2025-01-01 |
| SSBJ Standards Final | JP | Upcoming | Medium | 2025-04-01 |
| HKEX Enhanced ESG Guide | HK | Effective | Medium | 2025-01-01 |
| EU Green Claims Directive | EU | Consultation | Medium | 2026-06-01 |
| Basel III.1 Climate Risk | Global | Upcoming | High | 2025-07-01 |

Each entry names a real, identifiable regulatory development (correctly noting, e.g., the SEC
Climate Disclosure Rule's "Stayed" status pending court review) — the content is accurate as a
point-in-time snapshot, just at 1/5th the scale (10 vs 50) the guide claims, and with no
computed impact score behind the `impact` label.

### 7.3 Calculation walkthrough

1. **Radar Dashboard tab**: jurisdiction filter over the 10 changes; KPI cards read directly off
   static counts (e.g. total changes = `CHANGES.length`, high-impact count = filter on
   `impact==='High'`).
2. **Active Consultations tab**: 5 static rows (`CONSULTATIONS`), each with a `responded`
   boolean — no live tracking of actual submission status.
3. **Upcoming Effective Dates tab**: sorts/displays `CHANGES` by `deadline`.
4. **Impact Assessment tab**: `IMPACT_BY_CAT`, 6 static category rows with pre-set `count` and
   `avgImpact` (0–100) fields — not recomputed from the 10-row `CHANGES` array (whose category
   field, `category`, could in principle be grouped to derive `count` live, but is not).
5. **Response Tracker tab**: reads `CONSULTATIONS[*].responded` directly.
6. **Regulatory Intelligence Feed tab**: 6 static dated news-style entries (`FEED`) — descriptive
   text, no scoring.

### 7.4 Worked example

Filtering to `jurisdiction='EU'`: matches `CHANGES` rows 1 (CSRD Wave 2), 4 (CBAM Phase 2), 6
(Deforestation Regulation), 9 (Green Claims Directive) — **4 of 10** changes, all real EU
regulatory items, correctly filtered by the `jurisdictions` array derived from `CHANGES` itself
(`Set` deduplication, so the filter dropdown always exactly matches what's in the data — a small
but correct piece of internal consistency).

### 7.5 Status/impact colour rubric

| Status | Colour | Impact | Colour |
|---|---|---|---|
| Effective | green | High | red |
| Upcoming | blue | Medium | amber |
| Consultation | amber | Low | green |
| Stayed | red | — | — |

### 7.6 Companion analytics

Radar Dashboard, Active Consultations, Upcoming Effective Dates, Impact Assessment (category
bar), Response Tracker, Regulatory Intelligence Feed — 6 tabs, all reading from the same 4 static
arrays (`CHANGES`, `CONSULTATIONS`, `IMPACT_BY_CAT`, `FEED`).

### 7.7 Data provenance & limitations

- **All 4 datasets are hand-curated, real regulatory content** (not `sr()`-seeded) — the specific
  regulations named (CSRD Wave 2, SEC stay, CBAM Phase 2, Basel III.1) are genuine, identifiable
  developments, correctly described.
- **Scale is 1/5th the guide's claim** (10 vs 50 changes; 5 vs implied ~17 consultations for a
  "12 open" figure) — this module should either be expanded to the claimed scale or the guide
  corrected to describe it as a curated sample/watchlist rather than a comprehensive 50-item
  global tracker.
- **No `Impact = Scope×Materiality×Urgency` formula exists** — `impact` is authored per-record,
  not computed; a genuine implementation would need explicit Scope (breadth of affected
  entities), Materiality (financial impact magnitude), and Urgency (time-to-deadline) sub-scores.
- `IMPACT_BY_CAT` totals (41) don't reconcile with `CHANGES.length` (10) — the two datasets appear
  to have been authored independently rather than one derived from the other.
- No live regulatory feed integration exists — `FEED` is a static snapshot, not a connected news
  or legal-tracker API.

**Framework alignment:** the module correctly names real frameworks/regulators in context (IOSCO,
FSB, NGFS referenced by the guide as sources) but the code implements a self-contained curated
tracker rather than an actual feed from any of those bodies · CSRD, SEC Climate Rule, ISSB S2,
CBAM, EU Deforestation Regulation, SSBJ, HKEX ESG Guide, Basel III.1 — all correctly named and
status-accurate as a point-in-time snapshot.
