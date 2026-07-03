# Water-Food-Energy Nexus Analytics
**Module ID:** `water-food-energy-nexus` · **Route:** `/water-food-energy-nexus` · **Tier:** B (frontend-computed) · **EP code:** EP-DG5 · **Sprint:** DG

## 1 · Overview
Analyses interdependencies between water, food, and energy systems under climate stress. Models nexus risk cascades, cross-sector investment priorities, and integrated resource efficiency opportunities using WEF Global Risk Framework and UN SDG interlinkages.

> **Business value:** Critical for sovereign debt analysts assessing political stability risk in water/food-stressed emerging markets, multilateral development banks prioritising nexus investments, and commodity traders modelling supply chain disruption. Provides integrated WEF/UN SDG-aligned nexus risk framework.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ADAPT_MEASURES`, `BASINS`, `KpiCard`, `NEXUS_YEARS`, `SSP_SCENARIOS`, `STRESS_SCENARIOS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Overview', 'Water Stress', 'Energy-Food', 'Irrigation', 'Nexus Risk', 'Stress Tests', 'Adaptation'];` |
| `regions` | `['All', ...new Set(BASINS.map(b => b.region))];` |
| `frac` | `(yr - 2020) / 30;` |
| `adaptData` | `useMemo(() => ADAPT_MEASURES.map(m => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADAPT_MEASURES`, `NEXUS_YEARS`, `SSP_SCENARIOS`, `STRESS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Water-Food Nexus Risk | — | WRI AQUEDUCT 2023 | 40% of the global population will live in water-scarce areas by 2030 — directly threatening food production |
| Energy for Water | — | IEA Water-Energy Nexus 2023 | Water treatment and distribution consume 4% of global electricity — rising with desalination |
| Food System Water Use | — | FAO AQUASTAT 2022 | Agriculture accounts for 70% of global freshwater withdrawals — primary driver of water stress |
- **WRI AQUEDUCT basin-level water stress data** → Nexus stress calculation → **Country/basin nexus stress index by scenario and decade**
- **FAO food production and import dependency data** → Food security analysis → **Food import vulnerability index for water-scarce nations**
- **IEA energy access and water-energy intensity data** → Cross-sector cascade modelling → **System-level stress propagation under compound climate shock**

## 5 · Intermediate Transformation Logic
**Methodology:** Nexus Stress Index
**Headline formula:** `NexusStress = w_W × WaterStress + w_F × FoodInsecurity + w_E × EnergyAccess; CascadeRisk = max(WaterStress, FoodInsecurity, EnergyAccess) × CorrelationCoeff`
**Standards:** ['WEF Global Risks Report 2024', 'UN SDG 2/6/7 Interlinkage Framework', 'WRI AQUEDUCT Food + Water + Energy', 'IPCC AR6 WGII Chapter 5']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).