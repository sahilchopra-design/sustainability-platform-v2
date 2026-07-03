# Carbon Project Lifecycle Manager
**Module ID:** `carbon-project-lifecycle` · **Route:** `/carbon-project-lifecycle` · **Tier:** A (backend vertical) · **EP code:** EP-DQ4 · **Sprint:** DQ

## 1 · Overview
Manages the complete lifecycle of carbon credit projects from concept through PDD development, validation, registration, monitoring, verification, and issuance. Integrates VCS, CDM, GS4GG, and Article 6.4 registry workflows with 7-section PDD builder and MRV plan.

> **Business value:** Essential for carbon project developers, corporate net zero teams developing insetting projects, and carbon market intermediaries. Provides end-to-end lifecycle management with PDD builder aligned to VCS v4.0, CDM, GS4GG v2.0, and Article 6.4 requirements.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CAL_INTERVALS`, `COUNTRIES`, `CRED_PERIOD_YRS`, `CRED_RULES`, `DOCS_REQUIRED`, `EQUIPMENT_TYPES`, `FREQUENCIES`, `METHODOLOGIES`, `PDD_SECTIONS`, `PROJECTS`, `REGISTRIES`, `REG_MILESTONES_CDM`, `REG_MILESTONES_GS`, `REG_MILESTONES_VCS`, `SECTORS`, `STAGES`, `STAGE_COLORS`, `TABS`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`, `Tab6`, `Tab7`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `STAGES` | `['Conception','PDD Development','Validation','Registration','Monitoring','Verification','Issuance','Renewal/Expired'];` |
| `METHODOLOGIES` | `['VM0007','ACM0002','GS-METH-COOK','VM0015','ACM0006','AMS-I.D','VM0042','AMS-III.D','VM0011','ACM0001','VM0017','AMS-II.G','VM0021','GS-METH-WIND','A` |
| `SECTORS` | `['Solar PV','Wind','Cookstove','REDD+','Biogas','Landfill Gas','Run-of-River Hydro','Reforestation','Livestock Methane','EE Buildings','EE Industry','` |
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
| `stageCounts` | `STAGES.map(s => ({ stage: s, count: projects.filter(p => p.stage === s).length, credits: projects.filter(p => p.stage === s).reduce((a, p) => a + p.es` |
| `pipeline` | `projects.reduce((a, p) => a + p.totalExpected, 0);` |
| `issuedYTD` | `projects.reduce((a, p) => a + p.issued, 0);` |
| `avgCycle` | `Math.round(projects.reduce((a, p) => a + p.daysSinceLast, 0) / Math.max(1, projects.length));` |
| `npv` | `(issuedYTD * 12 / 1e6).toFixed(1);` |

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

### 2.3 Engine `carbon_calculator` (services/carbon_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `CarbonCalculationEngine.calculate_project_risk` | project_type, country_code, quality_rating, custom_risks | Calculate risk factors for a single project. |
| `CarbonCalculationEngine.calculate_risk_adjusted_credits` | annual_credits, risk_breakdown | Calculate risk-adjusted credit amount. |
| `CarbonCalculationEngine.calculate_npv` | annual_credits, price_per_credit, years, discount_rate, price_growth_rate | Calculate Net Present Value of carbon credits over time. |
| `CarbonCalculationEngine.calculate_quality_score` | additionality_score, permanence_score, co_benefits_score, verification_status | Calculate overall quality score and rating for a project. |
| `CarbonCalculationEngine.generate_yearly_projections` | total_annual_credits, risk_adjusted_credits, years, optimistic_factor, pessimistic_factor | Generate yearly credit projections. |
| `CarbonCalculationEngine.run_monte_carlo` | projects, scenario, n_runs, random_seed | Run Monte Carlo simulation for portfolio. |
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

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `Manure` *(shared)*, `Wind` *(shared)*, `database` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `projects` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CAL_INTERVALS`, `COUNTRIES`, `CREDIT_PRICE`, `CRED_PERIOD_YRS`, `CRED_RULES`, `DATA_MGMT`, `DOCS_REQUIRED`, `EQUIPMENT_TYPES`, `FREQUENCIES`, `FREQ_RULES`, `METHODOLOGIES`, `PDD_SECTIONS`, `REGISTRIES`, `REG_MILESTONES_CDM`, `REG_MILESTONES_GS`

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

## 5 · Intermediate Transformation Logic
**Methodology:** Project Lifecycle Milestones
**Headline formula:** `TimeToRegistration = ConceptPhase + PDDDevelopment + ValidationPeriod + RegistrationReview; AnnualMRV = MonitoringPlan × DataCollection × InternalReview + VVBVerification`
**Standards:** ['Verra VCS Standard v4.0 (2021)', 'UNFCCC CDM Modalities and Procedures (2001)', 'Gold Standard for Global Goals v2.0 (2020)', 'Paris Agreement Article 6.4 Mechanism Rules (CMA 3)']

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
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **63** other module(s).
**Shared engines (edits propagate!):** `carbon_calculator` (used by 19 modules), `methodology_engine` (used by 19 modules)

| Connected module | Shared via |
|---|---|
| `carbon-aware-allocation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-capture-finance` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-credit-audit-trail` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-wallet` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-adjusted-valuation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-storage-geology` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-budget` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-reduction-projects` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-footprint-intelligence` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-integrity-mrv-analytics` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |