# Carbon-Adjusted Corporate Valuation
**Module ID:** `carbon-adjusted-valuation` · **Route:** `/carbon-adjusted-valuation` · **Tier:** A (backend vertical) · **EP code:** EP-DD4 · **Sprint:** DD

## 1 · Overview
Carbon-adjusted corporate valuation covering Scope 1+2+3 emissions monetisation, shadow carbon price sensitivity analysis, carbon liability EV adjustment, and sector peer comparison on carbon-adjusted EV/EBITDA multiples.

> **Business value:** Enables systematic carbon-adjusted corporate valuation incorporating Scope 1+2+3 monetisation and shadow carbon price sensitivity, producing carbon-adjusted EV/EBITDA peer comparisons.

**How an analyst works this module:**
- Collect Scope 1, 2, and 3 GHG inventory with quality flags and boundary alignment check
- Apply shadow carbon price trajectory (base, high, low) over explicit forecast period and terminal year
- Calculate net carbon liability after pass-through to customers and government (carbon tax rebates)
- Compute carbon-adjusted EV/EBITDA and benchmark against sector peers on same carbon-adjusted basis

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
| `currentPrice` | `analystTarget * (0.8 + sr(i * 79) * 0.4);` |
| `terminalGrowth` | `0.015 + sr(i * 83) * 0.015;` |
| `filtered` | `useMemo(() => filterSector === 'All' ? COMPANIES : COMPANIES.filter(c => c.sector === filterSector), [filterSector]);  // DCF with carbon overlay const dcfCalc = useMemo(() => { const c = selectedCompany;` |
| `pathIdx` | `Math.min(6, Math.floor(y / (projYears / 7)));` |
| `carbonCost` | `(c.scope1 + c.scope2) * cp / 1000000 * (1 - c.carbonCostPassThrough);` |
| `pvSum` | `years.reduce((s, y) => s + y.pv, 0);` |
| `tvPv` | `tv / Math.pow(1 + c.wacc, projYears);` |
| `ngfsPriceData` | `useMemo(() => YEARS.map((yr, i) => ({` |
| `carbonScenarioImpact` | `useMemo(() => filtered.slice(0, 12).map(c => {` |
| `baseImpact` | `(c.scope1 + c.scope2) * carbonPrice / 1000000 * (1 - c.carbonCostPassThrough);` |
| `evHaircut` | `baseImpact / Math.max(0.01, c.baseEv) * 100;` |
| `sectorComps` | `useMemo(() => SECTORS.map(sec => {` |
| `avgEv` | `arr.length ? arr.reduce((s, c) => s + c.baseEv, 0) / arr.length : 0;` |
| `avgEbitda` | `arr.length ? arr.reduce((s, c) => s + c.ebitda, 0) / arr.length : 0;` |
| `evEbitda` | `avgEbitda > 0 ? avgEv / avgEbitda : 0;` |
| `sbtiPremiumData` | `useMemo(() => filtered.slice(0, 15).map(c => ({` |
| `strandedDiscountData` | `useMemo(() => filtered.slice(0, 12).map(c => {` |
| `strandedNpv` | `c.strandedPct / 100 * c.baseEv;` |
| `adjEv` | `c.baseEv - strandedNpv;` |
| `waccs` | `[-0.01, -0.005, 0, 0.005, 0.01];` |
| `adjWacc` | `c.wacc + dw;` |
| `annualCost` | `(c.scope1 + c.scope2) * p / 1000000 * (1 - c.carbonCostPassThrough);` |

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
**Frontend seed datasets:** `SECTORS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon-Adjusted EV/EBITDA | `(EV + Carbon Liability NPV) / EBITDA` | Company GHG data + shadow carbon price deck | Premium vs unadjusted multiple quantifies hidden carbon value destruction; high-emitter premium often 2-4x turns |
| Scope 3 Carbon Liability Share | `Scope 3 carbon liability NPV / total carbon liability NPV` | GHG Protocol Scope 3 inventory | Scope 3 dominates for consumer goods, financials, and transportation; often excluded → understatement of true liability |
| Shadow Carbon Price (2030) | `Internal carbon price assumption aligned with IEA NZE orderly transition trajectory` | IEA NZE carbon price pathway | EU ETS spot ~€60-70; IEA NZE implies $130/t by 2030; high-ambition internal price $150-200/t used by Stern/Wagner |
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

**GET /api/v1/carbon/methodology-inputs/{methodology_code}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/carbon/methodology-list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['methodologies', 'total_count', 'sectors'], 'n_keys': 3}`

