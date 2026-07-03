# Land Use & Deforestation
**Module ID:** `land-use-deforestation` · **Route:** `/land-use-deforestation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Satellite-based deforestation monitoring and commodity-linked deforestation risk analysis, supporting compliance with the EU Deforestation Regulation (EUDR) and financial sector due diligence under TNFD and financial institution frameworks. Tracks forest cover loss by commodity supply chain, country, and operator using Global Forest Watch and Copernicus data. Assesses portfolio exposure to deforestation-linked commodities at counterparty level.

> **Business value:** Enables financial institutions and commodity traders to fulfil EUDR due diligence obligations and TNFD nature disclosure requirements by providing satellite-backed, counterparty-level deforestation risk assessment with audit trail.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COMMODITIES`, `COUNTRIES`, `KPI`, `PAGE_SIZE`, `REGIONS`, `RISK`, `TABS`, `TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#15803d';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `_FAO_MAP_LUD` | `Object.fromEntries(FAO_FOREST_AREA_2020.map(d => [d.country, d]));` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,alerts:Math.round(5000+sr(i*7)*15000),deforest:Ma` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const totalDeforest=COUNTRIES.reduce((s,c)=>s+c.deforestationKha,0);const totalAlerts=COUNTRIES.reduce((s,c)=>s+c.alertsMonth,0);const av` |
| `regionChart` | `useMemo(()=>{const m={};COUNTRIES.forEach(c=>{if(!m[c.region])m[c.region]={region:c.region,deforest:0,n:0};m[c.region].deforest+=c.deforestationKha;m[` |
| `riskDist` | `useMemo(()=>{const m={};COUNTRIES.forEach(c=>{m[c.riskRating]=(m[c.riskRating]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));}` |
| `radarData` | `useMemo(()=>{const dims=['eudrRisk','traceability','governance','enforcement','protectedArea','commodityExposure'];const avg=(k)=>Math.round(COUNTRIES` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMMODITIES`, `REGIONS`, `RISK`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Forest Cover Loss (ha/yr) | — | Hansen/GFW annual tree cover loss alerts | Annual deforested area within commodity supply-shed of the assessed operator |
| Commodity Deforestation Linkage (%) | — | Trase / Global Forest Watch Pro | Share of forest loss attributable to the specific commodity in the supply-shed |
| EUDR High-Risk Flag | — | EU EUDR country benchmarking | Country classification under EUDR Article 29 benchmarking system |
| Zero-Deforestation Commitment Coverage (%) | — | Supply Change / Forest 500 | Proportion of traded volume covered by credible zero-deforestation commitments |
- **Hansen / GFW tree cover loss rasters (annual)** → Clip to commodity supply-shed polygons; compute ha lost per operator per year → **Annual deforestation alert area by operator and commodity**
- **EUDR country benchmarking list** → Match sourcing countries to high/standard/low classification; flag high-risk operators → **EUDR compliance status and enhanced due diligence trigger list**
- **Trase commodity flow data** → Link operator production volumes to forest loss area via supply-shed attribution → **Commodity-level deforestation linkage proportion per operator**

## 5 · Intermediate Transformation Logic
**Methodology:** Deforestation Risk Score
**Headline formula:** `DRSᵢ = ForestLossᵢ × CommodityLinkᵢ × JurisdictionRiskᵢ`
**Standards:** ['EU Deforestation Regulation (EUDR) 2023/1115', 'GFW Pro Deforestation Risk Methodology', 'TNFD LEAP Approach 2023', 'Trase Supply Chain Transparency Platform']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).