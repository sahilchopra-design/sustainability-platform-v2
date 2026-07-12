# Carbon-Aware Allocation
**Module ID:** `carbon-aware-allocation` · **Route:** `/carbon-aware-allocation` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Portfolio construction engine that tilts toward lower-carbon assets while maintaining factor exposure and tracking error constraints. Supports EU Paris-Aligned Benchmark (PAB) and Climate Transition Benchmark (CTB) compliance, Scope 1+2 carbon intensity minimisation, and SBTi-aligned holding exclusions. Backtests carbon tilt impact on risk-adjusted returns.

> **Business value:** Carbon-aware allocation enables index-hugging ESG funds to achieve EU PAB/CTB regulatory compliance while preserving risk-adjusted returns within controlled tracking error budgets. Rigorous quadratic optimisation with annual decarbonisation trajectory constraints ensures benchmarks remain on a Paris-consistent glide path over a multi-year investment horizon.

**How an analyst works this module:**
- Benchmark Configuration tab selects PAB, CTB, or custom carbon tilt target
- Optimisation tab runs portfolio construction with carbon constraint and TE budget
- Holdings Comparison shows over/underweight vs benchmark by carbon intensity decile
- PAB Compliance tab verifies all mandatory exclusions and 50%/7% requirements
- Backtest tab shows 5-year risk/return impact of carbon tilt vs benchmark
- Attribution tab decomposes active return into carbon tilt vs sector/factor effects

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `COLORS`, `DATA`, `PAGE_SIZE`, `REGIONS`, `SECTORS`, `STRATEGIES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt1` | `n=>Number(n).toFixed(1);const fmt0=n=>Number(n).toFixed(0);const fmtM=n=>n>=1000?`$${(n/1000).toFixed(1)}B`:`$${n}M`;` |
| `STRATEGIES` | `['Low Carbon','Paris-Aligned','Climate Transition','Net Zero','Carbon Neutral'];` |
| `sector` | `SECTORS[Math.floor(s(17)*SECTORS.length)];` |
| `assetClass` | `ASSET_CLASSES[Math.floor(s(23)*ASSET_CLASSES.length)];` |
| `region` | `REGIONS[Math.floor(s(29)*REGIONS.length)];` |
| `strategy` | `STRATEGIES[Math.floor(s(31)*STRATEGIES.length)];` |
| `weight` | `Number((0.5+s(37)*4.5).toFixed(2));` |
| `carbonInt` | `Math.floor(5+s(41)*495);` |
| `optWeight` | `Number((weight*(0.6+s(43)*0.8)).toFixed(2));` |
| `optCarbonInt` | `Math.floor(carbonInt*(0.4+s(47)*0.5));` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.cre` |
| `paged` | `useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const d=filtered;if(!d.length)return{count:0,waci:0,optWaci:0,reduction:0,avgTE:0,avgTemp:0}; const waci=d.reduce((a,r)=>a+r.waci,0);const optWaci=d.reduce((a,r)=>a+r.optWaci,0);` |
| `sectorCarbon` | `useMemo(()=>SECTORS.map(s=>{const items=filtered.filter(r=>r.sector===s);return{name:s.length>10?s.slice(0,10)+'..':s,current:items.reduce((a,r)=>a+r.waci,0),optimized:items.reduce((a,r)=>a+r.optWaci,0)};}).filter(d=>d.c` |
| `assetDist` | `useMemo(()=>ASSET_CLASSES.map(a=>({name:a,value:filtered.filter(r=>r.assetClass===a).reduce((acc,r)=>acc+r.weight,0)})).filter(d=>d.value>0),[filtered]);` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/ Math.max(1, filtered.length);` |
| `scopeData` | `useMemo(()=>{if(!filtered.length)return[];return[{name:'Scope 1',value:filtered.reduce((a,r)=>a+r.scope1,0)},{name:'Scope 2',value:filtered.reduce((a,r)=>a+r.scope2,0)},{name:'Scope 3',value:filtered.reduce((a,r)=>a+r.sc` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,carbon:filtered.reduce((a,r)=>a+[r.q1Carbon,r.q2Carbon,r.q3Carbon,r.q4Carbon][i],0)/(filtered.length\|\|1)})),[filtered]);` |

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
**Frontend seed datasets:** `ASSET_CLASSES`, `COLORS`, `REGIONS`, `SECTORS`, `STRATEGIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Carbon Intensity | `w_i×Scope1+2 / EVIC` | PCAF | WACI-equivalent metric; PAB requires ≥50% below benchmark intensity |
| PAB/CTB Decarbonisation Rate | — | EU Delegated Act 2020/1818 | Required annual carbon intensity reduction for benchmark compliance |
| Tracking Error vs Benchmark | `σ(R_portfolio – R_benchmark)` | Optimiser | Annualised active return volatility; managed within TE budget to control performance risk |
- **Portfolio holdings and benchmark weights** → Input to quadratic optimiser with carbon constraint and sector deviation limits → **Optimised carbon-aware portfolio weights with PAB/CTB compliance verification**
- **Scope 1+2 emissions and EVIC per company** → Compute WACI per holding; aggregate portfolio carbon intensity → **Portfolio carbon intensity vs benchmark and annual decarbonisation trajectory**

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
**Methodology:** Quadratic optimisation with carbon intensity constraint
**Headline formula:** `min wᵀΣw s.t. Σw_i×CI_i ≤ (1−Δ_PAB)×CI_benchmark; |Σw_i−Σw_i^bm| ≤ TE_budget`

