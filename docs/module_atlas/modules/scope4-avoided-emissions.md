# Scope 4 Avoided Emissions
**Module ID:** `scope4-avoided-emissions` · **Route:** `/scope4-avoided-emissions` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scope 4 and enabled emissions quantification measuring emission reductions achieved by products and services compared to a defined baseline scenario.

> **Business value:** Quantifies the positive climate contribution of products and services beyond the corporate operational boundary.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BASELINES`, `Badge`, `CATEGORIES`, `CATEGORY_DATA`, `COMPANIES`, `CRITERIA`, `Card`, `METHODOLOGIES`, `Metric`, `QUARTERS`, `SECTORS`, `TABS`, `TIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CATEGORIES` | `['Renewable Energy','EVs','Plant-Based Food','Insulation','LED Lighting','Teleconferencing','Recycling Tech','Water Purification','Precision Agricultu` |
| `METHODOLOGIES` | `['WRI/WBCSD Avoided Emissions','ICF Comparative Assessment','Project Frame Protocol','GHG Protocol Scope 4','ISO 14064-2 Project','Gold Standard Metho` |
| `CRITERIA` | `['Baseline Transparency','Additionality','Conservative Assumptions','Third-Party Verification','No Double-Counting','Temporal Boundaries','Geographic ` |
| `QUARTERS` | `Array.from({length:12},(_,i)=>{const y=2022+Math.floor(i/4);const q=i%4+1;return `Q${q} ${y}`;});` |
| `sector` | `SECTORS[Math.floor(s*SECTORS.length)];` |
| `category` | `CATEGORIES[Math.floor(s2*CATEGORIES.length)];` |
| `emitted` | `0.5+s3*12;` |
| `avoidedRaw` | `0.2+s4*18;` |
| `ratio` | `avoidedRaw/emitted;` |
| `quarterData` | `QUARTERS.map((_,qi)=>{const base=avoidedRaw*(0.6+sr(i*53+qi*11)*0.8);return parseFloat(base.toFixed(3));});` |
| `CATEGORY_DATA` | `CATEGORIES.map((cat,ci)=>{` |
| `totalAvoided` | `companies.reduce((a,c)=>a+c.avoided,0);` |
| `avgPerUnit` | `parseFloat((sr(ci*97)*2.5+0.1).toFixed(3));` |
| `base` | `totalAvoided*(0.3+yi*0.06+sr(ci*101+yi*7)*0.15);` |
| `grossAvoided` | `useMemo(()=>parseFloat(((unitsSold*(baselineEF-productEF))/1e6).toFixed(4)),[unitsSold,baselineEF,productEF]);` |
| `netAvoided` | `useMemo(()=>parseFloat((grossAvoided*(attribution/100)*(1-rebound/100)).toFixed(4)),[grossAvoided,attribution,rebound]);` |
| `avoidedToEmitted` | `useMemo(()=>{const e=COMPANIES[selCompany].emitted;return e>0?parseFloat((netAvoided/e).toFixed(2)):0;},[netAvoided,selCompany]);` |
| `portPageData` | `useMemo(()=>filteredPortfolio.slice(portPage*25,(portPage+1)*25),[filteredPortfolio,portPage]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BASELINES`, `CATEGORIES`, `CRITERIA`, `DONUT_COLORS`, `METHODOLOGIES`, `SECTORS`, `TABS`, `TIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Products Assessed | — | Product register | Number of products or services with completed avoided emission assessments. |
| Total Avoided | — | Calculated | Aggregate avoided emissions across all assessed products in the reporting year. |
| Avoided-to-Footprint Ratio | — | Calculated | Ratio of total avoided emissions to company operational (Scope 1+2) footprint. |
- **Product lifecycle data, baseline scenario parameters, emission factors** → LCA calculation, baseline comparison, sensitivity analysis → **Avoided emission reports, ratio analytics, scenario comparisons**

## 5 · Intermediate Transformation Logic
**Methodology:** Avoided Emissions
**Headline formula:** `Baseline Scenario Emissions – Product/Service Lifecycle Emissions`
**Standards:** ['WRI Scope 4 Guidance', 'GHG Protocol']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).