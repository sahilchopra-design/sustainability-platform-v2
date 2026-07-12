# Carbon Reduction Projects
**Module ID:** `carbon-reduction-projects` · **Route:** `/carbon-reduction-projects` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Internal abatement project portfolio management covering NPV, payback period, marginal abatement cost, and GHG reduction tracking per project. Applies GHG Protocol Project Protocol for baseline and additionality assessment. Prioritises projects on a MAC curve and tracks cumulative emission reduction progress against SBTi targets.

> **Business value:** An internal abatement project portfolio with rigorous MAC curve analysis enables companies to maximise GHG reduction per dollar invested while minimising reliance on external offsets. SBTi target coverage tracking ensures the organisation remains on track to achieve science-based commitments through genuine operational decarbonisation rather than offset dependency.

**How an analyst works this module:**
- Project Library lists all internal abatement projects with status and MAC
- MAC Curve tab visualises projects ranked by $/tCO₂e with cumulative reduction
- Project NPV tab shows discounted cashflow for individual project with sensitivity
- SBTi Progress tab tracks cumulative reductions vs annual SBTi glide path
- Pipeline tab manages projects in approval queue with governance sign-off
- Report Export generates abatement project portfolio for TCFD/CSRD disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `CAT_COLORS`, `COBENEFIT_CAT`, `CUMULATIVE_DATA`, `CatDot`, `CoBenefitsTab`, `FinancialTab`, `GANTT_DATA`, `MetricCard`, `NPV_DATA`, `PROJECTS`, `PipelineTab`, `ProjectCard`, `SCATTER_DATA`, `STATUSES`, `STATUS_COLORS`, `StatusBadge`, `TableTab`, `TimelineTab`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PROJECTS` | 25 | `name`, `category`, `site`, `status`, `capex`, `co2e`, `irr`, `payback`, `completion`, `owner`, `npv75`, `abatement`, `startM`, `dur`, `energySav`, `waterSav`, `wasteSav` |
| `CUMULATIVE_DATA` | 10 | `cumCo2e`, `sbti` |
| `NPV_DATA` | 4 | `npvTotal` |
| `SDG_ICONS` | 7 | `label`, `icon`, `color`, `rel` |
| `TABS` | 6 | `id` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COBENEFIT_CAT` | `CATEGORIES.map(cat => {` |
| `SCATTER_DATA` | `PROJECTS.map(p => ({` |
| `GANTT_DATA` | `PROJECTS.slice(0,16).map(p => ({` |
| `totalCo2e` | `projects.reduce((a,p) => a + p.co2e, 0).toFixed(1);` |
| `totalCapex` | `projects.reduce((a,p) => a + p.capex, 0).toFixed(1);` |
| `colCo2e` | `col.reduce((a,p) => a+p.co2e,0).toFixed(1);` |
| `cCo2e` | `cps.reduce((a,p) => a+p.co2e,0).toFixed(1);` |
| `cCapex` | `cps.reduce((a,p) => a+p.capex,0).toFixed(1);` |
| `totalNpv75` | `+projects.reduce((a,p) => a+p.npv75,0).toFixed(1);` |
| `totalNpv100` | `+(totalNpv75*1.31).toFixed(1);` |
| `totalNpv150` | `+(totalNpv75*1.68).toFixed(1);` |
| `scatterByCat` | `CATEGORIES.map(cat => ({` |
| `ganttData` | `GANTT_DATA.map(p => ({` |
| `barLeft` | `(p.start/totalW)*100;` |
| `barW` | `(p.dur/totalW)*100;` |
| `totalEnergy` | `+projects.reduce((a,p) => a+p.energySav,0).toFixed(1);` |
| `totalWater` | `+projects.reduce((a,p) => a+p.waterSav,0).toFixed(1);` |
| `totalWaste` | `+projects.reduce((a,p) => a+p.wasteSav,0).toFixed(0);` |
| `totalCobenefitValue` | `+(totalEnergy * 8.4 + totalWater * 1.2 + totalWaste * 0.18).toFixed(1);` |
| `inProgressCo2e` | `+inProgress.reduce((a,p) => a+p.co2e,0).toFixed(0);` |

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
**Frontend seed datasets:** `CATEGORIES`, `CUMULATIVE_DATA`, `NPV_DATA`, `PROJECTS`, `SDG_ICONS`, `STATUSES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Project MAC | `Net cost / GHG reduction` | GHG Protocol | Marginal abatement cost; negative = cost-saving (energy efficiency); positive = investment required |
| Portfolio GHG Reduction (2030) | `Σ Project_reductions` | Project tracking | Total annual emission reduction from all approved internal abatement projects by 2030 |
| SBTi Target Coverage | `Project reductions / SBTi gap × 100` | SBTi alignment | Percentage of SBTi emission reduction gap covered by internal projects vs residual offset need |
- **Engineering project proposals with cost and emission reduction estimates** → Calculate MAC, NPV, and payback; rank on MAC curve; assess additionality vs baseline → **Prioritised MAC curve with project NPV profiles and cumulative reduction potential**
- **SBTi approved target trajectory** → Compare aggregate project reductions against annual SBTi glide path → **SBTi gap analysis and residual offset requirement by year**

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
**Methodology:** MAC curve + GHG Protocol project NPV
**Headline formula:** `MAC = NPV_cost / GHG_reduction_tCO2e; Project_NPV = –CapEx + Σ_t[Savings_t – OpEx_t] / (1+r)^t; Additionality = (Baseline_emissions – Project_emissions)`

MAC (Marginal Abatement Cost) ranks projects from cheapest to most expensive GHG reduction, forming the abatement cost curve. NPV includes avoided energy costs, carbon cost savings, and capital expenditure. Projects with negative MAC (cost-saving) should be implemented first. Additionality = emission reduction below baseline.

**Standards:** ['GHG Protocol Project Protocol 2005', 'SBTi Corporate Manual', 'IEA Energy Efficiency Programme']
**Reference documents:** GHG Protocol Project Protocol 2005; SBTi Corporate Manual v1.2 (2021); McKinsey Global Abatement Cost Curve; IEA Energy Efficiency 2023

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
| `carbon-aware-allocation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-forward-curve` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-project-lifecycle` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-removal-markets` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-adjusted-valuation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-capture-finance` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |

