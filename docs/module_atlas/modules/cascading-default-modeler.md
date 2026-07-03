# Cascading Default Modeler
**Module ID:** `cascading-default-modeler` · **Route:** `/cascading-default-modeler` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Network-based credit contagion model where one company default triggers counterparty distress. Climate shocks as exogenous triggers with sector correlation matrix.

> **Business value:** Climate-driven credit events are not independent — they hit sectors simultaneously and propagate through supply chain and financial networks. This module quantifies the systemic amplification of climate shocks, identifying which companies are cascade hubs requiring heightened supervisory attention.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CHAIN_STEPS`, `CONC_LIMITS`, `Card`, `ENTITIES`, `KPI`, `SECTORS_AGG`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CONC_LIMITS` | `SECTORS_AGG.map((s,i)=>({ sector:s, currentExposure:ENTITIES.filter(e=>e.sector===s).reduce((a,e)=>a+e.exposure,0), limit:5000+i*500, utilization:0 })` |
| `totalExposure` | `ENTITIES.reduce((s,e)=>s+e.exposure,0);` |
| `totalCapHit` | `ENTITIES.reduce((s,e)=>s+e.capitalHit,0);` |
| `avgCoVaR` | `ENTITIES.reduce((s,e)=>s+e.deltaCoVaR,0)/Math.max(1,ENTITIES.length);` |
| `cascadeData` | `useMemo(()=>CHAIN_STEPS.map(s=>({...s,lossAccum:Math.round(s.lossAccum*severity*(carbonPrice/120))})),[severity,carbonPrice]);` |
| `loanLoss` | `useMemo(()=>ENTITIES.map(e=>({...e,el:Math.round(e.exposure*e.pd*e.lgd*severity),uel:Math.round(e.exposure*e.pd*e.lgd*severity*2.5)})),[severity]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHAIN_STEPS`, `ENTITIES`, `SECTORS_AGG`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Entities | — | Network | Nodes in corporate network |
| Cascade Rounds | — | Simulation | Contagion propagation rounds before equilibrium |
| Systemic Loss | — | Model | Total losses from cascade vs primary default only |
- **Corporate network topology** → Climate shock application → **Initial default probabilities**
- **Default probabilities** → Contagion propagation → **Cascade loss estimates**
- **Network losses** → Systemic risk quantification → **Capital adequacy assessment**

## 5 · Intermediate Transformation Logic
**Methodology:** Network contagion with climate triggers
**Headline formula:** `P(contagion) = 1 - ∏(1 - P(default_i) × Connectivity_ij)`
**Standards:** ['Eisenberg-Noe (2001)', 'NGFS']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).