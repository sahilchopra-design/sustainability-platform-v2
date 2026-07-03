# Transition Scenario Modeller
**Module ID:** `transition-scenario-modeller` · **Route:** `/transition-scenario-modeller` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Corporate scenario analysis platform for transition risk modelling; applies NGFS, IEA and proprietary scenarios to company financial projections to quantify revenue, cost and asset value impacts.

> **Business value:** TCFD recommends at least three scenario pathways including a <2°C scenario; CSRD ESRS E1 requires quantitative scenario analysis for all large companies from 2024; modellers reduce analyst time by 70%.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `PRESETS`, `SECTORS`, `SECTOR_IMPACTS`, `TABS`, `TIMELINE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PRESETS` | `[{id:1,name:'NGFS Net Zero 2050',carbonPrice:250,renewPct:90,tempC:1.5,gdp:-2,coalPhase:2040,evShare:85,h2Scale:'High',ccusGt:7},{id:2,name:'NGFS Dela` |
| `SECTOR_IMPACTS` | `PRESETS.map(p=>({scenario:p.name,...Object.fromEntries(SECTORS.map((s,i)=>[s,+((sr(p.id*100+i*7)-0.5)*Math.abs(p.gdp)*3).toFixed(1)]))}));` |
| `TIMELINE` | `Array.from({length:7},(_,y)=>({year:2025+y*5,nz:+(1.2+y*0.04).toFixed(1),delayed:+(1.2+y*0.1).toFixed(1),current:+(1.2+y*0.28).toFixed(1),carbon_nz:Ma` |
| `sectorImpact` | `useMemo(()=>{const si=SECTOR_IMPACTS.find(s=>s.scenario===curPreset.name);if(!si)return[];return SECTORS.map(s=>({sector:s,impact:si[s]\|\|0})).sort((a,` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PRESETS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EBITDA Impact (Orderly 1.5°C) | — | Scenario Engine | Projected EBITDA reduction under NGFS Orderly transition by 2030 vs baseline. |
| EBITDA Impact (Disorderly) | — | Scenario Engine | Projected EBITDA reduction under NGFS Disorderly transition; higher from abrupt carbon price shock. |
| Scenarios Available | — | NGFS Library | Number of scenarios available including NGFS Phase IV, IEA NZE/SDS/STEPS and proprietary variants. |
- **Company P&L, Carbon Price Curves, Energy Price Projections, NGFS Pathways** → Scenario mapping engine + financial impact modelling → **Scenario impact reports, TCFD Strategy section disclosures, board presentations**

## 5 · Intermediate Transformation Logic
**Methodology:** Scenario Impact on EBITDA
**Headline formula:** `ΔEBITDA = ΔRevenue(carbon price, demand) + ΔCost(energy, compliance) – ΔCapex(transition)`
**Standards:** ['NGFS Phase IV 2023', 'TCFD Scenario Analysis Guidance 2022']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).