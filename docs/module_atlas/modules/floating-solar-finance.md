# Floating Solar (FPV) Project Finance
**Module ID:** `floating-solar-finance` · **Route:** `/floating-solar-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EC2 · **Sprint:** EC

## 1 · Overview
Floating photovoltaic (FPV) project finance analytics. Covers water body suitability, panel cooling benefit quantification, evaporation water savings, structural premium economics, and project finance for reservoir, lake, and irrigation canal installations.

> **Business value:** Used by solar IPPs, infrastructure funds, water utilities, and irrigation authorities evaluating FPV deployment on reservoirs and canals where land is scarce and water conservation is valued.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ANCHORING_SYSTEMS`, `COST_COMPONENTS`, `COUNTRIES_FPV`, `COUNTRY_PIPELINE`, `KPI_CARD`, `PROJECTS`, `TABS`, `WATER_BODY_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `capacityMw` | `1 + Math.round(sr(i * 7) * 199);` |
| `coveragePct` | `5 + sr(i * 11) * 20;` |
| `evaporationSavingML` | `capacityMw * (3 + sr(i * 13) * 7);` |
| `coolingBoostPct` | `2 + sr(i * 17) * 3;` |
| `structuralPremiumPct` | `15 + sr(i * 19) * 10;` |
| `lcoe` | `42 + sr(i * 23) * 28;` |
| `irrPct` | `6.0 + sr(i * 29) * 6.5;` |
| `waterBodyAreaHa` | `capacityMw * (4 + sr(i * 31) * 3) / coveragePct * 100;` |
| `totalMw` | `filtered.reduce((s, p) => s + p.capacityMw, 0);` |
| `avgLcoe` | `filtered.length ? filtered.reduce((s, p) => s + p.lcoe, 0) / filtered.length : 0;` |
| `avgIrr` | `filtered.length ? filtered.reduce((s, p) => s + p.irrPct, 0) / filtered.length : 0;` |
| `totalEvapSaving` | `filtered.reduce((s, p) => s + p.evaporationSavingML, 0);` |
| `avgCoolingBoost` | `filtered.length ? filtered.reduce((s, p) => s + p.coolingBoostPct, 0) / filtered.length : 0;` |
| `avgStructuralPremium` | `filtered.length ? filtered.reduce((s, p) => s + p.structuralPremiumPct, 0) / filtered.length : 0;` |
| `baseRevM` | `p.capacityMw * 0.15 * 8760 * 55 / 1e6;` |
| `coolingBonusM` | `p.aepBoostGwh * 55 / 1e3;` |
| `waterCreditM` | `p.evaporationSavingML * 0.15 / 1e3;` |
| `structuralCostData` | `COST_COMPONENTS.map(c => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ANCHORING_SYSTEMS`, `COST_COMPONENTS`, `COUNTRIES_FPV`, `COUNTRY_PIPELINE`, `TABS`, `WATER_BODY_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cooling AEP Boost (%) | `ΔP = P_STC × γ × (T_land - T_FPV)` | IEA PVPS Task 13 FPV study | Temperature coefficient γ ≈ -0.35%/°C; FPV panels run 5-10°C cooler, yielding 1.7-3.5% output boost. |
| Evaporation Savings (m³/yr/ha) | `A_covered × ET_rate × shade_factor` | FAO Penman-Monteith | In arid regions, evaporation savings valued at $0.5-2/m³, providing significant dual benefit. |
| Structural CAPEX Premium (%) | `(CAPEX_FPV - CAPEX_land) / CAPEX_land` | World Bank ESMAP 2022 | Partly offset by no land lease and reduced O&M (cooler panels, less dust). |
- **Water body GIS + irradiance + evaporation rate + structural costs** → FPV yield model (cooling + evap savings) + project finance DSCR → **FPV project LCOE, IRR, NPV and bankability assessment**

## 5 · Intermediate Transformation Logic
**Methodology:** FPV Cooling Benefit & Evaporation Savings
**Headline formula:** `LCOE_FPV = LCOE_land × (1 + structural_premium) - cooling_benefit; Evap_savings = A_covered × ET_rate × shade_factor`
**Standards:** ['IEA PVPS FPV Roadmap 2022', 'World Bank ESMAP FPV Technical Guidance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).