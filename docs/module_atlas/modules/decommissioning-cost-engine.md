# Decommissioning Cost Engine
**Module ID:** `decommissioning-cost-engine` · **Route:** `/decommissioning-cost-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-CK4 · **Sprint:** CK

## 1 · Overview
8 asset types with unit decommissioning costs, funding gap analysis, and regulatory bond requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_TYPES`, `Badge`, `Card`, `JURISDICTIONS`, `KPI`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `costs` | `useMemo(()=>ASSET_TYPES.map(a=>({...a,estimated:calcCost(a,costScenario),inflated:Math.round(calcCost(a,costScenario)*Math.pow(1+inflationRate/100,pla` |
| `totalEstimated` | `costs.reduce((s,c)=>s+c.estimated,0);` |
| `totalProvision` | `costs.reduce((s,c)=>s+c.provision,0);` |
| `totalGap` | `Math.max(0,totalEstimated-totalProvision);` |
| `totalInflated` | `costs.reduce((s,c)=>s+c.inflated,0);` |
| `timelineData` | `useMemo(()=>Array.from({length:20},(_, i)=>{ const yr=2026+i; return { year:yr, cumCost:Math.round(totalEstimated*(1-Math.exp(-0.15*(i+1)))*Math.pow(1` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_TYPES`, `JURISDICTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total Liability | `Portfolio aggregate` | Model | Across all 8 asset types |
| Funding Gap | `Liability - Provision` | Model | 38% underfunded |

## 5 · Intermediate Transformation Logic
**Methodology:** Decommissioning liability estimation
**Headline formula:** `Liability = Units × CostPerUnit; Gap = Liability - CurrentProvision`
**Standards:** ['National regulations', 'IEA']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).