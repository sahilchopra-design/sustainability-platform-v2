# Real Estate Climate Risk
**Module ID:** `real-estate-climate-risk` · **Route:** `/real-estate-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DE2 · **Sprint:** DE

## 1 · Overview
Assesses physical climate hazards (flood, wildfire, heat, subsidence) at property level using geocoded exposure data and IPCC SSP scenarios. Calculates expected annual loss (EAL), insurance affordability cliff, and mortgage default probability uplift.

> **Business value:** Essential for mortgage lenders (ECB Guide on Climate Risk), property valuers (RICS PS1), insurers setting flood premiums, and real estate fund managers under SFDR Article 8/9. Provides property-level EAL to price climate risk into lending margins and asset valuations.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ASSETS`, `Card`, `KpiCard`, `NGFS`, `REGIONS`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `NGFS` | `['Orderly 1.5°C','Disorderly 2°C','Hot House 3°C+'];` |
| `type` | `TYPES[Math.floor(sr(i*7)  * TYPES.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*11) * REGIONS.length)];` |
| `value` | `parseFloat((5 + sr(i*3) * 245).toFixed(1));` |
| `flood` | `parseFloat((sr(i*13)*100).toFixed(1));` |
| `heat` | `parseFloat((sr(i*17)*100).toFixed(1));` |
| `storm` | `parseFloat((sr(i*19)*100).toFixed(1));` |
| `wildfire` | `parseFloat((sr(i*23)*100).toFixed(1));` |
| `coastal` | `parseFloat((sr(i*29)*100).toFixed(1));` |
| `composite` | `parseFloat((flood*0.30+heat*0.25+storm*0.20+wildfire*0.10+coastal*0.15).toFixed(1));` |
| `varOrd` | `parseFloat((composite*0.0012 + sr(i*31)*0.015).toFixed(4));` |
| `varDis` | `parseFloat((composite*0.0025 + sr(i*33)*0.025).toFixed(4));` |
| `varHot` | `parseFloat((composite*0.0050 + sr(i*37)*0.040).toFixed(4));` |
| `spread` | `Math.round(10 + composite*0.8 + sr(i*41)*50);` |
| `adaptCx` | `parseFloat((value*(composite/100)*0.08 + sr(i*43)*0.5).toFixed(2));` |
| `avgComp` | `n ? (filtered.reduce((s,a)=>s+a.composite,0)/n).toFixed(1) : '0';` |
| `totalVal` | `filtered.reduce((s,a)=>s+a.value,0).toFixed(0);` |
| `totalVaR` | `filtered.reduce((s,a)=>s+a.value*a[vk],0).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NGFS`, `REGIONS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EAL (Flood, 1.5°C) | — | IPCC AR6 + JRC EU Floods Directive | Expected annual flood loss as % of property value — doubles under RCP8.5 by 2050 |
| Insurance Coverage Gap | — | Swiss Re Sigma 2023 | Share of climate-exposed residential properties uninsured or underinsured globally |
| Mortgage Default Uplift | — | ECB Working Paper 2022 | Climate-risk exposure adds 18–34 bps to mortgage default probability in high-hazard zones |
- **Property addresses + valuations** → Geocoding + hazard overlay → **Per-property hazard scores by SSP/year**
- **Catastrophe model loss curves** → EAL integration → **Portfolio EAL, tail risk (TVaR99), insurance premium estimate**
- **Mortgage loan tape** → Default probability overlay → **Loan-level PD uplift and LTV stress under 2050 scenarios**

## 5 · Intermediate Transformation Logic
**Methodology:** Expected Annual Loss (EAL)
**Headline formula:** `EAL = Σ [P(hazard_i) × Damage_i × AssetValue]; InsuranceAffordabilityRatio = Premium / AnnualRent`
**Standards:** ['IPCC AR6 WGI Chapter 12', 'NGFS Physical Risk Framework', 'Flood Re Affordability Model', 'CoreLogic Climate Risk Analytics']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `BuiltEnvironmentAdvancedAnalytics`