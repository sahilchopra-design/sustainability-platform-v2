# Carbon Offtake Structurer
**Module ID:** `carbon-offtake-structurer` · **Route:** `/carbon-offtake-structurer` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AFOLU_TYPES`, `BENCH_CATEGORY`, `BUFFER_DEFAULTS`, `Badge`, `CONTRACT_TYPES`, `COUNTRIES`, `Field`, `ILLUSTRATIVE_BOOK`, `Kpi`, `METHODOLOGIES`, `SDG_TAGS`, `STAGE_HAIRCUTS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `METHODOLOGIES` | 18 | `standard`, `type`, `name` |
| `STAGE_HAIRCUTS` | 5 | `label`, `defaultPct`, `rangeNote`, `rationale` |
| `CONTRACT_TYPES` | 5 | `label`, `note` |
| `BUFFER_DEFAULTS` | 7 | `label`, `defaultPct`, `rangeNote` |
| `ILLUSTRATIVE_BOOK` | 4 | `methodologyKey`, `standard`, `type`, `country`, `stage`, `contractType`, `vintageStart`, `tenorYears`, `avgPrice`, `qualityScore`, `art6Authorized`, `deliveries` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hhi` | `(shares) => shares.reduce((s, x) => s + (x * 100) ** 2, 0);` |
| `priceBand` | `(P0, sigma, z, tauYrs = 1) => P0 * Math.exp(z * sigma * Math.sqrt(tauYrs));` |
| `fmt` | `(v, d = 1) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });` |
| `fmtUsd` | `(v, d = 2) => (v == null \|\| isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d })}`;` |
| `fmtT` | `(v) => (v == null \|\| isNaN(v)) ? '—' : `${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })} t`;` |
| `econ` | `useMemo(() => { const tenor = Math.max(1, Math.min(20, parseInt(terms.tenorYears, 10) \|\| 1));` |
| `wIdx` | `Math.max(0, Math.min(100, parseFloat(terms.indexationPct) \|\| 0)) / 100;` |
| `streamPct` | `Math.max(0, Math.min(100, parseFloat(terms.streamingPct) \|\| 0)) / 100;` |
| `issuingHaircut` | `STAGE_HAIRCUTS[3].defaultPct; // 5%` |
| `ramp` | `rampYears > 0 ? Math.min((t - 1) / rampYears, 1) : 0;` |
| `haircutPct` | `Math.max(issuingHaircut, baseHaircut - (baseHaircut - issuingHaircut) * ramp);` |
| `expectedIssuance` | `annVol * (1 - haircutPct / 100);            // project-level risk-adj issuance` |
| `benchT` | `haveBench ? benchPrice * ((1 + g) ** t) : null;` |
| `qBenchT` | `benchT != null ? benchT * qf : null;` |
| `cash` | `effPrice != null ? expectedDelivered * effPrice : null;  // buyer cost = seller revenue (pre-fees)` |
| `totDelivered` | `rows.reduce((s, r) => s + r.expectedDelivered, 0);` |
| `totContracted` | `rows.reduce((s, r) => s + r.contracted, 0);` |
| `totCash` | `rows.every((r) => r.cash != null) ? rows.reduce((s, r) => s + r.cash, 0) : null;` |
| `totPV` | `rows.every((r) => r.pv != null) ? rows.reduce((s, r) => s + r.pv, 0) : null;` |
| `avgPrice` | `totCash != null && totDelivered > 0 ? totCash / totDelivered : null;` |
| `prepayEffPrice` | `prepayAmount != null && totDelivered > 0 ? prepayAmount / totDelivered : null;` |
| `fixedDeliv` | `volYr * (1 - r.haircutPct / 100);` |
| `streamDeliv` | `(annVol * (1 - r.haircutPct / 100)) * streamPct;` |
| `vintageOk` | `(parseInt(project.vintageStart, 10) \|\| 0) >= 2016; // ref: "Issued from 2016 onwards"` |
| `prem` | `(parseFloat(overlay.compPremiumPct) \|\| 0) / 100;` |
| `caDisc` | `(parseFloat(overlay.caDiscountPct) \|\| 0) / 100;` |
| `compliancePrice` | `base * (1 + prem);                                   // compliance-eligible differential (labeled observation)` |
| `caAdjusted` | `overlay.art6Authorized ? compliancePrice : compliancePrice * (1 - caDisc);` |
| `ins` | `Math.max(0, parseFloat(buf.insPremPct) \|\| 0) / 100;` |
| `rows` | `econ.rows.map((r) => {` |
| `bufferContrib` | `r.expectedDelivered * b;` |
| `netToBuyer` | `r.expectedDelivered * (1 - b);` |
| `grossEL` | `p * cumNet;                          // tonnes/yr expected reversal` |
| `netEL` | `grossEL - covered;` |
| `tot` | `(k) => (rows.every((x) => x[k] != null) ? rows.reduce((s, x) => s + x[k], 0) : null);` |
| `sigma` | `Math.max(0, parseFloat(flex.volPct) \|\| 0) / 100;` |
| `fPct` | `Math.max(0, Math.min(100, parseFloat(flex.flexPct) \|\| 0)) / 100;` |
| `flexVol` | `(parseFloat(terms.volumePerYear) \|\| 0) * fPct;` |
| `bands` | `[-2, -1, 0, 1, 2].map((z) => {` |
| `topPct` | `Math.max(0, Math.min(100, parseFloat(flex.topPct) \|\| 0));` |

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
| POST | `/api/v1/carbon-credit-quality/score-project` | `score_project` | api/v1/routes/carbon_credit_quality.py |
| POST | `/api/v1/carbon-credit-quality/score-portfolio` | `score_portfolio` | api/v1/routes/carbon_credit_quality.py |
| POST | `/api/v1/carbon-credit-quality/check-ccp-eligibility` | `check_ccp_eligibility` | api/v1/routes/carbon_credit_quality.py |
| GET | `/api/v1/carbon-credit-quality/ref/standards` | `ref_standards` | api/v1/routes/carbon_credit_quality.py |
| GET | `/api/v1/carbon-credit-quality/ref/icvcm-criteria` | `ref_icvcm_criteria` | api/v1/routes/carbon_credit_quality.py |
| GET | `/api/v1/carbon-credit-quality/ref/methodologies` | `ref_methodologies` | api/v1/routes/carbon_credit_quality.py |
| GET | `/api/v1/carbon-credit-quality/ref/corsia-eligibility` | `ref_corsia_eligibility` | api/v1/routes/carbon_credit_quality.py |
| GET | `/api/v1/carbon-credit-quality/ref/price-benchmarks` | `ref_price_benchmarks` | api/v1/routes/carbon_credit_quality.py |

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

