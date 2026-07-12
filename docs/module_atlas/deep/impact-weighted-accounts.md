## 7 · Methodology Deep Dive

This module implements the **Harvard Impact-Weighted Accounts (IWA)** structure — adding monetised
environmental costs and social value to operating profit to derive an *impact-weighted profit*. The
accounting *skeleton* is faithful to IWA; every monetary input, however, is a synthetic fraction of a
synthetic revenue figure. Code and guide agree on structure, so no mismatch flag — but §8 specifies the
real monetisation the guide's Social-Cost-of-Carbon framing requires.

### 7.1 What the module computes

For 80 generated companies (`genCompanies(80)`), the IWA P&L bridge:

```js
opProfit           = revenue × (sr()·0.25 + 0.05)                 // 5–30% margin
totalEnvCost       = carbonCost + waterCost + wasteCost + biodiversityCost
totalSocialValue   = jobsQuality + livingWage + healthSafety + diversity
envImpact          = −totalEnvCost
totalImpact        = employmentImpact + productImpact + envImpact + totalSocialValue
impactWeightedProfit = opProfit + totalImpact
```

Each cost/value line is a signed fraction of revenue, e.g.:

```js
carbonCost   = sr()·revenue·0.08                                  // up to 8% of revenue
waterCost    = sr()·revenue·0.02 ; wasteCost = sr()·revenue·0.015 ; biodiversityCost = sr()·revenue·0.01
jobsQuality  = sr()·revenue·0.03 − revenue·0.01                   // can be negative
employmentImpact = sr()·revenue·0.05 − revenue·0.01
productImpact    = sr()·revenue·0.04 − revenue·0.015
```

**Impact-weighted return / alpha**:

```js
impactReturn = tradReturn + (totalImpact/revenue)·5
impactAlpha  = impactReturn − tradReturn
```

### 7.2 Parameterisation / scoring rubric

| IWA line | Coefficient on revenue | Sign | Provenance |
|---|---|---|---|
| Carbon cost | ×0.08 | negative | Synthetic; IWA uses SCC × tonnes, not % revenue |
| Water cost | ×0.02 | negative | Synthetic |
| Waste cost | ×0.015 | negative | Synthetic |
| Biodiversity cost | ×0.01 | negative | Synthetic |
| Jobs quality | ×0.03 − 0.01 | ± | Synthetic (living-wage gap proxy) |
| Employment impact | ×0.05 − 0.01 | ± | Synthetic |
| Product impact | ×0.04 − 0.015 | ± | Synthetic |
| `impactReturn` uplift | (totalImpact/revenue)×5 | ± | Ad-hoc scaling — no basis |

The four environmental categories and three social/product categories mirror the **real IWA taxonomy**
(environmental intensity, employment, product impact); only the monetisation is synthetic (a % of
revenue rather than SCC × emissions, living-wage-gap × headcount, etc.).

### 7.3 Calculation walkthrough

`genCompanies` builds each company's revenue, margin, four env-cost lines, four social-value lines,
employment and product impacts, then sums to `totalImpact` and `impactWeightedProfit`. An 8-quarter
trend applies a quarterly factor (`0.85 + sr()·0.3`)/4 to profit/cost/value. `agg` sums portfolio
revenue, operating profit, impact-weighted profit, env cost, social value and average impact alpha.
`portTrendData` sums traditional vs impact-weighted profit per quarter.

### 7.4 Worked example (one company)

Take `revenue = $1 000M`, margin draw → `opProfit = $150M`; env-cost draws → carbon $50M, water $12M,
waste $9M, biodiversity $6M; social/product draws → social value $20M, employment $25M, product $10M:

| Step | Computation | Result |
|---|---|---|
| totalEnvCost | 50+12+9+6 | **$77M** |
| envImpact | −77 | **−$77M** |
| totalImpact | 25 + 10 − 77 + 20 | **−$22M** |
| impactWeightedProfit | 150 + (−22) | **$128M** |
| impactReturn uplift | (−22/1000)×5 | −0.11 pts on return |

A company whose environmental externalities ($77M) exceed its positive impacts sees reported profit
($150M) reduced to $128M on an impact-weighted basis — exactly the IWA "hidden environmental loss"
narrative from the guide, though here driven by synthetic percentages.

### 7.5 Data provenance & limitations

- **All financials are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`), including revenue and every
  cost/value line. Company names are PRNG prefix+suffix, not real issuers.
- **Monetisation is % of revenue, not physical** — the real IWA multiplies *quantities* (tCO₂e, m³
  water, headcount below living wage) by *monetisation coefficients* (SCC, water scarcity value,
  wage gap). This module skips the physical layer entirely.
- The `impactReturn` uplift (×5 on impact/revenue) has no methodological basis.

## 8 · Model Specification — Harvard Impact-Weighted Environmental & Social Accounts

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce an audit-defensible impact-weighted P&L: monetise a company's environmental and employment/
product externalities and integrate them with financial accounts, enabling like-for-like comparison of
"true" profitability across a portfolio.

### 8.2 Conceptual approach
Direct implementation of the **Harvard Business School IWA** methodology (Serafeim et al.) for
environmental intensity and employment; monetisation coefficients drawn from the **US IWG / Rennert et
al. (2022) Social Cost of Carbon** and **ILO living-wage** benchmarks — the same references the guide
cites. Benchmarks: HBS IWA published company scores; Trucost/S&P natural-capital valuations.

### 8.3 Mathematical specification
```
EnvCost   = Σ_p  Quantity_p · MonetCoeff_p
          = E_CO2e·SCC + Water_m3·WaterValue_region + WasteEmissions·EF + LandUse·LandValue
EmployQuality = Σ_tier headcount_tier · max(0, LivingWage_country − Wage_tier)          (wage-gap)
ProductImpact = Σ RevenueSegment · (HealthAccessScore − HarmScore)                       (IWA product module)
IW_Profit = EBIT − EnvCost + EmployQuality + ProductImpact
EP_margin = (EBIT − EnvCost)/Revenue
```

| Parameter | Value / source |
|---|---|
| SCC | $185/tCO₂e (Rennert et al. 2022); scenario $51–190 (US IWG) |
| Water scarcity value | Region-specific $/m³ (WRI Aqueduct + Trucost) |
| Living wage | ILO / WageIndicator by country |
| Air-pollutant coefficients | US EPA benefit-per-tonne |
| Land-use value | Natural Capital Protocol / TEEB |

### 8.4 Data requirements
Company Scope 1–3 emissions, water withdrawal by basin, waste tonnage, headcount and wage bands by
country, revenue by product segment. Platform holds sector taxonomies and emissions contexts; SCC and
living-wage tables would need ingestion into `reference_data`.

### 8.5 Validation & benchmarking plan
Reconcile EP-margin ranking against HBS IWA published dataset (rank correlation); sensitivity of
IW-profit to SCC ($51 vs $185); backtest that heavy industry (cement/steel) shows deeply negative EP
and clean tech positive, per HBS findings. Stability across SCC vintages.

### 8.6 Limitations & model risk
Monetisation coefficients are contested (SCC spans 4× across authorities) — always disclose the SCC
used and present an EP range. Scope-3 emissions data is sparse and low-quality; flag DQ. Product-impact
scoring is judgemental and hardest to standardise — treat as indicative.

**Framework alignment:** Harvard IWA Framework (2021) · Rennert et al. (2022) / US IWG Social Cost of
Carbon · ILO living-wage benchmarks · WHO DALY monetisation (health). The current module reproduces the
IWA *account structure* but replaces physical-quantity monetisation with synthetic revenue percentages.