**GET /api/v1/carbon/methodology-list/{sector}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector', 'methodologies', 'message'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic
**Methodology:** Carbon-Adjusted Valuation Multiples
**Headline formula:** `Carbon-Adj EV/EBITDA = (EV + Carbon Liability NPV) / EBITDA; Carbon Liability = Scope 1+2+3 × Shadow Price × (1-PassThrough) × Duration Factor`

Adjusts reported EV/EBITDA multiples for unpriced carbon liability, enabling like-for-like peer comparison that reflects climate transition exposure

**Standards:** ['GHG Protocol Corporate Standard', 'WBCSD ACE Framework 2023', 'IIGCC (2023) Net Zero Investment Framework — Carbon-Adjusted Valuation Guidance']
**Reference documents:** GHG Protocol (2023) Corporate Accounting and Reporting Standard — Revised Edition; WBCSD (2023) ACE Framework — Carbon-Adjusted Valuation Methodology; IIGCC (2023) Net Zero Investment Framework 2.0 — Portfolio Analytics; Dietz et al. (2023) Carbon Risk and Corporate Valuation — Nature Climate Change

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
| `carbon-capture-finance` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch (partial).** The guide's headline formula is
> `Carbon-Adj EV/EBITDA = (EV + Carbon Liability NPV) / EBITDA` with
> `Carbon Liability = Scope 1+2+3 × Shadow Price × (1−PassThrough) × Duration Factor`, and quotes a
> "Scope 3 Carbon Liability Share = 73%". **The code never uses Scope 3 in the carbon cost** —
> `carbonCost = (scope1 + scope2) × price × (1 − passThrough)` monetises only Scope 1+2. There is no
> explicit "Duration Factor"; duration enters implicitly as `1/(wacc − terminalGrowth)` (a perpetuity).
> `scope3Intensity` is generated per company but only feeds display, not valuation. Everything below
> reflects the code as written.

### 7.1 What the module computes

A per-company **Gordon-growth DCF with a carbon-cost overlay**, run across 4 NGFS carbon-price paths
for 60 synthetic companies. The explicit-forecast + terminal-value structure:

```js
carbonCost_y = (scope1 + scope2) × cp_y / 1e6 × (1 − carbonCostPassThrough)   // $M, cp in $/tCO2
fcf_y        = max(0, ebitda_y × 0.6 − carbonCost_y)
pv_y         = fcf_y / (1 + wacc)^(y+1)
tv           = fcf × (1 + terminalGrowth) / max(0.001, wacc − terminalGrowth) // Gordon perpetuity
tvPv         = tv / (1 + wacc)^projYears
totalEv      = Σ pv_y + tvPv
```

Revenue grows at `growthRate`; EBITDA holds the base EBITDA/revenue margin; FCF is a flat 60% of EBITDA
minus the (net-of-pass-through) carbon bill. The carbon price for forecast year *y* is drawn from the
selected NGFS path at index `min(6, floor(y / (projYears/7)))` — i.e. the 7-point path is stretched
across the projection horizon.

### 7.2 Parameterisation / scoring rubric

**NGFS carbon-price paths** (`NGFS_PATHS`, $/tCO₂, 2025→2037; ordered by ambition — provenance: NGFS
scenario carbon-price ordering, values are stylised demo levels):

| Scenario | 2025 | 2031 | 2037 | Reading |
|---|---|---|---|---|
| Net Zero 2050 | 25 | 100 | 210 | Orderly, high carbon price |
| Below 2 °C | 20 | 70 | 155 | Orderly, moderate |
| NDC | 15 | 38 | 72 | Stated policies |
| Current Policies | 10 | 18 | 30 | Hot-house, low price |

