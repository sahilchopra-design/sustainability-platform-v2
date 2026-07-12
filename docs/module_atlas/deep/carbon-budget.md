## 7 · Methodology Deep Dive

The Carbon Budget Tracker aligns well with its guide: it implements the IPCC AR6 remaining-carbon-budget
concept and a proportional allocation, with only minor caveats (below). No production-model gap is
triggered — the arithmetic is transparent and the constants are real (or clearly illustrative), so there
is no §8.

### 7.1 What the module computes

Three headline quantities from a small set of reference tables:

```js
yearsRemaining15 = globalBudget15 / globalEmissions        // years to 1.5°C budget exhaustion
budget_company   = GlobalBudget × (CompanyEmissions / GlobalEmissions)   // proportional allocation (guide)
remaining_sector = max(0, budgetGtCO2 − usedGtCO2)         // per-sector headroom
pct_used         = min(100, usedGtCO2 / budgetGtCO2 × 100)
```

Sectors and regions carry pre-set budget, used-to-date, and annual-emission figures; the module derives
remaining budget, a four-band exhaustion status, and per-region years-to-net-zero context. Five emission
pathways (`PATHWAY_DATA`, 2020–2050) are analytic decay curves with small seeded noise added for texture.

### 7.2 Parameterisation

**Global budget anchors** (`REGIONS` global row — provenance: IPCC AR6 WGI Ch.5 / Global Carbon Project,
directionally correct):

| Quantity | Value | Basis |
|---|---|---|
| Remaining 1.5 °C budget | 380 GtCO₂ | IPCC AR6 (~400–500 Gt from 2020 at 50–67%); 380 ≈ post-2023 depletion |
| Remaining 2 °C budget | 900 GtCO₂ | IPCC AR6 |
| Global annual emissions | 56.8 GtCO₂e | ⚠ this is **all-GHG CO₂e**, whereas the budget is **CO₂-only** (~37 GtCO₂/yr) |
| Cumulative to date | 2,900 GtCO₂ | historical cumulative emissions |

**Sector budgets** (`SECTORS`, 8 rows including negative LULUCF budget −60 Gt reflecting land sink) and
**regional budgets** (`REGIONS`, 7 rows) are illustrative allocations, internally consistent but not traced
to a single published allocation study.

**Pathway curves** (`PATHWAY_DATA`): each scenario is `56.8 × (1 − t·k) + sr(i)·noise`, e.g. 1.5 °C
Orderly uses `k=1.18` (steep decline to ~net-zero by 2050); Disorderly variants delay the inflection then
drop faster. The `sr()` noise (±0.4–0.6 Gt) is cosmetic.

### 7.3 Calculation walkthrough

Global KPIs read directly off the `global` region row. `yearsRemaining15 = 380/56.8`. Sector-Budgets tab
maps each sector to `remaining/used/pct` and a status band (`Exceeded` if used ≥ budget, `Critical` >85%,
`Warning` >65%, else `On Track`). Regional tab surfaces cumulative vs remaining budget and reduction-needed.
Pathway tab plots the five decay curves and lets the user isolate one.

### 7.4 Worked example

Global 1.5 °C budget = 380 GtCO₂, annual emissions field = 56.8 → `yearsRemaining15 = 380/56.8 = 6.7
years`. (Using the *correct* CO₂-only rate of ~37 GtCO₂/yr the figure would be ~10.3 years, matching the
guide's "10–13 years" — the discrepancy is the CO₂ vs CO₂e units bug flagged in §7.2.)

Energy sector: `budgetGtCO2 = 220`, `usedGtCO2 = 198` → `remaining = 22 Gt`, `pct = 198/220 = 90%` →
status **Critical** (>85%). LULUCF: `budget = −60`, `used = −42` → `remaining = max(0, −60−(−42)) = max(0,
−18) = 0`, `pct` capped at 100 — the negative-budget land sink is handled but the status logic is designed
for positive budgets, so LULUCF reads oddly (a modelling edge case).

### 7.5 Data provenance & limitations

- Global 1.5 °C/2 °C budgets and cumulative emissions are **real, directionally accurate IPCC AR6 / GCP
  figures**; sector and regional sub-allocations are **illustrative** (internally consistent, not from one
  citable allocation).
- Pathway curves are **analytic decay functions with cosmetic `sr()` noise** (`sr(seed)=frac(sin(seed+1)×
  10⁴)`), not run from an IAM.
- **Units inconsistency**: the years-to-exhaustion divides a CO₂-only budget (380 Gt) by an all-GHG CO₂e
  emission rate (56.8 Gt), understating years remaining by ~35%. A production version should divide by the
  ~37 GtCO₂/yr CO₂-only rate.
- Company allocation is strictly proportional to current emission share — it does not apply
  grandfathering, capability, or convergence allocation principles used in equity-based budget sharing.

**Framework alignment:** IPCC AR6 WGI Ch.5 — the remaining-budget levels (400–500 GtCO₂ for 1.5 °C at
50–67% from 2020) and the depletion-rate framing · Global Carbon Project — the ~37 GtCO₂/yr CO₂ burn rate
(mis-applied here as 56.8 CO₂e) · NGFS/IAM archetypes — the five pathway labels (1.5 °C Orderly/Disorderly,
2 °C Orderly/Disorderly, Current Policies ≈2.8 °C) mirror the NGFS scenario family, though the curves are
stylised rather than IAM-sourced.
