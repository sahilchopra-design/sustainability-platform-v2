# Food Supply Chain Emissions
**Module ID:** `food-supply-chain-emissions` · **Route:** `/food-supply-chain-emissions` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies agricultural GHG emissions across the food value chain with Scope 3 Category 1 granularity, enabling SBTi FLAG (Forest, Land and Agriculture) target setting and supplier engagement. Covers enteric fermentation, fertiliser application, land-use change, and post-farm processing emissions using commodity-specific emission factors.

> **Business value:** Supports food, beverage, and retail companies in setting science-based FLAG targets, prioritising supplier decarbonisation investments, and meeting CSRD ESRS E1/E4 land-use disclosure requirements. Provides the evidentiary basis for CDP forests questionnaire responses and TNFD nature disclosures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `COMPANIES`, `COUNTRIES`, `Card`, `EMISSION_STAGES`, `FLAG_SECTORS`, `FOOD_CATEGORIES`, `KPI`, `PROTEIN_SOURCES`, `Pill`, `STAGE_COLORS`, `TABS`, `WASTE_STAGES`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `EMISSION_STAGES` | `['Farm/Agriculture','Processing','Transport','Packaging','Retail','Consumer/Waste'];` |
| `WASTE_STAGES` | `['Farm','Post-Harvest','Processing','Distribution','Retail','Food Service','Household'];` |
| `category` | `FOOD_CATEGORIES[Math.floor(s1*FOOD_CATEGORIES.length)];` |
| `country` | `COUNTRIES[Math.floor(s2*COUNTRIES.length)];` |
| `revenue` | `+(0.5+s3*25).toFixed(1);` |
| `totalEmissions` | `Math.floor(200+s4*9800);` |
| `intensity` | `+(0.5+s5*8.5).toFixed(2);` |
| `stageBreakdown` | `EMISSION_STAGES.map((_,si)=>{const raw=sr(i*23+si*11);return si===0?Math.floor(raw*40+30):Math.floor(raw*20+5);});` |
| `stageTotal` | `stageBreakdown.reduce((a,v)=>a+v,0);` |
| `stageNorm` | `stageBreakdown.map(v=>Math.floor(v/stageTotal*100));` |
| `yearlyEmissions` | `YEARS.map((_,yi)=>Math.floor(totalEmissions*(1-yi*0.02+sr(i*29+yi*13)*0.05)));` |
| `scope3Cat1` | `Math.floor(totalEmissions*0.6+sr(i*31)*totalEmissions*0.2);` |
| `flagTarget` | `sr(i*37+11)>0.4;` |
| `flagProgress` | `flagTarget?Math.floor(sr(i*41+13)*60+10):0;` |
| `deforestationFree` | `sr(i*43+15)>0.5;` |
| `proteinIntensity` | `+(2+sr(i*47+17)*18).toFixed(1);` |
| `wasteRate` | `+(5+sr(i*53+19)*25).toFixed(1);` |
| `sbtiStatus` | `['Committed','Target Set','No Target','In Progress'][Math.floor(sr(i*59+21)*4)];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COUNTRIES`, `EMISSION_STAGES`, `FLAG_SECTORS`, `FOOD_CATEGORIES`, `PROTEIN_SOURCES`, `STAGE_COLORS`, `TABS`, `WASTE_STAGES`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| FLAG Intensity (tCO2e/$M revenue) | — | SBTi FLAG / IPCC AR6 | Commodity-weighted land-based emission intensity; food & beverage sector median is approximately 350 tCO2e/$M; |
| LUC Emissions Share (%) | — | Pendrill et al. 2022 | Proportion of total FLAG emissions attributable to land-use change; soy, palm, and beef supply chains typicall |
| Supplier Coverage (%) | — | Internal procurement data | Percentage of Tier 1 spend with supplier-reported emissions data; below 60% triggers modelled estimation using |
| SBTi FLAG Target Gap (tCO2e/yr) | — | SBTi FLAG tool | Annual absolute emissions reduction required to achieve the FLAG pathway by 2030 relative to base year. |
- **Procurement spend data by commodity and supplier** → Map to HS codes, assign IPCC Tier 2 EFs, apply LUC multipliers → **FLAG emissions by commodity and supplier**
- **Supplier sustainability questionnaires** → Validate against third-party deforestation databases (Global Forest Watch) → **Supplier data quality scores**
- **SBTi FLAG pathway benchmarks** → Compare portfolio FLAG intensity to sector pathway → **Annual target gap in absolute tCO2e**

## 5 · Intermediate Transformation Logic
**Methodology:** FLAG Emissions Intensity
**Headline formula:** `FLAG_intensity = Σ(commodity_i × EF_i × LUC_multiplier_i) / Revenue_USD`
**Standards:** ['SBTi FLAG Guidance v1.0', 'IPCC AR6 Agriculture Chapter', 'GHG Protocol Scope 3 Standard']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).