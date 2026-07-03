# Coastal Flood Risk Finance
**Module ID:** `coastal-flood-risk-finance` · **Route:** `/coastal-flood-risk-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DJ3 · **Sprint:** DJ

## 1 · Overview
Analyses financial exposure to coastal flooding driven by sea level rise and storm surge. Models property value impacts, insurance affordability cliffs, infrastructure reinvestment costs, and managed retreat economics using IPCC AR6 sea level rise scenarios and FEMA flood zone data.

> **Business value:** Critical for mortgage lenders in coastal markets (FDIC climate risk guidance), catastrophe reinsurers pricing SLR risk, municipal bond investors in coastal cities, and infrastructure funds. Provides forward-looking climate EAL beyond historical flood maps.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CITIES`, `CITY_NAMES`, `KpiCard`, `REGIONS`, `RISK_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `score` | `(stormSurge + flood) / 2;` |
| `stormSurge` | `+(1 + sr(i * 7) * 9).toFixed(1);` |
| `floodFreq` | `Math.round(1 + sr(i * 5) * 19);` |
| `exposed` | `+(5 + sr(i * 3) * 245).toFixed(1);` |
| `adapt` | `+(1 + sr(i * 17) * 29).toFixed(1);` |
| `slr` | `Math.round(10 + sr(i * 11) * 70);` |
| `stormRisk` | `+(1 + sr(i * 13) * 9).toFixed(1);` |
| `totalExposed` | `filtered.reduce((a, c) => a + c.exposedAssets, 0).toFixed(1);` |
| `totalPop` | `filtered.reduce((a, c) => a + c.populationAtRisk, 0).toFixed(1);` |
| `totalAdapt` | `filtered.reduce((a, c) => a + c.adaptationCost, 0).toFixed(1);` |
| `exposedByCity` | `[...filtered].sort((a, b) => b.exposedAssets - a.exposedAssets).slice(0, 15).map(c => ({` |
| `slrVsAdapt` | `filtered.map(c => ({` |
| `popByRegion` | `REGIONS.map(r => ({` |
| `insuranceGap` | `[...filtered].sort((a, b) => a.insurancePenetration - b.insurancePenetration).slice(0, 15).map(c => ({` |
| `stormData` | `filtered.slice(0, 15).map(c => ({` |
| `nbsData` | `filtered.slice(0, 20).map(c => ({` |
| `adjustedExposure` | `filtered.slice(0, 15).map(c => ({` |
| `avgSlr` | `cities.length ? (cities.reduce((a, c) => a + c.seaLevelRise2050, 0) / cities.length).toFixed(0) : '—';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITY_NAMES`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sea Level Rise by 2100 (SSP5-8.5) | — | IPCC AR6 WGI Chapter 9 | Median SLR projection under high emissions — low-likelihood high-impact scenario up to 2m |
| Coastal Property at Risk | — | First Street Foundation 2023 | US residential property value at significant flood risk by 2050 — triple 2020 exposure |
| Insurance Withdrawal Rate | — | First Street/Swiss Re 2023 | Flood insurance premium increases of 35%+ in high coastal risk zones — triggering affordability cliff |
- **Coastal LiDAR elevation data + SLR projections** → Inundation modelling → **Annual inundation probability by parcel under SLR scenarios**
- **Property valuations + building footprints** → EAL calculation → **Property-level expected annual loss from coastal flooding**
- **Insurance premium data + withdrawal trends** → Affordability analysis → **Insurance gap and affordability cliff year by coastal zone**

## 5 · Intermediate Transformation Logic
**Methodology:** Coastal Flood EAL
**Headline formula:** `EAL_coastal = Σ [P(SLR_t + Surge_i) × DamageFunction(inundation_depth) × AssetValue × ExposureShare]; InsurabilityCliff = Year where Premium > 1% of property value`
**Standards:** ['IPCC AR6 WGI Chapter 9 — Ocean, Cryosphere and Sea Level', 'NOAA Technical Report OAR CPO-1 (2022)', 'EU Floods Directive 2007/60/EC', 'Swiss Re Coastal Flood Risk Report 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).