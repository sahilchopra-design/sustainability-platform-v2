# Regenerative Agriculture
**Module ID:** `regenerative-agriculture` · **Route:** `/regenerative-agriculture` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies soil carbon sequestration, biodiversity uplift, and water quality improvements from regenerative farming practices aligned to Verra VM0042 and SBTi FLAG.

> **Business value:** Provides the quantification infrastructure for regenerative agriculture carbon and biodiversity credit generation, aligned to Verra and SBTi FLAG standards.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CARBON_REGISTRIES`, `CERT_TYPES`, `COUNTRIES`, `CROP_TYPES`, `Card`, `KPI`, `MRV_METHODS`, `OPS`, `PRACTICES`, `Pill`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CROP_TYPES` | `['Wheat','Corn/Maize','Soybeans','Rice','Cotton','Coffee','Cocoa','Palm Oil','Sugarcane','Barley'];` |
| `MRV_METHODS` | `['Remote Sensing + Soil Sampling','Soil Core Lab Analysis','Eddy Covariance Flux Tower','Biogeochemical Modelling (DNDC)','Practice-Based Default Fact` |
| `crop` | `CROP_TYPES[Math.floor(s1*CROP_TYPES.length)];` |
| `country` | `COUNTRIES[Math.floor(s2*COUNTRIES.length)];` |
| `hectares` | `Math.floor(s3*4500+50);` |
| `adoptedPractices` | `PRACTICES.filter((_,pi)=>sr(i*37+pi*7)>0.45);` |
| `soilCarbon` | `+(1.2+s4*3.8).toFixed(2);` |
| `annualSeq` | `+(0.3+s5*2.7).toFixed(2);` |
| `yieldImpact` | `+(-5+s6*25).toFixed(1);` |
| `inputCostChange` | `+(-30+s7*15).toFixed(1);` |
| `certifications` | `CERT_TYPES.filter((_,ci)=>sr(i*41+ci*11)>0.65);` |
| `creditRevenue` | `Math.floor(s8*120+10);` |
| `adoptionYear` | `2018+Math.floor(sr(i*43+17)*7);` |
| `soilOrgMatter` | `+(1.5+sr(i*47+19)*4.5).toFixed(1);` |
| `waterRetention` | `Math.floor(20+sr(i*53+21)*60);` |
| `biodivScore` | `Math.floor(30+sr(i*59+23)*70);` |
| `mrvMethod` | `MRV_METHODS[Math.floor(sr(i*61+25)*MRV_METHODS.length)];` |
| `registry` | `CARBON_REGISTRIES[Math.floor(sr(i*67+27)*CARBON_REGISTRIES.length)];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_REGISTRIES`, `CERT_TYPES`, `COLORS`, `COUNTRIES`, `CROP_TYPES`, `MRV_METHODS`, `PRACTICES`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg SOC Change (tCO₂e/ha/yr) | — | Soil Sampling Programme | Mean annual soil carbon accumulation rate across enrolled regenerative agriculture parcels. |
| Biodiversity Score Uplift | — | LIFE Biodiversity Index | Improvement in field-level biodiversity index score after regenerative practice adoption (3-year avg). |
| Water Quality Improvement (%) | — | Catchment Monitoring | Reduction in nitrate runoff from enrolled fields versus conventional control parcels. |
- **Soil sample data + satellite land cover + practice records** → SOC stock change calculation; biodiversity scoring; water quality modelling → **Carbon sequestration certificates and co-benefit impact report**

## 5 · Intermediate Transformation Logic
**Methodology:** Soil Carbon Stock Change
**Headline formula:** `ΔSOC = (SOC_t1 – SOC_t0) × BD × d × (44/12)`
**Standards:** ['IPCC 2006 GL Vol. 4 Agriculture', 'Verra VM0042']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).