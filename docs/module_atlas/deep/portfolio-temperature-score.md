## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states `PortfolioTemp = Σ(weightᵢ × ITRᵢ)` with company
> ITRs from target ambition + trajectory. **The headline portfolio temperature is not an aggregation
> of holdings at all** — it is a **hard-coded per-methodology constant** (`METHODOLOGIES[m].temp`:
> PACTA 2.7, SBTi 2.4, TPI 2.9, Weighted-Avg 2.6) plus a Scope-3 toggle and a year delta. The 60
> per-holding temperatures *are* `sr()`-seeded and *are* weight-aggregated in some sub-tabs, but the
> gauge and KPIs read the constant, not the sum. §8 specifies the real SBTi/PACTA aggregation.

### 7.1 What the module computes

Headline temperature (the gauge):
```js
portfolioTemp = METHODOLOGIES[methodology].temp        // 2.4–2.9 constant per method
              + (scope3 ? 0 : −0.3)                     // Scope-3 exclusion drops 0.3°C
              + YEAR_DELTAS[yearFilter]                 // Q4-2023 0, Q4-2024 −0.1, Fwd-2030 +0.3
markerPct = clamp( ((portfolioTemp − 1)/3)·100, 0, 100 )   // gauge fill on a 1–4°C scale
```

Sub-tab aggregations that *do* use holdings:
```js
totalWeight   = Σ h.weight
whatIfTemp    = portfolioBaseTemp − mean(sbtiDelta of selected)     // engagement what-if
livePortfolioTemp = Σ e.itr·e.weight/100  (engagement register)    // real Σ(w·ITR), fallback 2.7
```

### 7.2 Parameterisation / seed rubric

| Quantity | Value / formula | Provenance |
|---|---|---|
| `METHODOLOGIES[].temp` | PACTA 2.7 / SBTi 2.4 / TPI 2.9 / WA 2.6 | **hard-coded per-method constants** |
| Scope-3 adjustment | `−0.3 °C` when excluded | heuristic |
| `YEAR_DELTAS` | 0 / −0.1 / +0.3 | heuristic time drift |
| per-holding `temp` | `1.2 + sr(s·3)·3.6` | synthetic 1.2–4.8 °C |
| `weight` | `0.4 + sr(s·7)·3.2` | synthetic |
| `emissions[3yr]` | `180+sr·320`, `160+sr·300`, `140+sr·280` | synthetic declining series |
| holdings names | 60 real issuers (Shell, NextEra, Toyota…) | curated labels |
| reference pathways | `TEMPERATURE_PATHWAYS`, `sbti-companies.json`, `CDP_COMPANY_EMISSIONS` | real imported data (under-used) |

The page *imports* real SBTi and CDP data and `TEMPERATURE_PATHWAYS`, but the headline gauge ignores
them in favour of the method constant — a missed opportunity flagged in §8.

### 7.3 Calculation walkthrough

1. User selects a methodology → headline temp = that method's constant.
2. Scope-3 toggle and year filter add fixed deltas.
3. Gauge marker positions on a 1–4 °C scale.
4. Holdings tab shows 60 synthetic-temp names; selecting names for the SBTi what-if subtracts their
   mean `sbtiDelta` from the base.
5. Engagement tab computes a *genuine* `Σ(w·ITR)` (`livePortfolioTemp`) over the engagement register —
   the only place the guide's formula actually runs.

### 7.4 Worked example

Method = SBTi (2.4), Scope 3 excluded, year = Forward to 2030:

| Step | Computation | Result |
|---|---|---|
| base | METHODOLOGIES[sbti].temp | 2.40 |
| scope3Adj | excluded → −0.3 | −0.30 |
| yearAdj | Forward to 2030 → +0.3 | +0.30 |
| portfolioTemp | 2.40 − 0.30 + 0.30 | **2.40 °C** |
| markerPct | ((2.40−1)/3)·100 | 46.7 % |

Switching to PACTA jumps the headline to 2.7 °C with **no change to holdings** — proof the number is a
method constant, not an aggregation.

### 7.5 Data provenance & limitations

- **Headline is a constant + fixed deltas**, not a portfolio aggregation. Per-holding temps are
  synthetic `sr()` draws; only the engagement register does real `Σ(w·ITR)`.
- Imported SBTi/CDP/pathway data is present but not wired into the headline score.
- Scope-3 −0.3 °C and year deltas are illustrative heuristics, not derived from re-scoring.

**Framework alignment:** SBTi Temperature Scoring v1.5 — the guide's method; SBTi actually derives each
company's ITR from target ambition vs a science-based pathway (over/under-shoot of an allocated carbon
budget), then exposure-weights — none of that math runs for the headline · PACTA — technology-pathway
alignment, represented here by a per-sector `radarScore` table, not computed · the 3.2 °C no-target
default (SBTi convention) is referenced in the guide.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute the portfolio Implied Temperature Rise bottom-up as `Σ wᵢ·ITRᵢ`, with company ITRs from SBTi
temperature scoring, so the headline gauge reflects actual holdings — required for net-zero-alliance
(NZAM/NZAOA) reporting.

### 8.2 Conceptual approach
**SBTi Temperature Scoring** at the company level, aggregated by portfolio weight, cross-checked
against **PACTA** technology alignment — the two standards the module already names. Company ITR is
the temperature implied by its target's carbon-budget over/under-shoot; unscored names take the SBTi
default.

### 8.3 Mathematical specification
```
Overshoot_i = (ProjectedCumEmissions_i − Budget_i,1.5) / Budget_i,1.5
ITR_i       = clip( a_scope + b_scope · Overshoot_i , 1.3 , 4.0 )     # SBTi regression
ITR_i       = 3.2 °C  if no validated target
ITR_pf      = Σ_i w_i · ITR_i
Scope3_adj  = recompute ITR_i including/excluding Scope-3 target coverage (not a flat −0.3)
```

| Parameter | Calibration source |
|---|---|
| `a_scope, b_scope` | SBTi Temperature Scoring regression coefficients (public v1.5) |
| `Budget_i,1.5` | IPCC AR6 / IEA NZE sector budget allocated by revenue/production share |
| default 3.2 °C | SBTi no-target default |
| target data | SBTi registry (`sbti-companies.json`, already imported), CDP emissions |
| `w_i` | portfolio weights (already present) |

### 8.4 Data requirements
`near_term_target`, `net_zero_year`, `base_year_emissions`, `scope_coverage`, `sector`, `revenue`,
`weight`. Sources already in-platform: `sbti-companies.json`, `CDP_COMPANY_EMISSIONS`,
`TEMPERATURE_PATHWAYS`. Only the scoring regression + aggregation are missing.

### 8.5 Validation & benchmarking plan
Reconcile company ITRs against published SBTi scores; benchmark `ITR_pf` against PACTA output;
verify the Scope-3 exclusion effect emerges from re-scoring (not a hard −0.3); check coverage % and
default-application rate.

### 8.6 Limitations & model risk
Target data sparse and self-reported; the regression is scope/sector-sensitive; weighting scheme moves
the headline. Conservative fallback: SBTi default (3.2 °C) for unscored names and disclose coverage %.
