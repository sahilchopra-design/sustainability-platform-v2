## 7 · Methodology Deep Dive

This module is a **genuine rule engine**, not a synthetic display. The guide's "Validation Pass Rate"
`VPR = (Records − Errors)/Records × 100` and its rule-library concept are faithfully implemented —
though the actual library is **50 rules across 8 categories**, not the guide's advertised "1,240". No
⚠️ mismatch on methodology; only the rule-count headline is illustrative.

### 7.1 What the module computes

Every company in `GLOBAL_COMPANY_MASTER` (or the saved portfolio) is run against every enabled rule.
A rule is a pure boolean predicate `check(company) → true(pass) | false(violation)`:

```js
activeRules = DEFAULT_RULES.map(apply overrides).filter(r => r.enabled)
total       = companies.length × activeRules.length
violations  = for each (company, rule): !CHECKS[rule.check](company)  → one row
passRate    = (total − violations.length) / total × 100
```

The 50 predicates live in the `CHECKS` map and cover: **Identity** (name/ticker/ISIN/sector format),
**Financial** (positivity, EVIC≥0.8·MCap, P/Revenue 0.1–100×, rev/employee $10K–$5M),
**ESG** (0–100 ranges, not-default-50, high-carbon ESG cap), **Emissions** (S1/S2 ≥ 0, sanity
<1000 Mt, intensity consistency), **Climate targets** (NZ year 2025–2100, SBTi boolean),
**Cross-referential** (EVIC = MCap + Debt, intensity = (S1+S2)·1e6/Rev), **Temporal**, **Sector**.

### 7.2 Rule rubric — severities & auto-fixes

| Category | # rules | example predicate (from `CHECKS`) | critical rules |
|---|---|---|---|
| Identity | 5 | `ticker_format: /^[A-Z0-9.]{1,10}$/i` | name, ticker |
| Financial | 10 | `evic_ge_mcap: evic ≥ 0.8·mcap` | revenue>0, mcap>0 |
| ESG | 10 | `esg_range: 0 ≤ esg ≤ 100` | — |
| Emissions | 10 | `ghg_intensity_consistency: |calc−reported|/calc < 0.5` | s1≥0, s2≥0 |
| Climate | 5 | `nz_year_range: 2025 ≤ y ≤ 2100` | — |
| Cross-Ref | 5 | `evic_decomposition: |evic−(mcap+debt)|/evic < 0.5` | — |
| Temporal | 3 | `mcap_updated: mcap > 0` | — |
| Sector | 2 | `it_employee_floor: IT ⇒ employees > 100` | — |

Severities: `critical` (red), `high`, `medium`, `low`. `sev` and `enabled` are user-overridable
(persisted `ra_validation_rules_v1`). Each rule optionally names an **auto-fix** strategy
(e.g. "Sector median", "Clamp 0-100", "Recalc from S1+S2/Rev") — the actual fix value is computed at
apply-time (`fixVal` = sector median, or 50 baseline, or `false` for booleans). Thresholds are
sensible sanity bounds, not from a named external standard — engineering heuristics for ESG data QA.

### 7.3 Calculation walkthrough

1. Resolve `activeRules` (apply enable/severity overrides).
2. For each company × rule, evaluate `CHECKS[rule.check](company)`; a `false` emits a violation row
   `{company, ticker, exchange, sector, field, rule, sev, cat, value}`.
3. `stats` aggregates: `total`, `violations`, `passed = total − violations`, and breakdowns
   `byCat / byExchange / bySector` (violation counts) plus per-sector z-score context
   (`mean`, `std` over sector peers for the flagged field).
4. **Auto-fix** (`fixVal`): for a fixable field it computes the sector **median** of positive values,
   or `false` for `sbti_committed`, or 50 fallback; writes to `ra_validation_fixes_v1`.
5. `trendData` renders a 12-month improving pass-rate line (`72 + i·2.3 + sRand·3`) — cosmetic.

### 7.4 Worked example

Take a Financials company with `market_cap_usd_mn = 8000`, `revenue_usd_mn = 40`, `scope1_mt = 3`:

| Rule | check | result |
|---|---|---|
| V011 mcap_positive | 8000 > 0 | pass |
| V015 p_revenue_ratio | 8000/40 = **200** ∉ (0.1,100) | **violation (low)** |
| V070 financials_low_s1 | Financials ⇒ s1 < 1? 3 < 1 false | **violation (low)** |
| V030 s1_non_negative | 3 ≥ 0 | pass |

If the portfolio is 500 companies × 50 rules = 25,000 checks and 812 fail,
`passRate = (25000 − 812)/25000 = 96.75%`. The P/Revenue outlier (200×) is a real data-quality flag —
a bank valuation platform 200× P/S is almost always a units error (revenue in $ vs $mn).

### 7.5 Data provenance & limitations

- **Company base data is real** (BRSR/EODHD/curated master); the rule engine runs deterministically
  over it — **no PRNG drives validation results**. The only synthetic touch is the cosmetic 12-month
  `trendData` line (uses `sRand`), and `seed`/`sRand` helpers are defined but not used in scoring.
- Two predicates are stubs: `esg_sector_consistency` returns `true` unconditionally (V024 never fires),
  so the effective active rule set is ~49.
- Thresholds are heuristic sanity bounds, not codified from XBRL/ESRS taxonomies; a production engine
  would bind each rule to a specific framework assertion (see guide's XBRL mapping intent).
- No true batch/real-time ingestion split; it validates the in-memory master snapshot.

**Framework alignment:** ESRS 2 BP-1 (basis of preparation / data controls) and GRI 2-5 (assurance)
both require documented data-quality controls — this rule library is a concrete control layer. XBRL
taxonomy validation (the guide's third standard) is the natural home for these atomic checks in a
regulatory filing pipeline: each `CHECKS` predicate maps to an XBRL calculation/dimension assertion
(e.g. `evic_decomposition` ↔ an XBRL calculation link EVIC = MCap + Debt). PCAF data-quality scoring
is adjacent — completeness rules (`*_present`) feed a DQ score, though this page reports pass/fail
rather than a 1–5 DQ grade.
