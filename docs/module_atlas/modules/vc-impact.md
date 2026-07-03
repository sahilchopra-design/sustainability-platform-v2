# VC Impact
**Module ID:** `vc-impact` · **Route:** `/vc-impact` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Venture capital impact investment measurement and reporting platform; tracks impact KPIs across portfolio companies against IMP, IRIS+ and SDG frameworks with financial return attribution.

> **Business value:** Impact VC has grown from $2B to ≄18B AUM 2015–2023; GIIN reports median VC impact funds achieve 3.0× IMM while delivering competitive financial returns to conventional venture benchmarks.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `DATA`, `NAMES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))` |
| `paged` | `useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);const toggleSort=` |
| `kpis` | `useMemo(()=>{const d=filtered;if(!d.length)return{count:0,avgScore:0,avgCompl:0,avgConf:0,totalVol:0,highRisk:0};return{count:d.length,avgScore:d.redu` |
| `catDist` | `useMemo(()=>{const m={};filtered.forEach(r=>{m[r.category]=(m[r.category]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name:name.length>14?` |
| `riskDist` | `useMemo(()=>RISK_LEVELS.map(l=>({name:l,value:filtered.filter(r=>r.risk===l).length})),[filtered]);` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;return[{axis:'Env',value:avg('envScore')},{axi` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,score:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length\|\|1)})),[filtered]` |
| `sectorScore` | `useMemo(()=>{const m={};const c={};filtered.forEach(r=>{m[r.sector]=(m[r.sector]\|\|0)+r.score;c[r.sector]=(c[r.sector]\|\|0)+1;});return Object.entries(m` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `NAMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio IMM | — | IMM Engine | Average impact multiple of money across active VC impact portfolio; 2×+ considered impact-additive. |
| Companies with IRIS+ KPIs | — | IRIS+ Database | Proportion of portfolio companies with standardised IRIS+ impact metrics tracked quarterly. |
| SDG Contribution Score | — | SDG Mapping | Average SDG contribution score across portfolio; mapped to primary and secondary SDGs by sector. |
- **Portfolio Company Impact Data, IRIS+ Metrics, SDG Mapping, Financial Returns** → IMM computation + IRIS+ aggregation + SDG contribution scoring → **LP impact reports, IRIS+ dashboards, SDG contribution statements, IMP disclosures**

## 5 · Intermediate Transformation Logic
**Methodology:** Impact Multiple of Money
**Headline formula:** `IMM = Impact Value Created / Capital Invested`
**Standards:** ['IMP Five Dimensions', 'IRIS+ Metrics Catalogue']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).