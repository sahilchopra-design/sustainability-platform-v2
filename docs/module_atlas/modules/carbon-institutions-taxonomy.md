# Carbon Institutions Taxonomy
**Module ID:** `carbon-institutions-taxonomy` · **Route:** `/carbon-institutions-taxonomy` · **Tier:** A (backend vertical) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Registry and methodology taxonomy for the voluntary carbon market, comparing Verra VCS, Gold Standard, ACR, CAR, and BioCarbon Fund across methodology families (AFOLU, energy, industry, waste), credit type taxonomy (avoidance vs removal), and quality label tiers from BeZero, Sylvera, and Calyx Global.

> **Business value:** Used by carbon procurement officers, corporate sustainability teams, and impact investors to source, screen, and rank voluntary carbon credits for high-integrity offset and net-zero claims.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARTICLE6_PILOTS`, `CDP_SCORES`, `CREDIT_QUALITY`, `Card`, `ICROA_STANDARDS`, `ICVCM_CCPS`, `ISSUERS`, `Kpi`, `MACC_MEASURES`, `OFFTAKE_TERMS`, `PERMANENCE_HAZARDS`, `Pill`, `ROADMAP`, `SBTI_TARGETS`, `SectionH`, `TABS`, `VCMI_CLAIMS`, `VCM_PROJECTS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `cdpColor` | `(g) => g === 'A' ? T.green : g === 'A-' ? T.sage : g === 'B' ? T.sageL : g === 'B-' ? T.gold : g === 'C' ? T.goldL : g === 'C-' ? T.amber : g === 'D' ` |
| `CDP_SCORES` | `ISSUERS.map((iss, i) => {` |
| `trajectory` | `years.map((y, j) => {` |
| `base` | `iss.icvcm / 100;` |
| `trend` | `0.45 + base * 0.45 + j * 0.03 * base + sr(hashStr(iss.ticker) + j) * 0.08 - 0.04;` |
| `SBTI_TARGETS` | `ISSUERS.map((iss, i) => {` |
| `baseY` | `2018 + Math.floor(sr(i) * 3);` |
| `tgtY` | `2030 + Math.floor(sr(i + 5) * 10);` |
| `redux` | `iss.sbti === '1.5C-Val' ? 46 + sr(i + 2) * 10 : iss.sbti === 'WB2C-Val' ? 30 + sr(i + 2) * 8 : iss.sbti === 'Committed' ? 25 + sr(i + 2) * 8 : 0;` |
| `CREDIT_QUALITY` | `VCM_PROJECTS.map((p, i) => {` |
| `addScore` | `p.ccp ? 70 + sr(h) * 25 : 30 + sr(h) * 35;` |
| `permScore` | `p.type === 'DAC' \|\| p.type === 'CCS' \|\| p.type === 'Biochar' \|\| p.type === 'EW' ? 90 + sr(h + 1) * 8 : p.type === 'REDD+' \|\| p.type === 'IFM' \|\| p.typ` |
| `mrv` | `p.icroa ? 75 + sr(h + 2) * 20 : 40 + sr(h + 2) * 25;` |
| `cob` | `p.ccp ? 72 + sr(h + 3) * 22 : 45 + sr(h + 3) * 25;` |
| `sdg` | `p.standard.includes('CCB') \|\| p.standard === 'GS' \|\| p.standard === 'Plan Vivo' ? 80 + sr(h + 4) * 15 : 50 + sr(h + 4) * 25;` |
| `overall` | `(addScore * 0.25 + permScore * 0.2 + mrv * 0.2 + cob * 0.2 + sdg * 0.15);` |
| `cdpA` | `ISSUERS.filter(i => i.cdp === 'A' \|\| i.cdp === 'A-').length;` |
| `vcmMt` | `VCM_PROJECTS.reduce((s, p) => s + p.volume, 0);` |

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
**Frontend seed datasets:** `ARTICLE6_PILOTS`, `ICROA_STANDARDS`, `ICVCM_CCPS`, `ISSUERS`, `MACC_MEASURES`, `METHODS`, `OFFTAKE_TERMS`, `PTYPES`, `ROADMAP`, `STDS`, `TABS`, `VCMI_CLAIMS`, `VCM_PROJECTS`, `VINTAGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Methodology Quality Score | `weighted avg(registry_score, additionality_score, permanence_score)` | BeZero/Sylvera/Calyx ratings | Score 5 (AA/AAA tier): eligible for high-integrity corporate net-zero claims; Score <3: not recommended for sc |
| Permanence Risk Rating | `reversal_probability × time_horizon_discount` | Methodology family + buffer pool analysis | Nature-based solutions have inherently higher permanence risk; technological removals (DACCS, BECCS) score Ver |
| Additionality Evidence Score | `financial_additionality × regulatory_surplus × common_practice` | Project-level documentation review | Scores <50 indicate projects that may have occurred anyway; critical screen for high-integrity offset procurem |
- **Verra/GS/ACR/CAR project registries + BeZero/Sylvera ratings APIs** → Taxonomy classification → quality tier standardisation → permanence risk scoring → **VCM credit taxonomy database with multi-rater quality scores**

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
**Methodology:** VCM Registry-Methodology Taxonomy
**Headline formula:** `quality_score = registry_rigour_weight × methodology_permanence × additionality_score`
**Standards:** ['Verra VCS Standard v4.0', 'Gold Standard for the Global Goals v2.2', 'BeZero Carbon Rating Methodology']

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