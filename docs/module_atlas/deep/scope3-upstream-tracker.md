## 7 · Methodology Deep Dive

### 7.1 What the module computes

A synthetic universe of 120 named real-world-style companies (`COMPANY_NAMES`, e.g. "Apple Inc", "Shell
plc") each generated via the platform's seeded PRNG `sr(s)=frac(sin(s+1)×10⁴)` with `seed = i×137`. For
each company the engine produces sector, country, revenue, and per-category (Cat 1–8 only — **upstream
categories exclusively**) `spend`, `spendEmissions`, `activityEmissions`, `supplierSpecific` and a
1–5 `dqs` (data-quality score). A second generator produces 200 synthetic suppliers per company on demand
(`genSuppliers`, reseeded `companyId×10000 + i×31`), and a third produces a 40-row supplier engagement
pipeline independent of company selection.

```js
share          = catAvgShare × (0.5 + sr()×1.0)              // ±50% jitter around CATEGORIES[c].avgShare
spend          = share × revenue × (0.3 + sr()×0.4)
spendEmissions = totalScope3 × share                          // normalised to company totalScope3
activityEmissions   = spendEmissions × (0.6 + sr()×0.8)        // actFactor 0.6–1.4×
supplierSpecific     = spendEmissions × (0.4 + sr()×0.5)       // suppFactor 0.4–0.9×
```

`totalScope3` for each company is itself `Math.round(50,000 + sr()×4,950,000)`, i.e. an independent random
draw *before* the per-category shares are normalised back against it (`normTotal`), so the categories
always sum exactly to the company's own random `totalScope3`.

### 7.2 Parameterisation

| Category | `avgShare` | Colour |
|---|---|---|
| Cat 1 Purchased Goods | 0.42 | blue |
| Cat 8 Leased Assets | 0.14 | violet |
| Cat 3 Fuel & Energy | 0.12 | amber |
| Cat 4 Upstream Transport | 0.09 | green |
| Cat 2 Capital Goods | 0.08 | purple |
| Cat 6 Business Travel | 0.06 | pink |
| Cat 7 Commuting | 0.05 | cyan |
| Cat 5 Waste | 0.04 | red |

These 8 shares sum to 1.00 and set the *expected* category mix before the ±50% `sr()` jitter is applied —
directionally consistent with GHG Protocol guidance that Cat 1 dominates upstream Scope 3 for most sectors,
but the specific decimal weights are platform-authored, not sourced from a named study.

| Methodology (Tab 3 scatter) | Accuracy | Effort |
|---|---|---|
| Spend-based | 35 | 10 |
| Activity-based | 65 | 50 |
| Supplier-specific | 92 | 85 |

These 3 points are hardcoded constants (`scatterData`), illustrating the standard GHG Protocol accuracy/
effort trade-off narrative (spend-based = cheap & noisy, supplier-specific = expensive & precise) as a
fixed 3-point chart, not derived from the page's own generated data.

### 7.3 Calculation walkthrough

1. `genCompanies()` runs once (`useMemo([])`) producing the fixed 120-company universe for the session.
2. `selMethodology` (`Spend-based` / `Activity-based` / `Supplier-specific`) selects which of the three
   parallel emissions series (`spendEmissions` / `activityEmissions` / `supplierSpecific`) feeds every
   downstream aggregate — `categoryAgg`, `stackedBarData`, `hotspotData` all key off the same
   `methKey` switch, so **the "Methodology Comparison" tab is really a re-slice of the same underlying
   random seeds through three different scaling multipliers**, not three independently estimated pipelines.
3. `categoryAgg` sums the selected methodology's emissions across `filteredCompanies` per category, and
   `avg = total / filteredCompanies.length` (guarded).
4. `supplierConcentration`: sorts the 200 generated suppliers for the selected (or default id=1) company by
   `emissions` descending, then computes `top10Em / totalEm` — a supply-chain Pareto/HHI-style
   concentration read.
5. **Scenario tool** (`scenarioResult`): user picks `scenarioTop` (N largest suppliers) and
   `scenarioReduction` (% cut); `reduction = topEm × scenarioReduction/100`, `newTotal = totalEm −
   reduction` — a simple "engage top-N suppliers for X% cut" what-if, not an adoption-curve or cost-based
   model.
6. **Engagement Pipeline** stage counts (`stageCounts`) tally the fixed 40-row `engagementPipeline` across
   the 6 `ENGAGEMENT_STAGES` (Identified → Contacted → Data Shared → Target Set → Reducing → Verified).

### 7.4 Worked example

Company `id=1` ("Apple Inc"), seed base `137`: `revenue = round(5000 + sr(139)×195000)`,
`totalScope3 = round(50000 + sr(140)×4950000)`. For Cat 1 (`ci=0`, `avgShare=0.42`):

| Step | Computation | Result (illustrative, using representative `sr()` draws) |
|---|---|---|
| Jittered share | `0.42 × (0.5 + sr(137+0×7)×1.0)` | e.g. `0.42 × 1.1 ≈ 0.462` |
| `spendEmissions` | `totalScope3 × 0.462` | e.g. `2,100,000 × 0.462 ≈ 970,200` tCO₂e |
| `activityEmissions` | `spendEmissions × (0.6+sr()×0.8)` | e.g. `× 1.15 ≈ 1,115,730` tCO₂e |
| `supplierSpecific` | `spendEmissions × (0.4+sr()×0.5)` | e.g. `× 0.72 ≈ 698,544` tCO₂e |

The three methodology columns for the same category can differ by 30–60% purely from the independent
jitter factors — this variance is illustrative of real-world methodology divergence but is manufactured by
the RNG, not measured.

### 7.5 Companion analytics on the page

- **Supplier drill-down table** (200 rows/company): filterable by category, country, DQS, minimum spend;
  each supplier carries `intensity = emissions/spend` (tCO₂e per $M), an `engaged` boolean (`sr() > 0.65` →
  ~35% engaged), and an `ENGAGEMENT_STAGES` value independent of the `engaged` flag.
  supplied consistency issue between `engaged` bool and `stage` labels is one already-known pattern on this
  page — verify at runtime if both are surfaced together, since they are drawn from independent seeds.
- **Quarterly trend** — 12 quarters per company at `normTotal/4 × (0.85 + sr()×0.3)`, i.e. random walk
  around a flat quarterly run-rate, not a directional trend.

### 7.6 Data provenance & limitations

- **Entirely synthetic data** for all 120 companies and up to 24,000 (120×200) suppliers, generated by
  `sr(seed)=frac(sin(seed+1)×10⁴)`. Company names are real (recognisable large-caps) but every quantitative
  field — revenue, Scope 3 totals, category splits, supplier lists, engagement stages, CDP scores — is
  fabricated per-session from the seed, not linked to `frontend/src/data/referenceData.js`'s
  `EMISSION_FACTORS`/`SECTOR_BENCHMARKS` imports (imported but not visibly used in the excerpted
  calculation paths).
- Because all three "methodologies" reuse the *same* `spendEmissions` base and merely apply an independent
  random multiplier, the Methodology Comparison tab cannot demonstrate a genuine convergence/divergence
  pattern between methods — a production implementation would compute activity-based and supplier-specific
  estimates from actually different input data (physical activity volumes, supplier-submitted PCFs).
- The reduction-scenario tool is a linear "cut top-N suppliers by X%" heuristic with no cost curve,
  adoption timeline, or feasibility constraint — contrast with the guide's stated formula
  `S3reduction_cat_i = BaselineEmissions_i × (1 − ReductionLever_j × AdoptionRate_j)`, which is not
  implemented here.
- Only Cat 1–8 (upstream) are modelled — consistent with the module's stated scope ("Scope 3 Upstream
  Tracker") — downstream Cat 9–15 are out of scope by design, not a gap.

**Framework alignment:** GHG Protocol Corporate Value Chain (Scope 3) Standard — Cat 1–8 upstream category
definitions and the spend-based/activity-based/supplier-specific method taxonomy (GHG Protocol Ch.7) ·
Exiobase IO-LCA referenced in the guide as the spend-based factor source (not concretely wired in this
file) · the accuracy/effort scatter (35/10, 65/50, 92/85) operationalises the standard GHG Protocol
guidance that data quality improves, at increasing cost, moving from spend-based toward supplier-specific
primary data.
