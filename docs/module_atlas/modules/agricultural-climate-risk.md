# Agricultural Climate Risk
**Module ID:** `agricultural-climate-risk` · **Route:** `/agricultural-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DG1 · **Sprint:** DG

## 1 · Overview
Quantifies climate physical risks to agricultural assets and supply chains using crop yield models, water stress indices, and extreme weather event databases. Calculates farm-level Expected Annual Loss (EAL), crop insurance adequacy gaps, and agricultural lender portfolio exposure.

> **Business value:** Essential for agricultural lenders, crop insurers, food companies with Scope 3 supply chain exposure, and sovereign risk managers in food-dependent economies. Provides TCFD physical risk metrics for agricultural portfolios and supports TNFD nature-related disclosure for land-use intensive sectors.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ADAPT_MEASURES`, `CROPS`, `CROP_SCI`, `Card`, `HAZARDS`, `Kpi`, `NAMES`, `PORTFOLIO`, `REGIONS`, `SCENARIOS`, `SCEN_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt0` | `v => Number(v).toLocaleString('en-GB', { maximumFractionDigits: 0 });` |
| `REGIONS` | `['South Asia','Sub-Saharan Africa','Latin America','East Asia','Europe','North America','MENA','Oceania'];` |
| `yieldByScenario` | `useMemo(() => CROPS.map(crop => {` |
| `yieldTrajectory` | `useMemo(() => [2025,2030,2040,2050,2060,2080].map((yr, i) => ({` |
| `hazardMatrix` | `useMemo(() => REGIONS.map((reg, ri) => {` |
| `stressData` | `useMemo(() => SCENARIOS.map((sc, si) => ({` |
| `avg` | `+(PORTFOLIO.reduce((s,a) => s+a[key], 0)/PORTFOLIO.length).toFixed(1);` |
| `comp` | `Math.round(a.physRisk*0.6 + a.transitionRisk*0.4);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADAPT_MEASURES`, `CROPS`, `HAZARDS`, `NAMES`, `REGIONS`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Crop Yield Loss by 2050 | — | IPCC AR6 WGII Chapter 5 | Average global crop yield losses per decade under RCP4.5 — accelerates under RCP8.5 |
| Agricultural Water Stress | — | WRI AQUEDUCT 2023 | Agriculture uses 70% of global freshwater — water stress is primary climate risk for irrigated crops |
| Crop Insurance Protection Gap | — | Swiss Re Sigma Agricultural 2023 | Only 35% of global agricultural climate losses are covered by insurance |
- **Farm-level GIS data (crop type, area, yield history)** → EAL calculation → **Crop-level expected annual loss by hazard**
- **AQUEDUCT water stress scores by basin** → Water risk assessment → **Irrigated agriculture water availability risk under 2030/2050**
- **Crop price indices + insurance product data** → Insurance gap analysis → **Uninsured climate loss exposure by crop and region**

## 5 · Intermediate Transformation Logic
**Methodology:** Agricultural Climate EAL
**Headline formula:** `EAL_crop = Σ [P(event_i) × YieldLoss_i × Price_i × Area_i]; DroughtExposure = AIR × WaterStressScore`
**Standards:** ['IPCC AR6 WGII Chapter 5 — Food, Fibre and Other Ecosystem Products', 'FAO GAEZ v4 Crop Modelling', 'World Resources Institute AQUEDUCT 3.0', 'NGFS Scenarios Agricultural Sector']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).