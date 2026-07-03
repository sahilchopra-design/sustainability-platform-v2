# Vintage Cohort Stranded Engine
**Module ID:** `vintage-cohort-stranded` · **Route:** `/vintage-cohort-stranded` · **Tier:** B (frontend-computed) · **EP code:** EP-CK1 · **Sprint:** CK

## 1 · Overview
20 assets grouped by vintage decade with exponential book value decay and regulatory closure risk.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `Badge`, `COHORTS`, `COHORT_COLORS`, `Card`, `KPI`, `SCENARIOS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Vintage Dashboard','Cohort Comparison','Remaining Book Value','Age-Depreciation Curves','Regulatory Closure Risk','Portfolio Vintage Distribution'];` |
| `decades` | `['pre-2000','2000-2010','2010-2020','post-2020'];` |
| `baseYear` | `dec==='pre-2000'?1990+i%10 : dec==='2000-2010'?2000+i%10 : dec==='2010-2020'?2010+i%10 : 2020+i%4;` |
| `age` | `2026 - baseYear;` |
| `bv0` | `200 + (sr(i * 73 + 21) * 800);` |
| `lambda` | `dec==='pre-2000'?0.08 : dec==='2000-2010'?0.05 : dec==='2010-2020'?0.03 : 0.015;` |
| `buildDecayCurve` | `(asset, years=30) => Array.from({length:years},(_, t)=>({ year:t, bv:Math.round(asset.bv0*Math.exp(-asset.lambda*t)), pct:Math.round(100*Math.exp(-ass` |
| `COHORTS` | `['pre-2000','2000-2010','2010-2020','post-2020'];` |
| `totalBV0` | `filtered.reduce((s,a)=>s+a.bv0,0);` |
| `totalCurrent` | `filtered.reduce((s,a)=>s+a.currentBV,0);` |
| `avgStrandProb` | `filtered.length?filtered.reduce((s,a)=>s+a.strandingProb,0)/filtered.length:0;` |
| `cohortStats` | `useMemo(()=>COHORTS.map(c=>{` |
| `regRisk` | `useMemo(()=>ASSETS.map(a=>({ name:a.name, age:a.age, sector:a.sector, vintage:a.vintage, closureRisk: a.vintage==='pre-2000'?'Critical':a.vintage==='2` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COHORTS`, `COHORT_COLORS`, `SCENARIOS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Assets | — | Demo | Grouped by vintage decade |
| Max Stranding Probability | `Pre-2000 coal` | Model | Near-certain stranding for oldest coal assets |

## 5 · Intermediate Transformation Logic
**Methodology:** Vintage-cohort decay model
**Headline formula:** `BV(t) = BV₀ × exp(-λ(age) × t)`
**Standards:** ['Carbon Tracker', 'IEA']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).