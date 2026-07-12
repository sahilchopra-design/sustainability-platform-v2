# Carbon Credit Pricing Engine
**Module ID:** `carbon-credit-pricing` · **Route:** `/carbon-credit-pricing` · **Tier:** A (backend vertical) · **EP code:** EP-CN1 · **Sprint:** CN

## 1 · Overview
20 credit types with multi-factor pricing model: Base × Vintage × Methodology × Verification × Permanence × Liquidity.

**How an analyst works this module:**
- Pricing Dashboard shows interactive calculator with factor sliders
- Vintage Premium/Discount shows time decay of credit value

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BACKTEST_RETURNS`, `BEZERO_COLOR`, `BEZERO_PRICE_RANGE`, `BEZERO_RATINGS`, `CORSIA_PHASES`, `CREDITS`, `DAILY_VOLUME`, `FORWARD_CURVE`, `GEOGRAPHIES`, `METHODOLOGIES`, `METHODOLOGY_NAMES`, `PROJECT_TYPES`, `REGISTRIES`, `REGISTRY_NAMES`, `TABS`, `VCM_AVG_PRICES`, `VCM_BENCH`, `VERIFIER_NAMES`, `VINTAGE_PREMIUMS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `METHODOLOGY_NAMES` | `['REDD+','ARR','IFM','Cookstove','Renewable Energy','Biochar','DAC','Soil Carbon','Blue Carbon','Waste Gas','CCS','Mineralization'];` |
| `seed` | `i * 37 + 1000;` |
| `methIdx` | `Math.floor(sr(seed + 1) * METHODOLOGY_NAMES.length);` |
| `regIdx` | `Math.floor(sr(seed + 2) * REGISTRY_NAMES.length);` |
| `verIdx` | `Math.floor(sr(seed + 3) * VERIFIER_NAMES.length);` |
| `geoIdx` | `Math.floor(sr(seed + 4) * GEOGRAPHIES.length);` |
| `ptIdx` | `Math.floor(sr(seed + 5) * PROJECT_TYPES.length);` |
| `vintage` | `2010 + Math.floor(sr(seed+7) * 15);` |
| `liquidity` | `0.05 + sr(seed+9) * 0.90;` |
| `additionality` | `0.5 + sr(seed+10) * 0.5;` |
| `qualityScore` | `Math.round(30 + sr(seed+11) * 70);` |
| `sylveraScore` | `Math.round(20 + sr(seed+12) * 80);` |
| `bezeroRating` | `BEZERO_RATINGS[Math.min(7, Math.floor((1 - qualityScore/100) * 8))];` |
| `bidAsk` | `0.02 + sr(seed+13) * 0.18;` |
| `dailyVolume` | `Math.round(500 + sr(seed+14) * 50000);` |
| `bufferPct` | `method === 'REDD+' \|\| method === 'IFM' ? 10 + sr(seed+15)*15` |
| `corsiaEligible` | `['REDD+','ARR','IFM','Renewable Energy','Cookstove'].includes(method) && qualityScore >= 50;` |
| `sdgCount` | `2 + Math.floor(sr(seed+16) * 7);` |
| `cobenefits` | `Array.from({ length: sdgCount }, (_, j) => 1 + Math.floor(sr(seed+17+j) * 17));` |
| `vintageAdj` | `1 + (vintage - 2017) * 0.04;` |
| `permFactor` | `0.75 + (permanence / 100) * 0.50;` |
| `liqFactor` | `0.88 + liquidity * 0.24;` |
| `qualAdj` | `0.7 + (qualityScore / 100) * 0.6;` |
| `price` | `Math.round(methodBase * vintageAdj * permFactor * liqFactor * regPrem * verPrem * qualAdj * 100) / 100;` |
| `METHODOLOGIES` | `METHODOLOGY_NAMES.map((name, mi) => {` |
| `prices` | `credits.map(c => c.price);` |
| `avgPrice` | `prices.length ? prices.reduce((a,b)=>a+b,0)/prices.length : 0;` |
| `REGISTRIES` | `REGISTRY_NAMES.map((name, ri) => {` |
| `decay` | `(yr - 2010) / 14;      // 0→1 over range` |
| `halfLife` | `3 + mi * 0.7;       // different half-lives by method` |
| `spot` | `10 + i*0.6 + sr(seed+1)*4 - 2;` |
| `forward` | `spot + 0.5 + sr(seed+2)*2;` |
| `fmtPrice` | `v => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;` |
| `fmtPct` | `v => `${(v*100).toFixed(1)}%`;` |
| `weightedAvg` | `useMemo(() => { const totalVol = filtered.reduce((a,c)=>a+c.dailyVolume,0);` |
| `avgLiquidity` | `useMemo(() => filtered.length ? filtered.reduce((a,c)=>a+c.liquidity,0)/filtered.length : 0, [filtered]);` |
| `avgBidAsk` | `useMemo(() => filtered.length ? filtered.reduce((a,c)=>a+c.bidAsk,0)/filtered.length : 0, [filtered]);` |
| `top15ByPrice` | `useMemo(() => [...filtered].sort((a,b)=>b.price-a.price).slice(0,15), [filtered]);` |
| `methodAvgs` | `useMemo(() => METHODOLOGIES.map(m => {` |
| `registryStats` | `useMemo(() => REGISTRIES.map(r => {` |

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
**Frontend seed datasets:** `BEZERO_RATINGS`, `GEOGRAPHIES`, `METHODOLOGY_NAMES`, `PROJECT_TYPES`, `REGISTRY_NAMES`, `TABS`, `VERIFIER_NAMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Credit Types | — | Market | Nature-based, renewable, industrial, CDR |
| DAC Credit Price | — | Puro/Isometric | Highest-quality engineered removal credits |

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
**Methodology:** Multi-factor credit pricing
**Headline formula:** `FairPrice = Base × VintageFactor × MethodFactor × VerifFactor × PermFactor × LiqFactor`

Vintage: 2024 credits at premium, 2018 at 40-60% discount. Methodology: REDD+ $5-15, ARR $8-20, Renewable $2-8, DAC $200-600.

**Standards:** ['ICVCM', 'Market data']
**Reference documents:** ICVCM Core Carbon Principles; Verra VCS Registry

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

The Carbon Credit Pricing Engine implements the multi-factor fair-value model its guide describes
(`FairPrice = Base × Vintage × Method × Verif × Perm × Liq`), and crucially anchors the base price to
**real Ecosystem Marketplace 2023 VCM prices**. The multiplier logic is transparent and defensible; the
per-credit *attributes* (vintage, liquidity, quality, BeZero/Sylvera rating) are synthetic, so §8
specifies how those inputs should be sourced in production.

### 7.1 What the module computes

For 40 credits, a chained multi-factor price:

```js
price = methodBase × vintageAdj × permFactor × liqFactor × regPrem × verPrem × qualAdj
```

where the base is a real methodology average (from `VCM_AVG_PRICES`) with small dispersion, and each
factor is a bounded multiplier:

```js
vintageAdj = 1 + (vintage − 2017) × 0.04      // ±4%/yr from a 2017 anchor
permFactor = 0.75 + permanence/100 × 0.50      // 0.75–1.25, rises with permanence
liqFactor  = 0.88 + liquidity × 0.24           // 0.88–1.12
regPrem    = {Verra 1.00, Gold Std 1.18, ACR 0.96, CAR 0.93, Puro.earth 1.22}
verPrem    = {SCS 1.00, DNV 1.12, Bureau Veritas 1.08, EY 1.15, Deloitte 1.10}
qualAdj    = 0.70 + qualityScore/100 × 0.60    // 0.70–1.30
```

### 7.2 Parameterisation / provenance

**Base prices** (`VCM_AVG_PRICES`, sourced from `sovereignMacroSeed → VCM_CREDIT_PRICES_2023` —
**real Ecosystem Marketplace 2023**, with hard-coded fallbacks):

| Method | Base $/tCO₂ | Method | Base $/tCO₂ |
|---|---|---|---|
| REDD+ | 10.2 | Biochar | 195.0 |
| ARR | 14.1 | DAC | 420.8 |
| IFM | 16.8 | Soil Carbon | 28.1 |
| Cookstove | 13.8 | Blue Carbon | 25.4 |
| Renewable Energy | 3.2 | Waste Gas | 8.4 |
| CCS/BECCS | 180.4 | Mineralization | 280.0 |

**Permanence tiers** (real, methodology-appropriate): Renewable/Cookstove = 100 (avoidance, no reversal);
DAC/CCS/Mineralization = 95–100 (geologic); REDD+/IFM = 20–50 (reversal-prone forest); Biochar = 90–98.
**Buffer pool %** likewise tiered (REDD+/IFM 10–25%, ARR/Blue 8–20%, else 3–10%) — matching Verra's
non-permanence buffer logic. **Registry/verifier premia** encode real market quality perceptions
(Gold Standard and Puro.earth trade at premia; ACR/CAR at slight discounts).

**Synthetic attributes** (`sr()`-seeded): vintage (2010–2024), liquidity (0.05–0.95), qualityScore
(30–100), sylveraScore (20–100), bidAsk, dailyVolume. `bezeroRating` is *derived* from qualityScore:
`BEZERO_RATINGS[min(7, floor((1 − quality/100)×8))]` — so a 90 quality → AAA/AA band. Eligibility flags
(CORSIA, SBTi, CBAM) are rule-based on method + quality.

### 7.3 Calculation walkthrough

Each credit draws a method → real base price + dispersion → vintage/permanence/liquidity/registry/verifier/
quality factors → chained product → rounded price. Portfolio views compute volume-weighted average price,
average liquidity/bid-ask, top-15 by price, and per-method/per-registry statistics. Vintage-decay and
forward-curve panels model price erosion with age and a spot→forward spread.

### 7.4 Worked example (one REDD+ credit)

`method = REDD+`, base ≈ 10.2 (+dispersion, say 10.5). `vintage = 2021` → `vintageAdj = 1 + (2021−2017)×
0.04 = 1.16`. `permanence = 35` → `permFactor = 0.75 + 0.35×0.50 = 0.925`. `liquidity = 0.4` →
`liqFactor = 0.88 + 0.4×0.24 = 0.976`. `registry = Verra` → `regPrem = 1.00`. `verifier = DNV` →
`verPrem = 1.12`. `qualityScore = 68` → `qualAdj = 0.70 + 0.68×0.60 = 1.108`.

```
price = 10.5 × 1.16 × 0.925 × 0.976 × 1.00 × 1.12 × 1.108
      = 10.5 × 1.16 = 12.18 → ×0.925 = 11.27 → ×0.976 = 11.00 → ×1.12 = 12.32 → ×1.108 = $13.65/tCO₂
