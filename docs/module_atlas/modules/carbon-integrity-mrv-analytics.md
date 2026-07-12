# Carbon Credit MRV Analytics
**Module ID:** `carbon-integrity-mrv-analytics` · **Route:** `/carbon-integrity-mrv-analytics` · **Tier:** A (backend vertical) · **EP code:** EP-EB1 · **Sprint:** EB

## 1 · Overview
Carbon credit MRV (Monitoring, Reporting, Verification) analytics covering Verra VCS, Gold Standard, and ACR methodology compliance scoring, additionality assessment, permanence risk quantification, and buffer pool requirements.

> **Business value:** Provides rigorous MRV quality scoring and additionality assessment for voluntary carbon credits, enabling buyers to distinguish high-integrity credits and sellers to identify compliance gaps.

**How an analyst works this module:**
- Input project type, methodology, monitoring plan, and verification body qualifications
- Score monitoring plan against methodology-specific requirements (frequency, equipment, sampling)
- Assess additionality using regulatory, financial barrier, and common practice tests
- Calculate permanence risk, buffer pool contribution, and net credits available for issuance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `A64_METHODOLOGIES`, `BUFFER_DEFAULTS`, `CORRELATION_MATRIX`, `FORWARD_CURVE`, `ICVCM_CCP`, `Kpi`, `MRV_STACK`, `PROJECT_PORTFOLIO`, `RATINGS_AGENCIES`, `Section`, `Tab`, `VCMI_TIERS`, `VINTAGE_DURABILITY`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ICVCM_CCP` | 11 | `principle`, `category`, `weight`, `description`, `benchmark` |
| `VCMI_TIERS` | 4 | `requirements`, `creditQuality`, `discount` |
| `RATINGS_AGENCIES` | 6 | `coverage`, `scale`, `specialty`, `pricingBps`, `methodology`, `founded` |
| `PROJECT_PORTFOLIO` | 9 | `name`, `type`, `methodology`, `vintage`, `volumeKtCO2`, `pricePerT`, `sylvera`, `bezero`, `calyx`, `ccpLabel`, `corsiaEligible`, `jcmLinked`, `a6Mode`, `buffer`, `region`, `scopeOfClaim` |
| `A64_METHODOLOGIES` | 8 | `title`, `type`, `category`, `approvedDate`, `crediting`, `baseline`, `pipelineMt` |
| `MRV_STACK` | 6 | `example`, `frequency`, `cost`, `accuracy` |
| `VINTAGE_DURABILITY` | 5 | `vintage2019`, `vintage2022`, `vintage2024`, `vintage2026`, `icvcmPct` |
| `FORWARD_CURVE` | 9 | `eua`, `eua_iv`, `ccert`, `ccert_iv`, `vcs`, `vcs_iv`, `a64er`, `a64er_iv` |
| `CORRELATION_MATRIX` | 7 | `EUA`, `CCert`, `JCM_ITMO`, `VCS`, `A64ER`, `JGX`, `Brent`, `Elec` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `weighted` | `ICVCM_CCP.reduce((acc, p, i) => acc + (scores[i] \|\| 0) * p.weight, 0);` |
| `maxWeight` | `ICVCM_CCP.reduce((a, p) => a + p.weight * 100, 0);` |
| `composite` | `(sy * 0.4 + bz * 0.4 + cx * 0.2);` |
| `calcBufferAdjustedVolume` | `(vol, bufferPct) => vol * (1 - bufferPct/100);` |
| `yearPrice` | `basePrice * (1 + 0.05*(y-1)) * (1 + norm(0, priceVol/100));` |
| `mcResults` | `useMemo(() => calcMonteCarloNpv({ annVolume:mcVolume, basePrice:mcBasePrice, priceVol:mcVol, creditYears:mcYears, discRate:mcDisc }), [mcVolume, mcBasePrice, mcVol, mcYears, mcDisc]); const bufferNetVol = calcBufferAdjustedVolume(proj.volumeKtCO2*1000, bufferPct);` |
| `portfolioStats` | `useMemo(() => { const totalVol = PROJECT_PORTFOLIO.reduce((a,p,i) => a + p.volumeKtCO2 * portfolioWeights[i]/100, 0);` |
| `wAvgPrice` | `PROJECT_PORTFOLIO.reduce((a,p,i) => a + p.pricePerT * p.volumeKtCO2 * portfolioWeights[i]/100, 0) / totalVol;` |
| `ccpPct` | `PROJECT_PORTFOLIO.reduce((a,p,i) => a + (p.ccpLabel?portfolioWeights[i]:0), 0);` |
| `corsiaPct` | `PROJECT_PORTFOLIO.reduce((a,p,i) => a + (p.corsiaEligible?portfolioWeights[i]:0), 0);` |
| `durablePct` | `PROJECT_PORTFOLIO.reduce((a,p,i) => a + (p.type.includes('Durable')?portfolioWeights[i]:0), 0);` |
| `avgBuffer` | `PROJECT_PORTFOLIO.reduce((a,p,i) => a + p.buffer * portfolioWeights[i]/100, 0);` |

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
**Frontend seed datasets:** `A64_METHODOLOGIES`, `CORRELATION_MATRIX`, `FORWARD_CURVE`, `ICVCM_CCP`, `MRV_STACK`, `PROJECT_PORTFOLIO`, `RATINGS_AGENCIES`, `VCMI_TIERS`, `VINTAGE_DURABILITY`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| MRV Compliance Score | `0.3×Monitoring + 0.3×Reporting + 0.25×Verification + 0.15×Additionality` | Verra VCS audit report | Scores above 80 qualify for premium registry listing; 65-80 standard; below 65 remediation required before registration |
| Additionality Score | `Performance test + barrier analysis + common practice assessment` | VCS CDM additionality tool | Regulatory additionality (score >85), financial additionality (IRR without credits < hurdle), common practice (<5% sector penetration) |
| Buffer Pool Contribution | `Permanence risk score × total estimated credits` | Verra AFOLU pooled buffer account | Reversal buffer protects buyers; higher risk projects (REDD+) contribute 10-20%; permanence projects <5% |
- **Project design document (PDD)** → Baseline scenario, monitoring plan, additionality arguments → MRV scoring inputs → **Compliance gap analysis**
- **Third-party verification report (VVB)** → Independent verification findings → verification sub-score → **MRV overall score**
- **Verra/Gold Standard registry database** → Historical buffer contributions and reversal events → permanence risk calibration → **Buffer pool requirement**

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
**Methodology:** MRV Compliance Scoring
**Headline formula:** `MRV Score = 0.3×Monitoring + 0.3×Reporting + 0.25×Verification + 0.15×Additionality; Buffer Contribution = Permanence Risk × Total Credits`

Multi-dimensional MRV quality score combining monitoring plan rigour, reporting completeness, third-party verification quality, and additionality demonstration strength

**Standards:** ['Verra VCS Standard v4.0', 'Gold Standard for the Global Goals v3.0', 'American Carbon Registry Standard v15']
**Reference documents:** Verra (2022) VCS Standard v4.0 and AFOLU Requirements; Gold Standard (2022) Gold Standard for the Global Goals Principles and Requirements; American Carbon Registry (2023) ACR Standard v15; ICROA (2023) Code of Best Practice for Voluntary Carbon Markets

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
| `carbon-institutions-taxonomy` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-footprint-intelligence` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-reduction-projects` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-aware-allocation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-forward-curve` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-project-lifecycle` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-removal-markets` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-adjusted-valuation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-capture-finance` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-EB1) claims an *MRV compliance
> scoring* engine — `MRV Score = 0.3×Monitoring + 0.3×Reporting + 0.25×Verification +
> 0.15×Additionality` with Verra/GS/ACR methodology compliance inputs. **That formula does not
> appear anywhere in the code.** The page actually implements a broader and different toolkit:
> an interactive **ICVCM CCP weighted scorer** (10 principles, user sliders), a **three-agency
> composite rating** (Sylvera/BeZero/Calyx), **vintage discounting**, **buffer-adjusted volume**,
> a **Monte Carlo credit-revenue NPV** engine, portfolio quality aggregation, plus reference
> tables (VCMI tiers, A6.4 methodologies, MRV technology stack, forward curve with implied vol,
> correlation matrix). Sections below document the code as written.

### 7.1 What the module computes

```
ICVCM score      = Σᵢ scoreᵢ·weightᵢ / Σᵢ 100·weightᵢ × 100        // 10 sliders, default = benchmark
Composite rating = 0.4·num(Sylvera) + 0.4·num(BeZero) + 0.2·num(Calyx)
                   num: AAA=7 AA=6 A=5 BBB=4 BB=3 B=2 C=1 D=0; Calyx A=5 B=3.5 C=2 D=1 E=0
                   ≥5.5 'Investment Grade' · ≥3.5 'Acceptable' · ≥2 'Marginal' · else 'Avoid'
VintageDiscount  = ≤2019: 45% · ≤2022: 30% · ≤2024: 12% · newer: 0%
BufferNetVolume  = volume × (1 − buffer%/100)
MC NPV (1,000 sims): yearPrice_y = P₀·(1 + 0.05(y−1))·(1 + N(0, σ)) ;
                   PV = Σ_y volume·max(0,yearPrice_y)/(1+r)^y  → report P10/P50/P90/mean
Portfolio        : volume-weighted price; CCP/CORSIA/durable % by user weights; avg buffer
```

`N(0,σ)` is an Irwin–Hall sum-of-12-uniforms normal approximation using **`Math.random()`**
(non-seeded — MC results change every render), unlike the seeded `sr()` used for the MRV
satellite time series.

### 7.2 Parameterisation

| Block | Values | Provenance |
|---|---|---|
| ICVCM CCP weights | Gov: 10/8/8/9 · Impact: 12/10/12/10 · SD: 8/13 (sum 100) | **Synthetic** — ICVCM publishes 10 CCPs but no numeric weights; benchmarks 70–90 also synthetic |
| VCMI tiers | Silver/Gold/Platinum with `discount` 0/15/30 | Tier names & claim ladder real (VCMI Claims Code); the % "discount" is a module invention |
| Ratings agencies table | Sylvera 6,200 proj · BeZero 4,800 · Calyx 3,200 · Renoster · "S&P TruCost VCM" | Coverage counts and `pricingBps` are illustrative; agencies real (S&P entry speculative) |
| `PROJECT_PORTFOLIO` 9 rows | India-focused book: NTPC solar 1.2 MtCO₂e @$18 … Hyderabad DAC 10 kt @$580 | Synthetic but internally consistent (durable CDR priced 30–60× avoidance) |
| Vintage discounts 45/30/12/0% | — | Synthetic; directionally matches observed older-vintage discounts |
| `VINTAGE_DURABILITY` price matrix | <100yr NbS $3→$12; durable CDR $180→$480 across vintages | Synthetic; ordering consistent with CDR.fyi / Ecosystem Marketplace patterns |
| `BUFFER_DEFAULTS` | ARR tropical 18%, REDD project 25%, mangrove 30%, DAC 1% | Mirrors Verra AFOLU risk-tool magnitudes (10–40% NbS; minimal engineered) |
| MC defaults | vol 500k t/yr, P₀ $18, σ 35%, 7 yrs, disc 10%, +5%/yr drift | Synthetic demo values |
| Forward curve + IV | EUA spot 72 (IV 28%) → 10Y 125 (38%); VCS 9 (62%) | Static seeds; IV levels plausible vs EUA options history |

### 7.3 Calculation walkthrough

1. **CCP tab** — sliders (default = per-principle benchmark) → weighted score; with defaults the
   score is Σ(benchmark·w)/100 = 7,974/10,000 → **79.7/100**.
2. **Ratings tab** — per selected project, composite = 0.4/0.4/0.2 blend → label.
3. **Vintage/Buffer** — user buffer slider recomputes net sellable volume; vintage discount
   applied to displayed price.
4. **Monte Carlo** — 1,000 paths of 7-year revenue; sorted PV array indexed at 10/50/90th
   percentiles, reported in $M.
5. **Portfolio** — weight sliders (init 1/9 each) → weighted volume, price, CCP%, CORSIA%,
   durable%, avg buffer.

### 7.4 Worked example (composite rating + buffer, project IND-MNG-004)

Sundarbans Mangrove: `sylvera:'BBB', bezero:'BBB', calyx:'B', volume 180 ktCO₂e, buffer 35%`:

| Step | Computation | Result |
|---|---|---|
| Sylvera num | BBB → 4 | 4 |
| BeZero num | BBB → 4 | 4 |
| Calyx num | B → 3.5 | 3.5 |
| Composite | 0.4·4 + 0.4·4 + 0.2·3.5 | **3.90 → "Acceptable"** |
| Vintage discount | vintage 2024 → ≤2024 bucket | **12%** |
| Buffer-adjusted volume (portfolio default slider 20%) | 180,000 × (1−0.20) | **144,000 t** |
| At project's own 35% buffer | 180,000 × 0.65 | **117,000 t sellable** |

### 7.5 Data provenance & limitations

- Project book, prices, ratings, CCP benchmarks and the MRV satellite series are **synthetic**
  (the time series uses `sr(seed)=frac(sin(seed+1)×10⁴)`); the MC engine additionally uses
  non-seeded `Math.random()`, so NPV percentiles are non-reproducible run to run.
- The MC price process is arithmetic drift + i.i.d. normal shocks (can go negative before the
  `max(0,·)` floor; no mean reversion, no vol term structure) — adequate for illustration, not
  for pricing.
- ICVCM weights/VCMI discounts are inventions the UI presents with real framework names — the
  main integrity risk of this module.
- No backend integration despite mapped `carbon_calculator.py`/`methodology_engine.py`.

**Framework alignment:** ICVCM Core Carbon Principles — real assessment operates at *program*
level (CCP-Eligible) and *methodology category* level (CCP-Approved) through the ICVCM Expert
Panel, yielding a binary label, not a weighted 0–100 score · VCMI Claims Code — Silver/Gold/
Platinum claims scale with the share of remaining emissions retired in CCP-labelled credits
(module's tier table paraphrases this correctly; its numeric "discount" is invented) · Sylvera/
BeZero/Calyx rating scales rendered faithfully · Verra VCS AFOLU buffer mechanics (pooled buffer
account) reflected in `calcBufferAdjustedVolume` · Article 6.4 (PACM) methodology pipeline table
is a plausible forward-looking fiction (real A6.4 methodologies were still emerging as of 2025).

## 8 · Model Specification — Credit Portfolio Valuation under Integrity Risk

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** A production replacement for the MC NPV: value a carbon-credit
portfolio with integrity-linked haircuts (reversal, invalidation, rating migration) — the
quantity a treasury or procurement desk needs before committing offtake capital.

**8.2 Conceptual approach.** Risk-adjusted DCF with three stochastic layers, benchmarking
(i) Sylvera/BeZero rating-conditional delivery-risk practice, (ii) cat-model-style reversal
frequency–severity for NbS (Verra buffer logic made explicit), and (iii) commodity-desk OU price
dynamics as used for EUA curves in bank XVA/commodity models (Marquee/BarraOne style).

**8.3 Mathematical specification.**

```
Price      : dlnP = κ(ln P̄_t − lnP)dt + σ dW,  P̄_t = scenario ridge (NGFS or VCM analyst curve)
Delivery   : Q_y^eff = Q_y · d(rating) · (1 − L_reversal,y),  d(AAA…C) ∈ {0.98,0.95,0.90,0.80,0.65,0.50,0.30}
Reversal   : L_y ~ Bernoulli(p_type)·Sev,  p_type from buffer calibration: p ≈ buffer%/D_horizon
Invalidation: one-shot prob q_meth (methodology re-baselining, e.g. REDD+ VM0048 transition)
NPV        = E[ Σ_y (P_y·Q_y^eff − c_MRV·Q_y) / (1+r)^y ] − q_meth·PV(book)
Report     : P5/P50/P95, CVaR₉₅ of NPV; integrity-adjusted breakeven price
```

| Parameter | Calibration source |
|---|---|
| κ, σ per credit class | MLE on Platts/Viridios CORSIA & N-GEO price histories; EUA via ICE settlements |
| p_type, Sev | Verra buffer pool draw history (public registry documents); wildfire reversal literature |
| d(rating) delivery factors | Calibrate to BeZero rating vs issuance-shortfall studies; conservative defaults above |
| q_meth | Registry methodology-revision event frequency (Verra/GS public notices) |
| c_MRV | Module's own MRV_STACK cost tiers ($0.05–0.35/credit total) as starting point |

**8.4 Data requirements.** Portfolio positions (already the module's `PROJECT_PORTFOLIO` schema:
volume, price, ratings, buffer, vintage, type), price histories (vendor: Platts/Xpansiv;
free proxy: Ecosystem Marketplace annual medians — already among the platform's seed files),
registry buffer events. Backend home: extend `carbon_credit_quality_engine.py`.

**8.5 Validation & benchmarking.** Backtest delivery factors on 2019–2024 issuance vs forecast
for a public Verra cohort; MC convergence (P50 stable to <1% at 10k paths, seeded RNG);
reconcile P50 NPV against deterministic DCF with expected-value inputs; challenge pricing vs
observed CCP-labelled premium (~30–40% per Ecosystem Marketplace 2024).

**8.6 Limitations & model risk.** VCM price history is short and structurally broken (2022–23
integrity repricing) — regime-weight recent data; reversal probabilities for engineered CDR are
essentially priors; rating agencies disagree materially (use worst-of-two for conservatism);
correlation between price and invalidation events (both driven by integrity news) should be
stressed jointly, not independently.

## 9 · Future Evolution

### 9.1 Evolution A — Real MRV scoring and rating-agency data behind the composite (analytics ladder: rung 2 → 3)

**What.** The page has genuinely good structure: a weighted ICVCM CCP composite (`weighted = Σ score_i × weight_i` over 11 principles with real weights), a rating-agency composite (`sy×0.4 + bz×0.4 + cx×0.2` — Sylvera/BeZero/Calyx), buffer-adjusted volume, VCMI tiers, Article 6.4 methodologies (`A64_METHODOLOGIES`), and a Monte Carlo NPV (`calcMonteCarloNpv` with a real `norm(0, priceVol)` draw). But the `PROJECT_PORTFOLIO` (9 projects), the individual sy/bz/cx ratings, and the CCP scores are seeded, and the registered backend is the generic `carbon.py` suite. Evolution A grounds the ratings and MRV assessment.

**How.** (1) The CCP scoring becomes a real assessment: score a project's monitoring plan against methodology-specific MRV requirements (frequency, equipment, sampling — the `MRV_STACK` structure) rather than a slider, producing the additionality/permanence/buffer outputs the overview promises. (2) Rating-agency scores from real Sylvera/BeZero/Calyx data where licensable, or explicitly proxied — the composite must not blend fabricated agency scores. (3) Buffer-pool requirements from the actual registry buffer rules (`BUFFER_DEFAULTS` becomes the real VCS/GS non-permanence buffer schedule by project type). (4) Article 6.4 methodologies from the actual A6.4 Supervisory Body approvals. (5) Rung 3: the composite calibrated so its weights track observed price/quality relationships; the Monte Carlo (already genuine) gains real price-vol inputs. Coordinate with `carbon-institutions-taxonomy` (overlapping VCM-quality domain) on shared rating data.

**Prerequisites.** Rating-agency data licensing; registry buffer-rule tables; A6.4 SB approval list; the MRV requirement rubric per methodology. **Acceptance:** CCP scores derive from a real MRV assessment, not sliders; agency ratings are real or explicitly proxied; buffer requirements match registry rules; net issuable volume reflects the real buffer deduction.

### 9.2 Evolution B — MRV-integrity assessment copilot (LLM tier 2)

**What.** Buyers screening credit quality and sellers finding compliance gaps ask "assess this REDD+ project's MRV quality and additionality", "what buffer contribution does VCS require here?", "does this credit meet ICVCM CCP benchmarks?" — the copilot runs the Evolution-A MRV/CCP/buffer tools, reports the weighted integrity score with its factor breakdown, and identifies specific compliance gaps, every score tool-traced.

**How.** Tool schemas over the Evolution-A MRV/quality/buffer routes; grounding corpus is this Atlas record plus the ICVCM CCP / VCMI / VCS-GS-ACR methodology references. The copilot's honesty duty mirrors the sibling VCM modules: permanence is reported honestly by durability class (`VINTAGE_DURABILITY` — a 2019 forestry credit differs from a durable-removal credit), additionality is assessed not asserted, and agency ratings are attributed to their provider. The Monte Carlo NPV supports "what's the risk-adjusted value of this offtake?" with distributional output. Compliance-gap reports (for sellers) and integrity screens (for buyers) compose into the report layer.

**Prerequisites (hard).** Evolution A's real MRV assessment and ratings — a copilot scoring integrity from sliders and seeded agency ratings would drive real procurement on fabricated quality. **Acceptance:** every integrity score, buffer requirement, and additionality verdict traces to a tool response; permanence is reported by durability class; agency ratings are provider-attributed; NPV answers cite the Monte Carlo distribution.