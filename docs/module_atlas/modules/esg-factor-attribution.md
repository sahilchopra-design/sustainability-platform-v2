# ESG Factor Attribution
**Module ID:** `esg-factor-attribution` · **Route:** `/esg-factor-attribution` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Decomposes portfolio active returns into ESG factor contributions alongside traditional Brinson-Hood-Beebower and multi-factor attribution components. Identifies whether outperformance or underperformance is driven by ESG tilts, sector allocation effects, or security selection within ESG-screened universes. Supports performance reporting to ESG-mandated clients and strategy governance committees.

> **Business value:** Provides portfolio managers and client-facing teams with transparent, defensible attribution showing precisely how ESG integration has contributed to or detracted from performance, supporting client retention, regulatory disclosure, and strategy refinement.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CATS`, `COLORS`, `FACTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `ret1y` | `+((sr(i*7)-0.4)*15).toFixed(2);const vol=+(sr(i*13)*12+3).toFixed(2);const sharpe=+(ret1y/(vol\|\|1)).toFixed(2);const ir=+((sr(i*17)-0.3)*2).toFixed(2)` |
| `monthly` | `Array.from({length:12},(_,m)=>({month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],ret:+((sr(i*100+m*7)-0.45)*4).toFix` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,avgRet:(filtered.reduce((s,r)=>s+r.return1Y,0)/filtered.length\|\|0).toFixed(2),avgSharpe:(filtered.reduce((s,r)=>s+` |
| `catPerf` | `useMemo(()=>{const m={};FACTORS.forEach(f=>{if(!m[f.category])m[f.category]={cat:f.category,ret:0,vol:0,sharpe:0,n:0};m[f.category].ret+=f.return1Y;m[` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='monthly');const csv=[keys.join(','),...data.map(r=>keys.` |
| `catDist` | `CATS.slice(1).map(c=>({name:c,value:FACTORS.filter(f=>f.category===c).length}));` |
| `cumData` | `Array.from({length:24},(_,m)=>({month:'M'+(m+1),esg:+((m+1)*0.4+sr(m*7)*3).toFixed(1),benchmark:+((m+1)*0.3+sr(m*11)*2).toFixed(1)}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATS`, `COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Tilt Contribution (bps) | — | Attribution Engine | Return contribution attributable to the portfolio's ESG score tilt vs. benchmark; positive = ESG tilt added va |
| Allocation Effect (bps) | — | Brinson BHB | Return from over/under-weighting sectors vs. benchmark, independent of security selection within sectors. |
| Selection Effect (bps) | — | Brinson BHB | Return from security selection within sectors; includes the ESG quality effect within sector weights. |
| ESG Factor R² (%) | — | Factor Regression | Proportion of active return variance explained by the ESG factor; high R² validates ESG as primary active retu |
- **Portfolio management system (daily holdings and weights)** → Compute active weights vs. benchmark; align with ESG score time series at month-end → **Active weight and ESG score differential by security and sector**
- **ESG score provider feeds (MSCI/Sustainalytics)** → Normalise scores cross-sectionally; compute score-weighted sector averages → **Sector ESG score differential (portfolio vs. benchmark)**
- **Security and portfolio return data (Bloomberg)** → Apply BHB decomposition with ESG tilt extension; sum to portfolio level → **Attribution waterfall: allocation, selection, ESG tilt, interaction (bps)**

## 5 · Intermediate Transformation Logic
**Methodology:** Brinson-ESG Attribution
**Headline formula:** `Active_Return = Allocation + Selection + ESG_Tilt + Interaction`
**Standards:** ['Brinson-Hood-Beebower 1986', 'GIPS 2020', 'CFA Institute ESG Attestation']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).