## 7 · Methodology Deep Dive

The Carbon Reduction Projects module manages an internal abatement portfolio on a MAC-curve + NPV basis,
matching its guide conceptually. The distinctive feature is that the 25-project dataset is **hand-curated
and internally coherent** (not `sr()`-seeded), but the NPV and MAC figures are *stored*, not computed from
a DCF — so the guide's `Project_NPV = −CapEx + Σ(Savings−OpEx)/(1+r)^t` formula is not actually executed.
§8 specifies the production MAC/NPV engine.

### 7.1 What the module computes

Portfolio aggregates and carbon-price NPV scaling over a curated project list:

```js
totalCo2e   = Σ project.co2e                          // ktCO2e/yr abated
totalCapex  = Σ project.capex                         // $M
totalNpv75  = Σ project.npv75                         // NPV at $75/tCO2 (stored per project)
totalNpv100 = totalNpv75 × 1.31                       // scaling to $100/t
totalNpv150 = totalNpv75 × 1.68                       // scaling to $150/t
totalCobenefitValue = energySav×8.4 + waterSav×1.2 + wasteSav×0.18   // $M co-benefit
```

Each project carries `abatement` (its **marginal abatement cost, $/tCO₂**), `irr`, `payback`, and a
Gantt schedule (`startM`, `dur`). The MAC curve orders projects cheapest-to-most-expensive by `abatement`.

### 7.2 Parameterisation

**Project dataset** (`PROJECTS`, 25 rows — provenance: **hand-curated illustrative portfolio**, realistic
and internally consistent, e.g. LED retrofit MAC −29 $/t through Kiln CCS MAC +114 $/t):

| Field | Meaning | Example |
|---|---|---|
| capex | $M capital | LED retrofit 2.4; Kiln CCS 212.4 |
| co2e | ktCO₂e/yr abated | Offshore wind PPA 112.4 |
| abatement | MAC $/tCO₂ (neg = cost-saving) | Business travel −10; Green H₂ 205 |
| irr / payback | project returns | LED 28.5% / 3.1yr |
| npv75 | NPV at $75/t carbon price | Kiln CCS −18.4 (uneconomic) |
| energy/water/wasteSav | co-benefit quantities | for cobenefit valuation |

**Carbon-price NPV scaling factors** (1.31 for $100, 1.68 for $150 — provenance: fixed heuristic, not
re-derived per project): these assume every project's NPV scales identically with carbon price, which is
only true if carbon revenue is a constant share of each project's cash flow — a simplification.

