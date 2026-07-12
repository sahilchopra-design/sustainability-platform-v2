# Carbon Project Lifecycle Manager
**Module ID:** `carbon-project-lifecycle` · **Route:** `/carbon-project-lifecycle` · **Tier:** A (backend vertical) · **EP code:** EP-DQ4 · **Sprint:** DQ

## 1 · Overview
Manages the complete lifecycle of carbon credit projects from concept through PDD development, validation, registration, monitoring, verification, and issuance. Integrates VCS, CDM, GS4GG, and Article 6.4 registry workflows with 7-section PDD builder and MRV plan.

> **Business value:** Essential for carbon project developers, corporate net zero teams developing insetting projects, and carbon market intermediaries. Provides end-to-end lifecycle management with PDD builder aligned to VCS v4.0, CDM, GS4GG v2.0, and Article 6.4 requirements.

**How an analyst works this module:**
- Select standard and register project concept
- Build 7-section PDD using standard templates
- Set monitoring plan with equipment and frequency
- Track validation and registration milestones
- Manage annual monitoring, verification, and issuance cycle

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CAL_INTERVALS`, `COUNTRIES`, `CRED_PERIOD_YRS`, `CRED_RULES`, `DOCS_REQUIRED`, `EQUIPMENT_TYPES`, `FREQUENCIES`, `METHODOLOGIES`, `PDD_SECTIONS`, `PROJECTS`, `REGISTRIES`, `REG_MILESTONES_CDM`, `REG_MILESTONES_GS`, `REG_MILESTONES_VCS`, `SECTORS`, `STAGES`, `STAGE_COLORS`, `TABS`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`, `Tab6`, `Tab7`, `Tab8`, `VAL_STAGES`, `VCU_TYPES`, `VVBS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PDD_SECTIONS` | 33 | `title`, `weight`, `items`, `id`, `label` |
| `VAL_STAGES` | 8 | `target`, `desc` |
| `FREQ_RULES` | 6 | `rule` |
| `CRED_RULES` | 6 | `types`, `afolu` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `STAGES` | `['Conception','PDD Development','Validation','Registration','Monitoring','Verification','Issuance','Renewal/Expired'];` |
| `METHODOLOGIES` | `['VM0007','ACM0002','GS-METH-COOK','VM0015','ACM0006','AMS-I.D','VM0042','AMS-III.D','VM0011','ACM0001','VM0017','AMS-II.G','VM0021','GS-METH-WIND','ACM0012'];` |
| `SECTORS` | `['Solar PV','Wind','Cookstove','REDD+','Biogas','Landfill Gas','Run-of-River Hydro','Reforestation','Livestock Methane','EE Buildings','EE Industry','Mangrove','Agricultural Soil','Urban Transit','Geothermal'];` |
| `VCU_TYPES` | `['VCU','GS-VER','CER','ACER','CRT'];` |
| `estAnnualCredits` | `Math.round(5000 + sr(i * 13) * 95000);` |
| `cpStartYear` | `2018 + Math.floor(sr(i * 7) * 7);` |
| `totalExpected` | `estAnnualCredits * cpYrs;` |
| `issued` | `stage === 'Issuance' \|\| stage === 'Renewal/Expired' \|\| stage === 'Verification'` |
| `pctComplete` | `Math.round(10 + sr(i * 17) * 88);` |
| `daysSinceLast` | `Math.round(5 + sr(i * 19) * 90);` |
| `pddComplete` | `stage === 'Conception' ? Math.round(10 + sr(i * 23) * 30) : Math.round(50 + sr(i * 23) * 50);` |
| `carsOpen` | `stage === 'Validation' \|\| stage === 'Verification' ? Math.floor(sr(i * 29) * 4) : 0;` |
| `carsClosed` | `Math.floor(sr(i * 31) * 6);` |
| `stageCounts` | `STAGES.map(s => ({ stage: s, count: projects.filter(p => p.stage === s).length, credits: projects.filter(p => p.stage === s).reduce((a, p) => a + p.estimatedAnnualCredits, 0) }));` |
| `pipeline` | `projects.reduce((a, p) => a + p.totalExpected, 0);` |
| `issuedYTD` | `projects.reduce((a, p) => a + p.issued, 0);` |
| `avgCycle` | `Math.round(projects.reduce((a, p) => a + p.daysSinceLast, 0) / Math.max(1, projects.length));` |
| `npv` | `(issuedYTD * 12 / 1e6).toFixed(1);` |
| `maxCount` | `Math.max(1, ...stageCounts.map(s => s.count));` |
| `totalItems` | `PDD_SECTIONS.reduce((a, s) => a + s.items.length, 0);` |
| `doneItems` | `PDD_SECTIONS.reduce((a, s) => a + s.items.filter(item => checked[item.id]).length, 0);` |
| `totalScore` | `totalItems > 0 ? (doneItems / totalItems * 100) : 0;` |
| `viewProj` | `valProjects[selIdx % Math.max(1, valProjects.length)] \|\| projects[0];` |
| `currentStageIdx` | `Math.floor(sr(selIdx * 53) * VAL_STAGES.length);` |
| `daysInStage` | `Math.round(5 + sr(selIdx * 59) * 30);` |
| `stIdx` | `Math.floor(sr(i * 53) * VAL_STAGES.length);` |
| `daysIn` | `Math.round(5 + sr(i * 59) * 30);` |
| `submDate` | ``${2023 + Math.floor(sr(i * 61) * 2)}-${String(Math.ceil(sr(i * 67) * 12)).padStart(2,'0')}-${String(Math.ceil(sr(i * 71) * 28)).padStart(2,'0')}`;` |
| `dueDate` | ``${2024 + Math.floor(sr(i * 73) * 2)}-${String(Math.ceil(sr(i * 79) * 12)).padStart(2,'0')}-${String(Math.ceil(sr(i * 83) * 28)).padStart(2,'0')}`;` |
| `barPct` | `active ? Math.min(100, (daysInStage / s.target) * 100) : done ? 100 : 0;` |
| `REG_MILESTONES_VCS` | `['PDD submitted to Verra','VVB double-peer review','VCS programme review','Registration on Verra Registry','VERRA serial number assigned'];` |
| `msIdx` | `Math.floor(sr(i * 97) * milestones.length);` |
| `submitted` | ``${2022 + Math.floor(sr(i * 101) * 3)}-${String(Math.ceil(sr(i * 103) * 12)).padStart(2,'0')}-15`;` |
| `due` | ``${2023 + Math.floor(sr(i * 107) * 3)}-${String(Math.ceil(sr(i * 109) * 12)).padStart(2,'0')}-15`;` |
| `statusIdx` | `Math.floor(sr(i * 113) * 5);` |
| `lastCal` | `new Date(2024, Math.floor(sr(selIdx * 200 + p) * 12), 1);` |
| `calMonths` | `[6, 12, 24][Math.floor(sr(selIdx * 201 + p) * 3)];` |
| `nextCal` | `new Date(lastCal); nextCal.setMonth(nextCal.getMonth() + calMonths);` |
| `status` | `sr(selIdx * 202 + p) > 0.85 ? 'Overdue' : sr(selIdx * 202 + p) > 0.65 ? 'Due Soon' : 'OK';` |
| `dmChecked` | `DATA_MGMT.map((_, i) => sr(selIdx * 300 + i) > 0.2);` |

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
**Frontend seed datasets:** `CAL_INTERVALS`, `COUNTRIES`, `CREDIT_PRICE`, `CRED_PERIOD_YRS`, `CRED_RULES`, `DATA_MGMT`, `DOCS_REQUIRED`, `EQUIPMENT_TYPES`, `FREQUENCIES`, `FREQ_RULES`, `METHODOLOGIES`, `PDD_SECTIONS`, `REGISTRIES`, `REG_MILESTONES_CDM`, `REG_MILESTONES_GS`, `REG_MILESTONES_VCS`, `SECTORS`, `STAGES`, `STAGE_COLORS`, `TABS`, `VAL_STAGES`, `VCU_TYPES`, `VVBS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CDM Registration Timeline | — | UNFCCC CDM Board 2023 | Average CDM project timeline from concept to registration is 18–36 months — validation is longest step |
| VCS Issuance Turnaround | — | Verra Registry Data 2024 | VCS verification and issuance takes 6–9 months — key pipeline timing assumption for project finance |
| PDD Development Cost | — | South Pole Project Development 2023 | CDM/VCS PDD development cost range — varies by methodology complexity and project size |
- **Project technical specifications and feasibility study** → PDD Section A/B/C → **Completed project description, baseline, and crediting period**
- **Monitoring equipment data + QA/QC protocols** → PDD Section D — Monitoring Plan → **MRV plan with data sources, frequency, and equipment specifications**
- **Registry application requirements (VCS, GS, CDM)** → Registration checklist → **Completed application documentation with validation report**

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
**Methodology:** Project Lifecycle Milestones
**Headline formula:** `TimeToRegistration = ConceptPhase + PDDDevelopment + ValidationPeriod + RegistrationReview; AnnualMRV = MonitoringPlan × DataCollection × InternalReview + VVBVerification`

PDD has 7 mandatory sections (A: description, B: baseline, C: duration, D: monitoring, E: GHG impacts, F: SD impacts, G: stakeholder consultation); MRV plan specifies data sources, frequency, equipment, and QA/QC procedures

**Standards:** ['Verra VCS Standard v4.0 (2021)', 'UNFCCC CDM Modalities and Procedures (2001)', 'Gold Standard for Global Goals v2.0 (2020)', 'Paris Agreement Article 6.4 Mechanism Rules (CMA 3)']
**Reference documents:** Verra Verified Carbon Standard v4.0 (2021); UNFCCC CDM Modalities and Procedures — Decision 17/CP.7 (2001); Gold Standard for Global Goals — Principles and Requirements v2.0 (2020); Paris Agreement Article 6.4 Mechanism Supervisory Body Rules (2022)

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
| `carbon-removal-markets` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-adjusted-valuation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-capture-finance` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |

