# Product Carbon Handprint
**Module ID:** `product-carbon-handprint` · **Route:** `/product-carbon-handprint` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies Scope 4 enabled emissions – positive climate impact delivered to customers and society through low-carbon product substitution.

> **Business value:** Provides the evidential basis for Scope 4 enabled emissions claims, supporting product-level positive impact disclosure and science-based green marketing.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `COMPANIES`, `CategoryBenchmarks`, `CustomTooltip`, `HandprintCalculator`, `IMPACT_CATS`, `ISO_CHECKLIST`, `LifecycleDeepDive`, `MATERIALS`, `MiniKPI`, `PRODUCTS`, `ReportingClaims`, `STAGES`, `STAGE_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `STAGES` | `['Raw Materials','Manufacturing','Distribution','Use Phase','End-of-Life','Recycling'];` |
| `IMPACT_CATS` | `['GWP','ODP','AP','EP-freshwater','EP-marine','EP-terrestrial','POCP','ADP-minerals','ADP-fossil','WDP','IRP','LU'];` |
| `stages` | `STAGES.map((_,si)=>{` |
| `totalFP` | `stages.reduce((a,v)=>a+v,0);` |
| `baselineMulti` | `1.2+sr(idx*19)*0.8;` |
| `baseline` | `+(totalFP*baselineMulti).toFixed(1);` |
| `handprint` | `+(baseline-totalFP).toFixed(1);` |
| `MATERIALS` | `['Steel','Aluminum','Copper','Plastic-ABS','Plastic-PP','Glass','Silicon','Rubber','Lithium','Concrete','Carbon Fiber','Titanium'];` |
| `badge` | `(c)=>({display:'inline-block',padding:'2px 10px',borderRadius:10,fontSize:11,fontWeight:600,background:c+'18',color:c});` |
| `getStages` | `(p)=>STAGES.map((_,i)=>{` |
| `totalA` | `stagesA.reduce((a,v)=>a+v,0);` |
| `handA` | `+((baseA-totalA)*af).toFixed(1);` |
| `totalB` | `comp?stagesB.reduce((a,v)=>a+v,0):0;` |
| `handB` | `comp?+((comp.baseline-totalB)*(attrSlider\|\|comp.attributionFactor)).toFixed(1):0;` |
| `waterfall` | `STAGES.map((name,i)=>({name:name.length>12?name.slice(0,12)+'..':name,value:stagesA[i],fill:STAGE_COLORS[i]}));` |
| `compBar` | `[{name:prod.name.slice(0,18),Footprint:+totalA.toFixed(1),Baseline:baseA,Handprint:handA>0?handA:0}];` |
| `stageContribPie` | `STAGES.map((st,i)=>({name:st,value:Math.abs(stagesA[i]),fill:STAGE_COLORS[i]}));` |
| `stages` | `STAGES.map((_,i)=>getVal(i));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `COMPANIES`, `IMPACT_CATS`, `ISO_CHECKLIST`, `MATERIALS`, `STAGES`, `STAGE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual Handprint (tCO₂e) | — | Handprint Engine | Total avoided emissions enabled by product sales in reporting year vs reference product baseline. |
| Handprint-to-Footprint Ratio | — | Lifecycle Engine | Ratio of enabled emission savings to product’s own lifecycle carbon footprint. |
| Reference Baseline | — | IEA Grid EF Database | Counterfactual product or system replaced by low-carbon product offering. |
- **Product EF + reference EF + sales data + use-phase assumptions** → Differential emission calculation; volume scaling; lifetime adjustment → **Handprint disclosure report and handprint-to-footprint ratio**

## 5 · Intermediate Transformation Logic
**Methodology:** Carbon Handprint
**Headline formula:** `HP = (EF_reference – EF_product) × units_sold × use_phase_factor`
**Standards:** ['World Resources Institute Scope 4 Guidance', 'SolarPower Europe Handprint Methodology']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).