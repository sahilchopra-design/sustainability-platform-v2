## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry states the calculation engine as
> `ESG Percentile Rank = Count(Peers with Lower ESG Score) ÷ (Total Peers − 1) × 100` and describes
> "percentile ranks and z-scores for environmental, social and governance pillars." **No percentile-rank or
> z-score function exists anywhere in this file.** The code instead computes simple **medians/means** per
> peer group (`median()`, `mean()` helper functions) and flags individual companies with a single threshold
> rule — `isHighPE = medPE && c.pe_ratio > medPE × 1.5` — plus a real-data Paris-alignment gap panel. What
> follows documents what the code actually computes; percentile/z-score benchmarking described in the guide
> is not implemented here.

### 7.1 What the module computes

Unlike most "sector benchmarking"-style modules on the platform, this page runs on **real company
fundamentals** from `GLOBAL_COMPANY_MASTER` (market cap, revenue, P/E, ROE, GHG intensity, exchange) — no
`sr()` PRNG is used. Core statistics are plain non-parametric measures:

```js
median(arr) = sorted middle value (or avg of two middle values for even N)
mean(arr)   = Σarr / arr.length                              // guarded: returns null if arr.length===0
isHighPE    = medPE && pe_ratio > medPE × 1.5                 // 50%-above-median flag, not a percentile
```

### 7.2 Parameterisation — Paris Alignment Gap panel

| Sector | 2030 target GHG intensity (tCO₂e / USD Mn revenue) |
|---|---|
| Financials | 2 |
| Information Technology | 5 |
| Communication Services | 6 |
| Health Care | 8 |
| Consumer Staples | 15 |
| Real Estate | 25 |
| Industrials | 30 |
| Energy | 45 |
| Materials | 60 |
| Mining | 80 |
| Utilities | 120 |

Labelled in-code as "Simplified Paris budget proxies" — directionally correct ordering (heavy industry >
services) but explicitly self-described as a simplification, not a sector decarbonisation pathway derived
from IEA NZE/SBTi SDA sector-specific budgets.

| GICS-style sectors | 12 sectors with descriptive text (`SECTOR_DESCRIPTIONS`) | Real GICS-aligned categorisation, used for filtering, not for percentile computation |

### 7.3 Calculation walkthrough

1. `ComparisonTable` computes `medPE = median(peValues)` and `medGHG = median(ghgValues)` (both guarded via
   `.filter(Boolean)` to drop nulls/zeros) across the currently filtered peer set, then flags any company
   whose `pe_ratio` exceeds 1.5× the sector median with `isHighPE` — a single hard-coded multiplier, no
   percentile computation.
2. **Paris Alignment Gap** (`ParisAlignmentPanel`): filters companies with non-zero GHG intensity, sorts
   ascending, computes `gap = ghg_int − target` and `pctGap = gap/target × 100`, and renders a horizontal
   bar with `barWidth = min(100, max(4, ghg_int/(target×3) × 100))` — a genuine, real-data gap-to-target
   visualisation (the one piece of this module doing more than descriptive statistics).
3. **Sector Stats card** (`stats`): guarded means/medians of market cap, revenue, P/E, ROE, and Scope 1
   emissions across the sector's companies — `.filter(Boolean)` before each `mean()`/`median()` call so
   companies with missing fields don't corrupt the average.
4. **Scatter (PE vs ROE)**: plots real company `pe_ratio` (y) against `roe_pct` (x), sized by a `z` field
   (bubble size), for visual outlier/quadrant identification — no clustering or regression is computed.

### 7.4 Worked example

Energy sector, `target = 45 tCO₂e/$Mn`. A company with `ghg_int = 62`:

| Step | Computation | Result |
|---|---|---|
| Gap | `62 − 45` | +17 tCO₂e/$Mn over target |
| % Gap | `17/45 × 100` | **+37.8%** above the 2030 Paris proxy |
| Bar width | `min(100, max(4, 62/(45×3)×100))` | `min(100, 45.9)` → 45.9% fill |

For the PE outlier flag: if sector `medPE = 18.0×` and a company shows `pe_ratio = 29.5×`:
`29.5 > 18.0×1.5=27.0` → `isHighPE = true`, rendered bold/amber in the table.

### 7.5 Companion analytics on the page

- **Exchange-relative delta** (`StatCard`'s `delta` prop) — shows a company's metric vs. the
  cross-exchange median as a signed percentage, a simple relative-difference display, not a statistical
  z-score despite the visual similarity (▲/▼ arrow) to one.
- **GHG intensity distribution chart** — bar/scatter views of real `ghg_intensity_usd_mn` /
  `ghg_intensity_tco2e_cr` fields across the peer set, using whichever field is populated per company
  (`c.ghg_intensity_usd_mn || c.ghg_intensity_tco2e_cr`).

### 7.6 Data provenance & limitations

- **Company fundamentals are real** (drawn from `GLOBAL_COMPANY_MASTER`), which distinguishes this module
  from most of its `sr()`-seeded siblings — but coverage gaps exist: any company missing `pe_ratio`,
  `ghg_intensity_*`, or `roe_pct` is silently dropped via `.filter(Boolean)`, which can shrink the effective
  peer set (and shift the median) without visibly flagging the coverage rate to the user.
- **No percentile rank or z-score is computed anywhere**, despite the guide's explicit formula — a genuine
  percentile implementation (`countLower/(N-1)×100`) would need to be added to deliver what the guide
  describes; today the page only offers medians, means, and one threshold flag.
- The Paris-2030 sector targets are explicitly self-labelled "simplified proxies" in a code comment — not
  sourced from a named pathway (IEA NZE, SBTi SDA), and applied uniformly to all companies in a sector
  regardless of sub-industry (e.g. a renewables developer and an oil major both classified "Energy" share
  the same 45 tCO₂e/$Mn target).

**Framework alignment:** MSCI GICS sector classification (12-sector taxonomy, descriptions match standard
GICS sector definitions) — used correctly for peer grouping · MSCI ESG / Sustainalytics named in the guide
as percentile-methodology sources, but the percentile methodology itself is not implemented · the Paris
Alignment panel's intent (compare company GHG intensity to a 2030 sector decarbonisation budget) mirrors
the general approach of SBTi's Sectoral Decarbonisation Approach and CDP/TPI sector benchmarking, though
the specific target values are a platform-authored simplification rather than a cited SDA/TPI pathway.
