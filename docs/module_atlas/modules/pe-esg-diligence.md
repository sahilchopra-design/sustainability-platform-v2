# PE ESG Diligence
**Module ID:** `pe-esg-diligence` · **Route:** `/pe-esg-diligence` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides a structured pre-investment ESG due diligence framework for PE transactions, covering environmental, social, and governance risk identification, materiality assessment, and value creation planning.

> **Business value:** Equips PE deal teams with a rigorous, sector-calibrated ESG diligence process that identifies material risks, surfaces value creation opportunities, and supports responsible investment decision-making.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `DATA`, `NAMES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CATEGORIES` | `['Pre-Acquisition','100-Day Plan','Value Creation','Exit Readiness','Portfolio Review','Annual Assessment'];const SECTORS=['Healthcare PE','Tech PE','` |
| `paged` | `useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);const toggleSort=` |
| `kpis` | `useMemo(()=>{const d=filtered;if(!d.length)return{count:0,avgScore:0,avgCompl:0,avgConf:0,totalVol:0,highRisk:0};return{count:d.length,avgScore:d.redu` |
| `catDist` | `useMemo(()=>{const m={};filtered.forEach(r=>{m[r.category]=(m[r.category]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name:name.length>14?` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;return[{axis:'Env',value:avg('envScore')},{axi` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,score:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length\|\|1)})),[filtered]` |
| `sectorScore` | `useMemo(()=>{const m={};const c={};filtered.forEach(r=>{m[r.sector]=(m[r.sector]\|\|0)+r.score;c[r.sector]=(c[r.sector]\|\|0)+1;});return Object.entries(m` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `NAMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PE ESG DD Topics | — | SASB Materiality Map 2023 | Number of material ESG topics assessed in a typical sector-specific PE diligence using SASB standards. |
| ESG Value Creation Upside | — | McKinsey PE ESG 2022 | Documented multiple-on-invested-capital improvement attributable to ESG value creation plans in case studies o |
- **Management interviews, company documents, ESG controversy databases, regulatory filings, site assessments** → SASB materiality mapping, topic scoring, severity weighting, EMS computation → **ESG diligence report, value creation plan, investment committee risk and opportunity summary**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Materiality Score
**Headline formula:** `EMS = Σ wᵢ × TopicScoreᵢ × SeverityMultiplierᵢ`
**Standards:** ['PRI PE DDQ 2023', 'SASB Materiality Finder']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).