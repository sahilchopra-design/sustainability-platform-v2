# Quant ESG Hub
**Module ID:** `quant-esg-hub` · **Route:** `/quant-esg-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Platform for systematic ESG factor integration into quantitative investment strategies, combining signal construction, backtesting, and live monitoring.

> **Business value:** Provides the infrastructure for building, testing, and deploying ESG factors in quantitative strategies, bridging sustainability data and alpha generation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `COLORS`, `DATA`, `NAMES`, `PAGE_SIZE`, `RISK_LEVELS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CATEGORIES` | `['Factor Strategies','Risk Premia','Smart Beta','Multi-Factor','Long-Short','Market Neutral'];` |
| `badgeS` | `(bg)=>({display:'inline-block',padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:600,fontFamily:T.mono,background:bg+'18',color:bg});` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))` |
| `paged` | `useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `catDist` | `useMemo(()=>{const m={};filtered.forEach(r=>{m[r.category]=(m[r.category]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name:name.length>14?` |
| `riskDist` | `useMemo(()=>RISK_LEVELS.map(l=>({name:l,value:filtered.filter(r=>r.risk===l).length})),[filtered]);` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/ Math.max(1, filtered.length);` |
| `catPerf` | `useMemo(()=>CATEGORIES.map(c=>{const items=filtered.filter(r=>r.category===c);if(!items.length)return null;return{name:c.length>14?c.slice(0,14)+'..':` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,sharpe:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length\|\|1)})),[filtered` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `COLORS`, `NAMES`, `RISK_LEVELS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Covered Securities | — | ESG Universe | Total securities with ESG signal constructed in active investment universe. |
| Signal IC (1-yr) | — | Backtest Engine | Information coefficient of composite ESG signal vs 12-month forward returns. |
| Controversy Hit Rate (%) | — | RepRisk NLP | Share of universe flagged with material controversy event in trailing 90 days. |
- **ESG time series + controversy flags + price data** → Signal construction; backtest; IC and turnover analysis → **Live signal scores, backtest results, and portfolio integration outputs**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Signal Score
**Headline formula:** `Sᵢ = α×ΔESG_momentum + β×ESG_level + γ×controversy_penalty`
**Standards:** ['AQR ESG Integration Research', 'MSCI Factor Research']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).