## 7 · Methodology Deep Dive

The Carbon Project Lifecycle Manager is a workflow/state-tracking module aligned with its guide: it models
the 8-stage carbon-project lifecycle, a 7-section PDD builder, an MRV/validation stage tracker, and
issuance milestones, using real methodology codes, registries, VVBs, and crediting-period rules. It does
not run a risk or valuation model, so §8 is not triggered (one mislabelled quantity is flagged instead).

### 7.1 What the module computes

For 60 projects distributed across the 8 lifecycle stages, the module derives pipeline aggregates and
per-project progress:

```js
totalExpected = estimatedAnnualCredits × creditingPeriodYrs         // lifetime credit volume
issued        = stage∈{Issuance,Renewal,Verification} ? totalExpected×(0.3..0.8)
              : stage==='Monitoring'                    ? totalExpected×(0.1..0.3) : 0
pipeline      = Σ totalExpected
issuedYTD     = Σ issued
avgCycle      = mean(daysSinceLast)
npv           = (issuedYTD × 12 / 1e6).toFixed(1)                   // ⚠ NOT an NPV
totalScore    = doneItems / totalItems × 100                        // PDD completeness
```

The PDD builder scores completeness across `PDD_SECTIONS` (33 checklist items across the 7 mandatory
sections); the validation tracker steps projects through `VAL_STAGES` with target durations.