### 2.3 Engine `carbon_credit_quality_engine` (services/carbon_credit_quality_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CarbonCreditQualityEngine.get_instance` |  |  |
| `CarbonCreditQualityEngine.check_ccp_eligibility` | standard, methodology, project_type |  |
| `CarbonCreditQualityEngine.score_project` | entity_id, project_id, project_name, standard, methodology, project_type, vintage_year, volume_tco2e |  |
| `CarbonCreditQualityEngine.score_portfolio` | entity_id, portfolio |  |
| `CarbonCreditQualityEngine.ref_standards` |  |  |
| `CarbonCreditQualityEngine.ref_icvcm_criteria` |  |  |
| `CarbonCreditQualityEngine.ref_methodologies` |  |  |
| `CarbonCreditQualityEngine.ref_corsia_eligibility` |  |  |
| `CarbonCreditQualityEngine.ref_price_benchmarks` |  |  |
| `get_engine` |  |  |

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

**Database tables:** `Manure` *(shared)*, `Wind` *(shared)*, `__future__` *(shared)*, `database` *(shared)*, `dataclasses` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `projects` *(shared)*, `pydantic` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `AFOLU_TYPES`, `BUFFER_DEFAULTS`, `CONTRACT_TYPES`, `COUNTRIES`, `ILLUSTRATIVE_BOOK`, `METHODOLOGIES`, `STAGE_HAIRCUTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

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
**Blast radius:** changes here can affect **75** other module(s).
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

### 7.1 What the module computes

`frontend/src/features/carbon-offtake-structurer/pages/CarbonOfftakeStructurerPage.jsx` (1,529
lines) is an ERPA (Emission Reduction Purchase Agreement) structuring desk. A user describes a
carbon-credit project (methodology, stage, country, annual volume, vintages) and a contract
structure (spot-indexed forward / fixed-price forward / prepay / streaming, tenor, indexation
weight, floor/ceiling collar, discount rate), and the page computes the deal period-by-period:

```
haircut_t          = delivery-risk haircut, ramped from a stage default toward the issuing-stage floor
expectedDelivered_t = contracted_t × (1 − haircut_t / 100)                      [fixed-schedule contracts]
                    = issuance_t × (1 − haircut_t / 100) × streamingPct         [streaming contracts]
