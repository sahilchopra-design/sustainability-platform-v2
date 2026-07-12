# Implied Temperature Regression
**Module ID:** `implied-temp-regression` · **Route:** `/implied-temp-regression` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Estimates the implied temperature rise embedded in financial market prices through regression of bond spreads, equity risk premia, and commodity forward curves on climate scenario parameters, providing a market-derived cross-check on fundamental portfolio temperature alignment scores.

> **Business value:** Provides a market-derived cross-check on fundamental portfolio temperature alignment, enabling investors to assess whether financial markets are efficiently pricing climate risk and compare market-implied temperatures against science-based Paris Agreement targets.

**How an analyst works this module:**
- Configure the market variable inputs (CDS indices, equity risk premium, carbon price) and select the temperature scenario calibration dataset.
- Run the regression model and review the implied temperature estimate with confidence intervals.
- Compare the market-implied temperature against the portfolio's fundamental implied temperature rise (ITR) from company analysis.
- Analyse the sensitivity of the implied temperature to individual market variables to identify which markets price climate risk most efficiently.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_BUDGETS`, `ChartTooltip`, `GLOBAL_ANNUAL_MT`, `KpiCard`, `SectionHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `GLOBAL_ANNUAL_MT` | `40000; // Mt CO2/yr current global emissions` |
| `currentEmissions` | `(c.scope1_mt \|\| 0) + (c.scope2_mt \|\| 0); // Mt CO2e/yr` |
| `intensity` | `currentEmissions * 1e6 / revenue; // tCO2e per USD Mn` |
| `yearsToNZ` | `Math.max(1, nzYear - 2025);` |
| `yearEmissions` | `Math.max(0, currentEmissions - impliedReduction * (yr - 2025));` |
| `companyShare` | `currentEmissions > 0 ? currentEmissions / GLOBAL_ANNUAL_MT : 1e-12;` |
| `budgetEntries` | `Object.entries(CARBON_BUDGETS).map(([temp, data]) => ({` |
| `itr` | `3.5; // default worst case` |
| `frac` | `(cumulativeEmissions - budgetEntries[i].budget) /` |
| `waci` | `((company.scope1_mt \|\| 0) + (company.scope2_mt \|\| 0)) * 1e6 / (company.revenue_usd_mn \|\| 1);` |
| `sumX` | `x.reduce((s, v) => s + v, 0);` |
| `sumY` | `y.reduce((s, v) => s + v, 0);` |
| `sumXY` | `x.reduce((s, v, i) => s + v * y[i], 0);` |
| `sumX2` | `x.reduce((s, v) => s + v * v, 0);` |
| `sumY2` | `y.reduce((s, v) => s + v * v, 0);` |
| `denom` | `n * sumX2 - sumX * sumX;` |
| `slope` | `(n * sumXY - sumX * sumY) / denom;` |
| `intercept` | `(sumY - slope * sumX) / n;` |
| `ssRes` | `x.reduce((s, v, i) => s + Math.pow(y[i] - (slope * v + intercept), 2), 0);` |
| `ssTot` | `y.reduce((s, v) => s + Math.pow(v - sumY / n, 2), 0);` |
| `holdings` | `p.holdings.map(h => {` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `totalWeight` | `useMemo(() => holdings.reduce((s, h) => s + h.weight, 0), [holdings]);` |
| `holdingResults` | `useMemo(() => { return holdings.map(h => { const result = computeCompanyITR(h.company);` |
| `avgOvershoot` | `holdingResults.reduce((s, h) => s + h.overshoot, 0) / holdingResults.length;` |
| `wtdReduction` | `holdingResults.reduce((s, h) => {` |
| `rate` | `h.currentEmissions > 0 ? (h.annualReduction / h.currentEmissions) * 100 : 0;` |
| `dataConf` | `holdingResults.filter(h => (h.company.scope1_mt \|\| 0) > 0 && h.company.revenue_usd_mn > 0).length / holdingResults.length * 100;` |
| `regressionData` | `useMemo(() => { const xVals = holdingResults.map(h => h.intensity);` |
| `yVals` | `holdingResults.map(h => h.itr);` |
| `points` | `holdingResults.map(h => ({` |
| `avgC` | `committed.length > 0 ? committed.reduce((s, h) => s + h.itr, 0) / committed.length : 0;` |
| `avgNC` | `notCommitted.length > 0 ? notCommitted.reduce((s, h) => s + h.itr, 0) / notCommitted.length : 0;` |
| `budget15` | `CARBON_BUDGETS['1.5'].remaining_gt * 1000 * companyShare;` |
| `budget15Annual` | `budget15 / 25; // spread over 25 years` |
| `companyE` | `Math.max(0, curr - reduction * t);` |
| `reduction` | `(curr / yearsToNZ) * sensitivityReductionMult;` |
| `residuals` | `points.map(p => ({ name: p.name, residual: +(p.itr - (reg.slope * p.intensity + reg.intercept)).toFixed(3) }));` |
| `adjR2` | `n > 2 ? 1 - (1 - reg.r2) * (n - 1) / (n - k - 1) : reg.r2;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Market-Implied Temperature (°C) | — | Market regression output | Temperature consistent with current financial market pricing; persistent range of 2.5â€“3.0°C suggests markets price in insufficient policy ambition relative to Paris targets. |
| Carbon Price Signal (°C per €10/tCO2) | — | Regression coefficient | Marginal temperature reduction implied by each €10/tCO2 increase in European carbon price; quantifies the market signalling value of carbon pricing. |
| Regression R² | — | Cross-validation results | Explanatory power of market variables in predicting climate scenario outcomes; higher R² indicates stronger market-scenario alignment. |
| Spread-to-Temperature Conversion (bps/°C) | — | CDS regression | CDS spread widening associated with each additional °C of warming above 2°C, reflecting transition risk pricing in credit markets. |
- **CDS index data (Markit iTraxx)** → Compute spread changes, regress on NGFS scenario temperature outcomes → **CDS-temperature sensitivity coefficients**
- **Equity risk premium estimates (Damodaran)** → Regress ERP changes on warming scenario calibration → **Equity-implied temperature contribution**
- **EU ETS carbon price (ICE)** → Map carbon price to temperature scenario calibration → **Carbon price implied temperature signal**

## 5 · Intermediate Transformation Logic
**Methodology:** Market-Implied Temperature
**Headline formula:** `MIT = T_baseline + β_spread × ΔCDS + β_equity × ΔERP + β_carbon × P_carbon`

Regresses financial market variables (CDS spread changes, equity risk premium changes, carbon price) on IPCC temperature outcomes across calibrated climate scenarios to invert the relationship and estimate the temperature consistent with current market pricing. Results are cross-validated against NGFS scenario calibrations.

**Standards:** ['IPCC AR6 Climate Scenarios', 'Dietz et al. (2021) â€” Market Implied Temperature', 'ECB Climate Stress Test Methodology']
**Reference documents:** Dietz et al. (2021) â€” Market-Implied Temperature Warming Risk of Listed Equities; IPCC AR6 Summary for Policymakers (2021); ECB â€” Climate-Related Financial Risks: Measurement Methodologies (2020); NGFS Climate Scenario Database Phase 4 (2023)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Sectoral pathways and the market-implied cross-check (analytics ladder: rung 2 → 3)

**What.** The code's actual model is respectable: a PRNG-free, carbon-budget ITR on real `GLOBAL_COMPANY_MASTER` emissions (linear path to net-zero, cumulative 2025–2100 emissions vs the company's grandfathered slice of five IPCC AR6 budgets, interpolated ITR), plus a genuine closed-form OLS with adjusted R². Its §7.5 limitations: the decarbonisation path is linear (no sector-specific convergence), budget allocation is flat emissions-share grandfathering rather than a Sectoral Decarbonisation Approach, and the module's *name-sake* — the Dietz-style market-implied temperature regression on CDS/ERP/carbon prices — is entirely unimplemented. Evolution A does both upgrades: SDA-style sector pathways for the fundamental ITR, and a first slice of the §8 MIT model as the market cross-check.

**How.** (1) Sector pathway intensities (SBTi SDA public tables) replace the linear path where a sector mapping exists, with `resolution_tier`-style reporting of which method applied. (2) For the MIT slice, start with the one market input the platform already holds — EU ETS price seeds — calibrating `P_carbon → T` against NGFS Phase IV scenario carbon-price/temperature pairs, deferring CDS/ERP ingestion (Markit/Damodaran) to a later increment as §8.4 acknowledges. (3) Move `computeCompanyITR` server-side so other alignment modules can share it. (4) Benchmarks per §8.5: reconcile ITR distribution against MSCI/ISS published portfolio ITR ranges; pin the §7.4 worked example (1.6°C, +50 Mt overshoot) in bench_quant.

**Prerequisites.** SBTi SDA pathway tables ingested; NGFS carbon-price paths joined to temperatures. **Acceptance:** a steel company's ITR differs from a software company's at equal intensity for a documented sectoral reason; the carbon-price-implied temperature is reported alongside budget-ITR with its calibration R².

### 9.2 Evolution B — Alignment-methodology copilot for the ITR family (LLM tier 1 → 2)

**What.** ITR is the most methodology-sensitive number investors quote, and this page documents two different models (budget-overshoot vs the WACI threshold ladder in `lookupITR`) plus a promised third (MIT). Evolution B is a copilot that keeps users honest: "why is this holding 1.6°C here but 2.1°C in the temperature-score module?", "what does the regression R² actually mean?" (answer per §7.5: descriptive cross-section, not market pricing), "how would a 2045 net-zero target change our ITR?"

**How.** Tier 1: this Atlas page — especially the §7 mismatch flag and §7.4 worked example — as the grounding corpus; the page's computed state (`holdingResults`, regression slope/R², `dataConf`) passed as context so answers reference the actual portfolio numbers. Tier 2 after Evolution A's server-side ITR: what-ifs ("set all uncommitted holdings to 1%/yr vs 2050 targets") run as tool calls, and cross-module comparisons cite each module's method by name. A hard rule: the copilot never calls the OLS a market signal — the §7 flag exists precisely because that conflation is tempting.

**Prerequisites.** Copilot infrastructure (Phase 1); Evolution A for tool-called what-ifs. **Acceptance:** methodology-comparison answers correctly attribute each number to its model (budget-ITR / WACI ladder / MIT); every °C figure matches page state or a logged tool call.