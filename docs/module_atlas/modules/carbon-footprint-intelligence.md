# Carbon Footprint Intelligence
**Module ID:** `carbon-footprint-intelligence` · **Route:** `/carbon-footprint-intelligence` · **Tier:** A (backend vertical) · **EP code:** EP-CD3 · **Sprint:** CD

## 1 · Overview
GHG Protocol-aligned Scope 1/2/3 emissions analysis for 4 companies (Microsoft, BP, Apple, Unilever). Scope 3 category drill-down, carbon intensity benchmarking, SBTi trajectory comparison.

**How an analyst works this module:**
- Scope 1/2/3 Dashboard shows stacked breakdown per company
- Scope 3 Category Breakdown drills into 7 material categories
- Intensity Benchmarking compares tCO₂/$M against sector average
- Reduction Pathways show SBTi target trajectory overlay
- Peer Comparison ranks 4 companies on all metrics

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `SCOPE3_CATS_META`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COMPANIES` | 42 | `name`, `sector`, `color`, `scope1`, `scope2_mkt`, `scope2_loc`, `scope3`, `s3_cats`, `cat`, `mt` |
| `SCOPE3_CATS_META` | 8 | `name`, `typical` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Scope 1/2/3 Dashboard', 'Scope 3 Category Breakdown', 'Intensity Benchmarking', 'Reduction Pathways', 'Peer Comparison'];` |
| `totalS123` | `co.scope1 + co.scope2_mkt + co.scope3;` |
| `scope3Pct` | `totalS123 > 0 ? (co.scope3 / totalS123) * 100 : 0;` |
| `intensityData` | `COMPANIES.map(c => ({` |
| `reduction2030` | `base2023 > 0 ? ((base2023 - target2030val) / base2023 * 100).toFixed(0) : '0';` |

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
**Frontend seed datasets:** `COMPANIES`, `SCOPE3_CATS_META`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scope 1 | `Combustion + process + fugitive` | CDP/Annual reports | Emissions from company-owned sources |
| Scope 2 (market) | `Grid mix - PPAs - RECs` | CDP/Utility data | Indirect emissions from purchased electricity, adjusted for renewable procurement |
| Scope 3 Cat 11 | `Product lifecycle emissions` | GHG Protocol | Emissions from customer use of sold products (dominant for O&G companies) |
| Carbon Intensity | `Total emissions / Revenue` | Calculated | Normalised metric for cross-company and cross-sector comparison |

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
**Methodology:** GHG Protocol corporate accounting
**Headline formula:** `Total = Scope1 + Scope2(market) + Scope3; Intensity = Total / Revenue`

Scope 1: direct emissions from owned/controlled sources. Scope 2: indirect from purchased energy (market-based and location-based). Scope 3: 15 value chain categories with Cat 11 (Use of Sold Products) often dominant for fossil fuel companies. Carbon intensity = tCO₂e / $M revenue for peer benchmarking.

**Standards:** ['GHG Protocol Corporate Standard', 'SBTi', 'CDP']
**Reference documents:** GHG Protocol Corporate Standard; GHG Protocol Scope 3 Standard; SBTi Corporate Net-Zero Standard; CDP Climate Change Questionnaire

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
| `carbon-reduction-projects` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-aware-allocation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-forward-curve` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-project-lifecycle` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-removal-markets` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-adjusted-valuation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-capture-finance` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry (EP-CD3) is **accurate in scope**: the code implements a GHG
Protocol-style Scope 1/2/3 comparison for exactly the 4 companies the guide names (Microsoft,
BP, Apple, Unilever). One nuance: the guide's formula `Intensity = Total / Revenue` is *not
computed* in code — `intensity_rev` and `intensity_fte` are stored seed fields, and the "SBTi
trajectory" is a stored per-company array, not a derived pathway. No mismatch blockquote is
warranted, but the guide overstates the amount of live calculation.

### 7.1 What the module computes

Only three quantities are derived at runtime; everything else is seed-table display:

```
totalS123     = scope1 + scope2_mkt + scope3                    // market-based total
scope3Pct     = totalS123 > 0 ? scope3 / totalS123 × 100 : 0     // Scope 3 dominance
reduction2030 = (actual_2023 − target_2030) / actual_2023 × 100  // required cut vs 2023 base
```

Note the total uses **market-based Scope 2** (`scope2_mkt`), per GHG Protocol Scope 2 Guidance
dual-reporting convention; the location-based figure (`scope2_loc`) is carried in the data but
not summed.

### 7.2 Seed dataset (per company, MtCO₂e)