qBench_t           = benchmark_t × qualityFactor                               (benchmark_t = benchPrice·(1+drift)^t)
rawPrice_t         = qBench_t                                                  [spot_forward — 100% indexed]
                   = (1 − w)·fixed + w·qBench_t                                [fixed_forward / prepay / streaming, w = indexation %]
effPrice_t         = min(max(rawPrice_t, floor), ceiling)                      (collar)
cash_t             = expectedDelivered_t × effPrice_t
pv_t               = cash_t / (1 + discountRate)^t
```

Two live engine calls feed the deal: `POST /api/v1/carbon-credit-quality/score-project`
(ICVCM CCP quality score, standard/methodology/type/vintage/volume → 0–100 score, grade, CORSIA
flag, permanence risk, price range) and `GET /api/v1/carbon-credit-quality/ref/price-benchmarks`
(category median $/t used as the benchmark price, editable). Everything downstream — haircuts,
buffer-pool/reversal EL, delivery-optionality bands, ratchet/CPI/FX indexation, the ERPA portfolio
book, the CORSIA/Article-6 overlay, and the net-zero retirement planner — is computed locally in
the page from user terms plus the two live responses. Backing engine:
`backend/services/carbon_credit_quality_engine.py`, routed by
`backend/api/v1/routes/carbon_credit_quality.py`.

### 7.2 Quality-score engine (traced from `carbon_credit_quality_engine.py`)

`score_project()` is a deterministic additive rubric, not a market-observed score:

```python
base_score = 70.0
if std_info["ccp_label_eligible"]: base_score += 10
if ccp_result["ccp_eligible"]:     base_score += 10
if vintage_year >= 2020:           base_score += 5
elif vintage_year < 2015:          base_score -= 15
if perm["risk_score"] > 0.6:       base_score -= 10
if standard == "cdm" and vintage_year < 2015: base_score -= 10
quality_score = clip(base_score, 0, 100)
```
Grade bands: A ≥ 85, B ≥ 70, C ≥ 55, else D. `ccp_eligible` requires ≥ 8 of 10 ICVCM CCP criteria
to pass (`check_ccp_eligibility`) **and** `standard` in {vcs, gold_standard, american_carbon_registry,
climate_action_reserve, art6_itmo} — CDM and Plan Vivo can never reach CCP eligibility in this
rubric. Price range = category benchmark (`nature_based_removal` for AFOLU/blue-carbon,
`tech_removal` for DAC, `avoidance` for RE/cookstoves/methane/industrial) × 1.20 if CCP-eligible
(the engine's hard-coded 20% CCP label premium), else ×1.0. CORSIA eligibility is looked up
directly from `STANDARDS[standard].corsia_eligible` (vcs/gold_standard/ACR/CAR/art6_itmo = True;
cdm/plan_vivo = False) — independent of the quality score.

### 7.3 Worked example — default deal (Rio Verde REDD+ Cluster)

Page defaults: methodology `VM0015` (standard `vcs`, type `redd_plus`), stage `registered`,
annual volume 250,000 t, vintage start 2026; contract `fixed_forward`, tenor 7y, fixed price
$24/t, indexation 30%, benchmark drift 4%/yr, floor $15, ceiling $45, discount rate 10%, ramp 5y;
quality-map slope 30 / pivot 50.

**Quality score** (`score_project`, standard=vcs, type=redd_plus, vintage=2026):
`base=70 +10 (vcs ccp_label_eligible) +10 (ccp_eligible=True, 10/10 criteria pass since
perm.risk_score=0.6 is not >0.7) +5 (vintage≥2020) = 95.0` → **grade A**. Price range:
nature_based_removal (15–60) × 1.20 (CCP premium) = **$18.0–$72.0/t**.

**Quality → price factor**: `1 + 30%·(95−50)/50 = 1 + 30%·0.9 = ×1.270`.

**Period 1 economics** (t=1, year 2026): stage haircut 15% (registered), ramp t=1 → 0% progressed
→ haircut stays 15%. `expectedDelivered = 250,000 × 0.85 = 212,500 t`. Live benchmark median for
`nature_based_removal` = $28/t (from `PRICE_BENCHMARKS`) → `benchT = 28 × 1.04¹ = $29.12/t` →
`qBenchT = 29.12 × 1.270 = $36.98/t`. Blended contract price (fixed_forward, w=30%):
`rawPrice = 0.70×24 + 0.30×36.98 = 16.80 + 11.09 = $27.89/t`. Collar (floor 15 / ceiling 45):
27.89 is inside the band → `effPrice = $27.89/t` unchanged, both payoffs zero.
`cash₁ = 212,500 × 27.89 ≈ $5,927,628`; discounted at 10%: `pv₁ = 5,927,628 / 1.10 ≈ $5,388,753`.

**Haircut maturation ramp** (5y to the issuing-stage floor 5%): haircut(t) =
`max(5, 15 − 10·min((t−1)/5, 1))` → 15, 13, 11, 9, 7, 5, 5% for t = 1…7 — confirms the linear
ramp collapses exactly to the 5% floor at t=6 and holds flat thereafter.

### 7.4 Buffer pool & reversal-risk EL (AFOLU non-permanence)

`meth.type = redd_plus` is in `AFOLU_TYPES`, so the buffer model applies. Documented recursion
(one period, using period-1 numbers above; registry `vcs` → buffer default 20%, user reversal
probability 1.0%/yr, insurance 2.0%/yr):

```
bufferContrib₁ = expectedDelivered₁ × b = 212,500 × 0.20 = 42,500 t
netToBuyer₁    = 212,500 × 0.80        = 170,000 t
cumBuffer₁ = 42,500 t;  cumNet₁ = 170,000 t
grossEL₁   = p × cumNet₁ = 0.01 × 170,000 = 1,700 t/yr        (expected annual reversal)
covered₁   = min(1,700, 42,500) = 1,700                       (buffer absorbs it entirely)
netEL₁     = 1,700 − 1,700 = 0 t
grossEL₁$  = 1,700 × 27.89 ≈ $47,421
insPrem₁$  = 0.02 × 170,000 × 27.89 ≈ $94,842
```
Because the 20%-of-issuance buffer contribution vastly exceeds a 1%/yr reversal probability
applied to a single year's stock, `netEL` stays at zero in year 1 — it only turns positive once
cumulative stock grows large enough that `p × cumNet > cumBuffer`, i.e. once
`cumNet > cumBuffer / p = cumBuffer × 100` (at p = 1%). With b=20% contributed each period,
`cumBuffer/cumNet` stays a constant 20/80 = 0.25 (both grow at the same rate under a flat delivery
schedule), so `netEL` is structurally zero at p = 1% here — a useful check on the model's
internal consistency, and a reason the desk should test higher reversal-probability scenarios
(e.g. p = 30%/yr) to see the buffer actually bind.

### 7.5 Delivery optionality (deterministic ±σ bands)

`priceBand(P0, σ, z, τ=1) = P0 · e^{z·σ·√τ}` — a driftless lognormal percentile ladder, not a
Monte Carlo simulation. With period-1 reference `P0 = qBenchT₁ = $36.98`, `K = effPrice₁ = $27.89`,
default σ = 40%, flex band ±15% of the 250,000 t/yr contracted volume (`flexVol = 37,500 t`):
`P(+1σ) = 36.98·e^{0.40} = 36.98 × 1.4918 = $55.17`; buyer call value at +1σ =
`37,500 × max(55.17−27.89, 0) = 37,500 × 27.28 ≈ $1,023,000`. `P(−1σ) = 36.98·e^{−0.40} =
36.98 × 0.6703 = $24.79`; seller put value at −1σ = `37,500 × max(27.89−24.79,0) = 37,500 × 3.10
≈ $116,250`. The put/call asymmetry (seller's downside put is worth far less than the buyer's
upside call at ±1σ) is a direct consequence of the strike (K=$27.89) sitting well below the
reference forward (P0=$36.98) — the position is already deep "in the money" for the buyer's call
side before any vol is applied.

### 7.6 Mark-to-benchmark P&L & portfolio aggregation

`bookAgg` (§9 ERPA portfolio book) marks each stored contract to the live category benchmark:
`mtb = (benchNow − avgPrice) × totalVol`. E.g. the illustrative "Sumatra Mangrove Restoration"
seed (`blue_carbon`, contract price $21.5/t, benchmark category `nature_based_removal` median
$28/t, 300,000 t aggregate delivered over 8 periods per the illustrative delivery schedule) marks
at `(28 − 21.5) × 300,000 = +$1,950,000` — a positive mark because the fixed contract was struck
below today's category median. This is explicitly labeled an indicative screen (category median as
observable proxy), not a fair-value mark of the bespoke collar/prepay terms. Concentration is
measured by Herfindahl-Hirschman index on volume shares (`hhi = Σ(share×100)²`), with the UI's own
DoJ/FTC-style bands (>2,500 concentrated, 1,500–2,500 moderate, <1,500 diversified).

### 7.7 Data provenance & limitations

- **Live, computed from real code**: quality score/grade/CCP/CORSIA flag/price range
  (`carbon_credit_quality_engine.score_project`), category price benchmarks
  (`ref_price_benchmarks`), CORSIA 2024–26 eligible-programme list and vintage rule
  (`ref_corsia_eligibility`).
- **Labeled modeling defaults (editable)**: delivery-risk haircuts by stage (concept 50%,
  validated 30%, registered 15%, issuing 5%) are hand-authored market-convention ranges, not
  observed transaction data; registry buffer-pool defaults (VCS 20%, Gold Standard 20%, CAR 18%,
  ACR 16%, ART TREES 5%, CDM 0%) are stated as indicative of each registry's published regime, not
  a live pull of the registry's risk-tool output; the quality→price linear mapping
  (`benchmark × (1 + slope·(score−pivot)/50)`, default slope 30%/pivot 50) is a documented,
  user-editable convention, not a fitted market relationship.
- **User assumptions**: benchmark drift, discount rate, volatility for the delivery-optionality
  bands, CA-risk discount / compliance premium, CPI and FX drift, reversal probability, insurance
  premium, net-zero trajectory shape (linear decline to a residual % at the NZ year).
- The reversal-EL model is single-factor linear in the user's reversal probability by
  construction (`grossEL = p × cumNet`) — no hazard-specific (fire/political/tenure) decomposition,
  no time-varying p, no correlation between projects in the buffer/portfolio view.
- The mark-to-benchmark P&L is a category-median proxy, not a discounted re-price of the specific
  collar/prepay/streaming structure — bespoke terms are not revalued.
- SDG co-benefit tags are methodology-family indicative mappings (mirroring the platform's own DCM
  reference catalogue), explicitly superseded by project-specific certification (e.g. GS4GG).

**Framework alignment:** ICVCM Core Carbon Principles Assessment Framework v2.0 (2023) · ICAO
CORSIA Eligible Emissions Unit Criteria (Doc 9501, 2024–2026 cycle) · Paris Agreement Article 6 §§
6.2/6.4 (corresponding adjustments) · Verra VCS AFOLU non-permanence risk tool / Gold Standard A/R
buffer / CAR / ACR risk-based buffer conventions (labeled, not live registry pulls).

## 8 · Model Specification

**Status: implemented.** Every formula below is live code in
`CarbonOfftakeStructurerPage.jsx` (local computation) wired to the two engine endpoints named in
§7.1; nothing in this section is aspirational.

**8.1 Purpose & scope.** Structure and analyze a forward carbon-credit purchase agreement (ERPA)
across four contract archetypes (spot-indexed forward, fixed-price forward, prepay, streaming),
quantify delivery risk, AFOLU non-permanence exposure, price/volume optionality, compliance
eligibility (CORSIA/Article 6), and portfolio-level aggregation — for offtake-desk structuring and
buy-side ERPA negotiation.

**8.2 Conceptual approach.** A period-by-period deterministic cash-flow engine: (i) a live quality
score adjusts a live category-price benchmark via a documented linear map; (ii) a stage-conditioned
haircut (with an optional linear maturation ramp to the issuing-stage floor) derates contracted
volume to expected delivered volume; (iii) the contract price is a fixed/benchmark blend inside an
optional floor/ceiling collar; (iv) AFOLU buffer-pool set-asides and a linear reversal-probability
expected-loss walk run alongside; (v) a driftless lognormal percentile ladder (no simulation) prices
delivery-volume optionality; (vi) a multi-contract book aggregates mark-to-benchmark P&L, quality,
concentration (HHI) and vintage-ladder analytics.

**8.3 Mathematical specification.**
```
qf                = 1 + slope · (score − pivot) / 50 / 100
haircut(t)        = max(issuingHaircut, baseHaircut − (baseHaircut − issuingHaircut) · min((t−1)/ramp, 1))
delivered(t)       = contracted(t) · (1 − haircut(t))                         [scheduled contracts]
                   = issuance(t) · (1 − haircut(t)) · streamPct               [streaming]
