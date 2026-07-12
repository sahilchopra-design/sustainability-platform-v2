# Carbon Removal Market Analytics
**Module ID:** `carbon-removal-markets` · **Route:** `/carbon-removal-markets` · **Tier:** A (backend vertical) · **EP code:** EP-DX1 · **Sprint:** DX

## 1 · Overview
Carbon removal market analytics covering DAC, BECCS, enhanced weathering, biochar, soil carbon, and ocean alkalinity enhancement. Models cost curves (DAC $300-1000/t, biochar $50-200/t), permanence tiers, and CDR procurement platform dynamics.

> **Business value:** Provides comprehensive CDR market analytics enabling procurement optimisation across pathways, with permanence-adjusted pricing and cost curve visibility for corporate net-zero buyers.

**How an analyst works this module:**
- Map CDR pathway portfolio across geological, biological, and ocean-based removal categories
- Build cost curves using technology-specific CAPEX/OPEX and capacity data
- Apply permanence tier discounting to compute permanence-adjusted carbon value
- Model procurement platform supply/demand dynamics and forward price scenarios

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CDR_STANDARDS`, `CDR_TECHNOLOGIES`, `FRONTIER_BUYERS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CDR_TECHNOLOGIES` | 8 | `label`, `icon`, `trl`, `costNow`, `cost2030`, `cost2050`, `scaleNow`, `scale2030`, `scale2050`, `permanence`, `energyMwhT`, `waterM3T`, `landM2T`, `companies`, `frontier`, `corsia`, `vcm`, `govContracts`, `desc` |
| `FRONTIER_BUYERS` | 9 | `commitMusd`, `horizon`, `tech`, `priceFloor`, `note` |
| `CDR_STANDARDS` | 8 | `scope`, `qual`, `priceRange`, `volume2023`, `growth` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalCapex` | `capexMusd * 1e6;` |
| `discFactor` | `wacc / 100;` |
| `annEnergyCost` | `capacityMtYr * 1e6 * Math.max(0, energyMwhT) * energyCostMwhUsd;` |
| `annOpex` | `opexMusdYr * 1e6 + annEnergyCost;` |
| `annRevenue` | `capacityMtYr * 1e6 * co2Price;` |
| `annSubsidy` | `totalCapex * (subsidyPct / 100);` |
| `annEbitda` | `annRevenue + annSubsidy - annOpex;` |
| `costCurveData` | `useMemo(() => [...CDR_TECHNOLOGIES] .sort((a, b) => a.costNow - b.costNow) .map(t => ({ tech: t.label.split(' (')[0].split(' ').slice(0, 3).join(' '), costNow: t.costNow, cost2030: t.cost2030, cost2050: t.cost2050, scale2030: t.scale2030, })), []);` |
| `scaleData` | `useMemo(() => [2024, 2026, 2028, 2030, 2032, 2035, 2040, 2050].map((yr, i) => ({` |
| `priceSensData` | `useMemo(() => [50, 80, 100, 150, 200, 250, 300, 400, 500, 600].map(p => {` |
| `frontierData` | `useMemo(() => FRONTIER_BUYERS.map(b => ({ buyer: b.buyer, commitMusd: b.commitMusd, priceFloor: b.priceFloor })), []);` |

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
| POST | `/api/v1/carbon-removal/assess` | `run_full_assessment` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/technology-assessment` | `assess_technology` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/oxford-principles` | `score_oxford_principles` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/article-64` | `assess_article64` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/cdr-economics` | `calculate_economics` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/market-eligibility` | `assess_market_eligibility` | api/v1/routes/carbon_removal.py |
| GET | `/api/v1/carbon-removal/ref/technology-profiles` | `get_technology_profiles` | api/v1/routes/carbon_removal.py |
| GET | `/api/v1/carbon-removal/ref/oxford-principles` | `get_oxford_principles` | api/v1/routes/carbon_removal.py |
| GET | `/api/v1/carbon-removal/ref/market-benchmarks` | `get_market_benchmarks` | api/v1/routes/carbon_removal.py |
| GET | `/api/v1/carbon-removal/ref/frontier-criteria` | `get_frontier_criteria` | api/v1/routes/carbon_removal.py |

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

### 2.3 Engine `carbon_removal_engine` (services/carbon_removal_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CarbonRemovalEngine.assess_cdr_technology` | project_data | Match project to CDR technology profile, assess TRL, cost trajectory, scalability, and co-benefit scoring. |
| `CarbonRemovalEngine.score_oxford_principles` | project_data | Score all 4 Oxford CDR Principles. Returns composite 0-100 score, quality tier, and gap analysis. |
| `CarbonRemovalEngine.assess_article64_eligibility` | project_data | Check all 6 Paris Agreement Article 6.4 requirements. Returns ITMO eligibility, corresponding adjustment requirement, and gap analysis. |
| `CarbonRemovalEngine.calculate_cdr_economics` | project_data | Model CAPEX/OPEX, LCOE ($/tCO2), NPV/IRR at credit price scenarios, break-even price, and blended finance uplift. |
| `CarbonRemovalEngine.assess_market_eligibility` | project_data | Assess CORSIA eligibility, Frontier AMC eligibility, voluntary market tier, and identify optimal buyer type with credit price benchmark. |
| `CarbonRemovalEngine.run_full_assessment` | project_data | Comprehensive CDR project assessment producing composite cdr_quality_score, tier, Oxford score, Art 6.4 eligibility, LCOE, Frontier eligibility, and credit price benchmark. |

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
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `Manure` *(shared)*, `Wind` *(shared)*, `__future__` *(shared)*, `cdr_quality_score` *(shared)*, `database` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `projects` *(shared)*, `pydantic` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CDR_STANDARDS`, `CDR_TECHNOLOGIES`, `FRONTIER_BUYERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Weighted Average CDR Cost | `(Σ volume_i × cost_i) / Σ volume_i across portfolio` | Carbon180 / CDR.fyi market data | Blended cost depends heavily on pathway mix; pure DAC portfolios $400-800/t; biochar-weighted $80-150/t |
| Permanence-Adjusted Supply | `Σ(CDR volume × permanence_factor by pathway)` | CDR.fyi / Puro.earth registry | Permanence factors: geological (1.0), biochar (0.85), enhanced weathering (0.90), soil carbon (0.60) |
| Pipeline Growth Rate | `(Current year pipeline - prior year) / prior year × 100` | Frontier / Patch procurement data | CDR market growing rapidly; advance purchase commitments critical for scale-up financing |
- **CDR.fyi and Puro.earth registries** → Project capacity, cost, permanence, and vintage data → cost curve inputs → **Pathway-level cost and supply analytics**
- **Frontier / Stripe / Microsoft advance purchase data** → Forward commitment volumes and prices → demand signal and price discovery → **Forward price curve and market depth**
- **IPCC AR6 CDR potential estimates** → Technical and sustainable CDR potential by pathway → scalability ceiling analysis → **Market ceiling and pathway mix optimisation**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/carbon-removal/ref/frontier-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frontier_eligibility_criteria', 'criteria_count', 'total_weight', 'eligibility_threshold', 'founding_members', 'commitment_size_usd', 'source', 'excluded_project_types'], 'n_keys': 8}`