**Per-company primitives** (all `sr()`-seeded, i.e. synthetic; sector-conditioned where noted):

| Field | Generator | Provenance |
|---|---|---|
| baseEv | `1 + sr(i·7)·49` ($Bn) | synthetic demo value |
| wacc | `0.06 + sr(i·23)·0.06` | synthetic (6–12%) |
| terminalGrowth | `0.015 + sr(i·83)·0.015` | synthetic (1.5–3%) |
| scope1 | Energy 500–5000; Materials 200–2000; else 10–500 tCO₂e | synthetic, sector-tiered |
| scope2 | `scope1 × (0.1..0.4)` | synthetic |
| carbonCostPassThrough | `0.3 + sr(i·41)·0.5` (30–80%) | synthetic |
| strandedPct | Energy 10–50%; Materials 5–25%; else 0–5% | synthetic, sector-tiered |
| carbonBeta | Energy 0.8–2.0; Materials 0.4–1.2; else 0–0.4 | synthetic, sector-tiered |
| sbtiAligned | `sr(i·43) > 0.45` | synthetic boolean |

The controls (`carbonPrice` slider default 75, `ngfsScenario`, `projYears` default 10) are the only
live user inputs.

### 7.3 Calculation walkthrough

DCF tab: pick a company + NGFS scenario + horizon → `dcfCalc` builds `projYears` FCF rows, discounts
each at WACC, adds the Gordon terminal value → `totalEv`. Carbon-Cost-Scenarios tab recomputes a
one-shot carbon EV haircut `baseImpact / (wacc − terminalGrowth)` against `baseEv`. Sector-Comps tab
averages `baseEv` and `ebitda` per sector to a raw `EV/EBITDA` then applies a carbon adjustment
`evEbitda × (1 − carbonCost/avgEv × 2)`. Factor-Attribution decomposes `totalEv` into Base DCF minus
a perpetuity-capitalised carbon cost plus SBTi/green-capex tweaks.

### 7.4 Worked example (DCF, one company, 3 forecast years shown)

Company: `revenue=$20B`, `ebitda=$5B` (margin 0.25), `fcf` base `$2.5B`, `wacc=9%`,
`terminalGrowth=2%`, `scope1+scope2 = 3,000,000 tCO₂e`, `passThrough=0.5`, `growthRate=6%`,
NGFS **Net Zero 2050**, `projYears=10`.

Year 0 (2025), path index `min(6, floor(0/(10/7)))=0`, cp=25:
- `carbonCost = 3,000,000 × 25 / 1e6 × (1−0.5) = 37.5 → $37.5M = $0.0375B`
- `revenue_0 = 20 × 1.06^0 = 20`; `ebitda_0 = 20 × 0.25 = 5`; `fcf_0 = 5×0.6 − 0.0375 = 2.9625`
- `pv_0 = 2.9625 / 1.09^1 = 2.718`

Year 3 (2028), index `floor(3/1.428)=2`, cp=65: `carbonCost = 3e6×65/1e6×0.5 = 97.5 → $0.0975B`;
`revenue_3 = 20×1.06^3 = 23.82`; `ebitda_3 = 5.955`; `fcf_3 = 3.573 − 0.0975 = 3.4755`;
`pv_3 = 3.4755/1.09^4 = 2.462`.

Terminal value: `tv = 2.5 × 1.02 / (0.09 − 0.02) = 2.55/0.07 = 36.43`;
`tvPv = 36.43 / 1.09^10 = 15.39`. `totalEv ≈ Σpv (≈ $22B over 10y) + 15.39`. Rising NGFS carbon
prices progressively shave FCF — the transition-risk wedge is the FCF gap vs a zero-carbon-price run.

### 7.5 Companion analytics

- **Stranded-asset discount**: `strandedNpv = strandedPct/100 × baseEv`; `adjEv = baseEv − strandedNpv`.
- **SBTi premium**: SBTi-aligned firms carry `esgPremium` (1–3%) added to valuation.
- **Sensitivity**: WACC shocks `[-1%..+1%]` × carbon-price grid recompute `(fcf − annualCost)/(adjWacc − g)`.

