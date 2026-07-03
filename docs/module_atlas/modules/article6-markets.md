# Article 6 Markets
**Module ID:** `article6-markets` · **Route:** `/article6-markets` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Paris Agreement Article 6.2 bilateral trading and Article 6.4 supervisory mechanism analytics, covering ITMO issuance, corresponding adjustment accounting, host country authorisation tracking, and carbon market additionality assessment. Monitors NDC contribution accounting and safeguard compliance for traded mitigation outcomes.

> **Business value:** Article 6 markets represent the next frontier of carbon price discovery and cross-border climate finance, with billions of dollars of ITMOs expected to trade annually. Rigorous corresponding adjustment accounting is non-negotiable to prevent double-claiming between host and acquiring countries, and robust additionality verification protects carbon credit buyers from non-additional supply.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `AGREEMENTS`, `BUYERS`, `COLORS`, `ITMOS`, `SECTORS`, `SELLERS`, `STATUSES`, `TABS`, `VCM_BY_TYPE`, `VCM_REGISTRY_SHARE`, `VCM_TOTAL`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `buyer` | `BUYERS[Math.floor(sr(i*7)*BUYERS.length)];const seller=SELLERS[i%SELLERS.length];const sector=SECTORS[Math.floor(sr(i*11)*SECTORS.length)];` |
| `vol` | `Math.round(sr(i*19)*50+2);const price=+(sr(i*23)*30+5).toFixed(1);const coSdg=Math.round(sr(i*31)*8+1);` |
| `vintage` | `2022+Math.floor(sr(i*37)*4);const ca=sr(i*41)>0.4;` |
| `quarterly` | `Array.from({length:8},(_,q)=>({q:`Q${(q%4)+1} ${2023+Math.floor(q/4)}`,issued:Math.round(vol/8+sr(i*100+q)*3),transferred:Math.round(vol/10+sr(i*100+q` |
| `ITMOS` | `Array.from({length:60},(_,i)=>{const a=AGREEMENTS[i%30];return{id:i+1,serialNo:`ITMO-${2023+Math.floor(i/20)}-${String(i+1).padStart(4,'0')}`,buyer:a.` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,totalVol:filtered.reduce((s,r)=>s+r.volumeMt,0),totalVal:filtered.reduce((s,r)=>s+r.totalValueM,0).toFixed(0),avgP` |
| `sectorVol` | `useMemo(()=>{const m={};AGREEMENTS.forEach(r=>{m[r.sector]=(m[r.sector]\|\|0)+r.volumeMt;});return Object.entries(m).map(([k,v])=>({sector:k,volume:v}))` |
| `buyerRank` | `useMemo(()=>{const m={};AGREEMENTS.forEach(r=>{if(!m[r.buyer])m[r.buyer]={buyer:r.buyer,vol:0,val:0,n:0};m[r.buyer].vol+=r.volumeMt;m[r.buyer].val+=r.` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='quarterly');const csv=[keys.join(','),...data.map(r=>key` |
| `methodDist` | `[];const md={};AGREEMENTS.forEach(a=>{md[a.methodology]=(md[a.methodology]\|\|0)+1;});Object.entries(md).forEach(([k,v])=>methodDist.push({name:k,value:` |
| `verifierDist` | `[];const vd={};AGREEMENTS.forEach(a=>{vd[a.verifier]=(vd[a.verifier]\|\|0)+1;});Object.entries(vd).forEach(([k,v])=>verifierDist.push({name:k,value:v}))` |
| `qualityMetrics` | `AGREEMENTS.slice(0,15).map(a=>({name:a.buyer.slice(0,3)+'-'+a.seller.slice(0,3),integrity:a.envIntegrity,additionality:a.additionality,permanence:a.pe` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BUYERS`, `COLORS`, `SECTORS`, `SELLERS`, `STATUSES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ITMOs Tracked | — | UNFCCC Article 6 registry | International Transferable Mitigation Outcomes registered and authorised under bilateral agreements |
| Corresponding Adjustment Applied | — | Host country NDC registry | Whether host country has removed transferred units from its national inventory |
| Additionality Score | — | Article 6.4 SB assessment | Supervisory body additionality rating for 6.4 mechanism project |
- **UNFCCC Article 6 international registry** → Ingest ITMO issuance, transfer, and cancellation records; validate corresponding adjustments → **Reconciled ITMO balance sheet with double-claiming risk flags**
- **Host country NDC inventory submissions** → Verify corresponding adjustment entries match transferred volumes → **Corresponding adjustment compliance status per bilateral agreement**

## 5 · Intermediate Transformation Logic
**Methodology:** Corresponding adjustment double-entry model
**Headline formula:** `Net_NDC_contribution = ITMOs_issued – ITMOs_cancelled; Corresponding_adjustment = ITMOs_transferred × GHG_metric_tonne`
**Standards:** ['Paris Agreement Article 6', 'UNFCCC CMA Decision 3/CMA.3', 'Verra VCS v4']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).