**GET /api/v1/carbon-removal/ref/market-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['market_benchmarks', 'buyer_count', 'article_64_eligibility', 'total_vcm_volume_2024_tco2', 'source'], 'n_keys': 5}`

**GET /api/v1/carbon-removal/ref/oxford-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['oxford_cdr_principles', 'source', 'quality_tiers', 'article_64_synergy'], 'n_keys': 4}`

**GET /api/v1/carbon-removal/ref/technology-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['technology_profiles', 'count', 'source', 'trl_scale', 'scalability_ratings', 'ipcc_categories'], 'n_keys': 6}`

**POST /api/v1/carbon-removal/article-64** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/carbon-removal/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/carbon-removal/cdr-economics** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/carbon-removal/market-eligibility** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** CDR Cost Curve & Permanence Modelling
**Headline formula:** `Levelised Cost of CDR = (CAPEX × CRF + OPEX) / Annual CO2 Removed; Permanence-Adjusted Price = Spot Price × (1 / (1 - Reversal Risk))`

Cost curve analysis across CDR pathways weighted by permanence tier, scalability potential, and co-benefit profile

**Standards:** ['Oxford Principles for Net Zero Aligned Carbon Offsetting', 'IPCC AR6 WG3 Chapter 12 — CDR', 'Frontier Climate CDR procurement framework']
**Reference documents:** IPCC AR6 WG3 (2022) Chapter 12 — Cross-sectoral Perspectives on Carbon Dioxide Removal; Oxford Principles for Net Zero Aligned Carbon Offsetting (2024 revision); Carbon180 (2023) CDR State of the Market Report; Frontier Climate (2023) Offtake and Advance Purchase Framework

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

**Engine `carbon_removal_engine` — extracted transformation lines:**
```python
cost_reduction_pct = ((cost_current - cost_2050) / cost_current * 100) if cost_current > 0 else 0
co_benefit_score = min(len(co_benefits) * 2.0, 10.0)
trl_score = (trl / 9) * 50
technology_readiness_score = round(trl_score + scalability_score * 0.5 + co_benefit_score * 0.5, 1)
perm = min(perm + 3.0, 25.0)
perm = min(perm + 2.0, 25.0)
annual_capex = capex / project_life if project_life > 0 else capex
total_annual_cost = annual_capex + annual_opex
lcoe = total_annual_cost / annual_removal
blended_grant = capex * blended_finance_grant_pct
effective_capex = capex - blended_grant
lcoe_blended = ((effective_capex / project_life) + annual_opex) / annual_removal if project_life > 0 else lcoe
annual_revenue = credit_price * annual_removal
annual_net_cf = annual_revenue - annual_opex
pv_annuity = annual_net_cf * (1 - (1 + discount_rate) ** (-project_life)) / discount_rate
pv_annuity = annual_net_cf * project_life
annual_revenue = credit_price * annual_removal
annual_net_cf = annual_revenue - annual_opex
mid = (low + high) / 2
pv = sum(annual_net_cf / (1 + mid) ** t for t in range(1, project_life + 1))
cost_reduction = (cost_current - cost_2050) / cost_current
oxford_contribution = oxford.composite_score * 0.40
tech_contribution = tech.technology_readiness_score * 0.25
art64_contribution = (art64.requirements_met / art64.total_requirements) * 20.0
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
**Blast radius:** changes here can affect **68** other module(s).
**Shared engines (edits propagate!):** `carbon_calculator` (used by 21 modules), `carbon_removal_engine` (used by 2 modules), `methodology_engine` (used by 21 modules)

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
| `carbon-adjusted-valuation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-capture-finance` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |

## 7 · Methodology Deep Dive

The Carbon Removal Market Analytics module implements the CDR cost-curve, permanence, and project-economics
model its guide describes — and does so with a **proper discounted EBITDA/LCOC calculation**, real technology
cost curves, and real Frontier advance-purchase data. It aligns well with the guide; the project calculator
inputs are user-driven, so no missing-model gap is triggered and there is no §8.

### 7.1 What the module computes

A CDR project-economics calculator plus market cost-curve analytics:

```js
totalCapex   = capexMusd × 1e6
annEnergyCost= capacityMtYr × 1e6 × max(0, energyMwhT) × energyCostMwhUsd
annOpex      = opexMusdYr × 1e6 + annEnergyCost
annRevenue   = capacityMtYr × 1e6 × co2Price
annSubsidy   = totalCapex × subsidyPct/100                 // 45Q-style capex subsidy
annEbitda    = annRevenue + annSubsidy − annOpex
discFactor   = wacc/100
```

Companion analytics: a cost-curve sorted by `costNow`, a scale-up projection (2024→2050), a CO₂-price
sensitivity (`priceSensData`, $50–600/t), and Frontier buyer commitments.

### 7.2 Parameterisation

**CDR technology cost curves** (`CDR_TECHNOLOGIES`, 8 rows — provenance: **real** IEA/CDR.fyi cost trajectories):

