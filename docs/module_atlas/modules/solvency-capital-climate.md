# Solvency Capital Climate
**Module ID:** `solvency-capital-climate` · **Route:** `/solvency-capital-climate` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Solvency II climate stress capital requirement analytics quantifying climate-driven changes to Solvency Capital Requirement for insurers under EIOPA climate stress scenarios.

> **Business value:** Quantifies climate-driven Solvency II capital impacts under EIOPA stress scenarios to inform insurer capital planning and ORSA.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENTITIES`, `ENTITY_TYPES`, `FRAMEWORKS`, `JURISDICTIONS`, `KpiCard`, `NCPE_TIERS`, `ORSA_SCENARIOS`, `ORSA_STRESS_MULTS`, `PEER_DOMAIN_SCORES`, `PEER_INSURERS`, `REG_FRAMEWORKS`, `RISK_APPETITE`, `SCR_COLORS`, `SCR_CORR`, `SCR_MODULES`, `TabBtn`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ENTITY_TYPES` | `['Life Insurer','Non-Life Insurer','Reinsurer','Composite','Captive'];` |
| `SCR_MODULES` | `['NatCat','Market Risk','Credit Risk','Operational','Life Underwriting','Health Underwriting','Non-Life Underwriting'];` |
| `scrModules` | `SCR_MODULES.map((_, mi) => +(sr(i * 41 + mi + 1) * 400 + 80).toFixed(0));` |
| `climateLoading` | `+(sr(i * 41 + 8) * 0.4 + 0.05).toFixed(3);` |
| `bscr` | `+Math.sqrt(Math.max(0, bscrSquared)).toFixed(0);` |
| `lacDT` | `+(bscr * (sr(i * 41 + 10) * 0.10 + 0.02)).toFixed(0);` |
| `lacTP` | `+(bscr * (sr(i * 41 + 11) * 0.05 + 0.01)).toFixed(0);` |
| `adjustedSCR` | `Math.max(1, bscr - lacDT - lacTP);` |
| `ownFunds` | `+(adjustedSCR * (sr(i * 41 + 12) * 1.2 + 1.1)).toFixed(0);` |
| `divBenefit` | `+(bscr - adjustedSCR + lacDT + lacTP).toFixed(0);` |
| `framework` | `FRAMEWORKS[Math.floor(sr(i * 41 + 13) * 5)];` |
| `amcr` | `Math.round(sr(i * 41 + 14) * 3000 + 500);` |
| `bmcr` | `Math.round(adjustedSCR * 0.45);` |
| `mcr` | `Math.max(amcr, Math.min(bmcr, adjustedSCR * 0.45));` |
| `PEER_DOMAIN_SCORES` | `PEER_INSURERS.map((n, i) =>` |
| `avgSolvency` | `filtered.reduce((s, e) => s + e.solvencyRatio, 0) / filtered.length;` |
| `avgClimateAdj` | `filtered.reduce((s, e) => s + e.climateAdjSolvencyRatio, 0) / filtered.length;` |
| `avgDiv` | `filtered.reduce((s, e) => s + e.diversificationBenefit, 0) / filtered.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITY_TYPES`, `FRAMEWORKS`, `JURISDICTIONS`, `NCPE_TIERS`, `ORSA_SCENARIOS`, `ORSA_STRESS_MULTS`, `PEER_INSURERS`, `REG_FRAMEWORKS`, `RISK_APPETITE`, `SCR_COLORS`, `SCR_CORR`, `SCR_MODULES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Base SCR Coverage | — | Internal ORSA | Solvency Capital Requirement coverage ratio under standard EIOPA formula pre-climate stress. |
| Climate SCR Delta | — | EIOPA stress model | Estimated increase in SCR under EIOPA 2022 climate stress scenario (orderly transition + physical). |
| Post-Stress Coverage | — | Calculated | SCR coverage ratio after applying EIOPA climate stress scenario shocks to investment and underwriting portfoli |
- **Investment portfolio, underwriting data, EIOPA stress scenario parameters** → SCR recalculation, climate shock application, solvency ratio analysis → **Climate SCR delta reports, solvency waterfall charts, ORSA inputs**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate SCR Delta
**Headline formula:** `SCR_stressed – SCR_base`
**Standards:** ['EIOPA Climate Stress Test 2022', 'Solvency II Art.101']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).