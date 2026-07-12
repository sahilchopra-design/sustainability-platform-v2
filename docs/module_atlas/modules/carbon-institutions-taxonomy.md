# Carbon Institutions Taxonomy
**Module ID:** `carbon-institutions-taxonomy` · **Route:** `/carbon-institutions-taxonomy` · **Tier:** A (backend vertical) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Registry and methodology taxonomy for the voluntary carbon market, comparing Verra VCS, Gold Standard, ACR, CAR, and BioCarbon Fund across methodology families (AFOLU, energy, industry, waste), credit type taxonomy (avoidance vs removal), and quality label tiers from BeZero, Sylvera, and Calyx Global.

> **Business value:** Used by carbon procurement officers, corporate sustainability teams, and impact investors to source, screen, and rank voluntary carbon credits for high-integrity offset and net-zero claims.

**How an analyst works this module:**
- Browse registry taxonomy and filter by methodology family
- Compare quality tier ratings across BeZero/Sylvera/Calyx for selected credits
- Assess permanence and additionality scores for procurement shortlist
- Generate offset procurement policy compliance report

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARTICLE6_PILOTS`, `CDP_SCORES`, `CREDIT_QUALITY`, `Card`, `ICROA_STANDARDS`, `ICVCM_CCPS`, `ISSUERS`, `Kpi`, `MACC_MEASURES`, `OFFTAKE_TERMS`, `PERMANENCE_HAZARDS`, `Pill`, `ROADMAP`, `SBTI_TARGETS`, `SectionH`, `TABS`, `VCMI_CLAIMS`, `VCM_PROJECTS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ISSUERS` | 30 | `name`, `sector`, `region`, `mcap`, `cdp`, `sbti`, `art6`, `vcmi`, `icvcm` |
| `VCM_PROJECTS` | 25 | `name`, `type`, `region`, `country`, `standard`, `vintage`, `volume`, `price`, `ccp`, `corsia`, `icroa`, `rating` |
| `ICVCM_CCPS` | 10 | `pillar`, `name`, `desc`, `compliance` |
| `VCMI_CLAIMS` | 12 | `claim`, `vintage`, `volume`, `coverage`, `prereqCheck`, `removals`, `avoidance` |
| `ARTICLE6_PILOTS` | 12 | `host`, `buyer`, `type`, `activity`, `itmos`, `ca`, `start`, `price` |
| `ICROA_STANDARDS` | 8 | `scope`, `projects`, `mtIssued`, `endorsed`, `notes` |
| `ROADMAP` | 18 | `q`, `title`, `actor`, `impact`, `desc` |
| `MACC_MEASURES` | 20 | `measure`, `sector`, `cost`, `potential`, `tech` |
| `OFFTAKE_TERMS` | 10 | `buyer`, `seller`, `type`, `volume`, `tenor`, `strike`, `floor`, `ceiling`, `defaultHaz`, `vol` |
| `TABS` | 20 | `label` |
| `METHODS` | 3 | `name`, `factor`, `desc` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `cdpColor` | `(g) => g === 'A' ? T.green : g === 'A-' ? T.sage : g === 'B' ? T.sageL : g === 'B-' ? T.gold : g === 'C' ? T.goldL : g === 'C-' ? T.amber : g === 'D' ? '#e08a3a' : T.red;` |
| `CDP_SCORES` | `ISSUERS.map((iss, i) => {` |
| `trajectory` | `years.map((y, j) => {` |
| `base` | `iss.icvcm / 100;` |
| `trend` | `0.45 + base * 0.45 + j * 0.03 * base + sr(hashStr(iss.ticker) + j) * 0.08 - 0.04;` |
| `SBTI_TARGETS` | `ISSUERS.map((iss, i) => {` |
| `baseY` | `2018 + Math.floor(sr(i) * 3);` |
| `tgtY` | `2030 + Math.floor(sr(i + 5) * 10);` |
| `redux` | `iss.sbti === '1.5C-Val' ? 46 + sr(i + 2) * 10 : iss.sbti === 'WB2C-Val' ? 30 + sr(i + 2) * 8 : iss.sbti === 'Committed' ? 25 + sr(i + 2) * 8 : 0;` |
| `CREDIT_QUALITY` | `VCM_PROJECTS.map((p, i) => {` |
| `addScore` | `p.ccp ? 70 + sr(h) * 25 : 30 + sr(h) * 35;` |
| `permScore` | `p.type === 'DAC' \|\| p.type === 'CCS' \|\| p.type === 'Biochar' \|\| p.type === 'EW' ? 90 + sr(h + 1) * 8 : p.type === 'REDD+' \|\| p.type === 'IFM' \|\| p.type === 'ARR' ? 50 + sr(h + 1) * 20 : 70 + sr(h + 1) * 15;` |
| `mrv` | `p.icroa ? 75 + sr(h + 2) * 20 : 40 + sr(h + 2) * 25;` |
| `cob` | `p.ccp ? 72 + sr(h + 3) * 22 : 45 + sr(h + 3) * 25;` |
| `sdg` | `p.standard.includes('CCB') \|\| p.standard === 'GS' \|\| p.standard === 'Plan Vivo' ? 80 + sr(h + 4) * 15 : 50 + sr(h + 4) * 25;` |
| `overall` | `(addScore * 0.25 + permScore * 0.2 + mrv * 0.2 + cob * 0.2 + sdg * 0.15);` |
| `cdpA` | `ISSUERS.filter(i => i.cdp === 'A' \|\| i.cdp === 'A-').length;` |
| `vcmMt` | `VCM_PROJECTS.reduce((s, p) => s + p.volume, 0);` |
| `art6Mt` | `ARTICLE6_PILOTS.reduce((s, p) => s + p.itmos, 0);` |
| `cdpDist` | `useMemo(() => { const grades = ['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'F'];` |
| `sbtiDist` | `useMemo(() => { const tiers = ['1.5C-Val', 'WB2C-Val', 'Committed', 'None'];` |
| `avgDisc` | `CDP_SCORES.length ? CDP_SCORES.filter(c => c.scope3Disc).length / CDP_SCORES.length * 100 : 0;` |
| `avgVerif` | `CDP_SCORES.length ? CDP_SCORES.filter(c => c.verif === 'Reasonable').length / CDP_SCORES.length * 100 : 0;` |
| `tierCounts` | `useMemo(() => { const tiers = ['1.5C-Val', 'WB2C-Val', 'Committed', 'None'];` |
| `priceRange` | `useMemo(() => filteredVCM.map(p => ({ x: p.volume, y: p.price, z: p.rating === 'A' ? 90 : p.rating === 'B' ? 70 : p.rating === 'C' ? 50 : p.rating === 'D' ? 30 : 10, name: p.name, type: p.type })), [filteredVCM]);` |
| `radarData` | `ICVCM_CCPS.map(c => ({ ccp: `CCP${c.num}`, value: c.compliance }));` |
| `removAvd` | `useMemo(() => VCMI_CLAIMS.map(v => ({ entity: v.entity, Removals: v.removals, Avoidance: v.avoidance })), []);` |
| `endorsedBar` | `ICROA_STANDARDS.map(s => ({ std: s.std, issued: s.mtIssued, projects: s.projects, endorsed: s.endorsed ? 1 : 0 }));` |
| `summary` | `useMemo(() => { const compVol = bridgeFlow.filter(b => b.type === 'Compliance').reduce((s, b) => s + b.vol, 0);` |
| `volVol` | `bridgeFlow.filter(b => b.type === 'Voluntary').reduce((s, b) => s + b.vol, 0);` |
| `total` | `compVol + volVol;` |
| `avg` | `filteredQuality.length ? filteredQuality.reduce((s, p) => s + p.overall, 0) / filteredQuality.length : 0;` |
| `distR` | `['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C'].map(r => ({ rating: r, count: filteredQuality.filter(p => p.qualityRating === r).length }));` |
| `compCred` | `useMemo(() => { return ISSUERS.map(iss => { const cdpW = iss.cdp === 'A' ? 95 : iss.cdp === 'A-' ? 85 : iss.cdp === 'B' ? 72 : iss.cdp === 'B-' ? 62 : iss.cdp === 'C' ? 50 : iss.cdp === 'C-' ? 40 : iss.cdp === 'D' ? 28 : 10;` |
| `sbtiW` | `iss.sbti === '1.5C-Val' ? 95 : iss.sbti === 'WB2C-Val' ? 78 : iss.sbti === 'Committed' ? 55 : 15;` |
| `composite` | `cdpW * 0.25 + sbtiW * 0.3 + vcmiW * 0.15 + art6W * 0.1 + icvcmW * 0.2;` |
| `portfolio` | `useMemo(() => { return ISSUERS.slice(0, 20).map((iss, i) => { const h = hashStr(iss.ticker);` |
| `holdings` | `5 + Math.floor(sr(h) * 45);` |
| `creditsHeld` | `iss.vcmi === 'Platinum' \|\| iss.vcmi === 'Gold' ? 2 + sr(h + 1) * 8 : iss.vcmi === 'Silver' ? 0.5 + sr(h + 1) * 3 : iss.vcmi === 'Bronze' ? 0.1 + sr(h + 1) * 1.5 : 0;` |
| `exposureDollars` | `holdings * (iss.mcap / 1000) * 0.05;` |

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
**Frontend seed datasets:** `ARTICLE6_PILOTS`, `ICROA_STANDARDS`, `ICVCM_CCPS`, `ISSUERS`, `MACC_MEASURES`, `METHODS`, `OFFTAKE_TERMS`, `PTYPES`, `ROADMAP`, `STDS`, `TABS`, `VCMI_CLAIMS`, `VCM_PROJECTS`, `VINTAGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Methodology Quality Score | `weighted avg(registry_score, additionality_score, permanence_score)` | BeZero/Sylvera/Calyx ratings | Score 5 (AA/AAA tier): eligible for high-integrity corporate net-zero claims; Score <3: not recommended for scope 3 residual offsets. |
| Permanence Risk Rating | `reversal_probability × time_horizon_discount` | Methodology family + buffer pool analysis | Nature-based solutions have inherently higher permanence risk; technological removals (DACCS, BECCS) score Very Low. |
| Additionality Evidence Score | `financial_additionality × regulatory_surplus × common_practice` | Project-level documentation review | Scores <50 indicate projects that may have occurred anyway; critical screen for high-integrity offset procurement. |
- **Verra/GS/ACR/CAR project registries + BeZero/Sylvera ratings APIs** → Taxonomy classification → quality tier standardisation → permanence risk scoring → **VCM credit taxonomy database with multi-rater quality scores**

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
**Methodology:** VCM Registry-Methodology Taxonomy
**Headline formula:** `quality_score = registry_rigour_weight × methodology_permanence × additionality_score`

Each carbon credit is classified along four axes: registry governance quality, methodology family (AFOLU, energy, industrial, waste), credit type (emissions avoidance vs carbon removal), and vintage year. Quality tier ratings from BeZero, Sylvera, and Calyx Global are standardised to a 5-tier scale. Permanence risk is assessed separately for removal projects (forestry, soil) vs avoidance projects, given the materially higher reversal risk in nature-based solutions.

**Standards:** ['Verra VCS Standard v4.0', 'Gold Standard for the Global Goals v2.2', 'BeZero Carbon Rating Methodology']
**Reference documents:** Verra VCS Standard v4.0; Gold Standard for the Global Goals v2.2; Integrity Council for Voluntary Carbon Markets (ICVCM) Core Carbon Principles 2023

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
| `carbon-footprint-intelligence` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-reduction-projects` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-aware-allocation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-forward-curve` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-project-lifecycle` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-removal-markets` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-adjusted-valuation` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |
| `carbon-capture-finance` | engine:carbon_calculator, engine:methodology_engine, table:Manure, table:Wind, table:database, table:projects |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *registry/methodology
> taxonomy* with a multiplicative `quality_score = registry_rigour_weight × methodology_permanence
> × additionality_score` and BeZero/Sylvera/Calyx tier standardisation. **That formula and the
> multi-rater standardisation do not exist in code.** What the page actually implements is a
> 20-tab **carbon-institutions intelligence hub**: 30 real-name issuers scored on CDP grade, SBTi
> tier, VCMI tier, Article 6 participation and an `icvcm` field; a 25-project VCM book with a
> five-factor *additive* quality score whose sub-scores are `sr()`-seeded; ICVCM CCP compliance
> radar; VCMI claims volumes; Article 6.2 pilot ITMO flows; ICROA-endorsed standards; a MACC
> table; offtake terms; and a composite issuer-credibility score. Sections below document the
> code as written.

### 7.1 What the module computes

**(a) VCM project quality score** (per project, 0–100), five sub-scores each drawn from seeded
ranges conditioned on real categorical attributes, then combined additively:

```
h         = hashStr(project.id)                    // djb2-XOR hash → PRNG seed
addScore  = ccpLabel ? 70 + sr(h)·25   : 30 + sr(h)·35
permScore = {DAC,CCS,Biochar,EW} ? 90 + sr(h+1)·8
            : {REDD+,IFM,ARR}    ? 50 + sr(h+1)·20
            : otherwise            70 + sr(h+1)·15
mrv       = icroa ? 75 + sr(h+2)·20 : 40 + sr(h+2)·25
cob       = ccpLabel ? 72 + sr(h+3)·22 : 45 + sr(h+3)·25          // co-benefits
sdg       = {CCB,GS,Plan Vivo} ? 80 + sr(h+4)·15 : 50 + sr(h+4)·25
overall   = 0.25·addScore + 0.20·permScore + 0.20·mrv + 0.20·cob + 0.15·sdg
```

**(b) Issuer composite credibility** (per issuer, 0–100), deterministic mapping of categorical
labels to weights, then a weighted sum:

```
cdpW  = A:95 A-:85 B:72 B-:62 C:50 C-:40 D:28 else:10
sbtiW = 1.5C-Val:95  WB2C-Val:78  Committed:55  None:15
vcmiW = Platinum:95  Gold:85  Silver:70  Bronze:50  None:20
art6W = art6 ? 80 : 40
composite = 0.25·cdpW + 0.30·sbtiW + 0.15·vcmiW + 0.10·art6W + 0.20·icvcm
```

**(c) Derived aggregates:** CDP grade distribution; Scope-3 disclosure and reasonable-assurance
percentages (`avgDisc`, `avgVerif` — share of issuers with flags set); SBTi target seeds
(`baseY = 2018 + ⌊sr(i)·3⌋`, `tgtY = 2030 + ⌊sr(i+5)·10⌋`, reduction 46–56% for 1.5C-validated,
30–38% WB2C, 25–33% Committed — the 46% floor mirrors SBTi's 1.5 °C 2030 ambition); CDP score
trajectories (`trend = 0.45 + 0.45·icvcm/100 + 0.03·j·base + sr(hash+j)·0.08 − 0.04`); portfolio
exposure `exposureDollars = holdings × mcap/1000 × 0.05`.

### 7.2 Parameterisation & provenance

| Element | Values | Provenance |
|---|---|---|
| Quality weights 0.25/0.20/0.20/0.20/0.15 | additionality/permanence/MRV/co-benefits/SDG | Synthetic demo weights (no rating agency publishes these) |
| Permanence tiering by type | Engineered 90–98 > mixed 70–85 > NbS 50–70 | Directionally per ICVCM/Oxford Principles durability hierarchy; ranges synthetic |
| Composite weights 0.25/0.30/0.15/0.10/0.20 | CDP/SBTi/VCMI/Art6/ICVCM | Synthetic demo weights |
| `ISSUERS` 30 rows | MSFT CDP A · 1.5C-Val · VCMI Gold · icvcm 95, etc. | Real company names; grades plausible vs public CDP/SBTi lists but hand-entered; `icvcm` per-issuer score is a fiction (ICVCM labels credits/methodologies, not issuers) |
| `ICVCM_CCPS` 10 rows with `compliance` | 10 Core Carbon Principles | Real CCP names; compliance %s synthetic |
| `VCM_PROJECTS` 25 rows | standard, vintage, volume, price, ccp/corsia/icroa flags | Synthetic book with realistic attributes |
| `ARTICLE6_PILOTS` 12 rows | host, buyer, ITMOs, corresponding adjustment flag | Modeled on real 6.2 deals (e.g. Switzerland–Ghana style); values illustrative |

### 7.3 Calculation walkthrough

Filters (type/region/standard) subset `VCM_PROJECTS` → `filteredQuality` recomputes the mean
`overall` and a rating histogram (`AAA…C` from the seeded `rating` field, not from `overall` —
the two are independent, a notable internal inconsistency). The bridge tab sums compliance vs
voluntary flow volumes; the ICVCM tab renders the CCP radar from static `compliance` values; the
credibility tab ranks issuers by `composite` and decomposes the five weighted pillars per issuer.

### 7.4 Worked example (issuer composite — Microsoft seed row)

`cdp:'A', sbti:'1.5C-Val', vcmi:'Gold', art6:true, icvcm:95`:

| Pillar | Mapped score | Weight | Contribution |
|---|---|---|---|
| CDP | 95 | 0.25 | 23.75 |
| SBTi | 95 | 0.30 | 28.50 |
| VCMI | 85 | 0.15 | 12.75 |
| Article 6 | 80 | 0.10 | 8.00 |
| ICVCM | 95 | 0.20 | 19.00 |
| **Composite** | | | **92.0 / 100** |

### 7.5 Data provenance & limitations

- Every continuous sub-score uses the platform PRNG `sr(seed)=frac(sin(seed+1)×10⁴)` seeded by
  `hashStr` of real tickers/IDs — stable across renders, **not real assessments**. Categorical
  anchors (CDP grades, SBTi tiers) are hand-entered but resemble public registries.
- The quality `overall` and the displayed letter `rating` are decoupled; price/volume scatter
  bubbles size on the letter rating.
- Per-issuer "ICVCM score" misapplies the framework (ICVCM assesses *programs* and *methodology
  categories* for the CCP label; it does not score corporates).
- No backend calls; the mapped `/api/v1/carbon/*` routes are unused.

**Framework alignment:** ICVCM Core Carbon Principles — 10 principles in three pillars
(Governance / Emission Impact / Sustainable Development); in reality a program gets CCP-Eligible
status and methodology categories get CCP-Approved via multi-stakeholder assessment — the module
renders the 10 names with synthetic compliance % · VCMI Claims Code of Practice — Silver/Gold/
Platinum claims tied to % of remaining emissions covered by CCP-labelled credits after meeting
foundational criteria; code maps tiers to fixed 20–95 weights · CDP A–D− grading (real scheme;
mapping to 10–95 is the module's own) · SBTi validation tiers (real; 46% floor ≈ SBTi 1.5 °C
2030 pathway) · Paris Agreement Art. 6.2 ITMOs & corresponding adjustments (pilot table) ·
ICROA Code of Best Practice (endorsement flags).

## 8 · Model Specification — VCM Credit Quality Rating Engine

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Replace `sr()`-seeded sub-scores with an evidence-based project quality
rating usable for procurement screening and portfolio integrity KPIs, covering avoidance and
removal credits across major registries.

**8.2 Conceptual approach.** Reduced-form replication of commercial VCM rating methodologies:
BeZero Carbon Rating (likelihood a credit = 1 tCO₂e) and Sylvera's factor framework (carbon
accounting / additionality / permanence / co-benefits), calibrated on public registry data —
the same evidence base Calyx Global uses. Structured as a weighted factor model with explicit,
documented sub-indicators instead of random draws.

**8.3 Mathematical specification.**

```
Additionality A = 100·w_f·1{IRR_no-credit < hurdle} + 100·w_r·1{beyond regulation} + 100·w_c·(1 − penetration_sector)
                  (w_f,w_r,w_c = 0.5,0.3,0.2)
Permanence P    = 100 · exp(−λ_type · 100yr / D_type) · (1 + buffer%/b*)⁻¹ adj.
                  D_type: geological 10,000y, biochar 500y, ARR 100y, soil 50y (IPCC AR6 WG3 Ch.12)
Over-crediting O= 100 · min(1, baseline_conservativeness × (1 − leakage_rate))
MRV M           = rubric(monitoring frequency, direct measurement share, VVB accreditation)
Quality Q       = 0.30·A + 0.25·P + 0.25·O + 0.20·M ;  map Q→{AAA≥85, AA≥75, A≥65, BBB≥55, BB≥45, B≥35, C<35}
Price link      : expected premium = β·(Q − Q̄), β estimated from CCP-labelled vs unlabelled spreads
```

| Parameter | Calibration source |
|---|---|
| Buffer defaults b* by type | Verra VCS AFOLU non-permanence risk tool (10–40%, public) |
| Durability D_type, reversal λ | IPCC AR6 WG3 Ch.12; Verra/Puro registry documentation |
| Leakage & baseline priors | Published meta-analyses (e.g. West et al. 2023 REDD+ over-crediting; Guizar-Coutiño 2022) |
| Sector penetration (common practice) | CDM methodological tool 24 thresholds |
| Registry project data | Verra registry export (already ingested — Verra table in platform `reference_data`), Gold Standard registry CSV |

**8.4 Data requirements.** Project PDD attributes (methodology, vintage, buffer %, VVB),
issuance/retirement history, credit prices (Ecosystem Marketplace seed data already in the
platform's 37 seed files). Existing engine `carbon_credit_quality_engine.py` is the natural
backend home.

**8.5 Validation & benchmarking.** Rank-correlate Q against published BeZero/Sylvera grades for
overlapping projects (target Spearman ρ ≥ 0.6); confusion matrix vs CCP-label decisions;
sensitivity: ±20% on leakage priors must not shift >1 rating notch for >10% of book.

**8.6 Limitations & model risk.** Public registry data lack the site-level evidence raters use —
scores are coarser; additionality is fundamentally counterfactual (irreducible uncertainty —
publish confidence tiers); price-premium β is regime-dependent post-2023 integrity repricing.
Fallback: floor unrated/insufficient-evidence projects at "B" and exclude from high-integrity
portfolio KPIs.

## 9 · Future Evolution

### 9.1 Evolution A — Real registry projects and quality ratings replacing seeded scores (analytics ladder: rung 1 → 3)

**What.** This is a rich VCM taxonomy/procurement page (20 tabs: registries, ICVCM CCPs, VCMI claims, Article 6 pilots, ICROA standards, MACC measures, offtake terms, permanence hazards) with a real multi-factor credit-quality composite (`overall = 0.25×add + 0.2×perm + 0.2×mrv + 0.2×cob + 0.15×sdg`). But every sub-score is seeded: `addScore`, `permScore`, `mrv`, `cob`, `sdg` are `sr(hash)`-driven bands keyed off project type and flags, and the 30 issuers / 25 VCM projects are synthetic. The CDP scores and SBTi targets are also PRNG trajectories. Its structure (permanence by removal type, CCP compliance, rating-provider comparison) is genuinely useful; the data is not real. Evolution A grounds it.

**How.** (1) Real VCM projects from registry data (Verra/Gold Standard/ACR/CAR public listings): actual methodology, vintage, volume, standard per project. (2) Quality ratings from the real providers the module names — BeZero, Sylvera, Calyx Global — where licensable, or a clearly-labelled proxy; the current seeded `sylveraScore`-equivalents must not masquerade as real ratings. (3) ICVCM CCP compliance and CORSIA/ICROA eligibility from the actual assessment lists rather than seeded flags. (4) Issuer CDP scores and SBTi targets from the public CDP/SBTi databases. (5) Rung 3: the composite quality score calibrated so its factor weights reflect observed price/quality relationships. As a backend vertical, a dedicated taxonomy route.

**Prerequisites.** Registry project data (public); rating-provider data licensing (the constraint — BeZero/Sylvera are commercial); CDP/SBTi databases (public). **Acceptance:** projects derive from real registries; quality ratings are real or explicitly proxied; CCP/CORSIA/ICROA eligibility matches official lists; issuer CDP/SBTi data is sourced.

### 9.2 Evolution B — Carbon-credit procurement copilot (LLM tier 2)

**What.** Procurement officers ask "shortlist high-integrity removal credits under $50/t with a BeZero A rating", "does this credit meet ICVCM CCP requirements?", "compare Sylvera vs Calyx ratings for these projects", "generate our offset procurement compliance report" — the copilot runs the Evolution-A screening and quality tools, ranks credits, and drafts the procurement policy report, every score and eligibility verdict tool-traced.

**How.** Tool schemas over the Evolution-A project/quality/eligibility routes; grounding corpus is this Atlas record plus the ICVCM CCP / VCMI / ICROA / CORSIA reference structures the page carries. The copilot's honesty duty is paramount in this market: it presents quality ratings as the provider assessed them (never asserting integrity beyond the rating), reports permanence honestly by removal type (a REDD+ avoidance credit is not a durable removal), and flags avoidance-vs-removal explicitly since conflating them is the core VCM integrity failure. Procurement reports compose into the report layer.

**Prerequisites (hard).** Evolution A's real ratings and projects — a procurement copilot ranking credits by seeded quality scores would drive real buying decisions on fabricated integrity data. **Acceptance:** every quality score, rating, and eligibility verdict traces to a tool response; avoidance vs removal is distinguished on every credit; ratings are attributed to their provider with no LLM-inflated integrity claims.