**Co-benefit prices** (`8.4 $/MWh energy, 1.2 $/m³ water, 0.18 $/t waste` — heuristic shadow values).

**Cumulative pathway** (`CUMULATIVE_DATA`): cumulative abatement 2024→2032 with SBTi milestone flags,
hand-set to level off near 847 ktCO₂e.

### 7.3 Calculation walkthrough

The MAC scatter plots each project at (cumulative abatement volume, MAC) — negative-MAC projects (energy
efficiency, behaviour change) sit left/below, high-MAC removals (green H₂, kiln CCS) sit right/above. The
Gantt lays projects on a month timeline from `startM` for `dur` months. Portfolio KPIs sum co2e, capex,
and NPV, then scale NPV to two higher carbon prices via the fixed factors. Cobenefit value monetises
energy/water/waste savings at flat shadow prices.

### 7.4 Worked example (portfolio NPV + one MAC point)

Suppose the 25 projects sum to `totalNpv75 = $520M`:
- `totalNpv100 = 520 × 1.31 = $681.2M`; `totalNpv150 = 520 × 1.68 = $873.6M`.

MAC point — "Business Travel Carbon Budget" project: `capex = 1.2`, `co2e = 12.4 kt`, `abatement = 10`
(this row's MAC is a positive small number in the data, though behaviour-change measures are often
cost-negative). "LED Lighting Retrofit": `abatement = 29` cost… note the sign convention in this dataset
uses `abatement` as an ordering magnitude; the guide's negative-MAC-first logic is applied by sorting.

Co-benefit: if `totalEnergy = 120 MWh`, `totalWater = 15 m³`, `totalWaste = 6,000 t`:
`totalCobenefitValue = 120×8.4 + 15×1.2 + 6000×0.18 = 1008 + 18 + 1080 = $2,106 → $2.1M`.

### 7.5 Data provenance & limitations

- The project portfolio is **hand-curated illustrative data** (not PRNG-seeded), internally consistent and
  realistic, but not real company projects.
- **NPV is stored, not computed** — the guide's DCF formula is not run; the module cannot re-price a
  project if its cash-flow schedule changes.
- **Carbon-price NPV scaling uses two fixed factors** (1.31, 1.68) applied uniformly, ignoring that carbon
  revenue is a different share of NPV for each project.
- MAC is the stored `abatement` field, not recomputed as `net cost / GHG reduction`.

**Framework alignment:** GHG Protocol Project Protocol (2005) — the baseline/additionality framing behind
each project's abatement claim · McKinsey-style MAC curve — the cheapest-first abatement ordering, cost-
negative projects (efficiency) implemented before cost-positive (removals) · SBTi Corporate Manual — the
cumulative-abatement-vs-target pathway with SBTi milestone flags · IEA Energy Efficiency — the energy-
efficiency category economics. See §8 for the production MAC/NPV engine.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** NPV/MAC are stored, not modelled; this specifies
the engine that should compute them.

### 8.1 Purpose & scope
Compute per-project NPV, IRR, payback, and MAC from a modelled cash-flow schedule under a chosen carbon-
price path, and assemble a portfolio MAC curve and cumulative-abatement trajectory vs an SBTi target, for
corporate decarbonisation capital allocation.

### 8.2 Conceptual approach
Discounted-cash-flow project economics plus a MAC-curve constructor, benchmarked against the GHG Protocol
Project Protocol and McKinsey global-abatement-cost-curve methodology. Each project's cash flow is built
from avoided energy cost, avoided carbon cost (at the price path), OPEX, and CAPEX; MAC is the levelised
net cost per tonne.

### 8.3 Mathematical specification

```
Savings_t = EnergySaved·P_energy,t + CO2Abated·P_carbon,t + Cobenefit_t
FCF_t     = Savings_t − OPEX_t
NPV       = −CAPEX + Σ_{t=1}^{L} FCF_t/(1+r)^t
IRR       : Σ FCF_t/(1+IRR)^t = CAPEX
MAC       = [CRF·CAPEX + OPEX_annual − NonCarbonSavings_annual] / CO2Abated_annual
CRF       = r(1+r)^L/((1+r)^L − 1)
```

| Parameter | Symbol | Source |
|---|---|---|
| Carbon price path | P_carbon | NGFS Phase IV / IEA NZE |
| Energy price | P_energy | IEA / regional tariffs |
| Discount rate | r | corporate WACC |
| Project life | L | technology-specific |
| Co-benefit shadow prices | — | internal / social-cost tables |

