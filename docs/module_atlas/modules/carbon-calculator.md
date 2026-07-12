# Carbon Calculator
**Module ID:** `carbon-calculator` · **Route:** `/carbon-calculator` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scope 1, 2, and 3 GHG inventory calculator from activity data using IPCC AR6 emission factors, IEA country electricity emission factors, and GHG Protocol Scope 3 Category guidance. Covers 15 Scope 3 categories with 100+ sub-category emission factors. Outputs verified GHG inventory with IPCC uncertainty ranges and data quality scores.

> **Business value:** A rigorous Scope 1/2/3 GHG inventory is the foundation of all climate disclosure: temperature scoring, carbon footprint, TCFD, CSRD ESRS E1, and SBTi all depend on a complete and defensible emissions baseline. Using IPCC AR6 GWP100 values and the latest IEA emission factors ensures inventory accuracy is consistent with current scientific consensus.

**How an analyst works this module:**
- Activity Data Entry tab records energy use, fuel consumption, and travel data
- Emission Factor Library links each activity source to IPCC AR6 or IEA factor
- Scope 2 Method Selector switches between market-based and location-based
- Scope 3 Categories tab enters data for all 15 categories with guidance
- Inventory Summary shows Scope 1+2+3 totals with data quality DQ score
- Export generates GHG Protocol compliant inventory report and XBRL file

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BIZ_TRAVEL_MODES`, `BOUNDARY_APPROACHES`, `Badge`, `Btn`, `CAPITAL_GOODS_TYPES`, `COLORS`, `COMMUTE_MODES`, `DISTRICT_HEATING_EFS`, `DOCUMENTATION`, `EF_SELECTION_GUIDE`, `EOL_METHODS`, `EXCHANGE_RATES`, `FREIGHT_MODES`, `FUEL_LIFECYCLE_FACTORS`, `FUEL_TYPES`, `HISTORICAL_EMISSIONS`, `INDUSTRY_PROCESSES`, `InfoBox`, `Inp`, `KPICard`, `PCAF_ASSET_CLASSES`, `PREFILLED_TEMPLATES`, `PRODUCT_USE_PROFILES`, `Panel`, `REFRIGERANT_TYPES`, `SCOPE3_CATEGORIES`, `SCOPE3_GUIDANCE`, `SECTOR_BENCHMARKS`, `SECTOR_OPTIONS`, `SPEND_SECTORS`, `Sel`, `TABS`, `UNIT_CONVERSIONS`, `VEHICLE_TYPES`, `WASTE_TYPES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TABS` | 8 | `label` |
| `BOUNDARY_APPROACHES` | 4 | `value`, `label`, `desc` |
| `FUEL_TYPES` | 11 | `value`, `label`, `unit` |
| `VEHICLE_TYPES` | 9 | `value`, `label` |
| `INDUSTRY_PROCESSES` | 9 | `value`, `label`, `ef`, `unit`, `source` |
| `REFRIGERANT_TYPES` | 9 | `value`, `label`, `gwp` |
| `WASTE_TYPES` | 14 | `value`, `label`, `ef`, `unit`, `source` |
| `FREIGHT_MODES` | 12 | `value`, `label`, `ef`, `unit`, `source` |
| `COMMUTE_MODES` | 9 | `value`, `label`, `ef`, `unit`, `pct`, `source` |
| `BIZ_TRAVEL_MODES` | 10 | `value`, `label`, `ef`, `unit`, `source` |
| `SPEND_SECTORS` | 19 | `value`, `label`, `ef`, `source` |
| `CAPITAL_GOODS_TYPES` | 8 | `value`, `label`, `ef`, `source` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `headers` | `lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));` |
| `s1pct` | `(inventory.scope1Total / inventory.total) * 100;` |
| `change` | `((inventory.total - inventory.prevYear) / inventory.prevYear) * 100;` |
| `formatN` | `(n,d=1)=>{if(n==null\|\|isNaN(n))return'\u2014';if(Math.abs(n)>=1e6)return(n/1e6).toFixed(d)+'M';if(Math.abs(n)>=1e3)return(n/1e3).toFixed(d)+'k';return n.toFixed(d);};` |
| `fmtCO2` | `(t)=>{if(t==null\|\|isNaN(t))return'\u2014';if(t>=1e6)return(t/1e6).toFixed(2)+' MtCO2e';if(t>=1e3)return(t/1e3).toFixed(2)+' ktCO2e';return t.toFixed(2)+' tCO2e';};` |
| `scope1StationaryTotal` | `useMemo(()=>stationary.reduce((s,i)=>s+calcStationary(i),0),[stationary,calcStationary]);` |
| `scope1MobileTotal` | `useMemo(()=>mobile.reduce((s,i)=>s+calcMobile(i),0),[mobile,calcMobile]);` |
| `scope1ProcessTotal` | `useMemo(()=>process.reduce((s,i)=>s+calcProcess(i),0),[process,calcProcess]);` |
| `scope1FugitiveTotal` | `useMemo(()=>fugitive.reduce((s,i)=>s+calcFugitive(i),0),[fugitive,calcFugitive]);` |
| `scope1Total` | `useMemo(()=>scope1StationaryTotal+scope1MobileTotal+scope1ProcessTotal+scope1FugitiveTotal,[scope1StationaryTotal,scope1MobileTotal,scope1ProcessTotal,scope1FugitiveTotal]);` |
| `elecT` | `(f.elecKwh*elecFactor)/1e6;` |
| `heatT` | `(f.heatKwh*(f.heatEf\|\|0.18))/1000;` |
| `coolT` | `(f.coolKwh*elecFactor)/1e6;` |
| `resFactor` | `f.residualEf!=null?f.residualEf*1000:gridF; // residualEf in kgCO2e/kWh` |
| `scope2LocationTotal` | `useMemo(()=>facilities.reduce((s,f)=>s+calcS2Location(f),0),[facilities,calcS2Location]);` |
| `scope2MarketTotal` | `useMemo(()=>facilities.reduce((s,f)=>s+calcS2Market(f),0),[facilities,calcS2Market]);` |
| `renewableKwh` | `useMemo(()=>facilities.reduce((s,f)=>s+(f.recKwh\|\|0)+(f.ppaKwh\|\|0),0),[facilities]);` |
| `totalElecKwh` | `useMemo(()=>facilities.reduce((s,f)=>s+(f.elecKwh\|\|0),0),[facilities]);` |
| `renewablePct` | `totalElecKwh>0?(renewableKwh/totalElecKwh*100):0;` |
| `grandTotal` | `scope1Total+scope2LocationTotal+scope3Totals.total;` |
| `grandTotalMarket` | `scope1Total+scope2MarketTotal+scope3Totals.total;` |
| `intensityRevenue` | `revenue>0?(grandTotal/(revenue/1e6)):0;` |
| `intensityEmployee` | `employees>0?(grandTotal/employees):0;` |
| `sectorBench` | `useMemo(()=>SECTOR_BENCHMARKS.find(s=>s.gics===sector),[sector]);  /* ═══════════════════════════════════════════════════════════════════════════ DATA VALIDATION ═══════════════════════════════════════════════════════════════════════════ */ const validationIssues=useMemo(()=>{ const issues=[];` |
| `pct` | `(scope3Totals.byCat[c.key]/scope3Totals.total)*100;` |
| `updateEntity` | `(id,field,val)=>setEntities(es=>es.map(e=>e.id===id?{...e,[field]:val}:e));` |
| `addEntity` | `()=>{setEntities(es=>[...es,{id:nextEntityId.current++,name:'New Entity',country:'GB',ownership:50,include:true,isParent:false}]);};` |
| `updateStationary` | `(id,field,val)=>setStationary(xs=>xs.map(x=>x.id===id?{...x,[field]:val}:x));` |
| `addStationary` | `()=>{setStationary(xs=>[...xs,{id:nextS1Id.current++,desc:'New Source',fuel:'naturalGas_kWh',qty:0,note:''}]);};` |
| `updateMobile` | `(id,field,val)=>setMobile(xs=>xs.map(x=>x.id===id?{...x,[field]:val}:x));` |
| `addMobile` | `()=>{setMobile(xs=>[...xs,{id:nextS1Id.current++,desc:'New Vehicle',vehicle:'petrolCar',distance:0,fleetSize:1,note:''}]);};` |
| `updateProcess` | `(id,field,val)=>setProcess(xs=>xs.map(x=>x.id===id?{...x,[field]:val}:x));` |
| `addProcess` | `()=>{setProcess(xs=>[...xs,{id:nextS1Id.current++,desc:'New Process',industry:'cement',qty:0,note:''}]);};` |
| `updateFugitive` | `(id,field,val)=>setFugitive(xs=>xs.map(x=>x.id===id?{...x,[field]:val}:x));` |
| `addFugitive` | `()=>{setFugitive(xs=>[...xs,{id:nextS1Id.current++,desc:'New Source',refrigerant:'HFC_134a',charge:0,leakRate:5,note:''}]);};` |
| `updateFacility` | `(id,field,val)=>setFacilities(xs=>xs.map(x=>x.id===id?{...x,[field]:val}:x));` |
| `addFacility` | `()=>{setFacilities(xs=>[...xs,{id:nextFacId.current++,name:'New Facility',country:'GB',elecKwh:0,recKwh:0,ppaKwh:0,supplierEf:null,residualEf:null,heatKwh:0,heatEf:0.18,coolKwh:0}]);};` |
| `csv` | `rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `comparisonData` | `facilities.map(f=>({` |

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
**Frontend seed datasets:** `BIZ_TRAVEL_MODES`, `BOUNDARY_APPROACHES`, `CAPITAL_GOODS_TYPES`, `CBAM_SECTORS`, `COLORS`, `COMMON_MATERIAL`, `COMMUTE_MODES`, `DISTRICT_HEATING_EFS`, `EOL_METHODS`, `EXCHANGE_RATES`, `FREIGHT_MODES`, `FUEL_TYPES`, `INDUSTRY_PROCESSES`, `PCAF_ASSET_CLASSES`, `PRODUCT_USE_PROFILES`, `REFRIGERANT_TYPES`, `SCOPE3_CATEGORIES`, `SPEND_SECTORS`, `TABS`, `VEHICLE_TYPES`, `WASTE_TYPES`

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

**GET /api/v1/carbon/methodology-inputs/{methodology_code}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/carbon/methodology-list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['methodologies', 'total_count', 'sectors'], 'n_keys': 3}`

**GET /api/v1/carbon/methodology-list/{sector}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector', 'methodologies', 'message'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic
**Methodology:** GHG Protocol activity-based emission factor model
**Headline formula:** `GHG_i = Activity_data_i × EF_i × GWP_100_AR6; Scope2_market = Σ(Energy_i × EF_supplier_i) or EF_grid_location`

Activity data Ã— emission factor Ã— Global Warming Potential (100-year, AR6) gives CO₂-equivalent emissions per source. Scope 2 supports both market-based (supplier emission factors, RECs, PPAs) and location-based (IEA grid average) methods. Scope 3 uses spend-based or physical activity factors per GHG Protocol category guidance.

**Standards:** ['GHG Protocol Corporate Standard (2004+2015)', 'IPCC AR6 GWP100 Values', 'IEA Emission Factors 2023']
**Reference documents:** GHG Protocol Corporate Accounting and Reporting Standard 2004/2015; GHG Protocol Scope 3 Calculation Guidance 2011; IPCC AR6 Table 7.SM.7 GWP100 Values; IEA CO2 Emissions from Fuel Combustion 2023

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

The Carbon Calculator is one of the platform's genuinely production-grade modules: it implements the
GHG Protocol activity-based inventory faithfully, with real emission-factor libraries, a correct dual
Scope-2 (market vs location) waterfall, all 15 Scope-3 categories, and PCAF-style data-quality scoring.
It matches its guide closely; no model-specification gap is triggered, so there is no §8.

### 7.1 What the module computes

Every emission line follows the GHG Protocol master equation `emissions = activity × EF` with explicit
unit conversions:

```js
// Scope 1 — four source types (all → tCO2e)
stationary : (qty × EF_fuel.factor) / 1000          // kgCO2e → t
mobile     : (distance × fleetSize × EF_veh.factor) / 1e6   // gCO2e → t
process    : (qty × process.ef) / 1000              // kgCO2e → t
fugitive   : (charge × leakRate/100 × refrigerant.gwp) / 1000   // charge×leak×GWP

// Scope 2 — location-based
elecT = elecKwh × gridFactor(country) / 1e6
S2_loc = elecT + heatT + coolT

// Scope 2 — market-based waterfall (REC → PPA → residual)
S2_mkt = PPA_covered×supplierEf + residual_kWh×(residualEf | gridFactor) + heat + cool

grandTotal       = S1 + S2_location + S3
grandTotalMarket = S1 + S2_market   + S3
intensityRevenue = grandTotal / (revenue/1e6)      // tCO2e per $M
```

### 7.2 Parameterisation / emission-factor provenance

The module ships large **real** factor tables (`EMISSION_FACTORS`, `GRID_INTENSITY`, `INDUSTRY_PROCESSES`,
`REFRIGERANT_TYPES`, plus Scope-3 spend/activity libraries). Provenance is cited inline on each seed row
(`source` field):

| Table | Rows | Source (per inline `source`) |
|---|---|---|
| FUEL_TYPES / energy EF | 11 | IPCC AR6 / DEFRA 2023 / IEA |
| INDUSTRY_PROCESSES | 9 | process-specific `ef` with `source` cited |
| REFRIGERANT_TYPES | 9 | IPCC AR6 GWP100 (e.g. HFC-134a = 1430) |
| WASTE_TYPES | 14 | DEFRA / EPA |
| FREIGHT_MODES | 12 | DEFRA 2023 |
| COMMUTE_MODES / BIZ_TRAVEL | 9 / 10 | DEFRA 2023 |
| SPEND_SECTORS (Scope 3) | 19 | EEIO spend factors |
| CAPITAL_GOODS / PRODUCT_USE / EOL | 8 / 11 / 6 | GHG Protocol category guidance |
| GRID_INTENSITY | per-country | IEA country grid gCO₂/kWh (fallback 400) |
| PCAF_ASSET_CLASSES | 8 | PCAF method + typical DQS |

Refrigerant fugitive emissions correctly use **GWP100** (not an EF), matching IPCC AR6 values. The Scope-3
Category 6 commute/travel modes carry a `pct` share for allocation. The default `heatEf` (0.18 kgCO₂e/kWh)
and residual grid fallback (400 gCO₂/kWh) are the only heuristic constants.

### 7.3 Calculation walkthrough

Scope 1 sums four independent source lists (stationary, mobile, process, fugitive), each mapped to its
factor table with the correct unit divisor (÷1000 for kg, ÷1e6 for g). Scope 2 runs **both** methods per
facility: location-based multiplies electricity by the country grid factor; market-based runs a
contractual-instrument waterfall — RECs zero out covered kWh, PPAs apply a supplier-specific EF to the
next tranche, and the residual is charged at a residual-mix or grid factor. Scope 3 evaluates each of the
15 categories by its chosen methodology (spend × EEIO factor, or activity × custom EF, or supplier data).
A DQS-weighted average (`Σ dqs×emissions / Σ emissions`) gives inventory data quality. Intensity metrics
divide the grand total by revenue and headcount.

### 7.4 Worked example (mixed inventory)

**Scope 1 stationary** — natural gas 500,000 kWh, EF 0.18316 kgCO₂e/kWh:
`(500,000 × 0.18316)/1000 = 91.58 tCO₂e`.

**Scope 1 fugitive** — HFC-134a, charge 100 kg, leak 5%, GWP 1430:
`(100 × 0.05 × 1430)/1000 = 7.15 tCO₂e`.

**Scope 2** — facility in a 233 gCO₂/kWh grid, 1,000,000 kWh electricity, 400,000 kWh covered by RECs,
no PPA:
- Location-based: `1,000,000 × 233 / 1e6 = 233 tCO₂e`.
- Market-based: RECs cover 400k kWh → residual 600k kWh at grid factor → `600,000 × 233 / 1e6 = 139.8
  tCO₂e`. The 93.2 t gap is the contractual-instrument benefit — exactly the GHG Protocol Scope 2 dual-
  reporting mechanic.

**Scope 3 Cat 1 (spend)** — $250,000 procurement at EEIO factor 0.42 kgCO₂e/$:
`(250,000 × 0.42)/1000 = 105 tCO₂e`. If Cat 1 DQS=4 and dominates, `scope3DqsAvg → 4`.

`grandTotal (location) = 91.58 + 7.15 + 233 + 105 = 436.7 tCO₂e`; market-based swaps 233→139.8 →
`343.5 tCO₂e`.

### 7.5 Data provenance & limitations

- **Emission factors are real and cited** (DEFRA 2023, IPCC AR6 GWP100, IEA grid factors, EEIO spend
  factors) — this module is *not* synthetic; user activity data drives the numbers.
- Simplifications vs production: grid fallback of 400 gCO₂/kWh when a country isn't found; default heat EF
  0.18; no time-series of grid factors (single current value); Scope-3 spend method is EEIO-average, which
  the guide's data-quality flag correctly marks as low DQS (4–5).
- Uncertainty ranges are noted in the guide but the calculator reports point estimates plus a DQS score
  rather than IPCC uncertainty propagation.

**Framework alignment:** GHG Protocol Corporate Standard (2004/2015) — the activity×EF spine and Scope 1
four-source decomposition · GHG Protocol Scope 2 Guidance (2015) — the market/location dual reporting and
the REC→PPA→residual-mix hierarchy implemented in `calcS2Market` · GHG Protocol Scope 3 Standard (2011) —
all 15 categories with spend/activity/supplier methods · IPCC AR6 — GWP100 values for refrigerants and
fuels · PCAF — the DQS 1–5 data-quality scoring and asset-class table for the Category-15 financed-
emissions path.

## 9 · Future Evolution

### 9.1 Evolution A — Server-side calculation, versioned EF library, and uncertainty ranges (analytics ladder: rung 2 → 3)

**What.** This is one of the platform's most genuinely complete modules: a real Scope 1/2/3 GHG inventory calculator with per-source calc functions (`calcStationary/calcMobile/calcProcess/calcFugitive`, location vs market-based Scope 2, all 15 Scope 3 categories) over extensive real emission-factor tables (fuel, refrigerant GWP, freight, spend-based, capital goods, each with a `source` field). The gaps are architectural: the calculation runs **client-side** so it can't feed other modules server-side; the EF library is embedded in the frontend rather than the versioned refdata layer; and the overview promises "IPCC uncertainty ranges" that the point-estimate calc doesn't produce. Evolution A hardens the platform's canonical GHG engine.

**How.** (1) Move the calculation to a backend engine (`POST /api/v1/carbon-calculator/inventory`) so the whole platform consumes one authoritative inventory rather than a client-side one — this module *is* the emissions source that `carbon-adjusted-valuation`, `carbon-budget`, PCAF, and temperature-scoring all depend on. (2) EF library to versioned refdata (IPCC AR6, IEA country factors) so factor updates are data migrations with vintages, not code edits. (3) Implement the promised IPCC uncertainty ranges: each EF carries an uncertainty band, propagated to a total inventory ± range (rung 3 — the inventory becomes a distribution, not a point). (4) Pin a reference inventory in bench_quant (the platform's flagship GHG calc deserves a golden case). (5) The DQS integrates the real `validation_summary` envelope.

**Prerequisites.** EF-library sourcing with uncertainty bands (IPCC publishes them); Alembic migration for the refdata tables. **Acceptance:** an inventory computed server-side matches the client calc for the same inputs; every EF carries source and vintage; the total inventory reports an uncertainty range; a bench case pins a reference company's Scope 1/2/3.

### 9.2 Evolution B — GHG-inventory copilot with guided data entry (LLM tier 2)

**What.** Building an inventory is tedious data entry across dozens of activity types; the copilot guides it: "add our three UK offices' electricity" prompts for kWh and REC/PPA coverage, selects location vs market-based Scope 2, applies the right IEA country factor, and reports the contribution — then flags gaps ("no Scope 3 Category 1 data — that's usually the largest category"). Every factor and tonne comes from the Evolution-A engine, never estimated.

**How.** Tool schemas over the Evolution-A inventory route and the EF-library lookups; the copilot's data-entry flow uses the module's real `EF_SELECTION_GUIDE`, `SCOPE3_GUIDANCE`, and `PREFILLED_TEMPLATES` as grounding so it recommends the correct factor and boundary approach. Grounding corpus: this Atlas record plus the GHG Protocol / IPCC AR6 references. The uncertainty ranges from Evolution A carry into answers so the copilot presents inventory totals with their confidence, and the DQS reflects data-source quality per entry. Export composes the GHG-Protocol-compliant report and XBRL file the module already generates.

**Prerequisites.** Evolution A's backend engine and EF library (a copilot can't tool-call a client-side calc). **Acceptance:** every emission factor and tonne in an answer traces to the engine; the copilot recommends factors from the real selection guide; inventory totals carry uncertainty ranges and DQS; missing high-materiality categories are flagged.