# Executive Pay Analytics
**Module ID:** `executive-pay-analytics` · **Route:** `/executive-pay-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses the alignment between executive and CEO remuneration structures and ESG/climate performance KPIs, assessing the materiality, measurability, and rigour of sustainability metrics embedded in annual and long-term incentive plans. Supports active ownership voting decisions on remuneration resolutions, engagement with remuneration committees, and regulatory disclosure requirements under UK CA 2006, EU CSRD, and ISSB S2.

> **Business value:** Empowers stewardship teams and active ownership programmes to make evidence-based voting decisions on executive remuneration, engage remuneration committees with quantitative rigour, and drive genuine integration of climate and ESG targets into executive incentive design.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COLORS`, `COS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `TABS` | `['Compensation Overview','Pay Ratio Analysis','ESG-Linked Comp','Peer Benchmarking'];` |
| `ceoPay` | `+(sr(i*7)*25+5).toFixed(1);const medianPay=Math.round(sr(i*11)*80+40);const payRatio=Math.round(ceoPay*1000/medianPay);const esgLinkedPct=Math.round(s` |
| `yearly` | `Array.from({length:5},(_,y)=>({year:2020+y,ceoPay:+(ceoPay-2+y*0.8+sr(i*100+y)*2).toFixed(1),ratio:Math.round(payRatio-50+y*15+sr(i*100+y*3)*30),esgPc` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,avgCeo:'$'+(filtered.reduce((s,r)=>s+r.ceoPayM,0)/filtered.length\|\|0).toFixed(1)+'M',avgRatio:Math.round(filtered.` |
| `sectorPay` | `useMemo(()=>{const m={};COS.forEach(c=>{if(!m[c.sector])m[c.sector]={s:c.sector,pay:0,ratio:0,esg:0,n:0};m[c.sector].pay+=c.ceoPayM;m[c.sector].ratio+` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='yearly');const csv=[keys.join(','),...data.map(r=>keys.m` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Incentive Weight (% of variable pay) | — | Remuneration Report | Proportion of annual bonus and LTIP award tied to ESG/sustainability KPIs; below 10% considered low integratio |
| EPAS (0â€“100) | — | Platform Pay Model | Composite ESG pay alignment score; below 50 triggers vote against remuneration report recommendation for ESG-f |
| Science-Based Target Linkage (Y/N) | — | SBTi / Remuneration Report | Binary indicator of whether executive decarbonisation KPIs are explicitly tied to SBTi-validated corporate tar |
| Pay-ESG Performance Correlation (r) | — | Statistical Analysis | Historical correlation between CEO ESG-linked pay outcomes and actual ESG KPI improvements; low correlation si |
- **Remuneration reports (Annual Report proxy filings)** → NLP extraction of ESG metric names, target definitions, weightings, and actual outcomes; classify by pillar → **Structured ESG pay metric inventory with weight, target, outcome, and verification flag**
- **SBTi target registry and CDP climate data** → Match executive climate KPIs to validated SBTi targets; score alignment gap → **Science-based target linkage status per executive climate metric**
- **Historical CEO pay outcomes vs. ESG KPI actuals** → Compute rolling 5-year pay-ESG performance correlation; detect target ratcheting → **Pay-ESG correlation coefficient and target stretch assessment**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Pay Alignment Score
**Headline formula:** `EPAS = w_m × Materiality + w_r × Rigour + w_t × Transparency + w_i × Incentive_Weight`
**Standards:** ['UK Corporate Governance Code 2024', 'EU CSRD Article 29c', 'UNPRI Active Ownership 2.0']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).