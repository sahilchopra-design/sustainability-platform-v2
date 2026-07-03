# ESG Portfolio Optimizer
**Module ID:** `esg-portfolio-optimizer` · **Route:** `/esg-portfolio-optimizer` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Constructs optimised equity portfolios maximising expected return per unit of risk subject to ESG score constraints, carbon budget limits, and climate tilt requirements using mean-variance optimisation. Integrates ESG scores, carbon intensity data, and factor model covariance matrices to generate efficient frontiers with and without ESG constraints. Supports passive ESG index replication, active ESG tilting, and transition pathway portfolio construction.

> **Business value:** Delivers institutional-grade ESG portfolio construction combining rigorous quantitative optimisation with integrated ESG and climate constraints, enabling fund managers to launch Paris-aligned products, rebalance existing mandates, and demonstrate systematic ESG integration to clients and regulators.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CONSTRAINTS`, `DATA`, `NAMES`, `RISK_LEVELS`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CONSTRAINTS` | `['Min ESG 60','Max Carbon 200','Paris Aligned','Net Zero','Exclusion List','Best-in-Class','SDG Aligned','SFDR Art 8'];` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))` |
| `paged` | `useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const d=filtered;if(!d.length)return{count:0,avgSharpe:0,avgEsg:0,avgReturn:0,avgVol:0,avgCarbon:0};return{count:d.length,avgSharpe:d.red` |
| `conDist` | `useMemo(()=>{const m={};filtered.forEach(r=>{m[r.constraint]=(m[r.constraint]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name:name.length` |
| `sectorAlloc` | `useMemo(()=>SECTORS.map(s=>({name:s.length>10?s.slice(0,10)+'..':s,current:filtered.filter(r=>r.sector===s).reduce((a,r)=>a+r.weight,0),opt:filtered.f` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/ Math.max(1, filtered.length);return[{axis:'ESG',value:avg('es` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,sharpe:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length\|\|1)})),[filtered` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CONSTRAINTS`, `NAMES`, `RISK_LEVELS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio ESG Score (weighted avg) | — | MSCI/Sustainalytics | Portfolio-level ESG score computed as holdings-weighted average; minimum constraint typically set at index + 1 |
| Carbon Intensity (tCO2e/$M Rev) | — | Trucost/CDP | Portfolio-weighted carbon intensity; EU PAB requires minimum 50% reduction vs. parent index at launch. |
| ESG Constraint Cost (bps p.a.) | — | Optimiser Output | Reduction in expected return from imposing ESG/carbon constraints; typically 5â€“30 bps for broad equity unive |
| Active Share (%) | — | Cremers & Petajisto 2009 | Proportion of portfolio differing from benchmark; key metric for ESG active portfolio differentiation. |
- **Factor model covariance matrix (Barra/Axioma)** → Update monthly; validate factor structure stability across ESG-constrained subsets → **Asset covariance matrix Σ for optimiser input**
- **Return forecasts (alpha signals from quant models)** → Align signal universe with ESG score coverage; apply shrinkage to mitigate estimation error → **Expected return vector μ per security**
- **ESG scores and carbon intensity (Trucost/MSCI)** → Normalise and align with portfolio universe; construct constraint coefficient vectors → **ESG score and CI constraint rows for QP solver**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG-Constrained Mean-Variance Optimisation
**Headline formula:** `max wᵀμ − (λ/2)wᵀΣw, s.t. wᵀ×ESG ≥ ESG_min, wᵀ×CI ≤ CI_max, Σw_i = 1`
**Standards:** ['Markowitz 1952', 'MSCI ESG Tilted Index Methodology', 'EU Paris-aligned Benchmark Regulation 2020']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).