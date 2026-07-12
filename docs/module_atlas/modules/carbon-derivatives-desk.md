# Carbon Derivatives Desk
**Module ID:** `carbon-derivatives-desk` · **Route:** `/carbon-derivatives-desk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Badge`, `DEFAULT_LEG_QTY`, `DEFAULT_Q_WEIGHTS`, `FWD_TENORS`, `Field`, `HEDGE_YEARS`, `Kpi`, `MSR_DEFAULT_PATH`, `MSR_PARAMS`, `SCENARIOS`, `STRATEGY_PRESETS`, `SURF_MONEYS`, `SURF_TENORS`, `XM_NOTES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SCENARIOS` | 6 | `label` |
| `MSR_DEFAULT_PATH` | 9 | `tnac` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `normPdf` | `(x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);` |
| `poly` | `t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));` |
| `disc` | `Math.exp(-r * tau);` |
| `call` | `disc * (F * normCdf(d1) - K * normCdf(d2));` |
| `put` | `disc * (K * normCdf(-d2) - F * normCdf(-d1));` |
| `cocForward` | `(S, r, u, tau) => S * Math.exp((r + u) * tau);` |
| `clamp` | `(x, lo, hi) => Math.min(Math.max(x, lo), hi);` |
| `v00` | `grid[i][j]; const v10 = grid[i + 1][j];` |
| `v01` | `grid[i][j + 1]; const v11 = grid[i + 1][j + 1];` |
| `flatten` | `1 / (1 + 0.4 * (tau - tenors[0]));       // smile decays with tenor` |
| `intrinsic` | `leg.type === 'call' ? Math.max(ST - leg.strike, 0) : Math.max(leg.strike - ST, 0);` |
| `strategyPayoff` | `(legs, ST) => legs.reduce((s, l) => s + legPayoff(l, ST), 0);` |
| `fmt` | `(v, d = 2) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });` |
| `fmt0` | `(v) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 });` |
| `fmtEur` | `(v, d = 2) => (v == null \|\| isNaN(v)) ? '—' : `€${Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d })}`;` |
| `fmtEurM` | `(v) => (v == null \|\| isNaN(v)) ? '—' : `€${(Number(v) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;` |
| `SURF_MONEYS` | `[0.8, 0.9, 1, 1.1, 1.2];   // K/S` |
| `SURF_TENORS` | `[0.5, 1, 2, 3];            // yrs` |
| `DEFAULT_LEG_QTY` | `100000; // tonnes per leg (editable)` |
| `sigma` | `(parseFloat(mkt.volPct) \|\| 0) / 100;` |
| `setSurfNode` | `(i, j, v) => setSurfGrid((g) => g.map((row, a) => (a === i ? row.map((x, b) => (b === j ? v : x)) : row)));` |
| `surfNum` | `useMemo(() => surfGrid.map((row) => row.map((v) => parseFloat(v) \|\| 0)), [surfGrid]);` |
| `smileData` | `useMemo(() => SURF_MONEYS.map((m, i) => {` |
| `row` | `{ m, label: `${Math.round(m * 100)}%` };` |
| `b76` | `useMemo(() => (Fopt != null && K > 0 && sigmaUsed > 0 && tau > 0 ? black76(Fopt, K, sigmaUsed, tau, r) : null), [Fopt, K, sigmaUsed, tau, r]); const parity = b76 != null ? (b76.call - b76.put) - Math.exp(-r * tau) * (Fopt - K) : null;` |
| `setRatio` | `(i, v) => setHedge((p) => ({ ...p, ratios: p.ratios.map((x, j) => (j === i ? v : x)) }));` |
| `dec` | `(parseFloat(hedge.allocDeclinePct) \|\| 0) / 100;` |
| `year` | `startYear + y;` |
| `alloc` | `alloc0 * ((1 - dec) ** i);` |
| `netShort` | `Math.max(em - alloc, 0);` |
| `ratio` | `Math.max(0, Math.min(100, parseFloat(ratioRaw) \|\| 0)) / 100;` |
| `hedged` | `netShort * ratio;` |
| `open` | `netShort - hedged;` |
| `netPrem` | `bCap && bFlr ? bCap.call - bFlr.put : null; // €/t paid today` |
| `collarEff` | `scen != null ? Math.min(Math.max(scen, Kp), Kc) : null; // purchase cost bounded by collar` |
| `hedgedCostPerT` | `hedge.instrument === 'futures' ? F : (collarEff != null && netPrem != null ? collarEff + netPrem : null);` |
| `hedgedCost` | `hedgedCostPerT != null ? hedged * hedgedCostPerT : null;` |
| `openCost` | `scen != null ? open * scen : null;` |
| `totalCost` | `hedgedCost != null && openCost != null ? hedgedCost + openCost : null;` |
| `unhedgedCost` | `scen != null ? netShort * scen : null;` |

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
| POST | `/api/v1/carbon-price-ets/ets-compliance` | `ets_compliance_endpoint` | api/v1/routes/carbon_price_ets.py |
| POST | `/api/v1/carbon-price-ets/eu-ets-forecast` | `eu_ets_forecast_endpoint` | api/v1/routes/carbon_price_ets.py |
| POST | `/api/v1/carbon-price-ets/cbam-exposure` | `cbam_exposure_endpoint` | api/v1/routes/carbon_price_ets.py |
| POST | `/api/v1/carbon-price-ets/portfolio-carbon-cost` | `portfolio_carbon_cost_endpoint` | api/v1/routes/carbon_price_ets.py |
| POST | `/api/v1/carbon-price-ets/price-pathway` | `price_pathway_endpoint` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/ets-systems` | `ref_ets_systems` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/iea-pathways` | `ref_iea_pathways` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/cbam-sectors` | `ref_cbam_sectors` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/leakage-risk` | `ref_leakage_risk` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/china-ets-sectors` | `ref_china_ets_sectors` | api/v1/routes/carbon_price_ets.py |
| POST | `/api/v1/climate-derivatives/classify-regulatory` | `classify_regulatory_endpoint` | api/v1/routes/climate_derivatives.py |
| GET | `/api/v1/climate-derivatives/ref/weather-stations` | `get_weather_stations` | api/v1/routes/climate_derivatives.py |
| GET | `/api/v1/climate-derivatives/ref/eua-market` | `get_eua_market` | api/v1/routes/climate_derivatives.py |
| GET | `/api/v1/climate-derivatives/ref/product-templates` | `get_product_templates_endpoint` | api/v1/routes/climate_derivatives.py |
| GET | `/api/v1/climate-derivatives/ref/peril-models` | `get_peril_models` | api/v1/routes/climate_derivatives.py |
| GET | `/api/v1/climate-derivatives/ref/ccp-eligibility` | `get_ccp_eligibility` | api/v1/routes/climate_derivatives.py |

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

### 2.3 Engine `carbon_price_ets_engine` (services/carbon_price_ets_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `forecast_eu_ets_price` | horizon_years, scenario, entity_id | Forecast EU ETS price path using LRF, MSR dynamics, and supply/demand fundamentals. Deterministic supply-tightening model. MSR intake/release and CBAM pass-through are represented by fixed model calibration constants (not entity-reported figures). The confidence band is a scenario-dependent deterministic model uncertainty width, not a random draw. |
| `calculate_ets_compliance_cost` | entity_data | Calculate compliance cost across all 6 ETS systems for a given entity. All figures are computed from caller-supplied entity data using published ETS reference prices (ETS_SYSTEMS). When a required entity input is absent it is treated as an honest null / zero-exposure rather than fabricated: - annual_emissions_tco2 absent -> insufficient_data (costs return None) - free_allocation_pct absent -> assu |
| `assess_cbam_exposure` | trade_data | Assess CBAM certificate liability and competitiveness impact for a trade flow. Uses caller-supplied trade data and the published CBAM sector benchmarks (CBAM_SECTORS) plus the EU ETS reference price. Honest fallbacks: - import_volume_t absent -> insufficient_data (volume-dependent costs return None) - actual_carbon_intensity_tco2_t absent -> published sector default intensity (reference-data value |
| `calculate_portfolio_carbon_cost` | portfolio | Calculate sector-weighted carbon cost, transition risk, and stranding probability. Computes financed emissions per PCAF from caller-supplied holdings. Each holding should provide exposure_usd, sector, waci_tco2_mn_revenue and revenue_mn (or financed_emissions_tco2 directly). Missing per-holding figures are skipped (not fabricated) and flagged. With no usable holdings the result is an honest null.  |
| `forecast_carbon_price_pathway` | scenario, horizon, economy_type, entity_id | Interpolate the published IEA WEO carbon price pathway with scenario uncertainty bands. Prices are the published IEA anchor values linearly interpolated between anchor years — no random perturbation is applied. The uncertainty_range_pct is a deterministic scenario band width, not a random draw. |

### 2.3 Engine `climate_derivatives_engine` (services/climate_derivatives_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_norm_cdf` | x | Cumulative standard normal distribution: N(x) = ½·(1 + erf(x/√2)). Fixed 2026-07-04: the previous version applied the Abramowitz & Stegun 7.1.26 erf polynomial (constants 0.3275911, 0.254829592, …) directly as if it were the normal CDF (and with exp(-x²/2) instead of exp(-x²)), giving N(0) ≈ 1e-9 instead of 0.5 — which made price_eua_option return negative call premiums. math.erf is exact to doubl |
| `_norm_pdf` | x | Standard normal PDF. |
| `_generate_burn_payouts` | mean, std_dev, strike, contract_type, tick_usd, n_years, seed | Simulate n_years historical payouts for burn analysis. |
| `price_weather_derivative` | underlying, city_station, contract_type, strike, notional_usd, tenor_days, risk_premium_loading | Price a weather derivative using burn analysis. Parameters ---------- underlying : str One of: hdd, cdd, rainfall_mm, wind_ms, sunshine_hrs city_station : str Station key from WEATHER_STATIONS (e.g. 'london', 'chicago') contract_type : str One of: call, put, swap, cap, floor strike : float Strike level in the underlying's units notional_usd : float Notional in USD tenor_days : int Tenor of the con |
| `price_eua_option` | option_type, strike, spot, tenor_years, volatility, risk_free_rate | Price an EUA (EU Allowance) option using Black-Scholes-Merton adapted for commodity. Parameters ---------- option_type : str 'call' or 'put' strike : float Strike price in EUR/tCO2 spot : float or None Spot price; defaults to EUA_MARKET_DATA spot tenor_years : float Time to expiry in years volatility : float or None Annual volatility; defaults to EUA_MARKET_DATA historical_vol_pct risk_free_rate : |
| `structure_cat_bond` | peril, country, attachment_point_usd_m, exhaustion_point_usd_m, notional_usd_m, tenor_years, trigger_type, peril_model | Structure a catastrophe bond and compute expected loss, spread, and SPV details. Parameters ---------- peril : str e.g. 'wind', 'flood', 'earthquake', 'wildfire' country : str ISO-2 country code attachment_point_usd_m : float Industry loss level (USD millions) at which bond starts paying exhaustion_point_usd_m : float Industry loss level at which bond is fully exhausted notional_usd_m : float Face |
| `classify_regulatory` | product_type, counterparty_type, jurisdiction | Classify a climate-linked derivative under EMIR / MiFID II / ISDA documentation. Parameters ---------- product_type : str e.g. 'cat_bond', 'weather_swap', 'eua_call_spread', 'sustainability_linked_swap' counterparty_type : str 'financial_counterparty', 'non_financial_counterparty', 'nfc_plus', 'third_country' jurisdiction : str 'EU', 'UK', 'US', 'APAC' |
| `get_product_templates` |  | Return the 12 climate-linked structured product templates. |

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

**Database tables:** `Manure` *(shared)*, `Wind` *(shared)*, `__future__` *(shared)*, `database` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `projects` *(shared)*, `pydantic` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DEFAULT_Q_WEIGHTS`, `FWD_TENORS`, `MSR_DEFAULT_PATH`, `SCENARIOS`, `SURF_MONEYS`, `SURF_TENORS`

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

**Engine `carbon_price_ets_engine` — extracted transformation lines:**
```python
lrf_effect = price * lrf * scenario_mult
msr_effect = msr_tightening if yr <= 2030 else msr_tightening * 0.5
price = price + lrf_effect + msr_effect
uncertainty = price * uncertainty_frac
ci_low[yr] = round(price - uncertainty, 2)
ci_high[yr] = round(price + uncertainty, 2)
msr_impact_eur=round(msr_tightening * horizon_years, 2),
lrf_impact_eur=round(base_price * lrf * horizon_years * scenario_mult, 2),
eu_allocation = annual_emissions * max(0.0, min(1.0, float(free_alloc_pct)))
eu_shortfall = max(0.0, annual_emissions - eu_allocation)
eu_cost_eur = eu_shortfall * eu_price
uk_exposed = (float(uk_pct) if uk_pct is not None else 0.0) * annual_emissions
uk_cost_gbp = uk_exposed * uk_price * 0.78  # USD to GBP
ca_exposed = (float(ca_pct) if ca_pct is not None else 0.0) * annual_emissions
ca_cost_usd = ca_exposed * ca_price
china_exposed = (float(china_pct) if china_pct is not None else 0.0) * annual_emissions
china_cost_cny = china_exposed * china_intensity_excess * china_price * 7.1
rggi_exposed = (float(rggi_pct) if rggi_pct is not None else 0.0) * annual_emissions
rggi_cost_usd = rggi_exposed * rggi_price
total_usd = (eu_cost_eur * 1.09) + (uk_cost_gbp * 1.27) + ca_cost_usd + (china_cost_cny / 7.1) + rggi_cost_usd
carbon_pct_ebitda = round(total_usd / ebitda * 100, 2) if ebitda else None
abatement_breakeven = total_usd / annual_emissions if annual_emissions else None
cbam_per_tco2 = max(0.0, eu_ets_price - exporter_carbon_price)
embedded_carbon = import_volume_t * actual_intensity
gross_cbam_cost = embedded_carbon * cbam_per_tco2
effective_cbam = gross_cbam_cost * cbam_phase_in / 100
revenue_from_trade = import_volume_t * float(unit_price_in)
comp_impact_pct = round(effective_cbam / revenue_from_trade * 100, 2)
```

**Engine `climate_derivatives_engine` — extracted transformation lines:**
```python
raw = max(0.0, realised - strike)
raw = max(0.0, strike - realised)
raw = realised - strike          # can be negative
raw = max(0.0, realised - strike)
scale_factor = tenor_days / 365.0
mean_scaled = mean_annual * scale_factor
std_scaled = std_dev_annual * math.sqrt(scale_factor)
expected_payout_usd = max(0.0, sum(burn_payouts) / len(burn_payouts))
payout_std_dev = (sum((p - expected_payout_usd) ** 2 for p in burn_payouts) / len(burn_payouts)) ** 0.5
risk_premium_usd = expected_payout_usd * risk_premium_loading
fair_value_usd = expected_payout_usd + risk_premium_usd
notional_scale = notional_usd / reference_notional
payout_std_dev_scaled = payout_std_dev * notional_scale
moneyness = (mean_scaled - strike) / (std_scaled + 1e-9)
gamma = _norm_pdf(moneyness) / (std_scaled + 1e-9)
vega = _norm_pdf(moneyness) * math.sqrt(tenor_days / 365.0) * notional_usd * 0.01
d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * sqrt_T)
d2 = d1 - sigma * sqrt_T
disc = math.exp(-r * T)
price = S * _norm_cdf(d1) - K * disc * _norm_cdf(d2)
price = K * disc * _norm_cdf(-d2) - S * _norm_cdf(-d1)
delta = _norm_cdf(d1) - 1.0
gamma = _norm_pdf(d1) / (S * sigma * sqrt_T)
vega = S * _norm_pdf(d1) * sqrt_T / 100.0          # per 1% vol move
rho_call = K * T * disc * _norm_cdf(d2) / 100.0   # per 1% rate move
time_value = price - intrinsic
layer_width = exhaustion_point_usd_m - attachment_point_usd_m
industry_mean = attachment_point_usd_m * 0.4
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
**Blast radius:** changes here can affect **96** other module(s).
**Shared engines (edits propagate!):** `carbon_calculator` (used by 21 modules), `carbon_price_ets_engine` (used by 2 modules), `climate_derivatives_engine` (used by 2 modules), `methodology_engine` (used by 21 modules)

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

`frontend/src/features/carbon-derivatives-desk/pages/CarbonDerivativesDeskPage.jsx` (1,413 lines)
is an EU-allowance (EUA) compliance-hedging desk. All quant primitives live in the sibling,
React-free, CommonJS module `frontend/src/features/carbon-derivatives-desk/lib/deskMath.js`
(137 lines) so the exact same functions price what the UI shows and what a Node verification
script asserts on — "zero re-implementation drift" per the file's own header comment. The desk
covers: (1) a cost-of-carry forward curve, (2) a user-editable 5×4 strike-moneyness × tenor
implied-vol surface with bilinear interpolation, (3) Black-76 European options on that surface with
a live BSM cross-check, (4) a multi-leg strategy builder (collar/spreads/straddle/calendar) with
aggregate payoff and net greeks, (5) EUA–UKA / EUA–CCA cross-market spread ladders, (6) EU Market
Stability Reserve (MSR) intake/release mechanics on a user TNAC path, (7) a compliance hedge
program priced off a live EU ETS scenario-forecast engine with quarterly auction planning and cost
averaging, (8) an IFRS 9 own-use/derivative decision tree, (9) a futures-book margin estimate, and
(10) a sustainability/ICP overlay. Nothing in the desk uses a PRNG — every model is closed-form or
a documented deterministic scenario ladder.

### 7.2 Cost-of-carry forward: `cocForward`

```
F = S · e^{(r + u)·τ}
```
EUAs are electronic registry entries (no physical storage), so the fair forward is simply the
funded spot: `u` is a user-set funding/holding spread (default 0). The engine's own reference curve
(`GET /api/v1/climate-derivatives/ref/eua-market → futures_curve`) is a **fundamentals-based**
curve (not cost-of-carry), so the gap between the two, when both are live, is read as an implied
risk premium — documented directly in the UI, not silently reconciled.

### 7.3 Black-76 on futures (`black76`, deskMath.js lines 22–43)

```
d1 = [ln(F/K) + σ²τ/2] / (σ√τ),   d2 = d1 − σ√τ
Call = e^{−rτ}[F·N(d1) − K·N(d2)]
Put  = e^{−rτ}[K·N(−d2) − F·N(−d1)]
Δcall = e^{−rτ}N(d1);  Δput = −e^{−rτ}N(−d1)
Γ = e^{−rτ}·n(d1) / (F·σ·√τ);   vega (per 1 vol-pt) = F·e^{−rτ}·n(d1)·√τ / 100
```
`N(·)` is the Abramowitz & Stegun rational approximation (Handbook of Mathematical Functions,
formula 26.2.17, |error| < 7.5×10⁻⁸) — not a library call, coded directly in `normCdf`. The
platform's backend cross-check (`POST /api/v1/climate-derivatives/price-eua-option`,
`backend/services/climate_derivatives_engine.py::price_eua_option`) prices BSM **on spot** (not on
the forward); with carry `u = 0` the two formulations are mathematically identical because
`F = S·e^{rτ}` makes Black-76-on-F collapse to BSM-on-S — the desk explicitly uses this identity as
its own correctness check (`runXcheck`), flagging Δ ≈ 0 as validating both implementations and any
non-zero gap under `u ≠ 0` as the carry effect, not a bug.

