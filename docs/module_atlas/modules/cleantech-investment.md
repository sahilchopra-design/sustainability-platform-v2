# CleanTech Investment Analytics
**Module ID:** `cleantech-investment` · **Route:** `/cleantech-investment` · **Tier:** B (frontend-computed) · **EP code:** EP-DF1 · **Sprint:** DF

## 1 · Overview
Evaluates cleantech venture and growth investment opportunities using technology readiness levels (TRL), emissions abatement potential, and market sizing models. Integrates IPCC mitigation pathway demand signals with technology cost curves and first-mover advantage quantification.

> **Business value:** Essential for cleantech venture capital, growth equity, and climate-focused PE funds. Provides systematic scoring framework aligned with IEA Net Zero roadmap, enables portfolio construction across TRL stages, and quantifies abatement impact for Article 9 SFDR impact reporting.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `Card`, `GEOS`, `KpiCard`, `SECTORS`, `SECTOR_META`, `STAGES`, `TABS`, `TRL_DESC`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt0` | `v => Number(v).toLocaleString('en-GB', { maximumFractionDigits: 0 });` |
| `SECTORS` | `['Solar PV', 'Wind', 'Battery Storage', 'Green Hydrogen', 'CCS/CCUS', 'EV & Mobility', 'Smart Grid', 'AgriTech', 'Water Tech', 'Circular Economy'];` |
| `GEOS` | `['North America', 'Europe', 'Asia-Pacific', 'UK', 'LatAm', 'MEA'];` |
| `TRL_DESC` | `{ 1:'Basic Research', 2:'Technology Concept', 3:'Proof of Concept', 4:'Lab Validation', 5:'Pilot Demonstration', 6:'Prototype', 7:'Pre-Commercial', 8:` |
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `stage` | `STAGES[Math.floor(sr(i * 11) * STAGES.length)];` |
| `geo` | `GEOS[Math.floor(sr(i * 13) * GEOS.length)];` |
| `trl` | `Math.floor(2 + sr(i * 17) * 7); // 2–8` |
| `valuation` | `Math.round(10 + sr(i * 19) * 990); // $M` |
| `revenue` | `Math.round(valuation * (0.05 + sr(i * 23) * 0.40));` |
| `capexReq` | `Math.round(5 + sr(i * 29) * 195); // $M funding need` |
| `irr` | `Math.round(8 + sr(i * 31) * 32);  // %` |
| `payback` | `Math.round(3 + sr(i * 37) * 12);  // years` |
| `capacity` | `Math.round(10 + sr(i * 41) * 490); // MW or kt/yr` |
| `abatPot` | `Math.round(capacity * (0.8 + sr(i * 43) * 1.2)); // ktCO₂/yr` |
| `abatCost` | `Math.round(meta.abatCost * (0.7 + sr(i * 47) * 0.6)); // $/tCO₂` |
| `esgScore` | `Math.round(50 + sr(i * 53) * 45);` |
| `patentCnt` | `Math.floor(sr(i * 59) * 80);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GEOS`, `SECTORS`, `STAGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual CleanTech Investment | — | BloombergNEF Energy Transition Investment 2024 | Global clean energy investment exceeded fossil fuel for first time in 2023 |
| Solar Learning Rate | — | IEA 2023 Solar PV Special Report | Solar PV costs have fallen 89% since 2010; BNEF projects further 60% by 2030 |
| Green Hydrogen Cost Target | — | IEA Global Hydrogen Review 2023 | Current green hydrogen cost $3–8/kg; $1/kg target unlocks mass industrial decarbonisation |
- **IEA/BNEF technology cost curves by TRL** → Deployment scenario modelling → **Market size and abatement potential by technology by 2030/2040/2050**
- **Patent and R&D investment data** → Innovation pipeline assessment → **First-mover IP advantage score**
- **IPCC AR6 WGIII mitigation pathway demand signals** → Technology adoption curves → **Required deployment rate vs current trajectory gap**

## 5 · Intermediate Transformation Logic
**Methodology:** CleanTech Investment Score
**Headline formula:** `InvestScore = (TRL/9 × 0.3) + (AbatementPotential/MaxAbatement × 0.3) + (MarketSize/GDP × 0.2) + (CostLearningRate × 0.2)`
**Standards:** ['IEA Net Zero by 2050 Technology Guide', 'BloombergNEF CleanTech Market Sizing', 'IPCC AR6 WGIII Chapter 16 — Innovation', 'Breakthrough Energy Ventures TRL Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `CleanTechAdvancedAnalytics`