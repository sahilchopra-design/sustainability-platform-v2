## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula `LWGᵢ = max(0, LivingWageᵢ − ActualWageᵢ) /
> LivingWageᵢ` implies the gap is derived from a paired living-wage/actual-wage comparison. **The code
> never computes this ratio.** Every gap figure — the top-level `livingWageGap` per company and the
> per-region `gap` inside `regBench` — is an **independent seeded-random draw**, not a function of the
> `lwBench`/`actualPay` values that sit right next to it in the same data object. Sections below
> document the code as it actually behaves.

### 7.1 What the module computes

50 real, named consumer/apparel/agriculture/hospitality/technology companies (Walmart, Amazon, Nike,
H&M, Nestlé, Unilever, Tyson Foods, Fast Retailing, LVMH, etc.) each receive a fully synthetic wage
profile generated once at module load:

```js
workforceK        = round(sr(i*7)*500+20)              // 20-520K employees
livingWageGap     = round(sr(i*11)*40)                  // 0-40%  ← NOT derived from any wage pair
lwCoverage        = round(100 - livingWageGap)           // definitional complement, only real relation
regionsOp         = round(sr(i*13)*30+5)
supplyWorkersK    = round(sr(i*17)*200+10)
annualWageCostM   = round(sr(i*19)*500+50)
lwIncreaseCostM   = round(sr(i*23)*100+5)                // cost to close the gap — independent draw, not gap × headcount × wage delta
commitYear        = sr(i*29)<0.3 ? 2025 : sr(i*29)<0.6 ? 2027 : 2030
progress          = sr(i*31)<0.3 ? 'On Track' : sr(i*31)<0.6 ? 'Behind' : 'At Risk'
methodology       = ['Anker','WageIndicator','MIT Living Wage','Global Living Wage'][floor(sr(i*37)*4)]
verification      = sr(i*41)>0.4 ? 'Third-party' : 'Self-assessed'
genderPayGap      = round(sr(i*43)*20)
supplyChainAudit  = sr(i*47)>0.3 ? 'Yes' : 'No'
transparencyScore = round(sr(i*49)*40+50)
```
Each company additionally carries a 6-region benchmark array (`regBench`) and a 5-year trend array
(`yearly`), both independently seeded per company/region/year combination.

### 7.2 Parameterisation

| Field | Provenance |
|---|---|
| Company names, sector assignments (50 companies) | Real, correctly-classified major consumer/apparel/food/hospitality companies |
| All 13 quantitative attributes per company | Synthetic demo values, `sr()`-seeded per company index; **no relationship to any real company's actual reported wage data or living-wage assessment** |
| `regBench` (6 regions × 3 fields per company) | `lwBench`, `actualPay`, `gap` are 3 **independently** seeded draws — `gap` is not `(lwBench−actualPay)/lwBench` as the guide's formula and column adjacency would suggest |
| `yearly` (5-year trend per company) | `gap = round(lwGap+5−year_offset×2+noise)` — a mild downward drift plus noise; `coverage` and `spend` are separately seeded, not derived from `gap` |
| `methodology` label (Anker/WageIndicator/MIT/GLWC) | Real named living-wage methodologies, randomly assigned per company — i.e. which real methodology a company is displayed as "using" is arbitrary, not evidenced |

### 7.3 Calculation walkthrough

- **Dashboard KPIs**: `avgGap = mean(livingWageGap)`, `avgCoverage = mean(lwCoverage)`,
  `totalWorkers = Σ workforceK × 1000`, `onTrack = count(progress==='On Track')`,
  `totalCost = Σ lwIncreaseCostM`, `verified = count(verification==='Third-party')` — straightforward
  aggregation over the 50-company synthetic panel, correctly implemented arithmetic on synthetic
  inputs.
- **Sector Gap chart**: `sectorGap = groupBy(sector) → mean(livingWageGap), mean(lwCoverage)` across
  the 6 sector categories.
- **Gap vs Cost to Close scatter**: plots `livingWageGap` (x) against `lwIncreaseCostM` (y) per
  company — since both are independent random draws, any visual correlation the user perceives is
  coincidental, not a modelled relationship (a real "cost to close" figure should scale with
  headcount × wage gap × currency, none of which this scatter's y-axis is derived from).
- **Transparency Score vs Gap scatter**: same structure — `transparencyScore` and `livingWageGap` are
  independently seeded, so no real correlation exists in the underlying data despite the chart
  inviting visual correlation-spotting.
- **Commitment Timeline**: counts companies by `commitYear` bucket (2025/2027/2030) — correct
  aggregation of the synthetic assignment.

### 7.4 Worked example

Nike (`i=2`, sector Apparel): `livingWageGap = round(sr(2×11)×40) = round(sr(22)×40)`.
`sr(22) = frac(sin(23)×10000)`; `sin(23 rad) ≈ -0.8462` → `frac(-8462.4) = 0.5876` (JS's `%`-free
`frac` via `x - Math.floor(x)` correctly handles negative `x`, giving a value in `[0,1)`) →
`livingWageGap = round(0.5876×40) = 24%`. Independently, `lwIncreaseCostM = round(sr(2×23)×100+5) =
round(sr(46)×100+5)`; `sr(46) = frac(sin(47)×10000)`, `sin(47)≈0.1236` → `frac(1236.5)=0.4999` →
`lwIncreaseCostM ≈ round(0.4999×100+5) = 55`. These two figures — "24% gap" and "$55M to close it" —
are displayed side-by-side in the table as though causally linked, but are mathematically
independent draws.

### 7.5 Data provenance & limitations

- **Every quantitative figure for all 50 real companies is fabricated** via the seeded PRNG
  `sr(seed)=frac(sin(seed+1)×10⁴)` — a user could reasonably (but incorrectly) read this page as
  real disclosed wage-gap data for Walmart, Nike, Nestlé, etc.
- The `methodology` field randomly labels each company as using Anker/WageIndicator/MIT/GLWC
  methodology with no evidentiary basis — this could misrepresent which real methodology (if any) a
  given company has actually adopted.
- `lwIncreaseCostM` (cost to close the gap) is not derived from `workforceK × livingWageGap ×
  annualWageCostM` or any comparable formula — it is an unrelated random draw, so it cannot be relied
  upon even directionally.
- Regional benchmark `gap` values are inconsistent with their own `lwBench`/`actualPay` fields in the
  same row (§7.1), a data-integrity issue a careful reviewer would catch by cross-checking the numbers.

**Framework alignment:** Anker Research Institute, WageIndicator Foundation, MIT Living Wage
Calculator, and Global Living Wage Coalition are all real, correctly-named living-wage methodologies
— naming them is accurate, but no company in this dataset is actually assessed under any of them.
CSRD ESRS S1 (own workforce) is referenced in the guide as the disclosure standard this module should
feed, but no ESRS-conformant data model (median wage, pay ratio) is implemented.
