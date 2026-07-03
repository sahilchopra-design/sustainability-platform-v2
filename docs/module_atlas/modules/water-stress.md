# Water Stress Analytics
**Module ID:** `water-stress` · **Route:** `/water-stress` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
WRI Aqueduct-based water stress mapping for portfolio companies and their operations. Covers baseline water stress, drought risk, groundwater depletion, and corporate water stewardship scoring.

> **Business value:** Water stress is a material operational risk for manufacturing, agriculture, mining, and energy sectors. Regulators and TNFD are increasingly requiring nature-related disclosures including water. This module quantifies water risk at asset and portfolio level for informed engagement and investment decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CDP_WATER_TIERS`, `COUNTRY_NAMES`, `Card`, `CustomTooltip`, `KpiCard`, `PIE_COLORS`, `SECTOR_WATER_INTENSITY`, `Section`, `SortHeader`, `TabBar`, `WATER_RISK_BY_COUNTRY`, `WATER_STRESS_TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CDP_WATER_TIERS` | `{ A: 'Leadership', 'A-': 'Leadership', B: 'Management', 'B-': 'Management', C: 'Awareness', 'C-': 'Awareness', D: 'Disclosure', 'D-': 'Disclosure', F:` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `intensityFactor` | `sInt.withdrawal_ml_per_mn / 2500;` |
| `waterRisk` | `Math.min(5, cRisk.overall * 0.6 + intensityFactor * 2 + s * 0.5);` |
| `waterIntensity` | `Math.round(sInt.withdrawal_ml_per_mn * (0.7 + s * 0.6));` |
| `revenueAtRisk` | `Math.round(sInt.water_dependent_revenue_pct * (company.weight \|\| 0.01) * 100);` |
| `cdpOptions` | `['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'F', 'F', 'F'];` |
| `cdpScore` | `cdpOptions[Math.floor(s * cdpOptions.length)];` |
| `avgRisk` | `scoredHoldings.length ? Math.round(scoredHoldings.reduce((s, h) => s + h.waterRisk, 0) / scoredHoldings.length * 10) / 10 : 0;` |
| `highStressPct` | `scoredHoldings.length ? Math.round((highStress / scoredHoldings.length) * 100) : 0;` |
| `totalWithdrawal` | `scoredHoldings.reduce((s, h) => s + h.waterIntensity, 0);` |
| `avgIntensity` | `scoredHoldings.length ? Math.round(totalWithdrawal / scoredHoldings.length) : 0;` |
| `extremeCountries` | `[...new Set(scoredHoldings.filter(h => h.countryRisk?.overall >= 3.8).map(h => h.country))].length;` |
| `droughtPct` | `scoredHoldings.length ? Math.round((droughtExposed / scoredHoldings.length) * 100) : 0;` |
| `floodPct` | `scoredHoldings.length ? Math.round((floodExposed / scoredHoldings.length) * 100) : 0;` |
| `avgWaterDepRev` | `scoredHoldings.length ? Math.round(scoredHoldings.reduce((s, h) => s + h.sectorIntensity.water_dependent_revenue_pct, 0) / scoredHoldings.length) : 0;` |
| `cats` | `{ 'Extremely High': 0, 'High': 0, 'Medium-High': 0, 'Medium': 0, 'Low-Medium': 0, 'Low': 0 };` |
| `multiplier` | `pricingIncrease / 100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIE_COLORS`, `WATER_STRESS_TREND`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| High Stress Threshold | — | Aqueduct | Withdrawal vs renewable freshwater supply ratio |
| Extremely High Stress | — | Aqueduct | Locations at highest competition for water resources |
| MENA/South Asia Concentration | — | Aqueduct | Proportion of high-stress assets in these regions |
- **Operational site geolocation** → Aqueduct watershed overlay → **Site-level water stress score**
- **Revenue by geography** → Stress-weighted calculation → **Water-at-risk revenue exposure**
- **CDP water data** → Stewardship assessment → **Corporate water rating**

## 5 · Intermediate Transformation Logic
**Methodology:** WRI Aqueduct water risk framework
**Headline formula:** `WaterRisk = Baseline_stress × Interannual_variability × Seasonal_variability × Drought_severity`
**Standards:** ['WRI Aqueduct 4.0', 'CDP Water Security', 'AWS Alliance for Water Stewardship']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).