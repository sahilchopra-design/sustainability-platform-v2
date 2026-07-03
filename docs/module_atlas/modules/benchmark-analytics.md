# ESG Benchmark Analytics
**Module ID:** `benchmark-analytics` · **Route:** `/benchmark-analytics` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG benchmark comparison engine. Covers Paris-aligned benchmarks (PAB), climate transition benchmarks (CTB), ESG-screened indices, and custom benchmark construction.

> **Business value:** EU PAB and CTB are increasingly adopted by institutional investors as portfolio benchmarks — 100s of ETFs and funds track these indices. Understanding benchmark methodology enables managers to construct compliant portfolios and explain performance attribution from ESG tilts vs conventional indices.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BENCHMARKS`, `MONTHLY`, `PAGE`, `PROVIDERS`, `REGIONS`, `SECTORS`, `SECTOR_DATA`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `TYPES` | `['ESG Leaders','SRI','Paris-Aligned','Climate Transition','Low Carbon','Gender Equality','Social','Green Bond','Thematic','Multi-Factor ESG'];` |
| `REGIONS` | `['Global','US','Europe','Asia-Pacific','Emerging Markets','Japan','UK','China'];` |
| `prov` | `PROVIDERS[Math.floor(sr(i*3)*PROVIDERS.length)];` |
| `type` | `TYPES[Math.floor(sr(i*7)*TYPES.length)];` |
| `reg` | `REGIONS[Math.floor(sr(i*11)*REGIONS.length)];` |
| `SECTOR_DATA` | `SECTORS.map((s,i)=>({name:s,esgWeight:+(sr(i*121)*15+2).toFixed(1),parentWeight:+(sr(i*127)*15+2).toFixed(1),overweight:+(sr(i*121)*15+2-sr(i*127)*15-` |
| `paged` | `filtered.slice(page*PAGE,page*PAGE+PAGE);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `exportCSV` | `(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].j` |
| `kpis` | `useMemo(()=>{const n=filtered.length\|\|1;return{count:filtered.length,totalAum:filtered.reduce((s,b)=>s+b.aum,0),avgEsg:(filtered.reduce((s,b)=>s+parse` |
| `provDist` | `useMemo(()=>{const m={};PROVIDERS.forEach(p=>m[p]=0);filtered.forEach(b=>m[b.provider]++);return Object.entries(m).filter(([,v])=>v>0).map(([name,valu` |
| `typeDist` | `useMemo(()=>{const m={};TYPES.forEach(t=>m[t]=0);filtered.forEach(b=>m[b.type]++);return Object.entries(m).filter(([,v])=>v>0).map(([name,value])=>({n` |
| `methDist` | `[];const mMap={};filtered.forEach(b=>{mMap[b.methodology]=(mMap[b.methodology]\|\|0)+1;});Object.entries(mMap).forEach(([name,value])=>methDist.push({na` |
| `rebDist` | `[];const rMap={};filtered.forEach(b=>{rMap[b.rebalance]=(rMap[b.rebalance]\|\|0)+1;});Object.entries(rMap).forEach(([name,value])=>rebDist.push({name,va` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/benchmarks/sector/{sector}` | `get_sector_benchmark` | api/v1/routes/benchmarks.py |
| GET | `/api/v1/benchmarks/sectors` | `list_sector_benchmarks` | api/v1/routes/benchmarks.py |
| GET | `/api/v1/benchmarks/waci` | `calculate_waci` | api/v1/routes/benchmarks.py |
| GET | `/api/v1/benchmarks/stats` | `benchmark_stats` | api/v1/routes/benchmarks.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `EDGAR` *(shared)*, `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `yfinance`
**Frontend seed datasets:** `PROVIDERS`, `REGIONS`, `SECTORS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PAB Carbon Intensity | — | EU PAB Regulation | Minimum decarbonisation requirement vs parent index |
| CTB Carbon Intensity | — | EU CTB Regulation | Lower bar for climate transition benchmark |
| PAB Annual Decarbonisation | — | EU PAB Regulation | Required annual pace of GHG intensity reduction in benchmark |
- **Parent index constituents** → ESG screen and tilt → **ESG benchmark weights**
- **Portfolio weights** → TE calculation → **Benchmark deviation**
- **Benchmark CI** → Portfolio CI comparison → **Carbon tilt vs benchmark**

## 5 · Intermediate Transformation Logic
**Methodology:** Benchmark construction and tracking
**Headline formula:** `TE = std(r_portfolio - r_benchmark); TiltScore = Σ(w_i - b_i) × CI_i`
**Standards:** ['EU PAB/CTB Regulation 2019/2089', 'MSCI Climate Indexes', 'FTSE Russell Climate Indexes']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **56** other module(s).

| Connected module | Shared via |
|---|---|
| `real-estate-carbon-analytics` | table:api, table:db, table:sqlalchemy |
| `reference-data-explorer` | table:api, table:db, table:sqlalchemy |
| `portfolio-transition-alignment` | table:api, table:db |
| `portfolio-optimizer` | table:api, table:db |
| `portfolio-temperature-score` | table:api, table:db |
| `portfolio-dashboard` | table:api, table:db |
| `portfolio-climate-var` | table:api, table:db |
| `portfolio-stress-test-drilldown` | table:api, table:db |
| `portfolio-suite` | table:api, table:db |
| `portfolio-manager` | table:api, table:db |