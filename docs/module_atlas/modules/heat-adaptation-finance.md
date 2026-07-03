# Heat Adaptation Finance
**Module ID:** `heat-adaptation-finance` · **Route:** `/heat-adaptation-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EK2 · **Sprint:** EK

## 1 · Overview
8-city urban heat analytics (Phoenix/Delhi/Dubai/Karachi/Miami), 7 urban cooling solutions with temperature reduction and BCR, labour productivity loss by warming scenario (ILO), health cost trend, 6-segment investment map, and green bond / SLB finance structures.

> **Business value:** Used by city bond issuers financing urban cooling infrastructure, infrastructure investors screening heat adaptation markets, and corporate HR teams quantifying labour productivity loss under climate scenarios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `HEAT_HEALTH_COST`, `INVESTMENT_SEGMENTS`, `KpiCard`, `PRODUCTIVITY_IMPACT`, `Pill`, `SOLUTIONS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sortedCities` | `useMemo(() => [...CITIES].sort((a, b) => b[sortCity] - a[sortCity]), [sortCity]);` |
| `totalGdpRisk` | `CITIES.reduce((a, b) => a + b.gdpAtRisk, 0);` |
| `avgHeatDays2050` | `CITIES.reduce((a, b) => a + b.heatDays2050, 0) / CITIES.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `INVESTMENT_SEGMENTS`, `SOLUTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global heat mortality (2024) | `Deaths attributable to heat (Lancet 2023)` | Lancet Countdown Indicator 1.1 2023 | Heat mortality up 68% since 1990–2000 baseline; elderly (>65) account for 72% of deaths; coastal and tropical  |
| Labour productivity loss (2°C) | `Global annual economic loss (ILO)` | ILO Heat and Human Performance Report 2019 | Agriculture (68% outdoor) and construction (60% outdoor) most exposed; tropical LMICs bear disproportionate bu |
| District cooling CAGR | `Market growth 2024–2030` | IEA District Cooling Market Report 2023 | District cooling more energy-efficient than distributed AC; Dubai covers 90% of commercial space; Abu Dhabi, S |
- **ILO 2019 + Lancet 2023 + IEA District Cooling + EU Taxonomy Art 7.4 + CBI ARC + GCF Adaptation + AIIB UCCRTF** → City analytics + solution comparison + productivity loss chart + investment map + finance structures → **Urban planners, city bond issuers, infrastructure investors, and corporate heat risk analysts**

## 5 · Intermediate Transformation Logic
**Methodology:** Urban Heat Economic Loss
**Headline formula:** `Labour_Loss = WorkHours_lost × AvgWage × WorkforceSize; GDP_Impact = Labour_Loss + Healthcare_Cost + CapitalImpairment; BCR_Cooling = (Labour_Gain + Health_Saving + Energy_Saving) / (CapEx + PV_OpEx); CAGR_opportunity = ((Market_2030 / Market_2024)^(1/6) − 1)`
**Standards:** ['ILO Heat Stress and Productivity 2019', 'Lancet Countdown on Health 2023', 'EU Taxonomy Art. 7.4 Urban Heat']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).