price(t)          = (1 − w)·fixed + w · benchmark(t) · qf,  clipped to [floor, ceiling]
cash(t), pv(t)     = delivered(t)·price(t),  cash(t)/(1+r)^t
bufferContrib(t)   = delivered(t) · b;  cumNet(t) = Σ delivered(1−b)
grossEL(t)         = p · cumNet(t);  netEL(t) = max(0, grossEL(t) − cumBuffer(t))
P(z)               = P0 · exp(z·σ·√τ),  z ∈ {−2,−1,0,1,2}
mtb                = (benchmarkNow − contractPrice) · totalVolume
```

**8.4 Data requirements.** Live: ICVCM CCP quality score + CORSIA eligibility + category price
benchmark (both served by the platform's own `carbon_credit_quality_engine`). User: contract terms,
project attributes, haircut/buffer overrides, volatility, discount/CPI/FX assumptions, corporate
net-zero trajectory. None of these require external data feeds beyond what the platform already
serves.

**8.5 Validation & benchmarking.** Internal consistency checks already present in-code: collar
payoff identity `effective = min(max(raw, floor), ceiling)` with floor/ceiling payoffs summing to
the price gap; put-call-style monotonicity of the optionality bands in the vol input; HHI computed
on the standard `Σ(share×100)²` scale reproduced against DoJ/FTC bands. Recommended external
benchmark: reconcile category benchmarks and CCP premium against ICVCM's published assessed-programme
list and observed OTC broker prices; reconcile buffer defaults against each registry's current
risk-tool output for a live deal (labeled as a to-do in-UI).

**8.6 Limitations & model risk.** Haircuts, buffer defaults, and CA-risk/compliance-premium inputs
are desk conventions, not fitted to transaction data — treat as a starting negotiating position, not
a market clearing price. The reversal-EL model is linear in a single user-supplied probability with
no hazard decomposition or time-varying risk. The delivery-optionality ladder is a percentile
scenario table, not a priced American/Asian option — no early-exercise or path-dependency is
modeled. Mark-to-benchmark P&L uses a category median as an observable proxy and does not revalue
collar/prepay-specific optionality already embedded in a stored contract.

## 9 · Future Evolution

### 9.1 Evolution A — Formalise the offtake engine and pin its risk-adjustment math (analytics ladder: rung 2 → 3)

**What.** This is a strong, genuinely quantitative structuring page: a real offtake cash-flow engine (`econ`) with stage-based delivery haircuts that ramp over time, lognormal price bands (`priceBand = P0 × exp(z·σ·√τ)`), buffer-pool/expected-loss modelling (`grossEL = p × cumNet`, insurance coverage), streaming/prepay/indexation structures, HHI concentration, and Article 6 corresponding-adjustment price overlays. The tables (`STAGE_HAIRCUTS`, `BUFFER_DEFAULTS`, `METHODOLOGIES`) carry documented rationale, and the book is honestly labelled `ILLUSTRATIVE_BOOK`. The gaps are that the engine runs entirely client-side and its haircut/buffer defaults, while rationalised, aren't calibrated to observed delivery/reversal data. Evolution A hardens it.

**How.** (1) Extract the offtake engine to a backend route (`POST /api/v1/carbon-offtake/structure`) so contracts persist and the math is testable — it's pure and well-structured. (2) Calibrate the stage-delivery haircuts against observed carbon-project delivery-shortfall data (many pre-2020 forestry projects under-delivered — real data exists) so the ramp reflects empirical delivery risk (rung 3). (3) Buffer/expected-loss reversal rates from registry buffer-pool cancellation history rather than defaults. (4) The Article 6 CA overlay uses the real corresponding-adjustment logic (shared with `article6-markets`). (5) Pin the cash-flow and price-band math in bench_quant — a structuring engine driving real contracts deserves a golden case.

**Prerequisites.** Delivery-shortfall and buffer-cancellation datasets for calibration; backend extraction; the illustrative book becomes real user contracts. **Acceptance:** haircuts reflect calibrated delivery risk with the data basis published; buffer reversal rates come from registry history; a bench case pins the cash-flow, price-band, and expected-loss math; Article 6 overlays use the real CA logic.

### 9.2 Evolution B — Offtake-structuring copilot (LLM tier 2)

**What.** Carbon buyers and project developers ask "structure a 10-year fixed-price offtake for this REDD+ project with a 15% buffer", "what's the delivery-risk-adjusted volume over the ramp?", "compare prepay vs streaming economics", "how does Article 6 authorization change the price?" — the copilot runs the Evolution-A structuring engine, reports contracted vs expected-delivered volumes, cash flows, price bands, and buffer economics, every figure tool-traced.

**How.** Tool schemas over the Evolution-A structuring route (contract terms → cash flows, haircuts, buffer, price bands); mutating actions (saving a structured contract) gated behind confirmation. Grounding corpus: this Atlas record — the `STAGE_HAIRCUTS`/`BUFFER_DEFAULTS` rationale fields are the copilot's explanation source for *why* a stage carries its haircut. The honesty duty: delivery risk and reversal are the core offtake risks, so the copilot always distinguishes contracted from expected-delivered volume and reports buffer-net-to-buyer explicitly — a forestry offtake's headline tonnage overstates deliverable credits, and the copilot must surface that. Term sheets compose into the report layer.

**Prerequisites (hard).** Evolution A's backend extraction and calibration — a copilot quoting offtake economics off uncalibrated haircuts would misprice delivery risk in real contracts. **Acceptance:** every volume, cash flow, and price band traces to a tool response; contracted vs expected-delivered is always distinguished; buffer-net volumes are reported; Article 6 price effects cite the CA logic.