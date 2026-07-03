# Carbon Removal Market Analytics
**Module ID:** `carbon-removal-markets` · **Route:** `/carbon-removal-markets` · **Tier:** A (backend vertical) · **EP code:** EP-DX1 · **Sprint:** DX

## 1 · Overview
Carbon removal market analytics covering DAC, BECCS, enhanced weathering, biochar, soil carbon, and ocean alkalinity enhancement. Models cost curves (DAC $300-1000/t, biochar $50-200/t), permanence tiers, and CDR procurement platform dynamics.

> **Business value:** Provides comprehensive CDR market analytics enabling procurement optimisation across pathways, with permanence-adjusted pricing and cost curve visibility for corporate net-zero buyers.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CDR_STANDARDS`, `CDR_TECHNOLOGIES`, `FRONTIER_BUYERS`

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
| `CarbonCalculationEngine.run_monte_carlo` | projects, scenario, n_runs, random_seed | Run Monte Carlo simulation for portfolio. |
| `CarbonCalculationEngine.calculate_portfolio` | projects, scenario, run_monte_carlo | Calculate portfolio-level metrics. |

### 2.3 Engine `carbon_removal_engine` (services/carbon_removal_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CarbonRemovalEngine.assess_cdr_technology` | project_data | Match project to CDR technology profile, assess TRL, cost trajectory, |
| `CarbonRemovalEngine.score_oxford_principles` | project_data | Score all 4 Oxford CDR Principles. Returns composite 0-100 score, |
| `CarbonRemovalEngine.assess_article64_eligibility` | project_data | Check all 6 Paris Agreement Article 6.4 requirements. |
| `CarbonRemovalEngine.calculate_cdr_economics` | project_data | Model CAPEX/OPEX, LCOE ($/tCO2), NPV/IRR at credit price scenarios, |
| `CarbonRemovalEngine.assess_market_eligibility` | project_data | Assess CORSIA eligibility, Frontier AMC eligibility, voluntary market tier, |
| `CarbonRemovalEngine.run_full_assessment` | project_data | Comprehensive CDR project assessment producing composite cdr_quality_score, |

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

## 5 · Intermediate Transformation Logic
**Methodology:** CDR Cost Curve & Permanence Modelling
**Headline formula:** `Levelised Cost of CDR = (CAPEX × CRF + OPEX) / Annual CO2 Removed; Permanence-Adjusted Price = Spot Price × (1 / (1 - Reversal Risk))`
**Standards:** ['Oxford Principles for Net Zero Aligned Carbon Offsetting', 'IPCC AR6 WG3 Chapter 12 — CDR', 'Frontier Climate CDR procurement framework']

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
**Blast radius:** changes here can affect **64** other module(s).
**Shared engines (edits propagate!):** `carbon_calculator` (used by 19 modules), `carbon_removal_engine` (used by 2 modules), `methodology_engine` (used by 19 modules)

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