# Internal Carbon Price
**Module ID:** `internal-carbon-price` · **Route:** `/internal-carbon-price` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Supports the design and calibration of shadow and internal carbon prices aligned with SBTi, TCFD, and IPCC social cost of carbon guidance. Embeds carbon cost into capital allocation, project appraisal, and procurement decisions to accelerate decarbonisation investment. Tracks ICP adoption across portfolio companies and benchmarks against regulatory price floors.

> **Business value:** Enables CFOs and sustainability officers to embed a credible carbon cost into strategic planning, ensuring capital allocation is consistent with Paris-aligned decarbonisation pathways and TCFD scenario disclosure requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `KpiCard`, `PIE_COLORS`, `Row`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `TABS` | `['ICP Mechanism Design', 'Scope Cost Allocation', 'Carbon Budget Tracking', 'Abatement Cost Curve', 'Net-Zero Economics'];` |
| `years` | `Array.from({ length: 27 }, (_, i) => 2024 + i);` |
| `trajectoryData` | `years.map((yr, i) => ({` |
| `buCostData` | `buUnits.map(u => ({` |
| `remainingBudget` | `Math.round(budgetData[budgetData.length - 1].budget - budgetData[budgetData.length - 1].actual);` |
| `npvTotal` | `nzeWaterfall.filter(d => d.value !== 0).reduce((s, d) => s + d.value, 0);` |
| `etsShadow` | `years.slice(0, 15).map((yr, i) => ({` |
| `gap` | `sbtiMin15 - currentICP;` |
| `totalCarbonCost` | `buCostData.reduce((s, u) => s + u.scope1Cost + u.scope2Cost + u.scope3Cost, 0);` |
| `totalEbitda` | `buUnits.reduce((s, u) => s + u.ebitda, 0);` |
| `pctEbitda` | `((totalCarbonCost / totalEbitda) * 100).toFixed(1);` |
| `annualReductionRequired` | `Math.round((budgetData[budgetData.length - 1].actual - 200) / (2030 - 2030 + 1));` |
| `exhaustionYear` | `2028 + Math.round(seed(301) * 3);` |
| `cumulativeAbatement` | `macMeasures.reduce((s, m) => s + m.abatement, 0);` |
| `irr` | `(Math.round(seed(401) * 8 + 12)).toFixed(1);` |
| `paybackYrs` | `(Math.round(seed(402) * 4 + 6)).toFixed(1);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/internal-carbon-price/design-mechanism` | `design_mechanism` | api/v1/routes/internal_carbon_price.py |
| POST | `/api/v1/internal-carbon-price/scope-cost-allocation` | `scope_cost_allocation` | api/v1/routes/internal_carbon_price.py |
| POST | `/api/v1/internal-carbon-price/carbon-budget-tracking` | `carbon_budget_tracking` | api/v1/routes/internal_carbon_price.py |
| POST | `/api/v1/internal-carbon-price/nze-economics` | `nze_economics` | api/v1/routes/internal_carbon_price.py |
| POST | `/api/v1/internal-carbon-price/ets-shadow-exposure` | `ets_shadow_exposure` | api/v1/routes/internal_carbon_price.py |
| POST | `/api/v1/internal-carbon-price/full-assessment` | `full_assessment` | api/v1/routes/internal_carbon_price.py |
| GET | `/api/v1/internal-carbon-price/ref/mechanism-types` | `ref_mechanism_types` | api/v1/routes/internal_carbon_price.py |
| GET | `/api/v1/internal-carbon-price/ref/sbti-guidance` | `ref_sbti_guidance` | api/v1/routes/internal_carbon_price.py |
| GET | `/api/v1/internal-carbon-price/ref/ets-price-trajectory` | `ref_ets_price_trajectory` | api/v1/routes/internal_carbon_price.py |
| GET | `/api/v1/internal-carbon-price/ref/abatement-benchmarks` | `ref_abatement_benchmarks` | api/v1/routes/internal_carbon_price.py |

