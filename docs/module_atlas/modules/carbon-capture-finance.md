# Carbon Capture Finance
**Module ID:** `carbon-capture-finance` · **Route:** `/carbon-capture-finance` · **Tier:** A (backend vertical) · **EP code:** EP-DF3 · **Sprint:** DF

## 1 · Overview
Evaluates the economics of carbon capture, utilisation, and storage (CCUS) projects including point-source CCS, direct air capture (DAC), and bioenergy with CCS (BECCS). Models capture costs, storage capacity, 45Q tax credits, carbon market revenues, and permanence risk for CDR credits.

> **Business value:** Critical for industrial decarbonisation investors, energy majors with hard-to-abate assets, and carbon market participants seeking high-permanence credits. Provides rigorous project economics combining technology learning curves, policy incentives, and carbon market revenues.

**How an analyst works this module:**
- Select CCUS technology type (point-source, DAC, BECCS)
- Input capture capacity, CapEx and OpEx per tonne
- Model revenue from carbon credits and policy incentives
- Calculate project NPV, IRR and payback period
- Assess permanence risk and CDR credit quality

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Card`, `KpiCard`, `PROJECTS`, `REGIONS`, `STORAGE_TYPES`, `TABS`, `TECH_TYPES`, `UTILISATION`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TECH_TYPES` | 7 | `name`, `costRange`, `trl`, `co2Purity`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt0` | `v => Number(v).toLocaleString('en-GB', { maximumFractionDigits:0 });` |
| `UTILISATION` | `['Concrete Mineralisation','Synthetic Fuels (e-fuels)','Urea/Chemicals','Enhanced Geothermal','Direct Air Utilisation'];` |
| `REGIONS` | `['North America','Europe','Asia-Pacific','Middle East','Australia','UK'];` |
| `tech` | `TECH_TYPES[Math.floor(sr(i*7)*TECH_TYPES.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*11)*REGIONS.length)];` |
| `storage` | `STORAGE_TYPES[Math.floor(sr(i*13)*STORAGE_TYPES.length)];` |
| `util` | `sr(i*17) > 0.6 ? UTILISATION[Math.floor(sr(i*19)*UTILISATION.length)] : null;` |
| `captureRate` | `Math.round(50 + sr(i*23)*950);      // ktCO₂/yr` |
| `captureCost` | `Math.round(tech.costRange[0] + sr(i*29)*(tech.costRange[1]-tech.costRange[0])); // $/tCO₂` |
| `capex` | `Math.round(captureRate * captureCost * 0.12 + sr(i*31)*50); // $M` |
| `opex` | `Math.round(captureRate * captureCost * 0.04 + sr(i*37)*5);  // $M/yr` |
| `carbonPx` | `80; // baseline` |
| `creditRevenue` | `captureRate * carbonPx / 1000;    // $M/yr` |
| `eorPremium` | `storage === 'Enhanced Oil Recovery (EOR)' ? captureRate * 30 / 1000 : 0;` |
| `q45Credit` | `region === 'North America' ? captureRate * 85 / 1000 : 0; // 45Q $85/t` |
| `totalRevenue` | `creditRevenue + eorPremium + q45Credit;` |
| `annualNetRevenue` | `totalRevenue - opex;` |
| `payback` | `annualNetRevenue > 0 ? Math.round(capex / annualNetRevenue) : 99;` |
| `breakEvenCx` | `Math.round(captureCost * 1.1 + sr(i*43)*20);` |
| `npv20` | `Math.round((annualNetRevenue * 12 - capex) + sr(i*47)*10); // simplified 20yr` |
| `revenue` | `filtered.reduce((s,p)=>s+p.captureRate*carbonPx/1000+(p.region==='North America'?p.captureRate*q45Rate/1000:0),0);` |
| `techRows` | `useMemo(() => TECH_TYPES.map(t => {` |
| `costTrajectory` | `useMemo(() => Array.from({length:6},(_,i)=>({ year:(2025+i*5).toString(), postCombustion: Math.round(75-i*5), beccs:          Math.round(115-i*8), dacSolid:       Math.round(300-i*35), dacLiquid:      Math.round(450-i*55), })), []);` |
| `npvSensitivity` | `useMemo(() => [40,60,80,100,130,160,200].map(px=>{` |
| `totalNpv` | `filtered.reduce((s,p)=>{` |
| `rev` | `p.captureRate*px/1000 + (p.region==='North America'?p.captureRate*q45Rate/1000:0);` |
| `npv` | `annNet * (1-Math.pow(1+discRate/100,-20))/(discRate/100) - p.capex;` |
| `adjRevenue` | `p.captureRate*carbonPx/1000+(p.region==='North America'?p.captureRate*q45Rate/1000:0)+p.eorPremium;` |

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
**Frontend seed datasets:** `REGIONS`, `STORAGE_TYPES`, `TABS`, `TECH_TYPES`, `UTILISATION`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| DAC Cost 2023 | — | IEA Direct Air Capture 2023 | Current DAC cost range; IEA projects $100–300/tCO2 by 2035 with learning |
| 45Q Tax Credit (DAC) | — | US IRA Section 45Q 2022 | US Inflation Reduction Act credit for DAC projects — highest ever carbon policy value |
| Global CCS Capacity | — | Global CCS Institute 2023 | Operational CCUS capacity globally — IEA Net Zero requires 1,000+ MtCO2/yr by 2030 |
- **CCUS project technical specs (capture rate, energy penalty)** → Cost and efficiency modelling → **Cost per tonne captured, net emissions reduction**
- **Carbon market price curves (Article 6/VCM)** → Revenue modelling → **Project NPV/IRR under various carbon price scenarios**
- **45Q/CBAM policy parameters** → Policy revenue calculation → **Annual policy credit value and project impact on economics**

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
**Methodology:** CCUS Project Economics
**Headline formula:** `NPV_CCS = Σ [(CarbonRevenue_t + 45Q_t - CaptureCost_t - StorageCost_t) / (1+r)^t]; CaptureEfficiency = CO2Captured / CO2TotalEmitted`

