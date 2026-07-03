# Decarbonisation Hub
**Module ID:** `decarbonisation-hub` · **Route:** `/decarbonisation-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Enterprise-wide decarbonisation programme management platform consolidating emission reduction targets, project portfolios, budget allocation, and progress tracking in a single view. Supports Science Based Targets initiative (SBTi) near-term and net-zero target setting. Executive dashboards surface headline progress against committed pathways.

> **Business value:** Provides board and sustainability leadership with a single source of truth on decarbonisation progress, pipeline, and budget. Identifies abatement gaps early so management can commission additional projects before target deadlines are missed.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ABATEMENT`, `COMPANIES`, `PATHWAY`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PATHWAY` | `Array.from({length:7},(_,i)=>({year:2025+i*5,currentEmissions:Math.round(100-i*10+sr(i*7)*5),targetEmissions:Math.round(100-i*14),sbtiPath:Math.round(` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `stats` | `useMemo(()=>({count:filtered.length,totalEmissions:filtered.reduce((s,r)=>s+r.totalEmissions,0),avgProgress:(filtered.reduce((s,r)=>s+r.progressPct,0)` |
| `sectorEmissions` | `useMemo(()=>{const m={};COMPANIES.forEach(r=>{if(!m[r.sector])m[r.sector]={s:r.sector,e:0,p:0,n:0};m[r.sector].e+=r.totalEmissions;m[r.sector].p+=r.pr` |
| `sbtiDist` | `useMemo(()=>{const m={};COMPANIES.forEach(r=>{m[r.sbtiStatus]=(m[r.sbtiStatus]\|\|0)+1;});return Object.entries(m).map(([k,v])=>({name:k,value:v}));},[]` |
| `roadmapDist` | `useMemo(()=>{const m={};COMPANIES.forEach(r=>{m[r.roadmapStatus]=(m[r.roadmapStatus]\|\|0)+1;});return Object.entries(m).map(([k,v])=>({name:k,value:v})` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ABATEMENT`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Decarbonisation Rate | — | GHG inventory system | Year-on-year absolute Scope 1+2 emission reduction across all corporate entities |
| SBTi-Aligned Projects | — | Project registry | Count of active decarbonisation projects validated as consistent with SBTi criteria |
| CapEx Committed | — | Finance system | Total capital expenditure committed to decarbonisation projects in current programme |
| Net-Zero Target Year | — | Board commitment register | Committed net-zero year per the corporate climate strategy |
- **GHG inventory system (Scope 1/2/3 actuals)** → Baseline normalisation and year-on-year reduction calculation → **Decarbonisation rate and trajectory vs. SBTi pathway**
- **Project registry (type, cost, abatement estimate)** → Abatement curve construction across all active projects → **Aggregate abatement potential vs. required reduction gap**
- **Finance system (CapEx commitments)** → Budget-to-abatement efficiency ratio calculation → **Cost per tonne CO₂e abated by project and technology type**

## 5 · Intermediate Transformation Logic
**Methodology:** Decarbonisation Rate
**Headline formula:** `DR = (Baseline Emissions − Current Emissions) / Baseline Emissions × 100`
**Standards:** ['SBTi Corporate Net-Zero Standard', 'GHG Protocol Corporate Standard', 'TCFD Metrics & Targets']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).