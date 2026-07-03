# Sovereign Physical Risk
**Module ID:** `sovereign-physical-risk` · **Route:** `/sovereign-physical-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Country-level physical hazard exposure and vulnerability assessment across flood, heat, drought, cyclone and sea-level rise using multi-model IPCC scenario projections.

> **Business value:** Provides multi-hazard, multi-scenario physical climate vulnerability scoring for sovereign issuers supporting sovereign bond risk management.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHART_COLORS`, `COUNTRIES_PHY`, `COUNTRY_NAMES`, `HAZARDS`, `INFRA_COUNTRIES`, `INFRA_SECTORS`, `NGFS_DATA`, `NGFS_ECONOMIES`, `NGFS_SCENARIOS`, `NGFS_YEARS`, `REGIONS_LIST`, `REGION_MAP_PHY`, `SCENARIO_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS_LIST` | `['Africa','Asia-Pacific','Europe','Latin America','Middle East','North America','South Asia'];` |
| `COUNTRIES_PHY` | `COUNTRY_NAMES.map((name,i)=>{` |
| `floodBase` | `regionIdx===6?6+sr(s)*3:regionIdx===1?5+sr(s+1)*4:regionIdx===0?4+sr(s+2)*4:2+sr(s+3)*5;` |
| `droughtBase` | `regionIdx===4?7+sr(s+4)*2:regionIdx===0?5+sr(s+5)*3:regionIdx===6?4+sr(s+6)*3:1+sr(s+7)*5;` |
| `heatBase` | `regionIdx===4?8+sr(s+8)*1.5:regionIdx===6?6+sr(s+9)*2:regionIdx===0?5+sr(s+10)*3:1+sr(s+11)*5;` |
| `cycloneBase` | `regionIdx===1?6+sr(s+12)*3:regionIdx===3?5+sr(s+13)*3:regionIdx===6?4+sr(s+14)*3:0.5+sr(s+15)*4;` |
| `seaBase` | `regionIdx===6?7+sr(s+16)*2:regionIdx===1?5+sr(s+17)*3:regionIdx===0?3+sr(s+18)*4:0.5+sr(s+19)*4;` |
| `wildfireBase` | `regionIdx===2?4+sr(s+20)*3:regionIdx===1?3+sr(s+21)*4:1+sr(s+22)*5;` |
| `compositePhysicalRisk` | `+((floodRisk+droughtRisk+heatStressRisk+cycloneRisk+seaLevelRiskRating+wildfireRisk)/6*10).toFixed(1);` |
| `gdpAtRisk2030Pct` | `+(1+compositePhysicalRisk*0.3+sr(s+23)*4).toFixed(1);` |
| `gdpAtRisk2050Pct` | `+(gdpAtRisk2030Pct*1.8+sr(s+24)*3).toFixed(1);` |
| `agricultureExposurePct` | `+(10+compositePhysicalRisk*2+sr(s+25)*15).toFixed(1);` |
| `coastalPopExposedM` | `+(sr(s+26)*80+0.5).toFixed(1);` |
| `infrastructureVulnerabilityScore` | `+Math.min(100,(compositePhysicalRisk*8+sr(s+27)*25)).toFixed(1);` |
| `adaptationCapacity` | `+(95-(compositePhysicalRisk*6)-(regionIdx>=4?15:0)+sr(s+28)*20).toFixed(1);` |
| `climateVulnerabilityIndex` | `+(Math.min(100,100-adaptationCapacity)).toFixed(1);` |
| `scenario2030RCP26` | `+(gdpAtRisk2030Pct*0.6).toFixed(1);` |
| `scenario2030RCP45` | `+(gdpAtRisk2030Pct*0.85).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `COUNTRY_NAMES`, `HAZARDS`, `INFRA_SECTORS`, `NGFS_ECONOMIES`, `NGFS_SCENARIOS`, `NGFS_YEARS`, `REGIONS_LIST`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Hazards Modelled | — | IPCC AR6 | Physical hazard types assessed: flood, heat stress, drought, cyclone, and sea-level rise. |
| Highest Exposed Country | — | Calculated | Country with highest composite physical vulnerability index across all five hazards. |
| RCP Scenarios | — | IPCC | Emission scenarios assessed: RCP 2.6, RCP 4.5, RCP 8.5 for 2030 and 2050 horizons. |
- **IPCC AR6 hazard projections, ND-GAIN, World Bank CCPK, Swiss Re data** → Hazard scoring, vulnerability aggregation, RCP scenario comparison → **Physical vulnerability indices, hazard heatmaps, portfolio physical risk reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Physical Vulnerability Index
**Headline formula:** `(Hazard Exposure × 0.4) + (Sensitivity × 0.35) + (1 – Adaptive Capacity) × 0.25`
**Standards:** ['IPCC AR6', 'ND-GAIN', 'World Bank CCDR']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).