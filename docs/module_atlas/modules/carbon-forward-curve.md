# Carbon Forward Curve
**Module ID:** `carbon-forward-curve` · **Route:** `/carbon-forward-curve` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
EUA, CCA, ACCU, and NZU carbon futures term structure analytics covering forward price discovery, implied volatility, contango/backwardation analysis, and hedging cost quantification. Integrates real exchange data from ICE/CME for EU ETS and California Carbon markets with NGFS scenario price forecasts for long-dated forward curve extrapolation.

> **Business value:** Carbon forward curves are essential inputs for corporate hedging strategies, long-dated infrastructure project financing, and climate-adjusted asset valuation. Contango structures in EUA markets reflect regulatory trajectory certainty, while implied volatility surfaces inform option-based hedge structuring for airlines, utilities, and industrial emitters managing CORSIA and EU ETS compliance costs.

**How an analyst works this module:**
- Market Overview tab shows EUA, CCA, ACCU, NZU spot and front-month contracts
- Forward Curve tab plots full term structure with contango/backwardation identification
- NGFS Overlay tab extends curve beyond liquid tenors with scenario price forecasts
- Hedging Analyser quantifies hedge cost for given carbon exposure and tenor
- Implied Volatility tab shows IV surface from options market data
- Portfolio Sensitivity computes portfolio P&L impact per €10 carbon price move

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAP_SCHEDULE`, `DeltaBadge`, `ETS_MARKETS`, `EU_PRICE_HISTORY`, `FORWARD_SCENARIOS`, `Kpi`, `SCENARIOS_VCM`, `Section`, `TRADING_DATA`, `TabBar`, `VCM_PRICE_DATA`, `YEARS_VCM`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `EU_PRICE_HISTORY` | 21 | `spot` |
| `SCENARIOS_VCM` | 5 | `color`, `prices` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `eur` | `(n, d = 2) => `€${parseFloat(n).toFixed(d)}`; // renamed from 'usd' — this module is EU ETS only, always formats in EUR` |
| `fmt` | `(n) => n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${n}`;` |
| `FORWARD_SCENARIOS` | `['2025', '2026', '2027', '2028', '2029', '2030', '2035', '2040', '2050'].map((yr, i) => ({` |
| `VCM_PRICE_DATA` | `YEARS_VCM.map((yr, i) => {` |
| `CAP_SCHEDULE` | `[2020, 2022, 2024, 2026, 2028, 2030, 2035, 2040].map((yr, i) => ({` |
| `TRADING_DATA` | `ETS_MARKETS.slice(0, 5).map((m, i) => ({` |
| `TABS` | `['ETS Market Overview', 'EU ETS Deep-Dive', 'Forward Curve', 'VCM Scenario Paths', 'Cap Reduction Schedule'];` |

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
**Frontend seed datasets:** `CAP_SCHEDULE`, `EU_PRICE_HISTORY`, `FORWARD_SCENARIOS`, `SCENARIOS_VCM`, `TABS`, `YEARS_VCM`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EUA Front Month | — | ICE ECX data | EU Allowance spot price; historically ranged €5–95/tCO₂ in Phase IV (2021–2024) |
| EUA Dec-27 Forward | `F = S × exp(carry × T)` | ICE forward curve | Three-year forward EUA price; proxy for corporate carbon price planning horizon |
| Implied Volatility (3M) | `Black-76 IV from options` | ICE options market | Three-month at-the-money implied vol; historically 30–60% for EUA options |
- **ICE/CME exchange carbon futures data** → Extract settlement prices per tenor; fit forward curve; compute implied carry and convenience yield → **Full carbon forward curves for EUA, CCA, ACCU, NZU with term structure analytics**
- **NGFS Phase 5 carbon price scenario data** → Extrapolate liquid forward curve to 2050 using NGFS scenario prices for planning horizons → **Extended carbon forward curve to 2050 under 5 NGFS scenarios for long-dated hedging**

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
**Methodology:** Cost-of-carry forward pricing model
**Headline formula:** `F(t,T) = S(t) × exp((r + c – y)(T–t)); Convenience_yield y = r + c – ln(F/S)/(T–t)`

Carbon forward curve uses cost-of-carry: forward price = spot Ã— exp[(risk-free rate + storage cost – convenience yield) Ã— time]. Contango occurs when carry costs exceed convenience yield (common in compliance carbon markets). Implied volatility extracted from options on EUA futures using Black-76 model.

**Standards:** ['ICE EUA Futures Market Conventions', 'EU ETS Phase IV (2021–2030)', 'NGFS Carbon Price Scenarios']
**Reference documents:** ICE ECX EUA Futures Specifications; EU ETS Phase IV Directive 2018/410; NGFS Phase 5 Carbon Price Pathways; CME California Carbon Allowance Futures

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
| `carbon-project-lifecycle` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-removal-markets` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-adjusted-valuation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-capture-finance` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *cost-of-carry forward
> pricing model* — `F(t,T) = S(t) × exp((r + c − y)(T−t))`, convenience-yield extraction,
> Black-76 implied volatility from EUA options, ACCU/NZU term structures, a hedging analyser and
> a portfolio-sensitivity tab. **None of that is implemented.** The code contains no exponential
> carry formula, no volatility computation, no options data, and no hedging calculator. What the
> page actually renders is an **ETS market dashboard with linear scenario price paths**: an
> 8-market compliance price table, EU ETS quarterly spot history (2020–2024), four hand-built
> forward scenario lines, NGFS/IEA VCM price paths, and cap-reduction schedules. The sections
> below document the code as it behaves; §8 specifies the missing carry/IV model.

### 7.1 What the module computes

The "forward curve" is a deterministic linear ramp with seeded noise, per scenario, over 9
tenors (2025–2030, 2035, 2040, 2050), anchored at the hard-coded EU ETS spot €62.4/t:

```
baseline_i     = round(62.4 + i × 8.2  + sr(i×5)  × 4)
accelerated_i  = round(62.4 + i × 14.8 + sr(i×7)  × 5)
delayed_i      = round(62.4 + i × 3.8  + sr(i×11) × 3)
ncb_forecast_i = round(62.4 + i × 9.4  + sr(i×13) × 6)
RangeWidth_i   = accelerated_i − delayed_i
```

where `i` is the tenor index (NOT years-to-maturity — the 2030→2035→2040→2050 steps get the same
per-index slope as annual steps, so the curve implicitly flattens in calendar time). VCM scenario
paths are hard-coded price ladders per scenario (NGFS NZE: 8→200 $/t over 2024–2040; Current
Policies: 8→22 $/t). Cap schedules are linear: `EU cap_i = 1520 − 60i` Mt, `California = 380 − 14i`,
`RGGI = 130 − 8i`. Trading volume/open-interest figures are pure `sr()` draws.

### 7.2 Parameterisation

| Block | Values | Provenance |
|---|---|---|
| `ETS_MARKETS` (8 rows; +India CCTS ₹3.2/t when India mode on) | EU €62.4 (+18.2% YTD), UK £44.8, CA $38.2, RGGI $14.6, China ¥→$9.8, Korea $8.2, NZ $52.6, Canada OBPS C$65 | Static seeds, plausible late-2024 levels (ICAP-style) |
| `EU_PRICE_HISTORY` (21 quarters) | 2020Q1 €24.2 → 2022Q1 €82.4 → 2023Q1 €92.4 → 2024Q4 €62.4 | Static; tracks actual EUA quarterly averages closely |
| Scenario slopes 8.2 / 14.8 / 3.8 / 9.4 €/step | — | Synthetic demo values (no cited source) |
| VCM scenario ladders | NGFS NZE / Below-2°C / IEA SDS / Current Policies | Labelled after NGFS & IEA scenarios; magnitudes consistent with NGFS carbon-price ranges but hand-entered |
| KPI "Global ETS Coverage ~17%" | static | Order of ICAP 2023 (~17–18% of global GHG) |
| LRF −4.4%/yr, MSR TNAC 2.1B, intake 24% | static text | EU ETS Directive (Fit-for-55 LRF 4.3/4.4%), MSR Decision 2015/1814 — descriptive only |

### 7.3 Calculation walkthrough

1. Tab 1 tables `ETS_MARKETS` and charts price/cap comparisons — pure display.
2. Tab 2 charts `EU_PRICE_HISTORY` with a €50 support reference line, plus static policy-milestone
   and MSR-trigger tables.
3. Tab 3 selects a market (display only — the scenario lines are always EUR/EU-anchored), then
   renders `FORWARD_SCENARIOS` as four lines plus the Range Width column.
4. Tab 4 renders the VCM ladders; Tab 5 the linear cap schedules and `sr()`-seeded volume table.

### 7.4 Worked example (2030 baseline forward)

2030 is index `i = 5` in the tenor array:

| Step | Computation | Result |
|---|---|---|
| Trend | 62.4 + 5 × 8.2 | 103.4 |
| Noise | sr(25) = frac(sin(26)×10⁴) = frac(7625.58) = 0.585; × 4 | +2.34 |
| Baseline 2030 | round(103.4 + 2.34) | **€106/t** |
| Accelerated 2030 | sr(35) = frac(−9917.78) = 0.222; round(62.4 + 74 + 0.222×5) | **€138/t** |
| Delayed 2030 | sr(55) = frac(−5215.51) = 0.485; round(62.4 + 19 + 0.485×3) | **€83/t** |
| Range width | 138 − 83 | **€55/t** |

(JS `x − Math.floor(x)` maps negative products into [0,1), so sin(36)×10⁴ = −9917.78 yields
0.222. The noise is deterministic per seed; displayed integers reproduce these draws exactly.)

### 7.5 Data provenance & limitations

- Forward scenarios, volumes and open interest are **synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`
  pattern); price history and market table are static but realistic seeds. Nothing is fetched
  from ICE/CME or the mapped `/api/v1/carbon/*` endpoints.
- No no-arbitrage structure: scenario lines are policy narratives, not tradable forwards; the
  equal-slope-per-index treatment of 5/10-year tenor gaps understates long-dated carry.
- Guide-promised analytics missing: convenience yield, contango/backwardation flags, implied
  vol surface, hedge-cost quantification, ACCU/NZU curves.
- India-mode injection (`isIndiaMode()`) prepends an India CCTS row — the only dynamic data path.

**Framework alignment:** EU ETS Directive 2003/87/EC as amended (Phase 4 LRF 2.2% → 4.3/4.4%
under Fit-for-55; module quotes −4.4%/yr) · MSR Decision (EU) 2015/1814 (24% intake rate quoted) ·
NGFS scenario taxonomy (labels only) · ICAP ETS coverage statistics (~17%). The guide's ICE EUA
futures conventions and Black-76 are *not* represented in code.

## 8 · Model Specification — Carbon Forward Curve & Implied Volatility Engine

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce arbitrage-consistent EUA/UKA/CCA/NZU forward curves with carry
decomposition and an ATM implied-volatility term structure, supporting hedge-cost quotation and
long-dated extrapolation to 2050 — the decisions the guide promises (corporate hedging, project
finance carbon-price assumptions).

**8.2 Conceptual approach.** (i) Liquid tenors: cost-of-carry fit to exchange settlements, the
convention used by ICE EUA futures desks and replicated in MSCI/BarraOne commodity curve models;
carbon behaves near full-carry because allowances are bankable with negligible storage cost.
(ii) Long end: splice to NGFS Phase IV/V scenario shadow prices via a smooth blend, as done in
Aladdin Climate and NGFS-based supervisory exercises. (iii) Vol: Black-76 inversion of EUA option
settlements.

**8.3 Mathematical specification.**

```
F(t,T)        = S(t) · exp[(r(t,T) + c − y(t,T)) · (T−t)]          // c ≈ 0 (registry storage)
y(t,T)        = r(t,T) − ln(F_mkt/S)/(T−t)                          // implied convenience yield
State         : contango if F_mkt > S·e^{rτ}, else backwardation
F_blend(T)    = w(T)·F_carry(T) + (1−w(T))·P_NGFS(T),  w(T)=max(0,1−(T−T_liq)/5yr)
Black-76 IV   : C = e^{-rτ}[F·N(d1) − K·N(d2)] solved for σ (Newton), d1 = [ln(F/K)+σ²τ/2]/(σ√τ)
HedgeCost(Q,T)= Q · [F(t,T) − S(t)] + margin funding: Q·F·IM%·r_f·τ
```

| Parameter | Calibration source |
|---|---|
| S, F_mkt per tenor | ICE Endex EUA futures daily settlements (public delayed); CME CCA |
| r(t,T) | €STR/SOFR OIS curve (ECB/NY Fed, free) |
| P_NGFS(T) | NGFS Phase IV/V carbon price by scenario (free download; candidate for `reference_data`) |
| Option settlements for IV | ICE EUA options end-of-day (vendor); fallback: realised vol × 1.1 loading |
| IM% initial margin | ICE Clear Europe margin parameters (public) |

**8.4 Data requirements.** Daily settlement strip (Dec contracts to +5y), OIS curve, NGFS price
paths, option chain (strike, premium, expiry). Platform: extend `reference_data` generic tables
(a CBAM/EEX seed layer already exists per the EA-hybrid-v3 sprint); serve via
`/api/v1/refdata`.

**8.5 Validation & benchmarking.** Repricing test: fitted curve must reproduce input settlements
to <€0.05; convenience-yield series compared against academic EUA carry studies (near-zero,
occasionally negative in policy-uncertainty windows); IV surface benchmarked to ICE-published
settlement vols; blend-region continuity (no slope jump > €2/t/yr at T_liq).

**8.6 Limitations & model risk.** Carbon carry can break at compliance dates (April surrender
spikes); MSR interventions create policy jumps no diffusion captures — flag regime risk; NGFS
prices are scenario shadow values, not forecasts, so the blended long end must be labelled
scenario-conditional; thin CCA/NZU options force proxy vols (conservative: max of proxy and
realised).

## 9 · Future Evolution

### 9.1 Evolution A — Live ICE/CME curves and NGFS long-dated extrapolation (analytics ladder: rung 2 → 3)

**What.** The module claims to integrate "real exchange data from ICE/CME" for EUA/CCA/ACCU/NZU with NGFS long-dated forecasts, contango/backwardation analysis, and an implied-vol surface — but the data is seeded: `EU_PRICE_HISTORY` (21 rows), `FORWARD_SCENARIOS`, `VCM_PRICE_DATA`, `TRADING_DATA`, and `CAP_SCHEDULE` are all in-page constructed tables, and the registered backend is the generic `carbon.py` credit suite (no exchange feed). The contango/backwardation and hedging logic is real arithmetic over fake curves. Evolution A connects real market data.

**How.** (1) Live EUA spot and forward curve from ICE (and CCA from CME) where licensable — the module is already correctly EU-focused (formats in EUR). Nascent markets (ACCU, NZU) have thinner data and should be labelled as such rather than presented with false precision. (2) The NGFS overlay extends the liquid curve using real NGFS Phase-5 shadow-price trajectories (ingested vintages), so the long-dated extrapolation is scenario-grounded — this is the module's genuine value: no liquid market exists beyond ~3 years, so the NGFS-anchored extension is the honest way to price long-dated exposure. (3) The EU ETS cap-reduction schedule from the actual regulatory trajectory (`CAP_SCHEDULE` becomes the real LRF path). (4) Rung 3: contango/backwardation and the vol surface calibrated to observed data; hedging-cost outputs benchmarked. Coordinate with `carbon-derivatives-desk` (shares the EUA/vol domain) on one curve/vol source of truth.

**Prerequisites.** ICE/CME data licensing (the binding constraint — a labelled historical fallback if unavailable); NGFS trajectory data; the real EU ETS cap schedule. **Acceptance:** the front of the curve is live exchange data with timestamps; the long-dated extension is NGFS-anchored with the scenario stated; the cap schedule matches the regulatory LRF; illiquid-market curves carry data-quality caveats.

### 9.2 Evolution B — Carbon-curve and hedging copilot (LLM tier 2)

**What.** Corporate hedgers and project financiers ask "is the EUA curve in contango and what does that imply?", "what's the hedge cost for 500kt of 2028 EUA exposure?", "extend the curve to 2035 under NGFS disorderly" — the copilot runs the Evolution-A curve, NGFS-overlay, and hedging tools, reporting term structure, hedge cost, and portfolio sensitivity per €10 move, every figure tool-traced.

**How.** Tool schemas over the Evolution-A curve/overlay/hedging routes; grounding corpus is this Atlas record plus the EU ETS/NGFS references. The copilot's honesty duty is the liquid/illiquid boundary: it states which part of any curve is observed market data versus NGFS-extrapolated, and never presents a long-dated forward as a market price — the whole point of the NGFS overlay is that the market doesn't quote those tenors. Hedging answers state the curve date and scenario. Shares the carbon-market tool set with `carbon-derivatives-desk` for the desk orchestrator.

**Prerequisites (hard).** Evolution A's real curve data — a copilot quoting hedge costs off seeded curves would misprice real exposure. **Acceptance:** every price, hedge cost, and sensitivity traces to a tool response; the market-observed vs NGFS-extrapolated boundary is stated on every curve answer; long-dated forwards are never presented as market quotes.