Quadratic optimiser minimises portfolio variance subject to: (1) carbon intensity ≤50% below benchmark (PAB) or ≥30% (CTB), (2) annual 7% (PAB) or 5% (CTB) decarbonisation trajectory, (3) sector deviation limits, (4) tracking error budget. Carbon intensity = Scope1+2 emissions / EVIC.

**Standards:** ['EU PAB/CTB Delegated Regulation (EU) 2020/1818', 'GHG Protocol Scope 1+2', 'MSCI Climate Indexes']
**Reference documents:** EU PAB/CTB Delegated Regulation (EU) 2020/1818; EU Benchmark Regulation 2016/1011; MSCI Climate Indexes Methodology; GHG Protocol Scope 1 and 2 Standard

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
| `carbon-forward-curve` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-project-lifecycle` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-removal-markets` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-adjusted-valuation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-capture-finance` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch (substantial).** The guide promises a *quadratic optimiser* — "min wᵀΣw s.t.
> Σwᵢ×CIᵢ ≤ (1−Δ_PAB)×CI_benchmark; tracking-error budget", EU PAB/CTB compliance with the 50%/30%
> intensity cuts and 7%/5% annual decarbonisation trajectory, sector-deviation limits, EVIC-based
> intensity. **None of this optimisation exists in the code.** The "optimised" portfolio is produced by
> a *seeded random rescaling*: `optWeight = weight × (0.6 + sr·0.8)` and
> `optCarbonInt = carbonInt × (0.4 + sr·0.5)`. There is no covariance matrix, no constraint solver, no
> PAB/CTB threshold enforcement, no annual glide-path, and no EVIC. Intensity is a raw synthetic scalar
> (`carbonInt = 5..500`), not Scope1+2/EVIC. The page is a **holdings dashboard with a pre-computed
> pseudo-optimised comparison**. Sections below document the code as written.

### 7.1 What the module computes

50 synthetic holdings, each with a current weight/intensity and a companion "optimised" weight/intensity.
The headline "carbon reduction" is a simple aggregate WACI comparison:

```js
waci     = weight × carbonInt                        // per-holding WACI contribution
optWaci  = optWeight × optCarbonInt
reduction% = (Σwaci − Σoptwaci) / Σwaci × 100         // portfolio-level "optimisation benefit"
```

where the optimised primitives are random scalings of the current ones (§7.2). Companion panels compute
sector WACI (current vs optimised), asset-class weight distribution, a 6-axis ESG/climate radar, a
Scope 1/2/3 split, and a Q1–Q4 carbon trend.

### 7.2 Parameterisation / scoring rubric

All 50 holdings are generated by `genHoldings(50)` with `sr()` seeds (provenance: **synthetic demo
data** throughout; company *names* are real S&P constituents but their attributes are fabricated):

| Field | Generator | Meaning |
|---|---|---|
| weight | `0.5 + sr·4.5` | current portfolio weight (%) |
| carbonInt | `floor(5 + sr·495)` | carbon intensity (tCO₂e/$M, synthetic — **not** Scope1+2/EVIC) |
| optWeight | `weight × (0.6 + sr·0.8)` | "optimised" weight = 60–140% of current, random |
| optCarbonInt | `carbonInt × (0.4 + sr·0.5)` | "optimised" intensity = 40–90% of current, random |
| waci | `floor(weight × carbonInt)` | WACI contribution |
| trackingError | `sr·3.5` | per-holding TE (%) — displayed, not optimised against |
| tempAlignment | `1.2 + sr·2.3` | implied temperature (°C), synthetic |
| scope1/2/3 | `carbonInt × sr × {0.3,0.25,0.4+}` | scope split |
| sbtiAligned | `sr > 0.5` | boolean |
| esgScore / climateScore | `25+sr·70` / `20+sr·75` | 0–100 scores |

The strategy labels (`Low Carbon`, `Paris-Aligned`, `Climate Transition`, `Net Zero`, `Carbon Neutral`)
are assigned randomly per holding and drive filtering only — they do not change the optimisation.

### 7.3 Calculation walkthrough

Holdings are filtered (search/sector/asset) → `kpis` sum `waci` and `optWaci` and derive `reduction%`.
Because `optWaci` uses independently seeded random factors, the reduction is essentially a random number
per filtered set, not the output of a constrained optimisation. `radarData` averages the six score
fields; `Temp Align` axis is inverted as `100 − avgTemp×30` and `Carbon Eff` as `100 − avgCarbonInt/5`.

### 7.4 Worked example (portfolio reduction KPI)

Take two holdings after filtering:
- H1: `weight=3.0`, `carbonInt=200` → `waci = 600`. Suppose `optWeight=2.4`, `optCarbonInt=120` →
  `optWaci = floor(2.4×120) = 288`.
- H2: `weight=1.5`, `carbonInt=80` → `waci = 120`. Suppose `optWeight=1.8`, `optCarbonInt=56` →
  `optWaci = floor(1.8×56) = 100`.

Portfolio: `Σwaci = 720`, `Σoptwaci = 388`. `reduction% = (720−388)/720×100 = 46.1%`. The 46% "carbon
reduction" is entirely an artefact of the random `opt*` factors — a genuine PAB run would *derive* the
optimal weights from a constrained solver, and the reduction would be the solver's objective value, not
a pre-seeded scaling.

### 7.5 Data provenance & limitations

- **Every attribute is synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`); only the company names are real.
- **No optimiser**: the "optimised portfolio" is a random rescaling, so tracking error, sector-neutrality,
  and PAB/CTB thresholds are displayed as fields but never enforced or optimised toward.