### 7.4 Implied-vol surface: bilinear interpolation (`bilinearVol`, deskMath.js lines 49–70)

Grid axes: strike moneyness `K/S ∈ {0.8, 0.9, 1.0, 1.1, 1.2}` (ascending), tenor
`τ ∈ {0.5, 1, 2, 3}` years (ascending); `grid[i][j]` = vol% at that node. A query point is located
between its bracketing nodes on each axis, weights computed as fractional distance
(`wm, wt ∈ [0,1]`), and the four corner values combined as
`(1−wm)(1−wt)·v00 + wm(1−wt)·v10 + (1−wm)wt·v01 + wm·wt·v11`. Queries outside the grid are **clamped
flat** to the hull (no extrapolated smile is invented). At an exact node the weights collapse to
{1,0}, so quoted node values reproduce exactly. The default smile (`defaultSurface`) is a **labeled
market-typical shape, not observed quotes**: OTM puts rich (carbon downside/compliance-demand skew:
smile offsets `{0.8: +6, 0.9: +3, 1.0: 0, 1.1: +1.5, 1.2: +3}` vol points over the flat base), with
the skew flattening by tenor via `flatten(τ) = 1/(1 + 0.4·(τ − τ_min))`. All 20 nodes are
user-editable in the UI.

### 7.5 Worked example — one option price, traced and numerically verified

