# Carbon Wallet
**Module ID:** `carbon-wallet` · **Route:** `/carbon-wallet` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Enterprise carbon credit portfolio management platform covering retirement workflows, chain-of-custody tracking, registry balance reconciliation, and net-zero claim substantiation. Manages voluntary credits (Verra VCU, Gold Standard GS-VER), compliance units (EUAs, CCAs), and CORSIA-eligible units in a unified credit ledger with ISAE 3000-auditable retirement records.

> **Business value:** A disciplined enterprise carbon wallet is essential for substantiating net-zero claims under SBTi Net-Zero Standard and voluntary frameworks. ICVCM Core Carbon Principles filtering ensures the portfolio avoids low-quality offsets that attract greenwashing scrutiny, while registry reconciliation and ISAE 3000-grade retirement certificates provide the audit trail required for external verification.

**How an analyst works this module:**
- Credit Inventory tab shows full portfolio by registry, project type, and vintage
- Purchase Workflow tab records new credit acquisitions with registry serial verification
- Retirement Wizard initiates retirement with beneficiary, claim type, and vintage selection
- Retirement Certificates tab generates and stores ISAE 3000-auditable retirement records
- Registry Reconciliation verifies ledger balance against live Verra/GS registry
- Quality Analytics tab scores portfolio on ICVCM Core Carbon Principles

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BADGES`, `CARBON_BUDGETS`, `CATEGORY_COLORS`, `OFFSET_PRICE_PER_TONNE`, `PIE_COLORS`, `SAVINGS_TIPS`, `SPENDING_CARBON_INTENSITY`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BADGES` | 8 | `name`, `icon`, `check` |
| `SAVINGS_TIPS` | 9 | `saving_kg`, `unit`, `icon` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `OFFSET_PRICE_PER_TONNE` | `15; // USD` |
| `cat` | `cats[Math.floor(sr(_sc++) * cats.length)];` |
| `amount` | `+(5 + sr(_sc++) * 120).toFixed(2);` |
| `daysAgo` | `Math.floor(sr(_sc++) * 180);` |
| `periodTxns` | `useMemo(() => transactions.filter(periodFilter), [transactions, periodFilter]); const totalCarbon = useMemo(() => periodTxns.reduce((s, t) => s + t.carbon_kg, 0), [periodTxns]);` |
| `totalSpend` | `useMemo(() => periodTxns.reduce((s, t) => s + t.amount_usd, 0), [periodTxns]);` |
| `dailyAvg` | `periodTxns.length > 0 ? totalCarbon / Math.max(daysInPeriod, 1) : 0;` |
| `periodBudget` | `budget.daily_kg * daysInPeriod;` |
| `budgetUsedPct` | `periodBudget > 0 ? (totalCarbon / periodBudget * 100) : 0;` |
| `budgetRemaining` | `Math.max(0, periodBudget - totalCarbon);` |
| `carbonPerUsd` | `totalSpend > 0 ? totalCarbon / totalSpend : 0;` |
| `treesNeeded` | `totalCarbon / 22;` |
| `topCategory` | `catBreakdown[0]?.name \|\| 'N/A';` |
| `dayTotal` | `transactions.filter(t => t.date.slice(0, 10) === ds).reduce((s, t) => s + t.carbon_kg, 0);` |
| `timelineData` | `useMemo(() => { const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));` |
| `key` | ``${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;` |
| `label` | `d.toLocaleString('default', { month: 'short', year: '2-digit' });` |
| `intensityData` | `useMemo(() => { return Object.entries(SPENDING_CARBON_INTENSITY).map(([k, v]) => ({ name: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), intensity: v.carbon_per_usd, icon: v.icon, })).sort((a, b) => b.intensity - a.intensity);` |
| `richLean` | `useMemo(() => { const withRatio = periodTxns.filter(t => t.amount_usd > 0).map(t => ({ ...t, ratio: t.carbon_kg / t.amount_usd }));` |
| `sorted` | `[...withRatio].sort((a, b) => b.ratio - a.ratio);` |
| `peerPercentile` | `useMemo(() => { const annualRate = totalCarbon / Math.max(daysInPeriod, 1) * 365;` |
| `earnedBadges` | `useMemo(() => BADGES.filter(b => b.check(transactions, budget)), [transactions, budget]);  // Annual summary const annualSummary = useMemo(() => { const yearTxns = transactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear());` |
| `total` | `yearTxns.reduce((s, t) => s + t.carbon_kg, 0);` |
| `worst` | `months.length > 0 ? months.reduce((a, b) => a[1] > b[1] ? a : b) : null;` |
| `carbon` | `fCarbonOverride ? parseFloat(fCarbonOverride) : +(amt * (cat?.carbon_per_usd \|\| 0.5)).toFixed(1);` |
| `txn` | `{ id: `TXN-${Date.now()}`, date: new Date(fDate).toISOString(), description: fDesc \|\| 'Purchase', amount_usd: amt, category: fCategory, carbon_kg: carbon, method: 'manual', items: [], offset: false, notes: '' };` |
| `parts` | `line.split(/[,\t]+/).map(s => s.trim());` |
| `amt` | `parseFloat(amtStr.replace(/[^0-9.-]/g, '')) \|\| 0;` |
| `rows` | `transactions.map(t => `"${new Date(t.date).toLocaleDateString()}","${t.description}",${t.amount_usd},"${t.category}",${t.carbon_kg},"${t.method}"`).join('\n');` |
| `blob` | `new Blob([hdr + rows], { type: 'text/csv' });` |
| `sBadge` | `(bg) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: bg, color: '#fff', fontSize: 11, fontWeight: 700, marginRight: 6 });` |
| `ratePerDay` | `totalCarbon / Math.max(daysInPeriod, 1);` |
| `projected` | `ratePerDay * 365 / 1000;` |
| `dayAvg` | `dayTotals.map((total, i) => ({` |
| `daysToExhaust` | `ratePerDay > 0 ? (budget.annual_tonnes * 1000) / ratePerDay : Infinity;` |
| `projectedAnnual` | `ratePerDay * 365 / 1000;` |
| `yearTxns` | `[...transactions].filter(t => new Date(t.date).getFullYear() === now.getFullYear()).sort((a, b) => new Date(a.date) - new Date(b.date));` |
| `dayOfYear` | `Math.floor((new Date(t.date) - new Date(new Date(t.date).getFullYear(), 0, 0)) / 86400000);` |
| `last` | `dataPoints[dataPoints.length - 1];` |
| `yourRate` | `totalCarbon / Math.max(daysInPeriod, 1) * 365 / 1000;` |

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
**Frontend seed datasets:** `BADGES`, `PIE_COLORS`, `SAVINGS_TIPS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Live Credit Balance | `Purchased – Retired – Transferred` | Registry APIs | Current unretired carbon credit balance across all registry accounts |
| Retired Credits (YTD) | — | Retirement ledger | Volume of credits retired year-to-date for net-zero claim substantiation |
| Average Credit Quality Score | `ICVCM CCP criteria` | ICVCM | Quality score reflecting additionality, permanence, and MRV robustness of portfolio credits |
- **Verra / Gold Standard registry APIs** → Ingest credit serial numbers and metadata; verify chain-of-custody; reconcile against ledger → **Registry-verified credit inventory with balance reconciliation and gap flags**
- **Internal retirement instructions** → Execute retirement in source registry; generate SHA-256 certificate; update net balance → **Immutable retirement certificates with full chain-of-custody for net-zero claim audit**

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
**Methodology:** Credit ledger with retirement accounting
**Headline formula:** `Net_balance = Purchased – Retired – Transferred; Retirement_certificate = SHA256(credit_serial || entity || date || tCO2e_retired)`

Each credit purchase, transfer, and retirement is recorded as a double-entry ledger transaction. Retirement is irreversible: retired credits are cancelled in the source registry and a cryptographic certificate is generated. Chain-of-custody metadata links each credit to its original project, vintage, methodology, and verification body.

**Standards:** ['Verra Registry Rules', 'Gold Standard Registry', 'ICVCM Core Carbon Principles v4']
**Reference documents:** Verra VCS Program Registry Rules v4; Gold Standard for the Global Goals Registry; ICVCM Core Carbon Principles v4 (2023); SBTi Net-Zero Standard Carbon Removal and Neutralisation

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

> ⚠️ **Guide↔code mismatch (substantial).** The guide describes an **enterprise carbon-credit portfolio /
> retirement ledger**: "Net_balance = Purchased − Retired − Transferred", SHA-256 retirement certificates,
> Verra/Gold-Standard registry reconciliation, chain-of-custody, ICVCM CCP quality scoring, ISAE 3000-
> auditable records. **None of that exists in the code.** The actual module is a **personal / consumer
> carbon-footprint budget tracker**: it estimates the CO₂ of individual *spending* transactions (spend ×
> carbon-intensity by merchant-category), tracks that footprint against a per-capita Paris-pathway budget,
> and gamifies reduction with badges and savings tips. There is no credit inventory, no retirement, no
> registry, no SHA-256, no VCU. Sections below document the consumer footprint tracker as coded; §8
> specifies the enterprise credit wallet the guide describes.

### 7.1 What the module computes

A spend-based consumer footprint against a carbon budget:

```js
carbon_kg     = amount_usd × SPENDING_CARBON_INTENSITY[category].carbon_per_usd   // per transaction
totalCarbon   = Σ periodTxns.carbon_kg
totalSpend    = Σ periodTxns.amount_usd
carbonPerUsd  = totalCarbon / totalSpend                       // footprint efficiency
periodBudget  = budget.daily_kg × daysInPeriod                 // Paris-pathway allowance
budgetUsedPct = totalCarbon / periodBudget × 100
treesNeeded   = totalCarbon / 22                               // 22 kg CO2/tree/yr offset proxy
projectedAnnual = ratePerDay × 365 / 1000                      // tonnes/yr run-rate
offsetCost    = tonnes × OFFSET_PRICE_PER_TONNE ($15/t)
```

### 7.2 Parameterisation

**Carbon budgets** (`CARBON_BUDGETS` — provenance: real per-capita figures): Paris 1.5 °C = 2.3 t/yr
(6.3 kg/day), Paris 2 °C = 4.0 t/yr, global avg 4.7 t, India 1.9 t, USA 15.5 t, EU 6.8 t. These are accurate
per-capita emission levels.

**Spending carbon intensities** (`SPENDING_CARBON_INTENSITY`, kgCO₂e per $ by merchant category — real EEIO-
style factors, mapped to MCC codes):

| Category | kgCO₂/$ | Category | kgCO₂/$ |
|---|---|---|---|
| Fuel | 2.31 | Groceries | 0.75 |
| Airlines | 1.85 | Restaurants | 0.68 |
| Electricity | 1.42 | Home improvement | 0.55 |
| Clothing | 0.45 | Public transport | 0.25 |
| Electronics | 0.35 | Subscriptions | 0.08 |

**Savings tips** (`SAVINGS_TIPS`, real reduction figures: train vs short-haul flight saves 115 kg/1000km;
beef→plant-based 25.1 kg/kg) and **badges** (gamification). The `OFFSET_PRICE_PER_TONNE = $15` is a voluntary-
market retail-offset proxy.

**Synthetic seed data** (`sr()` via `_sc` counter): demo transactions (category, amount $5–125, days-ago).

### 7.3 Calculation walkthrough

Each transaction's carbon = amount × the category's intensity (or a manual override). The period view sums
carbon and spend, compares to the daily-budget × days allowance, and derives budget-used %, carbon-per-$,
trees-needed, and a projected annual run-rate. A peer-percentile places the user's annualised rate against
the budget benchmarks. Badges fire on transaction counts and low-carbon streaks.

### 7.4 Worked example (a month of spending)

Transactions: $200 fuel, $400 groceries, $150 airlines, $100 electricity.
- Fuel: `200 × 2.31 = 462 kg`; Groceries: `400 × 0.75 = 300 kg`; Airlines: `150 × 1.85 = 277.5 kg`;
  Electricity: `100 × 1.42 = 142 kg`. `totalCarbon = 1,181.5 kg`; `totalSpend = $850`.
- `carbonPerUsd = 1,181.5 / 850 = 1.39 kg/$`.
- Budget (Paris 1.5 °C, 30 days): `6.3 × 30 = 189 kg`. `budgetUsedPct = 1,181.5 / 189 × 100 = 625%` — 6.25×
  over the 1.5 °C personal allowance.
- `treesNeeded = 1,181.5 / 22 = 53.7 trees`; offset at $15/t: `1.18t × 15 = $17.7`.

### 7.5 Data provenance & limitations

- **Budgets, spend intensities, and savings figures are real** (per-capita emissions, EEIO spend factors);
  demo transactions are synthetic (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- **This is a consumer footprint tool, not the enterprise credit ledger the guide claims** — none of the
  retirement/registry/certificate functionality exists.
- Spend-based estimation is inherently low-precision (EEIO averages); real merchant-level product carbon is
  not modelled.

**Framework alignment:** GHG Protocol Scope 3 (spend-based method) — the spend × EEIO-factor estimation is the
personal-footprint analogue of Scope 3 Category 1 spend-based accounting · IPCC per-capita carbon budgets —
the Paris 1.5 °C (2.3 t) / 2 °C (4.0 t) personal allowances. The guide's ICVCM CCP scoring, Verra/GS registry
rules, and SBTi Net-Zero retirement standards are **not** implemented — see §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's enterprise credit wallet is absent; this
specifies it (distinct from the consumer tool that ships).

### 8.1 Purpose & scope
Maintain an enterprise carbon-credit inventory across registries (Verra VCU, Gold Standard GS-VER, EUAs,
CORSIA units), execute irreversible retirements with auditable certificates, reconcile the internal ledger
against live registry balances, and score portfolio quality against ICVCM CCPs — for net-zero-claim
substantiation.

### 8.2 Conceptual approach
Double-entry credit ledger + append-only retirement log, benchmarked against Verra/Gold Standard registry
rules and Watershed/Sylvera credit-management platforms. Retirement generates a hash-committed certificate;
reconciliation compares ledger positions to registry API balances.

### 8.3 Mathematical specification

```
NetBalance   = Σ Purchased − Σ Retired − Σ Transferred        per serial / vintage / registry
RetireCert   = SHA256( serial ‖ entity ‖ date ‖ tCO2e ‖ beneficiary ‖ claimType )
Reconcile    : |LedgerBalance_r − RegistryBalance_r| = 0  ∀ registry r   (else flag gap)
QualityScore = Σ_p w_p · CCP_p(credit)                        ICVCM 10 CCPs, weighted
ClaimCover   = RetiredForClaim / ResidualEmissions            SBTi neutralisation coverage
```

| Parameter | Symbol | Source |
|---|---|---|
| CCP weights | w_p | ICVCM Core Carbon Principles v4 |
| Registry balances | RegistryBalance | Verra / Gold Standard registry APIs |
| Hash | SHA-256 | FIPS 180-4 |
| Claim standard | — | SBTi Net-Zero neutralisation |

### 8.4 Data requirements
Credit serial numbers with project/vintage/methodology/VVB metadata, registry API access, ICVCM CCP flags,
residual-emissions figure for claim coverage. Platform holds credit metadata schemas (via CarbonCreditContext)
and pricing/quality modules; missing: registry API integration, retirement store, SHA-256.

### 8.5 Validation & benchmarking plan
Reconciliation must reach zero gap against Verra/GS registry balances. Retirement irreversibility tested
(retired serials cannot re-enter inventory). Certificate hash verified against payload. Benchmark CCP quality
score against BeZero/Sylvera ratings for overlapping credits.

### 8.6 Limitations & model risk
Registry API latency/availability is the main operational risk — cache with staleness flags. Retirement is
irreversible, so pre-retirement validation must be strict (serial uniqueness, no double-retire). CCP scoring
depends on ICVCM assessment coverage, which is incomplete across methodologies — flag unassessed credits
rather than defaulting them to high quality.

## 9 · Future Evolution

### 9.1 Evolution A — Reconcile the identity split and build the real enterprise credit ledger (analytics ladder: rung 1 → 2)

**What.** There is a striking mismatch between the module's stated identity and its code. The overview describes an **enterprise carbon-credit wallet** (retirement workflows, chain-of-custody, registry reconciliation, ICVCM CCP portfolio scoring, ISAE 3000 retirement certificates for VCU/GS-VER/EUA/CORSIA units). But the frontend code is a **personal carbon-footprint tracker**: transactions with `carbon_kg`/`amount_usd`, spending-category carbon intensity, daily carbon budgets, badges, savings tips, tree-equivalents (`treesNeeded = totalCarbon/22`), and peer percentiles — all seeded (`sr()`-generated transactions, `OFFSET_PRICE_PER_TONNE = 15`). The registered backend is the generic `carbon.py` credit suite. Evolution A must first resolve which product this is, then build it.

**How.** The disposition decision comes first: either (a) rename/rescope the module to the personal carbon-footprint tracker it actually is (and source the spending-carbon-intensity factors, which are the one real analytic), or (b) build the enterprise wallet the overview promises. For (b): a real credit ledger (holdings by registry/vintage/serial), a retirement workflow with SHA-256-hashed ISAE 3000 certificates (reuse the genuine hash-chain from `carbon-credit-audit-trail`), registry reconciliation against Verra/GS APIs, and ICVCM CCP portfolio scoring (reuse `carbon-institutions-taxonomy`'s quality engine). Given the platform's enterprise focus, (b) is likely intended and the personal-tracker code is a mis-scaffold. Rung 2 follows with retirement-scenario planning against net-zero claim requirements.

**Prerequisites (hard).** The identity decision — the current code and the documented purpose are different products, and no evolution proceeds without resolving that. For (b): registry APIs, a ledger data model, the shared hash-chain and quality engines. **Acceptance:** the module's code and documented purpose describe the same product; if (b), retirements produce verifiable ISAE 3000 certificates and the ledger reconciles against registry balances.

### 9.2 Evolution B — Retirement-and-claim-substantiation copilot (LLM tier 2)

**What.** Assuming the enterprise-wallet disposition: net-zero teams ask "retire 10,000 tCO₂e of high-CCP credits for our FY25 residual-emissions claim", "reconcile our ledger against Verra", "does our portfolio meet SBTi Net-Zero Standard quality requirements?" — the copilot runs the Evolution-A ledger, retirement, reconciliation, and CCP-scoring tools, and drafts the ISAE 3000 claim-substantiation record, every credit and score tool-traced.

**How.** Tool schemas over the Evolution-A wallet routes; retirement (irreversible) gated behind explicit user confirmation + RBAC. Grounding corpus: this Atlas record plus the ICVCM CCP / SBTi Net-Zero Standard / ISAE 3000 references. The copilot's honesty duty: net-zero claim substantiation is a greenwashing-scrutiny surface, so it reports CCP quality from the real scoring (never asserting credits are high-integrity beyond their rating), surfaces registry-reconciliation discrepancies rather than smoothing them, and ensures retirement records carry verifiable certificates. If the personal-tracker disposition is chosen instead, the copilot scopes to footprint coaching with sourced intensity factors.

**Prerequisites (hard).** Evolution A's identity resolution and ledger — a copilot cannot manage a wallet that doesn't exist, and the current personal-tracker code offers no enterprise credit surface to tool-call. **Acceptance:** every credit, retirement, and CCP score traces to a tool response; retirement requires confirmation; claim-substantiation records embed verifiable certificates; reconciliation discrepancies are surfaced.