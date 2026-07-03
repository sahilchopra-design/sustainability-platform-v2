# Carbon Credit Pricing Engine
**Module ID:** `carbon-credit-pricing` · **Route:** `/carbon-credit-pricing` · **Tier:** A (backend vertical) · **EP code:** EP-CN1 · **Sprint:** CN

## 1 · Overview
20 credit types with multi-factor pricing model: Base × Vintage × Methodology × Verification × Permanence × Liquidity.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BACKTEST_RETURNS`, `BEZERO_COLOR`, `BEZERO_PRICE_RANGE`, `BEZERO_RATINGS`, `CORSIA_PHASES`, `CREDITS`, `DAILY_VOLUME`, `FORWARD_CURVE`, `GEOGRAPHIES`, `METHODOLOGIES`, `METHODOLOGY_NAMES`, `PROJECT_TYPES`, `REGISTRIES`, `REGISTRY_NAMES`, `TABS`, `VCM_AVG_PRICES`, `VCM_BENCH`, `VERIFIER_NAMES`, `VINTAGE_PREMIUMS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `METHODOLOGY_NAMES` | `['REDD+','ARR','IFM','Cookstove','Renewable Energy','Biochar','DAC','Soil Carbon','Blue Carbon','Waste Gas','CCS','Mineralization'];` |
| `seed` | `i * 37 + 1000;` |
| `methIdx` | `Math.floor(sr(seed + 1) * METHODOLOGY_NAMES.length);` |
| `regIdx` | `Math.floor(sr(seed + 2) * REGISTRY_NAMES.length);` |
| `verIdx` | `Math.floor(sr(seed + 3) * VERIFIER_NAMES.length);` |
| `geoIdx` | `Math.floor(sr(seed + 4) * GEOGRAPHIES.length);` |
| `ptIdx` | `Math.floor(sr(seed + 5) * PROJECT_TYPES.length);` |
| `vintage` | `2010 + Math.floor(sr(seed+7) * 15);` |
| `liquidity` | `0.05 + sr(seed+9) * 0.90;` |
| `additionality` | `0.5 + sr(seed+10) * 0.5;` |
| `qualityScore` | `Math.round(30 + sr(seed+11) * 70);` |
| `sylveraScore` | `Math.round(20 + sr(seed+12) * 80);` |
| `bezeroRating` | `BEZERO_RATINGS[Math.min(7, Math.floor((1 - qualityScore/100) * 8))];` |
| `bidAsk` | `0.02 + sr(seed+13) * 0.18;` |
| `dailyVolume` | `Math.round(500 + sr(seed+14) * 50000);` |
| `bufferPct` | `method === 'REDD+' \|\| method === 'IFM' ? 10 + sr(seed+15)*15` |
| `corsiaEligible` | `['REDD+','ARR','IFM','Renewable Energy','Cookstove'].includes(method) && qualityScore >= 50;` |
| `sdgCount` | `2 + Math.floor(sr(seed+16) * 7);` |

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
**Frontend seed datasets:** `BEZERO_RATINGS`, `GEOGRAPHIES`, `METHODOLOGY_NAMES`, `PROJECT_TYPES`, `REGISTRY_NAMES`, `TABS`, `VERIFIER_NAMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Credit Types | — | Market | Nature-based, renewable, industrial, CDR |
| DAC Credit Price | — | Puro/Isometric | Highest-quality engineered removal credits |

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
**Methodology:** Multi-factor credit pricing
**Headline formula:** `FairPrice = Base × VintageFactor × MethodFactor × VerifFactor × PermFactor × LiqFactor`
**Standards:** ['ICVCM', 'Market data']

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