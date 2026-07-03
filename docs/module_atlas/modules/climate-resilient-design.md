# Climate Resilient Design
**Module ID:** `climate-resilient-design` · **Route:** `/climate-resilient-design` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies physical climate adaptation options for infrastructure and real estate assets, scoring resilience measures by cost-benefit, hazard reduction, and asset life extension.

> **Business value:** Helps infrastructure owners, real estate investors, and lenders optimise adaptation investment decisions using rigorous cost-benefit analysis grounded in climate hazard science.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `HAZARDS`, `HAZARD_COLORS`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Office','Retail','Residential','Industrial','Logistics','Mixed-Use'];` |
| `type` | `TYPES[Math.floor(s*6)];const city=CITIES[Math.floor(s2*CITIES.length)];` |
| `area` | `Math.floor(1000+s3*48000);const value=Math.floor(area*(type==='Office'?4500:type==='Retail'?3200:type==='Residential'?5500:2000)*(0.8+s4*0.4));` |
| `yearBuilt` | `Math.floor(1960+s5*63);` |
| `hazards` | `HAZARDS.map((h,j)=>{const score=Math.floor(10+sr(i*31+j*7)*90);return{hazard:h,score,rating:score>70?'Critical':score>50?'High':score>30?'Medium':'Low` |
| `composite` | `Math.floor(hazards.reduce((sum,h)=>sum+h.score,0)/hazards.length);` |
| `resilience` | `Math.floor(100-composite*(0.6+s6*0.4));` |
| `costOfInaction` | `Math.floor(value*(composite/100)*0.15);` |
| `uhiEffect` | `+(1.5+sr(i*37)*4.5).toFixed(1);` |
| `coolingDemand` | `Math.floor(20+uhiEffect*15+s*30);` |
| `adaptationBudget` | `Math.floor(value*0.02*(0.5+s4));` |
| `insurancePremium` | `Math.floor(value*0.003*(1+composite/100));` |
| `adaptedInsurance` | `Math.floor(insurancePremium*(0.6+resilience/100*0.3));` |
| `floodProjection` | `Array.from({length:8},(_,i)=>({decade:`${2020+i*10}s`,zone3b:Math.floor(buildings.filter(b=>b.floodZone==='Zone 3b').length*(1+i*0.15)),zone3a:Math.fl` |
| `heatProjection` | `Array.from({length:8},(_,i)=>({decade:`${2020+i*10}s`,avgUHI:+(2.5+i*0.4).toFixed(1),maxTemp:+(35+i*1.2).toFixed(1),coolingDays:Math.floor(30+i*8),coo` |
| `avgComposite` | `useMemo(()=>Math.floor(filtered.reduce((s,b)=>s+b.composite,0)/(filtered.length\|\|1)),[filtered]);` |
| `totalCostInaction` | `useMemo(()=>filtered.reduce((s,b)=>s+b.costOfInaction,0),[filtered]);` |
| `avgResilience` | `useMemo(()=>Math.floor(filtered.reduce((s,b)=>s+b.resilience,0)/(filtered.length\|\|1)),[filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `HAZARDS`, `HAZARD_COLORS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Average ABCR for Flood Adaptation | — | UNEP Adaptation Gap Report 2023 | Benefit-cost range for flood resilience measures in urban infrastructure documented in global literature. |
| Asset Life Extension from Adaptation | — | IPCC AR6 WG2 Chapter 17 | Estimated additional asset service life from implementing appropriate physical resilience upgrades. |
- **Asset coordinates, engineering specifications, hazard return-period maps, adaptation cost databases** → Hazard linkage, residual risk modelling, NPV and ABCR calculation → **Adaptation option rankings, ABCR heat maps, resilience certification inputs**

## 5 · Intermediate Transformation Logic
**Methodology:** Adaptation Benefit-Cost Ratio
**Headline formula:** `ABCR = NPV(Risk Reduction) / AdaptationCapEx`
**Standards:** ['GCRF Economics of Adaptation', 'World Bank Adaptation Cost Tool']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).