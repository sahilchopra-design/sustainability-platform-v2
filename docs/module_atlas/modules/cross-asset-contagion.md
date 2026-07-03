# Cross-Asset Contagion
**Module ID:** `cross-asset-contagion` · **Route:** `/cross-asset-contagion` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Models systemic climate risk propagation across asset classes and geographies, capturing second-round contagion effects through financial network linkages, collateral spirals, and macro-financial feedback loops. Supports macro-prudential stress testing and systemic risk assessment for climate scenarios.

> **Business value:** Enables macro-prudential risk teams and central bank stress testers to capture the full systemic impact of climate scenarios beyond individual institution losses, supporting FSAP climate modules and G20 financial stability reporting.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHANNELS`, `LINKS`, `TABS`, `TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,contagionIdx:Math.round(35+sr(i*7)*25+Math.sin(i/` |
| `CHANNELS` | `[{channel:'Credit Spread Contagion',weight:22,speed:3},{channel:'Equity-Bond Correlation',weight:18,speed:1},{channel:'FX Carry Unwind',weight:14,spee` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `stats` | `useMemo(()=>({count:filtered.length,avgContagion:(filtered.reduce((s,r)=>s+r.contagionScore,0)/filtered.length\|\|0).toFixed(0),avgCorr:(filtered.reduce` |
| `driverDist` | `useMemo(()=>{const m={};LINKS.forEach(r=>{m[r.esgDriver]=(m[r.esgDriver]\|\|0)+1;});return Object.entries(m).map(([k,v])=>({name:k,value:v}));},[]);` |
| `strengthDist` | `useMemo(()=>{const m={};LINKS.forEach(r=>{m[r.strength]=(m[r.strength]\|\|0)+1;});return Object.entries(m).map(([k,v])=>({name:k,value:v}));},[]);` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHANNELS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Contagion Amplification Factor | — | BIS/ECB network models | Ratio of total system loss (including contagion) to initial direct shock loss |
| System-Wide Climate VaR (99%) | — | ECB/NGFS | Systemic financial loss as percent of GDP under severe climate scenario with contagion |
| Bank Interconnectedness (HHI) | — | BIS quarterly review | Concentration of interbank exposures; high HHI amplifies contagion speed |
| Sovereign-Bank Nexus Exposure | — | EBA transparency data | Bank holdings of sovereign debt from climate-vulnerable sovereigns |
| Contagion Network Diameter | — | Network analysis | Average shortest path for climate shock to propagate across the financial system network |
- **BIS/ECB interbank exposure data** → Build adjacency matrix w_ij from bilateral exposures → **Financial network topology**
- **NGFS scenario direct shocks per asset class** → Initialise shock vector, run iterative propagation model → **Contagion trajectory per node and time step**
- **Fire-sale price impact models** → Model asset-specific price depression from forced sales → **Amplification factor per asset class**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Contagion Network Model
**Headline formula:** `Contagion_i(t) = Direct_shock_i + Σ_j (w_ij × Contagion_j(t-1))`
**Standards:** ['BIS Working Paper 844', 'ECB Financial Stability Review', 'NGFS Systemic Risk Workstream']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).