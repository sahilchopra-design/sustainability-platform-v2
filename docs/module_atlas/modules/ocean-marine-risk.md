# Ocean & Marine Risk
**Module ID:** `ocean-marine-risk` · **Route:** `/ocean-marine-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies climate-driven ocean and marine risks including acidification, sea level rise, storm surge, and marine heatwaves for coastal assets, fisheries, and blue economy finance.

> **Business value:** Enables coastal asset owners, blue economy investors, and marine insurers to quantify and manage climate-driven ocean and marine risks using IPCC-aligned hazard science and financial impact modelling.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `TABS`, `ZONES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `healthIdx` | `Math.round(sr(i*7)*40+40);const sst=+(sr(i*11)*4+22).toFixed(1);const acidification=+(sr(i*13)*0.3+7.8).toFixed(2);const o2=+(sr(i*17)*3+4).toFixed(1)` |
| `fishStockPct` | `Math.round(sr(i*19)*50+30);const overfished=Math.round(sr(i*23)*40);const mpasPct=+(sr(i*29)*30+2).toFixed(1);const plasticDensity=Math.round(sr(i*31)` |
| `blueGDP` | `+(sr(i*37)*50+2).toFixed(1);const shippingRoutes=Math.round(sr(i*41)*200+10);const coralCoverage=Math.round(sr(i*43)*60);const mangroveKm2=Math.round(` |
| `yearly` | `Array.from({length:6},(_,y)=>({year:2019+y,health:Math.round(healthIdx-5+y*1.5+sr(i*100+y)*4),sst:+(sst+y*0.1+sr(i*100+y*3)*0.3).toFixed(1),plastic:Ma` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,avgHealth:Math.round(filtered.reduce((s,r)=>s+r.healthIndex,0)/filtered.length\|\|0),avgSST:(filtered.reduce((s,r)=>` |
| `oceanAgg` | `useMemo(()=>{const m={};ZONES.forEach(z=>{if(!m[z.ocean])m[z.ocean]={o:z.ocean,health:0,sst:0,fish:0,n:0};m[z.ocean].health+=z.healthIndex;m[z.ocean].` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='yearly');const csv=[keys.join(','),...data.map(r=>keys.m` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sea Level Rise by 2100 (SSP5-8.5) | — | IPCC AR6 WG1 2021 | Likely range of global mean sea level rise by 2100 under high-emission SSP5-8.5 scenario. |
| Ocean Acidification Change (pH, since 1850) | — | IPCC SROCC 2019 | Observed reduction in global average ocean pH since pre-industrial period, representing ~30% increase in hydro |
- **IPCC AR6 sea level projections, GEBCO bathymetry, CoSMO storm surge models, NOAA acidification data** → Hazard layer mapping, MCRI computation, damage cost estimation → **Coastal risk maps, asset MCRI scores, fisheries impact assessments**

## 5 · Intermediate Transformation Logic
**Methodology:** Marine Climate Risk Index
**Headline formula:** `MCRI = Σ (Hazardᵢ × Exposureᵢ × Sensitivityᵢ) / AdaptiveCapacity`
**Standards:** ['IPCC SROCC 2019', 'UNEP-WCMC Ocean Risk and Resilience Action Alliance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).