```

The low permanence (35 → 0.925) and mid quality (68 → 1.108) roughly offset; the DNV verifier premium and
recent vintage push the price above the ~$10 REDD+ base — a plausible fair value.

### 7.5 Data provenance & limitations

- **Base prices are real** (Ecosystem Marketplace 2023); registry/verifier premia and permanence/buffer
  tiers are realistic market conventions.
- **Per-credit attributes are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`) — vintage, liquidity, and
  especially the quality/BeZero/Sylvera scores are generated, not sourced from the rating agencies.
- The factor model is multiplicative and static — no supply/demand equilibrium, no term structure beyond
  a linear vintage decay, no correlation between factors (e.g. high-permanence removals are also low
  liquidity in reality; here the factors are independent draws).

**Framework alignment:** ICVCM Core Carbon Principles — the quality dimension; ICVCM assesses CCP-eligibility
at the *program* and *methodology-category* level against 10 principles (additionality, permanence, robust
quantification, no double counting, independent verification…), which the `qualityScore`/permanence/buffer
fields approximate · BeZero & Sylvera — independent carbon-rating agencies whose letter (BeZero AAA–D) and
0–100 (Sylvera) scales the module reproduces, deriving BeZero from its own quality proxy · CORSIA / SBTi /
CBAM — eligibility gates applied by methodology and quality threshold · Verra buffer-pool mechanism — the
non-permanence buffer % by methodology. See §8 for the production fair-value model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The factor structure is sound but its quality/
rating inputs are synthetic; this specifies a fair-value model with real inputs.

