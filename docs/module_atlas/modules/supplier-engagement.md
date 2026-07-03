# Supplier Engagement
**Module ID:** `supplier-engagement` · **Route:** `/supplier-engagement` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Supplier ESG improvement programme management platform enabling buyers to set targets, track supplier progress, deliver capacity building and report aggregated supply chain ESG improvements.

> **Business value:** CDP data shows suppliers in active engagement programmes reduce emissions 2.4× faster than non-engaged peers; buyer-led supplier programmes are increasingly mandated under CSRD and German LkSG.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTION_TYPES`, `ActionTrackerTab`, `BenchmarkingTab`, `CERT_TYPES`, `COUNTRIES`, `DIMS`, `DIM_KEYS`, `DIM_WEIGHTS`, `INDUSTRIES`, `OWNERS`, `PipelineTab`, `QUARTERS`, `RISK_CATEGORIES`, `STAGES`, `STAGE_COLORS`, `STATUSES`, `STATUS_COLORS`, `ScorecardTab`, `TABS`, `TIERS`, `TIER_COLORS`, `TIER_THRESHOLDS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CERT_TYPES` | `['ISO 14001','ISO 45001','SA8000','FSC','GRI Verified','CDP A-List','B-Corp','Fair Trade'];` |
| `RISK_CATEGORIES` | `['Supply Disruption','Regulatory Non-Compliance','Reputational','Environmental Incident','Labour Rights','Data Privacy'];` |
| `suppliers` | `Array.from({length:150},(_,i)=>{const s=n=>sr(i*100+n);` |
| `scores` | `DIM_KEYS.map((_,d)=>Math.round(30+s(d*7+3)*65));` |
| `weighted` | `Math.round(scores.reduce((a,sc,idx)=>a+sc*DIM_WEIGHTS[idx],0));` |
| `composite` | `Math.round(scores.reduce((a,b)=>a+b,0)/6);` |
| `history` | `QUARTERS.map((_,q)=>Math.round(Math.max(15,Math.min(98,composite-10+s(q*13+50)*20))));` |
| `certs` | `CERT_TYPES.filter((_,ci)=>s(ci+90)>0.55);` |
| `risks` | `RISK_CATEGORIES.filter((_,ri)=>s(ri+120)>0.65);` |
| `contactName` | `['A. Martinez','B. Liu','C. Patel','D. Svensson','E. Nakamura','F. Weber','G. Kim','H. Santos','I. Smith','J. Dubois'][Math.floor(s(140)*10)];` |
| `contactRole` | `['VP Supply Chain','Sustainability Director','ESG Manager','Procurement Lead','Compliance Officer'][Math.floor(s(141)*5)];` |
| `engagements` | `Array.from({length:40},(_,i)=>{const s=n=>sr(i*200+n+5000);` |
| `sup` | `suppliers[Math.floor(s(1)*150)];` |
| `stageIdx` | `Math.floor(s(2)*6);` |
| `activities` | `Array.from({length:Math.floor(2+s(30)*6)},(__,a)=>({` |
| `actions` | `Array.from({length:40},(_,i)=>{const s=n=>sr(i*300+n+9000);` |
| `sup` | `suppliers[Math.floor(s(1)*150)];` |
| `statusIdx` | `Math.floor(s(2)*4);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTION_TYPES`, `CERT_TYPES`, `COUNTRIES`, `DIMS`, `DIM_KEYS`, `DIM_WEIGHTS`, `INDUSTRIES`, `OWNERS`, `QUARTERS`, `REPORTS`, `RISK_CATEGORIES`, `STAGES`, `STAGE_COLORS`, `STATUSES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Engaged Suppliers | — | Programme Database | Number of suppliers enrolled in active ESG improvement programmes with defined targets. |
| Avg Score Improvement | — | ESG Assessments | Mean ESG score increase across all engaged suppliers over 12-month programme cycle. |
| Programme Coverage | — | Spend Analysis | Proportion of total procurement spend covered by active engagement programmes. |
- **Supplier ESG Scores, Spend Data, Programme Activity Logs** → Improvement tracking + spend-weighting engine → **Programme dashboards, CSRD supply chain disclosures, CDP submission data**

## 5 · Intermediate Transformation Logic
**Methodology:** Supplier ESG Improvement Index
**Headline formula:** `SEII = Σ (ScoreΔ × Spend Weight) / Σ Spend Weight`
**Standards:** ['CDP Supply Chain Programme', 'Science Based Targets for Nature']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).