- Intensity is a bare tCO₂e/$M scalar, not the EVIC-denominated Scope1+2 intensity the EU PAB regulation
  requires; no annual decarbonisation glide-path (7% PAB / 5% CTB) is modelled.

**Framework alignment:** EU PAB/CTB Delegated Regulation (EU) 2020/1818 — *named* but not implemented; the
regulation mandates ≥50% (PAB) / ≥30% (CTB) intensity reduction vs the parent index, a 7%/5% year-on-year
decarbonisation trajectory, and specified sector exclusions, none of which the code enforces · GHG Protocol
Scope 1+2 — the scope split is present but not tied to EVIC · PCAF — intensity is nominally WACI-style but
uses a synthetic denominator. See §8 for the production optimiser this module should run.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's PAB/CTB quadratic optimiser is
absent; this specifies it.

### 8.1 Purpose & scope
Construct EU PAB- or CTB-compliant portfolio weights that minimise active risk versus a parent benchmark
subject to a carbon-intensity ceiling and an annual decarbonisation trajectory, for index-tracking ESG
mandates. Coverage: listed-equity and corporate-bond sleeves with company Scope1+2 emissions and EVIC.

### 8.2 Conceptual approach
Convex quadratic program minimising tracking-error variance under linear carbon and turnover constraints,
per EU (EU) 2020/1818 and mirroring MSCI Climate Index / BlackRock Aladdin PAB construction. The carbon
constraint tightens each rebalance to hold the 7%/5% self-decarbonisation glide-path. Benchmarked against
MSCI Paris-Aligned Indexes and Aladdin's optimiser.

### 8.3 Mathematical specification

```
min_w   (w − w_bm)ᵀ Σ (w − w_bm)                      active variance (TE²)
s.t.    Σ_i w_i · CI_i ≤ (1 − Δ) · CI_bm · (1 − d)^y   Δ=0.50 PAB / 0.30 CTB; d=0.07/0.05; y = years since base
        Σ_i w_i = 1,   w_i ≥ 0
        |Σ_{i∈s} (w_i − w_bm,i)| ≤ τ_sector  ∀ sectors  (PAB: high-climate-impact sectors ≥ benchmark)
        Σ_i |w_i − w_prev,i| ≤ turnover_budget
where   CI_i = (Scope1_i + Scope2_i) / EVIC_i         [+ Scope3 phased in per 2020/1818 Art.]
```

| Parameter | Symbol | Source |
|---|---|---|
| Intensity cut | Δ | 0.50 (PAB) / 0.30 (CTB), Reg. (EU) 2020/1818 |
| Decarbonisation rate | d | 0.07 (PAB) / 0.05 (CTB) p.a. |
| Covariance | Σ | Barra/Axioma factor risk model or sample cov |
| EVIC | — | company financials (Bloomberg/FactSet) |
| Scope1+2 | — | CDP / issuer disclosure / PCAF |
| Sector limits | τ_sector | high-climate-impact sector floor per regulation |

