## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **market-implied temperature**
> model — regressing CDS spreads, equity risk premia and carbon prices on IPCC scenario temperatures
> (`MIT = T_baseline + β_spread·ΔCDS + β_equity·ΔERP + β_carbon·P_carbon`, citing Dietz et al. 2021).
> **None of that exists in the code.** What the module actually computes is a **carbon-budget-based
> Implied Temperature Rise (ITR)** per company (SBTi-style budget-overshoot method), plus an **OLS
> regression of company ITR on carbon intensity** (a cross-sectional descriptive regression, not a
> market inversion). There are no CDS, ERP or carbon-price inputs anywhere. Sections below document the
> real budget-ITR + OLS logic.

### 7.1 What the module computes

**Per-company ITR** (`computeCompanyITR`) — a carbon-budget overshoot method on real emissions:

```js
currentEmissions = scope1_mt + scope2_mt                       // Mt CO₂e/yr
impliedReduction = hasTarget ? currentEmissions/yearsToNZ : currentEmissions·0.01   // linear to net-zero, else 1%/yr
cumulativeEmissions = Σ_{yr=2025..2100} max(0, currentEmissions − impliedReduction·(yr−2025))
companyShare = currentEmissions / GLOBAL_ANNUAL_MT             // share of 40 000 Mt/yr global
budget(temp) = remaining_gt·1000·companyShare                  // company's slice of each IPCC budget (Mt)
```

ITR is then found by locating where the company's cumulative emissions fall among its budget slices,
**interpolating linearly between the two bracketing temperature budgets**:

```js
itr = temp_i + frac·(temp_{i+1} − temp_i),  frac = (cumE − budget_i)/(budget_{i+1} − budget_i)
```

defaulting to 3.5 °C if the company exceeds even the 3.0 °C budget.

**Cross-sectional OLS** (`linearRegression`) — closed-form least squares of ITR (y) on intensity (x):

```
slope = (n·ΣXY − ΣX·ΣY)/(n·ΣX² − ΣX²) ;  intercept = (ΣY − slope·ΣX)/n
R² = 1 − SS_res/SS_tot ;  adjR² = 1 − (1−R²)(n−1)/(n−k−1)
```

### 7.2 Parameterisation — IPCC carbon budgets (from 2025)

| Warming | Remaining budget (GtCO₂) | Peak year | Net-zero year | Basis |
|---|---|---|---|---|
| 1.5 °C | 400 | 2025 | 2050 | IPCC AR6 remaining-budget (67th-percentile ≈ 400 Gt from 2020, adjusted to 2025) |
| 1.8 °C | 700 | 2027 | 2055 | Interpolated AR6 |
| 2.0 °C | 1 150 | 2030 | 2070 | IPCC AR6 |
| 2.5 °C | 2 200 | 2035 | 2080 | AR6 higher-warming |
| 3.0 °C | 3 500 | 2040 | 2090 | AR6 |

`GLOBAL_ANNUAL_MT = 40 000` Mt/yr — current global CO₂ (~40 Gt, correct). `lookupITR` provides a WACI
threshold ladder (<50→1.5 °C … >1000→3.5 °C) as a comparison model.

### 7.3 Calculation walkthrough

For each holding: emissions and revenue come from `GLOBAL_COMPANY_MASTER` (real fields `scope1_mt`,
`scope2_mt`, `revenue_usd_mn`, `sbti_committed`, `carbon_neutral_target_year`). `computeCompanyITR`
projects a linear decarbonisation path to the target net-zero year (or 1%/yr if no target), integrates
cumulative 2025–2100 emissions, scales the five IPCC budgets by the company's global emissions share,
and interpolates ITR. `holdingResults` maps all holdings; `wtdReduction`, `avgOvershoot`, `dataConf`
(share with real emissions+revenue) aggregate. `regressionData` runs OLS of ITR on intensity across
holdings, reporting slope, intercept, R² and adjusted R², plus residuals per company.

### 7.4 Worked example

Company: `scope1+scope2 = 20 Mt/yr`, `revenue = $50 000M`, SBTi net-zero 2050:

| Step | Computation | Result |
|---|---|---|
| yearsToNZ | 2050 − 2025 | 25 |
| impliedReduction | 20 / 25 | 0.8 Mt/yr |
| cumE (linear to 0 at 2050) | ½·20·25 (triangle) | **250 Mt** |
| companyShare | 20 / 40 000 | 5×10⁻⁴ |
| budget 1.5 °C | 400 000·5×10⁻⁴ | **200 Mt** |
| budget 1.8 °C | 700 000·5×10⁻⁴ | **350 Mt** |
| ITR | 250 > 200, ≤ 350 → 1.5 + (250−200)/(350−200)·0.3 | 1.5 + 0.333·0.3 = **1.6 °C** |
| overshoot vs 1.5 °C | 250 − 200 | **+50 Mt** |

So a company on a straight-line-to-2050 path lands at ≈1.6 °C — just above Paris-aligned, with a 50 Mt
budget overshoot. A no-target company (1%/yr) would accumulate far more and pin to 3.0–3.5 °C.

### 7.5 Data provenance & limitations

- **Emissions and revenue are real** where present in `GLOBAL_COMPANY_MASTER`; `dataConf` reports the
  share of holdings with genuine data. The IPCC budgets are real. **No PRNG is used** in the ITR core.
- The **OLS is a descriptive cross-section** (ITR vs intensity), not the guide's market inversion — R²
  measures how well intensity explains budget-ITR across the portfolio, nothing about market pricing.
- Decarbonisation path is **linear**, not a sector-specific convergence pathway; budget allocation is a
  flat global-emissions-share grandfathering, not a sectoral decarbonisation approach (SDA).
- The guide's CDS/ERP/carbon-price market-implied temperature is entirely unimplemented.

## 8 · Model Specification — Market-Implied Temperature (MIT) regression

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Estimate the warming outcome consistent with current financial-market pricing, as a market-based
cross-check on the fundamental budget-ITR the module already computes.

### 8.2 Conceptual approach
Invert a panel regression of asset-price climate sensitivities on scenario temperatures, following
**Dietz et al. (2021) market-implied temperature** and the **ECB climate-stress-test** repricing logic;
benchmark against NGFS scenario calibrations and MSCI/ISS implied-temperature-rise products.

### 8.3 Mathematical specification
```
Stage 1 (calibration): for scenarios s with known T_s,
   ΔCDS_s = a₁ + b₁·T_s ; ΔERP_s = a₂ + b₂·T_s ; P_carbon_s = a₃ + b₃·T_s
Stage 2 (inversion): given observed market state (CDS*, ERP*, P_carbon*),
   MIT = T_baseline + β_spread·ΔCDS* + β_equity·ΔERP* + β_carbon·P_carbon*
   β_• = 1/b_•  (invert the calibrated sensitivities), weighted by market liquidity
```

| Parameter | Source |
|---|---|
| Scenario temperatures `T_s` | NGFS Phase IV (1.4–3.0 °C) |
| CDS series | Markit iTraxx / CDX by sector |
| ERP | Damodaran implied ERP |
| Carbon price | EU ETS (ICE) forward curve |
| Sensitivities `b_•` | Estimated via ECB/NGFS repricing shocks |

### 8.4 Data requirements
Sector CDS indices, implied ERP series, EU-ETS forward prices, NGFS scenario temperature/GDP paths.
Platform has NGFS scenario context and ETS price seeds; CDS and ERP series need ingestion.

### 8.5 Validation & benchmarking plan
Backtest MIT stability vs realised policy shocks (e.g. Fit-for-55, IRA); reconcile MIT against the
module's fundamental budget-ITR and against MSCI/ISS ITR; report R² (guide expects 0.55–0.72) and
bps/°C conversion (18–35 bps).

### 8.6 Limitations & model risk
Market prices reflect many non-climate factors — attribution of spread moves to warming is fragile
(omitted-variable risk); use sector fixed effects and event-study windows around climate-policy news.
Present MIT as a range with confidence intervals, not a point estimate.

**Framework alignment:** Dietz et al. (2021) Market-Implied Temperature · IPCC AR6 carbon budgets (the
budget-ITR the code implements) · NGFS Phase IV · ECB climate-risk measurement. The code delivers a
credible budget-based ITR; the market-implied variant the guide names remains a specification.
