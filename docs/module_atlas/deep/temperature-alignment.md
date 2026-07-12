## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `ITR = T₀ + (GHG_actual/Budget) ×
> Overshoot Factor` — a genuine carbon-budget-based Implied Temperature Rise calculation per SBTi
> Portfolio Temperature Alignment methodology. **No such calculation exists.** Each of the 60
> companies' `itr` values is a **direct `sr()`-seeded random draw** (`itr = sr(i×7)×3+1`, range
> 1.0–4.0°C) — there is no carbon budget, no actual/target emissions ratio, and no overshoot factor
> anywhere in this 57-line file. The 8 real backend API routes listed for this module
> (`ref/itr-table`, `ref/pcaf-dqs`, `ref/sbti-fi-criteria`, `POST /itr`, `POST /assess`, etc., served
> by `backend/services/temperature_alignment_engine.py`) are **never called** — the page contains no
> `fetch`/API call at all. One redeeming detail: `alignment` category labels are bucketed from the
> **same** random draw that produces `itr` (both keyed on `sr(i×7)`), so the two fields are at least
> internally self-consistent with each other, unlike most fields in this dataset.

### 7.1 What the module computes

60 real, named companies (Exxon Mobil, Shell, BP, TotalEnergies, NextEra Energy, Enel, Apple,
Microsoft, JPMorgan, Nestle, etc.) across 7 sectors (Energy, Utilities, Materials, Industrials,
Technology, Financials, Consumer), each independently `sr()`-seeded for `itr` (1.0–4.0°C),
`scope1Intensity`/`scope2Intensity`/`scope3Intensity`, `reductionTarget` %, `targetYear`
(2030/2040/2050), `sbtiStatus` (Approved/Committed/Near-term/None), `alignment` category,
`budgetRemaining` %, `carbonBudget`, `emissionsTrajectory` (Declining/Flat/Rising), `netZeroCommit`,
`greenRevPct`, `transitionPlan` quality, and `credibilityScore`.

### 7.2 The itr↔alignment consistency (the one non-independent pair)

```js
itr       = +(sr(i×7)×3 + 1).toFixed(1)                            // 1.0–4.0°C
alignment = sr(i×7)<0.15 ? '1.5C Aligned'
          : sr(i×7)<0.35 ? 'Below 2C'
          : sr(i×7)<0.55 ? '2C'
          : sr(i×7)<0.75 ? 'Above 2C'
          : 'Not Aligned'
```

Both fields read the **same seed** `sr(i×7)`, so the alignment bucket boundaries translate to
implied ITR cutoffs: `sr<0.15 → itr<1.45` ('1.5C Aligned'), `sr<0.35 → itr<2.05` ('Below 2C'),
`sr<0.55 → itr<2.65` ('2C'), `sr<0.75 → itr<3.25` ('Above 2C'), else 'Not Aligned' (`itr≥3.25`). This
is a genuinely coherent quantile-bucketing of the same underlying random draw into a categorical
label — the one place in this file where two displayed fields are guaranteed consistent with each
other rather than independently random.

### 7.3 Genuine aggregation formulas (over synthetic per-company data)

```js
stats.avgITR       = mean(itr) over filtered companies
stats.aligned       = count(alignment ∈ {'1.5C Aligned','Below 2C'})
stats.sbtiApproved  = count(sbtiStatus === 'Approved')
sectorITR[sector]   = mean(itr) grouped by sector
alignDist[category] = count grouped by alignment, in a fixed display order
```

All correctly implemented unweighted means/counts with `||0` NaN-guard on `avgITR`/`avgCredibility`
when `filtered.length===0`. `PATHWAY` (an 8-point 2023–2051 portfolio-vs-benchmark temperature time
series) is a separately hand-constructed declining series (`2.8−i×0.15+noise`) with no arithmetic
link to the 60-company `itr` values — the "Portfolio Temperature Pathway" chart and the "Portfolio
ITR" KPI in the dashboard tab are **two independent numbers**, not derived from each other.

### 7.4 Worked example

Company `i=0` ('Exxon Mobil', Energy sector): `sr(0) = frac(sin(1)×10⁴)`; `sin(1)≈0.8415`,
×10⁴=8415.0, frac≈0.85 → `itr = round(0.85×3+1, 1) = round(3.55,1) = 3.6°C`. Since `sr(0)=0.85 ≥
0.75`, `alignment = 'Not Aligned'` — consistent with a 3.6°C ITR being far above any Paris-aligned
threshold. This is directionally plausible for a major integrated oil company, though it is
coincidental (a product of the seed value for index 0, not a reflection of Exxon's real disclosed
emissions trajectory).

### 7.5 Companion analytics

- **Credibility vs ITR scatter** — plots `credibilityScore` (an independently `sr()`-seeded field,
  different seed multiplier than `itr`) against `itr`; because the two are drawn independently, any
  visual correlation shown is coincidental, not a modelled relationship (e.g. "low-credibility
  transition plans correlate with high ITR" is not enforced in the generator).
- **SBTi status / emissions trajectory / transition-plan-quality pie charts** — categorical
  breakdowns of independently-seeded fields; the "Transition Plan Quality vs Credibility" bar chart
  computes a real per-category mean credibility score, correctly guarded against empty filter groups
  (`||1` divisor fallback).

### 7.6 Data provenance & limitations

- **All 60 companies' ITR, SBTi status, and emissions data are `sr()`-seeded synthetic figures**
  attached to real company names — illustrative demo data only.
- No carbon-budget-based ITR calculation exists; the backend `temperature_alignment_engine.py` and
  its 8 reference/calculation routes are entirely unused by this page — a real orphaned-capability
  gap (see the sibling `temperature-alignment-waterfall` module, which *does* implement a genuine
  additive ITR formula, albeit also without calling the backend engine).
- `PATHWAY`'s portfolio temperature trajectory is disconnected from the 60-company `itr` dataset
  shown elsewhere on the same page.

**Framework alignment:** SBTi Portfolio Temperature Alignment Methodology and PACTA are correctly
named as the intended basis; MSCI's Temperature Alignment approach is also cited. None of these
methodologies' actual budget-allocation or overshoot-factor mathematics are implemented — this page
functions as a realistic-looking company/portfolio browsing UI over synthetic placeholder scores, not
a working ITR calculation engine.