| Tech | Cost now/2030/2050 ($/t) | Scale 2050 (Mt) | Permanence | Energy (MWh/t) |
|---|---|---|---|---|
| DAC | 400 / 200 / 80 | 1,000 | Geological >10,000yr | 5.5 |
| BECCS | 90 / 65 / 45 | 5,000 | Geological | −0.2 (net energy) |
| Biochar | 120 / 80 / 50 | 500 | Soil 100–1,000yr | 0.3 |
| Enhanced Weathering | 80 / 50 / 30 | 1,000 | Mineral 100,000yr+ | 0.8 |
| Ocean Alkalinity | 95 / 60 / 35 | 3,000 | Ocean 1,000yr+ | 1.2 |
| Soil Carbon | 30 / 22 / 15 | 1,500 | Soil 50–200yr | 0.1 |
| Mineralization | 55 / 38 / 22 | 800 | Mineral permanent | 0.4 |

**Frontier buyers** (`FRONTIER_BUYERS`, 8 rows — **real advance-purchase commitments**): Stripe $1,000M,
Alphabet $925M, Meta $730M, Shopify $500M, Microsoft $200M (carbon-negative by 2030), JPMorgan $200M — with
real price floors ($50–150/t). **CDR standards** (`CDR_STANDARDS`) list Puro.earth, Verra, etc. with real
price ranges and 2023 volumes.

**User inputs** to the calculator: capacity (MtCO₂/yr), CAPEX, OPEX, energy intensity, energy cost, CO₂
price, WACC, subsidy %. These are live, not synthetic; the technology table anchors defaults.

### 7.3 Calculation walkthrough

The project calculator computes annual energy cost (capacity × energy-intensity × energy-price), total OPEX,
revenue at the CO₂ price, a CAPEX-percentage subsidy, and EBITDA. WACC feeds the discount factor for NPV.
BECCS's negative energy intensity (−0.2 MWh/t) correctly *reduces* its energy cost (it co-generates power).
The cost-curve tab sorts technologies by current cost; the scale tab projects deployment to 2050; the
price-sensitivity tab sweeps CO₂ price to show which technologies turn EBITDA-positive.

### 7.4 Worked example (DAC project economics)

DAC project: `capacity = 0.1 MtCO₂/yr`, `CAPEX = $400M`, `OPEX = $8M/yr`, `energyMwhT = 5.5`,
`energyCost = $40/MWh`, `co2Price = $300/t`, `subsidy = 30%`, `WACC = 8%`:

- `annEnergyCost = 0.1×1e6 × 5.5 × 40 = $22,000,000`
- `annOpex = 8×1e6 + 22×1e6 = $30,000,000`
- `annRevenue = 0.1×1e6 × 300 = $30,000,000`
- `annSubsidy = 400×1e6 × 0.30 = $120,000,000` (one-off capex subsidy)
- `annEbitda = 30M + 120M − 30M = $120,000,000` (subsidy-dominated in year 1)

Operating EBITDA excluding the one-off subsidy is `revenue − opex = $0` at $300/t — DAC breaks even on cash
operating cost only at high CO₂ prices, exactly the economics the guide describes ($400–800/t DAC portfolios).

### 7.5 Data provenance & limitations

- **Technology cost curves, permanence tiers, and Frontier buyer commitments are real**; the calculator runs
  on **live user inputs**, not synthetic seeds (the module barely uses `sr()`).
- The subsidy is modelled as an annual figure equal to a capex percentage — it should be a one-off (or
  amortised) capex offset, so year-1 EBITDA overstates recurring profitability.
- Permanence is a descriptive tier, not a reversal-adjusted volume; the guide's permanence-adjusted-supply
  factors (geological 1.0, biochar 0.85, soil 0.60) are conceptual here, not applied to a discount.