| Company | S1 | S2 mkt | S2 loc | S3 | Dominant S3 category | Intensity (t/$M) | SBTi |
|---|---|---|---|---|---|---|---|
| Microsoft | 0.15 | 0.00 | 0.68 | 13.8 | Cat 11 Use of Products 8.2 | 28.4 | ✓ |
| BP plc | 48.2 | 3.8 | 4.2 | 360.0 | Cat 11 354.0 (98% of S3) | 1,480 | ✗ |
| Apple | 0.061 | 0.00 | 0.58 | 20.6 | Cat 11 14.8 | 51.8 | ✓ |
| Unilever | 1.42 | 0.38 | 0.58 | 59.8 | Cat 1 Purchased Goods 42.8 | 820 | ✓ |

Values are hard-coded but directionally consistent with the companies' FY2023 CDP/annual-report
disclosures (e.g. Microsoft's zero market-based Scope 2 via 100% renewable procurement; BP's
Scope 3 dominated by use of sold products ~360 Mt). Trajectories carry `actual` points 2019–2023
plus `target` points for 2025/2030. `SCOPE3_CATS_META` tags 7 of the GHG Protocol's 15 Scope 3
categories with typical materiality (High/Medium/Low).

### 7.3 Calculation walkthrough

1. Company selector sets `co`; KPI cards render S1, S2(mkt), S3, and `totalS123` with
   `scope3Pct` as the Scope 3 share caption.
2. Tab 1 renders `co.s3_cats` as a horizontal bar chart (disclosed material categories only —
   not all 15).
3. Tab 2 sorts all four companies ascending by stored `intensity_rev` (tCO₂e/$M revenue) —
   labelled as a WACI-style benchmark, but no portfolio weighting occurs.
4. Tab 3 computes `reduction2030` per company and renders a **hard-coded "~30% progress toward
   2030 target" bar** (width fixed at 30% for every company — a display placeholder, not a
   calculation).
5. Tab 4 stacks S1/S2mkt/S3 across the peer set.

### 7.4 Worked example (BP, Reduction Pathways tab)

| Step | Computation | Result |
|---|---|---|
| 2023 base | trajectory.find(2023).actual | 412 MtCO₂e |
| 2030 target | trajectory.find(2030).target | 290 MtCO₂e |
| Required reduction | (412 − 290)/412 × 100 | **30%** |
| Total S1+S2mkt+S3 | 48.2 + 3.8 + 360.0 | **412.0 MtCO₂e** |
| Scope 3 share | 360/412 × 100 | **87.4%** |

The identity `total ≈ 2023 trajectory actual` holds for BP by construction of the seeds.

### 7.5 Data provenance & limitations

- All company data are **static seeds** (no `sr()` PRNG here) resembling public FY2023
  disclosures; they will drift stale and carry no vintage metadata.
- The module fetches nothing from the mapped backend (`carbon_calculator.py`,
  `/api/v1/carbon/*` routes are wired in the atlas but unused by the page).
- Progress bars (30%) are cosmetic; intensity is not recomputed from revenue; there is no
  location- vs market-based toggle; only 7 of 15 Scope 3 categories appear.
- Peer set of 4 is too small for the "sector average" benchmarking the guide implies.

**Framework alignment:** GHG Protocol Corporate Standard (scope definitions; market-based S2 per
the Scope 2 Guidance) · GHG Protocol Scope 3 Standard (15-category taxonomy; module shows the
material subset) · SBTi Corporate Net-Zero Standard — the ✓/✗ flag mirrors SBTi validation status;
SBTi requires 1.5 °C-aligned near-term targets (~4.2%/yr linear reduction for S1+2) which the
stored 2030 targets loosely approximate · CDP climate questionnaire as the implied disclosure
source.

## 8 · Model Specification — SBTi Pathway & Temperature-Alignment Engine

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Replace stored trajectories and the fixed 30% progress bar with a
computed target-pathway engine: required pathway, actual progress, and an implied temperature
rise (ITR) per company — supporting analyst screening of climate ambition for any issuer set.

**8.2 Conceptual approach.** Two complementary methods, both industry standard: (i) **absolute
contraction** pathway per SBTi Corporate Net-Zero Standard v1.2 (−4.2%/yr for 1.5 °C S1+2;
−2.5%/yr minimum for well-below-2 °C S3); (ii) **implied temperature rise** via linear
regression of ambition gap onto warming, per the CDP-WWF temperature-rating methodology used by
MSCI ITR and SBTi's own portfolio guidance.

**8.3 Mathematical specification.**

```
Pathway_t        = E_base × (1 − r)^(t − t_base),   r = 4.2% (1.5°C, S1+2), 2.5% (WB2C, S3)
Progress%        = (E_base − E_latest) / (E_base − Pathway_latest) × 100     // replaces the 30% stub
CAGR_target      = (E_target / E_base)^(1/(t_target − t_base)) − 1
ITR (CDP-WWF)    = T_base + β × (CAGR_target − CAGR_1.5°C)                    // T_base=1.5, β≈scoring slope per horizon
Intensity_t      = E_t / Revenue_t                                            // computed, not stored
```

