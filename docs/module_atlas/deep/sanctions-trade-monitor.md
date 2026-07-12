## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states `Exposure = Σ(portfolio_
> holdings in sanctioned_jurisdictions)`. **No such sum is computed anywhere in the code.** This
> module has an empty `computed` inventory — it is a purely static reference dashboard: every
> figure is a hand-authored constant in one of 5 seed tables, and the only arithmetic in the entire
> file is a single `REGIMES.reduce((s,r)=>s+r.entity_count,0)` to show a "Total Designations"
> headline count. There is no portfolio-exposure aggregation, no jurisdiction-matching logic, and
> no dynamic computation of any kind.

### 7.1 What the module computes

```
totalDesignations = Sum(REGIMES[i].entity_count)     // the module's only calculation
```
Everything else on the page — the 4-regime designation table, the 16-country sanctions
classification, the 9 trade-policy entries, the 7 compliance alerts, and the 9-row portfolio
exposure table — is static, hand-authored content rendered directly with no derived arithmetic.

### 7.2 Parameterisation

| Table | Rows | Content | Provenance |
|---|---|---|---|
| `REGIMES` | 5 | OFAC/EU/UK/UN entity counts, country programs, last-updated date | Static reference figures, plausible order of magnitude for real consolidated-list sizes but not live-synced |
| `COUNTRY_CLASS` | 16 | Per-country OFAC/EU/UK/UN designation flags + qualitative exposure level | Static reference, directionally consistent with real sanctioned-jurisdiction lists (Russia, Iran, North Korea, Venezuela, Myanmar, Syria etc.) |
| `TRADE_POLICIES` | 9 | Tariff/export-control/CBAM policy entries with status, impact, affected sectors, effective date | Static reference, includes real policy categories (CBAM correctly named as an EU carbon-border mechanism, not a sanctions regime) |
| `ALERTS` | 7 | Type/regime/detail/severity | Static illustrative alert examples, not generated from any rule engine |
| `PORTFOLIO_EXPOSURE` | 9 | Named holdings (PetroChina, Gazprom ADR, PDVSA Bond, Lukoil GDR, Sberbank, etc.) with `exposure_pct` and qualitative `risk` tier | Static illustrative table using real, recognisable sanctioned/at-risk issuers; `exposure_pct` values are plausible but hand-entered, not computed from an actual portfolio |

### 7.3 Calculation walkthrough

1. The "Sanctions Dashboard" tab sums `REGIMES.entity_count` for the single headline "Total
   Designations" KPI — the only reduce/aggregation in the file.
2. The "Portfolio Exposure" tab renders `PORTFOLIO_EXPOSURE` as a static table; `exposure_pct`
   values are displayed as-is (e.g. Sberbank shown at 0% / "DIVESTED" status, Gazprom ADR at 0.1%
   / "CRITICAL") without any portfolio-level aggregate exposure figure being computed (the guide's
   own formula would sum these 9 percentages, or filter+sum by sanctions_regime, but the code does
   neither).
3. No filtering, matching, or scoring logic connects `COUNTRY_CLASS` to `PORTFOLIO_EXPOSURE` — a
   user cannot ask "show me all portfolio holdings in comprehensively-sanctioned jurisdictions"
   because no join exists between the two tables.

### 7.4 Data provenance & limitations

- This module is best understood as a **static compliance reference page**, not an analytics
  engine — every number is hand-entered and none derive from another.
- The `PORTFOLIO_EXPOSURE` table names real, recognisable sanctioned/at-risk securities
  (Gazprom, Lukoil, Sberbank, PDVSA, PetroChina) with illustrative exposure percentages that could
  be mistaken for actual portfolio holdings data if not clearly labelled as a demo.
- No live sanctions-list feed, fuzzy-matching, or scoring model exists despite the guide's implied
  "screening" functionality.

**Framework alignment:** OFAC SDN List, EU Consolidated Sanctions List, UK OFSI, UN Security
Council Consolidated List (regime names and country classifications are accurate as static
reference content) · EU CBAM (correctly categorised as a trade/carbon-border policy, distinct from
sanctions) — none of these are implemented as live, queryable data sources.