### 2.3 Engine `internal_carbon_price_engine` (services/internal_carbon_price_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `InternalCarbonPriceEngine.design_icp_mechanism` | entity_id, mechanism_type, target_year, sbti_target, current_icp | Design an internal carbon pricing mechanism and check SBTi alignment. |
| `InternalCarbonPriceEngine.calculate_scope_cost_allocation` | entity_id, scope1_tco2, scope2_tco2, scope3_tco2, icp_eur, ebitda_m | Allocate carbon costs across Scope 1/2/3 at the given ICP. |
| `InternalCarbonPriceEngine.track_carbon_budget` | entity_id, base_year, base_year_emissions_tco2, sbti_target, current_year, actual_emissions_tco2 | Track carbon budget against SBTi target trajectory. |
| `InternalCarbonPriceEngine.build_abatement_cost_curve` | entity_id, sector, current_emissions_tco2, target_reduction_pct, max_capex_m | Build a marginal abatement cost (MAC) curve for the entity. |
| `InternalCarbonPriceEngine.calculate_nze_economics` | entity_id, revenue_m, sector, current_emissions_tco2, nze_year, discount_rate | Calculate net-zero economics: NZE capex, opex savings, NPV, IRR, payback. |
| `InternalCarbonPriceEngine.assess_ets_shadow_exposure` | entity_id, eu_ets_verified_tco2, free_allocation_tco2, ets2_fuel_consumption_gj | Calculate EU ETS Phase 4 and ETS2 carbon liability trajectories. |
| `InternalCarbonPriceEngine.run_full_assessment` | entity_id, request_data | Orchestrate all ICP sub-assessments and compute ICP maturity score. |
| `_ets_price_from_trajectory` | year, trajectory |  |
| `_sbti_threshold_for_year` | year | Linear interpolation of SBTi ICP threshold for a given year. |
| `_assign_maturity_tier` | score |  |
| `assess_icp_mechanism` | entity_data | Evaluate ICP mechanism (shadow vs fee), check SBTi minimum price compliance, |
| `compute_scope_carbon_costs` | entity_data, icp_price, trajectory | Calculate S1/S2/S3 carbon costs at given ICP price, project to |
| `model_carbon_budget` | entity_data, scenario | Model remaining Paris-aligned 1.5 °C carbon budget, exhaustion year, |
| `calculate_nze_economics` | entity_data | Calculate NZE investment NPV/IRR/payback and build abatement cost curve by category. |
| `calculate_ets_exposure` | entity_data | Calculate EU ETS Phase 4 free allocation vs verified emissions, ETS2 |
| `run_full_assessment` | entity_data | Orchestrate all E84 sub-methods and produce a consolidated assessment. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Shadow Carbon Price (USD/tCO2e) | — | IEA / Carbon Pricing Leadership Coalition | Ranges reflect 2030 NZE corridor; below $75 insufficient to drive fuel switching |
| Regulatory Price Floor (USD/tCO2e) | — | World Bank Carbon Pricing Dashboard | Applicable ETS or carbon tax rate in operating jurisdiction |
| Implied Abatement Cost | — | Internal project appraisal | Carbon cost embedded in NPV of low-carbon capex projects |
| ICP Coverage (%) | — | CDP 2023 Survey | Proportion of Scope 1+2 emissions subject to an active internal carbon price |
- **EPA / Rennert et al. SCC estimates** → Select damage function and discount rate; apply CPI deflation to target year USD → **Annual SCC central and uncertainty bounds**
- **World Bank Carbon Pricing Dashboard** → Match jurisdiction to operating entity footprint; extract current price and schedule → **Regulatory floor by country and ETS coverage**
- **Internal project pipeline** → Apply ICP to Scope 1+2 tonnes per project; recalculate NPV and IRR → **Carbon-adjusted investment ranking and hurdle rate compliance**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/internal-carbon-price/ref/abatement-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'data', 'ref'], 'n_keys': 4}`

**GET /api/v1/internal-carbon-price/ref/ets-price-trajectory** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'eu_ets_current_eur_t', 'ets2_start_year', 'data', 'ref'], 'n_keys': 5}`

**GET /api/v1/internal-carbon-price/ref/mechanism-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'data', 'ref'], 'n_keys': 4}`

**GET /api/v1/internal-carbon-price/ref/sbti-guidance** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'ref'], 'n_keys': 3}`

**POST /api/v1/internal-carbon-price/abatement-cost-curve** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Social Cost of Carbon & Shadow Price
**Headline formula:** `ICPₙᵗ = SCCᵗ × Escalation Factorᵗ + Regulatory Floorᵗ`
**Standards:** ['SBTi Corporate Net-Zero Standard 2021', 'TCFD Guidance on Metrics & Targets 2021', 'IEA WEO NZE Price Pathway', 'US EPA SCC 2023']

**Engine `internal_carbon_price_engine` — extracted transformation lines:**
```python
gap = recommended_icp - current_icp
upper_year = min((y for y in sorted_years if y >= year), default=sorted_years[-1])
frac = (year - lower_year) / (upper_year - lower_year)
scope1_cost = scope1_tco2 * icp_eur
scope2_cost = scope2_tco2 * icp_eur
scope3_cost = scope3_tco2 * icp_eur
total_cost = scope1_cost + scope2_cost + scope3_cost
total_emissions = scope1_tco2 + scope2_tco2 + scope3_tco2
ebitda_impact_pct = round((total_cost / (ebitda_m * 1_000_000)) * 100, 2)
bu_cost = bu_emissions * icp_eur
bu_share = (bu_emissions / total_emissions * 100) if total_emissions > 0 else 0
years_elapsed = current_year - base_year
target_current_year = base_year_emissions_tco2 * max(
yrs = yr - base_year
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).