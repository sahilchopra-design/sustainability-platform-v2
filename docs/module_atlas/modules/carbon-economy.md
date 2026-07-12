# Carbon Economy Intelligence
**Module ID:** `carbon-economy` · **Route:** `/carbon-economy` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Macro-level carbon economy analysis. Covers global carbon market size ($900B+), carbon pricing coverage (23% of global emissions), abatement cost curve analysis, and investment flows.

> **Business value:** Carbon pricing is the most cost-effective tool for driving decarbonisation. Understanding the global carbon economy — market size, price trajectories, abatement costs — is essential for corporate carbon strategy, policy analysis, and climate-focused investment research.

**How an analyst works this module:**
- Market Overview shows global carbon pricing landscape
- Price Comparison benchmarks all major schemes
- Abatement Cost Curve ranks decarbonisation options by $/tCO2
- Investment Flows tracks clean energy and carbon market capital
- Policy Tracker monitors new and expanding carbon pricing regimes

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_DIET_COMPARISON`, `CARBON_EQUIVALENTS`, `CARBON_INFLATION`, `CARBON_PRICE_TAGS`, `COUNTRY_FOOTPRINTS`, `DAY_TIMELINE`, `GLOBAL_CARBON_CLOCK`, `GLOBAL_EMISSIONS_PER_SEC`, `HOUSING_CARBON`, `PERSONAL_ACTIONS`, `PIE_COLORS`, `SECTOR_INTENSITY`, `TRANSPORT_COMPARISON`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRY_FOOTPRINTS` | 21 | `per_capita_t`, `breakdown`, `transport`, `home_energy`, `food`, `goods`, `services` |
| `CARBON_EQUIVALENTS` | 2 | `driving_km`, `cups_tea`, `netflix_hrs`, `showers_min` |
| `SECTOR_INTENSITY` | 11 | `kg_per_dollar` |
| `PERSONAL_ACTIONS` | 11 | `savings_t`, `difficulty` |
| `CARBON_INFLATION` | 7 | `coffee_g`, `streaming_g`, `ev_charge_g`, `laundry_g` |
| `CARBON_DIET_COMPARISON` | 13 | `carbon_kg`, `protein_g`, `carbon_per_protein` |
| `TRANSPORT_COMPARISON` | 13 | `g_per_km`, `cost_per_km`, `time_min_10km` |
| `HOUSING_CARBON` | 8 | `annual_kg`, `monthly_cost` |
| `DAY_TIMELINE` | 12 | `activity`, `carbon_kg`, `cumulative` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d=1) => n >= 1000 ? (n/1000).toFixed(d)+'k' : Number(n).toFixed(d);` |
| `fmtMoney` | `n => n >= 1000 ? '$'+fmt(n,1) : '$'+Number(n).toFixed(2);` |
| `GLOBAL_EMISSIONS_PER_SEC` | `1169; // ~36.8 Gt / year` |
| `blob` | `new Blob([hdr+'\n'+body], { type:'text/csv' });` |
| `badge` | `(bg, color) => ({ display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:bg, color });` |
| `pricedActivities` | `useMemo(() => allActivities.map(a => ({ ...a, carbon_cost: (a.carbon_kg * carbonPrice) / 1000, true_cost: a.money_cost + (a.carbon_kg * carbonPrice) / 1000, carbon_per_dollar: a.carbon_kg / a.money_cost, })).sort((a, b) => b.carbon_per_dollar - a.carbon_per_dollar) , [allActivities, carbonPrice]);` |
| `dailyBudget_15C` | `6.3; // kg per day for 1.5C pathway (2.3t / 365)` |
| `annualBudget_15C` | `2300; // kg per year` |
| `countryGapData` | `useMemo(() => COUNTRY_FOOTPRINTS.map(c => ({ country: c.country, actual: c.per_capita_t, budget: 2.3, gap: Math.max(0, c.per_capita_t - 2.3) })).sort((a, b) => b.gap - a.gap) , []);` |
| `carbonTaxData` | `useMemo(() => [51, 100, 200].map(price => ({ price: `$${price}/t`, annual_tax: (countryData.per_capita_t * price).toFixed(0), monthly: ((countryData.per_capita_t * price) / 12).toFixed(0) })) , [countryData]);` |
| `breakdownPie` | `useMemo(() => Object.entries(countryData.breakdown).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1).replace('_', ' '), value: v })) , [countryData]);` |
| `carbonNetWorth` | `useMemo(() => (age * countryData.per_capita_t).toFixed(1), [age, countryData]);` |
| `carbonRankings` | `useMemo(() => { const sorted = [...COUNTRY_FOOTPRINTS].sort((a, b) => b.per_capita_t - a.per_capita_t);` |
| `lifetimeCarbonByCategory` | `useMemo(() => Object.entries(countryData.breakdown).map(([cat, pct]) => ({ category: cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' '), lifetime_t: (age * countryData.per_capita_t * pct / 100).toFixed(1), })) , [age, countryData]);` |
| `rows` | `pricedActivities.map(a => ({ Activity: a.activity, Carbon_kg: a.carbon_kg, Dollar_Cost: a.money_cost, Carbon_Cost: a.carbon_cost.toFixed(3), True_Cost: a.true_cost.toFixed(2), Carbon_Per_Dollar: a.carbon_per_dollar.toFix` |
| `pct` | `(cc / a.money_cost * 100).toFixed(1);` |
| `used` | `Math.min((countryData.per_capita_t * 1000 / 365) / dailyBudget_15C * 100, 100);` |
| `carbonCost` | `(h.annual_kg * carbonPrice / 1000).toFixed(0);` |
| `catCarbon` | `(countryData.per_capita_t * pct / 100).toFixed(1);` |
| `catDaily` | `(countryData.per_capita_t * 1000 * pct / 100 / 365).toFixed(1);` |
| `catCost` | `(countryData.per_capita_t * pct / 100 * carbonPrice).toFixed(0);` |
| `annualCost` | `((a.annual_carbon \|\| 0) * carbonPrice / 1000).toFixed(2);` |
| `budgetPct` | `((a.annual_carbon \|\| 0) / annualBudget_15C * 100).toFixed(1);` |

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
**Frontend seed datasets:** `CARBON_DIET_COMPARISON`, `CARBON_EQUIVALENTS`, `CARBON_INFLATION`, `COUNTRY_FOOTPRINTS`, `DAY_TIMELINE`, `HOUSING_CARBON`, `PERSONAL_ACTIONS`, `PIE_COLORS`, `SECTOR_INTENSITY`, `TRANSPORT_COMPARISON`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Carbon Market Value | — | World Bank/ICAP | Combined compliance and voluntary market value |
| Emissions Covered | — | World Bank | Fraction of global emissions under a carbon price |
| Carbon Price Range | — | Across jurisdictions | Wide variation from low ASEAN to high EU ETS prices |
- **ETS registry data** → Volume and price aggregation → **Market size and value**
- **Abatement technology data** → Cost ranking → **MAC curve**
- **Investment data** → Clean economy flow tracking → **Finance alignment with carbon pricing**

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
**Methodology:** Carbon market analytics
**Headline formula:** `MarketValue = Σ(Volume_i × Price_i) across compliance + voluntary markets`