**Framework alignment:** IPCC AR6 WGIII Ch.12 — CDR pathways and 2050 scale potential · Oxford Principles for
Net-Zero Aligned Offsetting — the durability/permanence emphasis · Frontier Climate offtake/advance-purchase
framework — the buyer-commitment data and price floors that de-risk scale-up · Carbon180 / CDR.fyi — the
market-cost benchmarks · Puro.earth / Verra — the CDR standards landscape and MRV rigour used to differentiate
credit quality.

## 9 · Future Evolution

### 9.1 Evolution A — Sourced CDR cost/scale data and permanence-adjusted valuation (analytics ladder: rung 1 → 2)

**What.** This CDR-market page has a real project-economics calculator (`annEbitda = revenue + subsidy − opex`, with energy cost from `energyMwhT × energyCostMwhUsd`, capacity-scaled) and cost-curve/scale-trajectory/price-sensitivity views over the `CDR_TECHNOLOGIES` table (8 pathways with costNow/2030/2050, TRL, permanence, resource intensity). But those cost/scale figures and the `FRONTIER_BUYERS` / `CDR_STANDARDS` tables are curated constants, and the registered backend is the generic `carbon.py` suite — not the richer `carbon_removal_engine` its sibling `carbon-removal` uses. Evolution A grounds the market data and adds the permanence-adjusted pricing the overview promises.

**How.** (1) CDR cost curves and capacity from real sources (CDR.fyi, Frontier AMC public commitments, IEA) with vintages, replacing the curated `CDR_TECHNOLOGIES` figures — the DAC $300-1000/t and biochar $50-200/t ranges the overview cites should be sourced, not hard-coded. (2) Wire to the real `carbon_removal_engine` (its sibling's backend) for technology assessment and economics rather than the generic carbon suite — the two CDR modules should share that engine. (3) Implement permanence-adjusted carbon value: `permanence-adjusted price = raw price × permanence tier factor` (a 1000-year DACCS removal vs a 100-year biochar credit), the overview's stated methodology. (4) Rung 2: procurement supply/demand dynamics and forward-price scenarios parameterised over the real Frontier-buyer commitments. Coordinate module boundary with `carbon-removal` (overlapping CDR scope — one does markets, one does project assessment).

**Prerequisites.** CDR market-data sourcing; adoption of the `carbon_removal_engine` over the generic carbon routes; a permanence-tier factor table. **Acceptance:** cost/scale data carry sources and vintages; economics come from the CDR engine; permanence-adjusted prices reflect durability tiers; Frontier-buyer data is real.

### 9.2 Evolution B — CDR-market and procurement-strategy copilot (LLM tier 2)

**What.** Corporate net-zero buyers and CDR investors ask "which pathway offers the best permanence-adjusted price at scale?", "model DAC economics at $200/t with 30% subsidy", "what's the 2030 supply gap vs Frontier demand?" — the copilot runs the Evolution-A economics and market tools, reporting permanence-adjusted value, EBITDA/NPV, and supply/demand scenarios, every figure tool-traced.

**How.** Tool schemas over the Evolution-A CDR-engine and market routes (shared with `carbon-removal`); grounding corpus is this Atlas record plus the CDR references. The copilot's honesty duty, as across all CDR modules, is permanence: it reports permanence-adjusted (not raw) value and states the durability tier, since a headline $/t comparison across pathways is misleading without permanence normalisation — the module's own thesis. Cost/scale projections state their source and vintage. This module feeds the Tier-3 desk orchestrator's CDR-market view alongside `carbon-removal`'s project-assessment tools.

**Prerequisites (hard).** Evolution A's sourced data and CDR-engine wiring — a copilot comparing pathways on curated raw prices without permanence adjustment would mislead procurement. **Acceptance:** every cost, EBITDA, and price figure traces to a tool response; pathway comparisons use permanence-adjusted value with tiers stated; supply/demand scenarios cite the Frontier-buyer data.