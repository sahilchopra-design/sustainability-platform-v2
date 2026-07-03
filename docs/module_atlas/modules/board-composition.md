# Board Composition Analytics
**Module ID:** `board-composition` · **Route:** `/board-composition` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Board skills matrix, tenure analysis, independence assessment, and ISS/Glass Lewis proxy advisory criteria scoring for portfolio company boards. Covers lead independent director requirements, committee independence, overboarding screening, and say-on-climate readiness. Benchmarks board composition against ISS QuickScore and MSCI IVA governance ratings.

> **Business value:** Board composition quality is a leading indicator of governance failures that destroy shareholder value: independence deficits correlate with weak oversight of management, and skills gaps in climate and risk increase ESG exposure. Proactive monitoring of ISS/Glass Lewis criteria enables investors to engage before adverse AGM outcomes materialise.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COLORS`, `COS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `boardSize` | `Math.round(8+sr(i*7)*7);const femPct=Math.round(15+sr(i*11)*35);const indPct=Math.round(50+sr(i*13)*45);const avgAge=Math.round(52+sr(i*17)*16);const ` |
| `skillMatrix` | `skills.map(s=>({skill:s,count:Math.round(sr(i*23+skills.indexOf(s)*7)*boardSize*0.8+1)}));` |
| `ethnicDiv` | `Math.round(sr(i*29)*40+10);const intlPct=Math.round(sr(i*31)*50+10);const ceoChairSep=sr(i*37)>0.4?'Yes':'No';const leadIndDir=sr(i*41)>0.3?'Yes':'No'` |
| `overboarding` | `Math.round(sr(i*43)*3);const refreshRate=+(sr(i*47)*20+5).toFixed(1);const esqExpertise=Math.round(sr(i*49)*boardSize*0.6);` |
| `yearly` | `Array.from({length:5},(_,y)=>({year:2020+y,femPct:Math.round(femPct-5+y*2+sr(i*100+y)*3),indPct:Math.round(indPct-3+y*1.5+sr(i*100+y*3)*2),avgAge:Math` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,avgFem:(filtered.reduce((s,r)=>s+r.femalePct,0)/filtered.length\|\|0).toFixed(0),avgInd:(filtered.reduce((s,r)=>s+r.` |
| `sectorDiv` | `useMemo(()=>{const m={};COS.forEach(r=>{if(!m[r.sector])m[r.sector]={s:r.sector,fem:0,ind:0,eth:0,n:0};m[r.sector].fem+=r.femalePct;m[r.sector].ind+=r` |
| `aggSkills` | `['Finance','Technology','Industry','Legal','ESG','International','Marketing','Operations','Risk','HR'].map(s=>{const total=COS.reduce((sum,c)=>{const ` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Board Independence | `Ind_directors / Total × 100` | ISS QS | Percentage of directors meeting ISS independence criteria; <50% triggers ISS concern |
| Avg Board Tenure | `Mean director years on board` | Company proxy | Average tenure; >9 years raises ISS independence questions for non-executive directors |
| Skills Matrix Coverage | — | Board skills disclosure | Number of 12 key competencies covered by at least one board member |
- **Company proxy statements and annual reports** → Extract director profiles; classify by ISS independence criteria; tag skills matrix → **Per-director independence, tenure, and skills metadata**
- **ISS QuickScore API / governance databases** → Compute composite governance score; benchmark against sector and index peers → **QS scores, overboarding flags, and committee independence assessments**

## 5 · Intermediate Transformation Logic
**Methodology:** ISS QualityScore composite governance model
**Headline formula:** `Board_score = 0.30×Independence + 0.25×Skills + 0.25×Diversity + 0.20×Tenure; Independence = Ind_directors / Total_directors × 100`
**Standards:** ['ISS QuickScore Governance', 'Glass Lewis Policy Guidelines', 'UK Corporate Governance Code 2024']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).