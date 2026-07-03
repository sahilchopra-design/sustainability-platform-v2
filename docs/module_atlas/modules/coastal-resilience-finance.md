# Coastal Resilience Project Finance
**Module ID:** `coastal-resilience-finance` · **Route:** `/coastal-resilience-finance` · **Tier:** B (frontend-computed) · **EP code:** DY/DZ · **Sprint:** DY

## 1 · Overview
Coastal resilience project finance analytics covering seawall, living shoreline, and mangrove buffer investments. Models benefit-cost ratios from avoided storm damage, insurance premium reductions, ecosystem service valuation, and FEMA BRIC grant eligibility.

> **Business value:** Provides comprehensive coastal resilience project finance analytics combining FEMA-methodology avoided loss quantification, nature-based solutions performance data, and insurance market co-benefit valuation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `FINANCE_INSTRUMENTS`, `Kpi`, `PROTECTION_MEASURES`, `SLR_SCENARIOS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pvBenefit` | `lifeYrs > 0 && discountRate > 0 ? annBenefit * (1 - Math.pow(1 + discountRate / 100, -lifeYrs)) / (discountRate / 100) : annBenefit * lifeYrs;` |
| `pvBenefit` | `lifeYrs > 0 && discountRate > 0 ? annBenefit * (1 - Math.pow(1 + discountRate / 100, -lifeYrs)) / (discountRate / 100) : annBenefit * lifeYrs;` |
| `totalProtected` | `CITIES.reduce((s, c) => s + c.protectedValue, 0);` |
| `totalInvested` | `CITIES.reduce((s, c) => s + c.investedGbn, 0);` |
| `avgBcr` | `CITIES.length > 0 ? CITIES.reduce((s, c) => s + c.bcrAvg, 0) / CITIES.length : 0;` |
| `strandedfraction` | `Math.min(0.95, c.floodRisk / 100 * (1 + c.slrM2050));` |
| `strandedValue` | `c.protectedValue * strandedfraction * 0.3;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `FINANCE_INSTRUMENTS`, `PROTECTION_MEASURES`, `SLR_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Coastal Resilience BCR | `(Avoided damage PV + insurance reduction + ecosystem services) / CAPEX` | FEMA BCA and Swiss Re model | Coastal resilience BCR typically 3-8x; living shorelines often higher than grey infrastructure due to co-benef |
| Annual Expected Loss Reduction | `AAL without resilience project - AAL with project (expected annual loss from storm events)` | RMS North Atlantic hurricane model | Primary benefit driver; depends on coastal exposure value, hazard intensity, and project attenuation performan |
| Mangrove Storm Attenuation | `Wave height reduction per 100m mangrove belt width` | IUCN / Nature Conservancy coastal protection research | Mangroves reduce wave height 50-70% over 500m; direct analogue to 30-50cm seawall at fraction of cost |
- **RMS / AIR North Atlantic storm surge models** → Probabilistic hazard intensity and damage functions by location → AAL baseline and reduction → **Avoided damage benefit calculation**
- **NOAA coastal bathymetry and asset exposure data** → Coastal topography and asset values → flood inundation modelling → **Physical risk quantification**
- **Swiss Re / Munich Re coastal resilience insurance data** → Premium reduction evidence from coastal protection investments → insurance co-benefit value → **Total BCR including insurance component**

## 5 · Intermediate Transformation Logic
**Methodology:** Coastal Resilience Benefit-Cost Analysis
**Headline formula:** `BCR = (Avoided Storm Damage + Insurance Reduction + Ecosystem Services) / (CAPEX + OPEX); Annual Expected Loss Reduction = AAL(without) - AAL(with)`
**Standards:** ['FEMA Benefit-Cost Analysis Reference Guide 2023', 'NOAA Coastal Resilience Investment Framework', 'Nature-based Solutions for Coastal Resilience — Swiss Re Institute 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).