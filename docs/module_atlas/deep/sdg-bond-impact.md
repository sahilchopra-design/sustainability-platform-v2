## 7 · Methodology Deep Dive

### 7.1 What the module computes

20 named, real-issuer-style bonds (`generateBonds`, e.g. "Iberdrola Green 2031," "World Bank Edu 2028")
are hardcoded with plausible `size_mn`/`yield` pairs, then enriched with `sr()`-seeded (`seed(s)=frac(sin(s+1)×10⁴)`)
qualitative fields — `verified`, `additionality`, `icma_compliant`, `impactScore`. Each bond's category maps
to a fixed `BOND_IMPACT_METRICS` lookup of per-$Mn impact benchmarks (e.g. Renewable Energy: 2.5 MW, 4.2 GWh,
2,800 tCO₂e avoided, 850 households powered — **all per USD Mn invested**), and impact is computed by
straight linear scaling:

```js
impactVal = metric.benchmark × bond.size_mn                 // e.g. GHG avoided = 2,800 × size_mn tCO2e
total(metric, category) = metric.benchmark × categoryTotals[category].invested
```

### 7.2 Parameterisation — impact benchmark table (per USD Mn invested)

| Category | Key metric | Benchmark | SDGs tagged |
|---|---|---|---|
| Renewable Energy | GHG Emissions Avoided | 2,800 tCO₂e | 7, 13 |
| Clean Transport | GHG Emissions Avoided | 1,500 tCO₂e | 9, 11, 13 |
| Green Buildings | GHG Emissions Avoided | 80 tCO₂e | 11, 13 |
| Water Management | Water Treated | 500 megalitres/yr | 6, 14 |
| Social Housing | Affordable Units Created | 8 units | 1, 11 |
| Healthcare Access | Patients Served Annually | 5,000 | 3 |
| Education | Students Supported | 500 | 4 |

Provenance: these look like the "harmonised impact reporting indicators" style used by MDBs (World Bank,
IFC, ADB Green/Social Bond impact reports) and ICMA's Harmonized Framework for Impact Reporting, and the
relative ordering across categories is directionally sensible (Renewable Energy avoids far more CO₂e per
dollar than Green Buildings retrofits), but **no citation ties any specific numeric benchmark to a named
MDB or ICMA report** in the code — treat as illustrative, not audit-ready.

| Field | Formula | Provenance |
|---|---|---|
| `verified` | `seed(i)>0.35 ⇒ 'Verified'`, else `>0.5 ⇒ 'Estimated'`, else `'Pending'` | Synthetic tiering |
| `additionality` | `seed>0.3⇒High / >0.5⇒Medium / else Low` | Synthetic |
| `icma_compliant` | `seed>0.25` → ~75% compliant | Synthetic boolean |
| `impactScore` | `round(seed×30+60)` → 60–90 | Synthetic composite, not derived from the other 3 fields |

### 7.3 Calculation walkthrough

1. `bonds = generateBonds(fiPortfolio)` — 20 fixed bond records, each carrying a real-sounding issuer name
   and category; qualitative flags (`verified`, `additionality`, `icma_compliant`, `impactScore`) are
   independently `seed()`-drawn per bond, so (as with sibling modules) a "Verified" bond can still show Low
   additionality or a below-average `impactScore` — the four dimensions are uncorrelated by construction.
2. `totalInvested = Σ size_mn`; `avgImpact = round(Σ impactScore / N)`.
3. `categoryTotals` (implicit from `pieCatData`) sums `size_mn` per category — feeds the allocation pie
   chart.
4. Per-metric impact totals: for the selected category, each of its benchmark metrics is multiplied by that
   category's aggregate invested amount: `total = metric.benchmark × categoryTotals[category].invested` —
   a pure linear extrapolation with no diminishing-returns, capacity-constraint, or double-counting
   adjustment (e.g. summing "Households Powered" and "GHG Avoided" as if independent, when in reality both
   derive from the same underlying generation capacity).
5. `scatterData` plots `yield` vs `impactScore` sized by `size_mn` — a yield/impact trade-off visualisation,
   descriptive only (no regression or correlation statistic computed).

### 7.4 Worked example

"Iberdrola Green 2031": `size_mn = 180`, category = Renewable Energy.

| Metric | Benchmark (per $Mn) | Bond impact = benchmark × 180 |
|---|---|---|
| Clean Energy Capacity Installed | 2.5 MW | 450 MW |
| Annual Clean Energy Generated | 4.2 GWh | 756 GWh |
| GHG Emissions Avoided | 2,800 tCO₂e | 504,000 tCO₂e |
| Households Powered | 850 | 153,000 households |

If the whole Renewable Energy category totals `invested = 800` ($Mn, summing Iberdrola + Orsted + NextEra +
Enel from the fixed list = 180+120+200+300 = 800): category-level GHG avoided = `2,800 × 800 =
2,240,000 tCO₂e`.

### 7.5 Companion analytics on the page

- **Verification/Additionality/ICMA-compliance badges** per bond — a 3-flag credibility snapshot, though
  (per §7.2) uncorrelated by construction, so a bond can be simultaneously "Verified," "Low additionality,"
  and "not ICMA compliant."
- **Yield-vs-impact scatter** — visualises whether higher-yielding (riskier) bonds also score lower on
  impact, a legitimate question for impact-linked fixed income, but purely illustrative here since both axes
  are independently sourced (yield hardcoded, impact `seed()`-random).

### 7.6 Data provenance & limitations

- **Bond names, sizes and yields are hand-curated** (not `sr()`-random) and resemble real issuers/instruments,
  but the specific size/yield pairings are illustrative, not sourced from a live bond database.
- **Impact benchmark coefficients are unsourced constants.** A production system would source per-category
  benchmarks from ICMA's Harmonized Framework for Impact Reporting (green bonds), the Harmonized Framework
  for Impact Reporting for Social Bonds, or issuer-specific allocation/impact reports, with per-project
  granularity rather than a single flat per-$Mn multiplier applied uniformly across all issuers in a
  category.
- **Impact metrics are not mutually exclusive** — GHG avoided, households powered, and MW installed for the
  same Renewable Energy bond are all derived independently from the same benchmark table rather than from a
  single underlying generation-capacity figure, so they should not be read as internally consistent
  (e.g. 756 GWh generated does not necessarily imply exactly 153,000 households powered at the stated 850/
  $Mn rate — both are separately-benchmarked proxies).
- `verified`/`additionality`/`icma_compliant`/`impactScore` are drawn from independent seeds and can produce
  internally inconsistent combinations (see §7.2), which a real impact-verification workflow would not
  permit (ICMA-compliant + High additionality should structurally correlate with Verified status).

**Framework alignment:** ICMA Green Bond Principles / Social Bond Principles / Harmonized Framework for
Impact Reporting — informs the metric taxonomy (capacity installed, GHG avoided, beneficiaries served) and
the `icma_compliant` flag, though compliance is a random draw, not a rule-based check against the actual
ICMA criteria (use-of-proceeds eligibility, process for project evaluation, management of proceeds, and
reporting) · UN SDG taxonomy for the `sdgs` tags per category, using the correct official SDG numbers and
colours · MDB Harmonised Framework informs the "impact per $Mn invested" convention used throughout.
