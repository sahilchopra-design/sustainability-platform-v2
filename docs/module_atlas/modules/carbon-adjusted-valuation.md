# Carbon-Adjusted Corporate Valuation
**Module ID:** `carbon-adjusted-valuation` · **Route:** `/carbon-adjusted-valuation` · **Tier:** A (backend vertical) · **EP code:** EP-DD4 · **Sprint:** DD

## 1 · Overview
Carbon-adjusted corporate valuation covering Scope 1+2+3 emissions monetisation, shadow carbon price sensitivity analysis, carbon liability EV adjustment, and sector peer comparison on carbon-adjusted EV/EBITDA multiples.

> **Business value:** Enables systematic carbon-adjusted corporate valuation incorporating Scope 1+2+3 monetisation and shadow carbon price sensitivity, producing carbon-adjusted EV/EBITDA peer comparisons.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `NGFS_PATHS`, `SECTORS`, `SECTOR_COLORS`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `baseEv` | `1 + sr(i * 7) * 49;` |
| `revenue` | `baseEv * (0.4 + sr(i * 11) * 0.8);` |
| `ebitda` | `revenue * (0.1 + sr(i * 13) * 0.25);` |
| `fcf` | `ebitda * (0.4 + sr(i * 17) * 0.4);` |
| `growthRate` | `0.02 + sr(i * 19) * 0.12;` |
| `wacc` | `0.06 + sr(i * 23) * 0.06;` |
| `scope1` | `sec === 'Energy' ? 500 + sr(i * 29) * 4500 : sec === 'Materials' ? 200 + sr(i * 29) * 1800 : 10 + sr(i * 29) * 490;` |
| `scope2` | `scope1 * (0.1 + sr(i * 31) * 0.3);` |
| `scope3Intensity` | `sr(i * 37) * 5 + 0.5;` |
| `carbonCostPassThrough` | `0.3 + sr(i * 41) * 0.5;` |
| `sbtiAligned` | `sr(i * 43) > 0.45;` |
| `netZeroYear` | `sbtiAligned ? 2045 + Math.floor(sr(i * 47) * 15) : 0;` |
| `strandedPct` | `sec === 'Energy' ? 10 + sr(i * 53) * 40 : sec === 'Materials' ? 5 + sr(i * 53) * 20 : sr(i * 53) * 5;` |
| `fossilCapex` | `sec === 'Energy' ? revenue * (0.1 + sr(i * 59) * 0.2) : revenue * sr(i * 59) * 0.05;` |
| `greenCapex` | `revenue * (0.02 + sr(i * 61) * 0.12);` |
| `carbonBeta` | `sec === 'Energy' ? 0.8 + sr(i * 67) * 1.2 : sec === 'Materials' ? 0.4 + sr(i * 67) * 0.8 : sr(i * 67) * 0.4;` |
| `esgPremium` | `sbtiAligned ? 0.01 + sr(i * 71) * 0.02 : 0;` |
| `analystTarget` | `baseEv * (0.9 + sr(i * 73) * 0.4);` |

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
**Frontend seed datasets:** `SECTORS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon-Adjusted EV/EBITDA | `(EV + Carbon Liability NPV) / EBITDA` | Company GHG data + shadow carbon price deck | Premium vs unadjusted multiple quantifies hidden carbon value destruction; high-emitter premium often 2-4x tur |
| Scope 3 Carbon Liability Share | `Scope 3 carbon liability NPV / total carbon liability NPV` | GHG Protocol Scope 3 inventory | Scope 3 dominates for consumer goods, financials, and transportation; often excluded → understatement of true  |
| Shadow Carbon Price (2030) | `Internal carbon price assumption aligned with IEA NZE orderly transition trajectory` | IEA NZE carbon price pathway | EU ETS spot ~€60-70; IEA NZE implies $130/t by 2030; high-ambition internal price $150-200/t used by Stern/Wag |
- **Company CDP and GRI GHG inventories** → Scope 1+2+3 emissions by category → carbon liability calculation → **Gross carbon liability**
- **IEA NZE / NGFS carbon price trajectories** → Forward carbon price path by scenario → shadow price deck → **Carbon liability NPV sensitivity**
- **Sector peer EV/EBITDA (Bloomberg/FactSet)** → Reported multiples → baseline for carbon-adjusted peer comparison → **Sector carbon-adjusted multiple ranking**

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
**Methodology:** Carbon-Adjusted Valuation Multiples
**Headline formula:** `Carbon-Adj EV/EBITDA = (EV + Carbon Liability NPV) / EBITDA; Carbon Liability = Scope 1+2+3 × Shadow Price × (1-PassThrough) × Duration Factor`
**Standards:** ['GHG Protocol Corporate Standard', 'WBCSD ACE Framework 2023', 'IIGCC (2023) Net Zero Investment Framework — Carbon-Adjusted Valuation Guidance']

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
| `carbon-storage-geology` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-budget` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-reduction-projects` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-footprint-intelligence` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-integrity-mrv-analytics` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |
| `carbon-removal-markets` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:datetime |