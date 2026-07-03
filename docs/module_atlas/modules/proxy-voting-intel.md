# Proxy Voting Intelligence
**Module ID:** `proxy-voting-intel` · **Route:** `/proxy-voting-intel` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG-aligned proxy voting analytics covering shareholder resolution tracking, voting policy alignment, and engagement outcome monitoring.

> **Business value:** Streamlines ESG proxy voting workflows, ensuring policy alignment, regulatory compliance, and systematic tracking of stewardship outcomes.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COS`, `RESTYPES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(0):v;` |
| `totalRes` | `Math.round(sr(i*7)*15+3);const esgRes=Math.round(totalRes*(sr(i*11)*0.4+0.1));const avgSupport=Math.round(sr(i*13)*40+20);const mgmtOpposed=Math.round` |
| `resolutions` | `Array.from({length:Math.min(esgRes,5)},(_,j)=>({type:RESTYPES[Math.floor(sr(i*100+j*7)*RESTYPES.length)],support:Math.round(sr(i*100+j*11)*50+15),year` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,totalESGRes:filtered.reduce((s,r)=>s+r.esgResolutions,0),avgSupport:Math.round(filtered.reduce((s,r)=>s+r.avgSuppo` |
| `resTypeDist` | `useMemo(()=>{const m={};COS.forEach(c=>c.resolutions.forEach(r=>{m[r.type]=(m[r.type]\|\|0)+1;}));return Object.entries(m).map(([k,v])=>({type:k,count:v` |
| `sectorVoting` | `useMemo(()=>{const m={};COS.forEach(c=>{if(!m[c.sector])m[c.sector]={s:c.sector,support:0,sop:0,n:0};m[c.sector].support+=c.avgSupportPct;m[c.sector].` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='resolutions');const csv=[keys.join(','),...data.map(r=>k` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `RESTYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| AGMs Covered (YTD) | — | Proxy Voting Registry | Total shareholder meetings for which voting analysis has been completed year-to-date. |
| ESG Resolution Pass Rate (%) | — | Meeting Outcomes | Proportion of ESG-related shareholder resolutions passing at covered AGMs. |
| Voting Policy Alignment (%) | — | Internal Voting Policy | Share of votes cast consistent with institutional ESG voting policy guidelines. |
- **AGM schedule + resolution text + company ESG data** → Policy alignment mapping; recommendation generation; outcome recording → **Voting recommendations, policy alignment report, and engagement outcomes tracker**

## 5 · Intermediate Transformation Logic
**Methodology:** Voting Alignment Score
**Headline formula:** `VA = (votes_aligned_to_policy / total_votes) × 100`
**Standards:** ['ISS Proxy Voting Guidelines', 'Glass Lewis Benchmark Policy']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).