## 7 · Methodology Deep Dive

### 7.1 What the module computes

The page is driven entirely by a hand-authored lookup table `SECTOR_DATA` — 6 sectors (Energy, Tech,
Consumer, Auto, Finance, Materials), each with a fixed 15-element `mat[]` (materiality %, 0–100) array and
a matching 15-element `dq[]` (data-quality level, 1–5) array, plus a scalar `engagement` %. There is no
`sr()` PRNG and no per-company universe — every number a user sees is a static constant selected by the
`sector` toggle.

```js
matData = CATEGORIES.map((c,i) => ({ ...c, materiality: sd.mat[i], dq: sd.dq[i] })).sort(desc by materiality)
top5    = matData.slice(0, 5)
dqDist  = [1..5].map(level => count of categories at that DQ level)
roadmap = top5.map(c => ({ targetDQ: max(1, dq-2), costM: (dq-targetDQ)×0.4, benefitPct: (dq-targetDQ)×12 }))
```

### 7.2 Parameterisation

| Sector | Cat 1 materiality | Cat 11 materiality | Cat 15 materiality | Engagement % |
|---|---|---|---|---|
| Energy | 95 | 98 | 5 | 42% |
| Finance | 30 | 5 | **98** | 28% |
| Auto | 80 | **95** | 2 | 45% |
| Tech | 85 | 70 | 3 | 55% |

Provenance: values are **hand-authored synthetic constants**, not computed from any formula or seed. They
are directionally faithful to real-world Scope 3 hotspot patterns (Finance dominated by Cat 15 financed
emissions, Auto/Energy dominated by Cat 11 use-of-product, matching CDP Supply Chain sector studies cited
in the guide) but carry no statistical derivation — there is no code path that computes materiality from
emissions share, only a static table that was pre-set to look correct.

| DQ level | Label | Colour |
|---|---|---|
| 1 | Primary Supplier | green |
| 2 | Verified Secondary | teal |
| 3 | Industry Average | blue |
| 4 | Spend-Based | amber |
| 5 | Extrapolated | red |

This 1–5 scale mirrors the platform-standard PCAF-style data-quality convention (1=best/primary,
5=worst/estimated) used consistently across PCAF Financed Emissions and other modules.

### 7.3 Calculation walkthrough

1. User selects a sector; `sd = SECTOR_DATA[sector]` supplies the two 15-element arrays for that sector.
2. `matData` zips `CATEGORIES` (id/name/short) with `sd.mat`/`sd.dq` and sorts descending by materiality —
   this ordering drives the Tab-0 horizontal bar chart and the Tab-0 pie chart of `top5`.
3. `dqDist` is a simple histogram of the 15 `dq` values into 5 buckets — feeds the Tab-1 pie chart and
   Tab-3 methodology-distribution cards.
4. **Improvement Roadmap** (Tab 5) is purely arithmetic, not optimisation-based: for each of the top-5
   material categories, `targetDQ = max(1, currentDQ − 2)` (an always-minus-2 heuristic, not
   cost-benefit-selected), `costM = ΔDQ × $0.4M`, `benefitPct = ΔDQ × 12%`. A category already at DQ 1 or 2
   shows zero or negative-clamped cost/benefit.
5. **Cross-Sector Benchmark** (Tab 4) re-slices `CATEGORIES[0..7]` (Cat 1–8 only) across all 6 sectors into
   a grouped bar chart, directly from the same static `SECTOR_DATA.mat` arrays.

### 7.4 Worked example

Energy sector, Category 1 (materiality 95, dq 3 = Industry Average):

| Step | Computation | Result |
|---|---|---|
| Target DQ | `max(1, 3-2)` | 1 (Primary Supplier) |
| Est. cost | `(3-1) × 0.4` | $0.8M |
| Benefit | `(3-1) × 12` | +24% (interpreted as DQ-improvement %, not emissions accuracy %) |
| Avg DQ Score (header KPI) | `Σ sd.dq / 15` for Energy: `[3,3,2,4,4,5,5,5,4,4,2,4,5,5,3]` | Σ=58 → 58/15 = **3.9** |

The header "Avg DQ Score" of 3.9 for Energy is consistent with a code walk-through of the literal array —
verified above by direct summation.

### 7.5 Companion analytics on the page

- **Supplier Engagement Rate by Sector** (Tab 2) derives `primary = engagement×0.6` and
  `estimated = 100−engagement` as chart series — the `×0.6` split of "engaged" suppliers into a "primary
  data" subset is another unexplained fixed multiplier, not sourced from `sd`.
- **Methodology footer** (Tab 5) states the platform-standard convention: "categories >5% of total Scope 3
  are material per SBTi criteria" — consistent with the GHG Protocol/SBTi materiality threshold referenced
  elsewhere on the platform, though the page does not actually apply a 5% cutoff rule anywhere in code (it
  always shows a fixed top-5, regardless of whether the 6th-ranked category is above or below 5%).

### 7.6 Data provenance & limitations

- **All materiality and DQ figures are static hand-authored constants** for 6 sectors × 15 categories —
  there is no per-company or per-portfolio computation; the page cannot reflect an actual customer's
  Scope 3 profile.
- The Improvement Roadmap's cost ($0.4M per DQ-point) and benefit (12% per DQ-point) multipliers are
  presented with no cited source — flag as synthetic demo values, not calibrated to real supplier
  data-collection program costs (which vary by orders of magnitude by category and supplier count).
- "Top 5" selection ignores the platform's own stated 5%-of-total materiality threshold; a sector where
  only 3 categories exceed 5% would still show 5 categories in the roadmap.
- No linkage to `backend/services/scope3_analytics_engine.py`'s `assess_dqs` (a genuinely weighted,
  sector-dominant-category-aware DQS calculation) — this page's numbers are independent of that engine.

**Framework alignment:** GHG Protocol Scope 3 Standard (15-category taxonomy) · CDP Supply Chain Programme
(sector materiality patterns referenced in guide, approximated by the static table) · PCAF-style 1–5
data-quality scale (label semantics match PCAF DQ Score conventions, though this module's use is
descriptive, not PCAF-calculated) · SBTi 5%-materiality-threshold concept named in UI copy but not enforced
in the selection logic.
