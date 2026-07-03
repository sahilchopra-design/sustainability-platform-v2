# Value Chain Dashboard
**Module ID:** `value-chain-dashboard` · **Route:** `/value-chain-dashboard` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Upstream and downstream ESG performance mapping dashboard providing a unified view of value chain sustainability KPIs from raw material extraction through end-of-life product management.

> **Business value:** Scope 3 emissions average 11.4× Scope 1+2 for S&P 500 companies (CDP 2023); value chain ESG management is the largest lever for corporate climate impact and supply chain due diligence compliance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `COLORS`, `DATA`, `INDUSTRIES`, `PAGE_SIZE`, `REGIONS`, `RISK_LEVELS`, `TABS`, `TIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CATEGORIES` | `['Raw Materials','Components','Manufacturing','Logistics','Distribution','End-of-Life'];` |
| `tier` | `TIERS[Math.floor(s(17)*TIERS.length)];` |
| `category` | `CATEGORIES[Math.floor(s(23)*CATEGORIES.length)];` |
| `region` | `REGIONS[Math.floor(s(29)*REGIONS.length)];` |
| `risk` | `RISK_LEVELS[Math.floor(s(31)*RISK_LEVELS.length)];` |
| `industry` | `INDUSTRIES[Math.floor(s(37)*INDUSTRIES.length)];` |
| `badgeS` | `(bg)=>({display:'inline-block',padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:600,fontFamily:T.mono,background:bg+'18',color:bg});` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))` |
| `paged` | `useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `tierDist` | `useMemo(()=>TIERS.map(t=>({name:t,value:filtered.filter(r=>r.tier===t).length})),[filtered]);` |
| `catDist` | `useMemo(()=>CATEGORIES.map(c=>({name:c.length>12?c.slice(0,12)+'..':c,value:filtered.filter(r=>r.category===c).length})),[filtered]);` |
| `regionDist` | `useMemo(()=>REGIONS.map(r=>({name:r.length>12?r.slice(0,12)+'..':r,value:filtered.filter(d=>d.region===r).length})),[filtered]);` |
| `riskDist` | `useMemo(()=>RISK_LEVELS.map(l=>({name:l,value:filtered.filter(r=>r.risk===l).length})),[filtered]);` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,esg:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length\|\|1)})),[filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `COLORS`, `INDUSTRIES`, `REGIONS`, `RISK_LEVELS`, `TABS`, `TIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Value Chain ESG Index | — | VCEI Engine | Composite ESG score across all 15 Scope 3 categories weighted by emissions magnitude. |
| Scope 3 Coverage | — | Emissions Inventory | Proportion of estimated Scope 3 emissions with primary or secondary data; CSRD requires primary for material c |
| Highest-Impact Category | — | S3 Inventory | Scope 3 category with largest absolute emissions; primary focus for downstream product design interventions. |
- **Supplier ESG Data, Customer Product Data, Scope 3 Inventory, Tier Mapping** → VCEI engine + Scope 3 category weighting + ESG aggregation → **Value chain dashboard, CSRD ESRS E1/S2 disclosures, Scope 3 hotspot map**

## 5 · Intermediate Transformation Logic
**Methodology:** Value Chain ESG Index
**Headline formula:** `VCEI = Σ (Tier ESG Score × Emissions Weightᴵᵉʳ) / Σ Weight`
**Standards:** ['GHG Protocol Value Chain Standard', 'ESRS E1-6 Scope 3']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).