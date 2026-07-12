## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most Scope 3 pages on the platform, this engine runs on **real portfolio holdings** — it reads
`localStorage` (`ra_portfolio_v1`) and joins against `GLOBAL_COMPANY_MASTER` for actual `revenue_usd_mn`,
`scope1_mt`, `scope2_mt`, `sector`, `market_cap_usd_mn`/`evic_usd_mn`; if no portfolio exists it falls back
to a 20-company demo slice of the same master file (flagged with a "DEMO DATA" badge). The core function
`estimateScope3(company, overrides)` computes all 15 GHG Protocol categories per company via a
deterministic (non-random) sector-emission-factor model:

```js
Cat 1  = revenue × EF.cat1 / 1e6                         // spend-based
Cat 3  = (scope1 + scope2) × EF.cat3                     // energy-based, "10–20% of S1+S2" proxy
Cat 6  = employees × EF.cat6 / 1e6                        // employee-based (travel)
Cat 7  = employees × EF.cat7 / 1e6                        // employee-based (commuting)
Cat 11 = revenue × EF.cat11 / 1e6                         // product-based (use-phase)
Cat 15 = cat15_dominant ? revenue×0.3×150/1e6 : revenue×0.02×50/1e6   // PCAF-style, Financials only
...                                                        // Cat 2/4/5/8/9/10/12/13/14: fixed revenue-share × flat EF
```

Every category is overridable per-company via a manual input persisted to `localStorage`
(`scope3_overrides`), which sets `confidence = 'Reported'` and bypasses the modelled estimate entirely.

### 7.2 Parameterisation — sector emission-factor table

| Sector | Cat 1 EF | Cat 11 EF | S3 multiplier | Notes |
|---|---|---|---|---|
| Energy | 320 | 850 | 4.5× | Use-phase (Cat 11) dominant — combustion of sold fuel |
| Utilities | 150 | 650 | 5.0× | Highest S3 multiplier in the table |
| Financials | 25 | 5 | 1.2× | `cat15_dominant: true` — Cat 15 formula switches to `revenue×0.3×150` |
| IT | 45 | 35 | 1.8× | Lowest Cat 1 EF |
| Materials | 280 | 120 | 3.2× | |

Units are declared as "tCO₂e per USD Mn revenue," attributed in code comments to "DEFRA/EPA databases,"
but **the specific numeric values (320, 850, 45, 0.15 …) are not traceable to a cited DEFRA/EPA table
row in the code** — they are internally consistent, sector-differentiated constants that reproduce
directionally correct stylised facts (energy/utilities Cat 11-heavy, financials Cat 15-heavy) rather than
verified per-sector EEIO coefficients. Category confidence labels (`High`/`Medium`/`Low`) are hardcoded per
category-index in the `switch` statement, not derived from any statistical measure of estimation error.

| Category | Formula driver | Confidence assigned |
|---|---|---|
| Cat 3 (Fuel & Energy) | `(S1+S2) × EF.cat3` | High — anchored to reported Scope 1+2 |
| Cat 1, 6, 7, 11 | revenue or employee × EF | Medium (Cat 11: High if `EF.cat11 > 100`) |
| Cat 2, 4, 5, 8, 9, 10, 12, 13, 14, 15 (non-Financial) | fixed revenue-share × flat EF | Low (default) |
| Any category | manual override present | Reported |

### 7.3 Calculation walkthrough

1. `estimateScope3` runs once per selected company (or once per holding for portfolio aggregation).
2. `pct_of_total` normalises each category's `estimated_mt` against that company's own 15-category sum.
3. Headline KPIs: `totalS3` (Σ all 15 cats), `s3Ratio = totalS3/(s1+s2)` guarded at zero, `s3Intensity =
   totalS3/revenue×1e6` guarded at zero, `confWeighted` = emissions-weighted average of a confidence→score
   map (`Reported=100, High=75, Medium=50, Low=25`), guarded by `(totalS3 || 1)`.
4. **Portfolio Scope 3 Aggregation (§ Section 10)** applies PCAF-style attribution:
   `attribution = exposure_usd_mn / (EVIC or market_cap or revenue)`, capped at 1.0, then
   `attributed = totalS3 × min(attribution, 1)`. This is the platform's standard PCAF attribution-factor
   pattern (financed-emissions share of investee), reused here for Scope 3 rather than the investee's own
   Scope 1+2 — i.e. it attributes the *investee's* Scope 3 footprint to the investor's ownership share,
   which is the PCAF Category 15 logic applied recursively.