Compliance markets: EU ETS ($726B+), RGGI, CCA, UK ETS, Korea, China. Voluntary: CBI certified ($2B+). Abatement cost: MAC curve from McKinsey (negative-cost measures to $200+/tCO2). Investment flows: Bloomberg NEF clean energy investment tracking.

**Standards:** ['World Bank Carbon Pricing Dashboard', 'ICAP', 'CBI']
**Reference documents:** World Bank Carbon Pricing Dashboard; ICAP Emissions Trading Worldwide; Bloomberg NEF Clean Energy Investment; McKinsey Global Abatement Cost Curve

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

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes *macro carbon-market
> analytics* — global market size ($900B+), `MarketValue = Σ(Volume_i × Price_i)`, a McKinsey MAC
> curve and BNEF investment flows. **None of that exists in this module's code.** What the page
> actually implements is a **consumer/personal carbon economics explorer**: carbon-price tagging of
> everyday activities ("true cost"), country per-capita footprints vs a 1.5 °C personal budget, a
> personal carbon-tax calculator, diet/transport/housing carbon comparisons, and a lifetime "carbon
> net worth" counter. The macro market analytics the guide describes live in `carbon-market-intelligence`
> and `carbon-forward-curve`. The sections below document the code as it behaves.

### 7.1 What the module computes

