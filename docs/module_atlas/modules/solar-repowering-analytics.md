# Solar Asset Repowering & Life Extension
**Module ID:** `solar-repowering-analytics` · **Route:** `/solar-repowering-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-EC6 · **Sprint:** EC

## 1 · Overview
Solar PV asset repowering and life extension analytics. Models degradation trajectories for aging fleets, quantifies AEP uplift from technology upgrades, evaluates repowering economics, restructures PPA agreements, and provides incremental IRR analysis for capital allocation.

> **Business value:** Used by solar asset managers, institutional owners, project finance banks, and O&M providers to evaluate repowering aging solar fleets and extend productive asset life beyond initial PPA terms.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AEP_UPLIFT_DRIVERS`, `DECOMMISSION_COSTS`, `KPI_CARD`, `OWNERS`, `PPA_RESTRUCTURING`, `PROJECTS`, `STATES_REPOWER`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `vintageYear` | `2008 + Math.round(sr(i * 7) * 8);` |
| `currentCapacityMw` | `20 + Math.round(sr(i * 11) * 280);` |
| `newCapacityMw` | `currentCapacityMw * (1.2 + sr(i * 13) * 0.8);` |
| `aepUpliftPct` | `15 + sr(i * 17) * 20;` |
| `repowerCapex` | `newCapacityMw * (0.55 + sr(i * 19) * 0.20) * 1e6;` |
| `inverterReplaceCost` | `currentCapacityMw * (0.04 + sr(i * 23) * 0.03) * 1e6;` |
| `moduleUpgradeCost` | `newCapacityMw * (0.25 + sr(i * 29) * 0.12) * 1e6;` |
| `remainingPPAyrs` | `2 + Math.round(sr(i * 31) * 12);` |
| `currentAep` | `currentCapacityMw * 0.21 * 8760 / 1000; // GWh` |
| `newAep` | `currentAep * (1 + aepUpliftPct / 100);` |
| `annualRevDelta` | `(newAep - currentAep) * 50 * 1000; // $k (50 $/MWh)` |
| `repowerIrr` | `7.0 + sr(i * 37) * 5.5;` |
| `lifeExtIrr` | `4.5 + sr(i * 41) * 3.5;` |
| `plantAge` | `2026 - vintageYear;` |
| `totalCurrentMw` | `filtered.reduce((s, p) => s + p.currentCapacityMw, 0);` |
| `totalNewMw` | `filtered.reduce((s, p) => s + p.newCapacityMw, 0);` |
| `avgAepUplift` | `filtered.length ? filtered.reduce((s, p) => s + p.aepUpliftPct, 0) / filtered.length : 0;` |
| `avgRepowerIrr` | `filtered.length ? filtered.reduce((s, p) => s + p.repowerIrr, 0) / filtered.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AEP_UPLIFT_DRIVERS`, `DECOMMISSION_COSTS`, `OWNERS`, `PPA_RESTRUCTURING`, `STATES_REPOWER`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual Degradation Rate (%/yr) | `Fit to IV curve measurements` | NREL meta-analysis Jordan et al. 2016 | Year 1 LID 1-3%; subsequent 0.3-0.7%/yr mono-Si; PERC LeTID can increase mid-life degradation. |
| Repowering AEP Uplift (%) | `Uplift = (P_new × tracker_gain) / P_degraded - 1` | Fraunhofer ISE / Wood Mackenzie | Bifacial TOPCon SAT replacing 2008 polycrystalline fixed-tilt can deliver 35% AEP uplift. |
| Incremental IRR (%) | `IRR of (repowering_CAPEX, ΔAEP × price × years)` | Wood Mackenzie Repowering Economics 2023 | Sites with existing grid connection and long remaining land leases have highest incremental returns. |
- **Performance monitoring + degradation models + CAPEX benchmarks** → Degradation trajectory + repowering NPV + PPA restructuring analysis → **Repowering decision: incremental IRR, optimal timing, technology selection, PPA renegotiation**

## 5 · Intermediate Transformation Logic
**Methodology:** Degradation Model & Repowering NPV
**Headline formula:** `P_current = P_initial × (1-d)^age; Repowering_NPV = ΔAEP × PPA_price × life_remaining - repowering_CAPEX`
**Standards:** ['IEC 61724 Solar PV Performance', 'NREL Degradation Rate Meta-Analysis (Jordan 2016)', 'Fraunhofer ISE Repowering Guidelines']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).