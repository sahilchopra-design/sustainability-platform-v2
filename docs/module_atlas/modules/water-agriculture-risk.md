# Water Agriculture Risk
**Module ID:** `water-agriculture-risk` · **Route:** `/water-agriculture-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Water stress impact on agricultural supply chains; quantifies crop yield risk, food price volatility and supply disruption from water scarcity across sourcing geographies using WRI Aqueduct Agricultural data.

> **Business value:** Water scarcity already reduces global crop yields by 7–14% annually; climate change will increase water-stressed agricultural area by 40% by 2050, with implications for food security and commodity price volatility.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AWS_LEVELS`, `Badge`, `COLORS`, `CROPS`, `Card`, `DROUGHT_SEVERITY`, `KPI`, `Pill`, `REGIONS`, `REGION_DATA`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Punjab, India','Murray-Darling, AU','Central Valley, US','Nile Delta, EG','North China Plain','Ogallala, US','Mekong Delta, VN','São Francisco, BR',` |
| `waterStress` | `+(1+s1*4).toFixed(2);` |
| `agWithdrawal` | `Math.floor(40+s2*50);` |
| `irrigEfficiency` | `Math.floor(30+s3*55);` |
| `groundwaterDepletion` | `+(0+s4*8).toFixed(1);` |
| `annualRainfall` | `Math.floor(100+s5*1400);` |
| `irrigArea` | `Math.floor(5000+s6*95000);` |
| `primaryCrop` | `CROPS[Math.floor(sr(i*29+13)*CROPS.length)];` |
| `secondaryCrop` | `CROPS[Math.floor(sr(i*31+15)*CROPS.length)];` |
| `awsCert` | `AWS_LEVELS[Math.floor(sr(i*37+17)*AWS_LEVELS.length)];` |
| `droughtFreq` | `+(0.5+sr(i*41+19)*3.5).toFixed(1);` |
| `cropWaterBlue` | `Math.floor(200+sr(i*43+21)*1800);` |
| `cropWaterGreen` | `Math.floor(500+sr(i*47+23)*3500);` |
| `cropWaterGrey` | `Math.floor(50+sr(i*53+25)*450);` |
| `yieldRisk` | `Math.floor(5+sr(i*59+27)*45);` |
| `revenueAtRisk` | `Math.floor(10+sr(i*61+29)*200);` |
| `waterPrice` | `+(0.1+sr(i*67+31)*2.5).toFixed(2);` |
| `reductionTarget` | `Math.floor(10+sr(i*71+33)*30);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AWS_LEVELS`, `COLORS`, `CROPS`, `DROUGHT_SEVERITY`, `REGIONS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| High Water Stress Sourcing | — | WRI Aqueduct | Proportion of agricultural sourcing from basins with WRI Aqueduct score >3 (High or Extremely High stress). |
| Yield Loss Exposure | — | IPCC AR6 WG2 | Expected average crop yield reduction in sourcing basins under 2°C warming scenario by 2030. |
| Supply Disruption VaR | — | AWRS Model | Value at risk from agricultural supply disruption due to water stress at 95th percentile. |
- **Sourcing Geographies, WRI Aqueduct Data, Crop Yield Models, FAO AQUASTAT** → AWRS engine + yield impact modelling + supply disruption VaR → **Agricultural water risk dashboard, TNFD water disclosures, supply chain resilience report**

## 5 · Intermediate Transformation Logic
**Methodology:** Agricultural Water Risk Score
**Headline formula:** `AWRS = Water Stress × Crop Sensitivity × Sourcing Concentration`
**Standards:** ['WRI Aqueduct Agriculture 2022', 'FAO AQUASTAT']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).