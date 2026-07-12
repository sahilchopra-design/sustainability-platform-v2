# Carbon Market Intelligence
**Module ID:** `carbon-market-intelligence` · **Route:** `/carbon-market-intelligence` · **Tier:** A (backend vertical) · **EP code:** EP-CN6 · **Sprint:** CN

## 1 · Overview
$950B compliance + $1.7B voluntary carbon market analytics with 8 compliance markets, policy tracker, and 3 forecast models.

**How an analyst works this module:**
- Market Overview shows compliance vs voluntary split
- Regional Deep-Dive covers 8 compliance markets
- Price Forecast Models show 3 projection approaches

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BILATERAL_DEALS`, `Badge`, `COMPLIANCE_MARKETS`, `CORRELATION_MATRIX`, `EXCHANGES`, `KpiCard`, `METHODOLOGY_ISSUANCE`, `PALETTE`, `POLICY_EVENTS`, `REGIONAL_MARKETS`, `TABS`, `VCM_HISTORY`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COMPLIANCE_MARKETS` | 13 | `region`, `price`, `unit`, `volume`, `coverage`, `cap`, `surplus`, `mechanism`, `linked`, `trend`, `yr2030cap`, `vintage` |
| `VCM_HISTORY` | 11 | `issuance`, `retirements`, `cancellations`, `forestry`, `energy`, `industry`, `waste`, `agriculture`, `avgPrice` |
| `POLICY_EVENTS` | 16 | `date`, `region`, `type`, `price_impact_pct`, `description` |
| `BILATERAL_DEALS` | 21 | `seller`, `sector`, `itmo_volume`, `price_usd`, `ca_applied`, `status`, `year` |
| `EXCHANGES` | 7 | `daily_volume`, `market_share`, `methodology_focus`, `avg_spread`, `otc_pct`, `founded` |
| `REGIONAL_MARKETS` | 11 | `pipeline_mtco2`, `policy_score`, `mrv_score`, `finance_score`, `registry_score`, `demand_score`, `compliance_link`, `vcm_link` |
| `METHODOLOGY_ISSUANCE` | 13 | `y2019`, `y2020`, `y2021`, `y2022`, `y2023`, `y2024` |
| `CORRELATION_MATRIX` | 9 | `corr` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalComplianceCap` | `useMemo(() => COMPLIANCE_MARKETS.reduce((a, m) => a + m.volume, 0), []);` |
| `totalVCMIssuance` | `useMemo(() => VCM_HISTORY.reduce((a, r) => a + r.issuance, 0), []);` |
| `totalRetirements` | `useMemo(() => VCM_HISTORY.reduce((a, r) => a + r.retirements, 0), []);` |
| `art6Volume` | `useMemo(() => BILATERAL_DEALS.reduce((a, d) => a + d.itmo_volume, 0), []);` |
| `avgCreditPrice` | `useMemo(() => { const sum = VCM_HISTORY.reduce((a, r) => a + r.avgPrice, 0);` |
| `retirementRate` | `useMemo(() => { const tot = VCM_HISTORY.reduce((a, r) => a + r.issuance, 0);` |
| `ret` | `VCM_HISTORY.reduce((a, r) => a + r.retirements, 0);` |
| `vcmBuyerSegments` | `useMemo(() => [ { name:'Corporates',    value:52 }, { name:'Airlines',      value:14 }, { name:'Finance',       value:18 }, { name:'Governments',   value:8  }, { name:'Retail/Other',  value:8  }, ], []);` |
| `taxMult` | `1 + (carbonTax - 80) / 800;` |
| `ndcMult` | `1 + (ndcAmbition - 50) / 200;` |
| `itmoPriceScatter` | `useMemo(() => { return BILATERAL_DEALS.map((d, i) => ({ itmoPrice: d.price_usd, vcmPrice:  +(5 + sr(i * 13) * 12).toFixed(1), volume:    d.itmo_volume, country:   `${d.buyer}→${d.seller}`, }));` |
| `marketTrendData` | `useMemo(() => VCM_HISTORY.map(r => ({` |
| `surplusData` | `useMemo(() => COMPLIANCE_MARKETS.map(m => ({` |
| `methodData` | `useMemo(() => METHODOLOGY_ISSUANCE.map(m => ({` |
| `demandForecast` | `useMemo(() => [ { year:2024, supply:168,  demand:152,  gap:-16,  demandFcast:165 }, { year:2025, supply:185,  demand:190,  gap:5,    demandFcast:210 }, { year:2026, supply:200,  demand:240,  gap:40,   demandFcast:270 }, { year:2027, supply:220,  demand:310,  gap:90,   demandFcast:350 }, { year:2028, supply:240,  demand:400,  gap:160,  dem` |

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
**Frontend seed datasets:** `BILATERAL_DEALS`, `COMPLIANCE_MARKETS`, `CORRELATION_MATRIX`, `EXCHANGES`, `METHODOLOGY_ISSUANCE`, `PALETTE`, `POLICY_EVENTS`, `REGIONAL_MARKETS`, `TABS`, `VCM_HISTORY`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Compliance Market Value | — | ICAP | Dominated by EU ETS |
| VCM Value | — | Ecosystem Marketplace | Voluntary carbon market |
| Markets Tracked | — | ICAP | EU, UK, CA, RGGI, China, Korea, NZ, emerging |

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
**Methodology:** Carbon price forecasting
**Headline formula:** `Models: mean-reversion OU, trend-following ARIMA, scenario-conditional NGFS`

EU ETS dominates compliance markets. VCM: issuance/retirement ratio indicates oversupply (>1.0) or tightening (<1.0). Three forecast models provide range of price projections.

**Standards:** ['ICAP', 'World Bank Carbon Pricing Dashboard']
**Reference documents:** ICAP ETS Map; World Bank Carbon Pricing Dashboard; Ecosystem Marketplace VCM Report

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
| `carbon-integrity-mrv-analytics` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
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

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-CN6) claims three price-forecast
> models: "mean-reversion OU, trend-following ARIMA, scenario-conditional NGFS". **None of these
> is implemented.** All three "models" are straight lines in the year index with different slopes
> (plus one seeded-noise term); the UI even prints "O-U process, θ=0.42, μ=90" in a methods
> column although no Ornstein–Uhlenbeck dynamics, no ARIMA estimation and no NGFS data exist in
> the code. The rest of the guide (compliance vs voluntary split, 8+ markets, policy tracker) is
> broadly accurate. Sections below document the actual computations; §8 specifies the promised
> forecasting models.

### 7.1 What the module computes

**Forecast engine** (2024–2030, reactive to three user controls — scenario, carbon-tax slider,
NDC-ambition slider):

```
scenarioMult = {1.5C:1.35, 2C:1.15, NDC:1.00, BAU:0.78}
taxMult      = 1 + (carbonTax − 80)/800          // ±12.5% per ±$100
ndcMult      = 1 + (ndcAmbition − 50)/200        // ±25% at slider extremes
sm           = scenarioMult × taxMult × ndcMult
meanReversion_i      = 65 + i·4.2·sm + (sr(i·7) − 0.5)·4
trendFollowing_i     = 65 + i·7.8·sm
scenarioConditional_i= 65 + i·11·sm − max(0, year−2027)·2.5
bull = sc·1.2 ;  bear = mr·0.78
```

**Market aggregates:** `totalComplianceCap = Σ volume` over 12 compliance markets;
`retirementRate = Σretirements/Σissuance` over `VCM_HISTORY` (2015–2024); average credit price;
Article 6 volume `Σ itmo_volume` over `BILATERAL_DEALS`. **Supply/demand forecast** is a
hard-coded table (2024 gap −16 Mt → 2030 gap +390 Mt). ITMO-vs-VCM price scatter pairs real deal
prices with a seeded VCM price `5 + sr(i·13)·12`. A compliance-volume trend line is synthesised:
`600 + (year−2015)·22 + sr(year)·30`.

### 7.2 Parameterisation

| Block | Values | Provenance |
|---|---|---|
| `COMPLIANCE_MARKETS` (13 rows) | EU ETS €65 · UK £42 · California $32 · RGGI $15 · China ¥9 · Korea $8 · NZ $35 · CH CHF60 · Canada C$65 · Mexico/Chile/Colombia pilots | Static seeds, plausible 2024 levels (ICAP-dashboard style); includes cap, surplus, 2030 cap |
| `VCM_HISTORY` (2015–2024) | issuance 84→168 Mt, retirements 38→152 Mt, avgPrice $3.2→$7.4 | Static; magnitudes track Ecosystem Marketplace annual reports |
| `POLICY_EVENTS` (16) | CBAM phase-in +18%, China ETS expansion +35%, Verra VM revision −8% … | Real events with synthetic price-impact %s |
| Forecast slopes 4.2/7.8/11 $/yr; multipliers | — | Synthetic demo values |
| Buyer segmentation | Corporates 52 / Finance 18 / Airlines 14 / Gov 8 / Other 8 % | Static; consistent with EM buyer surveys |
| `demandForecast` 2030 demand 680 Mt | — | Hard-coded; in the range of TSVCM/BCG 2030 VCM demand scenarios |

### 7.3 Calculation walkthrough

Scenario + sliders → `sm` → three lines and a bull/bear envelope; the year>2027 kink in the
scenario-conditional path (−2.5/yr) encodes a "post-2027 supply response". KPI cards derive from
seed sums (`retirementRate ≈` 946/1,287 ≈ 74%). The methodology-issuance stacked bars, surplus
bars and regional radar are direct seed renders.

### 7.4 Worked example (scenario-conditional 2030, defaults)

Defaults: scenario `NDC` (mult 1.0), carbonTax 80 → taxMult 1.0, ndcAmbition 50 → ndcMult 1.0,
so `sm = 1.0`; 2030 is `i = 6`:

| Step | Computation | Result |
|---|---|---|
| Linear term | 65 + 6 × 11 × 1.0 | 131 |
| Post-2027 drag | (2030−2027) × 2.5 | −7.5 |
| scenarioConditional | 131 − 7.5 | **$123.5/t** |
| Bull | 123.5 × 1.2 | **$148.2** |
| meanReversion | 65 + 6·4.2 + (sr(42)−0.5)·4 = 90.2 + (0.702−0.5)·4 | **$91.0** |
| Bear | 91.0 × 0.78 | **$71.0** |

Switching to `1.5C` with tax $160 gives sm = 1.35 × 1.10 = 1.485 → sc₂₀₃₀ = 65 + 98.0 − 7.5 =
**$155.5/t** — inside the NGFS 1.5 °C 2030 corridor by coincidence of slope choice, not by
scenario data.

### 7.5 Data provenance & limitations

- Market tables and VCM history are **static seeds**; forecast noise, ITMO scatter VCM legs and
  the compliance trend use the platform PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`. No API calls.
- The forecast labels misrepresent the maths (linear ramps labelled OU/ARIMA/NGFS). The bear
  band is anchored to the *lowest-slope* line and bull to the *highest*, so the "interval" is a
  slope spread, not a confidence interval.
- Retirement-rate KPI treats cumulative 10-year sums, blending market growth into a single ratio.

**Framework alignment:** ICAP ETS Map & World Bank *State and Trends of Carbon Pricing* (market
coverage, cap/surplus framing) · Ecosystem Marketplace VCM reports (issuance/retirement/price
shape) · Paris Agreement Art. 6.2 (ITMO deals, corresponding-adjustment flags on the deal table)
· NGFS scenarios (labels only — see mismatch flag) · CORSIA phases (policy tracker entries).

## 8 · Model Specification — Carbon Price Forecasting Suite (OU · Trend · Scenario-Conditional)

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Implement the three models the UI already advertises, for EUA (primary),
CCA, and a VCM composite index, horizon to 2030, producing genuine predictive distributions for
the existing chart/table components.

**8.2 Conceptual approach.** (i) **Mean reversion:** Ornstein–Uhlenbeck on log price — standard
commodity practice (Schwartz 1997 one-factor), used in bank commodity desks and consistent with
allowance banking theory; (ii) **trend-following:** ARIMA(p,1,q) with drift on monthly averages —
the benchmark statistical model; (iii) **scenario-conditional:** NGFS Phase IV/V scenario carbon
prices as attractors with an error-correction pull, mirroring how Aladdin Climate and NGFS-based
ECB/EBA stress tests inject policy paths.

**8.3 Mathematical specification.**

```
OU:      dx = θ(μ − x)dt + σ dW,  x = lnP
         x̂_{t+h} = μ + (x_t − μ)e^{−θh};  Var = σ²(1−e^{−2θh})/2θ
         P forecast band: exp(x̂ ± z_α √Var)
ARIMA:   ΔlnP_t = c + Σφᵢ ΔlnP_{t−i} + Σψⱼ ε_{t−j} + ε_t   (order by AICc, max (3,1,3))
ECM-NGFS: ΔlnP_t = α(lnP*_s(t) − lnP_{t−1}) + β′Z_t + ε_t
         P*_s = NGFS scenario price (s ∈ {NZ2050, Below2, Delayed, NDC, Current}), α ∈ (0,1] speed
         Z_t  = controls: gas price (TTF), industrial production, auction supply
Blend:   model-averaged forecast with weights ∝ exp(−½·rolling RMSE)
```

| Parameter | Calibration source |
|---|---|
| θ, μ, σ | MLE on ICE EUA daily settlements 2018→ (post-MSR regime); expect θ ≈ 0.3–0.6/yr |
| NGFS P*_s | NGFS Phase IV/V dataset (free, IIASA download) — candidate `reference_data` table |
| TTF gas, IP index | ENTSO-G/Eurostat (free) |
| VCM composite | Ecosystem Marketplace medians (already a platform seed file) + Platts CORSIA (vendor optional) |

**8.4 Data requirements.** Daily/monthly EUA settlements, NGFS scenario price CSV, macro
controls. Backend home: `carbon_price_ets_engine.py` (exists); frontend already has the
scenario/tax/NDC controls to condition the ECM path selection.

**8.5 Validation & benchmarking.** Rolling-origin backtest 2021–2024, RMSE vs (a) random walk,
(b) futures-implied forward (must beat RW at 6–12 m to justify display); parameter-stability
CUSUM across the 2022 energy-crisis regime; interval coverage test (80% band should contain
~80% of outcomes); cross-check 2030 scenario-conditional levels against published NGFS ranges.

**8.6 Limitations & model risk.** Policy jump risk (MSR reform, CBAM scope changes) violates
diffusion assumptions — overlay event dummies from the module's own `POLICY_EVENTS` table; VCM
composite index masks huge heterogeneity across project types; NGFS prices are marginal
abatement shadow prices, not market forecasts — the ECM attractor must be labelled as
scenario-conditional, never "expected". Fallback when data stale: display futures curve only.

## 9 · Future Evolution

### 9.1 Evolution A — Sourced market data and real price-forecast models (analytics ladder: rung 1 → 3)

**What.** This is a macro carbon-market intelligence page (8 compliance markets, VCM history, policy tracker, Article 6 bilateral deals, exchanges, regional readiness scores, 3 forecast models) whose aggregations are honest sums over curated tables (`totalComplianceCap`, `totalVCMIssuance`, `retirementRate`, `art6Volume`). But the `COMPLIANCE_MARKETS`, `VCM_HISTORY`, `POLICY_EVENTS`, `BILATERAL_DEALS`, and `demandForecast` tables are all curated/hard-coded constants, the price-forecast multipliers (`taxMult`, `ndcMult`) are simple linear knobs, and the `itmoPriceScatter` mixes real ITMO prices with seeded VCM prices. The registered backend is the generic `carbon.py` suite. Evolution A sources the market data and builds real forecasts.

**How.** (1) Compliance-market data (EU ETS, California, RGGI, China, Korea…) from real sources — ICAP Carbon Action Map and World Bank Carbon Pricing Dashboard are freely licensed and cover exactly these markets — with vintages, replacing the curated `COMPLIANCE_MARKETS`. (2) VCM issuance/retirement history from registry aggregates (Verra/GS public data). (3) Article 6 bilateral deals from the UNFCCC Article 6 database (shared with the `article6-markets` module — coordinate). (4) The 3 forecast models become real: the module's own `taxMult`/`ndcMult` structure generalises to a scenario model over NGFS carbon-price paths plus a supply/demand-gap model from the issuance/retirement trend. (5) Rung 3: the demand-gap forecast benchmarked against published VCM demand projections. As a backend vertical, a dedicated market-data route.

**Prerequisites.** ICAP/World Bank/UNFCCC ingestion (all fit the ingester scaffold); NGFS paths for the price forecast. **Acceptance:** compliance-market prices/caps carry sources and vintages; VCM and Article 6 volumes derive from registries/UNFCCC; the forecast models produce scenario-conditioned paths; the demand-gap projection cites its basis.

### 9.2 Evolution B — Carbon-market strategy copilot (LLM tier 2)

**What.** Corporate strategists and policy analysts ask "which compliance markets are tightening fastest?", "what's the VCM supply-demand gap forecast to 2030?", "how did the last EU ETS reform move prices?" (from the real `POLICY_EVENTS` impacts), "what Article 6 bilateral deals involve this host country?" — the copilot runs the Evolution-A market-data and forecast tools, every figure and forecast tool-traced.

**How.** Tool schemas over the Evolution-A market-data/forecast routes; grounding corpus is this Atlas record plus the ICAP/World Bank/NGFS references. The copilot's honesty duty: market data has vintages (carbon prices move daily), so it states the as-of date; forecasts are scenario-conditioned, so it states the assumptions (carbon-tax level, NDC ambition) behind any projection rather than presenting a single number. Policy-impact claims cite the `POLICY_EVENTS` record. This macro-intelligence module feeds the Tier-3 desk orchestrator's carbon-market view.

**Prerequisites (hard).** Evolution A's sourced data and real forecasts — a copilot narrating curated market figures as current or presenting linear-knob forecasts as models would misinform strategy. **Acceptance:** every market figure states its as-of date; forecasts state their scenario assumptions; policy-impact claims cite the event record; the supply-demand gap traces to the forecast tool.