Revenue from carbon markets (Article 6/VCM) and 45Q credits offset high capture CapEx; DAC currently $300–600/tCO2 vs natural CDR at $5–50/tCO2

**Standards:** ['IEA CCUS in Clean Energy Transitions 2020', 'US IRA Section 45Q Tax Credits 2022', 'Global CCS Institute Project Database', 'SBTi Carbon Dioxide Removal Guidance 2023']
**Reference documents:** IEA CCUS in Clean Energy Transitions (2020); US Inflation Reduction Act Section 45Q — Carbon Oxide Sequestration Tax Credit; Global CCS Institute — Global Status of CCS 2023; SBTi Carbon Dioxide Removal Framework (2023)

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
**Shared UI wrappers:** `CleanTechAdvancedAnalytics`

## 7 · Methodology Deep Dive

The Carbon Capture Finance module models CCUS project economics broadly in line with its guide (capture
cost by technology, 45Q credits, carbon-market revenue, payback/NPV). The technology parameters are real;
the project instances and several derived quantities are synthetic or heuristic — the NPV/IRR treatment is
below investor grade, so §8 specifies the production model.

### 7.1 What the module computes

For 40 synthetic CCUS projects, revenue-and-return economics:

```js
captureCost  = tech.costRange[0] + sr·(range)          // $/tCO2, bounded by technology
capex        = captureRate × captureCost × 0.12 + sr·50 // $M  (heuristic 0.12 scalar)
opex         = captureRate × captureCost × 0.04 + sr·5   // $M/yr (heuristic 0.04 scalar)
creditRevenue= captureRate × carbonPx / 1000            // carbonPx = $80/t baseline
eorPremium   = storage==='EOR' ? captureRate × 30/1000 : 0   // $30/t EOR uplift
q45Credit    = region==='North America' ? captureRate × 85/1000 : 0  // 45Q $85/t geologic
totalRevenue = creditRevenue + eorPremium + q45Credit
annualNet    = totalRevenue − opex
payback      = capex / annualNet
npv20        = annualNet × 12 − capex + sr·10           // ⚠ NOT discounted
irr          = 8 + (annualNet/capex)×80 + sr·8          // heuristic, not a real IRR solve
```