### 8.4 Data requirements
Per project: CAPEX, annual OPEX, energy/water/waste savings quantities, abatement tCO₂/yr, life. Platform
holds the curated schedule fields; missing: a DCF routine tied to a live carbon-price path and per-project
energy prices.

### 8.5 Validation & benchmarking plan
Reconcile computed NPV/IRR against the curated values for the existing portfolio (should match when the
cash-flow assumptions are back-filled). Verify MAC-curve monotonicity and that negative-MAC projects rank
first. Sensitivity of portfolio NPV to carbon and energy prices (replacing the fixed 1.31/1.68 factors).

### 8.6 Limitations & model risk
Energy-price and carbon-price paths dominate NPV — conservative fallback uses current spot prices flat.
Abatement additionality (baseline choice) is the largest measurement risk; document baselines per GHG
Protocol Project Protocol. Co-benefit shadow prices are contestable and should be shown as a separate,
clearly-labelled value stream.

## 9 · Future Evolution

### 9.1 Evolution A — Real project book, computed MAC curve, and DCF-based NPV (analytics ladder: rung 1 → 2)

**What.** The page manages an internal abatement portfolio with a genuinely useful structure (MAC curve, project NPV, SBTi-progress tracking, pipeline governance, co-benefit valuation), but the 25 `PROJECTS` are seeded and the analytics are shortcuts: NPV scenarios are literal multipliers (`totalNpv100 = totalNpv75 × 1.31`, `totalNpv150 = ×1.68`) rather than re-discounted cash flows, `CUMULATIVE_DATA` vs SBTi is a static series, and the co-benefit value uses fixed conversion factors (`energy × 8.4 + water × 1.2 + waste × 0.18`). The registered backend is the generic `carbon.py` suite. Evolution A makes it a real abatement-management tool.

**How.** (1) Real project data entered/persisted per project (capex, annual CO₂e, IRR, payback) via a dedicated route rather than the seed. (2) A computed MAC curve: projects ordered by real marginal abatement cost ($/tCO₂e = annualised net cost / annual abatement) with cumulative reduction — the module's headline analytic, currently an ordering of seeded MACs. (3) NPV scenarios re-run the DCF at each carbon price (using `carbon.py`'s `calculate_npv`) instead of the ×1.31/×1.68 multipliers. (4) SBTi progress computed against the company's real approved glide path (SBTi target database), tracking cumulative operational reductions vs the annual target. (5) Rung 2: pipeline what-ifs — reduction and cost trajectories under different project-approval sequences. Co-benefit conversion factors sourced.

**Prerequisites.** A project data model + persistence; the SBTi target database; sourced co-benefit valuation factors. **Acceptance:** the MAC curve is computed from real project economics and correctly ordered; NPV scenarios are genuine re-discounted DCFs, not multipliers; SBTi progress tracks the real approved target; co-benefit factors are cited.

### 9.2 Evolution B — Abatement-portfolio prioritisation copilot (LLM tier 2)

**What.** Sustainability and finance teams ask "which projects give the most CO₂ reduction per dollar?", "what's our SBTi coverage if we approve the top-5 pipeline projects?", "show the MAC curve and where our SBTi target sits" — the copilot runs the Evolution-A MAC and SBTi tools, prioritises projects by marginal abatement cost, and reports cumulative reduction vs target, every figure tool-traced.

**How.** Tool schemas over the Evolution-A MAC/NPV/SBTi routes; grounding corpus is this Atlas record plus the GHG Protocol Project Protocol and SBTi references. The copilot's core value is the prioritisation narrative the MAC curve enables — "these three negative-cost projects should proceed regardless; beyond $50/t you're better buying offsets" — with every cost and reduction figure tool-traced. The honesty duty: it distinguishes genuine operational abatement from offset reliance (the module's stated thesis — reduce dependency on external offsets), and reports SBTi coverage against the real target, not an assumed one. Abatement-portfolio reports for TCFD/CSRD compose into the report layer.

**Prerequisites (hard).** Evolution A's real project book and computed MAC — a copilot prioritising seeded projects with multiplier-based NPVs would misdirect real capital allocation. **Acceptance:** every MAC, NPV, and SBTi-coverage figure traces to a tool response; prioritisation reflects computed marginal abatement cost; operational abatement is distinguished from offsets; SBTi progress cites the approved target.