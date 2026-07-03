# Climate-Smart Infrastructure Finance
**Module ID:** `climate-smart-infrastructure` · **Route:** `/climate-smart-infrastructure` · **Tier:** B (frontend-computed) · **EP code:** EP-EI6 · **Sprint:** EI

## 1 · Overview
Infrastructure resilience analytics: 6 sectors with climate risk and adaptation BCR, 22 projects including coastal barriers/urban cooling/NbS drainage, IFC Performance Standards PS 1–8, 6 climate finance funds (GCF/Adapt/IFC/AIIB/EU GG/WB), and long-horizon IRR comparison (5–50yr).

> **Business value:** Used by infrastructure investors evaluating climate-resilient projects, DFI project teams applying IFC performance standards, and government adaptation planners prioritising resilience investments.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ADAPT_RETURNS`, `IFC_STANDARDS`, `INFRA_SECTORS`, `KpiCard`, `PROJECTS`, `Pill`, `TABS`

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADAPT_RETURNS`, `IFC_STANDARDS`, `INFRA_SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Adaptation infrastructure BCR (avg) | `Across World Bank 2022 project portfolio` | World Bank Adaptation Finance Review 2022 | Average $1 invested in adaptation returns $6.10 in avoided losses; early warning systems show highest BCR (12– |
| GCF adaptation window | `Of GCF portfolio allocated to adaptation` | GCF Resource Mobilisation 2024 | GCF 50% allocation target for adaptation; SIDS/LDCs prioritised; grant element up to 100% for most vulnerable  |
| IFC PS 4 involuntary resettlement | `At replacement value for affected persons` | IFC Performance Standard 4 2012 | PS 4 requires livelihood restoration to pre-project level; non-compliance triggers E&S action plan and can del |
- **IFC PS 2012 + GCF Framework + Adaptation Fund + AIIB CSF + World Bank GBs + UNEP Adaptation Gap** → Sector analytics + project pipeline + IFC PS table + long-horizon IRR + climate finance guide → **Infrastructure investors, DFI project teams, MDB climate finance officers, and government adaptation planners**

## 5 · Intermediate Transformation Logic
**Methodology:** Adaptation BCR
**Headline formula:** `BCR = Σ(PV_Benefits) / Σ(PV_Costs); NbS_BCR = (FloodLossAvoided + EcosystemServices + CarbonValue) / (CapEx + OpEx + LandCost); Long_Horizon_IRR solves NPV=0 over 25–50yr period`
**Standards:** ['UNEP Adaptation Gap Report 2023', 'IFC Performance Standards 2012', 'World Bank Green Bonds Adaptation Framework 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).