The core computation is *shadow carbon pricing of consumption*. For every activity `a` with an
embedded footprint `carbon_kg` and out-of-pocket cost `money_cost`, and a user-selected carbon
price `P` ($/tCO₂e, slider):

```
carbon_cost       = carbon_kg × P / 1000            // $ externality at price P
true_cost         = money_cost + carbon_cost         // internalised price
carbon_per_dollar = carbon_kg / money_cost           // kg CO₂e per $ spent (ranking key)
```

Activities are sorted descending by `carbon_per_dollar` (`pricedActivities`), so the most
carbon-intensive spending surfaces first. A second engine compares each country's per-capita
footprint against a fixed 1.5 °C-compatible personal budget:

```
dailyBudget_15C  = 6.3 kg/day        // code comment: "2.3t / 365"
annualBudget_15C = 2300 kg/yr
gap              = max(0, per_capita_t − 2.3)                    // countryGapData
used%            = min( (per_capita_t×1000/365) / 6.3 × 100, 100) // budget gauge
carbonTax        = per_capita_t × P   for P ∈ {51, 100, 200} $/t  // carbonTaxData
carbonNetWorth   = age × per_capita_t                             // lifetime tonnes
```

### 7.2 Parameterisation & data tables

| Constant / dataset | Value | Provenance |
|---|---|---|
| Personal 1.5 °C budget | 2.3 tCO₂e/yr (6.3 kg/day) | Widely cited IGES/Aalto "1.5-Degree Lifestyles" 2030 target; hard-coded |
| `GLOBAL_EMISSIONS_PER_SEC` | 1,169 kg/s | Code comment: "~36.8 Gt / year" (≈ Global Carbon Project 2023 CO₂ total) |
| Carbon price presets | $51 / $100 / $200 per t | $51 ≈ US EPA interim SCC (2021); others scenario values |
| `COUNTRY_FOOTPRINTS` (21 rows) | e.g. USA 15.5 t, India 1.9 t, Nigeria 0.6 t | Static seeds, order-of-magnitude consistent with Global Carbon Atlas / OWID consumption figures; breakdown %s are illustrative |
| `SECTOR_INTENSITY` (11 rows) | Electricity 1.82 → Finance 0.08 kg/$ | Static, EEIO-style spend intensities (unsourced in code) |
| `CARBON_DIET_COMPARISON` (13 rows) | Beef 5.4 kg/200 g … lentils 0.18 kg | Consistent with Poore & Nemecek (2018) ranges; hard-coded |
| `TRANSPORT_COMPARISON` (13 rows) | Petrol car 210 g/km, flight 255 g/km, train 41 g/km | Consistent with UK BEIS/DEFRA factor magnitudes; hard-coded |
| `PERSONAL_ACTIONS` (11 rows) | Car-free 2.4 t, one fewer flight 1.6 t … | Matches Wynes & Nicholas (2017) magnitudes; hard-coded |
| `GLOBAL_CARBON_CLOCK` | 250 Gt budget, 421 ppm, +1.2 °C | IPCC AR6-era values; hard-coded |

No `sr()` PRNG is used in this module — all data are static seed tables; only the carbon price,
country and age inputs are user-driven.

### 7.3 Calculation walkthrough

1. User picks a carbon price `P` (slider) and a country → `countryData` row selected.
2. `pricedActivities` maps the 3 activity tables (daily/weekly/annual) through §7.1 formulas and
   sorts by `carbon_per_dollar`; a `pct = carbon_cost / money_cost × 100` column shows the hidden
   price mark-up.
3. Category cards compute `catCarbon = per_capita_t × pct/100` (tonnes per category),
   `catDaily = per_capita_t×1000×pct/100/365` (kg/day) and `catCost = catCarbon × P` ($ tax).
4. The budget gauge computes `used%` (capped at 100) and the annual budget bar computes
   `budgetPct = annual_carbon / 2300 × 100` per activity.
5. `lifetimeCarbonByCategory = age × per_capita_t × pct/100` allocates the lifetime stock.
6. CSV export dumps `pricedActivities` rows (Activity, Carbon_kg, Dollar_Cost, Carbon_Cost,
   True_Cost, Carbon_Per_Dollar).

### 7.4 Worked example