### 8.1 Purpose & scope
Produce a fair-value price and confidence interval per VCM credit and per project archetype, for buyers,
traders, and portfolio marks, decomposing price into methodology base, quality, permanence, vintage, and
liquidity components with sourced inputs.

### 8.2 Conceptual approach
Hedonic multi-factor pricing (as in real-estate and credit-rating pricing) calibrated on transacted VCM
prices, benchmarked against Ecosystem Marketplace/AlliedOffsets transaction data and BeZero/Sylvera rating-
to-price relationships. A cross-sectional regression estimates factor coefficients from observed trades
rather than assuming multiplier ranges.

### 8.3 Mathematical specification

```
ln P_i = β0 + β1·ln Base_method + β2·Quality_i + β3·Permanence_i + β4·(Vintage_age_i)
             + β5·Liquidity_i + β6·Registry_i + β7·Verifier_i + ε_i
FairPrice_i = exp( X_i β̂ )                          fitted value
CI_95       = exp( X_i β̂ ± 1.96·se_pred )           prediction interval
QualityScore_i = f(BeZero_rating, Sylvera_score, ICVCM_CCP_flag, additionality, over-crediting risk)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Factor coefficients | β | OLS on Ecosystem Marketplace / AlliedOffsets transactions |
| Base by method | Base | Ecosystem Marketplace 2023 (already in seed) |
| Quality score | Quality | BeZero (AAA–D) + Sylvera (0–100) + ICVCM CCP |
| Permanence / buffer | — | Verra/GS methodology buffer tables |
| Registry/verifier | — | dummy-coded, estimated premia |

### 8.4 Data requirements
Transacted prices with credit attributes (method, vintage, registry, verifier, geography), BeZero &
Sylvera ratings (licensed), ICVCM CCP-eligibility flags, buffer %. Platform already holds real base prices,
registry/verifier premia, permanence tiers; missing: transaction panel and licensed rating feeds.

### 8.5 Validation & benchmarking plan
Out-of-sample R²/RMSE on held-out trades; residual analysis by method and vintage. Reconcile fitted prices
against BeZero/Sylvera implied ranges and AlliedOffsets marks. Backtest fair-value vs realised transaction
prices over rolling windows.

### 8.6 Limitations & model risk
VCM is thin and heterogeneous — coefficient stability is the main risk, especially for high-price removals
(DAC/biochar) with few trades; widen prediction intervals and flag low-liquidity archetypes. Ratings can
move sharply on integrity news (e.g. REDD+ over-crediting studies), so quality inputs must be timestamped
and the model re-estimated frequently.

## 9 · Future Evolution

### 9.1 Evolution A — Calibrate the multi-factor pricing model against real VCM data (analytics ladder: rung 2 → 3)

**What.** The page implements a genuine multi-factor pricing model (`price = methodBase × vintageAdj × permFactor × liqFactor × regPrem × verPrem × qualAdj`) with a coherent structure — the six-factor decomposition the overview promises is real arithmetic. But the credit universe is seeded (`sr(seed+n)`-driven methodology, vintage, liquidity, quality, Sylvera/BeZero ratings) and the factor multipliers are authorial constants with no calibration. It carries real reference blocks (`VCM_AVG_PRICES`, `VCM_BENCH`, CORSIA phases). Evolution A calibrates the model to observed prices.

**How.** (1) Seed the credit universe from real registry data (Verra/Gold Standard project listings — public) rather than PRNG: real methodology, vintage, buffer pool, verifier per credit. (2) Calibrate the factor multipliers against observed VCM transaction prices: regress realised price on the factor set (vintage, methodology, quality rating, liquidity) so `vintageAdj`, `permFactor`, `qualAdj` are fitted coefficients, not `+0.04/yr`-style guesses — this is the rung-3 move (calibrated to observed data). (3) Quality ratings from real Sylvera/BeZero data where licensable, or clearly labelled proxy. (4) The forward curve and CORSIA-eligibility logic (already partly rule-based — `corsiaEligible` checks methodology + quality ≥50) grounded in the real CORSIA Eligible Emissions Unit list. As it shares the `carbon.py` backend, extract the pricing model to a dedicated route.

**Prerequisites.** VCM price data for calibration (transaction data is the constraint — much is OTC/opaque, so the calibration must report its sample and confidence); registry project data. **Acceptance:** credits derive from real registry projects; factor multipliers are fitted with published coefficients and fit statistics; CORSIA eligibility matches the official EEU list; the calibration sample and its limitations are disclosed.

### 9.2 Evolution B — Carbon-credit pricing copilot (LLM tier 2)

**What.** Buyers and traders ask "what should a 2021-vintage REDD+ credit with a BeZero A rating price at?", "why is this cookstove credit trading at a discount?", "which of these credits are CORSIA-eligible?" — the copilot runs the Evolution-A pricing model, decomposes the price into its factors (vintage premium, quality adjustment, liquidity), and reports CORSIA eligibility, every figure tool-traced.

**How.** Tool schemas over the Evolution-A pricing and eligibility routes; grounding corpus is this Atlas record plus the calibration coefficients so the copilot explains *why* a factor moves the price (citing the fitted vintage-premium coefficient, not a guess). The honesty duty is central given VCM integrity concerns: the copilot presents quality ratings as the rating provider assessed them, states the calibration's data limitations (VCM prices are opaque), and never asserts a credit is "high quality" beyond what the rating and factor model support — the module operates in a market where overstated quality is the core risk.

**Prerequisites (hard).** Evolution A's calibration — a copilot quoting prices from uncalibrated authorial multipliers over seeded credits would misprice a real market. **Acceptance:** every price and factor traces to a tool response; price decompositions cite the fitted coefficients; CORSIA verdicts match the official list; quality claims stay within the rating/model basis with the calibration caveat stated.