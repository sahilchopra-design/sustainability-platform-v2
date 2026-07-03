# Anti-Corruption Analytics
**Module ID:** `anti-corruption` · **Route:** `/anti-corruption` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Bribery and corruption risk scoring for portfolio companies and sovereign counterparties using Transparency International CPI, World Bank CPIA governance indicators, and UNGC Principle 10 alignment. Tracks corruption-related controversies, enforcement actions, and FCPA/UK Bribery Act exposure. Scores companies on anti-bribery management system maturity against ISO 37001.

> **Business value:** Corruption risk is a material ESG concern for institutional investors due to legal liability under FCPA and UK Bribery Act, reputational contagion, and the correlation between high corruption environments and governance failures that precede value destruction. CRI scoring enables systematic portfolio screening and targeted engagement with high-risk holdings.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COMPANIES`, `COUNTRIES`, `ENFORCEMENT`, `KPI`, `PAGE_SIZE`, `PIECLRS`, `REGIONS`, `RISK_LEVELS`, `SECTORS`, `TABS`, `TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `ENFORCEMENT` | `(()=>{const cases=[{company:'Airbus SE',law:'Sapin II / FCPA',jurisdiction:'France/US/UK',fine:4000,dpa:'DPA',year:2020,sector:'Aerospace'},{company:'` |
| `TREND` | `Array.from({length:36},(_,i)=>({month:`${2022+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,actions:Math.round(12+sr(i*7)*25),fines:Math.roun` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);` |
| `cPaged` | `cFiltered.slice((cPage-1)*PAGE_SIZE,cPage*PAGE_SIZE);` |
| `ePaged` | `eFiltered.slice((ePage-1)*PAGE_SIZE,ePage*PAGE_SIZE);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `cTotalPages` | `Math.ceil(cFiltered.length/PAGE_SIZE);` |
| `eTotalPages` | `Math.ceil(eFiltered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length);const critical=COMPANIES.filter(c=>c.riskRating==='Critical` |
| `sectorChart` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,count:0,avgRisk:0};m[c.sector].count++;m[c.sector].avgRisk+` |
| `riskDist` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{m[c.riskRating]=(m[c.riskRating]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));}` |
| `regionChart` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.region])m[c.region]={region:c.region,count:0,avgRisk:0,avgFcpa:0};m[c.region].count++;m[c.region` |
| `radarData` | `useMemo(()=>{const dims=['fcpaCompliance','ukBriberyAct','trainingRate','dueDialCoverage','controlEffectiveness','thirdPartyRisk'];const avg=(k)=>Math` |
| `fineByYear` | `useMemo(()=>{const m={};ENFORCEMENT.forEach(c=>{const y=c.year;if(!m[y])m[y]={year:y,total:0,count:0};m[y].total+=c.fine;m[y].count++;});return Object` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIECLRS`, `REGIONS`, `RISK_LEVELS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Transparency International CPI | — | TI CPI 2024 | Perceived corruption score; 0=highly corrupt, 100=very clean. Below 50 = elevated risk |
| FCPA Enforcement Fine | — | DOJ/SEC enforcement database | Average FCPA settlement for portfolio sector; proxy for enforcement intensity |
| ABMS Maturity Score | `ISO 37001 readiness` | Company disclosure | Anti-bribery management system readiness across 10 ISO 37001 controls |
- **TI CPI and World Bank CPIA data** → Normalise and weight into CRI; map to portfolio country exposure → **Per-company CRI score with country and controversy decomposition**
- **DOJ/SEC enforcement database + news feeds** → NER extracts company enforcement actions; normalise by revenue → **Enforcement score component and live controversy alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** CPI-weighted corruption risk composite
**Headline formula:** `CRI = 0.40×(100–CPI_score) + 0.30×Controversy_score + 0.20×Enforcement_score + 0.10×ABMS_maturity`
**Standards:** ['UNGC Principle 10', 'ISO 37001:2016 ABMS', 'FCPA/UK Bribery Act']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).