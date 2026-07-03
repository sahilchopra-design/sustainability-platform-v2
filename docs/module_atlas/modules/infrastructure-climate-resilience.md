# Infrastructure Climate Resilience
**Module ID:** `infrastructure-climate-resilience` · **Route:** `/infrastructure-climate-resilience` · **Tier:** B (frontend-computed) · **EP code:** EP-DE4 · **Sprint:** DE

## 1 · Overview
Quantifies climate physical risk to infrastructure assets (transport, energy, water, telecoms) using engineering vulnerability curves and IPCC SSP scenarios. Calculates resilience investment NPV, adaptation cost-benefit ratios, and regulatory compliance gaps.

> **Business value:** Required for infrastructure fund managers (EU Taxonomy Annex II), project finance lenders (Equator Principles EP4), and government asset managers. Quantifies resilience investment economics, satisfies TCFD physical risk disclosure, and unlocks green/climate bond labelling for adaptation investments.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ASSETS`, `ASSET_TYPES`, `Card`, `HAZARDS`, `KpiCard`, `REGIONS`, `SCENARIOS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['UK','Western Europe','North America','Asia-Pacific','Middle East','Emerging Markets'];` |
| `SCENARIOS` | `['Orderly 1.5°C','Disorderly 2°C','Hot House 3°C+'];` |
| `type` | `ASSET_TYPES[Math.floor(sr(i*7)  * ASSET_TYPES.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*11) * REGIONS.length)];` |
| `assetVal` | `parseFloat((10 + sr(i*3) * 490).toFixed(1));  // £M` |
| `age` | `Math.round(5 + sr(i*5) * 55);                   // years` |
| `flood` | `parseFloat((sr(i*13)*100).toFixed(1));` |
| `heat` | `parseFloat((sr(i*17)*100).toFixed(1));` |
| `storm` | `parseFloat((sr(i*19)*100).toFixed(1));` |
| `slr` | `parseFloat((sr(i*23)*100).toFixed(1));` |
| `drought` | `parseFloat((sr(i*29)*100).toFixed(1));` |
| `hazard` | `parseFloat((flood*0.28+heat*0.22+storm*0.22+slr*0.18+drought*0.10).toFixed(1));` |
| `adaptCap` | `parseFloat((20 + sr(i*31)*70 - age*0.4).toFixed(1));` |
| `adaptCapClamped` | `Math.max(5, Math.min(95, adaptCap));` |
| `resilience` | `parseFloat(Math.max(0, 100 - hazard * (1 - adaptCapClamped/100)).toFixed(1));` |
| `loss15` | `parseFloat((hazard * 0.0008 + sr(i*37)*0.012).toFixed(4));` |
| `loss20` | `parseFloat((hazard * 0.0018 + sr(i*41)*0.020).toFixed(4));` |
| `loss30` | `parseFloat((hazard * 0.0035 + sr(i*43)*0.035).toFixed(4));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_TYPES`, `HAZARDS`, `REGIONS`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Infrastructure EAL | — | World Bank LIFELINES 2019 | Annual expected losses from natural hazards to infrastructure globally — rises to $600Bn/yr under 2°C |
| Adaptation Benefit-Cost Ratio | — | UNEP Adaptation Gap Report 2023 | Every $1 invested in infrastructure climate adaptation delivers $4–9 in avoided losses |
| Service Disruption Multiplier | — | World Bank LIFELINES 2019 | Infrastructure service disruptions cause 3–10× more economic damage than direct asset damage |
- **Asset register with GPS coordinates + engineering specs** → Hazard overlay + fragility curves → **Asset-level EAL, disruption probability, resilience score**
- **Adaptation intervention catalogue** → NPV/BCR calculation → **Ranked adaptation investments by cost-effectiveness**
- **EU Taxonomy Annex II screening criteria** → Compliance mapping → **DNSH assessment and adaptation substantial contribution score**

## 5 · Intermediate Transformation Logic
**Methodology:** Infrastructure Resilience Score / Adaptation NPV
**Headline formula:** `ResilienceScore = Σ [w_i × (1 - VulnScore_i × HazardFreq_i)]; AdaptNPV = Σ [ΔEALt / (1+r)^t] - CapexAdapt`
**Standards:** ['IPCC AR6 WGII Chapter 17', 'G20 IGWG Infrastructure Resilience Framework', 'World Bank LIFELINES Report 2019', 'EU Taxonomy Annex II — Climate Change Adaptation']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `BuiltEnvironmentAdvancedAnalytics`