A separate `npvSensitivity` panel *does* discount properly:
`npv = annNet × (1 − (1+r)^−20)/r − capex` (20-yr annuity present-value), and a `costTrajectory` applies
learning-curve cost declines by technology to 2050.

### 7.2 Parameterisation

**Technology cost/readiness** (`TECH_TYPES` — provenance: IEA CCUS / DAC cost ranges, real):

| Tech | Capture cost $/tCO₂ | TRL | CO₂ purity |
|---|---|---|---|
| Post-Combustion | 50–100 | 9 | 99% |
| Pre-Combustion | 40–80 | 8 | 98% |
| Oxyfuel | 55–90 | 7 | 99.5% |
| BECCS | 80–150 | 6 | 98% |
| DAC (solid sorbent) | 200–400 | 6 | 99.9% |
| DAC (liquid solvent) | 300–600 | 5 | 99.9% |

These ranges match published IEA figures (DAC $300–600/t; point-source $50–100/t). **Policy constants are
real**: 45Q geologic-storage credit **$85/tCO₂**, EOR premium **$30/t**, baseline carbon price **$80/t**.

**Per-project draws are synthetic** (`sr()`): technology, region, storage type, capture rate
(50–1000 ktCO₂/yr), and the noise on capex/opex/NPV. The capex scalar (0.12) and opex scalar (0.04) are
**heuristic** — they make capex ≈ 12% of lifetime capture-cost×rate, which has no cited basis.

### 7.3 Calculation walkthrough

Each project: pick a technology (sets cost range + TRL), draw a capture rate, compute a per-tonne cost →
heuristic capex/opex → revenue from carbon credit + EOR (if EOR storage) + 45Q (if North America) → net
of opex → payback and an undiscounted `npv20`. The IRR is a heuristic mapping of the net-revenue/capex
ratio, not a root-solve of the cash-flow series. The `npvSensitivity` tab re-runs a proper discounted
20-year annuity across a carbon-price grid, so the module *contains* a correct DCF but does not use it for
the headline per-project `npv20`.

### 7.4 Worked example (one North American DAC project)

Tech = Post-Combustion (cost range 50–100), `captureCost = 75 $/t`, `captureRate = 500 ktCO₂/yr`,
region = North America, storage = Saline Aquifer:
- `capex = 500 × 75 × 0.12 = $4,500M` (+noise) — note this is very large because the scalar multiplies
  *annual* capture rate by per-tonne cost; a modelling artefact.
- `opex = 500 × 75 × 0.04 = $1,500M/yr`.
- `creditRevenue = 500 × 80 / 1000 = $40M/yr`; `q45Credit = 500 × 85 / 1000 = $42.5M/yr`; EOR = 0.
- `totalRevenue = $82.5M/yr`; `annualNet = 82.5 − 1500 = −$1,417.5M/yr` → `payback = 99` (sentinel),
  `npv20 = −1417.5×12 − 4500 < 0`.

The negative economics here expose the heuristic-scalar problem: opex at 4% of `rate×cost` (=$1.5bn/yr)
dwarfs revenue. A production model (see §8) would size capex/opex from $/tonne-of-*capacity* and per-tonne
opex, not from `rate×cost×scalar`.

### 7.5 Companion analytics

- **Cost trajectory** — learning-curve declines to 2050 (post-combustion 75→~50, DAC-liquid 450→~180),
  directionally consistent with IEA DAC cost projections.