### 8.4 Data requirements
Per name: benchmark weight, Scope1+2 emissions, EVIC, sector (NACE/GICS), factor exposures for Σ, prior
weights for turnover. Platform holds the holdings scaffold and scope fields; missing: real emissions,
EVIC, benchmark weights, and a QP solver (OSQP/ECOS).

### 8.5 Validation & benchmarking plan
Verify constraint satisfaction post-solve (intensity ≤ ceiling, glide-path met, sector floors held).
Backtest realised tracking error vs ex-ante TE, and realised carbon-intensity trajectory vs the 7%/5%
requirement, over 5 years. Reconcile against a published MSCI PAB index's intensity reduction.

### 8.6 Limitations & model risk
Emissions-data lag and EVIC volatility make the intensity constraint noisy — use trailing-year emissions
and a smoothed EVIC. Infeasibility can arise when the decarbonisation ceiling collides with sector floors;
conservative fallback relaxes the turnover budget before relaxing the carbon ceiling. Scope 3 inclusion
(phased by the regulation) materially changes the solution and must be validated separately.

## 9 · Future Evolution

### 9.1 Evolution A — A real quadratic optimiser replacing seeded "optimised" weights (analytics ladder: rung 2 → 5)

**What.** The overview promises "rigorous quadratic optimisation with annual decarbonisation trajectory constraints" and TE-budgeted PAB/CTB-compliant construction — but the code fabricates the result: `optWeight = weight × (0.6 + s(43)×0.8)` and `optCarbonInt = carbonInt × (0.4 + s(47)×0.5)` are **seeded scalings of seeded inputs**, not an optimisation. Every holding, WACI, and "optimised" figure is a `s(seed)` draw. The registered backend is the generic `carbon.py` credit suite, not a portfolio optimiser. This is the module's defining gap: an allocation *engine* that does no allocation. Evolution A builds the real optimiser — the module is a natural first mover for the analytics ladder's prescriptive rung.

**How.** (1) A genuine constrained quadratic optimiser (scipy/cvxpy — already in the environment per roadmap §3's prescriptive-rung note): minimise tracking error to a parent benchmark subject to a carbon-intensity reduction constraint (PAB −50% / CTB −30%), the −7% p.a. decarbonisation trajectory, sector-neutrality, and turnover bounds. This is rung 5 (prescriptive/optimising) — the module's whole purpose. (2) Real holdings and benchmark constituents from `portfolios_pg` and the benchmark data; emissions from PCAF/GHG. (3) PAB compliance verification against the real Regulation 2019/2089 thresholds (shared with the `benchmark-analytics` module's Evolution A — coordinate). (4) Backtest and attribution from real return series (yfinance-style), decomposing active return into carbon-tilt vs sector/factor effects. As a backend vertical, `POST /api/v1/carbon-allocation/optimise`.

**Prerequisites.** Benchmark constituent + return data; holdings emissions; the optimiser is standard tooling but the constraint set must be validated against the PAB/CTB regulation. **Acceptance:** the optimiser returns weights that provably minimise TE subject to the carbon constraint (verifiable by perturbation); PAB/CTB compliance is checked against the real thresholds; backtest attribution decomposes into real tilt vs factor components; no seeded weights remain.

### 9.2 Evolution B — Portfolio-construction copilot (LLM tier 2)

**What.** The PM asks "construct a PAB-compliant version of this fund at 2% TE", "what's the return drag from the carbon tilt?", "which holdings must I exclude for PAB?" — the copilot runs the Evolution-A optimiser and compliance tools, reports the constructed weights, achieved carbon reduction, TE, and PAB-exclusion list, every figure tool-traced, and explains trade-offs (tighter carbon constraint vs higher TE).

**How.** Tool schemas over the Evolution-A optimise/compliance/backtest routes; mutating actions (saving a constructed portfolio via `carbon.py`'s portfolio POST) gated behind explicit confirmation. Grounding corpus: this Atlas record plus the PAB/CTB regulation references. The copilot's prescriptive answers state the full constraint set used (carbon target, TE budget, sector-neutrality, turnover) so the optimisation is reproducible; it presents the efficient frontier (carbon reduction vs TE) rather than a single point when the user hasn't fixed the budget. Composes construction reports into the report layer.

**Prerequisites (hard).** Evolution A's real optimiser — a construction copilot returning seeded "optimised" weights would produce non-compliant portfolios presented as PAB-aligned, a regulatory-misstatement risk. **Acceptance:** every weight, TE, and carbon-reduction figure traces to an optimiser response; the constraint set is stated per construction; PAB-exclusion lists match the real regulation; saving a portfolio requires user confirmation.