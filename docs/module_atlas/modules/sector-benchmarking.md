# Sector Benchmarking
**Module ID:** `sector-benchmarking` · **Route:** `/sector-benchmarking` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG and climate performance benchmarking comparing company metrics against sector peers using percentile ranking, z-scores and best-in-class thresholds.

> **Business value:** Positions each portfolio holding on ESG and climate metrics relative to sector peers to guide engagement and portfolio construction.

**How an analyst works this module:**
- Assign each holding to GICS Level 2 sub-industry peer group.
- Normalise ESG, carbon intensity and governance scores within each peer group.
- Compute percentile ranks and z-scores for environmental, social and governance pillars.
- Display sector heatmaps and flag laggards below 25th percentile.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Chip`, `ComparisonTable`, `EXCHANGE_COLORS`, `EXCHANGE_FLAGS`, `GHGIntensityChart`, `ParisAlignmentPanel`, `RISK_C`, `SECTOR_COLORS`, `SECTOR_DESCRIPTIONS`, `StatCard`, `ValuationScatter`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `EXCHANGE_COLORS` | `Object.fromEntries(EXCHANGES.map(e => [e.id, e.color]));` |
| `EXCHANGE_FLAGS` | `Object.fromEntries(EXCHANGES.map(e => [e._displayExchange \|\| e.label, e.flag]));` |
| `fmtB` | `(v) => v == null ? '—' : `$${(v/1000).toFixed(1)}B`;` |
| `fmtCO2` | `n => n == null ? '—' : n >= 1e9 ? `${(n/1e9).toFixed(2)} Gt` : n >= 1e6 ? `${(n/1e6).toFixed(1)} Mt` : `${(n/1000).toFixed(0)} Kt`;` |
| `mean` | `arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;` |
| `sorted` | `useMemo(() => [...companies].sort((a, b) => { const av = a[sort] ?? -Infinity, bv = b[sort] ?? -Infinity;` |
| `peValues` | `companies.map(c => c.pe_ratio).filter(Boolean);` |
| `ghgValues` | `companies.map(c => c.ghg_intensity_usd_mn \|\| c.ghg_intensity_tco2e_cr).filter(Boolean);` |
| `isHighPE` | `medPE && c.pe_ratio > medPE * 1.5;` |
| `data` | `useMemo(() => companies .map(c => ({ name: c.shortName \|\| c.ticker, value: c.ghg_intensity_usd_mn \|\| c.ghg_intensity_tco2e_cr \|\| 0, exchange: c._displayExchange \|\| c.exchange, sector: c.sector, }))` |
| `med` | `median(data.map(d => d.value));` |
| `companiesWithGHG` | `useMemo(() => companies .filter(c => c.ghg_intensity_usd_mn > 0 \|\| c.ghg_intensity_tco2e_cr > 0) .map(c => ({ ...c, ghg_int: c.ghg_intensity_usd_mn \|\| c.ghg_intensity_tco2e_cr, })) .sort((a, b) => a.ghg_int - b.ghg_int)` |
| `gap` | `c.ghg_int - target;` |
| `pctGap` | `(gap / target) * 100;` |
| `barWidth` | `Math.min(100, Math.max(4, (c.ghg_int / (target * 3)) * 100));` |
| `sectors` | `useMemo(() => [...new Set(GLOBAL_COMPANY_MASTER.map(c => c.sector))].filter(Boolean).sort() , []);` |
| `stats` | `useMemo(() => { const mktcaps  = companies.map(c => c.market_cap_usd_mn).filter(Boolean);` |
| `revenues` | `companies.map(c => c.revenue_usd_mn).filter(Boolean);` |
| `pe_vals` | `companies.map(c => c.pe_ratio).filter(Boolean);` |
| `roe_vals` | `companies.map(c => c.roe_pct).filter(Boolean);` |
| `ghg_vals` | `companies.map(c => c.scope1_co2e).filter(Boolean);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Peers Benchmarked | — | Peer universe | Total companies in active sector benchmarking peer groups. |
| Avg ESG Percentile | — | Calculated | Portfolio-weighted average ESG percentile rank across all benchmarked holdings. |
| Best-in-Class Share | — | Threshold model | Holdings ranked in top quartile of sector ESG performance. |
- **ESG scores from data vendors, GICS classification, portfolio weights** → Peer group construction, percentile ranking, z-score calculation → **Sector benchmarking reports, heatmaps, laggard flags**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Percentile Rank
**Headline formula:** `Count(Peers with Lower ESG Score) ÷ (Total Peers – 1) × 100`

Percentile position of a company within its GICS sector peer group based on composite ESG score.

**Standards:** ['MSCI ESG', 'Sustainalytics', 'Bloomberg ESG']
**Reference documents:** MSCI GICS Sector Classification 2023; MSCI ESG Ratings Methodology; Sustainalytics ESG Risk Rating Methodology; GHG Protocol Sectoral Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Deliver the promised percentile/z-score engine with coverage reporting (analytics ladder: rung 1 → 3)

**What.** This module is unusual among its siblings: it runs on real fundamentals from `GLOBAL_COMPANY_MASTER` (no `sr()` anywhere), but the §7 mismatch flag shows the guide promises percentile ranks and z-scores that the code never computes — today it offers only medians, means, and one threshold flag (`isHighPE = pe_ratio > medPE × 1.5`). Evolution A closes the guide↔code gap: implement `countLower/(N−1)×100` percentile ranks and peer-group z-scores per pillar metric, and surface the coverage rate that §7.6 notes is currently hidden (companies missing `pe_ratio`/`ghg_intensity`/`roe_pct` are silently dropped, shifting medians invisibly).

**How.** (1) A shared `peerStats(peers, metric)` helper returning {median, mean, sd, percentile(company), n, coverage} — coverage = non-null count ÷ peer-group size, rendered next to every statistic. (2) Winsorised z-scores (clamp at ±3) so a single outlier P/E doesn't dominate small GICS peer groups. (3) Replace the self-labelled "simplified proxy" Paris-2030 sector targets with cited SBTi SDA / TPI benchmark pathways per sector, or at minimum attach the citation gap as an on-page caveat. (4) Flag laggards below the 25th percentile, matching the guide's stated workflow.

**Prerequisites.** None external — data already real; small peer groups (n<5) need an explicit "insufficient peers" state rather than a percentile. **Acceptance:** for a hand-checked GICS group, the rendered percentile equals the countLower formula; every stat displays its coverage denominator.

### 9.2 Evolution B — Peer-comparison narrator with engagement drafting (LLM tier 1)

**What.** A copilot that turns the page's real peer statistics into analyst-ready language: "Company X sits at the 82nd percentile on GHG intensity within Financials, 2.1σ above the peer median — here is the engagement talking point." Because the underlying data is real (unlike most tier-B siblings), this module is one of the safest first candidates for a copilot that discusses named companies — provided it stays strictly within the computed peer set.

**How.** Tier-1 pattern: `POST /api/v1/copilot/sector-benchmarking/ask`, grounding corpus = this Atlas page (§5 formula, §7.2 Paris-target table, §7.6 coverage caveats) plus the live page state (selected sector, computed stats). Engagement-note drafting is template-guided: claim → statistic → peer context → ask, with each statistic linked to the on-page value. The copilot must volunteer the coverage caveat whenever a peer group has dropped companies.

**Prerequisites.** Evolution A's percentile engine — the copilot cannot narrate percentiles that don't exist yet; until then it is limited to median/mean comparisons. **Acceptance:** every percentile or σ figure in an answer matches the page's computed value exactly; asking about a company outside `GLOBAL_COMPANY_MASTER` coverage yields a refusal naming the missing fields.