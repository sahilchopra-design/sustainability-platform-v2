# Systemic ESG Risk
**Module ID:** `systemic-esg-risk` · **Route:** `/systemic-esg-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analytics platform assessing ESG factors as drivers of systemic financial risk; identifies ESG-linked vulnerabilities that could generate correlated losses across institutions and markets.

> **Business value:** Correlated ESG risk is an emerging macroprudential concern; the ESRB has identified climate-related correlated losses as a potential source of systemic financial instability analogous to pre-2008 credit concentration.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CATEGORIES`, `CONTAGION`, `INDICATORS`, `KPI`, `PAGE_SIZE`, `TABS`, `TIPPING_POINTS`, `TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#991b1b';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(2):v:v;` |
| `TREND` | `Array.from({length:36},(_,i)=>({month:`${2022+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,systemicIdx:Math.round(35+i*0.5+sr(i*7)*15),conta` |
| `TIPPING_POINTS` | `[{name:'AMOC Collapse',threshold:'4C warming',proximity:42,impact:'Catastrophic',reversible:false},{name:'Amazon Dieback',threshold:'3-4C / 40% loss',` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const avg=(k)=>Math.round(INDICATORS.reduce((s,c)=>s+c[k],0)/INDICATORS.length);const critical=INDICATORS.filter(c=>c.systemicScore>70).l` |
| `catChart` | `useMemo(()=>{const m={};INDICATORS.forEach(c=>{if(!m[c.category])m[c.category]={category:c.category,avg:0,n:0};m[c.category].avg+=c.systemicScore;m[c.` |
| `catDist` | `useMemo(()=>{const m={};INDICATORS.forEach(c=>{m[c.category]=(m[c.category]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]` |
| `radarData` | `useMemo(()=>{const dims=['severity','probability','velocity','interconnection','contagionRisk','financialImpact'];const avg=(k)=>Math.round(INDICATORS` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `CONTAGION`, `TABS`, `TIPPING_POINTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Systemic ESG Score | — | SERS Model | Current system-wide ESG risk score; scores above 70 indicate elevated contagion potential. |
| Governance Risk Premium | — | Spread Analysis | Additional credit spread attributable to systemic governance deficiencies across rated issuers. |
| Correlated ESG Events (YTD) | — | Event Database | Simultaneous ESG-driven market dislocations affecting multiple institutions in the same quarter. |
- **Institution-Level ESG Scores, Market Data, Balance Sheet Linkages** → Correlation analysis + systemic risk modelling + SERS computation → **Systemic ESG risk dashboard, macroprudential risk reports, supervisory submissions**

## 5 · Intermediate Transformation Logic
**Methodology:** Systemic ESG Risk Score
**Headline formula:** `SERS = Eₘₐ⸡ × wₑ + Sₘₐ⸡ × wₛ + Gₘₐ⸡ × wᵍ`
**Standards:** ['FSB ESG Data Report 2023', 'IOSCO ESG Ratings Report 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).