# Governance Analytics Hub
**Module ID:** `governance-hub` · **Route:** `/governance-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides comprehensive board composition, audit quality, executive remuneration, and shareholder rights analytics across portfolio holdings, enabling governance factor integration into ESG scoring and active ownership strategies. Covers ISS and Glass Lewis proxy voting alignment, board independence, gender diversity, and remuneration-sustainability linkage metrics.

> **Business value:** Supports active ownership teams in prioritising engagement and proxy voting on governance matters, quantifying governance risk contribution to portfolio ESG scores, and meeting ESRS G1 disclosure requirements on business conduct and board oversight of sustainability matters.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ANNUAL`, `COMPANIES`, `NAMES`, `PAGE`, `REGIONS`, `SECTORS`, `TABS`, `VOTES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `REGIONS` | `['North America','Europe','Asia-Pacific','Emerging Markets'];` |
| `COMPANIES` | `Array.from({length:60},(_,i)=>({id:i+1,name:NAMES[i],sector:SECTORS[Math.floor(sr(i*3)*SECTORS.length)],region:REGIONS[Math.floor(sr(i*7)*REGIONS.leng` |
| `ANNUAL` | `Array.from({length:8},(_,i)=>({year:2018+i,avgBoard:+(sr(i*83)*2+9).toFixed(1),avgWomen:+(sr(i*89)*5+25).toFixed(1),avgIndep:+(sr(i*97)*5+60).toFixed(` |
| `VOTES` | `Array.from({length:20},(_,i)=>{const types=['Say-on-Pay','Board Election','Share Buyback','ESG Proposal','Anti-Takeover','Proxy Access','Climate Resol` |
| `paged` | `filtered.slice(page*PAGE,page*PAGE+PAGE);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `exportCSV` | `(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].j` |
| `kpis` | `useMemo(()=>{if(!filtered.length)return{count:0,avgGov:'0.0',avgWomen:'0.0',avgIndep:'0.0',sepChairs:0};return{count:filtered.length,avgGov:(filtered.` |
| `sectDist` | `useMemo(()=>{const m={};SECTORS.forEach(s=>m[s]=0);filtered.forEach(c=>m[c.sector]++);return Object.entries(m).map(([name,value])=>({name,value}));},[` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NAMES`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Board Independence (%) | — | ISS / Proxy filings | Proportion of independent non-executive directors; best practice threshold is 50% (UK Code) to 2/3 (ISS policy |
| Gender Diversity (%) | — | MSCI Women on Boards | Female representation on the board; EU gender balance directive targets 40% for listed companies by 2026. |
| ESG Pay Linkage (%) | — | Remuneration report analysis | Proportion of executive long-term incentive plan linked to quantified ESG/sustainability metrics; above 25% as |
| Audit Committee Independence (%) | — | SOX / UK Corporate Governance Code | Best practice requires fully independent audit committee; deviations require explain-or-comply disclosure. |
- **Board composition data (BoardEx / Proxy filings)** → Compute independence, diversity, tenure, and skill matrix metrics → **Board quality scores by issuer**
- **Remuneration reports (annual reports)** → Extract ESG pay linkage percentage and LTIP ESG KPIs → **Remuneration sustainability alignment scores**
- **ISS / Glass Lewis proxy research** → Map voting recommendations to portfolio holdings → **Say-on-pay and ESG resolution alignment**

## 5 · Intermediate Transformation Logic
**Methodology:** Governance Quality Score
**Headline formula:** `GQS = w_1 × BoardInd + w_2 × AuditQuality + w_3 × RemunAlign + w_4 × ShareholderRights`
**Standards:** ['ISS Governance Quality Score Methodology', 'MSCI Governance Pillar', 'ICGN Global Governance Principles 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).