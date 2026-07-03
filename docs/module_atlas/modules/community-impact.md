# Community Impact Analytics
**Module ID:** `community-impact` · **Route:** `/community-impact` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Measures social value creation from corporate community investment programmes using the S1000+ framework, Social Return on Investment methodology, and UN SDG contribution mapping. Quantifies community investment ROI in monetary social value terms and benchmarks performance against industry peers.

> **Business value:** Enables ESG and community affairs teams to demonstrate the quantified social value of community programmes, meet growing investor expectations for social impact reporting, and contribute to GRI 413 community engagement disclosures and UN SDG bond frameworks.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `KPI`, `PAGE_SIZE`, `PIECLRS`, `PROJECTS`, `REGIONS`, `STATUSES`, `TABS`, `TREND`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `REGIONS` | `['All','Sub-Saharan Africa','Southeast Asia','Latin America','South Asia','Central Asia','Pacific Islands','Middle East','Eastern Europe'];` |
| `regs` | `['Sub-Saharan Africa','Southeast Asia','Latin America','South Asia','Latin America','Pacific Islands','Central Asia','Latin America','Sub-Saharan Afri` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,grievances:Math.round(40+sr(i*7)*60),resolved:Mat` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const avg=(k)=>Math.round(PROJECTS.reduce((s,c)=>s+c[k],0)/PROJECTS.length);const totalInv=PROJECTS.reduce((s,c)=>s+c.investmentM,0);cons` |
| `typeDist` | `useMemo(()=>{const m={};PROJECTS.forEach(c=>{m[c.type]=(m[c.type]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);` |
| `regionChart` | `useMemo(()=>{const m={};PROJECTS.forEach(c=>{if(!m[c.region])m[c.region]={region:c.region,avgFpic:0,avgBen:0,n:0};m[c.region].avgFpic+=c.fpicScore;m[c` |
| `radarData` | `useMemo(()=>{const dims=['fpicScore','benefitSharing','grievanceMech','stakeholderEng','livelihoodRestore','culturalHeritage'];const avg=(k)=>Math.rou` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIECLRS`, `REGIONS`, `STATUSES`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SROI Ratio | — | SROI Network | Social value generated per unit of monetary investment; >3× is considered high-performing |
| Total Social Value | — | HACT Social Value Bank | Monetised present value of all community outcomes attributed to the investment programme |
| SDG Coverage | — | UN SDG Impact Standards | Number of Sustainable Development Goals materially contributed to by the programme |
| Community Investment Rate | — | BITC / LBG Model | Community investment as a percentage of pre-tax profit or revenue, per LBG benchmarks |
| Attribution Adjusted Value | — | SROI Methodology | Net social value after deadweight, attribution, displacement, and drop-off adjustments |
- **Programme spend and activity records** → Map to S1000+ input categories, compute per-beneficiary cost → **Investment input by domain**
- **Beneficiary outcome surveys** → Apply HACT financial proxies, compute gross social value → **Gross social value per outcome**
- **Deadweight/attribution benchmarks** → Apply SROI adjustments to gross value → **Net present social value and SROI ratio**

## 5 · Intermediate Transformation Logic
**Methodology:** Social Return on Investment (SROI)
**Headline formula:** `SROI = Total Social Value (£) / Total Investment (£)`
**Standards:** ['S1000+ Standard', 'SROI Network Guide', 'UN SDG Impact Standards']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).