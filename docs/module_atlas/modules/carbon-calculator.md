# Carbon Calculator
**Module ID:** `carbon-calculator` · **Route:** `/carbon-calculator` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scope 1, 2, and 3 GHG inventory calculator from activity data using IPCC AR6 emission factors, IEA country electricity emission factors, and GHG Protocol Scope 3 Category guidance. Covers 15 Scope 3 categories with 100+ sub-category emission factors. Outputs verified GHG inventory with IPCC uncertainty ranges and data quality scores.

> **Business value:** A rigorous Scope 1/2/3 GHG inventory is the foundation of all climate disclosure: temperature scoring, carbon footprint, TCFD, CSRD ESRS E1, and SBTi all depend on a complete and defensible emissions baseline. Using IPCC AR6 GWP100 values and the latest IEA emission factors ensures inventory accuracy is consistent with current scientific consensus.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BIZ_TRAVEL_MODES`, `BOUNDARY_APPROACHES`, `Badge`, `Btn`, `CAPITAL_GOODS_TYPES`, `COLORS`, `COMMUTE_MODES`, `DISTRICT_HEATING_EFS`, `DOCUMENTATION`, `EF_SELECTION_GUIDE`, `EOL_METHODS`, `EXCHANGE_RATES`, `FREIGHT_MODES`, `FUEL_LIFECYCLE_FACTORS`, `FUEL_TYPES`, `HISTORICAL_EMISSIONS`, `INDUSTRY_PROCESSES`, `InfoBox`, `Inp`, `KPICard`, `PCAF_ASSET_CLASSES`, `PREFILLED_TEMPLATES`, `PRODUCT_USE_PROFILES`, `Panel`, `REFRIGERANT_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `headers` | `lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));` |
| `s1pct` | `(inventory.scope1Total / inventory.total) * 100;` |
| `change` | `((inventory.total - inventory.prevYear) / inventory.prevYear) * 100;` |
| `formatN` | `(n,d=1)=>{if(n==null\|\|isNaN(n))return'\u2014';if(Math.abs(n)>=1e6)return(n/1e6).toFixed(d)+'M';if(Math.abs(n)>=1e3)return(n/1e3).toFixed(d)+'k';return` |
| `fmtCO2` | `(t)=>{if(t==null\|\|isNaN(t))return'\u2014';if(t>=1e6)return(t/1e6).toFixed(2)+' MtCO2e';if(t>=1e3)return(t/1e3).toFixed(2)+' ktCO2e';return t.toFixed(2` |
| `scope1StationaryTotal` | `useMemo(()=>stationary.reduce((s,i)=>s+calcStationary(i),0),[stationary,calcStationary]);` |
| `scope1MobileTotal` | `useMemo(()=>mobile.reduce((s,i)=>s+calcMobile(i),0),[mobile,calcMobile]);` |
| `scope1ProcessTotal` | `useMemo(()=>process.reduce((s,i)=>s+calcProcess(i),0),[process,calcProcess]);` |
| `scope1FugitiveTotal` | `useMemo(()=>fugitive.reduce((s,i)=>s+calcFugitive(i),0),[fugitive,calcFugitive]);` |
| `scope1Total` | `useMemo(()=>scope1StationaryTotal+scope1MobileTotal+scope1ProcessTotal+scope1FugitiveTotal,[scope1StationaryTotal,scope1MobileTotal,scope1ProcessTotal` |
| `elecT` | `(f.elecKwh*elecFactor)/1e6;` |
| `heatT` | `(f.heatKwh*(f.heatEf\|\|0.18))/1000;` |
| `coolT` | `(f.coolKwh*elecFactor)/1e6;` |
| `resFactor` | `f.residualEf!=null?f.residualEf*1000:gridF; // residualEf in kgCO2e/kWh` |
| `scope2LocationTotal` | `useMemo(()=>facilities.reduce((s,f)=>s+calcS2Location(f),0),[facilities,calcS2Location]);` |
| `scope2MarketTotal` | `useMemo(()=>facilities.reduce((s,f)=>s+calcS2Market(f),0),[facilities,calcS2Market]);` |
| `renewableKwh` | `useMemo(()=>facilities.reduce((s,f)=>s+(f.recKwh\|\|0)+(f.ppaKwh\|\|0),0),[facilities]);` |
| `totalElecKwh` | `useMemo(()=>facilities.reduce((s,f)=>s+(f.elecKwh\|\|0),0),[facilities]);` |

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
**Frontend seed datasets:** `BIZ_TRAVEL_MODES`, `BOUNDARY_APPROACHES`, `CAPITAL_GOODS_TYPES`, `CBAM_SECTORS`, `COLORS`, `COMMON_MATERIAL`, `COMMUTE_MODES`, `DISTRICT_HEATING_EFS`, `EOL_METHODS`, `EXCHANGE_RATES`, `FREIGHT_MODES`, `FUEL_TYPES`, `INDUSTRY_PROCESSES`, `PCAF_ASSET_CLASSES`, `PRODUCT_USE_PROFILES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scope 1 Direct Emissions | `Activity × EF × GWP100_AR6` | IPCC AR6 | Combustion, process, fugitive and agricultural emissions owned/controlled by company |
| Scope 2 (Market-Based) | `ΣEnergy_i × EF_supplier_i` | GHG Protocol Scope 2 | Indirect electricity emissions using contractual instruments: RECs, PPAs, supplier-specific factors |
| Scope 3 Total | `15 categories per GHG Protocol` | GHG Protocol Scope 3 | Value chain emissions from purchased goods (Cat.1) through investments (Cat.15) |
- **Activity data inputs (energy, fuel, travel, procurement spend)** → Match each activity to IPCC AR6 / IEA emission factor; apply GWP100 → **Scope 1+2+3 GHG inventory by source category with data quality flags**
- **IEA country electricity emission factors (2023)** → Apply to location-based Scope 2; compare against market-based to show contractual reduction → **Dual Scope 2 reporting (location-based and market-based) per GHG Protocol**

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
**Methodology:** GHG Protocol activity-based emission factor model
**Headline formula:** `GHG_i = Activity_data_i × EF_i × GWP_100_AR6; Scope2_market = Σ(Energy_i × EF_supplier_i) or EF_grid_location`
**Standards:** ['GHG Protocol Corporate Standard (2004+2015)', 'IPCC AR6 GWP100 Values', 'IEA Emission Factors 2023']

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