### 7.6 Data provenance & limitations

- **All 60 companies are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`); no real financials, emissions,
  or WACCs. NGFS path *shapes* are directionally correct but the *levels* are stylised demo numbers.
- Carbon cost omits Scope 3 entirely (contra the guide) and applies a single flat FCF/EBITDA ratio (0.6)
  rather than a modelled cash-flow bridge. No tax, working-capital, or capex schedule in FCF.
- Terminal value uses base-year FCF (`c.fcf`), not the last forecast FCF — a modelling simplification
  that slightly understates TV for growing firms.

**Framework alignment:** GHG Protocol Corporate Standard — Scope 1/2 basis of the carbon bill (Scope 3
nominally referenced but unused) · NGFS Phase IV — the four scenario price paths and their ambition
ordering · IEA NZE — the shadow-price levels the guide benchmarks ($130/t by 2030) · WBCSD ACE / IIGCC
NZIF — the "carbon-adjusted EV" concept the sector-comps tab approximates by discounting the perpetuity-
capitalised carbon cost off enterprise value.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's Scope-1+2+3 carbon-liability-NPV
adjusted multiple with an explicit duration factor is not built. This specifies the production model.

### 8.1 Purpose & scope
Produce a defensible carbon-adjusted enterprise value and EV/EBITDA multiple for listed corporates,
capturing the present value of unpriced Scope 1+2+3 carbon liability under a scenario shadow-price deck,
net of cost pass-through and policy rebates. Supports relative-value screening and transition-risk
repricing at the single-name and sector level.

### 8.2 Conceptual approach
Carbon liability as an incremental cash-flow stream discounted into EV, benchmarked against MSCI Climate
VaR (transition-cost NPV as % of valuation) and the Dietz et al. (2023, *Nature Climate Change*) carbon-
risk valuation framework; the DCF spine follows standard Gordon-growth/two-stage practice (Damodaran).
Pass-through is modelled as a sector-specific price-elasticity parameter rather than a flat scalar.

### 8.3 Mathematical specification

```
Emissions_t = (S1 + S2 + S3) × (1 + g_emis)^t × (1 − abate_t)      abate_t from firm target curve
NetCarbon_t = Emissions_t × ShadowPrice_{scen,t} × (1 − PT_sector) × (1 − Rebate_t)
FCF_carbon_t = FCF_base_t − NetCarbon_t
CarbonLiabNPV = Σ_t NetCarbon_t/(1+wacc)^t + [NetCarbon_T·(1+g)]/(wacc−g)/(1+wacc)^T
EV_adj      = EV_base − CarbonLiabNPV
EVEBITDA_adj= (EV_base + CarbonLiabNPV_gross)/EBITDA          // liability as EV add-back for comparison
```

| Parameter | Symbol | Source |
|---|---|---|
| Shadow price path | ShadowPrice | NGFS Phase IV / IEA NZE ($/tCO₂) |
| Sector pass-through | PT_sector | academic elasticity estimates (e.g. cement ~0.2, utilities ~0.7) |
| Emissions growth / abatement | g_emis, abate_t | firm SBTi target + sector CRREM/IEA pathway |
| WACC, g | wacc, g | company cost of capital, GDP-linked terminal growth |
| Scope 3 | S3 | PCAF / CDP category inventory |

### 8.4 Data requirements
Company Scope 1/2/3 inventory (CDP/GRI/PCAF), reported EV & EBITDA (Bloomberg/FactSet), sector pass-
through elasticities (literature table), SBTi target and CRREM/IEA sector decarbonisation pathway.
Already in platform: NGFS scenario paths, sector taxonomy, WACC scaffolding; missing: real financials,
real emissions, elasticity table.

### 8.5 Validation & benchmarking plan
Reconcile CarbonLiabNPV-as-%-of-EV against MSCI Climate VaR transition component for overlapping names
(target within ±5pp). Backtest: do high-carbon-liability names underperform on realised returns in
carbon-price-shock windows (EU ETS 2021 spike)? Sensitivity of EV_adj to shadow-price and pass-through
(tornado). Sector-neutrality check on the adjusted multiple.

### 8.6 Limitations & model risk
Pass-through elasticities are the largest uncertainty — conservative fallback uses sector low-end PT.
Perpetuity capitalisation of a *finite* carbon liability overstates NPV if net-zero is achieved before T;
mitigate with a declining-emissions terminal treatment. Scope 3 double-counting across the value chain
must be flagged, not summed naively.

## 9 · Future Evolution

### 9.1 Evolution A — Real emissions and financials replacing the seeded company universe (analytics ladder: rung 2 → 3)

**What.** The frontend runs a genuine DCF-with-carbon-overlay (explicit-period PV, terminal value, NGFS shadow-price paths, shadow-price sensitivity, stranded-asset and SBTi-premium overlays — real rung-2 scenario analysis), but every company attribute is a seeded draw: `baseEv`, revenue, EBITDA, WACC, scope1/2, `carbonCostPassThrough`, `carbonBeta`, `strandedPct` all come from `sr(i×n)`. Meanwhile the module registers the platform's full real `carbon.py` route set and the `carbon_calculator`/`methodology_engine` engines (including a genuinely calibrated Monte Carlo). Evolution A feeds the valuation model real data.

**How.** (1) Company financials (EV, revenue, EBITDA, WACC) from the platform's market-data/holdings tables; emissions (Scope 1/2/3) from the real GHG inventory and PCAF data the platform already computes — replacing the seeded scope figures with the actual carbon calculator's output. (2) Shadow-price paths from real NGFS Phase-5 trajectory data (the `NGFS_PATHS` seed becomes the ingested vintage). (3) Carbon-cost pass-through and carbon-beta calibrated from sector data rather than uniform draws — carbon beta especially (the transition-premium coefficient) should be estimated from cross-sectional spread-on-intensity regression, not seeded. (4) Rung 3: benchmark carbon-adjusted EV/EBITDA against the sector-peer distribution using real constituents and pin a reference in bench_quant. As it already has a backend vertical, extract the DCF overlay to a `carbon.py` route.

**Prerequisites.** Holdings + emissions coverage for the valued companies; NGFS trajectory data; a carbon-beta estimation dataset. **Acceptance:** two real companies with different disclosed emissions and pass-through produce different carbon-adjusted EVs; NGFS path selection uses ingested vintages; carbon beta is regression-estimated with published fit; the peer EV/EBITDA benchmark uses real constituents.

### 9.2 Evolution B — Carbon-valuation analyst copilot (LLM tier 2)

**What.** Equity and credit analysts ask "what's this company's carbon-adjusted EV under NGFS disorderly at $150/t?", "how much of the valuation is stranded-asset risk?", "compare its carbon-adjusted EV/EBITDA to sector peers" — the copilot runs the Evolution-A DCF overlay and sensitivity tools, reports the carbon liability, EV haircut, and peer comparison, every figure tool-traced, and explains the shadow-price and pass-through assumptions driving them.

**How.** Tool schemas over the `carbon.py` calculation routes plus the Evolution-A DCF-overlay route; the calibrated Monte Carlo (`run_monte_carlo`, explicitly a genuine simulation per §2.3) supports distributional answers ("P10–P90 carbon-adjusted EV"). Grounding corpus: this Atlas record plus the NGFS and carbon-methodology references. The copilot's honesty duty: carbon-adjusted valuation is assumption-heavy (shadow price, pass-through, terminal growth), so it states each assumption per answer and presents the shadow-price sensitivity rather than a single point EV. Peer comparisons cite real constituents.

**Prerequisites (hard).** Evolution A — a copilot narrating carbon-adjusted valuations built on seeded emissions and random carbon betas would produce confidently wrong equity conclusions. **Acceptance:** every EV, haircut, and multiple traces to a tool response; shadow-price, pass-through, and terminal-growth assumptions are stated per answer; Monte Carlo ranges cite the calibrated simulation, not a point guess.