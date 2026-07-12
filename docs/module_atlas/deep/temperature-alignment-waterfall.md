## 7 · Methodology Deep Dive

Unlike its sibling `temperature-alignment` module (which draws ITR from a random number with no
formula), this module **genuinely implements the guide's additive waterfall formula**: `ITR =
1.5°C_base + Σ(sector_i_contribution)`. No mismatch blockquote is triggered — the core calculation
matches the guide exactly. The underlying per-sector `itrContrib` values are hand-authored static
literals rather than derived from a live carbon-budget model, and the backend
`temperature_alignment_engine.py` (also linked to this module) is not called from this page either —
both worth noting, but neither contradicts what the guide claims this specific page does (an additive
decomposition *display*, not a from-scratch ITR computation).

### 7.1 What the module computes

10 sectors (`SECTORS`: Energy, Materials, Industrials, Utilities, Consumer Disc., Consumer Staples,
Healthcare, Technology, Financials, Real Estate) each with a portfolio `weight` %, a static
`itrContrib` (°C contribution to portfolio ITR above the 1.5°C base), and a Scope 1/2/3 breakdown of
that contribution. 12 real named companies (ExxonMobil, Chevron, Shell, BASF, HeidelbergCement,
Microsoft, Apple, NextEra, RWE, JPMorgan, Nestle, Amazon) with individual ITR, portfolio weight, and
scope breakdown, used for sector drill-down.

### 7.2 Core formula (genuinely implemented)

```js
BASE_ITR = 1.5
portfolioITR = BASE_ITR + Σ_{sectors not excluded} itrContrib(sector)
```

This is computed live via `useMemo`, correctly recalculating whenever the user's `excludeList`
(toggled sectors) changes — the What-If Simulator genuinely removes a sector's `itrContrib` from the
running sum and the header KPI ("Portfolio ITR") updates in real time, exactly matching the guide's
description of instant recalculation on holding toggle.

### 7.3 Waterfall construction

```js
waterfallData: running = BASE_ITR
  sorted_sectors = [...SECTORS].sort(desc by itrContrib)          // largest positive pull first
  for each active sector: running += itrContrib; push {name, value: itrContrib, running}
  final bar: {name:'Portfolio ITR', value: running, color: running>2.0?red: running>1.8?amber:green}
```

This is a textbook waterfall-chart construction: starting bar at the 1.5°C base, each subsequent bar
adds (or, for Technology's negative contribution, subtracts) that sector's pull, ending at the total
portfolio ITR — with sectors sorted by contribution magnitude for visual clarity (largest positive
pull, Energy at +0.82°C, shown first). The colour-banding on the final bar (red >2.0°C, amber
1.8–2.0°C, green <1.8°C) gives a quick Paris-alignment read.

### 7.4 Worked example

Summing all 10 sectors' `itrContrib`: Energy +0.82, Materials +0.31, Industrials +0.18, Utilities
+0.24, Consumer Disc. +0.12, Consumer Staples +0.08, Healthcare +0.04, Technology **−0.18**,
Financials +0.06, Real Estate +0.08. Total: `0.82+0.31+0.18+0.24+0.12+0.08+0.04−0.18+0.06+0.08 =
1.75`. `portfolioITR = 1.5+1.75 = 3.25°C` — notably higher than the guide's own stated headline
figure of "2.4°C" for this module, indicating the guide's example data point and the actual
`SECTORS` array's summed contributions are **not reconciled** (either the guide's example predates
a later edit to `itrContrib` values, or the two were never cross-checked against each other).
Excluding Energy from the portfolio via the What-If Simulator: `portfolioITR_excl_energy = 3.25 −
0.82 = 2.43°C` — much closer to the guide's cited 2.4°C figure, suggesting the guide's example may
implicitly assume an Energy-light portfolio configuration rather than the full 10-sector default.

### 7.5 Companion analytics

- **Target Gap Analysis** — `gapData[sector] = {current: 1.5+itrContrib, target: 1.5, gap:
  max(0,itrContrib)}` — correctly floors the gap at zero for Technology (the one sector with negative
  contribution, i.e. already below the 1.5°C base contribution), a sound guard against a
  "negative gap" being displayed as if it were a shortfall.
- **Scope Decomposition** — `scopeDecomp` passes through each sector's static Scope 1/2/3
  contribution fields directly for a stacked-bar view; Energy's Scope 1 (0.35) and Scope 3 (0.35)
  are equally weighted contributors in this dataset, both dwarfing Scope 2 (0.12) — a plausible
  pattern for an integrated oil major (direct combustion + downstream product use both material,
  purchased-electricity comparatively minor).
- **Company Drill-Down** — filters the 12-company roster by `selectedSector`; company-level `itr`
  values are independent static literals (e.g. ExxonMobil 3.2°C, Microsoft 1.3°C), not derived from
  or reconciled against the sector-level `itrContrib` waterfall.

### 7.6 Data provenance & limitations

- **Dead code**: a module-scope `const PORTFOLIO_ITR = useMemoCalc()` (line 45) computes the
  unfiltered-portfolio ITR once at module load but is **never referenced anywhere else in the file**
  — the actual displayed value comes from the component-scoped `useMemo` version. Harmless but
  vestigial; the confusing `useMemoCalc` naming (styled like a React hook despite being a plain
  function called outside any component) is worth cleaning up.
- All `itrContrib`, per-sector weights, and Scope 1/2/3 splits are **hand-authored static
  literals**, not derived from a live carbon-budget/emissions-trajectory calculation — a production
  version would compute each sector's contribution from constituent companies' actual ITR × sector
  weight, consistently with the sibling `temperature-alignment` page's (currently synthetic)
  company-level ITR data, rather than maintaining two independent static datasets.
- The guide's own "2.4°C" and "+0.8°C Energy contribution" example figures don't exactly reconcile
  with the current `SECTORS` array's summed total (§7.4) — worth a data refresh to keep the
  documentation and the shipped constants in sync.
- Backend `temperature_alignment_engine.py` / `POST /itr` / `POST /assess` routes associated with
  this module are not called from this page.

**Framework alignment:** PACTA's sector-pathway decomposition concept and GFANZ's sector-level
transition framing are reflected in the sector-contribution structure, though the specific
`itrContrib` values are illustrative rather than computed from PACTA's actual production-alignment
methodology. The additive waterfall architecture itself (`base + Σcontributions`) is a sound,
correctly-implemented representation of how sector-level emissions pull a portfolio's aggregate ITR
away from a 1.5°C baseline.
