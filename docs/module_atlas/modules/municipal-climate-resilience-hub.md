# Municipal Climate Resilience Investment Hub
**Module ID:** `municipal-climate-resilience-hub` · **Route:** `/municipal-climate-resilience-hub` · **Tier:** B (frontend-computed) · **EP code:** EP-DY4 · **Sprint:** DY

## 1 · Overview
Municipal climate resilience investment planning analytics. Assesses physical risk to municipal assets (roads, buildings, utilities), prioritises adaptation capex, models resilience ROI, and values green infrastructure benefit-cost ratios.

> **Business value:** Provides rigorous municipal climate resilience investment analytics integrating multi-hazard risk scoring, FEMA-methodology BCR calculation, and green infrastructure co-benefit valuation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOND_STRUCTURES`, `CITIES`, `FUNDING_PROGRAMS`, `Kpi`, `RESILIENCE_MEASURES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pvBenefits` | `dr > 0 ? annBenefit * (1 - Math.pow(1 + dr, -lifetime)) / dr : annBenefit * lifetime;` |
| `pvBenefits` | `dr > 0 ? annBenefit * (1 - Math.pow(1 + dr, -lifetime)) / dr : annBenefit * lifetime;` |
| `roi` | `calcResilienceRoi({ investment, avoidedLoss: investment * (city.bcr - 1) });` |
| `totalFunding` | `FUNDING_PROGRAMS.reduce((s, p) => s + p.amount, 0);` |
| `cityRankData` | `[...CITIES].sort((a, b) => b.resilienceScore - a.resilienceScore).map(c => ({` |
| `measureBcrData` | `[...RESILIENCE_MEASURES].sort((a, b) => b.bcr - a.bcr).map(m => ({` |
| `fundingTrend` | `useMemo(() => [2020, 2021, 2022, 2023, 2024, 2025].map((yr, i) => ({` |
| `status` | `['Planning', 'Design', 'Procurement', 'Construction', 'Operational'][Math.floor(sr(i * 17) * 5)];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOND_STRUCTURES`, `CITIES`, `FUNDING_PROGRAMS`, `RESILIENCE_MEASURES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Average Asset Physical Risk Score | `Composite score across flood, heat, drought, and sea-level rise hazards` | RMS / AIR municipal risk model | Scores above 70 require near-term adaptation investment; 50-70 monitor and plan; roadways and utilities typica |
| Adaptation Investment BCR | `Total adaptation benefits PV / adaptation capex PV` | FEMA BCA methodology | FEMA minimum BCR threshold for grant eligibility is 1.0; resilient infrastructure typically 3-6x; nature-based |
| Green Infrastructure Cost Savings | `Green infrastructure cost vs grey infrastructure equivalent at same performance standard` | American Society of Civil Engineers | Green stormwater infrastructure 20-40% cheaper than grey; additional co-benefits in heat reduction, air qualit |
- **Municipal GIS asset database** → Asset locations, conditions, replacement values → physical risk exposure mapping → **Asset-level risk scores**
- **RMS / AIR municipal physical risk models** → Hazard intensity by location and RCP scenario → damage functions and loss estimates → **Avoided damage benefit calculation**
- **FEMA BCA Toolkit / natural hazard loss data** → Damage functions, unit costs, co-benefit valuation → BCR calculation → **Grant application support and investment prioritisation**

## 5 · Intermediate Transformation Logic
**Methodology:** Resilience ROI and Benefit-Cost Analysis
**Headline formula:** `Resilience ROI = (Avoided Damage PV + Co-benefits PV - Adaptation CAPEX PV) / Adaptation CAPEX PV; BCR = Total Benefits / Total Costs`
**Standards:** ['FEMA Benefit-Cost Analysis Reference Guide 2023', 'World Bank CURB Tool for Urban Resilience', 'IPCC AR6 WG2 Chapter 17 — Adaptation Options']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).