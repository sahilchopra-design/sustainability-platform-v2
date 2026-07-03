# Co-Investment Analytics
**Module ID:** `co-investment` · **Route:** `/co-investment` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Supports direct co-investment decision-making in climate and sustainability projects by providing deal screening, return modelling, ESG scoring, and LP syndication analytics.

> **Business value:** Enables institutional investors to systematically evaluate and compare direct co-investment opportunities in climate and sustainability projects on both financial and impact dimensions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CO_INVEST_ESG_CRITERIA`, `Card`, `GEOS`, `GP_TRACK_RECORDS`, `Inp`, `KPI`, `LS_KEY`, `RISK_LEVELS`, `SECTORS`, `SEED_DATA`, `STAGES`, `Sel`, `SortHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `GEOS` | `['US','Europe','Asia-Pacific','Africa/ME','LatAm'];` |
| `fmt` | `(n, d=1) => n == null ? '-' : Number(n).toFixed(d);` |
| `fmtM` | `(n) => n == null ? '-' : `$${Number(n).toFixed(0)}M`;` |
| `pct` | `(n) => n == null ? '-' : `${Number(n).toFixed(1)}%`;` |
| `avg` | `(arr,f)=> arr.reduce((s,x)=>s+x[f],0)/arr.length;` |
| `score` | `checks.reduce((s,c)=> s+(c.pass?c.weight:0), 0);` |
| `rows` | `data.map(d=> hdr.map(h=> Array.isArray(d[h]) ? d[h].join(';') : d[h]));` |
| `csv` | `[hdr.join(','), ...rows.map(r=>r.join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);` |
| `blob` | `new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob);` |
| `blob` | `new Blob([md],{type:'text/markdown'}); const url=URL.createObjectURL(blob);` |
| `totalCI` | `data.filter(d=>d.sector===sector).reduce((s,d)=>s+d.coInvest_mn,0);` |
| `totalCI` | `data.filter(d=>d.geography===geo).reduce((s,d)=>s+d.coInvest_mn,0);` |
| `avgEsg` | `items.length ? items.reduce((s,d)=>s+d.esg_score,0)/items.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GEOS`, `RISK_LEVELS`, `SECTORS`, `SEED_DATA`, `STAGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg Climate Infrastructure IRR | — | GRESB Infrastructure 2023 | Internal rate of return range for core climate infrastructure co-investments (renewables, green transport, wat |
| Co-Investment Share of PE Deals | — | Preqin 2023 | Proportion of private equity deals involving LP co-investment rights across infrastructure and growth equity s |
- **Deal documentation, project financial models, ESG due diligence reports, NGFS scenario paths** → DCF modelling, climate scenario sensitivity, CIRA calculation, ESG scoring → **Deal scorecards, syndication recommendations, portfolio concentration reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Co-Investment Return Adjusted for Climate Risk
**Headline formula:** `CIRA = IRR – λ × ClimateVaR`
**Standards:** ['IFC Performance Standards', 'GRESB Infrastructure Assessment']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).