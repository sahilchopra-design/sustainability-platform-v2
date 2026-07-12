# Carbon Storage Geology
**Module ID:** `carbon-storage-geology` · **Route:** `/carbon-storage-geology` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `SECONDS_PER_YEAR`, `SITES`, `WEIGHTS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SITES` | 9 | `name`, `type`, `areaKm2`, `thicknessM`, `porosity`, `effFactor`, `permMd`, `sealRisk`, `faultRisk`, `wellRisk`, `seismicRisk` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `mdToM2` | `mD => mD * 9.869e-16; // 1 millidarcy ≈ 9.869e-16 m²` |
| `areaM2` | `site.areaKm2 * 1e6;` |
| `capacityKg` | `areaM2 * site.thicknessM * site.porosity * rhoCO2 * site.effFactor;` |
| `dPPa` | `dPMPa * 1e6;` |
| `numerator` | `2 * Math.PI * kM2 * site.thicknessM * dPPa;` |
| `denominator` | `muPaS * Math.log(reRwRatio);` |
| `rateM3PerS` | `denominator > 0 ? numerator / denominator : 0;` |
| `rateKgPerYr` | `rateM3PerS * rhoCO2 * SECONDS_PER_YEAR;` |
| `rows` | `useMemo(() => SITES.map(site => {` |
| `creditedVolumeMt` | `capacityMt * permanence;` |
| `totalCapacityGt` | `rows.reduce((s, x) => s + x.capacityMt, 0) / 1000;` |
| `totalCreditedGt` | `rows.reduce((s, x) => s + x.creditedVolumeMt, 0) / 1000;` |
| `avgRisk` | `rows.length ? rows.reduce((s, x) => s + x.riskScore, 0) / rows.length : 0;` |
| `avgInjection` | `rows.length ? rows.reduce((s, x) => s + x.injectionMtpa, 0) / rows.length : 0;` |

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
**Frontend seed datasets:** `SITES`

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

> ⚠️ **No implementation found.** This route (`/carbon-storage-geology`, "Carbon Storage Geology") has
> **no source files, no page component, no computed values, no seed data, and no MODULE_GUIDES entry** in
> the assignment record (`source_files: []`, `computed: []`, `seed_schemas: []`, `guide: null`). The only
> attached artefacts are the generic shared carbon backend engines (`carbon_calculator.py`,
> `methodology_engine.py`) and the shared `/api/v1/carbon/*` routes, which are the platform-wide carbon
> methodology endpoints — not a geological-storage implementation. There is therefore no module-specific
> methodology to document. The sections below record what *would* be expected and specify the model the
> route should host.

### 7.1 What the module computes

Nothing at present. The route resolves to no page-level computation. Any geological-CO₂-storage analytics
(reservoir capacity, injectivity, containment/permanence, monitoring) are **not implemented**.

### 7.2 Parameterisation / provenance

None in code. Expected geological-storage parameters (porosity, permeability, storage efficiency, seal
integrity, injection rate) are absent.

### 7.3–7.4 Calculation walkthrough & worked example

Not applicable — there is no code path to trace and no numeric example to compute faithfully. Any figure
presented under this route today would not originate from a module-specific model.

### 7.5 Data provenance & limitations

- **The module is a route stub only.** No synthetic (`sr()`) data, no real data, no calculation.
- The shared `/api/v1/carbon/*` endpoints it nominally links to serve emission-factor and methodology
  reference data, which is unrelated to geological storage capacity or containment risk.

**Framework alignment:** None implemented. The relevant standards for a geological-storage module — IPCC
Special Report on CCS, US EPA Class VI well requirements, EU CCS Directive 2009/31/EC, ISO 27914 (geological
storage), and DOE/USGS storage-capacity methodologies — are not referenced in any shipped code for this
route.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The route has no implementation; this specifies the
geological-CO₂-storage model it should host.

### 8.1 Purpose & scope
Assess geological CO₂ storage sites for capacity, injectivity, and containment/permanence risk across saline
aquifers, depleted oil/gas fields, and basalt formations — supporting CCS/BECCS/DAC storage siting and
permanence assurance for CDR credit quality.

### 8.2 Conceptual approach
Volumetric storage-capacity estimation plus a containment-risk score, benchmarked against the US DOE/NETL
CO₂ storage resource methodology, USGS assessment methodology, and IEAGHG containment-risk frameworks.
Capacity uses the standard efficiency-factor volumetric equation; containment combines seal integrity,
fault/well leakage, and induced-seismicity risk.

### 8.3 Mathematical specification

```
StorageCapacity = A · h · φ · ρ_CO2 · E                       DOE volumetric method
   A = area, h = net thickness, φ = porosity,
   ρ_CO2 = CO2 density at reservoir P,T, E = storage efficiency factor
InjectionRate   = (2π k h ΔP) / (μ ln(r_e/r_w))               Darcy radial flow
ContainmentRisk = w1·SealScore + w2·FaultLeak + w3·WellLeak + w4·SeismicRisk
PermanenceFactor= 1 − P(leakage over 1,000yr)                  from containment model
CreditedVolume  = StorageCapacity × PermanenceFactor
```

