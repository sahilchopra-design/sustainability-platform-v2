# Implied Temperature Regression
**Module ID:** `implied-temp-regression` · **Route:** `/implied-temp-regression` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Estimates the implied temperature rise embedded in financial market prices through regression of bond spreads, equity risk premia, and commodity forward curves on climate scenario parameters, providing a market-derived cross-check on fundamental portfolio temperature alignment scores.

> **Business value:** Provides a market-derived cross-check on fundamental portfolio temperature alignment, enabling investors to assess whether financial markets are efficiently pricing climate risk and compare market-implied temperatures against science-based Paris Agreement targets.

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

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Market-Implied Temperature (°C) | — | Market regression output | Temperature consistent with current financial market pricing; persistent range of 2.5â€“3.0°C suggests markets |
| Carbon Price Signal (°C per €10/tCO2) | — | Regression coefficient | Marginal temperature reduction implied by each €10/tCO2 increase in European carbon price; quantifies the mark |
| Regression R² | — | Cross-validation results | Explanatory power of market variables in predicting climate scenario outcomes; higher R² indicates stronger ma |
| Spread-to-Temperature Conversion (bps/°C) | — | CDS regression | CDS spread widening associated with each additional °C of warming above 2°C, reflecting transition risk pricin |
- **CDS index data (Markit iTraxx)** → Compute spread changes, regress on NGFS scenario temperature outcomes → **CDS-temperature sensitivity coefficients**
- **Equity risk premium estimates (Damodaran)** → Regress ERP changes on warming scenario calibration → **Equity-implied temperature contribution**
- **EU ETS carbon price (ICE)** → Map carbon price to temperature scenario calibration → **Carbon price implied temperature signal**

## 5 · Intermediate Transformation Logic
**Methodology:** Market-Implied Temperature
**Headline formula:** `MIT = T_baseline + β_spread × ΔCDS + β_equity × ΔERP + β_carbon × P_carbon`
**Standards:** ['IPCC AR6 Climate Scenarios', 'Dietz et al. (2021) â€” Market Implied Temperature', 'ECB Climate Stress Test Methodology']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).