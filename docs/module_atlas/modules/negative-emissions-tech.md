# Negative Emissions Tech
**Module ID:** `negative-emissions-tech` · **Route:** `/negative-emissions-tech` · **Tier:** B (frontend-computed) · **EP code:** EP-CL5 · **Sprint:** CL

## 1 · Overview
6 NETs (DAC, BECCS, enhanced weathering, ocean CDR, biochar, soil carbon) with cost trajectories and portfolio builder.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `KPI`, `NETS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['NETs Overview','DAC Cost Trajectory','BECCS Viability','Enhanced Weathering','Ocean-Based CDR','NET Portfolio Builder'];` |
| `totalScalability` | `NETS.reduce((s,n)=>s+n.scalability,0);` |
| `avgCost2030` | `Math.round(NETS.reduce((s,n)=>s+n.cost2030,0)/NETS.length);` |
| `totalPct` | `portfolioAlloc.reduce((s,a)=>s+a,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NETs | — | IPCC | DAC, BECCS, ERW, ocean CDR, biochar, soil carbon |
| DAC Cost (current) | — | IEA CCUS | Expected to reach $100-200 by 2040 |

## 5 · Intermediate Transformation Logic
**Methodology:** NET portfolio optimization
**Headline formula:** `Minimize: Σ(cost_i × qty_i) subject to: Σ(qty_i) ≥ target, permanence_i ≥ min`
**Standards:** ['IPCC AR6 WGIII Ch.12', 'IEA CCUS']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).