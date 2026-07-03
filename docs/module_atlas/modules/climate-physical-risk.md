# Climate Physical Risk Assessment
**Module ID:** `climate-physical-risk` · **Route:** `/climate-physical-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Comprehensive physical climate risk assessment covering acute hazards (flood, TC, wildfire) and chronic stressors (heat, SLR, drought) with NatCat loss estimation and TCFD alignment.

> **Business value:** Physical climate risk quantification underpins insurance adequacy, capital planning, TCFD/ISSB disclosure, and climate-adjusted asset valuation. This module provides the actuarial-grade loss modelling needed for credible physical risk disclosure and management.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `PERIL`, `TABS`, `TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TREND` | `Array.from({length:10},(_,i)=>({year:2025+i*3,rcp26Loss:+(1.5+i*0.2+sr(i*7)*0.3).toFixed(1),rcp45Loss:+(2+i*0.5+sr(i*11)*0.4).toFixed(1),rcp85Loss:+(2` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `stats` | `useMemo(()=>({count:filtered.length,avgRisk:(filtered.reduce((s,r)=>s+r.compositeRisk,0)/filtered.length\|\|0).toFixed(0),critical:filtered.filter(r=>r.` |
| `riskDist` | `useMemo(()=>{const order=['Critical','High','Elevated','Moderate','Low'];const m={};filtered.forEach(r=>{m[r.riskLevel]=(m[r.riskLevel]\|\|0)+1;});retur` |
| `sectorRisk` | `useMemo(()=>{const m={};ASSETS.forEach(r=>{if(!m[r.sector])m[r.sector]={s:r.sector,risk:0,n:0};m[r.sector].risk+=r.compositeRisk;m[r.sector].n++;});re` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PERIL`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Perils Covered | — | Model | Flood, TC, wildfire, storm surge, drought, heat, SLR, hail |
| Return Periods | — | Loss curve | Loss at 10, 20, 50, 100, 200, 500-year frequency |
| AAL | — | Model output | Annual average loss as % of asset value |
- **Asset geolocation** → Hazard map overlay → **Exposure score per asset**
- **Hazard intensity data** → Damage function → **Loss fraction per event**
- **Loss distribution** → Return period integration → **Annual average loss**

## 5 · Intermediate Transformation Logic
**Methodology:** Hazard-exposure-vulnerability framework
**Headline formula:** `PhysRisk = Hazard × Exposure × Vulnerability; Loss = PhysRisk × AssetValue × DamageFn`
**Standards:** ['IPCC AR6 WGI', 'IPCC AR6 WGII', 'Swiss Re CResta']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).