### 7.2 Parameterisation

**Lifecycle stages** (`STAGES`): Conception → PDD Development → Validation → Registration → Monitoring →
Verification → Issuance → Renewal/Expired — the canonical Verra/CDM project flow.

**Real reference lists** (provenance: authentic standards taxonomy):

| List | Values |
|---|---|
| REGISTRIES | Verra VCS, Gold Standard, CDM, ACR, CAR |
| METHODOLOGIES | VM0007, ACM0002, GS-METH-COOK, VM0015, AMS-I.D, VM0042 … (real codes) |
| VVBS | Bureau Veritas, SGS, TÜV SÜD, DNV, RINA, LRQA, ERM CVS (real accredited bodies) |
| VCU_TYPES | VCU, GS-VER, CER, ACER, CRT |
| CRED_PERIOD_YRS | 7/10/20/30 yr — real crediting periods (e.g. VM0042 soil = 30yr, biogas = 20yr) |

**Synthetic per-project fields** (`sr()`-seeded): estimated annual credits (5k–100k), issuance %, PDD
completion %, CARs open/closed, days-since-last-activity, validation/verification status. The stage,
registry, methodology, country, and sector are assigned by round-robin (`i % length`), not random.

### 7.3 Calculation walkthrough

Projects are bucketed by stage (`stageCounts`) → pipeline totals summed → issued-YTD summed → the "npv"
KPI is `issuedYTD × 12 / 1e6` (i.e. it values issued credits at a flat **$12/credit** and expresses in
$M — a credit-volume proxy, not a discounted cash flow). The PDD builder counts checked items against 33
total for a completeness %. The validation tracker advances a selected project through the stage list with
target vs actual days-in-stage.

### 7.4 Worked example (pipeline + PDD)

A project: `estimatedAnnualCredits = 40,000`, `creditingPeriodYrs = 10` → `totalExpected = 400,000`
credits. Stage = Issuance → `issued = 400,000 × (0.3..0.8)`, say ×0.55 = **220,000** credits issued.

Pipeline "npv" contribution: `220,000 × 12 / 1e6 = $2.64M` (at the flat $12/credit heuristic).

PDD completeness: if 24 of the 33 `PDD_SECTIONS` items are checked → `totalScore = 24/33 × 100 = 72.7%`.

### 7.5 Companion analytics & interconnections

- **Stage funnel** — project counts and credit volumes per lifecycle stage.
- **PDD builder** — 7-section (A description, B baseline, C duration, D monitoring, E GHG impacts, F SD
  impacts, G stakeholder consultation) checklist with weighted completeness.
