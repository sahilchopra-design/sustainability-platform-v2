# Green Central Banking
**Module ID:** `green-central-banking` · **Route:** `/green-central-banking` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses central bank climate risk frameworks, NGFS membership analytics, green quantitative easing (QE) programme design, and climate-aligned collateral frameworks. Tracks progress of 130+ NGFS member central banks against climate-related financial risk supervisory expectations and green monetary policy tool adoption.

> **Business value:** Enables climate researchers and financial institutions to track the evolution of green monetary policy, assess central bank supervisory expectations for climate risk management, and anticipate collateral framework changes that may affect funding costs for green and brown asset classes.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CBS`, `KPI`, `PAGE_SIZE`, `QE_DATA`, `REGIONS`, `TABS`, `TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#059669';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `_BCR_MAP` | `Object.fromEntries(BANK_CAPITAL_RATIOS.map(b => [b.country, b]));` |
| `_CLE_MAP` | `Object.fromEntries(CLIMATE_LOAN_EXPOSURE.map(cl => [cl.country, cl]));` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,greenQeVol:Math.round(100+i*15+sr(i*7)*80),cbsAct` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const avg=(k)=>Math.round(CBS.reduce((s,c)=>s+c[k],0)/CBS.length);const ngfs=CBS.filter(c=>c.ngfsMemb==='Yes').length;const activeQe=CBS.` |
| `regChart` | `useMemo(()=>{const m={};CBS.forEach(c=>{if(!m[c.region])m[c.region]={region:c.region,avg:0,n:0};m[c.region].avg+=c.greenScore;m[c.region].n++;});retur` |
| `qeDist` | `useMemo(()=>{const m={};CBS.forEach(c=>{m[c.greenQe]=(m[c.greenQe]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);` |
| `radarData` | `useMemo(()=>{const dims=['greenScore','taxonomyAdoption','supervisoryExpect','macroprudential','reserveGreening','greenBondPurchase'];const avg=(k)=>M` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `QE_DATA`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NGFS Member Central Banks | — | NGFS membership register 2024 | Number of central banks and supervisors that have joined the Network for Greening the Financial System; covers |
| ECB Green Bond Share (% CSPP) | — | ECB CSPP portfolio disclosure | Share of ECB Corporate Sector Purchase Programme holdings in labelled green bonds; reflects post-2021 climate  |
| Eligible Green Collateral (%) | — | Central bank collateral frameworks | Proportion of eligible collateral universe meeting green criteria under expanded central bank collateral eligi |
| Climate Stress Test Coverage (%) | — | NGFS survey results 2023 | Share of NGFS member central banks that have conducted or are planning climate stress tests of the banking sys |
- **NGFS member commitment disclosures** → Classify by implementation tier (committed/implementing/advanced) → **NGFS progress dashboard by central bank**
- **Central bank asset purchase portfolio data** → Compute green share, compare to market benchmark → **Green QE tilting scores**
- **Collateral eligibility frameworks** → Extract green criteria, map to eligible bond universe → **Green collateral share by central bank**

## 5 · Intermediate Transformation Logic
**Methodology:** Green QE Tilting Score
**Headline formula:** `Tilt_score = (GreenShare_portfolio - GreenShare_market) / GreenShare_market × 100`
**Standards:** ['NGFS Recommendations for Central Banks (2021)', 'ECB Climate Action Plan (2021)', 'BIS Working Papers â€” Green QE']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).