US resident (15.5 t/yr), age 40, carbon price $100/t; activity = "Fill up car (50 L petrol)"
(115.5 kg, $75, annual 6,006 kg):

| Step | Computation | Result |
|---|---|---|
| Carbon cost | 115.5 × 100 / 1000 | **$11.55** |
| True cost | 75 + 11.55 | **$86.55** (+15.4%) |
| Carbon per dollar | 115.5 / 75 | **1.54 kg/$** |
| Annual budget share | 6,006 / 2,300 × 100 | **261%** of a full 1.5 °C budget |
| Country tax @$100 | 15.5 × 100 | **$1,550/yr** ($129/month) |
| Budget gauge | (15,500/365)/6.3 × 100 = 674 → capped | **100%** |
| Carbon net worth | 40 × 15.5 | **620 t lifetime** |

### 7.5 Data provenance & limitations

- All datasets are **hard-coded illustrative seeds** — no live API despite the module's tier-A
  wiring to `carbon_calculator.py` / `methodology_engine.py` (trace labels list `/api/v1/carbon/*`
  endpoints, but the page renders entirely from local constants).
- Country breakdowns (transport/home/food/goods/services %) are stylised, not from a published
  consumption-based accounting source; the same 2.3 t budget is applied to every country and year
  (real 1.5 °C-compatible per-capita budgets decline over time).
- `true_cost` assumes 100% pass-through of the carbon price to the consumer and no behavioural
  response (no demand elasticity).
- The guide's macro content (MAC curve, market size, ICAP coverage) is absent from code.

**Framework alignment:** *1.5-Degree Lifestyles* (IGES/Aalto/D-mat 2019) — source of the
2.5→2.3 t/cap near-term lifestyle budget the module hard-codes · IPCC AR6 WGI remaining carbon
budget (~250 GtCO₂ for 1.5 °C at 50% from early 2023) — mirrored in `GLOBAL_CARBON_CLOCK` ·
Poore & Nemecek (2018, *Science*) food LCA ranges · social cost of carbon (US EPA interim $51/t)
as the default shadow price. None are cited inline in code; alignment is by value inspection.

## 8 · Model Specification — Consumption-Based Personal Carbon Accounting

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Replace static activity tables with a defensible spend- and
activity-based footprint estimator for an individual or household, supporting the module's
true-cost, budget-gauge and tax-calculator displays. Coverage: all consumption categories,
21+ countries, updateable annually.

**8.2 Conceptual approach.** Hybrid EEIO + process-LCA estimator, the same architecture used by
commercial spend-carbon engines (Mastercard/Doconomy Åland Index; CoGo; Connect Earth) and by
S&P Trucost EBoard sector intensities. Spend-based EEIO gives full coverage; activity-based
process factors (fuel litres, kWh, km) override spend estimates where physical data exist —
mirroring GHG Protocol Scope 3 guidance's data-quality ladder.

**8.3 Mathematical specification.**

```
F_spend(c,r)   = Σ_k  S_k × EF_EEIO(k, r)                 // kg CO₂e; k = COICOP category
F_activity     = Σ_j  Q_j × EF_process(j)                  // physical units × factor
F_total        = Σ_k [ physical_data_k ? F_activity,k : F_spend,k ]
TrueCost_k     = S_k + F_k × P_carbon / 1000
Budget_t(1.5°C)= B_2030 × (1 − g)^(t−2030),  B_2030 = 2.5 t, g s.t. B_2050 = 0.7 t
```

| Parameter | Calibration source |
|---|---|
| `EF_EEIO(k,r)` (kg/$ by COICOP × region) | EXIOBASE 3 (free) or US EPA USEEIO v2; CEDA (vendor) |
| `EF_process(j)` fuel/electricity/travel | UK DEFRA/DESNZ conversion factors (annual, free); IEA grid EFs (platform `reference_data` already holds OWID energy + grid EF endpoint `GET /api/v1/carbon/data/grid-emission-factor`) |
| Country per-capita footprints | Global Carbon Budget + OWID consumption-based CO₂ (already ingested: OWID CO₂ table in `reference_data`) |
| Personal budgets B_2030/B_2050 = 2.5/0.7 t | IGES/Aalto 1.5-Degree Lifestyles (2019) |
| `P_carbon` scenarios | NGFS Phase IV/V carbon-price paths; EPA SCC ($51–190/t) |

