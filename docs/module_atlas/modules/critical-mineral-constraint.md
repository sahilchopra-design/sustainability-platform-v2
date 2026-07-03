# Critical Mineral Constraint Engine
**Module ID:** `critical-mineral-constraint` · **Route:** `/critical-mineral-constraint` · **Tier:** B (frontend-computed) · **EP code:** EP-CL1 · **Sprint:** CL

## 1 · Overview
8 minerals with supply-demand gap projections, price spike scenarios, substitution elasticity, and recycling penetration curves.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `KPI`, `MINERALS`, `PIPELINE`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Supply-Demand Balance','Price Spike Scenarios','Substitution Elasticity','Recycling Penetration','Geopolitical Supply Shock','Mining Pipeline'];` |
| `projections` | `(m) => [2025,2028,2030,2035,2040].map(yr=>{` |
| `supply` | `yr===2025?m.supply2025:Math.round(m.supply2025*(1+0.04*(yr-2025)));` |
| `deficitMinerals` | `MINERALS.filter(m=>m.demand2030>m.supply2025*1.2).length;` |
| `avgChinaShare` | `Math.round(MINERALS.reduce((s,m)=>s+m.chinaShare,0)/MINERALS.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MINERALS`, `PIPELINE`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Minerals | — | USGS | Critical for energy transition |
| China Processing Share | — | USGS | Dominant processing concentration |

## 5 · Intermediate Transformation Logic
**Methodology:** Supply-demand balance model
**Headline formula:** `Gap = Demand(t) - Supply(t); Demand = Σ_sector[Deployment × Intensity]`
**Standards:** ['USGS', 'IEA Critical Minerals']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).