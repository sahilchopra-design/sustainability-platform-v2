# Waste-to-Energy & Biogas Finance
**Module ID:** `waste-to-energy-biogas-finance` · **Route:** `/waste-to-energy-biogas-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EJ3 · **Sprint:** EJ

## 1 · Overview
8 WtE/AD/gasification/biomethane technologies with LCOE/CAPEX/efficiency/gate fee matrix, 22 project pipeline with IRR and gearing, revenue stream analytics, project economics calculator, 25-year cash flow model, and policy support landscape.

> **Business value:** Used by WtE project developers structuring project finance, infrastructure investors screening AD and EfW deals, and green bond issuers preparing EU Taxonomy WtE use-of-proceeds documentation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CF_DATA`, `IRREVOL_CHART`, `KpiCard`, `POLICY_DATA`, `PROJECTS`, `Pill`, `REVENUE_STREAMS`, `TABS`, `TECHNOLOGIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annualRevenue` | `(capacityMW * 8760 * 0.85 * electricityPrice / 1e6 + capacityMW * 1.8 * gateFeeSel / 1000).toFixed(2);` |
| `estimatedIRR` | `Math.min(18, Math.max(5, (gateFeeSel / 10 + electricityPrice / 50))).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `POLICY_DATA`, `REVENUE_STREAMS`, `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| AD project gate fee (EU avg) | `Mixed food and organic waste` | Eunomia WtE Cost Survey 2023 | Gate fee is primary revenue driver for AD and EfW; rising landfill tax in UK (£126/t 2024) widens gate fee adv |
| Biomethane injection premium | `EU average green gas tariff 2024` | Gas for Climate 2023 Biomethane Tracker | Biomethane injection commands 2–3× raw biogas value due to gas grid access, SDE++ subsidy, and green gas certi |
| ROC for AD (UK) | `Renewable Obligation Certificate banding` | UK BEIS RO Banding Review 2022 | AD receives 0.5 ROC/MWh under grandfathered RO; new builds access CfD at £195/MWh for eligible biomass/biogas; |
- **EU ETS + UK ROC/CfD + SDE++ + EEG 2023 + IRA §45 + LCFS + EU Taxonomy Art. 13.1 DNSH** → Technology matrix + project pipeline + economics calculator + 25yr CF model + policy support table → **WtE project developers, infrastructure investors, green bond structurers, and project finance lenders**

## 5 · Intermediate Transformation Logic
**Methodology:** WtE Project IRR
**Headline formula:** `Revenue = GateFee × TonnagePA + ElectricityPrice × Capacity × CF × 8760 + HeatRevenue + REC_Value; DSCR = EBITDA / DebtService; Equity_IRR solves NPV_equity=0; LCOE = (CapEx × FCR + OpEx) / (Capacity × CF × 8760)`
**Standards:** ['EU ETS (EfW inclusion 2026)', 'UK ROC/CfD for AD/EfW', 'IRENA Bioenergy Finance Review 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).