**8.4 Data requirements.** Transaction category + amount + currency (user input or CSV import —
the sibling `carbon-wallet` module already captures this schema); optional physical quantities
(litres, kWh, km); country of residence. Platform assets reusable: `reference_data` OWID tables,
`/api/v1/carbon/emission-factors`, `carbon_calculator.py` factor lookups.

**8.5 Validation & benchmarking.** (i) Reconcile country aggregates against OWID consumption-based
per-capita CO₂ (tolerance ±10%); (ii) cross-check 20 benchmark activities against DEFRA factors;
(iii) sensitivity: ±30% on EEIO intensities must not reorder the top-5 `carbon_per_dollar`
ranking; (iv) benchmark full-profile outputs against the UC Berkeley CoolClimate calculator.

**8.6 Limitations & model risk.** EEIO factors are sector averages (product-level error up to
2–3×); currency/PPP conversion drift; budget allocation to individuals is normative, not
physical. Fallback: display uncertainty bands (P25–P75 of factor range) and label spend-based
rows as "estimated".

## 9 · Future Evolution

### 9.1 Evolution A — Sourced macro data and a real abatement cost curve (analytics ladder: rung 1 → 2)

**What.** This is a macro carbon-economy explorer with a strong personal/consumer angle (country per-capita footprints, carbon-diet/transport/housing comparisons, a "carbon clock", personal-action savings). Its live arithmetic is real but simple — carbon-cost overlays (`carbon_cost = carbon_kg × price / 1000`), 1.5°C budget gap (`per_capita − 2.3t`), lifetime carbon by category — over hand-curated reference tables. The overview promises an "abatement cost curve ranking decarbonisation options by $/tCO₂" (the classic MACC), which the seed tables gesture at but don't compute as an ordered marginal-cost curve. Evolution A sources the macro data and builds the real MACC.

**How.** (1) Country footprints, carbon-price coverage, and market-size figures from real sources (Our World in Data / World Bank Carbon Pricing Dashboard — both freely licensed) with vintages, replacing curated constants. (2) A genuine marginal abatement cost curve: abatement options ordered by $/tCO₂ with associated volumes (McKinsey-MACC-style), sourced from published abatement-cost literature — the module's headline analytic, currently absent as a computed curve. (3) The carbon-clock's `GLOBAL_EMISSIONS_PER_SEC = 1169` and budget constants sourced and vintage-tagged. (4) Rung 2: the carbon-tax scenarios (`[51, 100, 200]/t`) become a parameterised policy sweep over real footprint distributions. As a backend vertical, a dedicated macro-data route.

**Prerequisites.** OWID/World Bank ingestion (fits the existing ingester scaffold); abatement-cost literature for the MACC (values differ widely by source — the curve must cite its basis). **Acceptance:** country footprints and market size carry sources and vintages; the abatement curve is an ordered marginal-cost function with cited option costs/volumes; the carbon clock's rate is sourced.

### 9.2 Evolution B — Carbon-economy literacy copilot (LLM tier 1)

**What.** This module's consumer-facing framing (what does my footprint cost, how do I compare, which actions matter most) is ideal for a tier-1 explainer: "what's the carbon cost of my daily commute at $100/t?", "which personal action saves the most?", "how does my country's per-capita footprint compare to the 1.5°C budget?" — answered from the page's real overlays and sourced tables, grounded in this Atlas record.

**How.** Standard Tier-1 pattern (pgvector corpus from this record, Haiku serving, prompt-cached). This is a public-education-flavoured module, so the copilot's tone stays factual and non-preachy, and it always states the carbon-price assumption behind any cost figure (a footprint "cost" is a shadow price, not a bill). The refusal path scopes to the module's data: it answers from the sourced footprint/action tables and the MACC, and doesn't invent personalised numbers beyond the country-average model the page provides. After Evolution A, it can cite the abatement curve to rank interventions by cost-effectiveness.

**Prerequisites.** Copilot router; Evolution A's sourcing materially improves answer credibility but a first slice ships on the current record. **Acceptance:** every cost figure states its carbon-price assumption; footprint comparisons cite the source table and vintage; action rankings reflect the real savings data, not invented estimates.