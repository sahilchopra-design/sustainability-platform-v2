# Gas Network Decarbonisation Finance
**Module ID:** `gas-network-decarbonisation` · **Route:** `/gas-network-decarbonisation` · **Tier:** B (frontend-computed) · **EP code:** EP-EL4 · **Sprint:** EL

## 1 · Overview
Decarbonisation pathway analysis for 8 European gas DSOs/TSOs (UK/France/Belgium/Netherlands/Germany), H2 blending economics (0–20% cost/emission/HHV curves), biomethane injection pipeline (6 projects), stranded asset NPV modelling at 2030/2035/2040 horizons, gas demand forecasting by scenario (baseline/H2 blend/biomethane/electrification), and network H2-readiness scorecard.

> **Business value:** Used by gas network investors assessing stranded asset risk, infrastructure debt teams evaluating H2 capex regulatory treatment, and energy transition advisors structuring green finance for gas-to-hydrogen conversion programmes.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BIOMETHANE_PIPELINE`, `BLENDING_ECONOMICS`, `DEMAND_FORECAST`, `H2_PATHWAYS`, `KpiCard`, `NETWORKS`, `Pill`, `RADAR_READINESS`, `STRANDED_ASSET`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `declineRate` | `network.demand_decline / 100;` |
| `totalRAB` | `useMemo(() => NETWORKS.reduce((s,n)=>s+n.rab,0),[]);` |
| `avgH2Ready` | `useMemo(() => (NETWORKS.reduce((s,n)=>s+n.hydrogen_ready,0)/NETWORKS.length*100).toFixed(0),[]);` |
| `totalBiomethane` | `useMemo(() => NETWORKS.reduce((s,n)=>s+n.biomethane_injection,0).toFixed(1),[]);` |
| `avgDecline` | `useMemo(() => (NETWORKS.reduce((s,n)=>s+n.demand_decline,0)/NETWORKS.length).toFixed(1),[]);` |
| `blendPoint` | `BLENDING_ECONOMICS.find(b => b.h2_pct === (Math.round(h2Blend/2)*2)) \|\| BLENDING_ECONOMICS[5];` |
| `totalStranded` | `STRANDED_ASSET.reduce((s,n) => s+n[strandedKey], 0);` |
| `score` | `Math.round(n.hydrogen_ready*40 + n.h2_blend_max/20*20 + n.biomethane_injection/5.2*20 + (3-n.demand_decline)/3*20);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BIOMETHANE_PIPELINE`, `H2_PATHWAYS`, `NETWORKS`, `RADAR_READINESS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| UK biomethane grid injection (2023) | `Injected into the gas distribution network` | GGSS/National Grid ESO 2023 | Target: 35 TWh/yr by 2030 per UK Biomass Strategy; requires 600+ new AD/landfill/WWTP connections; grid inject |
| European H2 backbone (2040) | `Planned pure-H2 pipeline network across Europe` | European Hydrogen Backbone Report 2022 | 70% repurposed existing gas pipelines; 30% new build; Gasunie, Fluxys, Enagás as anchor TSOs; €80–143Bn total  |
| Gas demand decline (UK heating) | `Structural decline from heat pump uptake and efficiency` | National Grid FES 2023 — Leading the Way scenario | UK Climate Compatibility Checkpoint: no new gas boilers after 2035; gas demand for heating to fall 85% by 2050 |
- **Ofgem RIIO-GD2 + EU Hydrogen Strategy + UK H2 Strategy + HydrogenEurope EHB + BEIS Biomass Strategy + NGN annual report + GRTgaz transition plan** → 8-network RAB comparison + pathway analysis + H2 blending economics + demand forecasting + stranded asset model + biomethane pipeline + readiness scorecard → **Gas network investors assessing transition risk, infrastructure debt teams modelling regulatory treatment of H2 capex, and energy transition advisors structuring JETP/green finance for gas network decarbonisation**

## 5 · Intermediate Transformation Logic
**Methodology:** H2 Blending Economics & Stranded Asset NPV
**Headline formula:** `Blend_Cost_Uplift = H2_Pct × (H2_Price − CH4_Price) / Gas_LHV_Mix; HHV_Reduction = H2_Pct × 0.37; Biomethane_IRR = Σ(Tariff × GWh_t) / (1+r)^t − Capex; Stranded_NPV = Σ(RAB_decline_t × WACC) / (1+r)^t; Network_Readiness = 0.40×H2_Material + 0.20×Blend_Approved + 0.20×Biomethane + 0.20×Demand_Retention`
**Standards:** ['Ofgem RIIO-GD2 Price Control 2021–2026', 'EU Hydrogen Strategy COM/2020/301', 'UK Hydrogen Strategy 2021 (BEIS)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).