- **MRV / calibration schedule** — per-parameter last/next calibration dates with Overdue/Due-Soon/OK
  status (`FREQ_RULES`).
- **Crediting rules** (`CRED_RULES`) — AFOLU vs non-AFOLU crediting-period and renewal rules.

### 7.6 Data provenance & limitations

- Methodology codes, registries, VVBs, credit types, and crediting-period years are **real**; project
  instances and all progress metrics are **synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- The `npv` KPI is **mislabelled** — it is issued-credit volume valued at a flat $12/credit, not a
  discounted cash flow; it ignores price differentiation by methodology (the pricing module handles that)
  and has no discounting.
- The module tracks *state*, not economics — no project finance, no MRV data ingestion, no live registry
  serial numbers.

**Framework alignment:** Verra VCS Standard v4.0 — the 8-stage lifecycle, PDD structure, and VCU issuance ·
UNFCCC CDM Modalities & Procedures — CDM registration flow and CER credit type · Gold Standard for Global
Goals v2.0 — GS-VER credit type and SD-impact PDD section · Paris Agreement Article 6.4 — the mechanism the
lifecycle can target for authorised credits · ISO 14064-2/3 — the MRV monitoring-plan and validation/
verification steps the tracker sequences (VVB validation before registration, periodic verification before
each issuance).

## 9 · Future Evolution

### 9.1 Evolution A — Persistent lifecycle workflow replacing seeded project states (analytics ladder: rung 1 → 2)

**What.** The page models the full carbon-project lifecycle (Conception → PDD → Validation → Registration → Monitoring → Verification → Issuance → Renewal) with genuinely useful real reference content: a 33-section PDD builder with a working checklist (`totalScore = doneItems/totalItems`), standard-specific registration milestones (VCS/CDM/GS), MRV frequency rules, and crediting-period rules. But the `PROJECTS` pipeline is seeded (`estAnnualCredits`, `pctComplete`, `carsOpen`, stage all `sr()`-driven) and nothing persists — the registered backend is the generic `carbon.py` credit suite, not a lifecycle store. The PDD checklist state lives in local `checked` state. Evolution A makes it a real project-management system.

**How.** (1) Persist projects and their lifecycle state server-side (`carbon_projects` table with stage, PDD-section completion, milestones, CAR/CL status) via dedicated routes — the `carbon.py` `create_project`/`update_project` routes are a starting point but need lifecycle-specific fields. (2) The PDD builder's 33-section checklist persists per project, computing real completion scores and gating stage transitions (can't reach Registration without a complete PDD). (3) Registration milestones tracked against real dates, with the standard-specific milestone templates (VCS/CDM/GS4GG/A6.4 — already in the seed) driving the workflow. (4) MRV plan with real equipment/frequency selections per methodology. (5) Rung 2: pipeline forecasting — projected issuance timing and volume from stage durations and completion rates across the real project book, replacing the flat `npv = issuedYTD × 12` proxy.

**Prerequisites.** A lifecycle data model + migration; retire the seeded project generator. **Acceptance:** a project's stage and PDD completion persist and drive gated transitions; milestones track real dates; pipeline forecasts derive from actual stage durations; PDD scores reflect persisted checklist state.

### 9.2 Evolution B — PDD-development and lifecycle copilot (LLM tier 2)

**What.** Project developers ask "what PDD sections are incomplete for this VCS project?", "what's my next registration milestone and its deadline?", "which MRV equipment does this methodology require?", "draft the additionality section for a solar PDD under ACM0002" — the copilot runs the Evolution-A lifecycle tools, reports completion status and next actions, and drafts PDD content against the standard's template, every requirement tool-traced.

**How.** Tool schemas over the Evolution-A lifecycle/PDD routes; the 33-section PDD structure and standard-specific milestones are the copilot's grounding for what each standard requires. Grounding corpus: this Atlas record plus the VCS v4 / CDM / GS4GG / Article 6.4 references. The copilot drafts PDD narrative sections (additionality, baseline, monitoring) using the methodology's template, but marks any quantitative claim (emission reductions, baseline factors) as requiring the developer's project data rather than inventing it — a PDD is an auditable regulatory document. Mutating actions (advancing a stage, marking sections complete) gated behind confirmation.

**Prerequisites (hard).** Evolution A's persistence — a copilot narrating seeded project states would misreport lifecycle status, and drafting PDD content against fabricated project data would produce non-submittable documents. **Acceptance:** every completion status and milestone traces to a tool response; drafted PDD sections mark quantitative claims as requiring project data; stage advancement requires confirmation and a complete prerequisite (e.g. PDD) checked server-side.