| Parameter | Symbol | Source |
|---|---|---|
| Storage efficiency | E | DOE/NETL (saline 0.5–5%, depleted field higher) |
| Porosity/permeability | φ, k | site core/log data |
| CO₂ density | ρ_CO2 | reservoir P–T equation of state |
| Seal/fault/well/seismic | — | site characterisation, EPA Class VI |

### 8.4 Data requirements
Reservoir geometry (area, thickness), petrophysics (porosity, permeability), reservoir P–T, seal and fault
mapping, legacy-well inventory, seismic-hazard data. None currently in the platform for this route; the
generic carbon endpoints do not provide geological data.

### 8.5 Validation & benchmarking plan
Reconcile capacity estimates against DOE Carbon Storage Atlas figures for analogue formations. Validate
injectivity against site pilot-injection data. Benchmark containment-risk scoring against IEAGHG/EPA Class VI
permitting outcomes. Sensitivity of credited volume to the efficiency factor and permanence assumption.

### 8.6 Limitations & model risk
Storage-efficiency factor spans an order of magnitude (0.5–5% for saline aquifers) — the dominant capacity
uncertainty; present ranges. Containment risk is site-specific and data-hungry; a conservative fallback caps
permanence and flags sites lacking seal characterisation. Induced seismicity from injection is a material
operational and reputational risk that must gate creditable volume.

## 9 · Future Evolution

### 9.1 Evolution A — Real storage-site data behind the genuine reservoir physics (analytics ladder: rung 2 → 3)

**What.** This is one of the platform's most physically rigorous pages: it computes CO₂ storage capacity from real volumetric reservoir physics (`capacityKg = area × thickness × porosity × ρCO₂ × effFactor`) and injection rate from the radial-flow (Darcy) equation (`rate = 2π·k·h·ΔP / (μ·ln(re/rw))`), with a correct millidarcy-to-m² conversion and a permanence-discounted credited volume (`creditedVolumeMt = capacityMt × permanence`). The physics is genuine (rung 2 — it's a real deterministic engineering model). The gap: the 9 `SITES` (area, thickness, porosity, permeability, seal/fault/well/seismic risk) are curated demo values, and the registered backend is the generic `carbon.py` suite. Evolution A grounds the site data and calibrates the risk scoring.

**How.** (1) Real storage-site parameters from public CCS-atlas data (the US NATCARB/CO2 storage atlases, the EU GeoCapacity/CO2StoP databases, and named operating sites like Sleipner/Northern Lights publish reservoir properties) with sources, replacing the curated `SITES`. (2) The composite risk score (`WEIGHTS` over seal/fault/well/seismic) calibrated against real CCS-site risk assessments rather than authorial weights. (3) Extract the reservoir-physics engine to a backend route (`POST /api/v1/carbon-storage/capacity`) so it's testable and reusable — it's pure, correct physics that deserves a bench_quant pin. (4) Rung 3: capacity and injection-rate outputs validated against published site estimates (Sleipner's actual injection history is a real benchmark). (5) The permanence factor grounded in reservoir-integrity assessment rather than a single input.

**Prerequisites.** CCS-atlas data ingestion (NATCARB/CO2StoP are public); a risk-weight calibration reference; backend extraction. **Acceptance:** site parameters carry sources; the composite risk weights are calibrated with published basis; a bench case pins the volumetric-capacity and Darcy-rate math; capacity estimates validate against a published site (e.g. Sleipner).

### 9.2 Evolution B — CCS storage-screening copilot (LLM tier 2)

**What.** CCS developers and CDR buyers (who need durable geological storage) ask "what's the storage capacity of this saline aquifer?", "what injection rate can this reservoir sustain?", "rank these sites by storage risk", "how much credited volume after permanence discount?" — the copilot runs the Evolution-A reservoir-physics engine per site, reporting capacity, injection rate, risk score, and credited volume, every figure tool-traced to the physical model.

**How.** Tool schemas over the Evolution-A capacity/rate/risk routes; grounding corpus is this Atlas record — the volumetric and Darcy formulas in §2 are the copilot's explanation source, so it can answer "why does higher permeability raise injection rate?" from the actual physics. The honesty duty: storage capacity and injection rate are engineering estimates dependent on reservoir parameters with real uncertainty, so the copilot states the input parameters and their source per estimate, and reports the seal/fault/seismic risk factors explicitly — storage permanence (no leakage) is what makes geological storage the gold standard for durable CDR, and the risk assessment is central to that claim. Site-screening reports compose into the report layer.

**Prerequisites.** Evolution A's backend extraction and real site data — a copilot quoting storage capacity off curated demo sites would misinform site selection. **Acceptance:** every capacity, rate, and risk figure traces to the physics engine; estimates state their reservoir-parameter inputs and sources; risk factors are reported explicitly; permanence-discounted credited volume is distinguished from gross capacity.