## 7 · Methodology Deep Dive

### 7.1 What the module computes

The page maintains a synthetic universe of 50 companies (`COMPANIES`, generated once at module load via
the platform's seeded PRNG `sr(s) = frac(sin(s+1)×10⁴)`), each carrying all 15 GHG Protocol Scope 3
categories with per-category `emissions`, `dataQuality` (1–5), `method`, `target2030`, `baseYear` and a
`reported` flag. All aggregation is client-side `useMemo` arithmetic over this fixed array — there is no
backend call (`trace_labels` is empty); `backend/services/scope3_analytics_engine.py` exists but is not
wired to this page.

```js
totalEm   = Σ companies[c].emissions                        // per category, filtered by sector
avgDQ     = Σ companies[c].dataQuality / max(1, N)           // simple mean, not PCAF-weighted
reportingPct = reportedCount / N × 100
avgTarget = Σ companies[c].target2030 / max(1, N)
```

`grandTotal`, `upstreamTotal` (Cat 1–8) and `downstreamTotal` (Cat 9–15) sum `categoryTotals`; `cat1Total`
and `top5Categories` (sorted descending) drive the headline KPI strip.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| 15 Scope 3 categories, Upstream/Downstream split | Cat 1–8 upstream, 9–15 downstream | GHG Protocol Corporate Value Chain Standard (canonical) |
| Cat 1 emissions range | `sr()×100,000 + 5,000` | Synthetic — Cat 1 deliberately seeded larger than other categories to reproduce the "Cat 1 dominance" stylised fact |
| Other categories | `sr()×30,000 + 1,000` | Synthetic demo value |
| `dataQuality` | `sr()×4 + 1` → 1.0–5.0 | Synthetic; mimics a PCAF-style 1(best)–5(worst) scale but is a flat random draw, not method-derived |
| `DQ_METHODS` (6 labels: Primary Data, Spend-Based, Hybrid, Activity-Based, IO Analysis, Supplier Data) | fixed list | GHG Protocol Ch.7 method taxonomy (names only; assignment is random) |
| `target2030` | `sr()×50 + 10` → 10–60% | Synthetic — no linkage to SBTi validation logic |
| `reported` flag | `sr() > 0.25` → ~75% reporting rate | Synthetic |
| 10 sectors | fixed list | Descriptive labels only, no GICS mapping |

### 7.3 Calculation walkthrough

1. `sectorFilter` narrows `COMPANIES` to `filteredCompanies`.
2. `categoryTotals` (one row per of the 15 categories) sums/averages the four metrics above across
   `filteredCompanies`.
3. Headline KPIs derive purely from `categoryTotals`: grand total, upstream/downstream share, Cat 1 share
   of total, average DQ across categories, and Cat 1's average 2030 target.
4. Tab 4 ("Reduction Targets") computes `targetEm = totalEm × (1 − avgTarget/100)` and
   `reduction = totalEm − targetEm` per category — a straight-line percentage cut, not a modelled abatement
   curve.
5. Tab 5 ("Sector Comparison") recomputes `avgScope3`/`avgCat1`/`avgDQ` per sector directly from the
   unfiltered `COMPANIES` array (independent of the sector-filter buttons used elsewhere on the page).

### 7.4 Worked example

Take Cat 1 with `totalEm = 2,450,000 tCO₂e` (illustrative sum for the current sector filter) and
`avgTarget = 42%`:

| Step | Computation | Result |
|---|---|---|
| Target emissions | `2,450,000 × (1 − 0.42)` | 1,421,000 tCO₂e |
| Reduction volume | `2,450,000 − 1,421,000` | 1,029,000 tCO₂e |
| Cat 1 dominance KPI | `cat1Total / grandTotal × 100` | e.g. if `grandTotal = 9.8M`, → 25% |
| Upstream share KPI | `upstreamTotal / grandTotal × 100` | sums Cat 1–8 totals over grand total |

All figures are illustrative because the underlying company array is randomly seeded on each app load
context — see §7.7.

### 7.5 Companion analytics on the page

- **Method Breakdown** (Tab 3) counts occurrences of each of the 6 `DQ_METHODS` labels across all
  `filteredCompanies × 15` category cells and expresses each as a share of `filteredCompanies.length × 15`.
- **Methodology tab** (Tab 6) is static reference text pairing each category with a "preferred method" —
  this is a cosmetic `DQ_METHODS[i % 6]` cycling assignment, not a real method-suitability lookup.
- **Disclosure Status** (Tab 7) colour-codes each category's `reportingPct` (green ≥70%, amber ≥50%, red
  below) — a simple threshold rubric, no statistical basis given.

### 7.6 Data provenance & limitations

- **All company and category data is synthetic**, generated once via `sr(seed) = frac(sin(seed+1)×10⁴)`
  and held constant for the session — it does not represent real disclosures.
- Data-quality scores are uniform random draws, not derived from the `method` field they sit beside (a
  "Primary Data" cell can show DQ 1.5 while a "Spend-Based" cell shows DQ 4.5 purely by chance, so the two
  columns are not internally consistent in the demo data).
- No PCAF-style materiality weighting: `avgOverallDQ` is a flat mean across categories rather than
  emissions-weighted, understating the influence of large categories like Cat 1 and Cat 11.
- Reduction-target arithmetic is a static percentage cut with no adoption curve, cost curve, or year-by-year
  trajectory — contrast with the guide's stated formula
  `S3reduction_cat_i = BaselineEmissions_i × (1 − ReductionLever_j × AdoptionRate_j)`, which is not
  implemented in this page (the lever/adoption-rate structure described in the guide lives conceptually in
  `scope3_analytics_engine.py`'s `calculate_avoided_emissions`, but that function is not called from this
  page either).
- The backend `Scope3AnalyticsEngine.assess_dqs` implements a genuinely weighted DQS (3× weight for
  sector-dominant categories, honest nulls where inputs are absent) — a materially better methodology than
  this page's flat mean — but it is not wired to this route.

**Framework alignment:** GHG Protocol Corporate Value Chain (Scope 3) Standard 2011 for the 15-category
taxonomy and upstream/downstream split · GHG Protocol Technical Guidance 2013 for method taxonomy names ·
SBTi Scope 3 Guidance for the "material category" concept (>5% of total, referenced in guide text, not
enforced in code) · CDP Technical Note structure informs the disclosure-status framing. The page implements
the taxonomy and presentation layer of these standards; it does not implement their quantitative
calculation methods (spend-based EEIO factors, supplier PCF blending, PCAF Cat 15 attribution).
