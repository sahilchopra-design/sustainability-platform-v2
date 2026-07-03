# Critical Mineral Geopolitics
**Module ID:** `critical-mineral-geopolitics` · **Route:** `/critical-mineral-geopolitics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses supply chain concentration risk for critical transition minerals including lithium, cobalt, nickel, rare earth elements, and copper across extraction, processing, and refining stages. Computes geopolitical supply risk scores, chokepoint exposure, and portfolio vulnerability to supply disruption.

> **Business value:** Enables investment analysts and supply chain risk managers to identify portfolio exposure to critical mineral geopolitical risk, assess EU CRM Act compliance requirements, and evaluate supply chain diversification strategies for transition-critical materials.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `COMPANIES_80`, `COMP_NAMES_M`, `COUNTRIES_40`, `EXPORT_CONTROLS`, `FRIENDSHORING_POLICIES`, `MINERALS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COMP_NAMES_M` | `['Tesla Inc','BYD Auto','CATL','LG Energy','Samsung SDI','Panasonic','SK Innovation','Northvolt','SVOLT Energy','Gotion High-Tech',` |
| `mHHI` | `miningVals.reduce((a,v)=>a+v*v,0);` |
| `pHHI` | `processVals.reduce((a,v)=>a+v*v,0);` |
| `topMiner` | `Object.entries(m.mining).sort((a,b)=>b[1]-a[1])[0];` |
| `sectors` | `[...new Set(COMPANIES_80.map(c=>c.sector))];` |
| `pagedCompanies` | `filteredCompanies.slice(compPage*PAGE_SIZE,(compPage+1)*PAGE_SIZE);` |
| `totalPages` | `Math.ceil(filteredCompanies.length/PAGE_SIZE);` |
| `rows` | `filteredCompanies.map(c=>[c.name,c.sector,c.topMineral,c.concentrationRisk,c.chinaProcessingDep,c.diversificationScore,c.friendshoringReady,c.geoRiskS` |
| `blob` | `new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);` |
| `miningData` | `Object.entries(m.mining).map(([k,v])=>({country:k,pct:v})).sort((a,b)=>b.pct-a.pct);` |
| `processData` | `Object.entries(m.processing).map(([k,v])=>({country:k,pct:v})).sort((a,b)=>b.pct-a.pct);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COMPANIES_80`, `COMP_NAMES_M`, `COUNTRIES_40`, `EXPORT_CONTROLS`, `FRIENDSHORING_POLICIES`, `MINERALS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Lithium Production HHI | — | USGS Mineral Commodity Summaries | High concentration; Australia and Chile account for >80% of production |
| REE Processing Concentration | — | IEA Critical Minerals 2024 | China’s dominance of rare earth processing creates critical chokepoint risk |
| Portfolio Critical Mineral Exposure | — | Supply chain mapping | Proportion of portfolio companies with high exposure to critical mineral supply chain risk |
| Supply Disruption Probability (5yr) | — | Oxford Economics / IEA | Probability of >20% supply shock for cobalt or lithium within 5 years |
| EU CRM Act Strategic Stock Requirement | — | EU CRM Act 2024 | EU requirement for strategic stocks of critical raw materials to buffer supply disruptions |
- **USGS / BGS mineral production data** → Compute production HHI by country per mineral → **Production concentration score**
- **World Bank WGI governance scores** → Weight production share by governance risk index → **Geopolitical supply risk score per mineral**
- **Portfolio supply chain mapping** → Link company inputs to mineral supply, compute exposure → **Portfolio-level critical mineral exposure score**

## 5 · Intermediate Transformation Logic
**Methodology:** Geopolitical Supply Risk Index
**Headline formula:** `GSRI = Σ_i (HHI_i × Governance_Risk_i × Trade_Concentration_i) / n`
**Standards:** ['IEA Critical Minerals Report 2024', 'European Critical Raw Materials Act', 'EC Supply Chain Resilience Strategy']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).