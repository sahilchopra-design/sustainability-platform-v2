# Product Anatomy
**Module ID:** `product-anatomy` · **Route:** `/product-anatomy` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Breaks down product-level climate and ESG impact by material, manufacturing process, use phase, and end-of-life, aligned to LCA methodology.

> **Business value:** Enables product teams and sustainability managers to identify emission hotspots and optimise product design for carbon reduction compliance with ISO 14067.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CARBON_EXTERNALITY_PER_KG`, `Card`, `ESG_COLORS`, `KPI`, `LS_CUSTOM`, `LS_PORT`, `MAT_COLORS`, `PRODUCT_ANATOMY`, `PRODUCT_KEYS`, `Section`, `WATER_EXTERNALITY_PER_L`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtUSD` | `n=>{if(n==null)return'\u2014';if(n>=1e9)return`$${(n/1e9).toFixed(1)}B`;if(n>=1e6)return`$${(n/1e6).toFixed(1)}M`;if(n>=1000)return`$${(n/1000).toFixe` |
| `fmtG` | `n=>{if(n==null)return'\u2014';if(n>=1e6)return`${(n/1e6).toFixed(1)} t`;if(n>=1000)return`${(n/1000).toFixed(1)} kg`;return`${Number(n).toFixed(0)} g`` |
| `fmtL` | `n=>{if(n==null)return'\u2014';if(n>=1e6)return`${(n/1e6).toFixed(1)} ML`;if(n>=1000)return`${(n/1000).toFixed(1)} kL`;return`${Number(n).toFixed(0)} L` |
| `totalCost` | `withRisk.reduce((s, c) => s + (c.cost_usd \|\| 0), 0);` |
| `recyclablePct` | `comps.length ? Math.round(recyclableCount / comps.length * 100) : 0;` |
| `avgRecRate` | `comps.filter(c => c.recycling_rate).reduce((s, c) => s + c.recycling_rate, 0) / (comps.filter(c => c.recycling_rate).length \|\| 1) * 100;` |
| `anatomyData` | `useMemo(()=>comps.filter(c=>(viewMode==='weight'?c.quantity_g:c.cost_usd)>0).map((c,i)=>({...c,value:viewMode==='weight'?c.quantity_g:c.cost_usd,fill:` |
| `raw` | `comps.filter(c=>c.cost_usd>0).sort((a,b)=>b.cost_usd-a.cost_usd);` |
| `cum` | `0;return raw.map(c=>{const start=cum;cum+=c.cost_usd;return{name:c.material.slice(0,12),cost:c.cost_usd,start,fill:MAT_COLORS[raw.indexOf(c)%MAT_COLOR` |
| `esgPie` | `useMemo(()=>comps.filter(c=>c.esg_risk).map((c,i)=>({name:c.material,value:c.esg_risk,fill:MAT_COLORS[i%MAT_COLORS.length]})),[comps]);` |
| `carbonBars` | `useMemo(()=>comps.filter(c=>c.carbon_g>0).sort((a,b)=>b.carbon_g-a.carbon_g).map(c=>({name:c.material.slice(0,14),carbon:c.carbon_g})),[comps]);` |
| `waterBars` | `useMemo(()=>comps.filter(c=>c.water_l>0).sort((a,b)=>b.water_l-a.water_l).map(c=>({name:c.material.slice(0,14),water:c.water_l})),[comps]);` |
| `csv` | `[hdr,...rows].map(r=>r.join(',')).join('\n');` |
| `total` | `anatomyData.reduce((s,x)=>s+x.value,0);` |
| `pctW` | `Math.max(2,(c.value/total*100));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MAT_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total PCF (kgCO₂e/unit) | — | LCA Engine | Cradle-to-grave carbon footprint per unit of product output. |
| Hotspot Stage | — | Stage Attribution | Life cycle stage contributing largest share of total product carbon footprint. |
| Recycled Content (%) | — | Material Registry | Proportion of product material input from recycled or secondary sources. |
- **Bill of materials + process energy data + EF database** → Stage-level emission calculation; hotspot attribution; scenario modelling → **Product-level LCA carbon report and reduction roadmap**

## 5 · Intermediate Transformation Logic
**Methodology:** Product Carbon Footprint
**Headline formula:** `PCF = Σ(mᵢ × EFᵢ) across cradle-to-grave life cycle stages`
**Standards:** ['ISO 14067:2018', 'GHG Protocol Product Standard']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).