Default state: spot `S = €65`, `r = 3.5%`, carry `u = 0`, flat vol 35% (all labeled defaults near
the engine's own reference); option panel default strike `K = €70`, tenor `τ = 1y`, vol source =
surface.

**Forward:** `F = 65 · e^{0.035×1} = 65 × 1.035620 = €67.315/t`.

**Surface vol at K/S = 70/65 = 1.07692, τ = 1y:** the default-smile grid gives node values
(vol%) at `m=1.0`: {35.0, 35.0, 35.0, 35.0} across all four tenors (smile offset 0 at ATM), and at
`m=1.1`: {36.5, 36.3, 35.9, 35.8} for τ = {0.5, 1, 2, 3}. At τ=1 exactly, the tenor weight is 0
(the query sits on the τ=1 node), so only the moneyness axis interpolates:
`wm = (1.07692 − 1.0)/(1.1 − 1.0) = 0.76923`;
`σ = (1 − 0.76923)×35.0 + 0.76923×36.3 = 8.0769 + 27.923 = 36.0%` exactly.

**Black-76:** `d1 = [ln(67.315/70) + 0.5×0.36²×1] / (0.36×1) = [−0.03911 + 0.0648] / 0.36 =
0.02569/0.36 = 0.07137`; `d2 = 0.07137 − 0.36 = −0.28863`. Discount `e^{−0.035} = 0.965605`.
`N(d1) = 0.51027`, `N(d2) = 0.38657` (Abramowitz–Stegun). **Call = 0.965605 × (67.315×0.51027 −
70×0.38657) = 0.965605 × (34.348 − 27.060) = 0.965605 × 7.288 ≈ €8.229/t.** **Put = 0.965605 ×
(70×0.61343 − 67.315×0.48973) = 0.965605 × (42.940 − 32.966) = 0.965605 × 9.974 ≈ €10.822/t.**
Delta_call = 0.5103, delta_put = −0.4553, gamma ≈ 0.01586, vega (per 1 vol-pt) ≈ €0.2587.
Put-call parity check: `Call − Put − e^{−rτ}(F−K) = 8.229 − 10.822 − 0.965605×(67.315−70) =
−2.593 − (−2.593) ≈ 2×10⁻¹⁵` — confirms the closed-form is internally consistent (verified by
direct Python re-implementation of the exact JS rounding behavior, not just approximated by hand).

### 7.6 Multi-leg strategy payoff & EU MSR mechanics

**Strategy payoff** (`legPayoff`/`strategyPayoff`, deskMath.js lines 84–94): each leg's intrinsic
value at terminal price `ST` is `max(ST−K,0)` (call) or `max(K−ST,0)` (put), signed by
`side ∈ {+1 long, −1 short}` and scaled by quantity; the aggregate strategy payoff is the pointwise
sum — e.g. the default **collar preset** (long put @ 90% strike + short call @ 110% strike) is
literally `legPayoff(put) + legPayoff(call)` with no cross term, which the desk's own verification
suite asserts directly. Calendar legs beyond the nearest expiry are re-marked with Black-76 at their
remaining tenor and the same surface vol — a documented static-vol simplification, not a
stochastic-vol calendar model.

**EU Market Stability Reserve** (`MSR_PARAMS`/`msrAction`, deskMath.js lines 96–129), citing
**Decision (EU) 2015/1814, as amended by Decision (EU) 2018/410 and Decision (EU) 2023/959
("Fit for 55")** exactly as coded:
```
TNAC > 1,096 Mt              → intake = 24% of TNAC (2019–2030), 12% from 2031
833 Mt < TNAC ≤ 1,096 Mt      → intake = TNAC − 833 Mt          (2023/959 anti-cliff buffer band)
TNAC < 400 Mt                 → release 100 Mt to auctions
400–833 Mt                    → no action
```
Worked example on the page's own default TNAC path (`MSR_DEFAULT_PATH`), year **2025, TNAC = 1,050
Mt**: since `833 < 1,050 ≤ 1,096`, the buffer-band rule applies (not the 24% headline rate):
`intake = 1,050 − 833 = 217 Mt` (no `ratePct` shown for this band, by design — it is not a
percentage-of-TNAC rule). Contrast with the illustrative full-intake case the UI parameterizes:
at `TNAC = 1,200 Mt` (> 1,096, year ≤ 2030) intake would be `24% × 1,200 = 288 Mt`; and at
`TNAC = 350 Mt` (< 400) the mechanism instead **releases** the fixed `100 Mt` regardless of how far
below 400 the TNAC sits (the release amount is a flat rule, not proportional). The desk explicitly
notes this is a rules-mechanics illustration on a *user* TNAC path (labeled illustrative shape),
not a TNAC forecast, and that in reality each year's intake shrinks the following year's TNAC — a
feedback loop the model deliberately does not auto-couple (the user supplies a self-consistent path
if desired).

### 7.7 Data provenance & limitations

- **Real, hand-authored regulatory parameters, quoted exactly as coded**: the MSR thresholds
  (833/1,096/400 Mt) and rates (24% to 2030, 12% after) trace to the cited EU decisions; the
  EU ETS Phase 4 linear reduction factor default (4.3%/yr) cites Directive 2023/958.
- **Live engine data**: `GET /api/v1/climate-derivatives/ref/eua-market` prefills spot/vol/rate
  (labeled defaults €65, 35%, 3.5% approximate this reference even when the endpoint is
  unreachable); `POST /price-eua-option` cross-checks the desk's own Black-76; `POST
  /api/v1/carbon-price-ets/eu-ets-forecast` supplies the only scenario price path the hedge program,
  cost-of-delay and cost-averaging panels ever use — none of those three panels fabricate a
  fallback price when the engine is offline.
- **Labeled desk conventions, editable**: the default vol-surface smile shape, UKA/CCA levels and
  their historical-range notes, MSR TNAC path, margin IM%/VM-stress%, hedge-ratio ladder, and the
  ICP/abatement-rate sustainability inputs are all explicitly flagged as non-data assumptions.
- The strategy builder's calendar-leg repricing uses one static vol per remaining tenor rather than
  a full stochastic-vol term structure — a documented simplification for multi-tenor books.
- Cross-market EUA–UKA/EUA–CCA spread "arbitrage" is explicitly labeled non-executable by physical
  delivery (the underlyings are not fungible); the ladder is a scenario P&L table, not a tradeable
  basis model.

**Framework alignment:** Black, F. (1976), "The pricing of commodity contracts" · Abramowitz &
Stegun, *Handbook of Mathematical Functions* 26.2.17 · Decision (EU) 2015/1814 as amended by
2018/410 and 2023/959 (MSR) · Directive (EU) 2023/958 (Phase 4 LRF) · IFRS 9 §§2.4–2.5 (own-use),
6.4.1(c) (economic relationship), B6.2.4 (written options).

## 8 · Model Specification

**Status: implemented.** `deskMath.js` is the single source of truth for every formula below,
imported unmodified by the page and (per its own header) intended to be `require()`-able directly
by Node verification scripts — i.e. the numbers in this spec are the numbers the desk renders.

**8.1 Purpose & scope.** Price and risk-manage EU Allowance compliance exposure: forward curve
construction, vanilla and multi-leg option pricing, a hedge program against a declining free
allocation, EU MSR supply-mechanics analysis, and IFRS 9 hedge-accounting classification — for a
compliance-obligated entity's EUA desk.

**8.2 Conceptual approach.** A cost-of-carry forward curve anchors Black-76 option pricing off a
user-editable, bilinearly-interpolated implied-vol surface; a multi-leg payoff engine sums
per-leg intrinsic values (with a static-vol calendar approximation for mixed-tenor books); a
rules-based (not stochastic) EU MSR engine applies the exact legislated thresholds to a
user-supplied TNAC path; the hedge program combines locked-forward costs for the hedged fraction
with live scenario-engine prices for the open fraction.

**8.3 Mathematical specification.**
```
F(τ)      = S·e^{(r+u)τ}
σ(K,τ)    = bilinear interpolation of the strike-moneyness×tenor grid, clamped to the hull
d1,d2     = [ln(F/K) ± σ²τ/2] / (σ√τ)  (± as defined in Black-76)
Call, Put = e^{−rτ}[F·N(d1)−K·N(d2)],  e^{−rτ}[K·N(−d2)−F·N(−d1)]
Strategy payoff(ST) = Σ_legs side·qty·intrinsic(leg, ST)
MSR(TNAC, year): 24%/12% intake above 1,096 Mt; TNAC−833 in the 833–1,096 buffer band;
                 100 Mt release below 400 Mt; no action 400–833 Mt
HedgedCost = hedgedVol · F(τ) [futures] or hedgedVol · (collarEff + netPremium) [collar]
OpenCost   = openVol · scenarioPrice(year)   [live EU ETS forecast engine only]
```

**8.4 Data requirements.** Live: EUA spot/vol/rate reference and BSM cross-check
(`climate_derivatives_engine`), EU ETS Phase-4 scenario price path
(`carbon_price_ets_engine.forecast_eu_ets_price`). User: vol-surface node overrides, strategy legs,
UKA/CCA levels and FX, TNAC path, hedge-program emissions/allocation/ratios, margin and
sustainability assumptions. No external market-data feed is wired in; live figures come exclusively
from the platform's own two engines named above.

**8.5 Validation & benchmarking.** Already implemented in-code: put-call parity check on every
Black-76 quote (`parity = (Call−Put) − e^{−rτ}(F−K)`, displayed to the user); the BSM cross-check
against the backend engine (identical under `u=0`); bilinear-interpolation exactness at grid nodes;
the collar-is-literally-its-legs identity for the strategy builder. Recommended external
benchmark: compare the desk's default vol-surface shape and UKA/CCA range notes against live ICE/EEX
screens periodically (both explicitly labeled as needing verification, not live-sourced).

**8.6 Limitations & model risk.** Vol surface, MSR TNAC path, and cross-market levels are user
inputs or labeled desk conventions, not live market data — treat every "labeled default" as a
placeholder to override before real use. The MSR projection does not self-couple intake to next
year's TNAC (the user must supply an internally consistent path). Calendar-spread legs use a
static-vol re-mark rather than a full term-structure model. Margin figures are a documented planning
convention, explicitly not an exchange IM/VM schedule. Cost-of-delay and cost-averaging compare
against exactly one scenario path — this is scenario arithmetic, not a probability-weighted expected
value.

## 9 · Future Evolution

### 9.1 Evolution A — Live EUA curves and calibrated vol surface behind the real pricing engine (analytics ladder: rung 2 → 4)

**What.** This is one of the platform's most quantitatively serious pages: a real Black-76 options pricer (`black76`, Abramowitz-Stegun CDF, cost-of-carry forward, put-call parity check), an editable implied-vol surface with a tenor-decaying smile, EU ETS Market Stability Reserve (MSR) TNAC path modelling, and a multi-year hedging engine (futures/collar with net-premium and bounded-cost logic). It also registers the real `carbon_price_ets.py` routes (EU ETS forecast, CBAM exposure, ETS compliance, price pathways). The gap: the spot/forward inputs and vol surface are user-set/seeded rather than fed from live EUA market data, and the MSR path is a default rather than the current regulatory trajectory. Evolution A connects the engine to real markets.

**How.** (1) Live EUA spot and forward curve from the `carbon_price_ets.py` forecast route and real market feeds, replacing the seeded `spot = 10 + i×0.6 + sr()×4` input. (2) A calibrated vol surface from observed EUA option prices (ICE EUA options where licensable) rather than the manual grid — the Black-76 machinery is ready, it just needs real vols. (3) The MSR TNAC path parameterised from the actual EU ETS reform trajectory (the `MSR_PARAMS`/`MSR_DEFAULT_PATH` become the current regulatory schedule). (4) Rung 4: the hedging engine gains scenario-based forecasting using the ETS price-pathway route, so hedge decisions are made against a forecast distribution, not a single scenario. Extract the options/hedging math to a backend route for reuse and testing; pin Black-76 in bench_quant.

**Prerequisites.** EUA market data (spot/forward is obtainable; option-implied vols are the licensing constraint — a labelled historical-vol fallback if unavailable); the MSR reform parameters. **Acceptance:** the forward curve and vols derive from real EUA data with vintages; put-call parity holds on the pricer (bench-pinned); the MSR path matches the current regulatory schedule; hedge cost responds to real forward levels.

### 9.2 Evolution B — Carbon-hedging desk copilot (LLM tier 2)

**What.** A compliance buyer or trading desk asks "price a 1-year EUA call struck at €80", "structure a costless collar to hedge our 2026-2030 EUA short", "what's our open position after a 60% hedge ratio?" — the copilot runs the Evolution-A Black-76 pricer and hedging engine, reports option values, Greeks, net premium, and hedged-vs-open cost across scenarios, every figure tool-traced.

**How.** Tool schemas over the Evolution-A options/hedging routes and the `carbon_price_ets.py` forecast/pathway routes; the multi-year hedge engine (emissions allocation decline, net-short, hedge ratio, collar bounds) is the copilot's core tool. Grounding corpus: this Atlas record plus the EU ETS/MSR reference data. The copilot's honesty duty: derivatives pricing is model- and vol-dependent, so it states the vol surface and forward curve used per quote, and presents hedged-cost outcomes across the scenario set rather than a single point — carbon-price uncertainty is the whole reason to hedge. Mutating actions (saving a hedge structure) gated behind confirmation.

**Prerequisites (hard).** Evolution A's real curves and calibrated vols — a copilot quoting option prices off seeded spots and a manual vol grid would misprice hedges with real cost consequences. **Acceptance:** every option value, Greek, and hedge cost traces to a tool response; each quote states its forward and vol inputs; hedged-cost answers span the scenario set; the Black-76 pricer's parity check passes.