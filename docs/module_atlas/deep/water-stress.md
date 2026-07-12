## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The guide states `WaterRisk = Baseline_stress ×
> Interannual_variability × Seasonal_variability × Drought_severity` — a **multiplicative** 4-factor
> product. The code's `scoreWaterRisk()` instead computes a **weighted additive** combination of just
> 2 real factors (country baseline stress, sector water intensity) plus a random noise term, and never
> uses interannual/seasonal variability or drought severity as multipliers at all. That said, this
> module is comparatively well-grounded: it scores a **real portfolio** (`GLOBAL_COMPANY_MASTER`)
> against **real per-country and per-sector reference tables**, not a fully synthetic universe.

### 7.1 What the module computes

```js
intensityFactor = sectorIntensity.withdrawal_ml_per_mn / 2500              // normalised to Utilities' 2500 ceiling
waterRisk       = min(5, countryRisk.overall × 0.6 + intensityFactor × 2 + sr(idx+13) × 0.5)
waterIntensity  = round(sectorIntensity.withdrawal_ml_per_mn × (0.7 + sr(idx+13) × 0.6))
revenueAtRisk   = round(sectorIntensity.water_dependent_revenue_pct × (company.weight || 0.01) × 100)
cdpScore        = weighted-random letter grade (10-option array skewed toward F: 3 of 10 slots are 'F')
```

Applied to every holding in the real `GLOBAL_COMPANY_MASTER` portfolio, keyed by each company's
`country` (looked up in `WATER_RISK_BY_COUNTRY`, 14 countries) and `sector` (looked up in
`SECTOR_WATER_INTENSITY`, 11 GICS-style sectors).

### 7.2 Parameterisation — real reference tables

| Country | `overall` (1–5) | `baseline_stress` label |
|---|---|---|
| India | 4.2 | Extremely High |
| South Africa | 3.8 | Extremely High |
| China | 3.8 | High |
| Australia | 3.5 | High |
| Singapore | 3.0 | High |
| US | 2.8 | Medium-High |
| Canada | 1.8 | Low |

These are plausible, directionally-correct point estimates consistent with published WRI Aqueduct
country rankings (India, South Africa and China are indeed among the most water-stressed major
economies) but are hand-curated constants in the component, not a live Aqueduct API pull.

| Sector | `withdrawal_ml_per_mn` | `water_dependent_revenue_pct` |
|---|---|---|
| Utilities | 2,500 | 95% |
| Materials | 1,200 | 92% |
| Energy | 850 | 85% |
| Financials | 25 | 5% |

The 2,500 ML/$M-revenue Utilities figure is used as the **normalisation ceiling** for
`intensityFactor` — i.e. Utilities companies always contribute the maximum intensity signal (2.0 to
`waterRisk`), which is a reasonable modelling choice (thermal/hydro cooling water use dominates
utility water footprints) even though the guide doesn't describe this normalisation approach.

### 7.3 Calculation walkthrough

1. `scoredHoldings` applies `scoreWaterRisk()` to every row of the real portfolio.
2. Portfolio KPIs (`metrics`) aggregate `scoredHoldings`: `avgRisk`, `highStressPct` (share with
   `waterRisk ≥ 4.0`, i.e. "High"/"Extremely High" per `riskColor` thresholds), `avgIntensity`,
   `extremeCountries` (distinct countries with `countryRisk.overall ≥ 3.8`), `droughtPct`/`floodPct`
   (share exposed to "High"/"Extremely High"/"Very High" country-level drought/flood labels),
   `avgWaterDepRev`.
3. **Pricing Scenario tool** (What-If tab): a `pricingIncrease` slider (% water-price increase)
   computes `costIncrease = waterIntensity × multiplier × 0.15` and `revImpactPct = costIncrease /
   (revenueAtRisk+1) × 100` per holding — a simple pass-through elasticity (15% of intensity flows to
   cost per 100% price rise), not a demand-elasticity or substitution model.
4. Country/sector reference tables are also rendered directly (`countryData`, `sectorIntensityData`)
   so a user can see the underlying constants that drove each holding's score.

### 7.4 Worked example

A Utilities-sector holding domiciled in India, portfolio `weight = 0.02` (2%):

```
countryRisk.overall = 4.2 (India)
sectorIntensity.withdrawal_ml_per_mn = 2500 (Utilities)
intensityFactor = 2500/2500 = 1.0
s = sr(idx+13)  — take s ≈ 0.5 for illustration
waterRisk = min(5, 4.2×0.6 + 1.0×2 + 0.5×0.5) = min(5, 2.52+2.0+0.25) = min(5, 4.77) = 4.77 → "Extremely High" band (≥4.0)
waterIntensity = round(2500 × (0.7+0.5×0.6)) = round(2500×1.0) = 2,500
revenueAtRisk = round(95 × 0.02 × 100) = round(190) = 190   [note: this exceeds the company's own weight-scaled revenue base — see limitations]
```

### 7.5 Data provenance & limitations

- **Country and sector reference tables are real, hand-curated point estimates** consistent with
  published WRI Aqueduct country rankings — a genuine improvement over sibling modules that generate
  country/sector data via `sr()`.
- **The formula is additive, not multiplicative**, and omits the guide's cited interannual/seasonal
  variability and drought-severity factors entirely — country-level `drought_risk`/`flood_risk`
  labels exist in `WATER_RISK_BY_COUNTRY` but are surfaced only as descriptive badges, never entered
  into the `waterRisk` formula.
- `revenueAtRisk`'s formula (`water_dependent_revenue_pct × weight × 100`) produces a number whose
  units are ambiguous — multiplying a percentage by a portfolio weight and by 100 again does not
  correspond to a clearly-labelled dollar or percentage-of-portfolio quantity; a bank model-validation
  reviewer would flag this for a units/dimensional-analysis check.
- `cdpScore` is a random letter grade **uncorrelated with `waterRisk`** — a company scored 4.77
  "Extremely High" water risk is exactly as likely to draw a CDP "A" (Leadership) grade as a "F"
  (Non-response), which is not realistic (high-risk, well-managed companies should skew toward
  better CDP grades, and the correlation's absence understates how CDP disclosure quality relates to
  underlying exposure).

**Framework alignment:** WRI Aqueduct 4.0 country risk (approximated via hand-curated constants, not
live indicator data) · CDP Water Security tiers (label mapping correct — `CDP_WATER_TIERS` faithfully
reproduces the A/A-/B/B-/C/C-/D/D-/F → Leadership/Management/Awareness/Disclosure/Non-response
mapping — but the grade itself is unscored) · Alliance for Water Stewardship (named in the guide,
not implemented as a certification field in this module).