5. **Sector Comparison (§ Section 9)** builds a synthetic "sector-median company" from the median revenue
   of same-sector peers in `GLOBAL_COMPANY_MASTER`, feeds it back through `estimateScope3`, and charts the
   top-5 categories against the selected company.
6. **Category Heatmap** finds the portfolio-wide top-5 categories by aggregate Mt, then intensity-shades
   each holding's value against the row-wise (`top5CatIds`) column maximum.

### 7.4 Worked example

Take an Energy-sector company with `revenue = $12,000M`, `scope1 = 8.0 Mt`, `scope2 = 1.5 Mt`,
`employees = 24,000` (default `revenue×2` since not disclosed):

| Category | Formula | Result |
|---|---|---|
| Cat 1 | `12,000 × 320 / 1e6` | 3.840 Mt |
| Cat 3 | `(8.0+1.5) × 0.15` | 1.425 Mt |
| Cat 6 | `24,000 × 3.5 / 1e6` | 0.084 Mt |
| Cat 11 | `12,000 × 850 / 1e6` | **10.200 Mt** (largest — High confidence, `EF.cat11=850>100`) |
| totalS3 (all 15, abbreviated) | Σ | ≈ 16.5 Mt (illustrative) |
| `s3Ratio` | `16.5 / (8.0+1.5)` | **1.74×** |
| `s3Intensity` | `16.5e6 / 12,000` | ≈ 1,375 tCO₂e / $Mn revenue |

Cat 11 (use of sold fuel) correctly dominates for an Energy-sector obligor, consistent with the sector
profile encoded in `SECTOR_EMISSION_FACTORS.Energy`.

### 7.5 Companion analytics on the page

- **Manual Override Panel** — persists user-entered "actual reported" values per category per company to
  `localStorage`; overrides immediately flip `confidence` to `'Reported'` and recompute `pct_of_total`.
- **Cross-Module Navigation** links to Supply Chain ESG Mapping, Carbon Budget, Scenario Stress Test,
  Controversy Monitor and Stranded Assets — these are UI links only; no live data payload is passed.

### 7.6 Data provenance & limitations

- **Company financials are real** (from `GLOBAL_COMPANY_MASTER`) when a user portfolio exists; the
  20-company fallback samples the same real master list, only the *selection* is a fixed demo slice, not
  randomly generated. No `sr()` PRNG is used anywhere in this file.
- **Emission factors are static, hand-authored constants** presented as sourced from "DEFRA/EPA databases"
  but with no per-value citation; they should be treated as illustrative sector proxies, not audit-grade
  EEIO factors. A production system would source these from a versioned table (DEFRA 2024 GHG Conversion
  Factors, EPA EEIOv2, or Exiobase) with explicit vintage and currency-conversion metadata — several of
  which are already catalogued (unused) in `backend/services/scope3_analytics_engine.py`'s
  `EMISSION_FACTOR_DATABASES` dict.
- Confidence labels are rule-based heuristics on estimation *method*, not empirical error bounds; the page
  itself states "+/-30-50%" uncertainty for spend-based estimates in its own Methodology Notes panel.
- `sectorAvg` computes a single "median-revenue company" rather than a full peer distribution, so the
  Sector Comparison chart shows one benchmark point, not a percentile range.
- No live backend call: `backend/services/scope3_analytics_engine.py` exists with a materially more
  rigorous DQS/materiality/double-counting framework (honest-null design — see
  `scope3-category-analytics.md` §7.6) but is not wired to this route.

**Framework alignment:** GHG Protocol Corporate Value Chain (Scope 3) Standard for the 15-category
structure and spend/activity/hybrid method taxonomy · GHG Protocol Technical Guidance 2013 for
category-specific calculation approaches (spend-based, distance-based, average-data) · PCAF Standard Part A
for the attribution-factor pattern reused in the Portfolio Aggregation section · DEFRA/EPA/IEA are named as
factor sources in the UI copy but the actual numeric factors are not traceably sourced in code.
