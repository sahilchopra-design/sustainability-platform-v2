# Workplace Health & Safety
**Module ID:** `workplace-health-safety` · **Route:** `/workplace-health-safety` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
WHS incident analytics platform tracking LTIFR, TRIR, fatality rates and near-miss incidents with benchmarking against sector peers and GRI 403 regulatory reporting.

> **Business value:** Globally 2.3 million workers die annually from work-related causes (ILO); companies with mature safety cultures outperform peers financially by 3–5% on total shareholder return (MSCI Safety Study 2022).

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `BENCHMARKS`, `COMPANIES`, `INCIDENT_TYPES`, `KPI`, `PAGE_SIZE`, `RATINGS`, `REGIONS`, `SECTORS`, `TABS`, `TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#ea580c';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(2):v:v;` |
| `INCIDENT_TYPES` | `[{type:'Slips/Falls',count:245,pct:22},{type:'Struck By Object',count:198,pct:18},{type:'Overexertion',count:165,pct:15},{type:'Equipment Contact',cou` |
| `TREND` | `Array.from({length:36},(_,i)=>({month:`${2022+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,avgLtir:+(2.5-i*0.03+sr(i*7)*0.5).toFixed(2),avgT` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const avgN=(k)=>+(COMPANIES.reduce((s,c)=>s+c[k],0)/ Math.max(1, COMPANIES.length)).toFixed(2);const totalFat=COMPANIES.reduce((s,c)=>s+c` |
| `sectorChart` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,avgLtir:0,avgTrir:0,n:0};m[c.sector].avgLtir+=c.ltir;m[c.se` |
| `ratingDist` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{m[c.safetyRating]=(m[c.safetyRating]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}` |
| `radarData` | `useMemo(()=>{const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/ Math.max(1, COMPANIES.length));return[{dim:'Safety Score',value:avg('safetyS` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BENCHMARKS`, `INCIDENT_TYPES`, `RATINGS`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LTIFR | — | Incident Register | Lost time injury frequency rate per million hours worked; sector median 2.4 (manufacturing). |
| TRIR | — | Incident Register | Total recordable incident rate per million hours; includes injuries requiring medical treatment beyond first a |
| Fatalities (YTD) | — | Incident Register | Year-to-date workplace fatalities; zero is the universal target; any fatality triggers mandatory investigation |
- **Safety Management System Incident Data, HR Hours Worked, Near-Miss Reports** → LTIFR/TRIR computation + benchmarking + root cause analytics → **Safety performance dashboard, GRI 403 disclosures, ESRS S1 reporting, regulatory filings**

## 5 · Intermediate Transformation Logic
**Methodology:** Lost Time Injury Frequency Rate
**Headline formula:** `LTIFR = (Lost Time Injuries × 1,000,000) / Hours Worked`
**Standards:** ['GRI 403: Occupational Health and Safety 2018', 'ILO R194 Safety and Health']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).