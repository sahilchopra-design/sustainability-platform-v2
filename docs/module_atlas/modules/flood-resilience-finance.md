# Flood Resilience Finance
**Module ID:** `flood-resilience-finance` · **Route:** `/flood-resilience-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EK1 · **Sprint:** EK

## 1 · Overview
10-city flood risk exposure (Jakarta/Mumbai/NYC/Shanghai/Miami), BCR screener for 8 intervention types (barriers/NbS/managed retreat/EWS), return period loss under RCP 2.6/4.5/8.5, AAL trend 2025–2034, and blended finance structures (green bond/parametric/CAT DDO/MDB).

> **Business value:** Used by DFI project teams structuring flood resilience infrastructure finance, sovereign risk managers pricing adaptation bonds, and municipal planners prioritising BCR-optimal interventions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AAL_TREND`, `FINANCE_DATA`, `FLOOD_RISKS`, `INTERVENTIONS`, `KpiCard`, `LOSS_SCENARIOS`, `Pill`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sortedCities` | `useMemo(() => [...FLOOD_RISKS].sort((a, b) => b[sortField] - a[sortField]), [sortField]);` |
| `totalAnnualLoss` | `FLOOD_RISKS.reduce((a, b) => a + b.annualLoss, 0);` |
| `avgBCR` | `INTERVENTIONS.reduce((a, b) => a + b.exampleBCR, 0) / INTERVENTIONS.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FINANCE_DATA`, `FLOOD_RISKS`, `INTERVENTIONS`, `LOSS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global annual flood loss (2024) | `Average annual economic loss from flooding` | UNEP Adaptation Gap Report 2023 | Flood accounts for 44% of all natural disaster economic loss; increasing 4–5% annually with climate change and |
| Jakarta annual loss | `Annual average flood loss` | World Bank Jakarta Resilience Study 2023 | Jakarta faces compounding risks: coastal flooding + subsidence (2.5cm/yr) + urban pluvial; managed retreat + c |
| UNEP Adaptation Finance Gap | `Adaptation finance gap 2030 estimate` | UNEP Adaptation Gap Report 2023 | Developing countries need $215–387Bn/yr by 2030; current adaptation finance from MDBs ~$21Bn/yr; 10:1 gap rati |
- **UNEP Adaptation Gap Report + IPCC AR6 + World Bank GFDRR + CCRIF + ICMA Green Bond Principles + CBI Adaptation Finance Criteria** → City exposure table + BCR screener + loss modelling + AAL trend + blended finance guide → **DFI project teams, sovereign risk managers, municipal adaptation planners, and climate insurance structurers**

## 5 · Intermediate Transformation Logic
**Methodology:** Annual Average Loss & BCR
**Headline formula:** `AAL = Σ(P_exceedance × Loss_returnperiod) × dP; BCR = PV_LossAvoided / (CapEx + PV_OpEx); NbS_BCR = (FloodLoss + EcoServices + CarbonValue) / TotalCost; Adaptation_IRR solves NPV=0 over asset life`
**Standards:** ['UNEP Adaptation Gap Report 2023', 'World Bank GFDRR 2023', 'IPCC AR6 WG2 Chapter 10 Cities']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).