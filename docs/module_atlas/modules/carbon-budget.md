# Carbon Budget Tracker
**Module ID:** `carbon-budget` · **Route:** `/carbon-budget` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Remaining carbon budget analysis using IPCC AR6 estimates. Shows portfolio alignment to 1.5°C/2°C budgets, annual consumption rate, and years-to-exhaustion metric.

> **Business value:** The carbon budget concept makes abstract climate goals concrete: how many years do we have at current emission rates? This module enables companies and investors to visualise their position relative to a finite global constraint and plan credible decarbonisation.

**How an analyst works this module:**
- Global Budget shows remaining budget with depletion countdown
- Portfolio Allocation shows company budget shares
- Burn Rate Trend shows emissions vs budget reduction pathway
- Scenario Comparison shows 1.5°C vs 2°C budget comparison

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BUDGET_REMAINING`, `KpiCard`, `PATHWAYS`, `PATHWAY_DATA`, `REGIONS`, `SECTORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTORS` | 9 | `name`, `emoji`, `budgetGtCO2`, `usedGtCO2`, `emissionsGtY`, `reductionTarget2030`, `netZeroYear`, `carbonPrice`, `techReadiness` |
| `REGIONS` | 8 | `name`, `cumulativeGtCO2`, `remainingBudget15`, `remainingBudget20`, `annualEmissions`, `reductionNeeded`, `peakYear`, `netZeroYear` |
| `PATHWAYS` | 6 | `color`, `description` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `BUDGET_REMAINING` | `SECTORS.map(s => ({` |
| `yearsRemaining15` | `(globalBudget15 / globalEmissions).toFixed(1);` |
| `pct` | `s.budgetGtCO2 > 0 ? Math.min(100, (s.usedGtCO2 / s.budgetGtCO2) * 100) : 100;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/carbon/methodologies` | `get_methodologies` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/emission-factors` | `get_emission_factors` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/portfolios` | `get_portfolios` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/portfolios` | `create_portfolio` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/portfolios/{portfolio_id}` | `get_portfolio` | api/v1/routes/carbon.py |
| PUT | `/api/v1/carbon/portfolios/{portfolio_id}` | `update_portfolio` | api/v1/routes/carbon.py |
| DELETE | `/api/v1/carbon/portfolios/{portfolio_id}` | `delete_portfolio` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/portfolios/{portfolio_id}/dashboard` | `get_portfolio_dashboard` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/projects` | `get_projects` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/projects` | `create_project` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/projects/{project_id}` | `get_project` | api/v1/routes/carbon.py |
| PUT | `/api/v1/carbon/projects/{project_id}` | `update_project` | api/v1/routes/carbon.py |
| DELETE | `/api/v1/carbon/projects/{project_id}` | `delete_project` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/projects/from-calculation` | `create_project_from_calculation` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/portfolios/{portfolio_id}/scenarios` | `get_scenarios` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/portfolios/{portfolio_id}/scenarios` | `create_scenario` | api/v1/routes/carbon.py |
| DELETE | `/api/v1/carbon/portfolios/{portfolio_id}/scenarios/{scenario_id}` | `delete_scenario` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/calculate` | `run_calculation` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/calculations/{calculation_id}` | `get_calculation` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/reports/generate` | `generate_report` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/reports/{report_id}/download` | `download_report` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/methodology-list` | `list_all_methodologies` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/methodology-list/{sector}` | `list_methodologies_by_sector` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/methodology-details/{methodology_code}` | `get_methodology_info` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/calculate/methodology` | `calculate_methodology` | api/v1/routes/carbon.py |
| POST | `/api/v1/carbon/calculate/batch` | `calculate_batch` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/data/grid-emission-factor` | `get_grid_emission_factor` | api/v1/routes/carbon.py |
| GET | `/api/v1/carbon/methodology-inputs/{methodology_code}` | `get_methodology_inputs` | api/v1/routes/carbon.py |

### 2.3 Engine `carbon_calculator` (services/carbon_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `CarbonCalculationEngine.calculate_project_risk` | project_type, country_code, quality_rating, custom_risks | Calculate risk factors for a single project. |
| `CarbonCalculationEngine.calculate_risk_adjusted_credits` | annual_credits, risk_breakdown | Calculate risk-adjusted credit amount. |
| `CarbonCalculationEngine.calculate_npv` | annual_credits, price_per_credit, years, discount_rate, price_growth_rate | Calculate Net Present Value of carbon credits over time. |
| `CarbonCalculationEngine.calculate_quality_score` | additionality_score, permanence_score, co_benefits_score, verification_status | Calculate overall quality score and rating for a project. |
| `CarbonCalculationEngine.generate_yearly_projections` | total_annual_credits, risk_adjusted_credits, years, optimistic_factor, pessimistic_factor | Generate yearly credit projections. |
| `CarbonCalculationEngine.run_monte_carlo` | projects, scenario, n_runs, random_seed | Run Monte Carlo simulation for portfolio. This is a GENUINE calibrated Monte Carlo: the risk and price adjustments are sampled from normal distributions whose parameters (permanence/delivery risk and price volatility) are supplied by the caller via ``scenario``. The returned figures are distributional statistics of that simulation, not fabricated point estimates. ``random_seed`` (optional, backwar |
| `CarbonCalculationEngine.calculate_portfolio` | projects, scenario, run_monte_carlo | Calculate portfolio-level metrics. |

### 2.3 Engine `methodology_engine` (services/methodology_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ACM0001_LandfillGas` | inputs | ACM0001: Flaring or Use of Landfill Gas - Waste Sector |
| `ACM0002_RenewableEnergy` | inputs | ACM0002: Grid-Connected Renewable Energy - Energy Sector |
| `ACM0003_BiomassSubstitution` | inputs | ACM0003: Partial Substitution of Fossil Fuels with Biomass - Energy Sector |
| `ACM0005_WasteHeatRecovery` | inputs | ACM0005: Grid Electricity from Waste Heat Recovery - Energy/Industrial Sector |
| `ACM0006_BiomassEnergy` | inputs | ACM0006: Electricity and Heat from Biomass - Energy Sector |
| `ACM0007_FuelSwitch` | inputs | ACM0007: Analysis of Least Cost Fuel Option - Energy Sector |
| `ACM0008_CoalMineMethane` | inputs | ACM0008: Abatement of Methane from Coal Mines - Mining Sector |
| `ACM0009_CoalToGas` | inputs | ACM0009: Fuel Switch from Coal to Gas - Energy Sector |
| `ACM0010_ManureMethane` | inputs | ACM0010: GHG Emission Reductions from Manure Management - Agriculture Sector |
| `ACM0012_WasteHeatPower` | inputs | ACM0012: Waste Heat Recovery for Power Generation - Industrial Sector |
| `ACM0014_CementBlending` | inputs | ACM0014: Cement Blending - Industrial Sector |
| `ACM0022_Composting` | inputs | ACM0022: Alternative Waste Treatment (Composting) - Waste Sector |
| `ACM0023_LowEmissionVehicles` | inputs | ACM0023: Introduction of Low-Emission Vehicles - Transport Sector |
| `AMS_III_C_LowEmissionVehicles` | inputs | AMS-III.C: Emission Reductions by Low-Emission Vehicles - Transport Sector |
| `VM0032_CoalMineMethane` | inputs | VM0032: Coal Mine Methane (VCS) - Mining Sector |
| `AMS_I_A_RenewableElectricity` | inputs | AMS-I.A: Electricity from Renewable Sources (Small-scale < 15 MW) |
| `AMS_I_C_RenewableThermal` | inputs | AMS-I.C: Thermal Energy from Renewable Sources |
| `AMS_I_D_GridRenewable` | inputs | AMS-I.D: Grid Connected Renewable Electricity Generation |
| `AMS_II_D_BuildingEfficiency` | inputs | AMS-II.D: Energy Efficiency in Buildings |
| `AMS_II_E_TransportEfficiency` | inputs | AMS-II.E: Energy Efficiency in Transport |
| `AMS_II_G_IndustrialEfficiency` | inputs | AMS-II.G: Energy Efficiency in Industrial Processes |
| `AMS_III_AU_AgriculturalMethane` | inputs | AMS-III.AU: Methane Recovery in Agricultural Activities |
| `AMS_III_B_WastewaterMethane` | inputs | AMS-III.B: Methane Recovery from Wastewater |
| `AMS_III_C_WasteComposting` | inputs | AMS-III.C: Emission Reductions from Waste Composting |
| `AMS_III_D_SolidWasteMethane` | inputs | AMS-III.D: Methane Recovery from Solid Waste Disposal |
| `AM0012_NitricAcidN2O` | inputs | AM0012: N2O Abatement from Nitric Acid Production |
| `AM0036_SF6Reduction` | inputs | AM0036: SF6 Emission Reductions in Electrical Equipment |
| `AR_ACM0003_AfforestationReforestation` | inputs | AR-ACM0003: Large-scale Afforestation/Reforestation |
| `VM0008_WastewaterMethane` | inputs | VM0008: Methane Destruction at Wastewater Treatment Plants |
| `VM0022_AgriculturalN2O` | inputs | VM0022: N2O Emissions Reductions in Agricultural Crop Production |
| `VM0033_BlueCarbon` | inputs | VM0033: Tidal Wetland and Seagrass Restoration |
| `VM0042_AgriculturalLandManagement` | inputs | VM0042: Improved Agricultural Land Management |
| `VM0044_BiocharSoil` | inputs | VM0044: Biochar Utilization in Soil |
| `VM0047_ARR` | inputs | VM0047: Afforestation, Reforestation and Revegetation |
| `VM0048_REDD` | inputs | VM0048: REDD+ Methodology |
| `TPDDTEC_Cookstoves` | inputs | TPDDTEC v3.0: Clean Cookstoves - Household Sector |

**Engine `methodology_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `METHODOLOGY_CALCULATORS` | `{'ACM0001': ACM0001_LandfillGas, 'ACM0002': ACM0002_RenewableEnergy, 'ACM0003': ACM0003_BiomassSubstitution, 'ACM0005': ACM0005_WasteHeatRecovery, 'ACM0006': ACM0006_BiomassEnergy, 'ACM0007': ACM0007_FuelSwitch, 'ACM0008': ACM0008_CoalMineMethane, 'ACM0009': ACM0009_CoalToGas, 'ACM0010': ACM0010_Man` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `Manure` *(shared)*, `Wind` *(shared)*, `database` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `projects` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `PATHWAYS`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| 1.5°C Budget Remaining | — | IPCC AR6 | As of 2023 at 50-67% probability levels |
| Global Annual Burn | — | GCP 2023 | Current pace of budget depletion |
| Years to Exhaustion (1.5°C) | — | Simple rate calc | At current global emissions rate |
| Portfolio Budget Share | — | Model | Portfolio share of global carbon budget |
- **IPCC AR6 estimates** → Budget calculation → **Remaining global budget**
- **Company emissions** → Budget allocation → **Company carbon allowance**
- **Annual emission rate** → Depletion projection → **Years-to-exhaustion**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/carbon/calculations/{calculation_id}** — status `failed`, provenance ['db-empty'], source tables: `carbon_calculation`
Output: `None`

**GET /api/v1/carbon/data/grid-emission-factor** — status `failed`, provenance ['db-empty'], source tables: `carbon_emission_factor`
Output: `None`

**GET /api/v1/carbon/emission-factors** — status `passed`, provenance ['real-db'], source tables: `carbon_emission_factor`
Output: `{'type': 'array', 'len': 8, 'item0_keys': None}`

**GET /api/v1/carbon/methodologies** — status `passed`, provenance ['real-db'], source tables: `carbon_methodology`
Output: `{'type': 'array', 'len': 6, 'item0_keys': None}`

**GET /api/v1/carbon/methodology-details/{methodology_code}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/carbon/methodology-inputs/{methodology_code}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/carbon/methodology-list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['methodologies', 'total_count', 'sectors'], 'n_keys': 3}`

**GET /api/v1/carbon/methodology-list/{sector}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector', 'methodologies', 'message'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic
**Methodology:** IPCC AR6 carbon budget allocation
**Headline formula:** `Budget_company = GlobalBudget × (CompanyEmissions / GlobalEmissions)`

Remaining 1.5°C budget (2020 baseline): ~420 GtCO2 (50% probability), ~570 GtCO2 (67%). Current global emissions ~37 GtCO2/yr. Company allocation proportional to current emission share. Budget depletion rate = current pace.

**Standards:** ['IPCC AR6 WGI Chapter 5', 'GCP Global Carbon Project']
**Reference documents:** IPCC AR6 WGI Chapter 5 (Carbon Budgets); Global Carbon Project Annual Budget; Our World in Data Carbon Budget

**Engine `carbon_calculator` — extracted transformation lines:**
```python
quality_multiplier = 1.0 + (3.0 - quality_score) * 0.05  # Higher quality = lower risk
total_risk = permanence_risk + delivery_risk + regulatory_risk + market_risk
risk_discount = total_risk_pct / 100
future_price = price_per_credit * ((1 + price_growth_rate) ** year)
annual_value = annual_credits * future_price
discounted_value = annual_value / ((1 + discount_rate) ** year)
score = (additionality * 0.4 + permanence * 0.35 + co_benefits * 0.25) + verification_bonus
year = current_year + i
time_factor = 1.0 + (i * 0.02)  # Slight increase over time
base = total_annual_credits * time_factor
optimistic = base * optimistic_factor
pessimistic = base * pessimistic_factor
risk_adj = risk_adjusted_credits * time_factor
perm_adj = sampler.normal(1 - permanence_risk, permanence_risk * 0.5)
del_adj = sampler.normal(1 - delivery_risk, delivery_risk * 0.5)
simulated_credits = total_credits * perm_adj * del_adj
simulated_value = simulated_credits * base_price * price_adj
avg_quality = total_quality_weighted / total_credits
```

**Engine `methodology_engine` — extracted transformation lines:**
```python
baseline_methane = methane_generation_potential * waste_quantity
baseline_emissions = baseline_methane * methane_gwp
methane_captured = baseline_methane * capture_efficiency
project_emissions = (methane_captured * (1 - destruction_efficiency) * methane_gwp) + \
emission_reductions = baseline_emissions - project_emissions - leakage
annual_generation = installed_capacity_mw * capacity_factor * 8760
combined_margin_ef = (operating_margin_weight * grid_emission_factor) + \
baseline_emissions = annual_generation * combined_margin_ef
gross_emission_reductions = baseline_emissions - project_emissions - leakage
uncertainty_deduction = gross_emission_reductions * uncertainty_factor
net_emission_reductions = gross_emission_reductions - uncertainty_deduction
biomass_emissions = biomass_quantity * biomass_ncv * biomass_emission_factor / 1000
emission_reductions = baseline_emissions - project_emissions
electricity_generated = waste_heat_available * conversion_efficiency
baseline_emissions = electricity_generated * grid_emission_factor
auxiliary_emissions = auxiliary_power * grid_emission_factor
emission_reductions = baseline_emissions - project_emissions
electricity_generation = biomass_quantity * electricity_yield
heat_generation = biomass_quantity * heat_yield
baseline_emissions_electricity = electricity_generation * grid_emission_factor
baseline_emissions_heat = heat_generation * heat_emission_factor
baseline_emissions = baseline_emissions_electricity + baseline_emissions_heat
project_emissions = biomass_quantity * biomass_ncv * biomass_ch4_ef * methane_gwp
emission_reductions = baseline_emissions - project_emissions
baseline_emissions = baseline_fuel_consumption * baseline_ncv * baseline_emission_factor / 1000
project_emissions = project_fuel_consumption * project_ncv * project_emission_factor / 1000
emission_reductions = baseline_emissions - project_emissions
total_methane = (ventilation_air_methane + captured_methane) * methane_density
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **67** other module(s).
**Shared engines (edits propagate!):** `carbon_calculator` (used by 21 modules), `methodology_engine` (used by 21 modules)

| Connected module | Shared via |
|---|---|
| `carbon-market-intelligence` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-integrity-mrv-analytics` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-institutions-taxonomy` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-footprint-intelligence` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-reduction-projects` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-aware-allocation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-forward-curve` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-project-lifecycle` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-removal-markets` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-adjusted-valuation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |

## 7 · Methodology Deep Dive

The Carbon Budget Tracker aligns well with its guide: it implements the IPCC AR6 remaining-carbon-budget
concept and a proportional allocation, with only minor caveats (below). No production-model gap is
triggered — the arithmetic is transparent and the constants are real (or clearly illustrative), so there
is no §8.

### 7.1 What the module computes

Three headline quantities from a small set of reference tables:

```js
yearsRemaining15 = globalBudget15 / globalEmissions        // years to 1.5°C budget exhaustion
budget_company   = GlobalBudget × (CompanyEmissions / GlobalEmissions)   // proportional allocation (guide)
remaining_sector = max(0, budgetGtCO2 − usedGtCO2)         // per-sector headroom
pct_used         = min(100, usedGtCO2 / budgetGtCO2 × 100)
```

Sectors and regions carry pre-set budget, used-to-date, and annual-emission figures; the module derives
remaining budget, a four-band exhaustion status, and per-region years-to-net-zero context. Five emission
pathways (`PATHWAY_DATA`, 2020–2050) are analytic decay curves with small seeded noise added for texture.

### 7.2 Parameterisation

**Global budget anchors** (`REGIONS` global row — provenance: IPCC AR6 WGI Ch.5 / Global Carbon Project,
directionally correct):

| Quantity | Value | Basis |
|---|---|---|
| Remaining 1.5 °C budget | 380 GtCO₂ | IPCC AR6 (~400–500 Gt from 2020 at 50–67%); 380 ≈ post-2023 depletion |
| Remaining 2 °C budget | 900 GtCO₂ | IPCC AR6 |
| Global annual emissions | 56.8 GtCO₂e | ⚠ this is **all-GHG CO₂e**, whereas the budget is **CO₂-only** (~37 GtCO₂/yr) |
| Cumulative to date | 2,900 GtCO₂ | historical cumulative emissions |

**Sector budgets** (`SECTORS`, 8 rows including negative LULUCF budget −60 Gt reflecting land sink) and
**regional budgets** (`REGIONS`, 7 rows) are illustrative allocations, internally consistent but not traced
to a single published allocation study.

**Pathway curves** (`PATHWAY_DATA`): each scenario is `56.8 × (1 − t·k) + sr(i)·noise`, e.g. 1.5 °C
Orderly uses `k=1.18` (steep decline to ~net-zero by 2050); Disorderly variants delay the inflection then
drop faster. The `sr()` noise (±0.4–0.6 Gt) is cosmetic.

### 7.3 Calculation walkthrough

Global KPIs read directly off the `global` region row. `yearsRemaining15 = 380/56.8`. Sector-Budgets tab
maps each sector to `remaining/used/pct` and a status band (`Exceeded` if used ≥ budget, `Critical` >85%,
`Warning` >65%, else `On Track`). Regional tab surfaces cumulative vs remaining budget and reduction-needed.
Pathway tab plots the five decay curves and lets the user isolate one.

### 7.4 Worked example

Global 1.5 °C budget = 380 GtCO₂, annual emissions field = 56.8 → `yearsRemaining15 = 380/56.8 = 6.7
years`. (Using the *correct* CO₂-only rate of ~37 GtCO₂/yr the figure would be ~10.3 years, matching the
guide's "10–13 years" — the discrepancy is the CO₂ vs CO₂e units bug flagged in §7.2.)

Energy sector: `budgetGtCO2 = 220`, `usedGtCO2 = 198` → `remaining = 22 Gt`, `pct = 198/220 = 90%` →
status **Critical** (>85%). LULUCF: `budget = −60`, `used = −42` → `remaining = max(0, −60−(−42)) = max(0,
−18) = 0`, `pct` capped at 100 — the negative-budget land sink is handled but the status logic is designed
for positive budgets, so LULUCF reads oddly (a modelling edge case).

### 7.5 Data provenance & limitations

- Global 1.5 °C/2 °C budgets and cumulative emissions are **real, directionally accurate IPCC AR6 / GCP
  figures**; sector and regional sub-allocations are **illustrative** (internally consistent, not from one
  citable allocation).
- Pathway curves are **analytic decay functions with cosmetic `sr()` noise** (`sr(seed)=frac(sin(seed+1)×
  10⁴)`), not run from an IAM.
- **Units inconsistency**: the years-to-exhaustion divides a CO₂-only budget (380 Gt) by an all-GHG CO₂e
  emission rate (56.8 Gt), understating years remaining by ~35%. A production version should divide by the
  ~37 GtCO₂/yr CO₂-only rate.
- Company allocation is strictly proportional to current emission share — it does not apply
  grandfathering, capability, or convergence allocation principles used in equity-based budget sharing.

**Framework alignment:** IPCC AR6 WGI Ch.5 — the remaining-budget levels (400–500 GtCO₂ for 1.5 °C at
50–67% from 2020) and the depletion-rate framing · Global Carbon Project — the ~37 GtCO₂/yr CO₂ burn rate
(mis-applied here as 56.8 CO₂e) · NGFS/IAM archetypes — the five pathway labels (1.5 °C Orderly/Disorderly,
2 °C Orderly/Disorderly, Current Policies ≈2.8 °C) mirror the NGFS scenario family, though the curves are
stylised rather than IAM-sourced.

## 9 · Future Evolution

### 9.1 Evolution A — Live portfolio emissions against sourced IPCC budgets (analytics ladder: rung 1 → 3)

**What.** The tracker's core arithmetic is honest and simple — `yearsRemaining = globalBudget / globalEmissions`, sector-share depletion `pct = used/budget` — but the `SECTORS` (9 rows: budget, used, emissions, reduction targets) and `REGIONS` (8 rows: cumulative, remaining 1.5°C/2°C budgets) tables are curated static constants, and the registered backend is the generic `carbon.py` credit suite, not a budget engine. The module's "portfolio allocation" and "burn rate" views show sector/region aggregates, not the user's actual holdings. Evolution A grounds the budgets and connects real portfolio emissions.

**How.** (1) Source the global/regional remaining budgets from IPCC AR6 WG1 (the module cites it) with explicit vintage and the temperature/probability qualifiers (remaining budgets are stated at a given likelihood — 50% vs 67% for 1.5°C differ materially, and the tracker must expose which it uses). (2) Portfolio allocation from real holdings: each company's share of a fair-share carbon budget computed from its emissions (PCAF/GHG data) against a sector-decarbonisation pathway, so "years to exhaustion" is portfolio-specific, not a global constant. (3) Burn-rate trend from the platform's emissions history rather than a static reduction line. (4) Rung 3: benchmark against SBTi sector pathways (the module references sector reduction targets) for the fair-share allocation method. As a backend vertical, a dedicated `carbon-budget` route rather than the generic carbon suite.

**Prerequisites.** IPCC AR6 budget figures with likelihood qualifiers sourced; portfolio emissions coverage; a fair-share allocation methodology decision (contested — GDR, SDA, absolute contraction all differ, and the choice must be documented). **Acceptance:** the global budget carries its temperature and likelihood basis; portfolio years-to-exhaustion derives from real holdings emissions; the fair-share method is documented and its choice disclosed.

### 9.2 Evolution B — Carbon-budget framing copilot (LLM tier 1 → 2)

**What.** The carbon-budget concept translates abstract targets into "how many years do we have?" — a communication task LLMs do well. Tier 1: a copilot explaining the budget framing ("the 1.5°C budget at 50% likelihood is ~X GtCO₂; at current rates that's Y years"), the 1.5°C-vs-2°C comparison, and sector depletion, grounded in this Atlas record with the likelihood/vintage caveats. Tier 2, after Evolution A: "what's our portfolio's fair-share budget and when does it exhaust?" runs the allocation tool on real holdings.

**How.** Tier-1 corpus from this record and the IPCC AR6 references; the refusal path is unusually important here because carbon budgets are frequently misquoted — the copilot must always state the temperature target and likelihood, and never present a single "the carbon budget" number without those qualifiers. Tier 2 tool schemas over the Evolution-A budget/allocation routes; the fair-share method and its assumptions are stated per answer since the allocation choice materially changes the verdict. This is a serious-topic module — answers stay measured and precise, not alarmist.

**Prerequisites.** Copilot router (tier 1); Evolution A's sourced budgets and allocation engine (tier 2). **Acceptance:** every budget figure is qualified by temperature and likelihood; tier-2 portfolio answers trace to the allocation tool and state the fair-share method; the copilot refuses to quote an unqualified "carbon budget" number.