- **NPV sensitivity** — proper discounted annuity across carbon prices $40–200/t and a discount-rate input.

### 7.6 Data provenance & limitations

- **Technology cost ranges, TRLs, 45Q ($85/t), EOR ($30/t), and carbon baseline ($80/t) are real**; all
  per-project instances are synthetic (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- The headline `npv20` is **undiscounted** and `irr` is a heuristic — neither is investor-grade; the
  capex/opex heuristics can produce implausible economics (§7.4).
- No project financing structure (debt/equity, DSCR), no permanence/leakage discount on CDR credits, no
  transport & storage cost separation.

**Framework alignment:** IEA *CCUS in Clean Energy Transitions* — technology cost ranges and the DAC vs
point-source split · US IRA §45Q — the $85/t geologic and (guide-referenced) $180/t DAC credit values ·
Global CCS Institute — capacity context (49 MtCO₂/yr operational) · SBTi CDR guidance — the permanence/CDR
credit-quality dimension named in the guide but not yet scored. See §8 for the production project-finance
model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The per-project NPV/IRR is undiscounted/heuristic;
this specifies a proper CCUS project-finance model.

### 8.1 Purpose & scope
Value point-source CCS, BECCS, and DAC projects on a discounted-cash-flow basis with policy incentives,
carbon-market revenue, transport & storage costs, and permanence-adjusted CDR credit value, for developers
and infrastructure investors. Output: levelised cost of capture (LCOC), project NPV, equity IRR, DSCR.

### 8.2 Conceptual approach
Standard infrastructure project-finance DCF with a technology learning curve, benchmarked against IEA CCUS
cost models and Global CCS Institute project economics; credit revenue modelled on NGFS/IEA carbon-price
paths (as in `carbon-adjusted-valuation`). LCOC follows the levelised-cost formalism (as used for LCOE),
so projects are comparable per tonne.

### 8.3 Mathematical specification

```
LCOC   = [CRF·CAPEX + OPEX_fixed] / (CaptureRate·CF) + OPEX_var·(1/CF)   $/tCO2
CRF    = r(1+r)^n / ((1+r)^n − 1)                     capital recovery factor, n = life
Rev_t  = CaptureRate·CF·[ P_carbon,t·(1−leak) + 45Q_t + EOR_t − T&S_cost ]
FCF_t  = Rev_t − OPEX_t − Tax_t
NPV    = Σ_t FCF_t/(1+r)^t − CAPEX
IRR    : Σ_t FCF_t/(1+IRR)^t = CAPEX
DSCR_t = CFADS_t / DebtService_t
```

| Parameter | Symbol | Source |
|---|---|---|
| CAPEX ($/t-yr capacity) | — | IEA CCUS / GCCSI cost curves by tech |
| Fixed/var OPEX | OPEX | IEA (energy penalty, solvent, labour) |
| Capacity factor | CF | 0.85–0.95 (operational data) |
| 45Q credit | 45Q | $85/t geologic, $180/t DAC (IRA) |
| Carbon price path | P_carbon | NGFS Phase IV / IEA NZE |
| Permanence leakage | leak | geologic ~0.1%/100yr; buffer per methodology |
| Discount rate | r | project WACC 7–10% |
| T&S cost | — | $10–20/t (pipeline) per GCCSI |

### 8.4 Data requirements
Per project: technology, gross/net capture capacity, energy penalty, CAPEX/OPEX build-up, storage type &
T&S cost, region (for 45Q eligibility), financing structure. Platform holds tech cost ranges, 45Q/EOR
constants, and a discounted-annuity routine (`npvSensitivity`); missing: capacity-basis CAPEX, energy
penalty, financing terms, real project data.

### 8.5 Validation & benchmarking plan
Reconcile LCOC against IEA published capture costs per technology (±15%). Backtest revenue vs realised 45Q
uptake and EU ETS/voluntary prices. Sensitivity/tornado on carbon price, discount rate, CF, energy penalty.
Cross-check equity IRR against announced CCUS FID economics (e.g. Northern Lights, Stratos DAC).

### 8.6 Limitations & model risk
Energy penalty and T&S cost are the swing variables — conservative fallback uses high-end IEA OPEX and
$20/t T&S. DAC economics are pre-commercial (TRL 5–6) so cost estimates carry wide error bars; flag TRL and
present ranges, not point NPVs. Permanence risk on CDR credits must reduce sellable volume, not just price.

## 9 · Future Evolution

### 9.1 Evolution A — Real project finance replacing simplified seeded NPV (analytics ladder: rung 1 → 3)

**What.** The page models CCUS economics (point-source, DAC, BECCS) with a `TECH_TYPES` table carrying real cost ranges/TRL, and correctly encodes the 45Q $85/t geological credit and EOR premium as region/storage-conditional. But the project pipeline is seeded (`captureRate`, `captureCost`, `capex`, `opex` all `sr()` draws) and the NPV is admittedly simplified (`npv20 = annualNetRevenue × 12 − capex + sr()×10` — a flat 12× multiple plus random noise, not a discounted cash flow). The registered backend is the generic `carbon.py` credit suite, which has a real `calculate_npv` and calibrated Monte Carlo the page doesn't use. Evolution A builds proper project finance.

**How.** (1) Replace the flat-multiple NPV with a real discounted cash flow using the `carbon_calculator.calculate_npv` engine (already present, with discount rate and price-growth) — the `npvSensitivity` tab already does a proper `annNet × annuity − capex`, so extend that to the headline metric and drop the `+ sr()×10` noise. (2) Ground the technology cost ranges and learning curves in real CCUS data (IEA CCUS, Global CCS Institute — the `costTrajectory` DAC/BECCS curves are curated and should be sourced/vintage-tagged). (3) Wire 45Q properly: the $85/t geological and $60/t utilisation rates with the 12-year credit window (DAC gets the higher enhanced rate — the current flat $85 undercounts DAC). (4) Permanence-risk-adjusted CDR credit quality via `calculate_quality_score` (real engine function). (5) Rung 3: calibrate NPVs against published CCUS project economics and pin a reference.

**Prerequisites.** Real project inputs (the seeded pipeline becomes user projects or sourced facilities); 45Q rate/tenor table by capture type; CCUS cost-curve sourcing. **Acceptance:** NPV is a real DCF (no noise term); DAC vs point-source get correct differentiated 45Q treatment; permanence risk adjusts CDR credit quality; learning curves carry sources.

### 9.2 Evolution B — CCUS project-economics copilot (LLM tier 2)

**What.** Industrial-decarbonisation and CDR investors ask "what's the NPV of a 500kt/yr point-source CCS project in the US Gulf with 45Q?", "how does DAC compare to BECCS on cost per tonne of durable removal?", "at what carbon price does this break even?" — the copilot runs the Evolution-A DCF and sensitivity tools, reports NPV/IRR/payback and permanence-adjusted credit quality, every figure tool-traced.

**How.** Tool schemas over the `carbon.py` calculation routes (and the DCF extraction); the calibrated Monte Carlo supports distributional NPV answers. Grounding corpus: this Atlas record plus the IEA CCUS / 45Q references. The copilot's honesty duty spans two axes: the 45Q eligibility rules (capture-threshold, storage-vs-utilisation rate, credit window) are stated per project, and permanence is central to CDR credit value — the copilot reports durable-removal quality with its permanence basis, never conflating point-source-avoided with durable-removal credits (a real integrity distinction in CDR markets).

**Prerequisites (hard).** Evolution A's real DCF — a copilot quoting the flat-12×-plus-noise NPV would misprice projects. **Acceptance:** every NPV/IRR/break-even traces to a tool response; 45Q treatment matches the project's capture type and storage; DAC/BECCS/point-source comparisons state permanence and credit-type distinctions.