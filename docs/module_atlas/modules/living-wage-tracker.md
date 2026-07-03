# Living Wage Tracker
**Module ID:** `living-wage-tracker` · **Route:** `/living-wage-tracker` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Global benchmarking platform comparing reported or estimated worker wages to living wage standards from Anker Research Institute, WageIndicator Foundation, and Fair Wage Network across 120+ countries and 400+ regions. Quantifies the living wage gap by sector, country, and occupation group and models the cost impact of wage uplift on issuer financials. Supports CSRD ESRS S1 employee matters disclosure and social bond impact reporting.

> **Business value:** Enables ESG analysts, social bond issuers, and CSRD-reporting companies to quantify, benchmark, and disclose living wage performance, supporting investor engagement on worker welfare and demonstrating supply chain social risk management.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `names` | `['Walmart','Amazon','Nike','H&M','Nestle','Unilever','Starbucks','McDonalds','Coca-Cola','PepsiCo','Costco','Target','Adidas','Inditex','LVMH','P&G','` |
| `workforce` | `Math.round(sr(i*7)*500+20);const lwGap=Math.round(sr(i*11)*40);const regions=Math.round(sr(i*13)*30+5);const supplyWorkers=Math.round(sr(i*17)*200+10)` |
| `regBench` | `Array.from({length:6},(_,r)=>{const rn=['South Asia','Southeast Asia','Sub-Saharan Africa','Latin America','Eastern Europe','East Asia'][r];return{reg` |
| `yearly` | `Array.from({length:5},(_,y)=>({year:2020+y,gap:Math.round(lwGap+5-y*2+sr(i*100+y)*4),coverage:Math.round(50+y*5+sr(i*100+y*3)*8),spend:+(sr(i*100+y*7)` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,avgGap:Math.round(filtered.reduce((s,r)=>s+r.livingWageGap,0)/filtered.length\|\|0),avgCoverage:Math.round(filtered.` |
| `sectorGap` | `useMemo(()=>{const m={};COS.forEach(c=>{if(!m[c.sector])m[c.sector]={s:c.sector,gap:0,cov:0,n:0};m[c.sector].gap+=c.livingWageGap;m[c.sector].cov+=c.l` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Living Wage Gap (%) | — | Anker Research Institute benchmarks | Percentage shortfall of actual wages below living wage reference for the assessed geography and occupation |
| Workers Below Living Wage (%) | — | WageIndicator Foundation / ILO | Share of workforce in the analysis scope earning below the applicable living wage benchmark |
| Wage Uplift Cost (% of revenue) | — | Company financial data + headcount model | Estimated incremental labour cost to close the living wage gap as a proportion of issuer revenue |
| Fair Wage Score | — | Fair Wage Network 12-dimension assessment | Composite score across living wage, pay equity, social dialogue, and wage management dimensions |
- **Company HR and wage data / CDP supply chain survey** → Extract median wage by country and occupation; validate against minimum wage floors → **Actual wage data per geography and occupation group**
- **Anker / WageIndicator living wage benchmarks** → Match to entity operating geography and urban/rural classification; apply year adjustment → **Living wage reference value per country-occupation cell**
- **Headcount by country from company reporting** → Combine with LWG to compute total cost of gap closure; express as % of revenue → **Wage uplift cost model and EBITDA impact estimate**

## 5 · Intermediate Transformation Logic
**Methodology:** Living Wage Gap
**Headline formula:** `LWGᵢ = max(0, LivingWageᵢ − ActualWageᵢ) / LivingWageᵢ`
**Standards:** ['Anker Research Institute Living Wage Benchmarks 2023', 'WageIndicator Foundation Global Wage Database', 'Fair Wage Network Assessment Framework', 'CSRD ESRS S1 Employee Matters Standard 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).