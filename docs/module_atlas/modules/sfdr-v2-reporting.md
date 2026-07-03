# SFDR v2 Reporting
**Module ID:** `sfdr-v2-reporting` · **Route:** `/sfdr-v2-reporting` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Updated SFDR Level 2 RTS reporting covering all 18 mandatory and additional PAI indicators, product-level Article 8/9 disclosure templates, and sustainable investment substantiation.

> **Business value:** Implements the full SFDR Level 2 RTS reporting cycle for Article 8/9 products including PAI statements and sustainable investment substantiation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `FUNDS`, `PAI_INDICATORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `TABS` | `['PAI Dashboard','Fund Screening','Pre-contractual','Periodic Reports'];const CLASSF=['All','Article 6','Article 8','Article 8+','Article 9'];const PA` |
| `PAI_INDICATORS` | `['GHG Emissions','Carbon Footprint','GHG Intensity','Fossil Fuel Exposure','Non-Renewable Energy','Energy Intensity','Biodiversity Impact','Water Emis` |
| `cls` | `['Article 6','Article 8','Article 8','Article 8+','Article 9','Article 9','Article 8+','Article 8','Article 8','Article 8+','Article 8','Article 9','A` |
| `aumBn` | `+(sr(i*7)*50+0.5).toFixed(1);const paiScore=Math.round(sr(i*11)*40+50);const taxAligned=Math.round(sr(i*13)*60+10);const sustInvest=Math.round(sr(i*17` |
| `paiValues` | `PAI_INDICATORS.map(p=>({indicator:p,value:+(sr(i*100+PAI_INDICATORS.indexOf(p)*7)*100).toFixed(1),coverage:Math.round(sr(i*100+PAI_INDICATORS.indexOf(` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,totalAUM:'€'+filtered.reduce((s,r)=>s+r.aumBn,0).toFixed(0)+'B',avgPAI:Math.round(filtered.reduce((s,r)=>s+r.paiSc` |
| `clsDist` | `useMemo(()=>CLASSF.slice(1).map(c=>({name:c,value:FUNDS.filter(f=>f.classification===c).length,aum:+FUNDS.filter(f=>f.classification===c).reduce((s,f)` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='paiValues');const csv=[keys.join(','),...data.map(r=>key` |
| `submDate` | `f.reportStatus==='Published'?`${months[Math.floor(sr(f.id*53)*12)]} 2024`:null;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PAI_INDICATORS`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Article 8 Products | — | Fund register | Funds promoting ESG characteristics under SFDR Article 8 with active Level 2 disclosures. |
| Article 9 Products | — | Fund register | Funds with sustainable investment as their objective under SFDR Article 9. |
| Avg SI Ratio (Art.9) | — | SFDR engine | Mean sustainable investment proportion across Article 9 products in current reporting period. |
- **Fund holdings, ESG data, PAI indicator values, taxonomy alignment data** → Article classification, SI substantiation, DNSH assessment, PAI aggregation → **Product disclosure templates, PAI statements, regulatory filings**

## 5 · Intermediate Transformation Logic
**Methodology:** Sustainable Investment Ratio
**Headline formula:** `Sustainable Investment AUM ÷ Total Fund AUM × 100`
**Standards:** ['SFDR Art.2(17)', 'EU 2022/1288']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).