# Sovereign Climate Intelligence
**Module ID:** `sovereign-climate-intelligence` · **Route:** `/sovereign-climate-intelligence` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated sovereign climate risk intelligence platform combining physical hazard, transition risk, fiscal climate vulnerability and adaptation capacity into a unified sovereign scoring model.

> **Business value:** Provides a fully integrated sovereign climate intelligence composite spanning physical, transition, fiscal and adaptive dimensions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CountryScorecard`, `NGFS_SCENARIOS`, `NgfsScenarios`, `PortfolioExposure`, `REGIONS`, `SOVEREIGNS`, `SpreadCreditImpact`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `compositeScore` | `(s)=>+((10-s.physRisk)*0.3+s.transReady*0.25+s.fiscRes*0.2+s.ndcAmb*0.15+s.ndGain/10*0.1).toFixed(2);` |
| `ratingColor` | `(r)=>{if(!r)return T.textMut;if(r.startsWith('AAA')\|\|r==='AA+'\|\|r==='AA')return T.green;if(r.startsWith('A'))return T.teal;if(r.startsWith('BBB'))retu` |
| `pill` | `(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color` |
| `scored` | `SOVEREIGNS.map(s=>({...s,composite:compositeScore(s)}));` |
| `avgComposite` | `+(scored.reduce((a,s)=>a+s.composite,0)/scored.length).toFixed(2);` |
| `scored` | `SOVEREIGNS.map(s=>({...s,composite:compositeScore(s)}));` |
| `holdings` | `SOVEREIGNS.slice(0,12).map((s,i)=>({` |
| `totalWeight` | `+holdings.reduce((a,h)=>a+h.weight,0).toFixed(1);` |
| `weightedScore` | `+(holdings.reduce((a,h)=>a+h.composite*h.weight,0)/totalWeight).toFixed(2);` |
| `weightedSpread` | `Math.round(holdings.reduce((a,h)=>a+h.spreadOverlay*h.weight,0)/totalWeight);` |
| `regionBreakdown` | `['Europe','Asia Pacific','North America','Latin America','Middle East','Africa'].map(r=>({` |
| `scored` | `SOVEREIGNS.map(s=>({...s,composite:compositeScore(s)}));` |
| `scenarioScores` | `scored.map(s=>({` |
| `pathways` | `NGFS_SCENARIOS.map(sc=>({` |
| `scored` | `SOVEREIGNS.map(s=>({...s,composite:compositeScore(s),spreadAdj:Math.round((10-compositeScore(s))*9+sr(s.iso.charCodeAt(0)*7+3)*20)}));` |
| `notchMap` | `{'AAA':0,'AA+':1,'AA':2,'AA-':3,'A+':4,'A':5,'A-':6,'BBB+':7,'BBB':8,'BBB-':9,'BB+':10,'BB':11,'BB-':12,'B+':13,'B':14,'B-':15,'CCC+':16};` |
| `ratingNotch` | `scored.map(s=>({...s,notch:notchMap[s.rating]\|\|8,newNotch:Math.min(16,Math.max(0,(notchMap[s.rating]\|\|8)+Math.round((10-s.composite)/3.5)))}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NGFS_SCENARIOS`, `REGIONS`, `SOVEREIGNS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Countries Scored | — | ND-GAIN/NGFS | Sovereign universe with full intelligence scoring across all four dimensions. |
| Highest Risk Score | — | Calculated | Country with the highest composite sovereign climate intelligence score indicating greatest overall vulnerabil |
| Portfolio Avg Score | — | Portfolio weights | AUM-weighted average climate intelligence score across sovereign bond holdings. |
- **ND-GAIN, World Bank, IMF, NGFS scenario data, portfolio sovereign weights** → Multi-pillar scoring, composite aggregation, portfolio weighting → **Sovereign intelligence scores, risk radar charts, portfolio exposure reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Sovereign Climate Intelligence Score
**Headline formula:** `(Physical Risk × 0.35) + (Transition Risk × 0.30) + (Fiscal Vulnerability × 0.20) + (100 – Adaptation Capacity) × 0.15`
**Standards:** ['NGFS Sovereign Risk', 'IMF Climate Macro-Financial', 'ND-GAIN']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).