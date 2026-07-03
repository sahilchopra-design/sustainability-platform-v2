# Land Use Carbon Analytics
**Module ID:** `land-use-carbon` · **Route:** `/land-use-carbon` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Implements IPCC 2006 LULUCF accounting methodologies to quantify carbon stocks and fluxes from land use change, forestry, agriculture, and wetland restoration activities. Supports Article 6 land sector credit origination, REDD+ programme monitoring, and Scope 3 Category 1 land-use emissions attribution for agricultural commodity supply chains. Integrates satellite-derived biomass estimates with national forest inventories.

> **Business value:** Provides forest developers, agri-commodity traders, and land sector financiers with IPCC-consistent carbon accounting tools for REDD+ project development, supply chain deforestation attribution, and voluntary carbon market credit origination.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `COUNTRIES`, `Card`, `IPCC_TIERS`, `KPI`, `LAND_COLORS`, `LAND_TYPES`, `METHODOLOGIES`, `NBS_TYPES`, `PARCELS`, `Pill`, `TABS`, `VINTAGES`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `METHODOLOGIES` | `['VCS VM0007','VCS VM0042','Gold Standard AR','CDM AR-AM','Puro.earth Biochar','ACR Improved Forest','Plan Vivo','REDD+ Jurisdictional'];` |
| `landType` | `LAND_TYPES[Math.floor(s1*LAND_TYPES.length)];` |
| `country` | `COUNTRIES[Math.floor(s2*COUNTRIES.length)];` |
| `area` | `Math.floor(50+s3*9950);` |
| `carbonStock` | `landType==='Forest'?Math.floor(150+s4*350):landType==='Peatland'?Math.floor(500+s4*1500):landType==='Mangrove'?Math.floor(300+s4*700):landType==='Wetl` |
| `annualFlux` | `landType==='Forest'\|\|landType==='Mangrove'\|\|landType==='Wetland'?+(2+s5*8).toFixed(1):landType==='Peatland'?+(s5>0.4?3+s5*5:-2-s5*8).toFixed(1):landTy` |
| `priorLandUse` | `LAND_TYPES[Math.floor(sr(i*29+13)*LAND_TYPES.length)];` |
| `conversionYear` | `2000+Math.floor(sr(i*31+15)*25);` |
| `conversionEmissions` | `priorLandUse!==landType?Math.floor(50+sr(i*37+17)*500):0;` |
| `ipccTier` | `IPCC_TIERS[Math.floor(sr(i*41+19)*IPCC_TIERS.length)];` |
| `methodology` | `METHODOLOGIES[Math.floor(sr(i*43+21)*METHODOLOGIES.length)];` |
| `vintage` | `VINTAGES[Math.floor(sr(i*47+23)*VINTAGES.length)];` |
| `verified` | `sr(i*53+25)>0.35;` |
| `creditPrice` | `Math.floor(8+sr(i*59+27)*52);` |
| `eligibleArea` | `Math.floor(area*(0.3+sr(i*61+29)*0.6));` |
| `annualCredits` | `Math.floor(eligibleArea*annualFlux*0.7);` |
| `permanenceBuffer` | `Math.floor(10+sr(i*67+31)*20);` |
| `leakageDeduction` | `Math.floor(5+sr(i*71+33)*15);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COUNTRIES`, `IPCC_TIERS`, `LAND_COLORS`, `LAND_TYPES`, `METHODOLOGIES`, `NBS_TYPES`, `TABS`, `VINTAGES`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Above-Ground Biomass Density (tC/ha) | — | ESA CCI Biomass / national forest inventory | Carbon stock in live above-ground tree biomass per hectare of forest land |
| Soil Organic Carbon (tC/ha) | — | ISRIC SoilGrids / IPCC default tables | Carbon stored in mineral and organic soils to 30 cm depth |
| Annual Net Flux (MtCO2e/yr) | — | IPCC LULUCF accounts / satellite change detection | Net land sector emission or removal in the analysis area per year |
| Permanence Buffer (% of credits) | — | Verra buffer pool methodology | Proportion of earned credits held in risk buffer account against reversal events |
- **ESA CCI / Copernicus satellite biomass products** → Mosaic to analysis boundary; validate against field plots; apply uncertainty envelope → **Spatially explicit biomass density map in tC/ha**
- **National forest inventory databases** → Extract species-specific allometric equations; compute per-plot biomass and extrapolate → **Tier 2 biomass expansion factors by land use category and region**
- **Land use change detection layers** → Apply transition matrices to compute area converted per land use class pair per year → **Annual land use change area matrix for LULUCF flux calculation**

## 5 · Intermediate Transformation Logic
**Methodology:** LULUCF Carbon Stock Change
**Headline formula:** `ΔC = (Cₜ − Cₜ₋₁) × CF× 44/12`
**Standards:** ['IPCC 2006 Guidelines Vol. 4 Agriculture, Forestry and Other Land Use', 'UNFCCC REDD+ Warsaw Framework', 'Verra VM0007 REDD+ Methodology', 'GHG Protocol Land Sector & Removals Guidance 2022']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).