| Parameter | Value / source |
|---|---|
| r (1.5 °C absolute contraction) | 4.2%/yr — SBTi Corporate Manual v2 |
| CDP-WWF slope β, default scores | CDP-WWF Temperature Rating Methodology (2020, public) |
| Sector decarbonisation (SDA) pathways for O&G, utilities | IEA NZE 2050 / SBTi SDA tools |
| Company E, revenue | CDP responses, annual reports; free: company sustainability reports + SBTi target dashboard (SBTi data already ingested in platform `reference_data`) |

**8.4 Data requirements.** Base-year and latest S1/S2(mkt & loc)/S3 by category, revenue, FTEs,
target metadata (scope coverage, % reduction, target year, SBTi status). Platform assets: SBTi
companies table in `reference_data`; `useReferenceData` hook for frontend wiring.

**8.5 Validation & benchmarking.** Reconcile computed ITR against published MSCI ITR /
CDP temperature ratings for the 4 seed names (tolerance ±0.3 °C); backtest Progress% against
five years of disclosed actuals; stability test: ±10% revenue restatement must move intensity
but not the SBTi pass/fail flag.

**8.6 Limitations & model risk.** ITR methods diverge widely across vendors (documented spread
>1 °C for the same firm); Scope 3 data quality is poor (PCAF DQ 4–5 typical); absolute
contraction ignores sector heterogeneity — use SDA for high-intensity sectors. Conservative
fallback: when targets are unvalidated, score as "no target" (ITR 3.2 °C default per CDP-WWF).

## 9 · Future Evolution

### 9.1 Evolution A — Real disclosed emissions with SBTi trajectory validation (analytics ladder: rung 1 → 3)

**What.** The page shows Scope 1/2/3 for named companies (the overview says 4 — Microsoft, BP, Apple, Unilever — but the `COMPANIES` seed table now holds 42 rows) with real-looking structure: per-company scope1/scope2_mkt/scope2_loc/scope3, Scope 3 category splits (`s3_cats`), intensity benchmarking, and SBTi trajectory overlay. The computations are honest (`totalS123`, `scope3Pct`, `reduction2030`) but the emissions figures are static seed data, not sourced from actual disclosures, and the SBTi "trajectory" is a target overlay rather than a validated pathway. The registered backend is the generic `carbon.py` suite. Evolution A grounds the emissions and validates the pathways.

**How.** (1) Source per-company Scope 1/2/3 from actual disclosures (CDP, annual sustainability reports — these named large-caps all disclose) with reporting-year vintages, replacing the seed table; where a company hasn't disclosed a Scope 3 category, report null, not a filled value. (2) SBTi trajectory validation: compare the company's disclosed reduction path against its actual SBTi-approved target (the SBTi target database is public) and flag on-track vs off-track — turning the overlay into a real assessment. (3) Intensity benchmarking against real sector averages (the platform's own `carbon-calculator` sector benchmarks). (4) Rung 3: benchmark computed intensities against a disclosed-emissions dataset and pin a reference company. As a backend vertical, wire the page to the real GHG data rather than the seed.

**Prerequisites.** CDP/report emissions data for the covered companies; the SBTi target database; a Scope 3 category-completeness convention (companies disclose different categories). **Acceptance:** emissions derive from cited disclosures with reporting years; SBTi on-track/off-track reflects the real approved target; undisclosed Scope 3 categories show null; intensities benchmark against real sector data.

### 9.2 Evolution B — Corporate footprint-benchmarking copilot (LLM tier 2)

**What.** Analysts ask "how does Microsoft's Scope 3 intensity compare to sector peers?", "is BP on track for its SBTi target?", "which Scope 3 category dominates Apple's footprint?" — the copilot runs the Evolution-A benchmarking and SBTi-validation tools over real disclosed data, every tonne and intensity tool-traced, with the disclosure vintage stated.

**How.** Tool schemas over the Evolution-A footprint/benchmarking/SBTi routes; grounding corpus is this Atlas record plus the GHG Protocol / SBTi references. The copilot's honesty duties are specific to disclosed-emissions analysis: it states the reporting year (emissions data lags 1-2 years), distinguishes market-based vs location-based Scope 2 (the page carries both), and reports Scope 3 completeness honestly since incomplete Scope 3 makes cross-company comparison unreliable — a real analytical trap the copilot must flag rather than paper over. These are real companies, so the system prompt forbids blending disclosed figures with the LLM's background knowledge of them.

**Prerequisites (hard).** Evolution A's real disclosed data — a copilot narrating seeded emissions for named companies would misstate real firms' footprints. **Acceptance:** every emission figure traces to a tool response with its reporting year; Scope 2 market vs location is distinguished; Scope 3 completeness is flagged before cross-company comparison; SBTi verdicts cite the approved target.