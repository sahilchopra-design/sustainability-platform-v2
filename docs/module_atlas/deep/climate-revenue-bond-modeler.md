## 7 · Methodology Deep Dive

This module (EP-DY2) is closer to guide↔code alignment than most: it genuinely computes **DSCR** and a
revenue projection with a climate-stress overlay. The main gap is that the "climate risk revenue discount"
and ESG scores are seeded/stress-table values, not derived from a physical-risk model.

### 7.1 What the module computes

Debt-service coverage and its 10-year projection:
```js
netRevenue = annualRevenue − annualOm
dscr(year) = (annRevenue·(1+rateIncrease/100)^i − annOm·(1.03)^i) / annDebtService
```
Revenue grows at a user `rateIncrease`; O&M inflates at a fixed 3%; debt service is level. A stress panel
(`stressData` over `STRESS_SCENARIOS`) recomputes DSCR under revenue shocks, and a synthetic ESG block:
```js
eScore = round(greenShare·0.8 + sr(i·11)·20)      // env tied to green-use-of-proceeds share
sScore = round(70 + sr(i·17)·25)                   // social 70–95
gScore = round(75 + sr(i·23)·20)                   // governance 75–95
overall = round((eScore + sScore + gScore)/3)
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Source | Provenance |
|---|---|---|
| `BOND_SECTORS` (7 rows: dscr, greenShare, coupon, spread, resilience, issuanceGbn) | seed schema | curated demo (toll/utility/TIF sectors) |
| O&M inflation | fixed `1.03` p.a. | heuristic (3% inflation) |
| `STRESS_SCENARIOS` (revenueChg, dscrResult, rateIncrease, feasible) | seed schema | scenario demo values |
| `GREEN_STANDARDS` (certBody, greenium) | seed schema | CBI/ICMA labelling reference |
| ESG sub-scores | `sr()` seeded, E linked to greenShare | synthetic demo value |

DSCR reading follows the guide: 1.25× IG threshold, 1.5×+ strong, 1.35× climate-stress floor.

### 7.3 Calculation walkthrough

User sets `rateIncrease` → `revenueProjection` builds year-by-year revenue (geometric), O&M (3% geometric),
level debt service, and DSCR each year. `totalIssuance` sums sector issuance; `issuanceData` sorts sectors
by size with green share. ESG scores are computed per sector for the ratings view.

### 7.4 Worked example

`annRevenue=$100M`, `annOm=$30M`, `annDebtService=$45M`, `rateIncrease=2%`:

| Year i | Revenue | O&M | Net | DSCR |
|---|---|---|---|---|
| 0 | 100.0 | 30.0 | 70.0 | 70.0/45 = **1.56×** |
| 5 | 100·1.02⁵=110.4 | 30·1.03⁵=34.8 | 75.6 | **1.68×** |
| 10 | 100·1.02¹⁰=121.9 | 30·1.03¹⁰=40.3 | 81.6 | **1.81×** |

Because O&M inflates faster in year 0 but revenue growth (2%) < is offset over time, coverage strengthens.
A stress scenario with `revenueChg=−15%` drops year-0 DSCR to (85−30)/45 = **1.22×**, below the 1.25× IG
threshold — exactly the covenant-breach test the module surfaces.

### 7.5 Data provenance & limitations

- Sector/stress/ESG data are **curated demo + `sr()` seeded** — not real municipal financials or BVAL
  greenium. The E-score's link to `greenShare` is the only non-random driver.
- The "climate risk revenue discount" the guide describes (RCP-scenario reduction to pledged revenue) is
  represented by static stress-scenario `revenueChg` rows, not a physical-risk model on the revenue base.
- Level debt service and fixed 3% O&M inflation ignore refinancing, sculpting, and rate-covenant dynamics.

**Framework alignment:** MSRB revenue-bond disclosure practice · CDFA Climate-Resilient Infrastructure
Finance Toolkit · Moody's Revenue Bond Rating Methodology (DSCR + rate-covenant credit factors). DSCR and
the 1.25×/1.35× thresholds mirror rating-agency conventions; ICMA/CBI labelling underlies `GREEN_STANDARDS`.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Price and stress a dedicated-revenue climate bond (toll, utility rate, TIF,
special assessment), producing scenario DSCR, climate-adjusted coverage, and a greenium-net-of-SPO benefit,
to support issuance structuring and investor credit assessment.

**8.2 Conceptual approach.** A **project-finance cash-flow waterfall** (Moody's/S&P revenue-bond method)
with a physical-climate revenue-attenuation overlay derived from asset-level catastrophe modelling
(Moody's RMS climate), plus a greenium estimate from a matched-maturity yield-curve comparison (BIS/OECD
sovereign-greenium approach transposed to munis).

**8.3 Mathematical specification.**
```
Revenue_climate,t = Revenue_base,t · (1 − PhysRiskDiscount_t) · (1 + GreenPremium)
PhysRiskDiscount_t = Σ_peril  P(peril)·RevenueSensitivity_peril   (scenario RCP4.5/8.5)
DSCR_t = (Revenue_climate,t − O&M_t) / DebtService_t
Greenium = YTM_conventional(dur) − YTM_green(dur)     (interpolated curve)
NetGreenBenefit = |Greenium|·Duration·Notional − SPO_cost
```

| Parameter | Source |
|---|---|
| Revenue sensitivity to peril | sector rate-study + RMS/AIR hazard on service area |
| RCP scenario paths | NGFS / IPCC AR6 regional |
| Yield curves | Bloomberg BVAL, MSRB EMMA |
| SPO cost | CBI/ICMA verifier fee schedules |

**8.4 Data requirements.** Pledged-revenue history, rate covenants, service-area geocode, debt schedule;
comparable conventional/green yields (EMMA/BVAL). Free: EMMA disclosure; vendor: BVAL, RMS.

**8.5 Validation & benchmarking.** Backtest DSCR forecast vs realised; reconcile greenium against
BIS/OECD −1 to −5 bp sovereign range and CBI muni evidence; peril-sensitivity stress.

**8.6 Limitations & model risk.** Thin muni greenium data; revenue-elasticity to climate hard to identify;
TIF district growth uncertain. Fallback: rating-implied spread and conservative flat 5% climate discount.
