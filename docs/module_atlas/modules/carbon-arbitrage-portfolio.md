# Carbon Arbitrage Portfolio
**Module ID:** `carbon-arbitrage-portfolio` · **Route:** `/carbon-arbitrage-portfolio` · **Tier:** A (backend vertical) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Constructs and analyses long low-carbon / short high-carbon factor portfolios for carbon alpha generation, calculating carbon beta, net carbon exposure, and carbon carry costs. Uses MSCI Climate Value-at-Risk as a signal for cross-sectional carbon spread opportunities and models the portfolio-level impact of a rising internal carbon price.

> **Business value:** Used by quant portfolio managers, climate-focused hedge funds, and ESG factor investors to monetise the carbon risk premium and hedge portfolio carbon exposure.

**How an analyst works this module:**
- Define carbon factor signal (carbon beta, WACI, CVaR)
- Set long-short construction rules (sector neutrality, turnover constraints)
- Review portfolio carbon exposure, beta, and carry cost projections
- Backtest carbon alpha generation across carbon price regimes

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARBITRAGE_PAIRS`, `FORWARD_CURVE`, `INDIA_CORPORATE_PATHWAYS`, `Kpi`, `PORTFOLIO_DEFAULTS`, `PRICE_HISTORY`, `REGIMES`, `SectionTitle`, `Tab`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGIMES` | 7 | `name`, `region`, `price2025`, `price2030`, `price2035`, `unit`, `liquidity`, `volume2024MtCO2`, `mechanism`, `eligible`, `artSixLink`, `corsiaLink`, `color` |
| `PRICE_HISTORY` | 8 | `EU_ETS`, `INDIA_CCTS`, `JAPAN_JCM`, `VCS`, `GOLD_STD`, `JAPAN_GX` |
| `FORWARD_CURVE` | 12 | `EU_ETS`, `INDIA_CCTS`, `JAPAN_JCM`, `VCS`, `JAPAN_GX` |
| `ARBITRAGE_PAIRS` | 7 | `dst`, `srcName`, `dstName`, `conversionNote`, `artSix`, `corsiaElig`, `risk` |
| `INDIA_CORPORATE_PATHWAYS` | 6 | `scope12MtCO2`, `targetYr`, `cctsBuyReqMt`, `jcmOption`, `vcsBuy`, `euCbamExp`, `strategy` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `spread` | `dstPrice - srcPrice;` |
| `netQty` | `qty * (1 - artSixDeductPct/100);` |
| `revenue` | `spread * netQty;` |
| `portfolioPrice` | `Object.entries(weights).reduce((acc, [k,w]) => {` |
| `varPct` | `portfolioPrice * vol * zScore;` |
| `totalPortfolioPct` | `Object.values(portfolio).reduce((a,b)=>a+b,0);` |
| `sprd` | `d && s ? d.price2025 - s.price2025 : 0;` |
| `gain` | `((fwd - r.price2025) / r.price2025 * 100).toFixed(0);` |

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
**Frontend seed datasets:** `ARBITRAGE_PAIRS`, `FORWARD_CURVE`, `INDIA_CORPORATE_PATHWAYS`, `PRICE_HISTORY`, `REGIMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Carbon Beta | `Cov(r_portfolio, ΔETS_price) / Var(ΔETS_price)` | ETS price data + equity returns | Positive carbon beta means portfolio benefits from rising carbon prices; target for low-carbon tilts is beta < 0. |
| Net Carbon Exposure (tCO2e/$M AUM) | `Σ(w_i × WACI_i)` | MSCI ESG + company GHG data | Lower is better for climate-aligned mandates; MSCI ACWI low-carbon index target is <50 tCO2e/$M revenue. |
| Carbon Alpha (annualised, %) | `long_short_portfolio_return − risk_free_rate` | Backtested factor portfolio | Positive carbon alpha indicates the carbon factor generates excess returns; historical 2015-2024 average ~3-5% annualised. |
- **ETS price history + company WACI + MSCI CVaR → factor signals** → Carbon beta regression → long-short construction → carry cost model → **Carbon alpha P&L, net exposure, and factor attribution report**

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
**Methodology:** Long-Short Carbon Factor Portfolio Construction
**Headline formula:** `carbon_alpha = Σ(w_i · r_i) where w_i = +1 if carbon_beta < median, -1 if carbon_beta > median`

Carbon beta measures a stock's return sensitivity to carbon price shocks, estimated by regressing historical returns on ETS price changes over rolling 3-year windows. The long-short portfolio is dollar-neutral and constructed monthly via portfolio optimisation subject to sector neutrality constraints to isolate the pure carbon factor. Carbon carry cost is modelled as the expected annual cost of holding carbon-intensive positions under a shadow carbon price rising at $10/tCO2/year.

**Standards:** ['MSCI Climate Value-at-Risk Methodology', 'Gorgen et al. (2020) Carbon Risk Factor', 'TCFD Scenario Analysis Financial Modelling']
**Reference documents:** Gorgen, Jacob, Nerlinger (2020) Carbon Risk Factor (HML Carbon); MSCI Climate Value-at-Risk Technical Notes 2024; Andersson, Bolton, Samama (2016) Hedging Climate Risk

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
**Shared UI wrappers:** `Apr2026CarbonAnalytics`, `IndiaAdvancedAnalytics`, `IndiaGreenHybridFinance`

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch (substantial).** The guide describes a *long-short equity carbon-factor
> portfolio* — "carbon_alpha = Σ(wᵢ·rᵢ) where wᵢ = +1 if carbon_beta < median", carbon-beta estimated
> "by regressing historical returns on ETS price changes over rolling 3-year windows", MSCI Climate VaR
> signals, WACI net exposure, dollar-neutral construction. **The code implements none of this.** The
> page header actually reads *"EP-EA6 · Cross-Market Carbon Arbitrage & Net-Zero Portfolio Builder"* and
> the logic is **spot-price arbitrage across carbon compliance/voluntary regimes** (EU ETS, India CCTS,
> Japan JCM/GX-ETS, Verra VCS, Gold Standard), Article-6 ITMO conversion, CORSIA eligibility, and a
> parametric VaR on a *regime-weighted* carbon-price portfolio. There is no carbon beta, no return
> regression, no equity. The guide entry describes a different module; the sections below document the
> arbitrage tool as coded.

### 7.1 What the module computes

Two core calculators plus reference tables across 11 tabs:

**Arbitrage revenue** (`calcArbitrageRevenue`):
```js
spread   = dstPrice − srcPrice          // price gap between two carbon regimes
netQty   = qty × (1 − artSixDeductPct/100)   // Article-6 "share of proceeds" haircut
revenue  = spread × netQty
```

**Portfolio VaR** (`calcPortfolioVaR`) — parametric (variance-covariance) VaR on a weighted basket of
regime spot prices:
```js
portfolioPrice = Σ_k  regime_k.price2025 × w_k/100
vol            = 0.25                      // hard-coded annual volatility
z              = {95→1.645, 99→2.326, else→1.282}
varPct         = portfolioPrice × vol × z
varPct1yr      = varPct × √252
```

Note the units are inconsistent in the code: `varPct` is a single-period figure that is then scaled by
`√252` to "1yr" — but `vol=0.25` already reads as an annual number, so the `√252` scaling is a
methodological error (it converts a daily VaR to annual, yet the vol is not daily).

### 7.2 Parameterisation

**Carbon regimes** (`REGIMES`, 6 markets — provenance: published/announced 2024–25 carbon prices and
volumes, directionally real):

| Regime | 2025 | 2030 | 2035 | Unit | Liquidity | 2024 vol (MtCO₂) |
|---|---|---|---|---|---|---|
| EU ETS (EUA) | 70 | 95 | 130 | €/t | Very High | 8,200 |
| India CCTS | 12 | 28 | 55 | $/t | Low (nascent) | 50 |
| Japan JCM (ITMO) | 20 | 35 | 60 | $/t | Medium | 15 |
| Verra VCS (VCU) | 8 | 18 | 40 | $/t | High | 600 |
| Gold Standard | 12 | 25 | 45 | $/t | Medium | 80 |
| Japan GX-ETS | 15 | 30 | 65 | $/t | Low (developing) | 25 |

`PRICE_HISTORY` (2019–25) and `FORWARD_CURVE` (2025–35) are hand-set paths — e.g. EU ETS 25→53→80→62→70
tracks the real 2019–24 EUA trajectory (the 2021 spike, 2022 peak, 2023 pullback). Volatility (0.25) and
the arbitrage `artSixDeductPct` (default 5%, the Article-6.4 share-of-proceeds level) are the only
free parameters. `INDIA_CORPORATE_PATHWAYS` (Tata Steel, Reliance, JSW, etc.) carry real named companies
with illustrative CCTS/JCM/VCS purchase requirements.

`ARBITRAGE_PAIRS` encodes eligibility rules — e.g. `VCS→EU_ETS` = "Ineligible" (voluntary credits cannot
be surrendered into EU ETS), `JAPAN_JCM→JAPAN_GX` = "Low risk, 70% of JCM credit goes to Japan GX" —
which are genuine market-structure facts, not synthetic.

### 7.3 Calculation walkthrough

Arbitrage Calculator tab: pick source + destination regime → `spread = dst.price2025 − src.price2025`
→ apply Article-6 haircut → `revenue = spread × netQty`. Portfolio Builder: user sets integer weights
per regime (`PORTFOLIO_DEFAULTS` sum to 100) → VaR tab computes the weighted spot price and the
parametric VaR. Forward Curve / Article 6 / CORSIA tabs are reference views over the same tables.

### 7.4 Worked example (arbitrage + VaR)

**Arbitrage:** source = India CCTS ($12), destination = EU ETS (€70, treated as $70 in code),
`qty = 100,000`, `artSixDeduct = 5%`:
- `spread = 70 − 12 = 58`
- `netQty = 100,000 × 0.95 = 95,000`
- `revenue = 58 × 95,000 = $5,510,000` (**$5.51M** gross arbitrage, before the ineligibility caveat that
  CCTS→EU-ETS in fact requires an Article-6 corresponding adjustment and is not fungible in practice).

**VaR** on default portfolio `{EU 0, India 30, JCM 25, VCS 30, GS 10, GX 5}` at 95%:
- `portfolioPrice = 0.30·12 + 0.25·20 + 0.30·8 + 0.10·12 + 0.05·15 = 3.6+5.0+2.4+1.2+0.75 = 12.95`
- `varPct = 12.95 × 0.25 × 1.645 = 5.32` (i.e. $5.32/t single-period VaR)
- `varPct1yr = 5.32 × √252 = 84.5` — implausibly large, exposing the √252 double-annualisation flaw.

### 7.5 Data provenance & limitations

- **Prices, volumes, and eligibility rules are real/directional** (published EUA levels, VCS ~680 Mt
  voluntary volume, Article-6 5% SOP, CORSIA eligibility). Named India corporates are real but their
  purchase-requirement figures are illustrative.
- **Volatility is a single hard-coded scalar (0.25) for all regimes** — EU ETS and nascent India CCTS
  cannot share a volatility; there is no covariance matrix, so the "portfolio" VaR ignores diversification
  entirely (it is a weighted-average-price VaR, not a portfolio VaR).
- The `√252` annualisation is dimensionally inconsistent with an annual vol input (see §7.1/§7.4).
- Currency is conflated: EU ETS is €/t, others $/t, but the arbitrage subtracts them directly.

**Framework alignment:** EU ETS / cap-and-trade — the EUA regime and its cap logic · Paris Agreement
Article 6.2/6.4 — ITMO transfers, corresponding adjustments, and the 5% share-of-proceeds haircut applied
in `calcArbitrageRevenue` · CORSIA — offset-unit eligibility flags on each pair · India CCTS — the
intensity-based-plus-offset design and CBAM export exposure in the corporate pathways. The MSCI Climate
VaR / Gorgen carbon-beta methods named in the guide are **not** implemented.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Two distinct models are missing: (a) a real
cross-market carbon-basket VaR (the code has only a single-vol parametric proxy), and (b) the equity
carbon-factor long-short the guide describes. This spec covers the VaR the *coded* tool should run.

### 8.1 Purpose & scope
Estimate the market risk of a multi-regime carbon-credit portfolio (compliance EUAs, ITMOs, voluntary
VCUs) for a corporate compliance buyer or trading desk, capturing regime-specific volatility and cross-
regime correlation, plus Article-6 conversion and eligibility haircuts.

### 8.2 Conceptual approach
Variance-covariance and historical-simulation VaR on a portfolio of heterogeneous carbon instruments,
benchmarked against RiskMetrics parametric VaR and standard commodity-desk practice (ICE/EEX EUA risk
models). Each regime is a risk factor with its own volatility; correlation is estimated from overlapping
price history, not assumed zero or one.

### 8.3 Mathematical specification

```
r_k,t   = ln(P_k,t / P_k,t-1)                       daily log returns per regime k
Σ       = cov(r)                                     K×K covariance (EWMA λ=0.94)
w$      = notional weights (value, not %)
σ_p     = √(w$ᵀ Σ w$)                                 portfolio daily volatility
VaR_α   = z_α · σ_p · √h                              h = holding-period days
ES_α    = σ_p · φ(z_α)/(1−α) · √h                     expected shortfall
Arb_net = (P_dst − P_src·FX) · qty · (1 − SOP) · 1{eligible}
```

| Parameter | Symbol | Source |
|---|---|---|
| Regime volatilities | σ_k | realised from ICE EUA / MCX / Verra price history |
| Correlations | ρ_kj | EWMA on overlapping series (λ=0.94, RiskMetrics) |
| Article-6 SOP | SOP | 5% (Art. 6.4 rules), 0% for 6.2 bilateral |
| Confidence z | z_α | 1.645 (95%), 2.326 (99%) |
| FX | FX | ECB/RBI reference rates (EUR↔USD↔INR) |

### 8.4 Data requirements
Daily settlement prices per regime (ICE/EEX for EUA, MCX/SECI for India CCTS, registry marks for VCS/GS),
FX series, eligibility matrix (Article-6 authorisations, CORSIA phase list), notional positions. Platform
already holds the regime price tables and eligibility flags; missing: real daily series and FX.

### 8.5 Validation & benchmarking plan
Backtest VaR exceptions (Kupiec POF, Christoffersen independence) on EUA history — expect ~5% breaches at
95%. Reconcile single-name EUA VaR against an ICE margin model. Stress the 2021 EUA rally and 2022 gas-
crisis spike. Correlation-stability test across regimes.

### 8.6 Limitations & model risk
Nascent regimes (India CCTS, Japan GX) have too little history for stable covariance — fall back to a
conservative high-vol prior and floor correlations toward compliance-market analogues. Eligibility is
binary and policy-driven; a credit's fungibility can change overnight (regulatory risk), so arbitrage
revenue must be gated on a live eligibility feed, not a static table.

## 9 · Future Evolution

### 9.1 Evolution A — Real cross-market price data and a genuine long-short construction engine (analytics ladder: rung 2 → 4)

**What.** The page models carbon-market arbitrage (EU ETS, India CCTS, Japan JCM/GX, VCS, Gold Standard) with seeded `PRICE_HISTORY`, `FORWARD_CURVE`, and `REGIMES` tables and a simple spread/VaR overlay (`spread = dstPrice − srcPrice`, `varPct = price × vol × z`). The registered backend is the generic `carbon.py`/`carbon_calculator` suite — project-credit and calibrated Monte Carlo focused, not cross-market factor construction — so the module's specific arbitrage math lives entirely in seeded frontend arithmetic. Evolution A grounds the prices and builds a real construction engine.

**How.** (1) Real price history and forward curves from actual carbon-market data (EU ETS via ICE/EEX-derived feeds where licensable; India CCTS and Japan GX are nascent — represent them as scenario bands with the immaturity disclosed, not seeded certainty). (2) A real long-short factor engine: carbon-beta and WACI signals computed from portfolio holdings' emissions (the platform's PCAF/GHG data), with sector-neutral, turnover-constrained construction — currently the "portfolio" is static weights. (3) Arbitrage-pair economics account for the Article 6 corresponding-adjustment deduction (`netQty = qty × (1 − artSixDeduct)`) using the real Article 6 logic from the `article6-markets`/`avoided-emissions` engines rather than a stored percentage. (4) Rung 4: backtest carbon alpha across real price regimes using the calibrated Monte Carlo (`run_monte_carlo`, genuinely distributional per §2.3) for the price-path uncertainty.

**Prerequisites.** Carbon-market price data licensing (EU ETS is the only deep, liquid series — others need honest immaturity labelling); holdings emissions for the factor signal; the calibrated MC already exists. **Acceptance:** spreads derive from real/labelled price series with vintages; the long-short portfolio is constructed from holdings signals under stated constraints; Article 6 deductions use the real corresponding-adjustment logic; backtests cite the MC distribution.

### 9.2 Evolution B — Carbon-market arbitrage-desk copilot (LLM tier 2)

**What.** Quant PMs and carbon-desk traders ask "what's the EU-ETS-vs-VCS spread and is it CORSIA/Article-6 eligible to convert?", "size a sector-neutral long-low-carbon/short-high-carbon book at 3% TE", "backtest carbon alpha across price regimes" — the copilot runs the Evolution-A price, construction, and backtest tools, reporting spreads, portfolio carbon beta, carry cost, and alpha, every figure tool-traced.

**How.** Tool schemas over the Evolution-A construction/backtest routes and the price-data endpoints; grounding corpus is this Atlas record plus the `REGIMES`/`ARBITRAGE_PAIRS` real market-mechanism metadata (Article 6 links, CORSIA eligibility). The copilot's key honesty duty: cross-market convertibility is legally constrained (corresponding adjustments, CORSIA eligibility), so it reports eligibility from the real Article 6 logic and never asserts a spread is capturable without the conversion being permitted. Nascent markets (India CCTS, Japan GX) carry data-immaturity caveats.

**Prerequisites (hard).** Evolution A's real prices and construction engine — a copilot narrating arbitrage opportunities from seeded prices would surface fictional trades. **Acceptance:** every spread, beta, and alpha traces to a tool response; convertibility claims cite the Article 6/CORSIA eligibility logic; illiquid-market figures carry immaturity caveats.